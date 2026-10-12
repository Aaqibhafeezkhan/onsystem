import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config.js';
import { tokenFiles } from '../src/design-system.js';
import { presetResolver, stylesheetResolver } from '../src/detect.js';
import { colorDistance, parseColor } from '../src/tokens/color.js';
import { cssImports } from '../src/tokens/imports.js';
import { parseCssTokens, parseDtcgTokens, toDesignMd, toDtcg } from '../src/tokens/index.js';
import {
  applyTailwindColors,
  presetStylesheets,
  readTailwindColors,
} from '../src/tokens/tailwind-config.js';
import { fixture, load } from './helpers.js';

/** A monorepo shaped like Dub's: the color tokens live in a shared Tailwind config package. */
const ROOT = path.resolve(import.meta.dirname, 'fixtures/shared-tailwind-config');

const ERROR_MESSAGE = `<p className="text-sm text-red-600">{error}</p>`;

describe('color tokens in a shared Tailwind config package (issue #94)', () => {
  it.each([
    ['apps/web', 'a preset spread from the package, its stylesheet imported by path'],
    ['apps/preset', 'presets: [require(package)], the stylesheet imported from code'],
    ['apps/theme', 'the theme object the package exports'],
  ])('finds the tokens of %s (%s)', async (app) => {
    const system = await load(path.join(ROOT, app));
    const colors = system.getTokens({ category: 'color' });
    expect(Object.fromEntries(colors.map((t) => [t.name, t.tailwind]))).toEqual({
      'bg-default': 'bg-default',
      'bg-subtle': 'bg-subtle',
      'bg-error': 'bg-error',
      'border-default': 'border-default',
      'content-default': 'content-default',
      'content-subtle': 'content-subtle',
      'content-emphasis': 'content-emphasis',
      'content-success': 'content-success',
      'content-warning': 'content-warning',
      'content-error': 'content-error',
    });
    const error = colors.find((t) => t.name === 'content-error');
    expect(error).toMatchObject({
      value: '220 38 38',
      modes: { dark: '252 165 165' },
      source: { file: '../../packages/tailwind-config/themes.css' },
    });
    expect(error?.usage).toEqual([
      'bg-content-error',
      'text-content-error',
      'border-content-error',
      'rgb(var(--content-error))',
    ]);

    const [d] = system
      .check(ERROR_MESSAGE, 'app/page.tsx')
      .diagnostics.filter((x) => x.ruleId === 'no-hardcoded-color');
    expect(d?.fix?.[0]?.text).toBe('text-content-error');
  });

  it('finds the tokens of a Tailwind v4 app that imports the package from its stylesheet', async () => {
    const system = await load(path.join(ROOT, 'apps/v4'));
    const colors = system.getTokens({ category: 'color' });
    expect(colors.map((t) => [t.name, t.tailwind, t.source.file])).toEqual([
      ['bg-default', 'bg-default', '../../packages/theme/colors.css'],
      ['border-default', 'border-default', '../../packages/theme/colors.css'],
      ['content-default', 'content-default', '../../packages/theme/colors.css'],
      ['content-subtle', 'content-subtle', '../../packages/theme/colors.css'],
      ['content-error', 'content-error', '../../packages/theme/colors.css'],
    ]);
    const [d] = system
      .check(ERROR_MESSAGE, 'app/page.tsx')
      .diagnostics.filter((x) => x.ruleId === 'no-hardcoded-color');
    expect(d?.fix?.[0]?.text).toBe('text-content-error');
  });

  it('lists the stylesheets it followed as token files', async () => {
    const files = async (app: string) => {
      const root = path.join(ROOT, app);
      const config = await loadConfig({ root });
      return (await tokenFiles(config)).map((f) => path.relative(root, f).replaceAll('\\', '/'));
    };
    expect(await files('apps/web')).toEqual([
      'styles/globals.css',
      '../../packages/tailwind-config/themes.css',
    ]);
    expect(await files('apps/preset')).toEqual([
      'app/globals.css',
      '../../packages/tailwind-config/themes.css',
    ]);
    expect(await files('apps/v4')).toEqual([
      'app/globals.css',
      '../../packages/theme/theme.css',
      '../../packages/theme/colors.css',
    ]);
  });

  it('reads only the token files a config names', async () => {
    const root = path.join(ROOT, 'apps/web');
    const config = await loadConfig({ root, tokens: ['styles/globals.css'] });
    // Found by glob: forward slashes, on Windows too.
    expect(await tokenFiles(config)).toEqual([
      path.join(root, 'styles/globals.css').split(path.sep).join('/'),
    ]);
  });
});

