import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { MORE } from '@/lib/site';

// The footer's "More by Diogo Esteves" says what the sibling projects do in the words all
// three sites use, and only lib/site.ts holds them.
describe('the sibling projects', () => {
  it('are described with the taglines the three sites share', () => {
    expect(Object.fromEntries(MORE.map((p) => [p.name, p.description]))).toEqual({
      ondocs: 'Makes your docs answerable by people and agents, from one static index.',
      'signoff-ui': 'Review what your agent changed and approve what it may do.',
    });
  });

  it('are described nowhere else in the site code', () => {
    const files = ['app', 'components', 'lib'].flatMap((dir) =>
      fs
        .readdirSync(path.join(import.meta.dirname, '..', dir), { recursive: true })
        .map((file) => path.join(dir, String(file)))
        .filter((file) => /\.tsx?$/.test(file) && file !== path.join('lib', 'site.ts')),
    );
    for (const file of files) {
      const text = fs.readFileSync(path.join(import.meta.dirname, '..', file), 'utf8');
      for (const { description } of MORE) expect(text, file).not.toContain(description);
    }
  });
});
