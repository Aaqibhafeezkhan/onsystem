// The three model APIs behind bench/v2's agent loop, over plain HTTP: Anthropic Messages, OpenAI
// Responses and Gemini generateContent. Each adapter turns the loop's provider-neutral
// conversation into its API's request and the response back into text, tool calls and token
// usage. The model's own turns are kept verbatim (`raw`) and sent back unchanged, which the APIs
// require for thinking blocks, reasoning items and thought signatures.
//
// `fetch` is injected, so test/bench-v2.test.ts drives every adapter with recorded response
// shapes and no network. API keys come from the environment variable the provider names and
// are never printed: error messages have the key removed before they are thrown.

export interface ToolDef {
  name: string;
  description: string;
  /** JSON Schema of the input object. */
  schema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  name: string;
  output: string;
  isError: boolean;
}

export type Message =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; toolCalls: ToolCall[]; raw: unknown }
  | { role: 'tool'; results: ToolResult[] };

export interface TurnRequest {
  system: string;
  tools: ToolDef[];
  messages: Message[];
  maxOutputTokens: number;
}

export interface TokenUsage {
  /** Uncached input tokens. */
  input: number;
  cacheRead: number;
  cacheWrite: number;
  /** Output tokens, thinking and reasoning included (they are billed as output). */
  output: number;
}

export type Stop = 'tool_use' | 'end' | 'max_tokens' | 'refusal' | 'other';

export interface Turn {
  text: string;
  toolCalls: ToolCall[];
  raw: unknown;
  usage: TokenUsage;
  stop: Stop;
  detail?: string;
}

export interface Provider {
  name: string;
  model: string;
  turn(request: TurnRequest, signal?: AbortSignal): Promise<Turn>;
}

export type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export interface ProviderOptions {
  model: string;
  /** Anthropic `output_config.effort`, OpenAI `reasoning.effort`, Gemini `thinkingLevel`. */
  effort: string | null;
  keyEnv: string;
  endpoint: string;
  env: Record<string, string | undefined>;
  fetch: Fetch;
  /** Retries for 408/409/429/5xx and network errors. */
  retries?: number;
  /** Milliseconds per request before it is abandoned (and retried). */
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export class ProviderError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
  }
}

/** The key, read by name; throws (with the name, never a value) when it is not set. */
export function readKey(env: Record<string, string | undefined>, keyEnv: string): string {
  const key = env[keyEnv]?.trim();
  if (!key)
    throw new ProviderError(
      `${keyEnv} is not set. Export it in this shell; it is read from the environment only.`,
    );
  return key;
}

export function createProvider(kind: string, options: ProviderOptions): Provider {
  switch (kind) {
    case 'anthropic':
      return anthropic(options);
    case 'openai':
      return openai(options);
    case 'google':
      return gemini(options);
    default:
      throw new ProviderError(`No adapter for provider "${kind}".`);
  }
}

// ─── Anthropic Messages ───────────────────────────────────────────────────────

interface AnthropicBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

/** The request body: the system prompt carries a cache breakpoint, and top-level `cache_control` caches the growing conversation. */
export function anthropicBody(
  model: string,
  effort: string | null,
  request: TurnRequest,
): Record<string, unknown> {
  const messages: unknown[] = [];
  for (const m of request.messages) {
    if (m.role === 'user')
      messages.push({ role: 'user', content: [{ type: 'text', text: m.text }] });
    else if (m.role === 'assistant') messages.push({ role: 'assistant', content: m.raw });
    else {
      messages.push({
        role: 'user',
        content: m.results.map((r) => ({
          type: 'tool_result',
          tool_use_id: r.id,
          content: r.output,
          ...(r.isError ? { is_error: true } : {}),
        })),
      });
    }
  }
  return {
    model,
    max_tokens: request.maxOutputTokens,
    system: [{ type: 'text', text: request.system, cache_control: { type: 'ephemeral' } }],
    tools: request.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.schema,
    })),
    messages,
    cache_control: { type: 'ephemeral' },
    ...(effort ? { output_config: { effort } } : {}),
  };
}

