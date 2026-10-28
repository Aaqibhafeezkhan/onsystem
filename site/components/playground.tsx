'use client';

import { useCallback, useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react';

import { Line } from '@/components/code-line';
import { FindingMessage } from '@/components/finding-message';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  ReplayIcon,
} from '@/components/icons';
import type { CheckError, CheckResponse } from '@/lib/check-service';
import { highlightLines } from '@/lib/highlight';
import type { Mark } from '@/lib/segments';
import type { Preset, PresetResult } from '@/lib/playground';
import {
  applyEdits,
  applyFixes,
  applyLabel,
  decisionFor,
  decisionNote,
  lineStartsOf,
  offsetOf,
  summaryText,
  undecided,
  type Decision,
  type Suggestion,
} from '@/lib/playground-edits';
import { ruleHref } from '@/lib/site';

interface Checked {
  /** The code the result belongs to: marks only line up with exactly this text. */
  code: string;
  result: PresetResult;
  ms?: number;
}

/** What the visitor applied since they last edited the code themselves. */
interface Applied {
  /** The code it led to: the summary goes once the code is anything else. */
  code: string;
  fixes: number;
  suggestions: number;
}

type Problem =
  { code: CheckError['error']['code']; message: string } | { code: 'network'; message: string };

const DEBOUNCE_MS = 650;

