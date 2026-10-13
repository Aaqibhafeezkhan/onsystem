import type { CSSProperties } from 'react';

import type { Segment } from '@/lib/segments';

/**
 * One line of highlighted segments. A code colour travels as `--shiki-light` and `--shiki-dark`
 * (Shiki's names), picked by the page's colour scheme in app/globals.css (`.sk`); an output kind
 * is a class (`.out-error` …); a finding or change adds `.mark-<kind>`. Renders on the server and
 * in the browser alike.
 */
export function Line({ segments }: { segments: Segment[] }) {
  return segments.map((segment, i) => {
    const classes = [
      segment.color && 'sk',
      segment.italic && 'italic',
      segment.kind && `out-${segment.kind}`,
      segment.mark && `mark-${segment.mark.kind}`,
    ].filter(Boolean);
    const style = segment.color
      ? ({
          '--shiki-light': segment.color[0],
          '--shiki-dark': segment.color[1],
        } as CSSProperties)
      : undefined;
    return (
      <span key={i} className={classes.length ? classes.join(' ') : undefined} style={style}>
        {segment.text}
      </span>
    );
  });
}

/**
 * A line as a block, with a hanging indent for wrapped output so it wraps under its text, and the
 * add or del tint for a diff's changed lines.
 */
export function BlockLine({
  segments,
  hang = 0,
  tone,
}: {
  segments: Segment[];
  hang?: number | undefined;
  tone?: 'add' | 'del' | undefined;
}) {
  return (
    <span
      className={`block min-h-[1lh] ${tone ? `line-${tone}` : ''}`}
      style={
        hang && hang > 0 ? { paddingInlineStart: `${hang}ch`, textIndent: `-${hang}ch` } : undefined
      }
    >
      <Line segments={segments} />
    </span>
  );
}
