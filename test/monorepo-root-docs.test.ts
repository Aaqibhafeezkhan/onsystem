import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { fixture } from './helpers.js';
import { section } from './markdown.js';

// docs/configuration.md#monorepo-roots: a root config and a root baseline apply to runs from the
// root, and not to runs from a project's folder. The hook's side, that it runs from the root
// when the root holds either file, is test/hook-monorepo-root.test.ts.

const roots = section(
  fs.readFileSync(path.join(import.meta.dirname, '../docs/configuration.md'), 'utf8'),
  'Monorepo roots',
);

const json = (value: unknown) => JSON.stringify(value, null, 2);

/** A pnpm monorepo with one app on its own components and tokens, and a palette color. */
function monorepo(extra: Record<string, string> = {}): string {
  return fixture({
    'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
    'package.json': json({ name: 'acme', private: true }),
    'apps/web/package.json': json({ name: 'web' }),
    'apps/web/components/ui/button.tsx':
      'export function Button(props: { children?: unknown }) { return <button /> }\n',
    'apps/web/app/globals.css': ':root {\n  --primary: oklch(0.55 0.2 260);\n}\n',
    'apps/web/app/page.tsx': 'export default () => <div className="bg-blue-500">Hi</div>;\n',
    ...extra,
  });
}

async function check(cwd: string, ...args: string[]) {
  const out: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: () => {} };
  const code = await main(['check', ...args, '--no-cache'], io);
  return { code, text: out.join('\n') };
}

describe('a root config and baseline (docs/configuration.md#monorepo-roots)', () => {
  it('say which runs read them', () => {
    expect(roots).toContain(
      'A root config and a root baseline apply to runs from the root: `check` there, and the Claude Code hook, which runs the check from the root when the root holds either file and has no design system of its own',
    );
    expect(roots).toContain(
      "A run from a project's folder reads neither: the CLI there, a GitHub Action job with `working-directory: apps/web`, and ESLint run per project",
    );
    // The hook no longer always runs from the project's folder.
    expect(roots).not.toContain('the same folder the Claude Code hook runs the check from');
  });

  it("apply the root config's rules from the root, not from the app's folder", async () => {
    const root = monorepo({
      'onsystem.config.json': json({ rules: { 'no-hardcoded-color': 'off' } }),
    });
    const fromRoot = await check(root, 'apps/web/app/page.tsx');
    expect(fromRoot.code).toBe(0);
    expect(fromRoot.text).not.toContain('no-hardcoded-color');
    const fromApp = await check(path.join(root, 'apps/web'), 'app/page.tsx');
    expect(fromApp.code).toBe(1);
    expect(fromApp.text).toContain('no-hardcoded-color');
  });

  it("apply the root baseline from the root, not from the app's folder", async () => {
    const root = monorepo();
    expect((await check(root, '.', '--update-baseline')).code).toBe(0);
    expect(fs.existsSync(path.join(root, 'onsystem.baseline.json'))).toBe(true);
    expect((await check(root, '.')).code).toBe(0);
    const fromApp = await check(path.join(root, 'apps/web'), '.');
    expect(fromApp.code).toBe(1);
    expect(fromApp.text).toContain('no-hardcoded-color');
  });
});
