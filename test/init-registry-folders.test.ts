import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { fixture, TSCONFIG } from './helpers.js';

// `init` in a shadcn/ui app: the folders `npx shadcn add` fills from the registries
// components.json names (`@signoff-ui` → components/signoff-ui) go into the "components" it
// writes, next to components/ui, as docs/configuration.md#code-from-shadcn-registries advises.
// Without them, the first `check .` reports that code as the app's, the baseline records it, and
// the next `shadcn add` breaks the baseline again.

const json = (value: unknown) => JSON.stringify(value, null, 2);

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

type Results = { file: string; diagnostics: { ruleId: string; message: string }[] }[];

async function check(cwd: string, ...paths: string[]) {
  const { code, stdout } = await run(
    ['check', ...(paths.length ? paths : ['.']), '--format', 'json', '--no-cache'],
    cwd,
  );
  const results = JSON.parse(stdout) as Results;
  return {
    code,
    reported: results
      .filter((r) => r.diagnostics.length)
      .map((r) => r.file)
      .sort(),
    messages: results.flatMap((r) => r.diagnostics.map((d) => d.message)),
  };
}

const written = (root: string) =>
  JSON.parse(fs.readFileSync(path.join(root, 'onsystem.config.json'), 'utf8')) as Record<
    string,
    unknown
  >;

const DIFF_REVIEW = 'components/signoff-ui/diff-review.tsx';
const MESSAGE = 'components/ai-elements/message.tsx';
const DOCK = 'components/Dock.tsx';
const PAGE = 'app/page.tsx';
const LINK = 'https://onsystem.vercel.app/docs/configuration#code-from-shadcn-registries';

/**
 * A shadcn/ui app with items from three registries, as `npx shadcn add @<namespace>/<item>`
 * leaves it: signoff-ui and AI Elements in folders of their own, React Bits loose in components/.
 */
function app(dir = '', registries: Record<string, unknown> | null = REGISTRIES) {
  const at = (file: string) => (dir ? `${dir}/${file}` : file);
  return {
    'package.json': json({ name: 'app' }),
    'tsconfig.json': dir
      ? json({ compilerOptions: { jsx: 'react-jsx', paths: { '@/*': [`./${dir}/*`] } } })
      : TSCONFIG,
    'components.json': json({
      style: 'new-york',
      tsx: true,
      tailwind: { css: at('app/globals.css') },
      aliases: { components: '@/components', ui: '@/components/ui', utils: '@/lib/utils' },
      ...(registries ? { registries } : {}),
    }),
    [at('app/globals.css')]: ':root {\n  --primary: oklch(0.2 0 0);\n  --radius: 0.5rem;\n}\n',
    [at('components/ui/button.tsx')]:
      'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }\n',
    [at(DIFF_REVIEW)]: `export interface DiffReviewProps { files: string[]; onAccept?: () => void }

/** Review an agent's file changes, hunk by hunk. */
export function DiffReview({ files, onAccept }: DiffReviewProps) {
  return (
    <div className="rounded-[7px]">
      <textarea aria-label="Comment" />
      <button className="bg-[#123456] px-3" onClick={onAccept}>Accept {files.length}</button>
    </div>
  )
}
`,
    [at(MESSAGE)]: `/** A chat message. */
export function Message({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#f4f4f5] p-[3px]">{children}<button>Copy</button></div>
}
`,
    [at(DOCK)]:
      'export default function Dock() { return <nav className="bg-[#060010]"><button>Home</button></nav> }\n',
    [at(PAGE)]: `import { DiffReview } from "@/components/signoff-ui/diff-review"

export default function Page() {
  return (
    <main>
      <DiffReview files={[]} tone="danger" />
      <button className="bg-[#ef4444]">Go</button>
    </main>
  )
}
`,
  };
}

const REGISTRIES = {
  '@signoff-ui': 'https://signoff-ui.vercel.app/r/{name}.json',
  '@ai-elements': { url: 'https://registry.ai-sdk.dev/{name}.json' },
  '@react-bits': 'https://reactbits.dev/r/{name}-TS-TW.json',
};

