import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// The ESLint versions the plugin (`onsystem/eslint`) runs on, as package.json declares them and
// the docs name them. npm checks an optional peer whenever the project already has that package,
// so a range that leaves out the project's ESLint stops `npm install --save-dev onsystem` with
// ERESOLVE, for the CLI and the GitHub Action too, which need no ESLint. The plugin needs a flat
// config and `context.sourceCode`, `filename` and `cwd`, which ESLint 8.57 has; `pnpm pack-test`
// installs the package with npm into a project on ESLint 8.57.0 and lints with it there.
const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json')) as {
  peerDependencies: Record<string, string>;
  peerDependenciesMeta: Record<string, { optional?: boolean }>;
  devDependencies: Record<string, string>;
};
const range = pkg.peerDependencies.eslint ?? '';

/** The lowest version a `>=x.y.z` range admits. */
function minimum(spec: string): number[] {
  const match = /^>=(\d+)\.(\d+)\.(\d+)$/.exec(spec);
  if (!match) throw new Error(`expected a ">=x.y.z" range, got "${spec}"`);
  return match.slice(1).map(Number);
}

const order = ([major = 0, minor = 0, patch = 0]: number[]) =>
  (major * 1000 + minor) * 1000 + patch;

const admits = (version: string) => order(version.split('.').map(Number)) >= order(minimum(range));

describe('the ESLint peer', () => {
  it('admits ESLint 8.57, the oldest version the plugin runs on', () => {
    expect(admits('8.57.0')).toBe(true);
    expect(admits('8.57.1')).toBe(true);
    expect(admits('8.56.0')).toBe(false);
  });

  it('admits every ESLint the plugin is tested on', () => {
    const tested = [
      // test/eslint.test.ts: the latest, and ESLint 9 through an alias.
      (JSON.parse(read('node_modules/eslint/package.json')) as { version: string }).version,
      /^npm:eslint@(.+)$/.exec(pkg.devDependencies['eslint-v9'] ?? '')?.[1],
      // pnpm pack-test: an npm install next to ESLint 8.
      /^const ESLINT = '(.+)';$/m.exec(read('scripts/pack-test-eslint8.mjs'))?.[1],
    ];
    for (const version of tested) expect(version && admits(version), version).toBe(true);
  });

  it('stays optional, since only the ESLint plugin needs it', () => {
    expect(pkg.peerDependenciesMeta.eslint?.optional).toBe(true);
  });

  it('is the oldest version the README and the ESLint docs name', () => {
    const [major, minor] = minimum(range);
    const oldest = `for ESLint ${String(major)}.${String(minor)}, `;
    expect(read('README.md')).toContain(oldest);
    expect(read('docs/eslint.md')).toContain(oldest);
  });

  // The range follows the context API the plugin uses, not a version it imports. This reads the
  // plugin's own sources; `pnpm pack-test` follows the built files' imports of each other.
  it('is not imported at runtime by the plugin', () => {
    const dir = path.join(root, 'src/eslint');
    const files = fs
      .readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name))
      .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)));
    expect(files).toContain('index.ts');
    for (const file of files) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      const statements =
        source.match(/^(?:import|export)\s[^;]*?from\s+['"]eslint(?:\/[^'"]*)?['"]/gm) ?? [];
      for (const statement of statements)
        expect(statement, file).toMatch(/^(?:import|export) type /);
      expect(source, file).not.toMatch(/^import\s+['"]eslint(?:\/[^'"]*)?['"]/m);
      expect(source, file).not.toMatch(/\b(?:import|require)\(\s*['"]eslint(?:\/|['"])/);
    }
  });
});
