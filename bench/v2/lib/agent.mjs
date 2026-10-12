// The neutral agent loop: one loop for every provider, so the arms differ only in what onsystem
// adds. Each request sends the system prompt, the tools and the conversation; each tool call is
// run and answered; the loop ends when the model answers without a tool call, or at a limit.
//
// The hook arm runs the Claude Code plugin's own hook script (plugins/onsystem/hooks/check-ui.mjs)
// after every write or edit, with the PostToolUse input Claude Code gives it, and hands its
// output back the way Claude Code does: on exit 2 its stderr goes to the model with the tool
// result, on exit 0 its additionalContext is added as a note.
import { spawn } from 'node:child_process';

import { minimalEnv } from './mcp.mjs';
import { costOf } from './plan.ts';
import { LOAD_SKILL_TOOL } from './prompt.ts';
import { FILE_TOOLS, createFileTools } from './tools.ts';

/**
 * @typedef {import('./providers.ts').Provider} Provider
 * @typedef {import('./providers.ts').Message} Message
 * @typedef {import('./plan.ts').Price} Price
 * @typedef {import('./plan.ts').Budget} Budget
 */

/**
 * @param {{
 *   provider: Provider,
 *   price: Price,
 *   budget: Budget,
 *   root: string,
 *   system: string,
 *   prompt: string,
 *   skill?: { name: string, body: string },
 *   mcp?: Awaited<ReturnType<typeof import('./mcp.mjs').startOnsystemMcp>>,
 *   hook?: { script: string, cli: string, sessionId: string },
 *   maxCalls?: number,
 *   maxOutputTokens?: number,
 *   timeoutMs?: number,
 *   onEvent?: (event: Record<string, unknown>) => void,
 * }} options
 */
export async function runAgent(options) {
  const { provider, price, budget, root, system, prompt, skill, mcp, hook } = options;
  const maxCalls = options.maxCalls ?? 40;
  const onEvent = options.onEvent ?? (() => {});
  const files = createFileTools(root);
  const tools = [...FILE_TOOLS, ...(skill ? [LOAD_SKILL_TOOL] : []), ...(mcp?.tools ?? [])];
  /** @type {Message[]} */
  const messages = [{ role: 'user', text: prompt }];
  const totals = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
  const counts = {
    calls: 0,
    toolCalls: 0,
    hookBlocks: 0,
    hookNotes: 0,
    mcpCalls: 0,
    skillLoads: 0,
    toolErrors: 0,
  };
  let cost = 0;
  let status = 'max-calls';
  let detail = '';
  const deadline = AbortSignal.timeout(options.timeoutMs ?? 15 * 60_000);

  for (let call = 1; call <= maxCalls; call++) {
    if (budget.exceeded()) {
      status = 'aborted';
      detail = `spend cap of $${budget.cap} reached`;
      break;
    }
    if (deadline.aborted) {
      status = 'timeout';
      break;
    }
    let turn;
    try {
      turn = await provider.turn(
        { system, tools, messages, maxOutputTokens: options.maxOutputTokens ?? 16_000 },
        deadline,
      );
    } catch (error) {
      status = deadline.aborted ? 'timeout' : 'error';
      detail = error instanceof Error ? error.message : String(error);
      break;
    }
    const callCost = costOf(turn.usage, price);
    cost += callCost;
    budget.add(callCost);
    counts.calls = call;
    for (const k of /** @type {const} */ (['input', 'cacheRead', 'cacheWrite', 'output']))
      totals[k] += turn.usage[k];
    onEvent({
      type: 'turn',
      call,
      stop: turn.stop,
      usage: turn.usage,
      cost: callCost,
      text: turn.text,
      toolCalls: turn.toolCalls,
    });
    messages.push({ role: 'assistant', text: turn.text, toolCalls: turn.toolCalls, raw: turn.raw });
    if (turn.stop === 'refusal') {
      status = 'refusal';
      detail = turn.detail ?? '';
      break;
    }
    if (!turn.toolCalls.length) {
      status = 'done';
      if (turn.stop !== 'end') detail = turn.detail ?? turn.stop;
      break;
    }
    /** @type {import('./providers.ts').ToolResult[]} */
    const results = [];
    for (const toolCall of turn.toolCalls) {
      counts.toolCalls += 1;
      const outcome = await runTool(toolCall, { files, skill, mcp, counts });
      let output = outcome.output;
      if (hook && outcome.write && !outcome.isError) {
        const feedback = await runHook(hook, root, outcome.write);
        if (feedback?.block) {
          counts.hookBlocks += 1;
          output += `\n\nPostToolUse hook (onsystem) reported an error:\n${feedback.text}`;
        } else if (feedback) {
          counts.hookNotes += 1;
          output += `\n\nPostToolUse hook (onsystem) added context:\n${feedback.text}`;
        }
        onEvent({ type: 'hook', file: outcome.write.file, feedback });
      }
      if (outcome.isError) counts.toolErrors += 1;
      results.push({ id: toolCall.id, name: toolCall.name, output, isError: outcome.isError });
      onEvent({
        type: 'tool',
        name: toolCall.name,
        input: toolCall.input,
        output,
        isError: outcome.isError,
      });
    }
    messages.push({ role: 'tool', results });
  }
  return { status, detail, usage: totals, cost, ...counts };
}

