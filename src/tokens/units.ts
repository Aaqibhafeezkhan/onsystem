/** Root font size used to convert rem/em to px for comparisons. */
export const ROOT_FONT_SIZE = 16;

const LENGTH = /^(-?(?:\d+(?:\.\d*)?|\.\d+))(px|rem|em)?$/i;

/** `"0.5rem"` → 8, `"12px"` → 12, `"4"` → 4. Returns undefined for anything else. */
export function lengthToPx(value: string | number): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const match = LENGTH.exec(value.trim());
  if (!match) return undefined;
  const n = Number(match[1]);
  const unit = (match[2] ?? 'px').toLowerCase();
  return unit === 'px' ? n : n * ROOT_FONT_SIZE;
}

export function formatPx(px: number): string {
  return `${Number(px.toFixed(2))}px`;
}

type Resolve = (name: string) => string | undefined;

/**
 * Evaluates a length that may use `var()` and `calc()` to px:
 * `calc(var(--radius) - 4px)` with `--radius: 0.625rem` → 6.
 */
export function evaluateLength(value: string, resolve: Resolve, depth = 0): number | undefined {
  if (depth > 16) return undefined;
  const expanded = expandVars(value.trim(), resolve, depth);
  if (expanded === undefined) return undefined;
  const direct = lengthToPx(expanded);
  if (direct !== undefined) return direct;
  const calc = /^calc\((.*)\)$/is.exec(expanded);
  return calc?.[1] !== undefined ? evaluateCalc(calc[1]) : undefined;
}

function expandVars(value: string, resolve: Resolve, depth: number): string | undefined {
  let out = '';
  let last = 0;
  // Each var() runs to its matching parenthesis, so a fallback may hold calc() or another var(). A
  // var() that is never closed ends the scan: the value has no px value, and no later `var(` is
  // scanned to the end again, so an unclosed run like `var(--a,var(--a,(...` stays linear.
  for (let at = value.indexOf('var(', last); at !== -1; at = value.indexOf('var(', last)) {
    let level = 0;
    let comma = -1;
    let end = -1;
    for (let i = at + 3; i < value.length; i++) {
      const c = value[i];
      if (c === '(') level++;
      else if (c === ')' && --level === 0) {
        end = i;
        break;
      } else if (c === ',' && level === 1 && comma === -1) comma = i;
    }
    if (end === -1) return undefined;
    const name = value.slice(at + 4, comma === -1 ? end : comma).trim();
    if (!/^--[\w-]+$/.test(name)) return undefined;
    const fallback = comma === -1 ? undefined : value.slice(comma + 1, end);
    const resolved = resolve(name) ?? fallback;
    const px = resolved === undefined ? undefined : evaluateLength(resolved, resolve, depth + 1);
    if (px === undefined) return undefined;
    out += `${value.slice(last, at)}${px}px`;
    last = end + 1;
  }
  return out + value.slice(last);
}

const CALC_TOKEN = /-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em)?|[()+\-*/]|calc/gi;

/**
 * Tiny recursive-descent evaluator for `+ - * /` over px/rem/em/unitless
 * numbers. Anything else (`%`, `vw`, `ch`, functions) has no fixed px value,
 * so the whole expression is undefined.
 */
function evaluateCalc(expression: string): number | undefined {
  if (expression.replace(CALC_TOKEN, '').trim()) return undefined;
  const tokens = expression.match(CALC_TOKEN);
  if (!tokens) return undefined;
  let i = 0;
  type Value = { n: number; length: boolean };

  const primary = (): Value | undefined => {
    const token = tokens[i++];
    if (token === undefined) return undefined;
    if (token.toLowerCase() === 'calc') return primary();
    if (token === '(') {
      const v = sum();
      i++; // ')'
      return v;
    }
    const px = lengthToPx(token);
    if (px === undefined) return undefined;
    return { n: px, length: /[a-z]$/i.test(token) };
  };
  const product = (): Value | undefined => {
    let left = primary();
    while (left && (tokens[i] === '*' || tokens[i] === '/')) {
      const op = tokens[i++];
      const right = primary();
      if (!right) return undefined;
      left =
        op === '*'
          ? { n: left.n * right.n, length: left.length || right.length }
          : { n: left.n / right.n, length: left.length };
    }
    return left;
  };
  const sum = (): Value | undefined => {
    let left = product();
    while (left && (tokens[i] === '+' || tokens[i] === '-')) {
      const op = tokens[i++];
      const right = product();
      if (!right) return undefined;
      left = { n: op === '+' ? left.n + right.n : left.n - right.n, length: true };
    }
    return left;
  };

  const result = sum();
  return result && Number.isFinite(result.n) ? result.n : undefined;
}
