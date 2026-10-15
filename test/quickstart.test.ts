import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { DEMO_ROOT, fixture } from './helpers.js';
import { blocks, section } from './markdown.js';

// docs/quickstart.md: the first step shows findings on the visitor's own code, with nothing
// installed and no config, and says where findings in registry code come from.

const quickstart = fs.readFileSync(path.join(import.meta.dirname, '../docs/quickstart.md'), 'utf8');
const firstStep = section(quickstart, 'See what it found');

describe('the quickstart (docs/quickstart.md)', () => {
  it('starts with `check .`, then `inspect`', () => {
    expect(quickstart.indexOf('## See what it found')).toBeGreaterThan(
      quickstart.indexOf('<!-- steps -->'),
    );
    expect(blocks(firstStep, 'sh')).toEqual(['npx -y onsystem check .\n']);
    expect(firstStep).toContain('with no install and no config');
    expect(firstStep).toContain('`npx -y onsystem inspect` shows what it read');
  });

  it('links the registry-code section from the first step', () => {
    expect(firstStep).toContain(
      '[Code from shadcn registries](configuration.md#code-from-shadcn-registries)',
    );
  });

  it('runs `check .` with no config, and exits with code 1 on errors', async () => {
    // The demo app without its config, and without node_modules, as a stranger's app is before
    // anything of onsystem is in it.
    const root = fixture({});
    fs.cpSync(DEMO_ROOT, root, {
      recursive: true,
      filter: (src) => {
        const rel = path.relative(DEMO_ROOT, src);
        return rel !== 'node_modules' && rel !== 'onsystem.config.json';
      },
    });
    expect(fs.existsSync(path.join(root, 'onsystem.config.json'))).toBe(false);
    const out: string[] = [];
    const io: Io = { cwd: root, color: false, stdout: (t) => out.push(t), stderr: () => {} };
    const code = await main(['check', '.', '--no-cache'], io);
    const text = out.join('\n');
    expect(code).toBe(1);
    expect(text).toMatch(/\d+ errors?, \d+ warnings? in 1 of 2 files checked/);
    expect(text).toContain('Use <Button> (import { Button } from "@/components/ui/button")');
    expect(firstStep).toContain('It exits with code 1 when there are errors.');
  });
});
