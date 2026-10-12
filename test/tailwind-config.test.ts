import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Token } from '../src/types.js';
import {
  applyTailwindRadii,
  readTailwindRadii,
  type ModuleResolver,
} from '../src/tokens/tailwind-config.js';

const PRESET = `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        DEFAULT: 'var(--radius)',
      },
    },
  },
};
`;

const CONFIG = `const preset = require('./preset.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  theme: {
    extend: {
      borderRadius: {
        lg: '0.5rem',
      },
    },
  },
};
`;

function writeFixture(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'onsystem-radius-'));
  fs.writeFileSync(path.join(dir, 'preset.cjs'), PRESET);
  fs.writeFileSync(path.join(dir, 'tailwind.config.cjs'), CONFIG);
  return dir;
}

const resolve: ModuleResolver = (specifier, fromFile) =>
  specifier.startsWith('.') ? path.join(path.dirname(fromFile), specifier) : undefined;

function radiusToken(value: string, cssVar = '--radius-x'): Token {
  return {
    name: `radius-${value}`,
    category: 'radius',
    value,
    cssVar,
    usage: [],
    source: { file: 'theme.css', line: 1 },
  };
}

describe('Tailwind v3 borderRadius presets (issue #60)', () => {
  it('reads raw borderRadius from the config and its preset', () => {
    const dir = writeFixture();
    const { radii, files } = readTailwindRadii(path.join(dir, 'tailwind.config.cjs'), resolve);
    expect(radii.get('sm')).toBe('calc(var(--radius) - 4px)');
    expect(radii.get('lg')).toBe('0.5rem');
    expect(radii.get('DEFAULT')).toBe('var(--radius)');
    expect(files).toHaveLength(2);
  });

  it('evaluates calc() against the theme and names matching tokens', () => {
    const tokens = [
      radiusToken('8px', '--radius'),
      radiusToken('4px', '--radius-sm'),
      radiusToken('3px', '--radius-odd'),
    ];
    applyTailwindRadii(
      tokens,
      new Map([
        ['sm', 'calc(var(--radius) - 4px)'],
        ['DEFAULT', 'var(--radius)'],
      ]),
    );
    const [base, small, odd] = tokens;
    expect(base?.tailwind).toBe('DEFAULT');
    expect(small?.tailwind).toBe('sm');
    expect(odd?.tailwind).toBeUndefined();
  });

  it('reads numeric and template-literal values too', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'onsystem-radius-forms-'));
    fs.writeFileSync(
      path.join(dir, 'tailwind.config.cjs'),
      `module.exports = { theme: { extend: { borderRadius: { xs: 2, md: \`6px\` } } } };\n`,
    );
    const { radii } = readTailwindRadii(path.join(dir, 'tailwind.config.cjs'), resolve);
    expect(radii.get('xs')).toBe('2');
    expect(radii.get('md')).toBe('6px');
  });

  it('adds synthetic tokens for scale steps with no token', () => {
    const tokens = [radiusToken('8px', '--radius')];
    applyTailwindRadii(
      tokens,
      new Map([
        ['sm', 'calc(var(--radius) - 4px)'],
        ['DEFAULT', 'var(--radius)'],
      ]),
      'tailwind.config.cjs',
    );
    const added = tokens.find((t) => t.name === 'radius-sm');
    expect(added?.value).toEqual('4px');
    expect(added?.tailwind).toEqual('sm');
    expect(added?.source).toEqual({ file: 'tailwind.config.cjs', line: 1 });
  });
});
