import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { ESLint, type Linter } from 'eslint';
import { ESLint as ESLint9 } from 'eslint-v9';
import { build } from 'tsdown';
import ts from 'typescript';
import tseslint from 'typescript-eslint';
import { beforeAll, describe, expect, it } from 'vitest';

import { fixture, TSCONFIG } from './helpers.js';

// `eslint --fix`, then `tsc`: the fixes must leave code that compiles. The plugin is built as it
// ships, as in eslint.test.ts, into a folder of its own, since test files run in parallel.
const REPO = path.resolve(import.meta.dirname, '..');
const OUT = path.join(REPO, 'node_modules/.cache/onsystem-eslint-fix-test');

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

/** A component that takes every attribute of the element it renders: a drop-in for it. */
const dropIn = (name: string, element: string) =>
  `export function ${name}(props: React.ComponentProps<"${element}">) {\n  return <${element} {...props} />\n}\n`;

/** A shadcn/ui-style app with React's types installed: flat card and dialog parts, form drop-ins. */
const APP = {
  'tsconfig.json': TSCONFIG,
  'components/ui/button.tsx': dropIn('Button', 'button'),
  'components/ui/input.tsx': dropIn('Input', 'input'),
  'components/ui/label.tsx': dropIn('Label', 'label'),
  'components/ui/textarea.tsx': dropIn('Textarea', 'textarea'),
  'components/ui/card.tsx': `${dropIn('Card', 'div')}${dropIn('CardHeader', 'div')}`,
  'components/ui/dialog.tsx': `export function Dialog(props: { children?: React.ReactNode }) {\n  return <>{props.children}</>\n}\n${dropIn('DialogContent', 'div')}`,
  'components/ui/table.tsx': dropIn('Table', 'table'),
  // The app's own modules, outside the design system, with names the design system also has.
  'lib/grid/types.ts': `export interface Table<TData> {\n  getRows(): TData[]\n}\n`,
  'components/issues/label.tsx': `export function Label(props: { name: string; color: string }) {\n  return <span style={{ color: props.color }}>{props.name}</span>\n}\n`,
  // What an agent writes before it knows the design system, with nothing imported.
  'app/sign-up.tsx': `export function SignUp() {
  return (
    <form>
      <label htmlFor="name">Name</label>
      <input id="name" />
      <textarea id="bio" />
      <button type="submit">Save</button>
    </form>
  )
}
`,
  // Dot-notation parts where the system has flat ones, which the file does not import.
  'app/billing.tsx': `import { Card } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"

export function Billing() {
  return (
    <Dialog>
      <Dialog.Content>
        <Card>
          <Card.Header>Billing</Card.Header>
        </Card>
      </Dialog.Content>
    </Dialog>
  )
}
`,
  // Imported as a type only: <Button> would not compile either.
  'app/save.tsx': `import type { Button } from "@/components/ui/button"

export const Save = (props: React.ComponentProps<typeof Button>) => (
  <button {...props} className="px-2">Save</button>
)
`,
  // Types of the same names, not the components: <Label> and <Button> would not compile either.
  'app/labels.tsx': `type Label = { name: string; color: string }
interface Button {
  label: Label
}

export function NewLabel(props: { onAdd?: (button: Button) => void }) {
  return (
    <form>
      <label htmlFor="label-name">Label</label>
      <button type="submit">Add</button>
    </form>
  )
}
`,
  // A type of the same name imported from elsewhere, without `type` (@tanstack/react-table's
  // `Table<TData>`): <Table> would not compile either.
  'app/data-grid.tsx': `import { Table } from "@/lib/grid/types"

export function DataGrid<TData extends { id: string }>(props: { table: Table<TData> }) {
  return (
    <table className="w-full">
      <tbody>
        {props.table.getRows().map((row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
`,
  // An app component of the same name (an issue-label chip), not the design system's Label:
  // <Label htmlFor> would not compile either.
  'app/edit-label.tsx': `import { Label } from "@/components/issues/label"

export function EditLabel(props: { name: string; color: string }) {
  return (
    <form>
      <Label name={props.name} color={props.color} />
      <label htmlFor="label-name">Name</label>
    </form>
  )
}
`,
  // The components are imported, by a relative path or an alias: the renames are safe.
  'app/upgrade.tsx': `import { Button } from "../components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"

export function Upgrade() {
  return (
    <Card>
      <Card.Header>Plan</Card.Header>
      <button type="button" className="px-2">Upgrade</button>
    </Card>
  )
}
`,
};