describe('init writes the folders shadcn add fills from other registries', () => {
  it('adds them to "components", so check, the hook and the baseline leave that code alone', async () => {
    const root = fixture(app());
    const init = await run(['init', '--yes', '--no-cache'], root);
    expect(init.code).toBe(0);
    expect(written(root)).toEqual({
      $schema: 'https://unpkg.com/onsystem/schema.json',
      components: [
        'components/ui/**/*.{tsx,jsx}',
        'components/ai-elements/**/*.{tsx,jsx}',
        'components/signoff-ui/**/*.{tsx,jsx}',
      ],
      tokens: ['app/globals.css'],
    });
    expect(init.stdout).toContain(
      `Added components/ai-elements (@ai-elements, 1 file) and components/signoff-ui (@signoff-ui, 1 file) to "components": they hold the code \`shadcn add\` copied from those registries in components.json. \`check\` and the hook skip it as design-system code, and your code is checked against its components. To check it as your own code instead, take the folders out of "components" (${LINK}).`,
    );
    // React Bits puts its files loose in components/, which the config cannot tell apart.
    expect(init.stdout).toContain(
      `components.json also names @react-bits, and no .tsx or .jsx file is in components/react-bits: \`check\` reads what \`shadcn add\` copies from it into other folders as your own code (${LINK}).`,
    );
    // The dry run and the baseline hold the app's findings only, and React Bits' loose file.
    expect(init.stdout).toContain('Baseline: 5 findings in 2 files');
    expect(init.stdout).not.toContain('signoff-ui/diff-review');

    const after = await check(root);
    expect(after.code).toBe(0);
    // The registry folders are design-system files: the hook names the file it edited.
    expect(await check(root, DIFF_REVIEW, MESSAGE)).toEqual({
      code: 0,
      reported: [],
      messages: [],
    });
    // Without the baseline, the app is checked against signoff-ui's components.
    fs.rmSync(path.join(root, 'onsystem.baseline.json'));
    const own = await check(root);
    expect(own.reported).toEqual([PAGE, DOCK]);
    expect(own.messages).toContain('<DiffReview> has no prop "tone".');
  });

  it('keeps the baseline when the next shadcn add brings a primitive the registry code uses', async () => {
    const root = fixture(app());
    expect((await run(['init', '--yes', '--no-cache'], root)).code).toBe(0);
    expect((await check(root)).code).toBe(0);
    // `shadcn add @ai-elements/prompt-input` adds components/ui/textarea.tsx, so the native
    // <textarea> in untouched signoff-ui code has a design-system component now, and
    // `@signoff-ui/run-meter` brings an arbitrary radius.
    fs.writeFileSync(
      path.join(root, 'components/ui/textarea.tsx'),
      'export function Textarea(props: React.ComponentProps<"textarea">) { return <textarea {...props} /> }\n',
    );
    fs.writeFileSync(
      path.join(root, 'components/ai-elements/prompt-input.tsx'),
      'export function PromptInput() { return <form className="rounded-[10px]"><textarea /></form> }\n',
    );
    fs.writeFileSync(
      path.join(root, 'components/signoff-ui/run-meter.tsx'),
      'export function RunMeter() { return <div className="rounded-[3px] bg-[#e5e7eb]" /> }\n',
    );
    expect(await check(root)).toEqual({ code: 0, reported: [], messages: [] });
  });

  it('finds the folders through the components alias in tsconfig paths (a src/ layout)', async () => {
    const root = fixture(app('src'));
    expect((await run(['init', '--yes', '--no-cache'], root)).code).toBe(0);
    expect(written(root).components).toEqual([
      'src/components/ui/**/*.{tsx,jsx}',
      'src/components/ai-elements/**/*.{tsx,jsx}',
      'src/components/signoff-ui/**/*.{tsx,jsx}',
    ]);
  });

  it('writes what it did before when components.json names no registry', async () => {
    const root = fixture(app('', null));
    const init = await run(['init', '--yes', '--no-cache'], root);
    expect(init.code).toBe(0);
    expect(written(root).components).toEqual(['components/ui/**/*.{tsx,jsx}']);
    expect(init.stdout).not.toContain('shadcn add');
  });

  it('leaves --components as given, and says the registry folders are checked as app code', async () => {
    const root = fixture(app());
    const init = await run(
      ['init', '--yes', '--no-cache', '--components', 'components/ui/**/*.tsx'],
      root,
    );
    expect(init.code).toBe(0);
    expect(written(root).components).toEqual(['components/ui/**/*.tsx']);
    expect(init.stdout).toContain(
      `components.json names the registries @ai-elements and @signoff-ui, which \`shadcn add\` copies into components/ai-elements and components/signoff-ui: \`check\` reads their code as your own. To set it apart, see ${LINK}.`,
    );
  });

  it('adds no folder already in the components, and none when the config imports them by a package name', async () => {
    // components.json's ui folder is components/ itself: the registry folders are in it.
    const whole = fixture({
      ...app(),
      'components.json': json({
        tailwind: { css: 'app/globals.css' },
        aliases: { components: '@/components', ui: '@/components' },
        registries: REGISTRIES,
      }),
    });
    const init = await run(['init', '--yes', '--no-cache'], whole);
    expect(init.code).toBe(0);
    expect(written(whole).components).toEqual(['components/**/*.{tsx,jsx}']);
    expect(init.stdout).not.toContain('shadcn add');

    // shadcn/ui's monorepo layout with a package imported by its name: a registry folder in
    // the app is not imported from @workspace/ui, so it stays out of a config that says it is.
    const monorepo = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n  - packages/*\n',
      'package.json': json({ name: 'monorepo', private: true }),
      'packages/ui/package.json': json({
        name: '@workspace/ui',
        private: true,
        exports: { '.': './src/index.ts' },
      }),
      'packages/ui/src/index.ts': 'export * from "./components/button"\n',
      'packages/ui/src/components/button.tsx':
        'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }\n',
      ...Object.fromEntries(
        Object.entries(app()).map(([file, text]) => [
          `apps/web/${file}`,
          file === 'components.json'
            ? json({
                tailwind: { css: 'app/globals.css' },
                aliases: { components: '@/components', ui: '@workspace/ui/components' },
                registries: REGISTRIES,
              })
            : file === 'package.json'
              ? json({ name: 'web', dependencies: { '@workspace/ui': 'workspace:*' } })
              : text,
        ]),
      ),
    });
    const web = path.join(monorepo, 'apps/web');
    const result = await run(['init', '--yes', '--no-cache'], web);
    expect(result.code).toBe(0);
    expect(written(web)).toMatchObject({
      components: ['../../packages/ui/src/components/**/*.{tsx,jsx}'],
      importPath: '@workspace/ui',
    });
    expect(result.stdout).toContain(
      `components.json names the registries @ai-elements and @signoff-ui, which \`shadcn add\` copies into components/ai-elements and components/signoff-ui: \`check\` reads their code as your own. To set it apart, see ${LINK}.`,
    );
  });
});