/**
 * @param {import('./providers.ts').ToolCall} toolCall
 * @param {{ files: ReturnType<typeof createFileTools>, skill?: { name: string, body: string }, mcp?: { call: (name: string, input: Record<string, unknown>) => Promise<{ output: string, isError: boolean }> }, counts: Record<string, number> }} context
 * @returns {Promise<import('./tools.ts').ToolOutcome>}
 */
async function runTool(toolCall, { files, skill, mcp, counts }) {
  if ('__invalid' in toolCall.input) {
    return { output: 'The tool input was not valid JSON. Send the call again.', isError: true };
  }
  const fileOutcome = files(toolCall.name, toolCall.input);
  if (fileOutcome) return fileOutcome;
  if (toolCall.name === 'load_skill' && skill) {
    counts.skillLoads += 1;
    return toolCall.input.name === skill.name
      ? { output: skill.body, isError: false }
      : {
          output: `No skill named ${JSON.stringify(toolCall.input.name)}. Available: ${skill.name}.`,
          isError: true,
        };
  }
  if (mcp && mcp.tools.some((t) => t.name === toolCall.name)) {
    counts.mcpCalls += 1;
    return mcp.call(toolCall.name, toolCall.input);
  }
  return { output: `There is no tool named ${toolCall.name}.`, isError: true };
}

/**
 * Runs the plugin's hook script on one write, as Claude Code's PostToolUse would.
 * @param {{ script: string, cli: string, sessionId: string }} hook
 * @param {string} cwd
 * @param {import('./tools.ts').WriteEvent} write
 * @returns {Promise<{ block: boolean, text: string } | undefined>}
 */
export async function runHook(hook, cwd, write) {
  const input = {
    session_id: hook.sessionId,
    cwd,
    hook_event_name: 'PostToolUse',
    tool_name: write.kind,
    tool_input:
      write.kind === 'Write'
        ? { file_path: write.file, content: write.content }
        : { file_path: write.file, old_string: write.oldString, new_string: write.newString },
    tool_response: { filePath: write.file, success: true },
  };
  const result = await exec(process.execPath, [hook.script], {
    cwd,
    input: JSON.stringify(input),
    env: { ...minimalEnv(), ONSYSTEM_BIN: hook.cli },
    timeoutMs: 60_000,
  });
  if (result.status === 2) return { block: true, text: result.stderr.trim() };
  if (result.status === 0 && result.stdout.trim()) {
    try {
      const json = JSON.parse(result.stdout);
      const context = json?.hookSpecificOutput?.additionalContext;
      if (typeof context === 'string' && context) return { block: false, text: context };
    } catch {
      // Not JSON: Claude Code would not show it to the model either.
    }
  }
  return undefined;
}

/**
 * spawn as a promise, with stdin, a timeout and captured output. Never through a shell.
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd: string, input?: string, env?: Record<string, string>, timeoutMs?: number }} options
 * @returns {Promise<{ status: number | null, stdout: string, stderr: string, timedOut: boolean }>}
 */
export function exec(command, args, { cwd, input, env = minimalEnv(), timeoutMs = 300_000 }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.stdout.setEncoding('utf8').on('data', (d) => (stdout += d));
    child.stderr.setEncoding('utf8').on('data', (d) => (stderr += d));
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ status: null, stdout, stderr: stderr + error.message, timedOut });
    });
    child.on('close', (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr, timedOut });
    });
    child.stdin.on('error', () => {});
    child.stdin.end(input ?? '');
  });
}
