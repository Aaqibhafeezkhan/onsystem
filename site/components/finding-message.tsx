import { Fragment } from 'react';

import { InlineMarkdown } from '@/components/markdown';

/** A quoted literal (`"danger"`) or a JSX tag (`<Card.Description>`, `<label htmlFor>`). */
const LITERAL = /("(?:[^"\\\n]|\\.)*"|<\/?[A-Za-z][\w.]*(?:\s[^<>\n]*?)?\/?>)/g;

/**
 * A finding's message as prose, with what it quotes from the code set like code: `inline code`
 * as the docs set it, quoted values tinted like strings and component tags like tags (the output
 * grammar's colours). Renders on the server and in the browser.
 */
export function FindingMessage({ text }: { text: string }) {
  return text.split(/(``.+?``|`[^`]+`)/).map((part, i) =>
    part.startsWith('`') ? (
      <InlineMarkdown key={i} text={part} />
    ) : (
      <Fragment key={i}>
        {part.split(LITERAL).map((piece, j) =>
          j % 2 === 1 ? (
            <span
              key={j}
              className={`font-mono text-[0.9em] ${piece.startsWith('"') ? 'out-string' : 'out-tag'}`}
            >
              {piece}
            </span>
          ) : (
            piece
          ),
        )}
      </Fragment>
    ),
  );
}