/** A suggestion's label, its code (in backticks) set in mono. */
function SuggestionLabel({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith('`') ? (
      <code key={i} className="font-mono text-[0.92em] text-fg">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

/**
 * The suggestions for a finding with no automatic fix. They are judgment calls, so they are drawn
 * apart from a fix (dashed, after "Needs a decision") and each says what it will change.
 */
function Suggestions({
  decision,
  disabled,
  onApply,
}: {
  decision: Decision;
  disabled: boolean;
  onApply: (option: Suggestion) => void;
}) {
  return (
    <div
      role={decision.choice ? 'group' : undefined}
      aria-label={decision.choice ? decision.prompt : undefined}
      className="mt-2 flex flex-wrap items-center gap-1.5"
    >
      <span className="mr-0.5 text-[12px] text-subtle">{decision.prompt}</span>
      {decision.options.map((option) => (
        <button
          key={option.label}
          type="button"
          disabled={disabled}
          aria-label={option.value === undefined ? undefined : `Use ${option.label}`}
          onClick={() => {
            onApply(option);
          }}
          className="tap inline-flex cursor-pointer items-center rounded-md border border-dashed border-line-strong px-2 py-1 text-left text-[12.5px] leading-snug text-fg-soft transition-colors hover:border-cyan/60 hover:bg-cyan/5 hover:text-fg disabled:cursor-default disabled:hover:border-line-strong disabled:hover:bg-transparent"
        >
          {option.value === undefined ? (
            <span>
              <SuggestionLabel text={option.label} />
            </span>
          ) : (
            <span className="font-mono text-[12px] out-string">{option.value}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * "Apply N fixes", after how many findings need a decision. While edited code is checked again it
 * keeps the last result's counts with its button off, as the findings below keep theirs, so the
 * row holds its place instead of going and coming back.
 */
export function ApplyAll({
  diagnostics,
  stale,
  noteId,
  onApply,
}: {
  diagnostics: PresetResult['diagnostics'];
  stale: boolean;
  noteId: string;
  onApply: () => void;
}) {
  const fixes = diagnostics.filter((d) => d.fix?.length).length;
  if (!fixes) return null;
  const open = undecided(diagnostics);
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${stale ? 'opacity-60' : ''}`}>
      {open > 0 && (
        <span id={noteId} className="text-[12.5px] text-subtle">
          {decisionNote(open)}
        </span>
      )}
      <button
        type="button"
        disabled={stale}
        aria-describedby={open > 0 ? noteId : undefined}
        onClick={onApply}
        className="tap cursor-pointer rounded-md border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-[13px] font-medium text-cyan-bright transition-colors hover:bg-cyan/20 disabled:cursor-default disabled:hover:bg-cyan/10"
      >
        {applyLabel(fixes)}
      </button>
    </div>
  );
}

function plural(n: number, noun: string): string {
  return `${String(n)} ${noun}${n === 1 ? '' : 's'}`;
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/*
 * A link to what is in the editor lives in the address's fragment, which never reaches the
 * server: nothing for the first draft, `#draft=<id>` for another draft, and `#code=` and the code
 * (UTF-8, deflated, base64url) for anything else.
 */
const DRAFT_LINK = '#draft=';
const CODE_LINK = '#code=';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** The fragment of a link to `code`. */
export async function linkHash(code: string, presets: Preset[]): Promise<string> {
  const draft = presets.find((p) => p.code === code);
  if (draft) return draft === presets[0] ? '' : `${DRAFT_LINK}${draft.id}`;
  const deflated = new Blob([code]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return `${CODE_LINK}${toBase64Url(new Uint8Array(await new Response(deflated).arrayBuffer()))}`;
}

/**
 * What a link's fragment opens: a draft, or code of at most `limit` bytes. Anything else, such as
 * `#findings`, a draft that is gone or a damaged link, opens nothing.
 */
export async function readLinkHash(
  hash: string,
  presets: Preset[],
  limit: number,
): Promise<{ preset: Preset } | { code: string } | undefined> {
  try {
    if (hash.startsWith(DRAFT_LINK)) {
      const id = decodeURIComponent(hash.slice(DRAFT_LINK.length));
      const preset = presets.find((p) => p.id === id);
      return preset && { preset };
    }
    if (!hash.startsWith(CODE_LINK)) return undefined;
    const reader = new Blob([fromBase64Url(hash.slice(CODE_LINK.length))])
      .stream()
      .pipeThrough(new DecompressionStream('deflate-raw'))
      .getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      size += chunk.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(chunk.value);
    }
    const code = new TextDecoder('utf-8', { fatal: true }).decode(
      await new Blob(chunks).arrayBuffer(),
    );
    const preset = presets.find((p) => p.code === code);
    return preset ? { preset } : { code };
  } catch {
    return undefined;
  }
}

/** Puts a link's fragment in the address without a new history entry or a scroll. */
function showInAddress(hash: string) {
  const { pathname, search, hash: shown } = window.location;
  if (hash === shown) return;
  try {
    window.history.replaceState(window.history.state, '', `${pathname}${search}${hash}`);
  } catch {
    // Safari limits how often a page may change its address; the next change tries again.
  }
}

/**
 * Copies `text`, which may still be on its way. Safari refuses a clipboard write that starts after
 * the click's handler awaits anything, so the write starts at once, with the text as a promise.
 */
export async function copyText(text: Promise<string>): Promise<void> {
  if (typeof ClipboardItem !== 'undefined' && 'write' in navigator.clipboard) {
    const blob = text.then((value) => new Blob([value], { type: 'text/plain' }));
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
  } else {
    await navigator.clipboard.writeText(await text);
  }
}

export function Playground({ presets, maxBytes }: { presets: Preset[]; maxBytes: number }) {
  const first = presets[0];
  const [presetId, setPresetId] = useState(first?.id ?? '');
  const [code, setCode] = useState(first?.code ?? '');
  const [checked, setChecked] = useState<Checked | undefined>(
    first && { code: first.code, result: first.result },
  );
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<Problem | undefined>(undefined);
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const [applied, setApplied] = useState<Applied | undefined>(undefined);
  const [focusSummary, setFocusSummary] = useState(0);
  /** The link's fragment for `code`, worked out as the code changes. */
  const [link, setLink] = useState<{ code: string; hash: string } | undefined>(undefined);
  /** Whether the address has been read: until then, it is not written. */
  const [linked, setLinked] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const textarea = useRef<HTMLTextAreaElement>(null);
  const summaryBox = useRef<HTMLDivElement>(null);
  const findingsBox = useRef<HTMLElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ids = useId();

  const preset = presets.find((p) => p.id === presetId);
  const bytes = useMemo(() => new TextEncoder().encode(code).length, [code]);
  const current = checked?.code === code ? checked : undefined;
  const empty = !code.trim();

  const run = useCallback(
    async (text: string) => {
      clearTimeout(timer.current);
      request.current?.abort();
      if (!text.trim()) {
        setPending(false);
        setProblem(undefined);
        return;
      }
      if (new TextEncoder().encode(text).length > maxBytes) {
        setPending(false);
        setProblem({
          code: 'too_large',
          message: `The playground checks up to ${kb(maxBytes)} of code. The CLI and the MCP server have no such limit.`,
        });
        return;
      }
      const controller = new AbortController();
      request.current = controller;
      setPending(true);
      try {
        const response = await fetch('/api/check', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code: text }),
          signal: controller.signal,
        });
        const body = (await response.json()) as CheckResponse | CheckError;
        if (controller.signal.aborted) return;
        if ('error' in body) {
          setProblem(body.error);
        } else {
          setProblem(undefined);
          setChecked({ code: text, result: body, ms: body.ms });
          setSelected(undefined);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setProblem({
          code: 'network',
          message: `Could not reach the checker (${error instanceof Error ? error.message : 'network error'}).`,
        });
      } finally {
        if (request.current === controller) setPending(false);
      }
    },
    [maxBytes],
  );

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(copiedTimer.current);
      request.current?.abort();
    },
    [],
  );

  // After applying, focus moves to the summary of what happened: the button that was pressed
  // goes away with its finding.
  useEffect(() => {
    if (focusSummary) summaryBox.current?.focus();
  }, [focusSummary]);

  const edit = (next: string, { now = false } = {}) => {
    setCode(next);
    clearTimeout(timer.current);
    if (now) {
      void run(next);
    } else {
      timer.current = setTimeout(() => {
        void run(next);
      }, DEBOUNCE_MS);
    }
  };

  /** Applies fixes or a suggestion and checks the result now, adding to the running summary. */
  const apply = (next: string, counts: { fixes?: number; suggestions?: number }) => {
    const before = applied?.code === code ? applied : { fixes: 0, suggestions: 0 };
    setApplied({
      code: next,
      fixes: before.fixes + (counts.fixes ?? 0),
      suggestions: before.suggestions + (counts.suggestions ?? 0),
    });
    setFocusSummary((n) => n + 1);
    edit(next, { now: true });
  };

  const applySuggestion = (option: Suggestion) => {
    apply(applyEdits(code, option.edits).code, { suggestions: 1 });
  };

  const choose = (next: Preset) => {
    clearTimeout(timer.current);
    request.current?.abort();
    setPending(false);
    setPresetId(next.id);
    setCode(next.code);
    setChecked({ code: next.code, result: next.result });
    setProblem(undefined);
    setSelected(undefined);
    setApplied(undefined);
  };

  // A link opens the draft or the code in its fragment, on load and when the fragment changes.
  // Code past the check's limit still opens, up to four times that, and says it is too large.
  const openLink = useEffectEvent(async (hash: string) => {
    const opened = await readLinkHash(hash, presets, 4 * maxBytes);
    if (opened && 'preset' in opened) {
      choose(opened.preset);
    } else if (opened) {
      setApplied(undefined);
      edit(opened.code, { now: true });
    }
    setLinked(true);
  });
  useEffect(() => {
    const open = () => {
      void openLink(window.location.hash);
    };
    open();
    window.addEventListener('hashchange', open);
    return () => {
      window.removeEventListener('hashchange', open);
    };
  }, []);

  useEffect(() => {
    let live = true;
    void linkHash(code, presets).then((hash) => {
      if (live) setLink({ code, hash });
    });
    return () => {
      live = false;
    };
  }, [code, presets]);

  // The address follows the editor once typing pauses, so a reload or a copied address keeps the
  // code. It is replaced, not pushed: Back still leaves the page.
  useEffect(() => {
    if (!linked || link?.code !== code) return;
    const pause = setTimeout(() => {
      showInAddress(link.hash);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(pause);
    };
  }, [code, link, linked]);

  const copyLink = () => {
    // The fragment is ready unless the code changed a moment ago.
    const hash = link?.code === code ? Promise.resolve(link.hash) : linkHash(code, presets);
    const url = hash.then((fragment) => {
      showInAddress(fragment);
      const { origin, pathname, search } = window.location;
      return `${origin}${pathname}${search}${fragment}`;
    });
    const done = (status: 'copied' | 'failed') => {
      setCopyStatus(status);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => {
        setCopyStatus('idle');
      }, 1600);
    };
    copyText(url).then(
      () => {
        done('copied');
      },
      () => {
        done('failed');
      },
    );
  };

  // The list keeps the last result while the edited code is checked again; its offsets only
  // line up with the code it was checked on, so marks and fixes wait for the new result.
  const stale = !current;
  // After a failed check, or with nothing to check, the previous findings describe code that is
  // gone: leave them out.
  const shown = empty || (problem && stale) ? undefined : checked;
  const diagnostics = shown?.result.diagnostics ?? [];
  const syntax = diagnostics.some((d) => d.ruleId === 'syntax');
  // The findings with no automatic fix, as suggestions; offsets into the code they were checked on.
  const decisions = useMemo(
    () => (shown ? shown.result.diagnostics.map((d) => decisionFor(shown.code, d)) : []),
    [shown],
  );
  const summary =
    applied?.code === code
      ? summaryText(applied, current && !pending ? current.result.diagnostics : undefined)
      : undefined;

  // Underlines and gutter markers for the checked code.
  const { lines, gutter } = useMemo(() => {
    const starts = lineStartsOf(code);
    const marks: Mark[] = current
      ? current.result.diagnostics.map((d, id) => ({
          start: offsetOf(starts, d.line, d.column),
          end: Math.max(
            offsetOf(starts, d.endLine, d.endColumn),
            offsetOf(starts, d.line, d.column) + 1,
          ),
          kind: id === selected ? 'active' : d.severity,
          id,
        }))
      : [];
    const severity = new Map<number, 'error' | 'warning'>();
    for (const d of current?.result.diagnostics ?? []) {
      if (severity.get(d.line) !== 'error') severity.set(d.line, d.severity);
    }
    return { lines: highlightLines(code, marks), gutter: severity };
  }, [code, current, selected]);

  const focusFinding = (index: number) => {
    const d = diagnostics[index];
    const area = textarea.current;
    if (!d || !area) return;
    setSelected(index);
    const starts = lineStartsOf(code);
    area.focus({ preventScroll: true });
    area.setSelectionRange(
      offsetOf(starts, d.line, d.column),
      offsetOf(starts, d.endLine, d.endColumn),
    );
    editor.current
      ?.querySelector(`[data-line="${String(d.line)}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const status = empty
    ? 'Nothing to check'
    : problem
      ? 'Not checked'
      : pending || !current
        ? 'Checking…'
        : current.result.errorCount + current.result.warningCount === 0
          ? 'No design-system problems'
          : `${plural(current.result.errorCount, 'error')} · ${plural(current.result.warningCount, 'warning')}`;
  // Below lg the findings come after the editor, a long file further down: the status there is a
  // link to them.
  const found =
    !empty && !problem && !pending && current
      ? current.result.errorCount + current.result.warningCount
      : 0;

  return (
    <div>
      {/* Drafts */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Drafts" className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === presetId}
              onClick={() => {
                choose(p);
              }}
              className="tap cursor-pointer rounded-lg border border-line bg-raised px-3 py-1.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg aria-pressed:border-cyan/50 aria-pressed:bg-cyan/10 aria-pressed:text-fg"
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="tap ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-fg"
        >
          {copyStatus === 'copied' ? (
            <CheckIcon className="size-4 text-cyan" />
          ) : (
            <CopyIcon className="size-4" />
          )}
          Copy link
        </button>
        <span className="sr-only" role="status">
          {copyStatus === 'copied'
            ? 'Link copied to the clipboard'
            : copyStatus === 'failed'
              ? 'Could not copy. The link is in the address bar.'
              : ''}
        </span>
        <button
          type="button"
          disabled={!preset || code === preset.code}
          onClick={() => {
            if (preset) choose(preset);
          }}
          className="tap inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-fg disabled:cursor-default disabled:opacity-50 disabled:hover:text-muted"
        >
          <ReplayIcon className="size-4" />
          Reset
        </button>
      </div>
      {preset && <p className="mt-3 text-[14px] text-muted">{preset.description}</p>}

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        {/* Editor */}
        <div className="code-block transition-colors focus-within:border-cyan/60 focus-within:ring-1 focus-within:ring-cyan/35">
          <div className="code-bar pr-4">
            <label htmlFor={`${ids}-code`} className="code-title">
              {preset && code === preset.code ? preset.file : 'Your code'}
            </label>
            <span
              className={`shrink-0 text-[11px] ${found > 0 ? 'max-lg:hidden' : ''} ${empty || pending || !current || problem ? 'text-subtle' : current.result.errorCount > 0 ? 'text-error' : current.result.warningCount > 0 ? 'text-warn' : 'text-success'}`}
            >
              {status}
            </span>
            {found > 0 && (
              <a
                href="#findings"
                onClick={(event) => {
                  // Scrolls there without the fragment, which holds the link to the code.
                  event.preventDefault();
                  findingsBox.current?.scrollIntoView();
                  findingsBox.current?.focus({ preventScroll: true });
                }}
                className={`tap inline-flex shrink-0 items-center gap-1 text-[11px] underline decoration-line-strong underline-offset-2 transition-colors hover:decoration-current lg:hidden ${current?.result.errorCount ? 'text-error' : 'text-warn'}`}
              >
                {`Jump to ${plural(found, 'finding')}`}
                <ArrowRightIcon className="size-3 rotate-90" />
              </a>
            )}
          </div>
          <div
            ref={editor}
            className="relative grid text-base leading-[1.6] sm:text-[13px] sm:leading-[1.7]"
          >
            <pre
              aria-hidden="true"
              className="code pointer-events-none m-0 py-3 pr-4 whitespace-pre-wrap [overflow-wrap:anywhere] [grid-area:1/1]"
            >
              {lines.map((segments, i) => {
                const severity = gutter.get(i + 1);
                return (
                  <span key={i} data-line={i + 1} className="flex min-h-[1lh]">
                    <span className="relative w-9 shrink-0 pr-2.5 text-right text-[11px] text-subtle select-none sm:w-11 sm:pr-3">
                      {severity && (
                        <span
                          className={`absolute top-[0.7em] left-1 size-1.5 rounded-full sm:left-1.5 ${severity === 'error' ? 'bg-error' : 'bg-warn'}`}
                        />
                      )}
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Line segments={segments} />
                    </span>
                  </span>
                );
              })}
            </pre>
            <textarea
              ref={textarea}
              id={`${ids}-code`}
              value={code}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              aria-describedby={`${ids}-hint`}
              onChange={(event) => {
                setApplied(undefined);
                edit(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  edit(event.currentTarget.value, { now: true });
                }
              }}
              className="code m-0 block h-full w-full resize-none overflow-hidden bg-transparent py-3 pr-4 pl-9 whitespace-pre-wrap text-transparent caret-cyan-bright outline-none [overflow-wrap:anywhere] [grid-area:1/1] selection:bg-cyan/25 selection:text-transparent focus-visible:outline-none sm:pl-11"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-[12px] text-subtle">
            <span id={`${ids}-hint`}>
              Checks as you type, or now with <kbd className="font-mono">⌘</kbd>/
              <kbd className="font-mono">Ctrl</kbd> + <kbd className="font-mono">Enter</kbd>.
              Parsed, never run.
            </span>
            <span className={`font-mono ${bytes > maxBytes ? 'text-error' : ''}`}>
              {kb(bytes)} / {kb(maxBytes)}
            </span>
          </div>
        </div>

        {/* Findings */}
        <section
          ref={findingsBox}
          id="findings"
          tabIndex={-1}
          aria-labelledby={`${ids}-findings`}
          className="min-w-0 rounded-xl border border-line bg-raised lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 id={`${ids}-findings`} className="text-sm font-semibold text-fg">
              {shown && diagnostics.length === 0 ? (
                <span className="inline-flex items-center gap-2">
                  <CheckIcon className="size-4 text-success" />
                  No design-system problems
                </span>
              ) : (
                <>
                  Findings
                  {shown && (
                    <span className="font-mono text-xs font-normal">
                      {' '}
                      <span className="text-error">{plural(shown.result.errorCount, 'error')}</span>
                      <span className="text-subtle"> · </span>
                      <span className="text-warn">
                        {plural(shown.result.warningCount, 'warning')}
                      </span>
                    </span>
                  )}
                </>
              )}
            </h2>
            <ApplyAll
              diagnostics={diagnostics}
              stale={stale}
              noteId={`${ids}-open`}
              onApply={() => {
                const result = applyFixes(code, diagnostics);
                apply(result.code, { fixes: result.count });
              }}
            />
          </div>

          <p className="sr-only" role="status">
            {pending ? '' : (summary ?? status)}
          </p>

          {summary && (
            <div
              ref={summaryBox}
              tabIndex={-1}
              className="mx-4 mt-4 rounded-lg border border-line bg-raised-2 px-3 py-2.5 text-[13px] leading-relaxed"
            >
              <p className="flex items-start gap-2 font-medium text-fg">
                <CheckIcon className="mt-[0.2em] size-4 shrink-0 text-success" />
                {summary}
              </p>
              {current && !pending && undecided(current.result.diagnostics) > 0 && (
                <p className="mt-1 pl-6 text-muted">
                  Fixes only go in where the change is mechanical; the rest are judgment calls, left
                  to you.
                </p>
              )}
            </div>
          )}

          {problem && (
            <div
              role="alert"
              className="mx-4 mt-4 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5 text-[13px] leading-relaxed text-fg-soft"
            >
              <p className="font-medium text-fg">
                {problem.code === 'too_large'
                  ? 'Too large to check here'
                  : problem.code === 'rate_limited'
                    ? 'Slow down a little'
                    : problem.code === 'timeout'
                      ? 'The check timed out'
                      : 'Could not check'}
              </p>
              <p className="mt-0.5 text-muted">{problem.message}</p>
              {problem.code !== 'too_large' && (
                <button
                  type="button"
                  onClick={() => {
                    void run(code);
                  }}
                  className="mt-2 cursor-pointer text-[13px] font-medium text-cyan-bright underline underline-offset-4"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {syntax && current && (
            <p className="mx-4 mt-4 rounded-lg border border-line bg-raised-2 px-3 py-2.5 text-[13px] leading-relaxed text-muted">
              <span className="font-medium text-fg">The code does not parse yet.</span> The rules
              still ran on what TypeScript could read, so some findings may be missing until the
              syntax error is fixed.
            </p>
          )}

          {empty && (
            <p className="px-4 py-4 text-[14px] leading-relaxed text-muted">
              Nothing to check yet. Paste a component or a fragment of TSX, or pick a draft above.
            </p>
          )}

          {shown && diagnostics.length === 0 && (
            <p
              className={`px-4 py-4 text-[14px] leading-relaxed text-muted ${stale ? 'opacity-60' : ''}`}
            >
              Every component, prop and variant exists, and colors, spacing and radius come from the
              tokens.
              {shown.ms !== undefined && (
                <span className="text-subtle"> Checked in {shown.ms.toFixed(1)} ms.</span>
              )}
            </p>
          )}

          {diagnostics.length > 0 && (
            <ol
              className={`grid grid-cols-[minmax(0,1fr)] divide-y divide-line/70 ${pending || stale ? 'opacity-60' : ''}`}
            >
              {diagnostics.map((d, i) => (
                <li
                  key={`${String(i)}-${d.ruleId}-${String(d.line)}-${String(d.column)}`}
                  className={`px-4 py-3 ${selected === i ? 'bg-fg/[0.03]' : ''}`}
                >
                  {/* The output grammar's order and colours: position, severity, rule id. */}
                  <div className="flex items-baseline gap-2 font-mono text-[11.5px]">
                    <span
                      className={`size-1.5 shrink-0 translate-y-[-1px] rounded-full ${d.severity === 'error' ? 'bg-error' : 'bg-warn'}`}
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      disabled={stale}
                      onClick={() => {
                        focusFinding(i);
                      }}
                      className="cursor-pointer text-subtle underline disabled:cursor-default disabled:no-underline decoration-line-strong underline-offset-2 hover:text-fg"
                    >
                      {d.line}:{d.column}
                      <span className="sr-only"> (show in the editor)</span>
                    </button>
                    <span className={d.severity === 'error' ? 'out-error' : 'out-warn'}>
                      {d.severity}
                    </span>
                    {d.ruleId === 'syntax' ? (
                      <span className="truncate out-accent">syntax</span>
                    ) : (
                      <a
                        href={ruleHref(d.ruleId)}
                        className="inline-flex min-w-0 items-center gap-0.5 out-accent hover:underline"
                      >
                        <span className="truncate">{d.ruleId}</span>
                        <ArrowUpRightIcon className="size-3 shrink-0" />
                      </a>
                    )}
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-soft">
                    <FindingMessage text={d.message} />
                  </p>
                  {d.fix?.length ? (
                    <button
                      type="button"
                      disabled={stale}
                      onClick={() => {
                        const result = applyFixes(code, [d]);
                        apply(result.code, { fixes: result.count });
                      }}
                      className="tap mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-raised-2 px-2 py-1 font-mono text-[12px] text-fg-soft transition-colors hover:border-cyan/50 hover:text-fg disabled:cursor-default disabled:hover:border-line"
                    >
                      Apply fix
                      {d.suggestion && <span className="out-success">{d.suggestion}</span>}
                    </button>
                  ) : decisions[i] ? (
                    <Suggestions
                      decision={decisions[i]}
                      disabled={stale}
                      onApply={applySuggestion}
                    />
                  ) : d.suggestion ? (
                    <p className="mt-2 font-mono text-[12px] text-subtle">
                      Suggests <span className="out-string">{d.suggestion}</span>; the change needs
                      a decision, so there is no automatic fix.
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
