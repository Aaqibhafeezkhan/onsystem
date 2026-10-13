import { CODE_COLORS, type CodeRole } from '@/lib/code-theme';
import { markLines, splitLines, type Mark, type Placed, type Segment } from '@/lib/segments';

/**
 * The playground's live highlighter: TSX as the visitor types it, in the browser, with no
 * dependencies. Everything rendered ahead of time goes through Shiki on the server instead
 * (lib/render-code.ts); this one colours the same kinds of token with the same colours
 * (lib/code-theme.ts), so the editor matches the rest of the site without shipping Shiki.
 */

type TokenKind = 'plain' | 'comment' | 'string' | 'keyword' | 'number' | 'tag' | 'attr' | 'punct';

export interface Token {
  text: string;
  kind: TokenKind;
}

const ROLES: Record<TokenKind, CodeRole> = {
  plain: 'fg',
  comment: 'comment',
  string: 'string',
  keyword: 'keyword',
  number: 'number',
  tag: 'tag',
  attr: 'attribute',
  punct: 'punctuation',
};

const KEYWORDS = new Set([
  'import',
  'export',
  'from',
  'function',
  'return',
  'const',
  'let',
  'var',
  'if',
  'else',
  'type',
  'interface',
  'extends',
  'default',
  'as',
  'new',
  'async',
  'await',
  'void',
  'string',
  'number',
  'boolean',
]);

const LITERALS = new Set(['true', 'false', 'null', 'undefined']);

export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  const push = (text: string, kind: TokenKind) => {
    if (text) tokens.push({ text, kind });
  };
  // Inside a JSX opening tag, between `<Name` and `>`: identifiers are attributes.
  let inTag = false;
  let braces = 0;
  const pattern =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?)([A-Za-z][\w.]*)|(=>)|([A-Za-z_$][\w$-]*)|(\d+(?:\.\d+)?)|(\s+)|([\s\S])/g;
  for (const match of code.matchAll(pattern)) {
    const [text, comment, string, open, tagName, arrow, word, number, space, other] = match;
    if (comment) push(comment, 'comment');
    else if (string) push(string, 'string');
    else if (open && tagName) {
      push(open, 'punct');
      push(tagName, 'tag');
      inTag = open === '<';
      braces = 0;
    } else if (arrow) push(arrow, 'keyword');
    else if (word) {
      if (inTag && braces === 0) {
        push(word, 'attr');
      } else {
        // `tone-warning` is never an identifier outside a tag; split on the dash.
        const [head = word, ...rest] = word.split(/(?=-)/);
        push(head, KEYWORDS.has(head) ? 'keyword' : LITERALS.has(head) ? 'number' : 'plain');
        for (const part of rest) push(part, 'plain');
      }
    } else if (number) push(number, 'number');
    else if (space) push(space, 'plain');
    else if (other) {
      if (inTag) {
        if (other === '{') braces++;
        else if (other === '}') braces = Math.max(0, braces - 1);
        else if (other === '>' && braces === 0) inTag = false;
      }
      push(other, 'punct');
    } else push(text, 'plain');
  }
  return tokens;
}

/** TSX as lines of coloured segments, with `marks` (findings) cut into them. */
export function highlightLines(code: string, marks: Mark[] = []): Segment[][] {
  let offset = 0;
  const placed: Placed[] = tokenize(code).map((token) => {
    const segment: Placed = { text: token.text, offset, color: CODE_COLORS[ROLES[token.kind]] };
    if (token.kind === 'comment') segment.italic = true;
    offset += token.text.length;
    return segment;
  });
  return markLines(splitLines(placed), marks);
}