export function anthropicTurn(json: Record<string, unknown>): Turn {
  const content = (Array.isArray(json.content) ? json.content : []) as AnthropicBlock[];
  const u = (json.usage ?? {}) as Record<string, number | undefined>;
  const toolCalls = content
    .filter((b) => b.type === 'tool_use')
    .map((b) => ({ id: String(b.id), name: String(b.name), input: b.input ?? {} }));
  const reason = json.stop_reason;
  const stop: Stop =
    reason === 'tool_use'
      ? 'tool_use'
      : reason === 'end_turn' || reason === 'stop_sequence'
        ? toolCalls.length
          ? 'tool_use'
          : 'end'
        : reason === 'max_tokens'
          ? 'max_tokens'
          : reason === 'refusal'
            ? 'refusal'
            : 'other';
  return {
    text: content
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join(''),
    toolCalls,
    raw: content,
    usage: {
      input: u.input_tokens ?? 0,
      cacheRead: u.cache_read_input_tokens ?? 0,
      cacheWrite: u.cache_creation_input_tokens ?? 0,
      output: u.output_tokens ?? 0,
    },
    stop,
    ...(stop === 'other' ? { detail: `stop_reason ${String(reason)}` } : {}),
  };
}

function anthropic(options: ProviderOptions): Provider {
  const key = readKey(options.env, options.keyEnv);
  return {
    name: 'anthropic',
    model: options.model,
    async turn(request, signal) {
      const json = await post(
        options,
        key,
        options.endpoint,
        { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        anthropicBody(options.model, options.effort, request),
        signal,
      );
      return anthropicTurn(json);
    },
  };
}

// ─── OpenAI Responses ─────────────────────────────────────────────────────────

interface OpenAIItem {
  type: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  content?: { type: string; text?: string; refusal?: string }[];
}

/**
 * Stateless Responses request (`store: false`): the whole conversation is sent each time, with
 * the model's output items, encrypted reasoning included, passed back as they came.
 */
export function openaiBody(
  model: string,
  effort: string | null,
  request: TurnRequest,
): Record<string, unknown> {
  const input: unknown[] = [];
  for (const m of request.messages) {
    if (m.role === 'user')
      input.push({ role: 'user', content: [{ type: 'input_text', text: m.text }] });
    else if (m.role === 'assistant') input.push(...(m.raw as unknown[]));
    else {
      for (const r of m.results)
        input.push({ type: 'function_call_output', call_id: r.id, output: r.output });
    }
  }
  return {
    model,
    instructions: request.system,
    input,
    tools: request.tools.map((t) => ({
      type: 'function',
      name: t.name,
      description: t.description,
      parameters: t.schema,
      strict: false,
    })),
    max_output_tokens: request.maxOutputTokens,
    store: false,
    include: ['reasoning.encrypted_content'],
    ...(effort ? { reasoning: { effort } } : {}),
  };
}

export function openaiTurn(json: Record<string, unknown>): Turn {
  const output = (Array.isArray(json.output) ? json.output : []) as OpenAIItem[];
  const toolCalls: ToolCall[] = [];
  let text = '';
  let refused = false;
  for (const item of output) {
    if (item.type === 'function_call') {
      toolCalls.push({
        id: String(item.call_id),
        name: String(item.name),
        input: parseArguments(item.arguments),
      });
    } else if (item.type === 'message') {
      for (const part of item.content ?? []) {
        if (part.type === 'output_text') text += part.text ?? '';
        if (part.type === 'refusal') refused = true;
      }
    }
  }
  const u = (json.usage ?? {}) as Record<string, unknown>;
  const details = (u.input_tokens_details ?? {}) as Record<string, number | undefined>;
  const total = Number(u.input_tokens ?? 0);
  const cached = details.cached_tokens ?? 0;
  const written = details.cache_write_tokens ?? 0;
  const incomplete = (json.incomplete_details ?? {}) as { reason?: string };
  const stop: Stop = refused
    ? 'refusal'
    : json.status === 'incomplete'
      ? incomplete.reason === 'max_output_tokens'
        ? 'max_tokens'
        : incomplete.reason === 'content_filter'
          ? 'refusal'
          : 'other'
      : toolCalls.length
        ? 'tool_use'
        : 'end';
  return {
    text,
    toolCalls,
    raw: output,
    usage: {
      input: Math.max(0, total - cached - written),
      cacheRead: cached,
      cacheWrite: written,
      output: Number(u.output_tokens ?? 0),
    },
    stop,
    ...(stop === 'other'
      ? { detail: `status ${String(json.status)} ${incomplete.reason ?? ''}`.trim() }
      : {}),
  };
}

function parseArguments(text: string | undefined): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(text ?? '{}');
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : { __invalid: text };
  } catch {
    return { __invalid: text };
  }
}

