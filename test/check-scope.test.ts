import fs from 'node:fs';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { createServer } from '../src/server/index.js';
import { DEMO_ROOT, fixture, load } from './helpers.js';

// What `check` and `check_ui` read: JS and TS files. A CSS, Markdown or JSON file named outright
// (`check $(git diff --name-only)`, lint-staged's `"*"`, an agent's check_ui on globals.css) was
// parsed as TSX and gave hundreds of syntax errors. And a JavaScript app, whose pages hold JSX in
// `.js` files (Next.js's JavaScript template writes app/page.js), had nothing checked by
// `check .`, which passed with --require-design-system.

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

const BUTTON_JSX = 'export function Button(props) {\n  return <button {...props} />;\n}\n';
const BUTTON_TSX =
  'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }';
const GLOBALS = fs.readFileSync(path.join(DEMO_ROOT, 'app/globals.css'), 'utf8');
const PAGE_JS = `import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <div className="bg-[#ef4444] p-[13px]">
      <button>Go</button>
      <Button>Go</Button>
    </div>
  );
}
`;

/** A JavaScript app: shadcn/ui's tsx:false components (.jsx) and pages in .js files. */
function jsApp(extra: Record<string, string> = {}): string {
  return fixture({
    'components/ui/button.jsx': BUTTON_JSX,
    'app/globals.css': GLOBALS,
    'app/page.js': PAGE_JS,
    'next.config.js': 'module.exports = { reactStrictMode: true };\n',
    'jsconfig.json': JSON.stringify({ compilerOptions: { paths: { '@/*': ['./*'] } } }),
    ...extra,
  });
}

describe('check: files that are not JS or TS', () => {
  const project = () =>
    fixture({
      'components/ui/button.tsx': BUTTON_TSX,
      'app/globals.css': GLOBALS,
      'app/page.tsx': 'export default () => <button className="bg-[#ef4444]">Go</button>',
      'README.md': '# App\n\nRun `pnpm dev`, then open <http://localhost:3000>.\n',
      'package.json': '{ "name": "app", "private": true }\n',
      'app/Page.module.SCSS': '.page { color: red; }\n',
    });

  it('skips them when named outright, and says how many', async () => {
    const root = project();
    const named = [
      'README.md',
      'app/globals.css',
      'package.json',
      'app/Page.module.SCSS',
      'app/page.tsx',
    ];
    const json = await run(['check', ...named, '--format', 'json', '--no-cache'], root);
    const results = JSON.parse(json.stdout) as {
      file: string;
      diagnostics: { ruleId: string }[];
    }[];
    expect(results.map((r) => r.file)).toEqual(['app/page.tsx']);
    expect(results.flatMap((r) => r.diagnostics.map((d) => d.ruleId))).not.toContain('syntax');

    const pretty = await run(['check', ...named, '--no-cache'], root);
    expect(pretty.code).toBe(1);
    expect(pretty.stdout.split('\n').find((line) => /^\d+ errors?,/.test(line))).toBe(
      '2 errors, 0 warnings in 1 file (4 files that are not JS or TS skipped)',
    );
  });

  it('has nothing to check when no file named is JS or TS, and passes', async () => {
    const root = project();
    const result = await run(['check', 'README.md', 'app/globals.css', '--no-cache'], root);
    expect(result).toEqual({
      code: 0,
      stdout: 'Nothing to check: 2 files that are not JS or TS skipped.',
      stderr: '',
    });
    // A pull request that changes only styles and docs has no UI code to check: the gate is
    // about the design system and the folders checked, not about the files a diff names.
    const gated = await run(
      ['check', 'README.md', '--require-design-system', '--format', 'json', '--no-cache'],
      root,
    );
    expect(gated).toEqual({ code: 0, stdout: '[]', stderr: '' });
  });

  it('skips them when a glob matches them, and fails the gate when nothing else matches', async () => {
    const root = project();
    // A glob that matches only styles has no UI code to check.
    const css = await run(['check', 'app/**/*.css', '--no-cache'], root);
    expect(css).toEqual({
      code: 0,
      stdout: 'Nothing to check: 1 file that is not JS or TS skipped.',
      stderr: '',
    });
    // In CI that glob points at the wrong code, as a folder with nothing to check does.
    const gated = await run(['check', 'app/**/*.css', '--require-design-system'], root);
    expect(gated).toEqual({
      code: 2,
      stdout: '',
      stderr:
        'check --require-design-system: nothing was checked (1 file that is not JS or TS skipped).',
    });

    // Every file: the page is checked, the rest counted, and no syntax error from the others.
    const everything = await run(['check', '**/*', '--format', 'json', '--no-cache'], root);
    const results = JSON.parse(everything.stdout) as {
      file: string;
      diagnostics: { ruleId: string }[];
    }[];
    expect(results.map((r) => r.file)).toEqual(['app/page.tsx']);
    expect(results.flatMap((r) => r.diagnostics.map((d) => d.ruleId))).not.toContain('syntax');
    const pretty = await run(['check', '**/*', '--no-cache'], root);
    expect(pretty.stdout).not.toContain('syntax');
    expect(pretty.stdout.split('\n').at(-1)).toBe(
      '2 errors, 0 warnings in 1 file (1 design-system file skipped; 4 files that are not JS or TS skipped)',
    );
    // A file both named and matched by a glob is counted once.
    const both = await run(['check', 'app/globals.css', 'app/**/*.css', '--no-cache'], root);
    expect(both.stdout).toBe('Nothing to check: 1 file that is not JS or TS skipped.');
  });

  it('still checks .ts, .js, .mjs and .cjs files named outright', async () => {
    const root = fixture({
      'components/ui/button.tsx': BUTTON_TSX,
      'app/globals.css': GLOBALS,
      'lib/tone.ts': 'export const tone = "bg-[#ef4444]";\n',
      'app/page.js': PAGE_JS,
      'app/page.mjs': PAGE_JS,
      'app/page.cjs': PAGE_JS,
    });
    const json = await run(
      ['check', 'lib/tone.ts', 'app/page.js', 'app/page.mjs', 'app/page.cjs', '--format', 'json'],
      root,
    );
    const results = JSON.parse(json.stdout) as { file: string }[];
    expect(results.map((r) => r.file)).toEqual([
      'app/page.cjs',
      'app/page.js',
      'app/page.mjs',
      'lib/tone.ts',
    ]);
  });
});

