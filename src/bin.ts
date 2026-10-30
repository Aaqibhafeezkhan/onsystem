#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ownFolder, untrustedFolder } from './util/own-folder.js';

// Both below are kept in the user's own folder in the system temp folder, and only while it is
// theirs alone: what is in it is run.
const folder = ownFolder();
const own = !untrustedFolder(folder, true);

// Node.js keeps the code it compiled for the CLI and TypeScript, so a run after the first starts
// sooner: the Claude Code hook starts one per edit. The cache is turned on before the CLI loads,
// which is why the CLI is imported below rather than at the top. Node.js 22.1 and later; skipped
// on Node.js 20, and when NODE_DISABLE_COMPILE_CACHE is set.
if (own) {
  (module as Partial<Pick<typeof module, 'enableCompileCache'>>).enableCompileCache?.(
    path.join(folder, 'compile-cache'),
  );
}

// The Claude Code hook names a file when npx starts the CLI: the CLI writes its own path in it,
// and the hook's next edits in that project run it with Node.js directly, without npm. Only an
// `npx-cli-<key>` file directly in that folder, for the user alone; a link there is replaced, not
// followed.
const remember = process.env.ONSYSTEM_REMEMBER_CLI;
if (
  own &&
  remember &&
  path.dirname(path.resolve(remember)) === folder &&
  /^npx-cli-[0-9a-f]{16}$/.test(path.basename(remember))
) {
  const partial = path.join(
    folder,
    `.${path.basename(remember)}.${String(process.pid)}-${randomUUID()}`,
  );
  try {
    fs.writeFileSync(partial, fileURLToPath(import.meta.url), { mode: 0o600, flag: 'wx' });
    fs.renameSync(partial, path.join(folder, path.basename(remember)));
  } catch {
    // The hook goes on running npx.
  } finally {
    fs.rmSync(partial, { force: true });
  }
}

const { main } = await import('./cli.js');

main(process.argv.slice(2)).then(
  (code) => {
    // `serve` resolves once listening; stdin keeps the process alive.
    process.exitCode = code;
  },
  (error: unknown) => {
    process.stderr.write(`${(error as Error).stack ?? String(error)}\n`);
    process.exitCode = 1;
  },
);
