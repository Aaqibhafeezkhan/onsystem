import type { ColorPair } from '@/lib/code-theme';

/**
 * Highlighted text as plain data: lines of segments, each with a code colour (from Shiki or the
 * live tokenizer) or an output kind (from the output grammar), and the finding or change it is
 * part of. Plain data, so the server can highlight and a client component can render and mark.
 */

/** What a piece of terminal or agent output is, coloured by `.out-<kind>` in app/globals.css. */
export type OutputKind =
  | 'prompt'
  | 'command'
  | 'error'
  | 'warn'
  | 'info'
  | 'success'
  | 'accent'
  | 'dim'
  | 'string'
  | 'tag'
  | 'heading'
  | 'strong';

export interface Segment {
  text: string;
  /** A code colour, light and dark. */
  color?: ColorPair | undefined;
  italic?: boolean | undefined;
  /** A kind of output. */
  kind?: OutputKind | undefined;
  mark?: { kind: string; id?: number | undefined; first: boolean } | undefined;
}

/** A range of the source to mark, such as a finding or a changed span. */
export interface Mark {
  start: number;
  end: number;
  kind: string;
  id?: number;
}

/** A segment and where it starts in the source. */
export type Placed = Segment & { offset: number };

/**
 * Cuts segments where marks start and end and tags each piece with the mark over it, so a
 * finding is underlined exactly over the text it covers.
 */
export function markLines(lines: Placed[][], marks: Mark[]): Segment[][] {
  const live = marks.filter((m) => m.end > m.start);
  if (live.length === 0) return lines.map((line) => line.map(({ offset: _, ...s }) => s));
  const cuts = [...new Set(live.flatMap((m) => [m.start, m.end]))].sort((a, b) => a - b);
  const markAt = (offset: number) => live.find((m) => offset >= m.start && offset < m.end);
  return lines.map((line) =>
    line.flatMap(({ offset, ...segment }) => {
      const end = offset + segment.text.length;
      const points = [offset, ...cuts.filter((c) => c > offset && c < end), end];
      const pieces: Segment[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        const from = points[i] ?? offset;
        const to = points[i + 1] ?? end;
        const mark = markAt(from);
        pieces.push({
          ...segment,
          text: segment.text.slice(from - offset, to - offset),
          mark: mark && { kind: mark.kind, id: mark.id, first: from === mark.start },
        });
      }
      return pieces;
    }),
  );
}

/** Lines of placed segments from one segment list that may hold line breaks. */
export function splitLines(segments: Placed[]): Placed[][] {
  const lines: Placed[][] = [[]];
  for (const segment of segments) {
    let offset = segment.offset;
    segment.text.split('\n').forEach((part, i) => {
      if (i > 0) {
        lines.push([]);
        offset += 1;
      }
      if (part) lines.at(-1)?.push({ ...segment, text: part, offset });
      offset += part.length;
    });
  }
  return lines;
}
