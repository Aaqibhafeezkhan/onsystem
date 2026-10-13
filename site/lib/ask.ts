import { createOpenAI } from '@ai-sdk/openai';
import { createAskHandler, createMcpHandler, memoryRateLimit } from 'ondocs/server';

import index from '@/generated/ask-index.json';
import { SITE_URL } from '@/lib/site';

/*
 * Ask and MCP over the docs, with ondocs, from the index scripts/generate.mjs builds. The two
 * endpoints use the protections ondocs.vercel.app uses. Only Ask spends a model key, so only Ask
 * needs one: without OPENAI_API_KEY it is off and the site shows no Ask button, while /api/mcp
 * answers either way.
 */

const SITE_NAME = 'the onsystem docs';

/** Whether this deployment has a model key for Ask; read on each request, never at build. */
export function askEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.OPENAI_API_KEY?.trim());
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
    // A daily cap for the whole site, so rotating IPs cannot run up the bill: 300 questions and
    // 1M model tokens a day, counted per instance. The hard cap is the spend limit on the
    // OpenAI project.
    budget: { requestsPerDay: 300, tokensPerDay: 1_000_000 },
    // Repeated questions are answered from memory, without a model call.
    answerCache: true,
  });
  return ask;
}

/**
 * The MCP endpoint: `search`, `fetch` and `list_pages` over the same index. Keyword-only, so
 * an agent's calls cost no model call; the agent brings its own model.
 */
export const mcpHandler: Handler = createMcpHandler({
  index,
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  // Agents search and read several times per task: 30 tool calls a minute per client IP.
  rateLimit: memoryRateLimit({ limit: 30, windowMs: 60_000 }),
  // A ceiling per instance and UTC day, against a fleet of IPs.
  budget: { requestsPerDay: 20_000 },
});
