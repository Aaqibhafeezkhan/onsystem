import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { DEMO_ROOT, fixture } from './helpers.js';

// /setup.md (site/lib/llms.ts) has an agent run these commands, and says what each one does. They
// run here, on the demo app as a stranger's app is before anything of onsystem is in it, and as it
// is when the user ran `init` by hand and declined the baseline, with no terminal to answer
// questions in, as an agent runs them. site/test/setup.test.ts checks that /setup.md names them.

/** A copy of the demo app, without its dependencies and with only the onsystem files in `keep`. */
function demo(keep: string[] = []): string {
  const root = fixture({});
  const leftOut = ['onsystem.config.json', 'onsystem.baseline.json'].filter(
    (f) => !keep.includes(f),
  );
  fs.cpSync(DEMO_ROOT, root, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(DEMO_ROOT, src);
      return rel !== 'node_modules' && !leftOut.includes(rel);
    },
  });
  return root;
}

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const io: Io = {
    cwd,
    color: false,
    stdout: (t) => out.push(t),
    stderr: (t) => out.push(t),
  };
  const code = await main([...args, '--no-cache'], io);
  return { code, text: out.join('\n') };
}

describe('the steps /setup.md gives an agent', () => {
  it('write the config and the baseline, then pass the check, and keep a config that is there', async () => {
    const root = demo();

    // Step 2: the config, a check of the project by rule, and the baseline.
    const init = await run(['init', '--yes'], root);
    expect(init.code).toBe(0);
    expect(init.text).toMatch(
      /Dry run of `onsystem check \.`: \d+ errors? and \d+ warnings? .* By rule: /,
    );
    expect(fs.existsSync(path.join(root, 'onsystem.config.json'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'onsystem.baseline.json'))).toBe(true);

    // Step 5: the check passes, since what is already there is in the baseline...
    expect((await run(['check', '.', '--require-design-system'], root)).code).toBe(0);
    // ...and --ignore-baseline lists each finding with its fix.
    const all = await run(['check', '.', '--ignore-baseline'], root);
    expect(all.code).toBe(1);
    expect(all.text).toContain('Use <Button> (import { Button } from "@/components/ui/button")');

    // "If it says a config already exists, keep that config: do not pass --force."
    const again = await run(['init', '--yes'], root);
    expect(again.code).toBe(2);
    expect(again.text).toContain('onsystem.config.json already exists');
  });

  it('record a baseline next to a config that has none, so the check passes', async () => {
    // The quickstart's step 1 has the user run `init`, which only offers the baseline.
    const root = demo(['onsystem.config.json']);
    expect(fs.existsSync(path.join(root, 'onsystem.config.json'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'onsystem.baseline.json'))).toBe(false);

    // Step 2: the config is kept, and nothing records the baseline...
    const init = await run(['init', '--yes'], root);
    expect(init.code).toBe(2);
    expect(init.text).toContain('onsystem.config.json already exists');
    expect(fs.existsSync(path.join(root, 'onsystem.baseline.json'))).toBe(false);
    // ...so the check fails on the findings already in the code ("1: errors not in the baseline").
    expect((await run(['check', '.', '--require-design-system'], root)).code).toBe(1);

    // "If there is no onsystem.baseline.json next to it, record the findings already in the code."
    const update = await run(['check', '.', '--update-baseline'], root);
    expect(update.code).toBe(0);
    expect(update.text).toMatch(
      /^Baseline: \d+ findings? in \d+ files? → onsystem\.baseline\.json/m,
    );
    expect(fs.existsSync(path.join(root, 'onsystem.baseline.json'))).toBe(true);

    // Step 5: the check passes.
    expect((await run(['check', '.', '--require-design-system'], root)).code).toBe(0);
  });

  it('say when zero config finds no design system, and take --components and --tokens', async () => {
    const root = fixture({
      'package.json': JSON.stringify({ name: 'app', dependencies: { react: '^19.0.0' } }),
      'src/kit/button.tsx':
        'export function Button(props: { variant?: "default" | "outline" }) {\n  return <button data-variant={props.variant} />;\n}\n',
      'src/styles.css': ':root {\n  --primary: #2563eb;\n}\n',
      'app/page.tsx': 'export default function Page() {\n  return <div />;\n}\n',
    });
    const none = await run(['init', '--yes'], root);
    expect(none.code).toBe(2);
    expect(none.text).toContain('zero config found no design system');
    const given = await run(
      ['init', '--yes', '--components', 'src/kit/**/*.tsx', '--tokens', 'src/styles.css'],
      root,
    );
    expect(given.code).toBe(0);
    expect(
      JSON.parse(fs.readFileSync(path.join(root, 'onsystem.config.json'), 'utf8')),
    ).toMatchObject({ components: ['src/kit/**/*.tsx'], tokens: ['src/styles.css'] });
  });
});