describe('RGB channels in Tailwind v3 tokens', () => {
  it('reads RGB channels as a color only in a color token', () => {
    const green = parseColor('rgb(22 163 74)');
    const channels = parseColor('22 163 74', { bareRgb: true });
    expect(green && channels && colorDistance(green, channels)).toBeCloseTo(0, 6);
    expect(parseColor('22, 163, 74 / 0.5', { bareRgb: true })).toMatchObject({ alpha: 0.5 });
    expect(parseColor('300 0 0', { bareRgb: true })).toBeUndefined();
    // Three numbers alone are no sure color.
    expect(parseColor('22 163 74', { bareHsl: true })).toBeUndefined();
    expect(parseColor('22 163 74')).toBeUndefined();
  });

  it('makes a color of a property the config reads with rgb(), and of no other', () => {
    const { tokens } = parseCssTokens(
      `:root { --success: 22 163 74; --brand: 37 99 235; --grid: 1 2 3; }
.dark { --success: 134 239 172; }`,
      'themes.css',
    );
    expect(tokens.map((t) => t.category)).toEqual(['other', 'other', 'other']);
    applyTailwindColors(
      tokens,
      new Map([
        ['--success', 'success'],
        ['--brand', 'brand'],
      ]),
      new Set(['--success']),
    );
    expect(tokens.map((t) => [t.name, t.category, t.tailwind])).toEqual([
      ['success', 'color', 'success'],
      // Read with hsl() or as is, the channels are no RGB color.
      ['brand', 'other', undefined],
      ['grid', 'other', undefined],
    ]);
    expect(tokens[0]?.usage).toEqual([
      'bg-success',
      'text-success',
      'border-success',
      'rgb(var(--success))',
    ]);
  });

  it('exports RGB channels and reads them back as channels', () => {
    const { tokens } = parseCssTokens(
      `:root { --success: 22 163 74; }\n.dark { --success: 134 239 172; }`,
      'themes.css',
    );
    applyTailwindColors(tokens, new Map([['--success', 'success']]), new Set(['--success']));
    const dtcg = toDtcg(tokens).text;
    const out = JSON.parse(dtcg) as Record<string, Record<string, Record<string, unknown>>>;
    expect(out.color?.success).toMatchObject({
      $type: 'color',
      $value: { colorSpace: 'srgb', hex: '#16a34a' },
      $extensions: { 'com.github.dgesteves.onsystem': { channels: 'rgb' } },
    });
    const [back] = parseDtcgTokens(dtcg, 'tokens.json').tokens;
    expect(back).toMatchObject({
      value: '22 163 74',
      modes: { dark: '134 239 172' },
      cssVar: '--success',
    });
    expect(back?.usage).toContain('rgb(var(--success))');
    expect(toDesignMd(tokens, { name: 'Acme' }).text).toContain('success: rgb(22 163 74)');
  });
});

