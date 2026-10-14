import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { loadConfig } from '../src/config.js';
import { DesignSystemHost, fingerprint } from '../src/design-system.js';
import { readProjectConfig } from '../src/extract/program.js';
import { fixture, load, TSCONFIG } from './helpers.js';
import { muiPackage } from './mui-fixture.js';

const json = (value: unknown) => JSON.stringify(value, null, 2);

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

/** What create-next-app writes for a JavaScript app: the `@/*` alias, nothing else. */
const JSCONFIG = json({ compilerOptions: { paths: { '@/*': ['./*'] } } });

/** shadcn/ui's Button as `shadcn add` writes it with `"tsx": false`. */
const BUTTON = `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
`;

const UTILS = `import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
`;

const THEME = `@import "tailwindcss";
:root { --primary: oklch(0.2 0 0); --primary-foreground: oklch(0.98 0 0); }
@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}
`;

/** An invented variant, and a component the design system does not have. */
const PAGE = `import { Button } from "@/components/ui/button"
import { Cardd } from "@/components/ui/card"

export default function Page() {
  return (
    <main>
      <Button variant="primary">Save</Button>
      <Cardd />
    </main>
  )
}
`;

/** What a build, a test run and a static folder leave next to a JavaScript app's sources. */
const BUILD_OUTPUT = {
  'build/static/js/main.js': UTILS,
  'coverage/lcov-report/sorter.js': UTILS,
  'dist/assets/index-abc.js': UTILS,
  'out/_next/chunk.js': UTILS,
  'public/sw.js': UTILS,
};

/** A shadcn/ui app in JavaScript: the alias lives in jsconfig.json, components are .jsx. */
function jsApp(src = '') {
  return {
    'package.json': json({ name: 'js-app', private: true }),
    'jsconfig.json': src
      ? json({ compilerOptions: { paths: { '@/*': [`./${src}*`] } } })
      : JSCONFIG,
    'components.json': json({
      style: 'new-york',
      rsc: true,
      tsx: false,
      tailwind: { config: '', css: `${src}app/globals.css`, baseColor: 'neutral' },
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        ui: '@/components/ui',
        lib: '@/lib',
        hooks: '@/hooks',
      },
    }),
    [`${src}components/ui/button.jsx`]: BUTTON,
    [`${src}lib/utils.js`]: UTILS,
    [`${src}app/globals.css`]: THEME,
    [`${src}app/page.jsx`]: PAGE,
  };
}

