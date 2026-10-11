import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// What npm shows for the package: its homepage link and the keywords search finds it by.
const pkg = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, '../package.json'), 'utf8'),
) as { homepage: string; keywords: string[] };

describe('package.json', () => {
  it('links npm to the website', () => {
    expect(pkg.homepage).toBe('https://onsystem.vercel.app');
  });

  it('is found by the ESLint plugin it ships', () => {
    expect(pkg.keywords).toEqual(expect.arrayContaining(['eslint', 'eslint-plugin']));
  });
});
