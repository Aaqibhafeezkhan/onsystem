import fs from 'node:fs';
import path from 'node:path';

import type { AskFinishEvent } from 'ondocs/server';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { GET as askStatusRoute, POST as askRoute } from '@/app/api/ask/route';
import { DELETE as mcpDelete, GET as mcpGet, POST as mcpRoute } from '@/app/api/mcp/route';
import BenchmarkPage from '@/app/benchmark/page';
import PlaygroundPage from '@/app/playground/page';
import { AskButton, askStatus, resetAskStatus } from '@/components/ask';
import { SiteAskDialog } from '@/components/ask-dialog';
import { DocsForAgents } from '@/components/docs-for-agents';
import { slug } from '@/components/markdown-blocks';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import index from '@/generated/ask-index.json';
import { ASK_BUDGET, askCount, askEnabled, MCP_TOOLS } from '@/lib/ask';
import { corpus, ruleCatalog } from '@/lib/data';
import { DOCS_MCP } from '@/lib/docs-mcp';
import { faqEntries } from '@/lib/faq';
import { llmsTxt } from '@/lib/llms';
import { DOCS_FILES, SITE_URL } from '@/lib/site';

vi.mock('next/navigation', () => ({ usePathname: () => '/docs', useRouter: () => ({}) }));

// The counters' log lines (lib/ask.ts), kept out of the test output.
let info: MockInstance<typeof console.info>;
beforeEach(() => {
  info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetAskStatus();
});

/** The counter lines logged so far, parsed. */
function counted(): unknown[] {
  return info.mock.calls.map(([line]) => JSON.parse(String(line)) as unknown);
}

// ─── The index ──────────────────────────────────────────────────────────────

