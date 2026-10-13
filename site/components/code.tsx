import { BlockLine } from '@/components/code-line';
import { CodeFrame } from '@/components/code-frame';
import { CodeScroll } from '@/components/code-scroll';
import { ruleCatalog } from '@/lib/data';
import { highlight, isSession, labelFor, wrapsLines, type Lang } from '@/lib/render-code';
import type { Mark } from '@/lib/segments';

export { wrapsLines };

/** The rule ids, coloured wherever output names them. */
const RULE_IDS = ruleCatalog.rules.map((rule) => rule.id);

/**
 * Highlighted code in the shared frame, rendered on the server: source code through Shiki,
 * terminal and agent output (`text`) through the output grammar. Output and shell sessions wrap,
 * each wrapped line under its own text; source code scrolls, its right edge faded while more of
 * it is out of view.
 */
export function Code({
  code,
  lang,
  title,
  copy,
  marks,
  className = '',
  bodyClassName = '',
}: {
  code: string;
  lang: Lang;
  /** A file name or a caption for the bar; the language's name without one. */
  title?: string | undefined;
  /** Accessible name of the copy button; no button without it. */
  copy?: string | undefined;
  /** Findings or changes to mark in the code. */
  marks?: Mark[] | undefined;
  className?: string;
  /** Extra classes for the scrolling area, such as a maximum height. */
  bodyClassName?: string;
}) {
  return (
    <CodeFrame
      title={title}
      label={labelFor(code, lang)}
      copy={copy ? { text: copyText(code, lang), label: copy } : undefined}
      className={className}
    >
      <CodeBody code={code} lang={lang} marks={marks} className={bodyClassName} />
    </CodeFrame>
  );
}

/** A run of one language, for a block that mixes them, such as a tool call and its output. */
export interface CodePart {
  code: string;
  lang: Lang;
}

/**
 * The scrolling, highlighted part of a code block, for frames that hold more than code: one
 * language, or `parts` in several (a call in output, its code argument in TSX, then its output).
 */
export function CodeBody({
  code = '',
  lang = 'text',
  parts,
  marks,
  wrap: wraps,
  className = '',
}: {
  code?: string;
  lang?: Lang;
  parts?: CodePart[] | undefined;
  marks?: Mark[] | undefined;
  /** Wrap long lines; by default output and shell sessions wrap and source code scrolls. */
  wrap?: boolean | undefined;
  className?: string;
}) {
  const runs = parts ?? [{ code, lang }];
  const wrap = wraps ?? runs.some((run) => wrapsLines(run.code, run.lang));
  const rows = runs.flatMap((run) => {
    const { lines, hangs } = highlight(run.code, run.lang, { marks, ruleIds: RULE_IDS });
    const source = run.code.split('\n');
    return lines.map((segments, i) => ({
      segments,
      // Output knows where its text starts; wrapped code continues two columns in.
      hang: hangs?.[i] ?? (/^\s*/.exec(source[i] ?? '')?.[0].length ?? 0) + 2,
      tone: run.lang === 'diff' ? diffTone(source[i]) : undefined,
    }));
  });
  return (
    <CodeScroll className={`code code-body ${wrap ? 'code-wrap' : ''} ${className}`}>
      <code>
        {rows.map((row, i) => (
          <BlockLine key={i} segments={row.segments} hang={wrap ? row.hang : 0} tone={row.tone} />
        ))}
      </code>
    </CodeScroll>
  );
}

function diffTone(line = ''): 'add' | 'del' | undefined {
  if (line.startsWith('+') && !line.startsWith('+++')) return 'add';
  if (line.startsWith('-') && !line.startsWith('---')) return 'del';
  return undefined;
}

/** What to copy from a shell session: the commands, without prompts or output. */
function copyText(code: string, lang: Lang): string {
  if (!isSession(code, lang)) return code;
  return code
    .split('\n')
    .filter((line) => line.startsWith('$ '))
    .map((line) => line.slice(2))
    .join('\n');
}
