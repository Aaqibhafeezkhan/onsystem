// The package in a project already on ESLint 8.57.1, the oldest ESLint its peer range admits.
// Packs the repository with `npm pack`, installs ESLint 8.57.1 into a new project outside the
// repository, then the tarball with plain npm, whose peer check stops the install (ERESOLVE) when
// the range leaves the project's ESLint out, and lints a page with ESLint 8 from a flat config
// with `onsystem.configs.recommended`, then fixes it with `--fix`.
// Run after `pnpm build` (`pnpm pack-test` runs it). Needs the npm registry.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ESLINT = '8.57.1';
const repo = path.resolve(import.meta.dirname, '..');
const windows = process.platform === 'win32';
assert.ok(
  fs.existsSync(path.join(repo, 'dist', 'eslint.js')),
  'dist/eslint.js is missing: run pnpm build first',
);

/** Runs a command, through the shell on Windows, where npm and the bin shims are .cmd files. */
function run(command, args, cwd, expected = [0]) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: windows,
    env: {
      ...process.env,
      NO_COLOR: '1',
      npm_config_audit: 'false',
      npm_config_fund: 'false',
      // npm's own peer check, whatever the machine's npm config says.
      npm_config_legacy_peer_deps: 'false',
      npm_config_strict_peer_deps: 'false',
      npm_config_force: 'false',
    },
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (!expected.includes(result.status ?? -1)) {
    throw new Error(
      `${command} ${args.join(' ')} exited ${result.status} in ${cwd}\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result;
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'onsystem-pack-eslint8-'));
try {
  // 1. Pack, as `npm publish` would.
  const packed = run('npm', ['pack', '--json', '--pack-destination', work], repo);
  const [info] = JSON.parse(packed.stdout.slice(packed.stdout.indexOf('[')));
  const tarball = path.join(work, info.filename);

  // 2. A shadcn/ui app on ESLint 8, with one component, a theme, a page with two problems and a
  //    flat config. The page is JSX, which ESLint's own parser reads.
  const app = path.join(work, 'app');
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(app, file)), { recursive: true });
    fs.writeFileSync(path.join(app, file), text);
  };
  write(
    'package.json',
    JSON.stringify({
      name: 'pack-test-eslint8-app',
      private: true,
      type: 'module',
      devDependencies: { eslint: ESLINT },
    }),
  );
  write(
    'tsconfig.json',
    JSON.stringify({ compilerOptions: { jsx: 'react-jsx', paths: { '@/*': ['./*'] } } }),
  );
  write(
    'components.json',
    JSON.stringify({ tailwind: { css: 'app/globals.css' }, aliases: { ui: '@/components/ui' } }),
  );
  write(
    'components/ui/button.tsx',
    'export function Button(props: { variant?: "default" | "destructive"; className?: string; children?: unknown }) { return <button className="bg-primary" /> }\n',
  );
  write(
    'app/globals.css',
    ':root { --primary: oklch(0.2 0 0); --destructive: oklch(0.58 0.22 27); }\n@theme inline { --color-primary: var(--primary); --color-destructive: var(--destructive); }\n',
  );
  write(
    'app/page.jsx',
    'import { Button } from "@/components/ui/button"\nexport default function Page() {\n  return <Button variant="danger" className="bg-[#ef4444]">Delete</Button>\n}\n',
  );
  write(
    'eslint.config.mjs',
    [
      "import onsystem from 'onsystem/eslint';",
      '',
      'export default [',
      "  { files: ['**/*.jsx'], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },",
      '  onsystem.configs.recommended,',
      '];',
      '',
    ].join('\n'),
  );

  // 3. ESLint 8 first, then the package, as `npm install --save-dev onsystem` adds it.
  run('npm', ['install', '--no-package-lock'], app);
  run('npm', ['install', '--save-dev', '--no-package-lock', tarball], app);
  const eslint = (...args) => run('npx', ['--no-install', 'eslint', ...args], app, [0, 1]);
  assert.equal(eslint('--version').stdout.trim(), `v${ESLINT}`);
  console.log(`npm install --save-dev ${info.filename} next to eslint@${ESLINT}: installed`);

  // 4. The plugin's findings, as ESLint 8 reports them, and its fixes.
  const linted = eslint('app', '--format', 'json');
  assert.equal(linted.status, 1, `ESLint exits 1 on errors\n${linted.stderr}`);
  const rules = JSON.parse(linted.stdout)
    .flatMap((r) => r.messages.map((m) => m.ruleId))
    .sort();
  assert.deepEqual(rules, ['onsystem/no-hardcoded-color', 'onsystem/no-unknown-variant']);
  console.log(`ESLint ${ESLINT}: ${rules.join(', ')}`);

  const fixed = eslint('app', '--fix');
  assert.equal(fixed.status, 0, `ESLint --fix leaves nothing to report\n${fixed.stdout}`);
  assert.match(
    fs.readFileSync(path.join(app, 'app', 'page.jsx'), 'utf8'),
    /<Button variant="destructive" className="bg-destructive">/,
  );
  console.log(`ESLint ${ESLINT} --fix: fixed both`);

  console.log('\npack test on ESLint 8 passed');
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