describe('the docs index', () => {
  it('holds every docs page, the FAQ, every rule, the benchmark and the playground', () => {
    const urls = index.documents.map((doc) => doc.url).sort();
    expect(urls).toEqual(
      [
        ...Object.values(DOCS_FILES),
        '/docs/faq',
        ...ruleCatalog.rules.map((rule) => `/rules/${rule.id}`),
        '/benchmark',
        '/playground',
      ].sort(),
    );
  });

  it('cites the benchmark and the playground by the ids their pages give their sections', () => {
    const anchors = (url: string) => {
      const doc = index.documents.findIndex((d) => d.url === url);
      return [...new Set(index.chunks.filter((c) => c.doc === doc).map((c) => c.anchor))];
    };
    const benchmark = anchors('/benchmark');
    expect(benchmark).toEqual(
      expect.arrayContaining(['results', 'labels', 'method', 'threats', 'reproduce']),
    );
    const benchmarkPage = renderToStaticMarkup(createElement(BenchmarkPage));
    for (const anchor of benchmark.filter(Boolean)) {
      expect(benchmarkPage, anchor).toContain(`<section id="${String(anchor)}"`);
    }
    const playground = anchors('/playground');
    expect(playground).toContain('demo-ds-title');
    const playgroundPage = renderToStaticMarkup(createElement(PlaygroundPage));
    for (const anchor of playground.filter(Boolean)) {
      expect(playgroundPage, anchor).toContain(` id="${String(anchor)}"`);
    }
  });

  it('leaves out the docs renderer’s markers, as the pages’ Markdown does', () => {
    for (const chunk of index.chunks) {
      expect(chunk.text, chunk.id).not.toMatch(/^```\w+ pm$/m);
      expect(chunk.text, chunk.id).not.toContain('<!-- steps -->');
    }
    const ci = index.chunks.find((c) => c.text.includes('npm install --save-dev onsystem'));
    expect(ci?.text).toContain('```sh\nnpm install --save-dev onsystem');
  });

  it('cites each FAQ question by the anchor the FAQ page gives it', () => {
    const faq = index.documents.findIndex((doc) => doc.url === '/docs/faq');
    expect(index.documents[faq]?.title).toBe('FAQ');
    const anchors = index.chunks.filter((c) => c.doc === faq).map((c) => c.anchor);
    expect(anchors).toEqual(faqEntries(corpus).map(([question]) => slug(question)));
  });

  it('is keyword-only, so building and searching it calls no model', () => {
    expect(index.embedding).toBeNull();
  });

  it('cites sections by the anchors the pages give their headings', () => {
    const ci = index.documents.findIndex((doc) => doc.url === '/docs/ci');
    const anchors = index.chunks.filter((c) => c.doc === ci).map((c) => c.anchor);
    expect(anchors).toContain('adopting-it-in-an-existing-codebase');
    expect(anchors).toContain('code-scanning-and-other-sarif-tools');
  });
});

// ─── /api/mcp ───────────────────────────────────────────────────────────────

let id = 0;

interface RpcResult {
  protocolVersion?: string;
  capabilities?: { tools?: unknown };
  serverInfo?: { name: string; title?: string };
  tools?: { name: string }[];
  isError?: boolean;
  structuredContent?: unknown;
  _meta?: Record<string, unknown>;
}

/** One JSON-RPC call to the MCP route; the answer is JSON, or one server-sent event. */
async function rpc(
  method: string,
  params: Record<string, unknown> = {},
  headers: Record<string, string> = { 'mcp-protocol-version': '2025-06-18' },
) {
  const response = await mcpRoute(
    new Request(`${SITE_URL}/api/mcp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'x-forwarded-for': '203.0.113.7',
        ...headers,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
    }),
  );
  const text = await response.text();
  const json = text.trimStart().startsWith('{') ? text : (/^data: (.*)$/m.exec(text)?.[1] ?? '');
  return {
    status: response.status,
    body: JSON.parse(json) as { result: RpcResult; error?: { code: number; message: string } },
  };
}

/** A 2026-07-28 request: no initialize, and the version and the client in every `_meta`. */
function modern(method: string, params: Record<string, unknown> = {}, client = 'claude-code') {
  return rpc(
    method,
    {
      ...params,
      _meta: {
        'io.modelcontextprotocol/protocolVersion': '2026-07-28',
        'io.modelcontextprotocol/clientCapabilities': {},
        'io.modelcontextprotocol/clientInfo': { name: client, version: '2.0.0' },
      },
    },
    {
      'mcp-protocol-version': '2026-07-28',
      'mcp-method': method,
      ...(typeof params.name === 'string' ? { 'mcp-name': params.name } : {}),
    },
  );
}

describe('/api/mcp', () => {
  it('answers initialize as the onsystem docs, by the name the site tells agents to add', async () => {
    const { status, body } = await rpc('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0.0' },
    });
    expect(status).toBe(200);
    expect(body.result.protocolVersion).toBe('2025-06-18');
    expect(body.result.capabilities?.tools).toBeDefined();
    // Not "ondocs": onsystem's own MCP server checks code, and clients list servers by this name.
    expect(body.result.serverInfo).toMatchObject({
      name: 'onsystem-docs',
      title: 'Search the onsystem docs',
    });
    expect(body.result.serverInfo?.name).toBe(DOCS_MCP.name);
  });

  it('names itself onsystem-docs on MCP 2026-07-28 too', async () => {
    const { status, body } = await modern('server/discover');
    expect(status).toBe(200);
    expect(body.result._meta?.['io.modelcontextprotocol/serverInfo']).toMatchObject({
      name: 'onsystem-docs',
    });
  });

  it('logs a counter line for each connection and tool call, with the client’s name', async () => {
    await rpc('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'cursor-vscode', version: '1.0.0' },
    });
    await rpc('tools/list');
    await rpc('tools/call', { name: 'search', arguments: { query: 'baseline' } });
    await modern('tools/call', { name: 'fetch', arguments: { id: '/docs/ci' } });
    expect(counted()).toEqual([
      { counter: 'mcp', method: 'initialize', tool: null, client: 'cursor-vscode', status: 200 },
      // A 2025 tool call does not say which client sent it; its initialize did.
      { counter: 'mcp', method: 'tools/call', tool: 'search', client: null, status: 200 },
      { counter: 'mcp', method: 'tools/call', tool: 'fetch', client: 'claude-code', status: 200 },
    ]);
    // What the agent searched for and read stays out of the logs.
    expect(JSON.stringify(info.mock.calls)).not.toContain('baseline');
  });

  it('counts the tool calls it turns away, with their 429', async () => {
    const headers = { 'mcp-protocol-version': '2025-06-18', 'x-forwarded-for': '203.0.113.9' };
    const statuses: number[] = [];
    for (let call = 0; call < 31; call++) {
      statuses.push(
        (await rpc('tools/call', { name: 'list_pages', arguments: {} }, headers)).status,
      );
    }
    expect(statuses.filter((status) => status === 200)).toHaveLength(30);
    expect(statuses.at(-1)).toBe(429);
    expect(counted().at(-1)).toEqual({
      counter: 'mcp',
      method: 'tools/call',
      tool: 'list_pages',
      client: null,
      status: 429,
    });
  });

  it('counts no call to a tool it does not have, and logs none of the name', async () => {
    const long = 'x'.repeat(20_000);
    const personal = 'how do I reset my password for jane@example.com';
    const answers = [
      await rpc('tools/call', { name: long, arguments: {} }),
      await rpc('tools/call', { name: personal, arguments: {} }),
      await modern('tools/call', { name: personal, arguments: {} }),
      await rpc('tools/call', { name: 42, arguments: {} }),
    ];
    // ondocs answers each with a JSON-RPC error in a 200, before its rate limit, and runs nothing.
    for (const { status, body } of answers) {
      expect(status).toBe(200);
      expect(body.error?.message).toMatch(/^Unknown tool/);
    }
    expect(counted()).toEqual([]);
    const logged = JSON.stringify(info.mock.calls);
    expect(logged).not.toContain('xxxxxxxx');
    expect(logged).not.toContain('jane@example.com');
  });

  it('counts no tool call whose arguments are not an object, which runs nothing', async () => {
    const { status, body } = await rpc('tools/call', { name: 'search', arguments: 'baseline' });
    expect(status).toBe(200);
    expect(body.result.isError).toBe(true);
    expect(counted()).toEqual([]);
    // ondocs reads a null `arguments` as {}, and runs the tool.
    await rpc('tools/call', { name: 'list_pages', arguments: null });
    expect(counted()).toEqual([
      { counter: 'mcp', method: 'tools/call', tool: 'list_pages', client: null, status: 200 },
    ]);
  });

  it('counts no connection it answers with an error', async () => {
    // server/discover without MCP 2026-07-28's _meta is a method ondocs does not have.
    const { status, body } = await rpc('server/discover', {
      clientInfo: { name: 'test', version: '1.0.0' },
    });
    expect(status).toBe(200);
    expect(body.error?.message).toMatch(/^Method not found/);
    expect(counted()).toEqual([]);
  });

  it('lists search, fetch and list_pages, the only tool names it counts', async () => {
    const { body } = await rpc('tools/list');
    const names = (body.result.tools ?? []).map((tool) => tool.name);
    expect(names).toEqual(expect.arrayContaining(['search', 'fetch', 'list_pages']));
    // A tool a new ondocs adds is counted once it is in MCP_TOOLS too.
    expect(new Set(names)).toEqual(MCP_TOOLS);
  });

  it('finds the baseline section when searched for it', async () => {
    const { body } = await rpc('tools/call', {
      name: 'search',
      arguments: { query: 'adopt in an existing codebase with a baseline' },
    });
    expect(body.result.isError).toBeFalsy();
    const text = JSON.stringify(body.result);
    expect(text).toContain(`${SITE_URL}/docs/ci#adopting-it-in-an-existing-codebase`);
  });

  it('lists the benchmark and the playground among its pages', async () => {
    const { body } = await rpc('tools/call', { name: 'list_pages', arguments: {} });
    expect(body.result.isError).toBeFalsy();
    const text = JSON.stringify(body.result);
    expect(text).toContain(`${SITE_URL}/benchmark`);
    expect(text).toContain(`${SITE_URL}/playground`);
  });

  it('finds the benchmark’s headline and caveats when asked whether onsystem helps', async () => {
    const search = async (query: string) => {
      const { body } = await rpc('tools/call', { name: 'search', arguments: { query } });
      expect(body.result.isError).toBeFalsy();
      return JSON.stringify(body.result);
    };
    // Before, the best answer was a rule page's one line about the benchmark, with no numbers.
    const helps = await search('does onsystem reduce design system violations by coding agents');
    expect(helps).toContain(`${SITE_URL}/benchmark`);
    expect(helps).toContain('went from 0.85 to 0.00');
    const caveats = await search('who labelled the benchmark and what are its threats to validity');
    expect(caveats).toContain(`${SITE_URL}/benchmark#`);
    expect(caveats).toContain('AI reviewer');
    // The skeptical question about the labels table's hook and all rows finds what the page says
    // next to them: in the hit that shows those rows, and in the section an agent fetches.
    const scope = 'These labels are too few to confirm the headline either way.';
    const labelsHit = async (query: string) => {
      const { body } = await rpc('tools/call', { name: 'search', arguments: { query } });
      const { results } = body.result.structuredContent as {
        results: { id: string; text: string }[];
      };
      const hit = results.find((r) => r.id === '/benchmark#labels');
      expect(hit, query).toBeDefined();
      return hit?.text ?? '';
    };
    const agree = await labelsHit('do the blind labels agree with onsystem’s count');
    expect(agree).toContain('| `all` |');
    expect(agree).toContain(scope);
    await labelsHit('why do the hook and all arms have more violations in the blind labels');
    const { body } = await rpc('tools/call', {
      name: 'fetch',
      arguments: { id: '/benchmark#labels' },
    });
    const section = (body.result.structuredContent as { text: string }).text;
    expect(section.indexOf(scope)).toBeGreaterThan(section.indexOf('| `all` |'));
    expect(section.indexOf('| `all` |')).toBeGreaterThan(0);
  });

  it('answers GET and DELETE as a stateless server does', async () => {
    const request = () => new Request(`${SITE_URL}/api/mcp`);
    expect((await mcpGet(request())).status).toBe(405);
    expect((await mcpDelete(new Request(`${SITE_URL}/api/mcp`, { method: 'DELETE' }))).status).toBe(
      405,
    );
  });
});

// ─── /api/ask ───────────────────────────────────────────────────────────────

const question = () =>
  new Request(`${SITE_URL}/api/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.8' },
    body: JSON.stringify({ question: 'How do I install it?' }),
  });

describe('/api/ask', () => {
  it('is off without OPENAI_API_KEY: GET says so, and a question gets a 404', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    expect(askEnabled()).toBe(false);
    expect(await askStatusRoute().json()).toEqual({ ask: false });
    const response = await askRoute(question());
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: 'not_configured' } });
  });

  it('is on with a key, read at the time of the request', () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    expect(askEnabled()).toBe(true);
    const response = askStatusRoute();
    expect(response.headers.get('cache-control')).toContain('s-maxage=300');
    vi.stubEnv('OPENAI_API_KEY', '   ');
    expect(askEnabled()).toBe(false);
  });

  it('never puts the key in what it returns', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-secret');
    expect(JSON.stringify(await askStatusRoute().json())).not.toContain('sk-test-secret');
  });

  it('protects the endpoint as ondocs.vercel.app does', () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, '../lib/ask.ts'), 'utf8');
    expect(source).toContain('memoryRateLimit({ limit: 5, windowMs: 60_000 })');
    expect(source).toContain('budget: ASK_BUDGET');
    expect(source).toContain('memoryRateLimit({ limit: 30, windowMs: 60_000 })');
    expect(source).toContain('budget: { requestsPerDay: 20_000 }');
  });

  it('allows 1,500 questions and 5M tokens a day for launch week (D-10)', () => {
    expect(ASK_BUDGET).toMatchObject({ requestsPerDay: 1_500, tokensPerDay: 5_000_000 });
    // An answer spends about 3k tokens, prompt and sources included, so the token cap must leave
    // more than that for each question, or it runs out before the question cap.
    expect(ASK_BUDGET.tokensPerDay / ASK_BUDGET.requestsPerDay).toBeGreaterThan(3_000);
  });

  it('points to the docs and their MCP server once the day’s budget is spent', () => {
    expect(ASK_BUDGET.message).toContain(`${SITE_URL}/docs`);
    expect(ASK_BUDGET.message).toContain(DOCS_MCP.url);
  });

  it('logs a counter line for each answer it streams, and not the question', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    // Nothing in the docs matches, so ondocs says it does not know, without a model call.
    const model = vi.fn(() => Promise.reject(new Error('No model calls in tests.')));
    vi.stubGlobal('fetch', model);
    const unanswerable = () =>
      askRoute(
        new Request(`${SITE_URL}/api/ask`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
          body: JSON.stringify({ question: 'Does plugh frobnicate the xyzzy?' }),
        }),
      );
    for (let asked = 0; asked < 2; asked++) {
      const response = await unanswerable();
      expect(response.status).toBe(200);
      await response.text();
    }
    expect(model).not.toHaveBeenCalled();
    expect(counted()).toEqual([
      { counter: 'ask', cached: false, refused: true, lowConfidence: false, tokens: 0 },
      // Asked again, it is answered from memory.
      { counter: 'ask', cached: true, refused: true, lowConfidence: false, tokens: 0 },
    ]);
    expect(JSON.stringify(info.mock.calls)).not.toContain('xyzzy');
  });

  it('counts the tokens an answer and its follow-up spent, and leaves out the question', () => {
    const answer = {
      id: 'a1',
      question: 'How do I install it?',
      answer: 'Run npx onsystem init [1].',
      sources: [],
      refused: false,
      lowConfidence: false,
      cached: false,
      usage: { inputTokens: 2_400, outputTokens: 300, totalTokens: 2_700 },
      followUp: { question: 'and on CI?', usage: { totalTokens: 150 } },
    } as unknown as AskFinishEvent;
    expect(askCount(answer)).toEqual({
      counter: 'ask',
      cached: false,
      refused: false,
      lowConfidence: false,
      tokens: 2_850,
    });
    expect(askCount({ ...answer, cached: true, usage: undefined, followUp: undefined })).toEqual({
      counter: 'ask',
      cached: true,
      refused: false,
      lowConfidence: false,
      tokens: 0,
    });
    expect(JSON.stringify(askCount(answer))).not.toContain('install');
  });
});

// ─── The Ask dialog ─────────────────────────────────────────────────────────

describe('the Ask dialog', () => {
  it('says that ondocs answers the questions and serves the docs over MCP', () => {
    const dialog = SiteAskDialog({
      open: true,
      onOpenChange: () => undefined,
      theme: 'dark',
    }) as ReactElement<{ footer?: ReactNode }>;
    const footer = renderToStaticMarkup(dialog.props.footer);
    expect(footer).toContain('Answers and docs MCP by <a');
    expect(footer).toContain('href="https://ondocs.vercel.app"');
    expect(footer).toMatch(/>ondocs<\/a>/);
    // ondocs's own footer, which this one replaces: the warning and the keys.
    expect(footer).toContain('check the sources');
    expect(footer).toContain('class="ask-footer"');
    expect(footer).toMatch(/<span class="ask-footer-keys" aria-hidden="true">.*esc.*close/);
  });
});

// ─── The Ask button ─────────────────────────────────────────────────────────

describe('the Ask button', () => {
  it('is not in the header the server renders', () => {
    const html = renderToStaticMarkup(createElement(SiteHeader));
    expect(html).not.toContain('Ask the docs');
    expect(renderToStaticMarkup(createElement(AskButton))).toBe('');
  });

  it('stays hidden when /api/ask says Ask is off, or cannot be reached', async () => {
    vi.stubGlobal('sessionStorage', undefined);
    const off = vi.fn(() => Promise.resolve(Response.json({ ask: false })));
    expect(await askStatus(off)).toBe(false);
    expect(off).toHaveBeenCalledWith('/api/ask', expect.anything());
    resetAskStatus();
    expect(await askStatus(() => Promise.reject(new Error('offline')))).toBe(false);
    resetAskStatus();
    expect(await askStatus(() => Promise.resolve(new Response('nope', { status: 500 })))).toBe(
      false,
    );
  });

  it('shows when /api/ask says Ask is on', async () => {
    vi.stubGlobal('sessionStorage', undefined);
    expect(await askStatus(() => Promise.resolve(Response.json({ ask: true })))).toBe(true);
  });
});

// ─── Telling agents ─────────────────────────────────────────────────────────

describe('the docs for agents', () => {
  it('gives the MCP URL, the install links and the Claude Code command', () => {
    const html = renderToStaticMarkup(createElement(DocsForAgents));
    expect(html).toContain(`${SITE_URL}/api/mcp`);
    expect(DOCS_MCP.cursor).toMatch(
      /^https:\/\/cursor\.com\/en\/install-mcp\?name=onsystem-docs&config=/,
    );
    const config = decodeURIComponent(new URL(DOCS_MCP.cursor).searchParams.get('config') ?? '');
    expect(JSON.parse(Buffer.from(config, 'base64').toString('utf8'))).toEqual({
      url: `${SITE_URL}/api/mcp`,
    });
    expect(DOCS_MCP.vscode).toMatch(/^https:\/\/insiders\.vscode\.dev\/redirect\/mcp\/install\?/);
    expect(html).toContain(DOCS_MCP.claude.replace(/&/g, '&amp;'));
    expect(DOCS_MCP.claudeCode).toBe(
      `claude mcp add --transport http onsystem-docs ${SITE_URL}/api/mcp`,
    );
    expect(html).toContain('href="/llms.txt"');
    expect(html).toContain('href="/llms-full.txt"');
  });

  it('is a section of /docs/clients, in "On this page", where the footer links', () => {
    const html = renderToStaticMarkup(createElement(DocsForAgents));
    expect(html).toMatch(
      /<h2 id="search-these-docs-from-your-agent" data-toc="Optional: search these docs from your agent" data-level="2" class="[^"]*scroll-mt-28[^"]*lg:scroll-mt-20/,
    );
    const footer = renderToStaticMarkup(createElement(SiteFooter));
    expect(footer).toContain('href="/docs/clients#search-these-docs-from-your-agent"');
  });

  it('lists the MCP endpoint in llms.txt', () => {
    expect(llmsTxt()).toContain(`(${SITE_URL}/api/mcp)`);
  });
});
