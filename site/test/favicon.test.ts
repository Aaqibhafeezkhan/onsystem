import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// Browsers and crawlers ask for /favicon.ico whatever the page links to; app/favicon.ico
// serves it (Next.js file convention), the logo at the sizes a tab and a bookmark use.
describe('/favicon.ico', () => {
  it('is an icon file with the logo at 16, 32 and 48 px, as PNG images', () => {
    const icon = fs.readFileSync(path.join(import.meta.dirname, '../app/favicon.ico'));
    expect(icon.readUInt16LE(0)).toBe(0);
    expect(icon.readUInt16LE(2)).toBe(1);
    const count = icon.readUInt16LE(4);
    const sizes: number[] = [];
    for (let i = 0; i < count; i++) {
      const entry = 6 + 16 * i;
      const size = icon.readUInt8(entry) || 256;
      const length = icon.readUInt32LE(entry + 8);
      const offset = icon.readUInt32LE(entry + 12);
      const png = icon.subarray(offset, offset + length);
      expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
      expect(png.readUInt32BE(16)).toBe(size);
      sizes.push(size);
    }
    expect(sizes).toEqual([16, 32, 48]);
  });
});