function openai(options: ProviderOptions): Provider {
  const key = readKey(options.env, options.keyEnv);
  return {
    name: 'openai',
    model: options.model,
    async turn(request, signal) {
      const json = await post(
        options,
        key,
        options.endpoint,
        { authorization: `Bearer ${key}` },
        openaiBody(options.model, options.effort, request),
        signal,
      );
      return openaiTurn(json);
    },
  };
}

// ─── Gemini generateContent ───────────────────────────────────────────────────

interface GeminiPart {
  text?: string;
  thought?: boolean;
  thoughtSignature?: string;
  functionCall?: { id?: string; name: string; args?: Record<string, unknown> };
}

const GEMINI_SCHEMA_KEYS = new Set([
  'type',
  'format',
  'description',
  'nullable',
  'enum',
  'maxItems',
  'minItems',
  'properties',
  'required',
  'minProperties',
  'maxProperties',
  'minLength',
  'maxLength',
  'pattern',
  'anyOf',
  'default',
  'items',
  'minimum',
  'maximum',
  'title',
]);

/**
 * JSON Schema to the OpenAPI subset Gemini's `parameters` accepts: unsupported keywords
 * (`$schema`, `additionalProperties`, ...) dropped, and `type: [x, "null"]` turned into
 * `type: x, nullable: true`.
 */
export function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (!schema || typeof schema !== 'object') return schema;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    if (!GEMINI_SCHEMA_KEYS.has(key)) continue;
    if (key === 'type' && Array.isArray(value)) {
      const types = value.filter((t) => t !== 'null');
      out.type = types[0];
      if (types.length !== value.length) out.nullable = true;
    } else if (key === 'properties' && value && typeof value === 'object') {
      out.properties = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, toGeminiSchema(v)]),
      );
    } else if (key === 'items' || key === 'anyOf') {
      out[key] = toGeminiSchema(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function geminiBody(effort: string | null, request: TurnRequest): Record<string, unknown> {
  const contents: unknown[] = [];
  for (const m of request.messages) {
    if (m.role === 'user') contents.push({ role: 'user', parts: [{ text: m.text }] });
    else if (m.role === 'assistant') contents.push(m.raw);
    else {
      contents.push({
        role: 'user',
        parts: m.results.map((r) => ({
          functionResponse: {
            name: r.name,
            ...(r.id.startsWith(SYNTHETIC_ID) ? {} : { id: r.id }),
            response: r.isError ? { error: r.output } : { output: r.output },
          },
        })),
      });
    }
  }
  return {
    systemInstruction: { parts: [{ text: request.system }] },
    contents,
    tools: [
      {
        functionDeclarations: request.tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: toGeminiSchema(t.schema),
        })),
      },
    ],
    generationConfig: {
      maxOutputTokens: request.maxOutputTokens,
      ...(effort ? { thinkingConfig: { thinkingLevel: effort } } : {}),
    },
  };
}

const SYNTHETIC_ID = 'gemini-call-';
const REFUSED = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION']);