/** `file(line,column): TS1234` for every TypeScript error in the project. */
function tsc(root: string): string[] {
  const read = ts.readConfigFile(path.join(root, 'tsconfig.json'), (file) => ts.sys.readFile(file));
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, root);
  const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true });
  return ts.getPreEmitDiagnostics(program).map((d) => {
    const at = d.file ? d.file.getLineAndCharacterOfPosition(d.start ?? 0) : undefined;
    const file = d.file ? path.relative(root, d.file.fileName).split(path.sep).join('/') : '';
    return `${file}(${(at?.line ?? 0) + 1},${(at?.character ?? 0) + 1}): TS${d.code}`;
  });
}

/** The ESLint versions the plugin supports, with the same API for what this file uses. */
const ENGINES = [
  ['ESLint 10', ESLint],
  ['ESLint 9', ESLint9 as unknown as typeof ESLint],
] as const;

function eslint(cwd: string, fix: boolean, Engine: typeof ESLint = ESLint) {
  return new Engine({
    cwd,
    overrideConfigFile: true,
    overrideConfig: [
      { files: ['**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser } },
      onsystem.configs.recommended,
    ],
    fix,
  });
}

describe('eslint --fix', () => {
  it.each(ENGINES)(
    'leaves code that compiles on %s: it renames only to components in scope',
    async (_, Engine) => {
      const root = fixture(APP, { nodeModules: true });
      const before = tsc(root);
      // Only the dot-notation parts fail to compile before: they do not exist.
      expect(before.length).toBeGreaterThan(0);
      expect(
        before.every((e) => e.startsWith('app/billing.tsx') || e.startsWith('app/upgrade.tsx')),
      ).toBe(true);

      const results = await eslint(root, true, Engine).lintFiles(['app']);
      await Engine.outputFixes(results);
      const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

      // In scope: renamed, and the file now compiles.
      expect(read('app/upgrade.tsx')).toContain('<CardHeader>Plan</CardHeader>');
      expect(read('app/upgrade.tsx')).toContain(
        '<Button type="button" className="px-2">Upgrade</Button>',
      );
      // Not in scope: left as they were, so the fixes add no error.
      for (const file of [
        'app/sign-up.tsx',
        'app/billing.tsx',
        'app/save.tsx',
        'app/labels.tsx',
        'app/data-grid.tsx',
        'app/edit-label.tsx',
      ] as const) {
        expect(read(file)).toBe(APP[file]);
      }
      expect(tsc(root)).toEqual(before.filter((e) => !e.startsWith('app/upgrade.tsx')));
    },
  );

  it('offers a rename to a component the file does not import as a suggestion', async () => {
    const root = fixture(APP, { nodeModules: true });
    const [billing, dataGrid, editLabel, labels, save, signUp] = await eslint(
      root,
      false,
    ).lintFiles([
      'app/billing.tsx',
      'app/data-grid.tsx',
      'app/edit-label.tsx',
      'app/labels.tsx',
      'app/save.tsx',
      'app/sign-up.tsx',
    ]);
    const renames = (result: ESLint.LintResult | undefined) =>
      result?.messages.map((m) => [m.ruleId, Boolean(m.fix), m.suggestions?.map((s) => s.desc)]);
    const suggested = (rule: string, name: string) => [
      `onsystem/${rule}`,
      false,
      [`Rename to <${name}>, then import it`],
    ];
    expect(renames(signUp)).toEqual(
      ['Label', 'Input', 'Textarea', 'Button'].map((name) =>
        suggested('prefer-design-system-component', name),
      ),
    );
    expect(renames(billing)).toEqual([
      suggested('no-unknown-component', 'DialogContent'),
      suggested('no-unknown-component', 'CardHeader'),
    ]);
    expect(renames(save)).toEqual([suggested('prefer-design-system-component', 'Button')]);
    expect(renames(labels)).toEqual(
      ['Label', 'Button'].map((name) => suggested('prefer-design-system-component', name)),
    );
    // The same name imported from outside the design system is not the component.
    expect(renames(dataGrid)).toEqual([suggested('prefer-design-system-component', 'Table')]);
    expect(renames(editLabel)).toEqual([suggested('prefer-design-system-component', 'Label')]);
    // The message names the import to add.
    expect(signUp?.messages[0]?.message).toContain(
      'Use <Label> (import { Label } from "@/components/ui/label")',
    );

    // Applied, the suggestion renames both tags.
    const [suggestion] = billing?.messages[1]?.suggestions ?? [];
    const [from = 0, to = 0] = suggestion?.fix.range ?? [];
    expect(APP['app/billing.tsx'].slice(from, to)).toBe('Card.Header>Billing</Card.Header');
    expect(suggestion?.fix.text).toBe('CardHeader>Billing</CardHeader');
  });
});