describe('check: JSX in .js files', () => {
  it("says that a folder's .js files with JSX were not checked, and how to check them", async () => {
    const root = jsApp();
    // It takes the place of --include-design-system's hint, which would check the button and
    // pass with the page still unchecked.
    expect(await run(['check', '.', '--no-cache'], root)).toEqual({
      code: 0,
      stdout:
        'Nothing to check: 1 design-system file skipped. app/page.js has JSX, but folders are checked for .tsx and .jsx files, so it was not checked. Name it to check it: `check . "**/*.js"`.',
      stderr: '',
    });
    // The command the notice gives checks it.
    const named = await run(['check', '.', '**/*.js', '--no-cache'], root);
    expect(named.code).toBe(1);
    expect(named.stdout).toContain('app/page.js');
    expect(named.stdout).toContain('Hardcoded color `bg-[#ef4444]`');
    expect(named.stdout).not.toContain('has JSX');
  });

  it('counts them next to the files it checked, and leaves out what folders leave out', async () => {
    const root = jsApp({
      'app/about/page.tsx': 'export default () => <p>About</p>',
      'app/blog/page.js': PAGE_JS,
      'app/contact/page.js': PAGE_JS,
      'app/page.test.js': PAGE_JS,
      'app/legacy/page.js': PAGE_JS,
      'onsystem.config.json': JSON.stringify({
        exclude: ['**/*.test.{js,jsx,ts,tsx}', 'app/legacy/**'],
      }),
      // A .js file without JSX is no page: not counted.
      'app/lib/format.js': 'export const format = (n) => `${n} items`;\n',
    });
    const result = await run(['check', 'app', '--no-cache'], root);
    expect(result.code).toBe(0);
    expect(result.stdout.split('\n')).toEqual([
      'No problems in 1 file.',
      '3 .js files have JSX (app/blog/page.js, app/contact/page.js and app/page.js), but folders are checked for .tsx and .jsx files, so they were not checked. Name them to check them: `check app "app/**/*.js"`.',
    ]);
    // On stderr with JSON, and as a workflow warning with --format github.
    const json = await run(['check', 'app', '--format', 'json', '--no-cache'], root);
    expect(JSON.parse(json.stdout)).toHaveLength(1);
    expect(json.stderr).toContain('3 .js files have JSX');
    const github = await run(['check', 'app', '--format', 'github', '--no-cache'], root);
    expect(github.stdout).toMatch(/^::warning title=onsystem::3 \.js files have JSX/m);
  });

  it('fails --require-design-system when a folder leaves nothing to check', async () => {
    const root = jsApp();
    const gated = await run(
      ['check', '.', '--require-design-system', '--format', 'github', '--no-cache'],
      root,
    );
    expect(gated.code).toBe(2);
    expect(gated.stdout).toBe('');
    // One line, which is all the GitHub Action's error annotation shows: what to name, not
    // --include-design-system, which would pass with the page still unchecked.
    expect(gated.stderr).toBe(
      'check --require-design-system: nothing was checked (1 design-system file skipped). app/page.js has JSX, but folders are checked for .tsx and .jsx files, so it was not checked. Name it to check it: `check . "**/*.js"`.',
    );
    // With the pages named, it checks them and fails on their findings, not on the gate.
    const named = await run(
      ['check', '.', '**/*.js', '--require-design-system', '--format', 'json', '--no-cache'],
      root,
    );
    expect(named.code).toBe(1);

    // A design-system package checked on its own: nothing but its own files.
    const ui = fixture({ 'components/ui/button.tsx': BUTTON_TSX, 'app/globals.css': GLOBALS });
    const own = await run(['check', '.', '--require-design-system', '--no-cache'], ui);
    expect(own).toEqual({
      code: 2,
      stdout: '',
      stderr:
        'check --require-design-system: nothing was checked (1 design-system file skipped). Pass --include-design-system to check it.',
    });
  });
});

