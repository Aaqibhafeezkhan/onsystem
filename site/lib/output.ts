import type { OutputKind, Placed } from '@/lib/segments';

/*
 * A small grammar for terminal and agent output (the CLI, the MCP server's Markdown, Claude Code
 * transcripts), shared with the sibling sites: not a language, a few rules that give each kind of
 * thing its colour.
 *
 * - prompts (`$`, `>`, `❯`, `›`) dim, the command after them bright;
 * - `error` and error counts red, `warning` amber, `info` dim, `✓`, "passes" and "no problems" green;
 * - rule ids and tool names in the accent colour;
 * - file paths, `line:col` positions, arrows and separators dim;
 * - quoted strings and `inline code` tinted like strings in code, `<Tags>` like tags;
 * - Markdown structure: `#` headings bold (the hashes dim), list markers and table pipes dim.
 *
 * It has no dependencies and runs on the server and in the browser.
 */

/** The MCP server's tools, named in transcripts. */
const TOOLS = ['list_components', 'get_component', 'search_components', 'get_tokens', 'check_ui'];

export interface OutputOptions {
  /** Rule ids to colour wherever they appear; a rule id in brackets is coloured anyway. */
  ruleIds?: readonly string[] | undefined;
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const STRING = String.raw`"(?:[^"\\\n]|\\.)*"`;
const PATH = String.raw`(?:(?:\.{1,2}\/|~\/|[\w@.-]+:\/\/)?(?:[\w@.{}*-]+\/)+[\w@.{}*-]*|\b[\w.-]+\.(?:tsx|ts|jsx|js|mjs|cjs|json|mdx?|css|ya?ml|toml)\b)(?::\d+(?::\d+)?)?`;

/** A line's leading part that is structure rather than content. */
type Lead = { text: string; kind?: OutputKind | undefined }[];

/**
 * Colours output: lines of placed segments, each with an output kind or none (plain text).
 * `hang` is how many columns a wrapped line indents by, so a long line wraps under its text.
 */
export function outputLines(
  text: string,
  options: OutputOptions = {},
): { lines: Placed[][]; hangs: number[] } {
  const words = [...TOOLS, ...(options.ruleIds ?? [])].sort((a, b) => b.length - a.length);
  const inline = new RegExp(
    [
      String.raw`(\x60[^\x60\n]+\x60)`, // 1 `code`
      `(${STRING})`, // 2 "string"
      String.raw`\[([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\]`, // 3 [rule-id]
      String.raw`(<\/?[A-Za-z][\w.]*)((?:\s+[^<>\n]*?)?)(\/?>)`, // 4 5 6 <Tag attrs>
      String.raw`\b(\d+ errors?)\b`, // 7
      String.raw`\b(\d+ warnings?)\b`, // 8
      String.raw`(✓|✔|\bpasse[sd]\b|\b[Nn]o (?:new |design-system )?problems\b)`, // 9
      words.length ? String.raw`(?<![\w-])(${words.map(escape).join('|')})(?![\w-])` : '()', // 10
      String.raw`(\b\d+:\d+(?::\d+)?\b)`, // 11 line:col
      `(${PATH})`, // 12
      '(→|·|…|⎿)', // 13
    ].join('|'),
    'g',
  );

  const lines: Placed[][] = [];
  const hangs: number[] = [];
  let offset = 0;
  for (const line of text.split('\n')) {
    const out: Placed[] = [];
    let at = offset;
    const push = (part: string, kind?: OutputKind) => {
      if (!part) return;
      out.push(kind ? { text: part, offset: at, kind } : { text: part, offset: at });
      at += part.length;
    };
    const colour = (part: string) => {
      let last = 0;
      for (const m of part.matchAll(inline)) {
        push(part.slice(last, m.index));
        const [whole, code, string, rule, tagOpen, attrs, tagClose] = m;
        if (code) {
          push('`', 'dim');
          push(code.slice(1, -1), 'string');
          push('`', 'dim');
        } else if (string) push(string, 'string');
        else if (rule) {
          push('[', 'dim');
          push(rule, 'accent');
          push(']', 'dim');
        } else if (tagOpen) {
          push(tagOpen, 'tag');
          colour(attrs ?? '');
          push(tagClose ?? '', 'tag');
        } else if (m[7]) push(whole, 'error');
        else if (m[8]) push(whole, 'warn');
        else if (m[9]) push(whole, 'success');
        else if (m[10]) push(whole, 'accent');
        else push(whole, 'dim');
        last = m.index + whole.length;
      }
      push(part.slice(last));
    };

    const { lead, rest, hang } = splitLead(line);
    for (const piece of lead) push(piece.text, piece.kind);
    if (lead.some((p) => p.kind === 'heading')) {
      // A heading's text, bold; nothing inside it is coloured.
      push(rest, 'heading');
    } else if (/^\s*\/[\w:-]/.test(line)) {
      // A slash command's arguments read as one command.
      push(rest);
    } else if (/^\s*\|/.test(line)) {
      if (/^[\s|:-]+$/.test(rest)) push(rest, 'dim');
      else
        rest.split(/(\|)/).forEach((cell) => {
          if (cell === '|') push(cell, 'dim');
          else colour(cell);
        });
    } else colour(rest);
    lines.push(out);
    hangs.push(hang);
    offset += line.length + 1;
  }
  return { lines, hangs };
}

/** Splits a line into its structure (prompt, marker, heading hashes, position) and the rest. */
function splitLead(line: string): { lead: Lead; rest: string; hang: number } {
  const indent = /^\s*/.exec(line)?.[0] ?? '';
  const body = line.slice(indent.length);
  const lead: Lead = indent ? [{ text: indent }] : [];
  let m: RegExpExecArray | null;
  // `$ npx onsystem check` and `> check_ui {…}`: the prompt dim, the command bright.
  if ((m = /^([$>❯›] )(\S+)/.exec(body))) {
    lead.push({ text: m[1] ?? '', kind: 'prompt' }, { text: m[2] ?? '', kind: 'command' });
    return { lead, rest: body.slice(m[0].length), hang: indent.length + 2 };
  }
  // `/plugin install …`, a slash command.
  if ((m = /^(\/[\w:-]+)(?=\s|$)/.exec(body))) {
    lead.push({ text: m[1] ?? '', kind: 'accent' });
    return { lead, rest: body.slice(m[0].length), hang: indent.length };
  }
  if ((m = /^(#{1,6} )/.exec(body))) {
    lead.push({ text: m[1] ?? '', kind: 'dim' }, { text: '', kind: 'heading' });
    return { lead, rest: body.slice(m[0].length), hang: indent.length };
  }
  // Claude Code: `⏺ Write(path)`, `⏺ onsystem - get_component (MCP)(…)`, `⏺ Some prose.`
  if ((m = /^(⏺ )(?:(onsystem - )?(\w+)(?=[ (]))?/.exec(body))) {
    lead.push({ text: m[1] ?? '', kind: 'dim' });
    if (m[2]) lead.push({ text: m[2], kind: 'dim' });
    if (m[3] && (m[2] || /^[A-Z]\w*\(/.test(body.slice(m[1]?.length ?? 0))))
      lead.push({ text: m[3], kind: m[2] ? 'accent' : 'strong' });
    const used = lead.slice(indent ? 1 : 0).reduce((n, p) => n + p.text.length, 0);
    return { lead, rest: body.slice(used), hang: indent.length + 2 };
  }
  // `⎿  PostToolUse hook: …`
  if ((m = /^(⎿\s+)(\w+ hook:)?/.exec(body))) {
    lead.push({ text: m[1] ?? '', kind: 'dim' });
    if (m[2]) lead.push({ text: m[2], kind: 'dim' });
    return { lead, rest: body.slice(m[0].length), hang: indent.length + (m[1]?.length ?? 0) };
  }
  // `1:17 error …`, a finding.
  if ((m = /^(\d+:\d+)( +)(error|warning|warn|info)\b/.exec(body))) {
    const severity = m[3] ?? '';
    lead.push(
      { text: m[1] ?? '', kind: 'dim' },
      { text: m[2] ?? '' },
      {
        text: severity,
        kind: severity === 'error' ? 'error' : severity === 'info' ? 'info' : 'warn',
      },
    );
    return { lead, rest: body.slice(m[0].length), hang: indent.length + (m[1]?.length ?? 0) + 1 };
  }
  // `- item`, `* item`, `1. item`
  if ((m = /^([-*•]|\d+\.) /.exec(body))) {
    lead.push({ text: m[0], kind: 'dim' });
    return { lead, rest: body.slice(m[0].length), hang: indent.length + m[0].length };
  }
  return { lead, rest: body, hang: indent.length };
}
