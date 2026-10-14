import { createOpenAI } from '@ai-sdk/openai';
import {
  type AskFinishEvent,
  type BudgetOptions,
  createAskHandler,
  createMcpHandler,
  memoryRateLimit,
} from 'ondocs/server';

import index from '@/generated/ask-index.json';
import { DOCS_MCP } from '@/lib/docs-mcp';
import { SITE_URL } from '@/lib/site';

/*
 * Ask and MCP over the docs, with ondocs, from the index scripts/generate.mjs builds. The two
 * endpoints use the protections ondocs.vercel.app uses. Only Ask spends a model key, so only Ask
 * needs one: without OPENAI_API_KEY it is off and the site shows no Ask button, while /api/mcp
 * answers either way.
 *
 * Both log one JSON line per answer, connection and tool call ({"counter": "ask" | "mcp", …}), to
 * count them in the deployment's logs: what was asked or searched for stays out of them, and of
 * what an agent sends, only the name of one of the three tools and its client's name (cut to 100
 * characters) go in.
 */

const SITE_NAME = 'the onsystem docs';

/** Whether this deployment has a model key for Ask; read on each request, never at build. */
export function askEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.OPENAI_API_KEY?.trim());
}

/**
 * Ask's daily cap for the whole site, so rotating IPs cannot run up the bill, counted per
 * instance. Raised for launch week (D-10) from 300 questions and 1M model tokens: about 3,300
 * tokens a question, so the token cap does not run out first. Back to 300 and 1M after launch
 * week. The hard cap is the spend limit on the OpenAI project.
 */
export const ASK_BUDGET = {
  requestsPerDay: 1_500,
  tokensPerDay: 5_000_000,
  message: `Ask has answered all the questions it can today. The docs are at ${SITE_URL}/docs, and your agent can search them over MCP: ${DOCS_MCP.url}`,
} satisfies BudgetOptions;

/** The counter line for an answer: the tokens it spent, to size `tokensPerDay` from (D-10). */
export function askCount(event: AskFinishEvent) {
  return {
    counter: 'ask',
    cached: event.cached,
    refused: event.refused,
    lowConfidence: event.lowConfidence,
    tokens: (event.usage?.totalTokens ?? 0) + (event.followUp?.usage?.totalTokens ?? 0),
  };
}

type Handler = (request: Request) => Promise<Response>;
let ask: Handler | undefined;

/** The ask endpoint, made on the first question, once a key is known to be there. */
export function askHandler(): Handler {
  ask ??= createAskHandler({
    index,
    // The provider reads OPENAI_API_KEY itself, when it makes a call.
    model: createOpenAI()(process.env.OPENAI_CHAT_MODEL ?? 'gpt-5.4-mini'),
    siteName: SITE_NAME,
    // Five questions a minute per visitor: every answer is a paid model call. Keyed by the last
    // X-Forwarded-For entry, which Vercel sets.
    rateLimit: memoryRateLimit({ limit: 5, windowMs: 60_000 }),
    budget: ASK_BUDGET,
    // Repeated questions are answered from memory, without a model call.
    answerCache: true,
    onFinish: (event) => {
      console.info(JSON.stringify(askCount(event)));
    },
  });
  return ask;
}

const COUNTED = new Set(['initialize', 'server/discover', 'tools/call']);

/** The tools ondocs serves (its `tools/list`), the only tool names a counter line holds. */
export const MCP_TOOLS: ReadonlySet<string> = new Set(['search', 'fetch', 'list_pages']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

/**
 * The counter line for an MCP request: a connection (`initialize`, or `server/discover` on
 * 2026-07-28) or a tool call, with the client's `clientInfo.name`. MCP 2026-07-28 sends it with
 * every request; before it, only `initialize` does. Other requests are not counted.
 *
 * Nor is a call that names no tool of this server, or passes arguments that are not an object:
 * ondocs answers those with an error before its rate limit and runs nothing, so counting them
 * would log text anyone can send, as often as they like, as a tool call.
 */
function mcpCount(message: unknown, status: number) {
  const { method, params } = record(message);
  if (typeof method !== 'string' || !COUNTED.has(method)) return null;
  const { name, arguments: args, clientInfo, _meta } = record(params);
  let tool: string | null = null;
  if (method === 'tools/call') {
    if (typeof name !== 'string' || !MCP_TOOLS.has(name)) return null;
    // ondocs reads a missing or null `arguments` as {}.
    if (args !== undefined && args !== null && !isRecord(args)) return null;
    tool = name;
  }
  const client = record(clientInfo ?? record(_meta)['io.modelcontextprotocol/clientInfo']).name;
  return {
    counter: 'mcp',
    method,
    tool,
    client: typeof client === 'string' ? client.slice(0, 100) : null,
    status,
  };
}

/**
 * The MCP endpoint: `search`, `fetch` and `list_pages` over the same index. Keyword-only, so
 * an agent's calls cost no model call; the agent brings its own model.
 */
const docsMcp: Handler = createMcpHandler({
  index,
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  // The name the site tells agents to add it under (lib/docs-mcp.ts), apart from onsystem's own
  // server, which checks code. The default is "ondocs".
  name: DOCS_MCP.name,
  // Agents search and read several times per task: 30 tool calls a minute per client IP.
  rateLimit: memoryRateLimit({ limit: 30, windowMs: 60_000 }),
  // A ceiling per instance and UTC day, against a fleet of IPs.
  budget: { requestsPerDay: 20_000 },
});

/**
 * Whether ondocs answered a request with a JSON-RPC error in a 200 (a method or tool it does not
 * have) rather than a result. Its answers are JSON, already in memory.
 */
async function rpcErrorIn(response: Response): Promise<boolean> {
  if (response.status !== 200) return false;
  if (!response.headers.get('content-type')?.startsWith('application/json')) return false;
  return 'error' in record(await response.clone().json());
}

/**
 * The MCP endpoint, counting the connections it answered (200) and the calls to its tools that
 * it ran (200, the tool's result, or the error in it the agent reads) or turned away (429). A
 * 200 can also carry a JSON-RPC error instead of a result: those are not counted.
 */
export const mcpHandler: Handler = async (request) => {
  const copy = request.method === 'POST' ? request.clone() : undefined;
  const response = await docsMcp(request);
  // Either status means ondocs read the body and found it a JSON-RPC message under its size limit.
  if (copy && (response.status === 200 || response.status === 429)) {
    try {
      const line = mcpCount(JSON.parse(await copy.text()), response.status);
      if (line && !(await rpcErrorIn(response))) console.info(JSON.stringify(line));
    } catch {
      // Not counted.
    }
  }
  return response;
};
