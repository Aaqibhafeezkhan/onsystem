/**
 * npm commands in the docs, as the other package managers write them, for the npm / pnpm / yarn
 * / bun tabs. The docs keep plain npm (readable on GitHub); a ```sh pm block gets the tabs.
 */

export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

const ADD: Record<PackageManager, { add: string; dev: string }> = {
  npm: { add: 'npm install', dev: 'npm install --save-dev' },
  pnpm: { add: 'pnpm add', dev: 'pnpm add -D' },
  yarn: { add: 'yarn add', dev: 'yarn add -D' },
  bun: { add: 'bun add', dev: 'bun add -d' },
};

/** Runs a package's bin: the project's install (`npx onsystem`) or a one-off download (`npx -y`). */
const RUN: Record<PackageManager, { local: string; remote: string }> = {
  npm: { local: 'npx', remote: 'npx -y' },
  pnpm: { local: 'pnpm exec', remote: 'pnpm dlx' },
  yarn: { local: 'yarn', remote: 'yarn dlx' },
  bun: { local: 'bunx', remote: 'bunx' },
};

function convert(command: string, pm: PackageManager): string {
  const dev = /^npm (?:install|i) (?:--save-dev|-D) (.+)$/.exec(command);
  if (dev?.[1]) return `${ADD[pm].dev} ${dev[1]}`;
  const add = /^npm (?:install|i) (?!-)(.+)$/.exec(command);
  if (add?.[1]) return `${ADD[pm].add} ${add[1]}`;
  const remote = /^npx (?:-y|--yes) (.+)$/.exec(command);
  if (remote?.[1]) return `${RUN[pm].remote} ${remote[1]}`;
  const local = /^npx (?!-)(.+)$/.exec(command);
  if (local?.[1]) return `${RUN[pm].local} ${local[1]}`;
  return command;
}

/** A shell snippet written with npm, for another package manager; comments are kept. */
export function forPackageManager(code: string, pm: PackageManager): string {
  return code
    .split('\n')
    .map((line) => {
      const [, indent = '', command = '', comment = ''] = /^(\s*)(.*?)(\s+#.*)?$/.exec(line) ?? [];
      return `${indent}${convert(command, pm)}${comment}`;
    })
    .join('\n');
}
