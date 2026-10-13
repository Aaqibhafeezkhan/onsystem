import { CodeScroll } from '@/components/code-scroll';
import { CopyButton } from '@/components/copy-button';
import { highlightLines, type Lang, type Segment } from '@/lib/highlight';

/** One line of highlighted segments. */
export function Line({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((segment, i) => (
        <span
          key={i}
          className={`tok-${segment.kind}${segment.mark ? ` mark-${segment.mark.kind}` : ''}`}
        >
          {segment.text}
        </span>
      ))}
    </>
  );
}

const LANG_LABELS: Record<Lang, string> = {
  tsx: 'TSX',
  json: 'JSON',
  sh: 'Shell',
  toml: 'TOML',
  yaml: 'YAML',
  text: 'Text',
};

/**
 * The one rule for long lines: transcripts and prose-like output (text, and shell sessions
 * with `$ ` prompts and their output) wrap; source code and commands scroll.
 */
export function wrapsLines(code: string, lang: Lang): boolean {
  return lang === 'text' || (lang === 'sh' && /^\$ /m.test(code));
}

/**
 * A highlighted block of code under a slim bar that names it (a file name, or the language)
 * and holds the copy button, so the button never covers the code.
 */
export function Code({
  code,
  lang,
  title,
  copy,
  className = '',
}: {
  code: string;
  lang: Lang;
  /** A file name or a caption for the bar; the language's name without one. */
  title?: string | undefined;
  /** Accessible name of the copy button; no button without it. */
  copy?: string | undefined;
  className?: string;
}) {
  const lines = highlightLines(code, lang);
  const wrap = wrapsLines(code, lang);
  return (
    <div
      data-code-block=""
      className={`min-w-0 overflow-hidden rounded-xl border border-line bg-code ${className}`}
    >
      <div className="flex min-h-9 items-center justify-between gap-3 border-b border-line py-1 pr-1.5 pl-4">
        <span
          className={`truncate font-mono text-xs ${title ? 'text-muted' : 'text-subtle uppercase'}`}
        >
          {title ?? LANG_LABELS[lang]}
        </span>
        {copy && <CopyButton text={stripPrompts(code, lang)} label={copy} className="size-7" />}
      </div>
      <div className="relative">
        <CodeScroll
          className={`code overflow-x-auto px-4 py-3.5 text-[12.5px] leading-[1.7] ${wrap ? 'whitespace-pre-wrap' : ''}`}
        >
          <code>
            {lines.map((segments, i) => (
              <span key={i} className="block min-h-[1lh]">
                <Line segments={segments} />
              </span>
            ))}
          </code>
        </CodeScroll>
      </div>
    </div>
  );
}

/** What to copy from a shell transcript: the commands, without prompts or output. */
function stripPrompts(code: string, lang: Lang): string {
  if (lang !== 'sh' || !code.includes('$ ')) return code;
  return code
    .split('\n')
    .filter((line) => line.startsWith('$ '))
    .map((line) => line.slice(2))
    .join('\n');
}
