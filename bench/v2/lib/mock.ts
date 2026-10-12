// The offline mock model: a scripted agent behind the same Provider interface as the real APIs,
// so `run --matrix mock` drives the whole pipeline (workspace copy, tools, the real MCP server
// and hook, tsc, onsystem check, aggregation) without a network or a key. It is not a model of
// any real agent's quality; its numbers only show that every stage runs and is wired up.
//
// What it does, from the conversation alone (it keeps no state, like an API):
// 1. loads the skill when `load_skill` is offered, and looks the component up when the MCP
//    tools are offered;
// 2. lists the target folder and searches for the component, like an agent exploring;
// 3. writes the file, with a hardcoded color and an invented variant drawn at random, less
//    often when it read the skill or the MCP tools;
// 4. rewrites it without them when a tool result carries hook or check_ui errors;
// 5. stops.
// Token usage is the request's characters / 4, the prefix it shares with the previous request
// counted as cache reads.

import type { Message, Provider, ToolCall, Turn, TurnRequest } from './providers.js';

export interface MockControl {
  /** Import line(s) for the component the mock uses. */
  import: string;
  component: string;
  /** JSX that uses the component correctly. */
  valid: string;
  /** JSX with a variant the component does not have. */
  invalid: string;
}

export interface MockOptions {
  model: string;
  control: MockControl;
  /** Different seeds give different draws; the run id is a good one. */
  seed: number;
}

const HOOK_ERROR = /breaks the project's design system|error \[no-/;

export function createMockProvider(options: MockOptions): Provider {
  return {
    name: 'mock',
    model: options.model,
    turn: (request: TurnRequest) => Promise.resolve(mockTurn(request, options)),
  };
}

export function mockTurn(request: TurnRequest, options: MockOptions): Turn {
  const offered = new Set(request.tools.map((t) => t.name));
  const calls = request.messages.flatMap((m) => (m.role === 'assistant' ? m.toolCalls : []));
  const called = (name: string) => calls.some((c) => c.name === name);
  const first = request.messages.find((m) => m.role === 'user');
  const task = /Create (\S+) exporting (\w+)/.exec(first?.role === 'user' ? first.text : '');
  const target = task?.[1] ?? 'components/mock-output.tsx';
  const name = task?.[2] ?? 'MockOutput';
  const folder = target.includes('/') ? target.slice(0, target.lastIndexOf('/')) : '.';
  const mcp = (tool: string) => [...offered].find((t) => t.endsWith(`__${tool}`));
  const n = calls.length;
  const id = (suffix: string) => `mock_${n}_${suffix}`;
  const call = (toolName: string, input: Record<string, unknown>): Turn =>
    respond(request, `Calling ${toolName}.`, [{ id: id(toolName), name: toolName, input }]);

  if (offered.has('load_skill') && !called('load_skill'))
    return call('load_skill', { name: 'onsystem' });
  const getComponent = mcp('get_component');
  if (getComponent && !called(getComponent)) {
    return call(getComponent, { name: options.control.component, path: target });
  }
  if (!called('list_files'))
    return call('list_files', { path: folder === '.' ? '.' : folder, depth: 1 });
  if (!called('search_files')) {
    return call('search_files', {
      pattern: `export (function|const) ${options.control.component}\\b`,
      glob: '*.tsx',
    });
  }

  const writes = calls.filter((c) => c.name === 'write_file');
  const lastResult = [...request.messages].reverse().find((m) => m.role === 'tool');
  const flagged =
    lastResult?.role === 'tool' && lastResult.results.some((r) => HOOK_ERROR.test(r.output));
  if (!writes.length) {
    const draw = random(options.seed);
    const careful = (called('load_skill') ? 0.6 : 1) * (getComponent ? 0.4 : 1);
    const color = draw() < 0.5 * careful;
    const variant = draw() < 0.35 * careful;
    return call('write_file', {
      path: target,
      content: component(name, options.control, { color, variant }),
    });
  }
  if (flagged && writes.length < 3) {
    return call('write_file', {
      path: target,
      content: component(name, options.control, { color: false, variant: false }),
    });
  }
  const checkUi = mcp('check_ui');
  const checked = calls.filter((c) => c.name === checkUi).length;
  if (checkUi && checked < writes.length) return call(checkUi, { path: target });
  return respond(request, `Created ${target}.`, []);
}

function component(
  name: string,
  control: MockControl,
  flaws: { color: boolean; variant: boolean },
): string {
  const surface = flaws.color ? 'bg-[#f5f5f5] text-[#d00000]' : 'bg-muted text-muted-foreground';
  return `${control.import}

export function ${name}() {
  return (
    <div className="flex items-center gap-2 rounded-md p-4 ${surface}">
      <p className="text-sm">${name}</p>
      ${flaws.variant ? control.invalid : control.valid}
    </div>
  );
}
`;
}

function respond(request: TurnRequest, text: string, toolCalls: ToolCall[]): Turn {
  const promptChars =
    chars(request.system) +
    JSON.stringify(request.tools).length +
    request.messages.reduce((a, m) => a + size(m), 0);
  // The previous request was everything up to (not including) the last two messages: the model's
  // last turn and the tool results that answered it. That prefix is what a cache would hold.
  const previous = request.messages.slice(0, -2);
  const prefixChars =
    request.messages.length > 2
      ? chars(request.system) +
        JSON.stringify(request.tools).length +
        previous.reduce((a, m) => a + size(m), 0)
      : 0;
  const prompt = Math.ceil(promptChars / 4);
  const cached = Math.ceil(prefixChars / 4);
  const raw = { text, toolCalls };
  return {
    text,
    toolCalls,
    raw,
    usage: {
      input: 0,
      cacheRead: cached,
      cacheWrite: prompt - cached,
      output: Math.ceil(JSON.stringify(raw).length / 4) + 40,
    },
    stop: toolCalls.length ? 'tool_use' : 'end',
  };
}

const chars = (s: string) => s.length;

function size(m: Message): number {
  if (m.role === 'user') return m.text.length;
  if (m.role === 'assistant') return m.text.length + JSON.stringify(m.toolCalls).length;
  return m.results.reduce((a, r) => a + r.output.length, 0);
}

function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
