import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { DEFAULT_COMPONENTS, loadConfig } from '../src/config.js';
import { detectProject } from '../src/detect.js';
import { fixture, load } from './helpers.js';

// React Aria's getting-started page has people download its Tailwind starter and use the
// components. In an app they land in src/components (or components/ in a Next.js app), next to
// the app's entry, which a flat src/ of components may not have.

const json = (value: unknown) => JSON.stringify(value, null, 2);

/** A component wrapping React Aria, the way its Tailwind starter writes one per file. */
const racComponent = (name: string, from = 'react-aria-components') => `'use client';
import { ${name} as RAC${name}, type ${name}Props } from "${from}"
export function ${name}(props: ${name}Props) { return <RAC${name} {...props} /> }
`;

const THEME = `@import "tailwindcss";
@theme { --color-accent: oklch(0.55 0.2 260); }
`;

const VITE_APP = json({
  name: 'rac-app',
  private: true,
  dependencies: { react: '^19.0.0', 'react-aria-components': '^1.22.0' },
});

const STARTER = ['Button', 'Checkbox', 'Dialog', 'Select', 'Switch', 'TextField'];

/** The starter's components in `folder`, with its helper module. */
const starterIn = (folder: string) => ({
  ...Object.fromEntries(STARTER.map((name) => [`${folder}/${name}.tsx`, racComponent(name)])),
  [`${folder}/utils.ts`]: 'export const focusRing = "outline-2"\n',
});

const TSCONFIG = json({
  compilerOptions: { jsx: 'react-jsx', moduleResolution: 'bundler', strict: true },
  include: ['src'],
});

/** A Vite app with the starter copied into src/components, next to its entry. */
const viteApp = () =>
  fixture({
    'package.json': VITE_APP,
    'tsconfig.json': TSCONFIG,
    'src/main.tsx':
      'import { createRoot } from "react-dom/client"\nimport { App } from "./App"\ncreateRoot(document.getElementById("root")!).render(<App />)\n',
    'src/App.tsx':
      'import { Button } from "./components/Button"\nexport function App() { return <Button isDisabled>Save</Button> }\n',
    'src/index.css': THEME,
    ...starterIn('src/components'),
  });

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => out.push(t) };
  const code = await main([...args, '--no-cache'], io);
  return { code, text: out.join('\n') };
}