describe('a JavaScript app with jsconfig.json', () => {
  it('resolves components.json through jsconfig.json paths', async () => {
    const root = fixture(jsApp(), { nodeModules: true });
    const config = await loadConfig({ root });
    expect(config.detected).toBe('components.json (ui: @/components/ui → components/ui)');
    expect(config.components).toEqual(['components/ui/**/*.{tsx,jsx}']);

    const ds = await load(root);
    const button = ds.getComponent('Button');
    expect(button?.importPath).toBe('@/components/ui/button');
    expect(button?.props.find((p) => p.name === 'variant')?.values).toEqual([
      'default',
      'destructive',
      'outline',
      'ghost',
    ]);
  });

  it('checks components imported through the alias, so check fails on them', async () => {
    const root = fixture(jsApp(), { nodeModules: true });
    const { code, stdout } = await run(['check', 'app/page.jsx', '--no-cache'], root);
    expect(stdout).toMatch(/"primary" is not a valid variant for <Button>.*no-unknown-variant/);
    expect(stdout).toMatch(/"Cardd" is not a design-system component.*no-unknown-component/);
    expect(stdout).toContain('2 errors, 0 warnings in 1 file');
    expect(code).toBe(1);
  });

  it('follows an alias to src/', async () => {
    const root = fixture(jsApp('src/'), { nodeModules: true });
    const config = await loadConfig({ root });
    expect(config.detected).toBe('components.json (ui: @/components/ui → src/components/ui)');

    const ds = await load(root);
    expect(ds.getComponent('Button')?.importPath).toBe('@/components/ui/button');
    const { diagnostics } = ds.check(PAGE, 'src/app/page.jsx');
    expect(diagnostics.map((d) => d.ruleId).sort()).toEqual([
      'no-unknown-component',
      'no-unknown-variant',
    ]);
  });

  it('names jsconfig.json in inspect --explain', async () => {
    const root = fixture(jsApp(), { nodeModules: true });
    const { stdout } = await run(['inspect', '--explain', '--no-cache'], root);
    expect(stdout).toContain(
      'found  components.json: ui: @/components/ui → components/ui, 1 component file',
    );
    expect(stdout).toContain('  tsconfig     jsconfig.json\n');
  });

  it('names jsconfig.json when the ui alias does not resolve through it', async () => {
    const root = fixture({ ...jsApp(), 'jsconfig.json': json({ compilerOptions: {} }) });
    const { stdout } = await run(['inspect', '--explain', '--no-cache'], root);
    expect(stdout).toContain(
      'components.json: the ui alias @/components/ui resolves through neither jsconfig.json paths nor a workspace package',
    );
  });

  it('rebuilds the cached model when jsconfig.json changes', async () => {
    const root = fixture(jsApp());
    const config = await loadConfig({ root });
    const before = await fingerprint(config);
    const file = path.join(root, 'jsconfig.json');
    fs.writeFileSync(file, json({ compilerOptions: { paths: { '@/*': ['./src/*'] } } }));
    expect(await fingerprint(config)).not.toBe(before);
  });

  it('reads tsconfig.json over jsconfig.json, as TypeScript does', () => {
    const root = fixture({
      'tsconfig.json': TSCONFIG,
      'jsconfig.json': json({ compilerOptions: { paths: { '@/*': ['./src/*'] } } }),
    });
    const project = readProjectConfig(root);
    expect(project.configFile).toBe(path.join(root, 'tsconfig.json'));
    expect(project.paths).toEqual({ '@/*': ['./*'] });
  });

  it('reads jsconfig.json without a tsconfig.json, its JavaScript files included', () => {
    const root = fixture({
      'jsconfig.json': JSCONFIG,
      'app/page.jsx': PAGE,
      'lib/utils.js': UTILS,
      ...BUILD_OUTPUT,
    });
    const project = readProjectConfig(root);
    expect(project.configFile).toBe(path.join(root, 'jsconfig.json'));
    expect(project.configFiles).toEqual([path.join(root, 'jsconfig.json')]);
    expect(project.paths).toEqual({ '@/*': ['./*'] });
    // TypeScript writes it with forward slashes, on Windows too.
    expect(path.resolve(project.pathsBase)).toBe(root);
    expect(project.options.allowJs).toBe(true);
    // No `include`: TypeScript's default for a jsconfig.json takes the .js and .jsx files.
    // No `exclude`: the build output is left out, as it is without a config.
    expect(project.fileNames.map((f) => path.relative(root, f)).sort()).toEqual([
      path.join('app', 'page.jsx'),
      path.join('lib', 'utils.js'),
    ]);
  });

  it('keeps the exclude a jsconfig.json sets, or extends', () => {
    const own = fixture({
      'jsconfig.json': json({ ...JSON.parse(JSCONFIG), exclude: ['node_modules', 'legacy'] }),
      'app/page.jsx': PAGE,
      'legacy/old.js': UTILS,
      'dist/assets/index-abc.js': UTILS,
    });
    const extended = fixture({
      'jsconfig.base.json': json({ exclude: ['node_modules', 'legacy'] }),
      'jsconfig.json': json({ ...JSON.parse(JSCONFIG), extends: './jsconfig.base.json' }),
      'app/page.jsx': PAGE,
      'legacy/old.js': UTILS,
      'dist/assets/index-abc.js': UTILS,
    });
    for (const root of [own, extended]) {
      const project = readProjectConfig(root);
      expect(project.fileNames.map((f) => path.relative(root, f)).sort()).toEqual([
        path.join('app', 'page.jsx'),
        path.join('dist', 'assets', 'index-abc.js'),
      ]);
    }
  });

  it("reads an MUI theme from the app's sources, not from a stale bundle", async () => {
    const theme = (palette: string) =>
      `import { createTheme } from '@mui/material/styles';\nexport const theme = createTheme({ palette: { ${palette} } });\n`;
    const root = fixture(
      {
        'package.json': json({
          name: 'mui-js-app',
          dependencies: { '@mui/material': '^9.4.0', react: '^19.0.0' },
        }),
        'jsconfig.json': JSCONFIG,
        'src/theme.js': theme("primary: { main: '#1976d2' }"),
        // An unminified bundle from an earlier build, with the theme as it was then.
        'dist/assets/index-abc.js': theme(
          "primary: { main: '#ff0000' }, teal: { main: '#00ff00' }",
        ),
        ...muiPackage(),
      },
      { nodeModules: true },
    );
    const ds = await load(root);
    expect(ds.tokens.map((t) => [t.name, t.value])).toEqual([['primary.main', '#1976d2']]);
  });

  it('reloads when jsconfig.json changes', async () => {
    const root = fixture({
      'jsconfig.json': JSCONFIG,
      'components/ui/button.jsx': BUTTON,
      'lib/utils.js': UTILS,
    });
    const host = new DesignSystemHost(await loadConfig({ root }), { cache: false });
    expect((await host.get()).getComponent('Button')?.importPath).toBe('@/components/ui/button');
    host.watch();
    await new Promise((r) => setTimeout(r, 100));
    const reloaded = new Promise<string | undefined>((resolve) => {
      host.onChange((ds) => {
        resolve(ds.getComponent('Button')?.importPath);
      });
    });
    // An atomic save, as editors do it.
    const file = path.join(root, 'jsconfig.json');
    fs.writeFileSync(`${file}.tmp`, JSCONFIG.replace('"@/*"', '"~/*"'));
    fs.renameSync(`${file}.tmp`, file);
    await expect(reloaded).resolves.toBe('~/components/ui/button');
    host.close();
  }, 15_000);
});
