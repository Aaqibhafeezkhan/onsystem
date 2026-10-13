import { InlineMarkdown } from '@/components/markdown';

/** A run of prose as its sentences: a sentence ends at a full stop before a capital or code. */
export function sentences(text: string): string[] {
  return text
    .trim()
    .split(/(?<=\.)\s+(?=[A-Z`])/)
    .filter(Boolean);
}

/**
 * Long generated prose (how fixes are chosen) as a list, one sentence per item, so it can be
 * scanned rather than read as one block. The sentences are the text's own, in order.
 */
export function SentenceList({ text, className = '' }: { text: string; className?: string }) {
  return (
    <ul className={`measure grid gap-3 ${className}`}>
      {sentences(text).map((sentence, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2.5 size-1 shrink-0 rounded-full bg-cyan" aria-hidden="true" />
          <span>
            <InlineMarkdown text={sentence} />
          </span>
        </li>
      ))}
    </ul>
  );
}