describe('detectProject: a flat folder of components in an app', () => {
  it("finds React Aria's starter copied into src/components next to the app's entry", async () => {
    const root = viteApp();
    const config = await loadConfig({ root });
    expect(config.detected).toBe('src/components/ (6 components wrapping react-aria-components)');
    // The app's own components/ui, if it has one, is still read.
    expect(config.components).toEqual([...DEFAULT_COMPONENTS, 'src/components/*.{tsx,jsx}']);
    expect(config.tokens.map((t) => t.path)).toContain('src/index.css');
    expect(config.docs).toContain('src/components/**/*.{md,mdx}');
    const ds = await load(root);
    expect(
      ds
        .roots()
        .map((c) => c.name)
        .sort(),
    ).toEqual(STARTER);
  });

  it('says why in inspect --explain, and checks the app against the components', async () => {
    const root = viteApp();
    const inspect = await run(['inspect', '--explain'], root);
    expect(inspect.code).toBe(0);
    expect(inspect.text).toContain(
      'no     a flat src/ of components: src/App.tsx makes src/ an app',
    );
    expect(inspect.text).toContain(
      'found  a flat src/components/ of components: src/components/ (6 components wrapping react-aria-components)',
    );
    fs.writeFileSync(
      path.join(root, 'src/Draft.tsx'),
      'export function Draft() { return <button className="px-4">Save</button> }\n',
    );
    const check = await run(['check', 'src/Draft.tsx'], root);
    expect(check.text).not.toContain('No design system found');
    expect(check.text).toContain('Native <button> where the design system has <Button>');
  });

  it('has init write the glob it found', async () => {
    const root = viteApp();
    const init = await run(['init', '--yes'], root);
    expect(init.code).toBe(0);
    expect(init.text).toContain(
      'Found the design system through src/components/ (6 components wrapping react-aria-components).',
    );
    const written = JSON.parse(
      fs.readFileSync(path.join(root, 'onsystem.config.json'), 'utf8'),
    ) as { components?: string[] };
    expect(written.components).toContain('src/components/*.{tsx,jsx}');
  });

  it('finds components/ in a Next.js app, and app/components', () => {
    const next = (folder: string) =>
      fixture({
        'package.json': VITE_APP,
        'app/layout.tsx': 'export default function Layout() { return null }\n',
        'app/page.tsx': 'export default function Page() { return null }\n',
        'app/globals.css': THEME,
        ...starterIn(folder),
      });
    expect(detectProject(next('components'))?.source).toBe(
      'components/ (6 components wrapping react-aria-components)',
    );
    expect(detectProject(next('app/components'))?.source).toBe(
      'app/components/ (6 components wrapping react-aria-components)',
    );
    // Radix wrappers count the same way.
    const radix = fixture({
      'package.json': json({ name: 'app', dependencies: { '@radix-ui/react-dialog': '^1.1.0' } }),
      ...Object.fromEntries(
        STARTER.map((name) => [
          `components/${name}.tsx`,
          racComponent(name, '@radix-ui/react-dialog'),
        ]),
      ),
    });
    expect(detectProject(radix)?.source).toBe(
      'components/ (6 components wrapping @radix-ui/react-dialog)',
    );
  });

  it("leaves a folder of the app's own features alone", () => {
    const feature = (name: string) =>
      `import { Button } from "./Button"\nexport function ${name}() { return <Button>${name}</Button> }\n`;
    const app = (files: Record<string, string>, pkg = VITE_APP) =>
      fixture({ 'package.json': pkg, 'src/main.tsx': 'export {}\n', ...files });
    const features = Object.fromEntries(
      ['Header', 'Sidebar', 'Footer', 'Profile', 'Billing'].map((name) => [
        `src/components/${name}.tsx`,
        feature(name),
      ]),
    );
    // Features import the app's own components, not primitives: fewer than four in five wrap.
    const mixed = app({ ...features, ...starterIn('src/components') });
    expect(detectProject(mixed)).toBeUndefined();
    // Fewer than five components.
    const few = app(
      Object.fromEntries(
        ['Button', 'Checkbox', 'Dialog', 'Select'].map((name) => [
          `src/components/${name}.tsx`,
          racComponent(name),
        ]),
      ),
    );
    expect(detectProject(few)).toBeUndefined();
    // No primitives library among the dependencies.
    const none = app(starterIn('src/components'), json({ name: 'app', dependencies: {} }));
    expect(detectProject(none)).toBeUndefined();
  });

  it("leaves an app's own components alone when they import Radix's icons", async () => {
    // @radix-ui/react-icons is an icon set, not a primitives library: features use it too.
    const feature = (name: string, className = 'p-4') =>
      `import { StarIcon } from '@radix-ui/react-icons'
export function ${name}({ title }: { title: string }) {
  return <section className="${className}"><StarIcon /><h2>{title}</h2><button className="rounded">More</button></section>
}
`;
    const app = (folder: string) =>
      fixture({
        'package.json': json({
          name: 'icons-app',
          private: true,
          dependencies: { next: '^15.0.0', react: '^19.0.0', '@radix-ui/react-icons': '^1.3.0' },
        }),
        'app/globals.css': THEME,
        ...Object.fromEntries(
          ['Header', 'Sidebar', 'Footer', 'ProfileCard', 'PricingTable'].map((name) => [
            `${folder}/${name}.tsx`,
            feature(name, name === 'Header' ? 'p-4 text-[#ff0000]' : 'p-4'),
          ]),
        ),
      });
    expect(detectProject(app('components'))).toBeUndefined();
    expect(detectProject(app('src'))).toBeUndefined();
    // check holds them to the rules as app code, rather than skipping them as the design system.
    const check = await run(['check', '.'], app('components'));
    expect(check.text).toContain('Hardcoded color `text-[#ff0000]`');
    expect(check.text).not.toContain('design-system files skipped');
    const inspect = await run(['inspect', '--explain'], app('components'));
    expect(inspect.text).toContain(
      'no     a flat src/ of components: no dependency on a primitives library',
    );
  });

  it('names the primitives libraries in inspect --explain', async () => {
    const mixed = (dependencies: Record<string, string>) =>
      fixture({
        'package.json': json({ name: 'app', dependencies }),
        'src/main.tsx': 'export {}\n',
        ...starterIn('src/components'),
        ...Object.fromEntries(
          ['Header', 'Sidebar', 'Footer', 'Profile', 'Billing'].map((name) => [
            `src/components/${name}.tsx`,
            `import { Button } from "./Button"\nexport function ${name}() { return <Button>${name}</Button> }\n`,
          ]),
        ),
      });
    const one = await run(['inspect', '--explain'], mixed({ 'react-aria-components': '^1.22.0' }));
    expect(one.text).toContain(
      '6 of 11 files in src/components/ import react-aria-components, fewer than four in five',
    );
    // Any of them counts, so with more than one the line names them all, not the first.
    const two = await run(
      ['inspect', '--explain'],
      mixed({ 'react-aria-components': '^1.22.0', '@radix-ui/react-dialog': '^1.1.0' }),
    );
    expect(two.text).toContain(
      '6 of 11 files in src/components/ import a primitives library (react-aria-components, @radix-ui/react-dialog), fewer than four in five',
    );
  });

  it("is the hook's list of primitives libraries", () => {
    const literal = (file: string) =>
      /const PRIMITIVES =\s*(\/.+\/);/.exec(
        fs.readFileSync(path.resolve(import.meta.dirname, '..', file), 'utf8'),
      )?.[1];
    expect(literal('src/detect.ts')).toContain('@radix-ui');
    expect(literal('plugins/onsystem/hooks/check-ui.mjs')).toBe(literal('src/detect.ts'));
  });

  it('keeps a flat src/ of components first', () => {
    const root = fixture({
      'package.json': VITE_APP,
      ...starterIn('src'),
      ...starterIn('src/components'),
    });
    expect(detectProject(root)?.source).toBe('src/ (6 components wrapping react-aria-components)');
  });
});
