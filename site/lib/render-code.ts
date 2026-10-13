import { outputLines, type OutputOptions } from '@/lib/output';
import { markLines, type Mark, type Placed, type Segment } from '@/lib/segments';
import { shikiLines, type ShikiLang } from '@/lib/shiki';

/*
 * Server-side highlighting for every code surface: source code through Shiki, terminal and agent
 * output through the output grammar, and shell sessions (`$ ` lines) through both. Server only:
 * it imports Shiki.
 */

/** The languages code blocks are written in. `text` is terminal or agent output. */
export type Lang = 'tsx' | 'ts' | 'js' | 'json' | 'sh' | 'yaml' | 'toml' | 'css' | 'diff' | 'text';

/** A fence's language (```jsx, ```bash, ```yml …) as one of {@link Lang}. */
export function langOf(fence: string | undefined): Lang {
  const known: Record<string, Lang> = {
    tsx: 'tsx',
    jsx: 'tsx',
    ts: 'ts',
    typescript: 'ts',
    js: 'js',
    javascript: 'js',
    mjs: 'js',
    json: 'json',
    jsonc: 'json',
    sh: 'sh',
    bash: 'sh',
    shell: 'sh',
    zsh: 'sh',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    css: 'css',
    diff: 'diff',
  };
  return known[fence ?? ''] ?? 'text';
}

const SHIKI: Record<Exclude<Lang, 'sh' | 'text'>, ShikiLang> = {
  tsx: 'tsx',
  ts: 'typescript',
  js: 'typescript',
  json: 'json',
  yaml: 'yaml',
  toml: 'toml',
  css: 'css',
  diff: 'diff',
};

/** What a code block's bar says without a title. */
export const LANG_LABELS: Record<Lang, string> = {
  tsx: 'TSX',
  ts: 'TypeScript',
  js: 'JavaScript',
  json: 'JSON',
  sh: 'Shell',
  yaml: 'YAML',
  toml: 'TOML',
  css: 'CSS',
  diff: 'Diff',
  text: 'Output',
};

/**
 * What a code block's bar says without a title: its language, or what the output is: Claude Code
 * (slash commands, transcripts), a terminal session, or output.
 */
export function labelFor(code: string, lang: Lang): string {
  if (lang === 'text') {
    const lines = code.split('\n').filter((line) => line.trim());
    if (lines.every((line) => /^\/[\w:-]+/.test(line.trim())) || /^⏺ /m.test(code)) {
      return 'Claude Code';
    }
  }
  if (isSession(code, lang)) return 'Terminal';
  return LANG_LABELS[lang];
}

/** A shell session: commands after `$ ` prompts, with their output between them. */
export function isSession(code: string, lang: Lang): boolean {
  return lang === 'sh' && /^\$ /m.test(code);
}

/**
 * The one rule for long lines: transcripts and output (text, and shell sessions) wrap; source
 * code and commands scroll.
 */
export function wrapsLines(code: string, lang: Lang): boolean {
  return lang === 'text' || isSession(code, lang);
}

export interface Highlighted {
  lines: Segment[][];
  /** Per line, the columns a wrapped line indents by (output only). */
  hangs?: number[] | undefined;
}

/** Highlights `code` as `lang`, with `marks` cut into it. */
export function highlight(
  code: string,
  lang: Lang,
  { marks = [], ...options }: { marks?: Mark[] } & OutputOptions = {},
): Highlighted {
  if (lang === 'text') {
    const { lines, hangs } = outputLines(code, options);
    return { lines: markLines(lines, marks), hangs };
  }
  if (isSession(code, lang)) {
    // Each `$ ` line is a command, highlighted as shell; the lines between are its output.
    const { lines, hangs } = outputLines(code, options);
    let offset = 0;
    const session = code.split('\n').map((line, i): Placed[] => {
      const start = offset;
      offset += line.length + 1;
      if (!line.startsWith('$ ')) return lines[i] ?? [];
      const command = shikiLines(line.slice(2), 'bash')[0] ?? [];
      return [
        { text: '$ ', offset: start, kind: 'prompt' },
        ...command.map((s) => ({ ...s, offset: start + 2 + s.offset })),
      ];
    });
    return { lines: markLines(session, marks), hangs };
  }
  if (lang === 'sh') return { lines: markLines(shikiLines(code, 'bash'), marks) };
  return { lines: markLines(shikiLines(code, SHIKI[lang]), marks) };
}
