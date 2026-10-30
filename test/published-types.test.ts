import fs from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';

import { build } from 'tsdown';
import { beforeAll, describe, expect, it } from 'vitest';

// The type declarations the package publishes import types from other packages: an install has
// those types only when `dependencies` (or a peer) brings them. `Oklch` from culori, which ships
// no types of its own, came from @types/culori, a devDependency, so a project with skipLibCheck
// off failed to typecheck on `import { defineConfig } from 'onsystem'` (TS7016), and with it on
// read those types as `any`. Built as it ships, into a folder of its own.
const REPO = path.resolve(import.meta.dirname, '..');
const OUT = path.join(REPO, 'node_modules/.cache/onsystem-published-types-test');
const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};

let declarations: Map<string, string>;

beforeAll(async () => {
  await build({
    cwd: REPO,
    config: false,
    entry: { index: 'src/index.ts', eslint: 'src/eslint/index.ts' },
    outDir: OUT,
    format: 'esm',
    platform: 'node',
    target: 'node22.18',
    fixedExtension: false,
    dts: true,
    publint: false,
    clean: true,
    logLevel: 'silent',
  });
  declarations = new Map(
    fs
      .readdirSync(OUT)
      .filter((file) => file.endsWith('.d.ts'))
      .map((file) => [file, fs.readFileSync(path.join(OUT, file), 'utf8')]),
  );
}, 120_000);

/** The package an import specifier names: `culori`, `@modelcontextprotocol/server`. */
function packageOf(specifier: string): string {
  const parts = specifier.split('/');
  return (specifier.startsWith('@') ? parts.slice(0, 2) : parts.slice(0, 1)).join('/');
}

/** Whether the installed package ships its own type declarations. */
function shipsTypes(name: string): boolean {
  const json = fs.readFileSync(path.join(REPO, 'node_modules', name, 'package.json'), 'utf8');
  const { types, typings } = JSON.parse(json) as { types?: string; typings?: string };
  return Boolean(types ?? typings) || /"types"\s*:/.test(json);
}

describe('the published type declarations', () => {
  it('import types only from packages an install brings with their types', () => {
    const imported = new Set<string>();
    for (const text of declarations.values()) {
      for (const match of text.matchAll(/(?:\bfrom\s+|\bimport\(\s*)["']([^"'.][^"']*)["']/g)) {
        const specifier = match[1] ?? '';
        if (specifier.startsWith('node:') || builtinModules.includes(specifier)) continue;
        imported.add(packageOf(specifier));
      }
    }
    // The build read the public entry points: the API's types come from these.
    expect(imported).toContain('culori');
    const installed = { ...pkg.dependencies, ...pkg.peerDependencies };
    for (const name of imported) {
      expect(installed, `${name} is imported by the declarations`).toHaveProperty([name]);
      if (shipsTypes(name)) continue;
      const types = `@types/${name.replace(/^@/, '').replace('/', '__')}`;
      expect(pkg.dependencies, `${name} ships no types: ${types}`).toHaveProperty([types]);
    }
  });
});
