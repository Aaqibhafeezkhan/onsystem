import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Node.js built-ins only: src/bin.ts imports this before it turns on the compile cache, and the
// rest of the CLI loads after that.

/**
 * The user's own folder in the system temp folder, `onsystem-<uid>` (`onsystem` on Windows):
 * the cached model and detection of a project without `node_modules`, Node.js's compile cache
 * for the CLI, and the path of the CLI npx installed, which the Claude Code hook runs.
 */
export function ownFolder(): string {
  const user = process.getuid ? `-${String(process.getuid())}` : '';
  return path.join(os.tmpdir(), `onsystem${user}`);
}

/**
 * What the user can do when the {@link ownFolder} cannot be trusted: os.tmpdir() reads TMPDIR on
 * Linux and macOS and TEMP on Windows, where the folder must also be inside the home folder.
 */
export function ownFolderAdvice(): string {
  const windows = process.platform === 'win32' || !process.getuid;
  return `set TMPDIR (TEMP on Windows) to a folder of your own${windows ? ' inside your home folder' : ''}`;
}

/**
 * Why `dir` (the {@link ownFolder}) cannot be trusted, or undefined when it can. What is kept in
 * it decides what code runs and what is read as the design system, and the system temp folder
 * can be shared. With `create`, it is created first, for the user alone.
 *
 * It must be a folder, not a link. On Linux and macOS it must belong to the user, and no one else
 * may write to it: one that others can write to is refused rather than closed, since a file put
 * in it before would stay. Windows has no such owner to check here: there it must be inside the
 * user's home folder (links resolved), where Windows keeps each user's own temp folder.
 *
 * The Claude Code hook keeps a copy of this rule (plugins/onsystem/hooks/check-ui.mjs), since it
 * runs without the package: keep them the same.
 */
export function untrustedFolder(dir: string, create = false): string | undefined {
  try {
    // mkdir applies the umask, which may leave the user without access to it: the folder it
    // made is set to theirs alone.
    if (create && fs.mkdirSync(dir, { recursive: true, mode: 0o700 }) !== undefined) {
      fs.chmodSync(dir, 0o700);
    }
    const stat = fs.lstatSync(dir);
    if (!stat.isDirectory()) return `${dir} is not a folder`;
    if (process.platform === 'win32' || !process.getuid) {
      const home = fs.realpathSync.native(os.homedir());
      const relative = path.relative(home, fs.realpathSync.native(dir));
      const inside = !relative.startsWith('..') && !path.isAbsolute(relative);
      return inside ? undefined : `${dir} is outside your home folder`;
    }
    if (stat.uid !== process.getuid()) return `${dir} belongs to another user`;
    if (stat.mode & 0o022) return `other users can write to ${dir}`;
    // Others can read it but not write to it: closed, since what is kept in it names projects.
    if (create && stat.mode & 0o077) fs.chmodSync(dir, 0o700);
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
}