describe('check: a folder of .js pages', () => {
  const LAYOUT_JS = `export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

  it('names them when the folder has no .tsx or .jsx file, and still exits 2', async () => {
    const root = jsApp({ 'app/layout.js': LAYOUT_JS });
    const expected = {
      code: 2,
      stdout: '',
      stderr:
        'check: nothing to check in app. 2 .js files have JSX (app/layout.js and app/page.js), but folders are checked for .tsx and .jsx files, so they were not checked. Name them to check them: `check app "app/**/*.js"`.',
    };
    expect(await run(['check', 'app', '--no-cache'], root)).toEqual(expected);
    expect(await run(['check', 'app', '--format', 'json', '--no-cache'], root)).toEqual(expected);
    // The command it gives checks them.
    const named = await run(
      ['check', 'app', 'app/**/*.js', '--format', 'json', '--no-cache'],
      root,
    );
    expect((JSON.parse(named.stdout) as { file: string }[]).map((r) => r.file)).toEqual([
      'app/layout.js',
      'app/page.js',
    ]);
    // A folder with no page at all is still a folder that matches nothing.
    const empty = jsApp({ 'lib/format.js': 'export const format = (n) => `${n} items`;\n' });
    expect(await run(['check', 'lib', '--no-cache'], empty)).toEqual({
      code: 2,
      stdout: '',
      stderr: 'check: no files match lib',
    });
  });

  it('finds JSX as pages write it, and not in bundles, minified files or HTML in strings', async () => {
    const big = `export const data = ${JSON.stringify('x'.repeat(600 * 1024))};\nexport default () => <p>Big</p>;\n`;
    const root = jsApp({
      // Before the element: a comment, an arrow, a generic call in its props, a fragment.
      'app/a/page.js':
        'export default function A() {\n  return (\n    // A comment first\n    <div className="p-[13px]" />\n  );\n}\n',
      'app/b/page.js': 'export const B = ({ children }) => <section>{children}</section>;\n',
      'app/c/page.js':
        'export default function C(props) {\n  return <Field {...useField(props)} count={props.a < props.b ? 1 : 2} />;\n}\n',
      'app/d/page.js': 'export default () => (\n  <>\n    <h1>D</h1>\n  </>\n);\n',
      // Not pages: HTML in strings and comments, a named regex group, a minified file and one
      // over 512 KB.
      'app/vendor/escape.js':
        '// e.g. <del>abc</del>\nconst re = /(?<tag>[a-z]+)/;\nexport const html = "(<b>bold</b>)" + \'<br/>\';\nexport const lt = (a, b) => a < b;\n',
      'app/vendor/lib.min.js': 'export default () => <p>min</p>;\n',
      'app/vendor/big.js': big,
    });
    const result = await run(['check', 'app', '--no-cache'], root);
    expect(result.stderr).toBe(
      'check: nothing to check in app. 5 .js files have JSX (app/a/page.js, app/b/page.js, app/c/page.js and 2 more), but folders are checked for .tsx and .jsx files, so they were not checked. Name them to check them: `check app "app/**/*.js"`.',
    );
    const json = await run(['check', '.', '--format', 'json', '--no-cache'], root);
    expect(json.stderr).toContain('5 .js files have JSX');
  });

  it.skipIf(process.platform === 'win32' || process.getuid?.() === 0)(
    'leaves out a .js file it cannot read',
    async () => {
      const root = jsApp({ 'app/locked.js': 'export default () => <p>Locked</p>;\n' });
      fs.chmodSync(path.join(root, 'app/locked.js'), 0o000);
      try {
        expect(await run(['check', '.', '--no-cache'], root)).toEqual({
          code: 0,
          stdout:
            'Nothing to check: 1 design-system file skipped. app/page.js has JSX, but folders are checked for .tsx and .jsx files, so it was not checked. Name it to check it: `check . "**/*.js"`.',
          stderr: '',
        });
      } finally {
        fs.chmodSync(path.join(root, 'app/locked.js'), 0o644);
      }
    },
  );
});

describe('check at a monorepo root', () => {
  const json = (value: unknown) => JSON.stringify(value);
  const monorepo = () =>
    fixture({
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
      'package.json': json({ name: 'acme', private: true }),
      'apps/web/package.json': json({ name: '@acme/web' }),
      'apps/web/components.json': json({ tsx: false, aliases: { ui: '@/components/ui' } }),
      'apps/web/jsconfig.json': json({ compilerOptions: { paths: { '@/*': ['./*'] } } }),
      'apps/web/components/ui/button.jsx': BUTTON_JSX,
      'apps/web/app/globals.css': GLOBALS,
      'apps/web/app/page.js': PAGE_JS,
      'apps/web/app/page.test.js': PAGE_JS,
      'apps/web/README.md': '# Web\n\nOpen <http://localhost:3000>.\n',
    });

  it('names the .js files with JSX of each project, and skips named files that are not JS or TS', async () => {
    const root = monorepo();
    expect(await run(['check', '.', '--no-cache'], root)).toMatchObject({
      code: 0,
      stdout:
        'Nothing to check: 1 design-system file skipped. apps/web/app/page.js has JSX, but folders are checked for .tsx and .jsx files, so it was not checked. Name it to check it: `check . "**/*.js"`.',
    });
    // A folder with nothing but .js pages.
    expect(await run(['check', 'apps/web/app', '--no-cache'], root)).toEqual({
      code: 2,
      stdout: '',
      stderr:
        'check: nothing to check in apps/web/app. apps/web/app/page.js has JSX, but folders are checked for .tsx and .jsx files, so it was not checked. Name it to check it: `check apps/web/app "apps/web/app/**/*.js"`.',
    });
    expect((await run(['check', '.', '--require-design-system', '--no-cache'], root)).code).toBe(2);
    const named = await run(
      ['check', 'apps/web/README.md', 'apps/web/app/page.js', '--format', 'json', '--no-cache'],
      root,
    );
    expect((JSON.parse(named.stdout) as { file: string }[]).map((r) => r.file)).toEqual([
      'apps/web/app/page.js',
    ]);
    // A glob that matches every file checks the JS and TS ones, each in its own project.
    const everything = await run(['check', '**/*', '--no-cache'], root);
    expect(everything.stdout).not.toContain('syntax');
    expect(everything.stdout.split('\n').at(-1)).toBe(
      '2 errors, 1 warning in 1 file (1 design-system file skipped; 1 test or story left out; 7 files that are not JS or TS skipped)',
    );
  });
});

describe('check_ui: files that are not JS or TS', () => {
  async function connect(root: string) {
    const ds = await load(root);
    const server = createServer({ getDesignSystem: () => Promise.resolve(ds) });
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    return client;
  }
  const text = (result: CallToolResult) =>
    result.content.map((c) => (c.type === 'text' ? c.text : '')).join('');

  it('returns an error for a path or filename that is not JS or TS', async () => {
    const client = await connect(DEMO_ROOT);
    const css = (await client.callTool({
      name: 'check_ui',
      arguments: { path: 'app/globals.css' },
    })) as CallToolResult;
    expect(css.isError).toBe(true);
    expect(text(css)).toBe(
      'check_ui checks .tsx, .jsx, .ts and .js files; app/globals.css is not one, so it was not checked.',
    );
    const vue = (await client.callTool({
      name: 'check_ui',
      arguments: { code: '<template><button>x</button></template>', filename: 'x.vue' },
    })) as CallToolResult;
    expect(vue.isError).toBe(true);
    expect(text(vue)).toContain('x.vue is not one');
    // Only real extensions: `.mts` is TypeScript, `.mtsx` and `.cjsx` are not.
    for (const filename of ['x.mtsx', 'x.cjsx']) {
      const made = (await client.callTool({
        name: 'check_ui',
        arguments: { code: '<button>x</button>', filename },
      })) as CallToolResult;
      expect(text(made)).toContain(`${filename} is not one`);
    }
    const mts = (await client.callTool({
      name: 'check_ui',
      arguments: { code: 'export const tone = "bg-[#ef4444]";', filename: 'lib/tone.mts' },
    })) as CallToolResult;
    expect(mts.isError).toBeFalsy();
    expect(mts.structuredContent).toMatchObject({ file: 'lib/tone.mts' });
    // JS and TS files are checked as before.
    const page = (await client.callTool({
      name: 'check_ui',
      arguments: { path: 'app/settings/danger-zone.tsx' },
    })) as CallToolResult;
    expect(page.isError).toBeFalsy();
    expect(page.structuredContent).toMatchObject({ ok: false });
    const js = (await client.callTool({
      name: 'check_ui',
      arguments: { code: '<button>x</button>', filename: 'app/page.js' },
    })) as CallToolResult;
    expect(js.structuredContent).toMatchObject({ ok: false, file: 'app/page.js' });
    await client.close();
  });
});