describe('following stylesheets into workspace packages', () => {
  it('reads the specifier of every @import form', () => {
    expect(
      cssImports(`@import url(a.css);
@import url("b.css") layer(base);
@import 'c.css' supports(display: grid);
@import "tailwindcss" source(none);
.x { color: red; }`),
    ).toEqual(['a.css', 'b.css', 'c.css', 'tailwindcss']);
    expect(cssImports('@import "a.css"; .x {')).toEqual([]);
  });

  it('resolves @import to a relative file or a workspace package stylesheet', () => {
    const root = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n  - packages/*\n',
      'package.json': '{ "private": true }',
      'packages/theme/package.json': JSON.stringify({
        name: '@x/theme',
        exports: { './*': { style: './src/*.css' } },
      }),
      'packages/theme/src/colors.css': ':root { --brand: #2563eb; }',
      'packages/styled/package.json': JSON.stringify({ name: '@x/styled', style: './styles.css' }),
      'packages/styled/styles.css': ':root { --surface: #fff; }',
      'apps/web/package.json': JSON.stringify({ name: '@x/web' }),
      'apps/web/app/globals.css': '',
      'apps/web/app/theme.css': '',
    });
    const app = path.join(root, 'apps/web');
    const from = path.join(app, 'app/globals.css');
    const resolve = stylesheetResolver(app);
    expect(resolve('@x/theme/colors', from)).toBe(path.join(root, 'packages/theme/src/colors.css'));
    expect(resolve('@x/styled', from)).toBe(path.join(root, 'packages/styled/styles.css'));
    expect(resolve('theme.css', from)).toBe(path.join(app, 'app/theme.css'));
    expect(resolve('./theme', from)).toBe(path.join(app, 'app/theme.css'));
    for (const specifier of ['./missing.css', 'tailwindcss', 'https://x.dev/a.css', '/a.css']) {
      expect(resolve(specifier, from)).toBeUndefined();
    }
  });

  it("follows a re-exported preset through the package's exports to its stylesheet", () => {
    const root = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n  - packages/*\n',
      'package.json': '{ "private": true }',
      'packages/config/package.json': JSON.stringify({
        name: '@x/config',
        exports: { '.': { types: './index.d.ts', default: './index.js' } },
      }),
      'packages/config/index.js': `module.exports = {
  theme: { extend: { colors: { brand: "rgb(var(--brand) / <alpha-value>)" } } },
};`,
      'packages/config/styles/theme.css': ':root { --brand: 37 99 235; }',
      'packages/config/styles/reset.css': '* { margin: 0; }',
      'packages/config/dist/theme.css': ':root { --brand: 37 99 235; }',
      'apps/web/package.json': JSON.stringify({ name: '@x/web' }),
      'apps/web/tailwind.config.ts': 'export { default } from "@x/config";\n',
    });
    const app = path.join(root, 'apps/web');
    const read = readTailwindColors(path.join(app, 'tailwind.config.ts'), presetResolver(app));
    expect([...read.colors]).toEqual([['--brand', 'brand']]);
    expect([...read.rgb]).toEqual(['--brand']);
    expect(presetStylesheets(read, app)).toEqual([
      path.join(root, 'packages/config/styles/theme.css'),
    ]);
  });

  it("searches neither the project's folder nor the workspace root that holds it", () => {
    const root = fixture({
      'package.json': JSON.stringify({ private: true, workspaces: ['apps/*'] }),
      'tailwind.preset.js': `module.exports = { theme: { colors: { brand: "rgb(var(--brand))" } } };`,
      'styles/theme.css': ':root { --brand: 37 99 235; }',
      'apps/web/package.json': JSON.stringify({ name: 'web' }),
      'apps/web/tailwind.config.js':
        'module.exports = { presets: [require("../../tailwind.preset.js")] };',
      'apps/web/app/theme.css': ':root { --brand: 37 99 235; }',
    });
    const app = path.join(root, 'apps/web');
    const read = readTailwindColors(path.join(app, 'tailwind.config.js'), presetResolver(app));
    expect(read.colors.size).toBe(1);
    expect(presetStylesheets(read, app)).toEqual([]);
  });
});
