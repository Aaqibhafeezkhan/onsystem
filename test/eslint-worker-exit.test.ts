import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { ESLint, type Linter } from 'eslint';
import { build } from 'tsdown';
import tseslint from 'typescript-eslint';
import { beforeAll, describe, expect, it } from 'vitest';

import { fixture } from './helpers.js';

// The ESLint plugin waits for its loader worker to answer. A worker that stopped before it
// answered (`process.exit()` in a config written in code, an uncaught error) left every file of
// the lint waiting the bridge's whole timeout, 120 seconds, and then blamed a slow load. Built as
// it ships, into a folder of its own, as in eslint-bridge.test.ts, since test files run in
// parallel.
const REPO = path.resolve(import.meta.dirname, '..');
const OUT = path.join(REPO, 'node_modules/.cache/onsystem-eslint-worker-exit-test');

let onsystem: { configs: { recommended: Linter.Config } };

beforeAll(async () => {
  await build({
    cwd: REPO,
    config: false,
    entry: { eslint: 'src/eslint/index.ts', 'eslint-worker': 'src/eslint/worker.ts' },
    outDir: OUT,
    format: 'esm',
    platform: 'node',
    target: 'node22.18',
    fixedExtension: false,
    dts: false,
    publint: false,
    clean: true,
    logLevel: 'silent',
  });
  ({ default: onsystem } = (await import(pathToFileURL(path.join(OUT, 'eslint.js')).href)) as {
    default: typeof onsystem;
  });
});

const STOPPED =
  "onsystem could not check this file: the design system's loader stopped before it answered";

describe('a loader worker that stops before it answers', () => {
  // Each file of the run: the worker's `exit` event reaches the bridge only after ESLint has
  // moved on to the next file, so that file used to wait on the stopped worker.
  it.each([
    ['process.exit()', 'process.exit(1);\nexport default {};\n', ' (exit code 1)'],
    [
      'an uncaught error',
      'setImmediate(() => { throw new Error("boom in config") });\nawait new Promise((r) => setTimeout(r, 1000));\nexport default {};\n',
      ': boom in config',
    ],
    [
      'an unhandled rejection',
      'Promise.reject(new Error("unhandled in config"));\nawait new Promise((r) => setTimeout(r, 1000));\nexport default {};\n',
      ': unhandled in config',
    ],
  ])(
    'fails every file at once after %s, saying why',
    async (_, config, why) => {
      const root = fixture({
        'onsystem.config.mjs': config,
        'components/ui/button.tsx':
          'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }',
        'app/a.tsx': 'export default () => <div className="bg-[#ff0000]">Hi</div>\n',
        'app/b.tsx': 'export default () => <div className="bg-[#00ff00]">Hi</div>\n',
        'app/c.tsx': 'export default () => <div className="bg-[#0000ff]">Hi</div>\n',
      });
      const eslint = new ESLint({
        cwd: root,
        overrideConfigFile: true,
        overrideConfig: [
          { files: ['**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser } },
          onsystem.configs.recommended,
        ],
      });
      const started = Date.now();
      const results = await eslint.lintFiles(['app/a.tsx', 'app/b.tsx', 'app/c.tsx']);
      expect(Date.now() - started).toBeLessThan(30_000);
      expect(results.map((r) => r.messages.map((m) => m.message))).toEqual([
        [`${STOPPED}${why}`],
        [`${STOPPED}${why}`],
        [`${STOPPED}${why}`],
      ]);
    },
    400_000,
  );

  // A file posted while the worker is busy, which then stops before it reads it: the call is
  // still on the worker's port, not among those it is answering.
  it('fails a file it never read, posted while it was busy', async () => {
    const root = fixture({
      // Busy for 3 seconds once the test writes `stop`, then gone.
      'onsystem.config.mjs': `import fs from "node:fs";
const stop = new URL("./stop", import.meta.url);
const timer = setInterval(() => {
  if (!fs.existsSync(stop)) return;
  clearInterval(timer);
  const end = Date.now() + 3000;
  while (Date.now() < end);
  process.exit(3);
}, 20);
export default {};
`,
      'components/ui/button.tsx':
        'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }',
      'app/a.tsx': 'export default () => <div className="bg-[#ff0000]">Hi</div>\n',
      'app/b.tsx': 'export default () => <div className="bg-[#00ff00]">Hi</div>\n',
    });
    const eslint = new ESLint({
      cwd: root,
      overrideConfigFile: true,
      overrideConfig: [
        { files: ['**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser } },
        onsystem.configs.recommended,
      ],
    });
    const [a] = await eslint.lintFiles(['app/a.tsx']);
    expect(a?.messages.map((m) => m.message)).toEqual([]);
    fs.writeFileSync(path.join(root, 'stop'), '');
    await new Promise((resolve) => setTimeout(resolve, 500));
    const started = Date.now();
    const [b] = await eslint.lintFiles(['app/b.tsx']);
    expect(Date.now() - started).toBeLessThan(30_000);
    expect(b?.messages.map((m) => m.message)).toEqual([`${STOPPED} (exit code 3)`]);
  }, 200_000);
});