/** `callNumber` makes ids for function calls that come without one (older models). */
export function geminiTurn(json: Record<string, unknown>, callNumber: () => number): Turn {
  const candidates = (Array.isArray(json.candidates) ? json.candidates : []) as {
    content?: { role?: string; parts?: GeminiPart[] };
    finishReason?: string;
  }[];
  const candidate = candidates[0];
  const parts = candidate?.content?.parts ?? [];
  const toolCalls = parts
    .filter((p) => p.functionCall)
    .map((p) => ({
      id: p.functionCall?.id ?? `${SYNTHETIC_ID}${callNumber()}`,
      name: String(p.functionCall?.name),
      input: p.functionCall?.args ?? {},
    }));
  const u = (json.usageMetadata ?? {}) as Record<string, number | undefined>;
  const prompt = (u.promptTokenCount ?? 0) + (u.toolUsePromptTokenCount ?? 0);
  const cached = u.cachedContentTokenCount ?? 0;
  const feedback = (json.promptFeedback ?? {}) as { blockReason?: string };
  const finish = candidate?.finishReason;
  const stop: Stop =
    feedback.blockReason || (finish && REFUSED.has(finish))
      ? 'refusal'
      : finish === 'MAX_TOKENS'
        ? 'max_tokens'
        : finish === 'STOP' || finish === undefined
          ? toolCalls.length
            ? 'tool_use'
            : 'end'
          : 'other';
  return {
    text: parts
      .filter((p) => typeof p.text === 'string' && !p.thought)
      .map((p) => p.text)
      .join(''),
    toolCalls,
    raw: { role: 'model', parts },
    usage: {
      input: Math.max(0, prompt - cached),
      cacheRead: cached,
      cacheWrite: 0,
      output: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
    },
    stop,
    ...(stop === 'other' || stop === 'refusal'
      ? { detail: `finishReason ${String(finish ?? feedback.blockReason)}` }
      : {}),
  };
}

function gemini(options: ProviderOptions): Provider {
  const key = readKey(options.env, options.keyEnv);
  let calls = 0;
  return {
    name: 'google',
    model: options.model,
    async turn(request, signal) {
      const json = await post(
        options,
        key,
        `${options.endpoint}/${encodeURIComponent(options.model)}:generateContent`,
        { 'x-goog-api-key': key },
        geminiBody(options.effort, request),
        signal,
      );
      return geminiTurn(json, () => ++calls);
    },
  };
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

const RETRY_STATUS = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

/** POST JSON with retries on rate limits, overload and network errors; the key never appears in an error. */
async function post(
  options: ProviderOptions,
  key: string,
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  signal: AbortSignal | undefined,
): Promise<Record<string, unknown>> {
  const retries = options.retries ?? 5;
  const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const redact = (text: string) => text.split(key).join('[key]');
  let lastError = '';
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw new ProviderError('Stopped before the request was sent.');
    const timeout = AbortSignal.timeout(options.timeoutMs ?? 10 * 60_000);
    let response: Response;
    try {
      response = await options.fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
    } catch (error) {
      if (signal?.aborted) throw new ProviderError('Stopped while the request was in flight.');
      lastError = redact(error instanceof Error ? error.message : String(error));
      await sleep(backoff(attempt));
      continue;
    }
    if (response.ok) return (await response.json()) as Record<string, unknown>;
    const text = redact((await response.text()).slice(0, 800));
    if (!RETRY_STATUS.has(response.status) || attempt === retries) {
      throw new ProviderError(
        `HTTP ${response.status} from ${new URL(url).host}: ${text}`,
        response.status,
      );
    }
    lastError = `HTTP ${response.status}: ${text}`;
    const after = Number(response.headers.get('retry-after'));
    await sleep(
      Number.isFinite(after) && after > 0 ? Math.min(after * 1000, 120_000) : backoff(attempt),
    );
  }
  throw new ProviderError(`Gave up after ${retries + 1} attempts: ${lastError}`);
}

function backoff(attempt: number): number {
  return Math.min(60_000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 500);
}
