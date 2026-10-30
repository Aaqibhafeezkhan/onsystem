import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { ESLint, type Linter } from 'eslint';
import { build } from 'tsdown';
import tseslint from 'typescript-eslint';
import { beforeAll, describe, expect, it } from 'vitest';

import { fixture } from './helpers.js';

// The ESLint plugin waits for its loader worker to answer. A worker that stopped before it
// answered (`process.exit()` in a config written in code) left every lint waiting the bridge's
// whole timeout, 120 seconds, and then blamed a slow load. Built as it ships, into a folder of
// its own, as in eslint-bridge.test.ts, since test files run in parallel.
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

describe('a loader worker that stops before it answers', () => {
  it('fails the lint at once, saying so', async () => {
    const root = fixture({
      'onsystem.config.mjs': 'process.exit(1);\nexport default {};\n',
      'components/ui/button.tsx':
        'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }',
      'app/page.tsx': 'export default () => <div className="bg-[#ff0000]">Hi</div>\n',
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
    const [result] = await eslint.lintFiles(['app/page.tsx']);
    expect(Date.now() - started).toBeLessThan(30_000);
    expect(result?.messages.map((m) => m.message)).toEqual([
      "onsystem could not check this file: the design system's loader stopped before it answered (exit code 1)",
    ]);
  }, 150_000);
});
