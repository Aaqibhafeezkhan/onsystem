#!/usr/bin/env node
import fs from 'node:fs';
import module from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Node.js keeps the code it compiled for the CLI and TypeScript, so a run after the first starts
// sooner: the Claude Code hook starts one per edit. The cache is turned on before the CLI loads,
// which is why the CLI is imported below rather than at the top. Node.js 22.1 and later; skipped
// on Node.js 20, and when NODE_DISABLE_COMPILE_CACHE is set.
const folder = ownFolder();
if (folder) {
  (module as Partial<Pick<typeof module, 'enableCompileCache'>>).enableCompileCache?.(
    path.join(folder, 'compile-cache'),
  );
}

// The Claude Code hook names a file here when npx starts the CLI: the CLI writes its own path
// in it, and the hook's next edits run it with Node.js directly, without npm.
const remember = process.env.ONSYSTEM_REMEMBER_CLI;
if (remember) {
  try {
    fs.writeFileSync(remember, fileURLToPath(import.meta.url));
  } catch {
    // The hook goes on running npx.
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

/**
 * The user's own folder in the system temp folder, `onsystem-<uid>`, where the model of a project
 * without node_modules is cached too: created for the user alone, and undefined when someone else
 * could write to it, since the code cached there is run. Windows gives each user a temp folder.
 */
function ownFolder(): string | undefined {
  const user = process.getuid ? `-${String(process.getuid())}` : '';
  const dir = path.join(os.tmpdir(), `onsystem${user}`);
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    if (!process.getuid) return dir;
    const stat = fs.lstatSync(dir);
    const own = stat.isDirectory() && stat.uid === process.getuid() && !(stat.mode & 0o022);
    return own ? dir : undefined;
  } catch {
    return undefined;
  }
}
