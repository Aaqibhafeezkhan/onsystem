/** Lines longer than this break into one entry per line. */
const WIDTH = 72;

/** JSON on one line, spaced: `{ "name": "Badge" }`. */
export function inline(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(inline).join(', ')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return `{ ${entries.map(([key, v]) => `${JSON.stringify(key)}: ${inline(v)}`).join(', ')} }`;
  }
  return value === undefined ? 'null' : JSON.stringify(value);
}

function format(value: unknown, indent: string, prefix: number): string {
  const one = inline(value);
  if (!value || typeof value !== 'object' || indent.length + prefix + one.length <= WIDTH) {
    return one;
  }
  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    return `[\n${value.map((v) => `${inner}${format(v, inner, 0)}`).join(',\n')}\n${indent}]`;
  }
  const entries = Object.entries(value).map(([key, v]) => {
    const name = JSON.stringify(key);
    return `${inner}${name}: ${format(v, inner, name.length + 2)}`;
  });
  return `{\n${entries.join(',\n')}\n${indent}}`;
}

/** JSON as people format it by hand: short arrays and objects on one line, the rest indented. */
export function formatJson(value: unknown): string {
  return format(value, '', 0);
}
