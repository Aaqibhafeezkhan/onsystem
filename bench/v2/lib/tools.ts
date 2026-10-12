// The file tools every arm gets: list, read, search, write and edit, confined to the run's copy
// of the repository. There is no shell: the v1 prompt already told agents not to run commands,
// and without one, no arm can run the project's code. Names and behaviour follow what coding
// agents ship (Claude Code's Read/Glob/Grep/Write/Edit, Codex's and Gemini CLI's equivalents).

import fs from 'node:fs';
import path from 'node:path';

import type { ToolDef } from './providers.js';

export interface WriteEvent {
  /** Absolute path of the file written. */
  file: string;
  kind: 'Write' | 'Edit';
  content?: string;
  oldString?: string;
  newString?: string;
}

export interface ToolOutcome {
  output: string;
  isError: boolean;
  write?: WriteEvent;
}

const SKIP = new Set(['node_modules', '.git', '.next', '.turbo', 'dist', 'build', 'coverage']);
const MAX_LIST = 400;
const MAX_MATCHES = 100;
const MAX_READ_CHARS = 100_000;

export const FILE_TOOLS: ToolDef[] = [
  {
    name: 'list_files',
    description:
      'List files and folders under a folder of the project (node_modules, .git and build output are left out). Folders end with "/".',
    schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Folder relative to the project root. Default: the root.',
        },
        depth: {
          type: 'integer',
          minimum: 1,
          maximum: 5,
          description: 'How many levels to list. Default: 2.',
        },
      },
    },
  },
  {
    name: 'read_file',
    description: 'Read a text file of the project, with line numbers.',
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File relative to the project root.' },
        offset: {
          type: 'integer',
          minimum: 1,
          description: 'First line to read (1-based). Default: 1.',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 2000,
          description: 'Number of lines. Default: 400.',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_files',
    description:
      'Search the project\'s files for a regular expression (JavaScript syntax) and list matching lines as "file:line: text".',
    schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regular expression to search for.' },
        path: {
          type: 'string',
          description: 'Folder to search in, relative to the project root. Default: the root.',
        },
        glob: {
          type: 'string',
          description: 'Only file names matching this pattern, e.g. "*.tsx".',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'write_file',
    description: "Create a file, or replace a file's whole content. Folders are created as needed.",
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File relative to the project root.' },
        content: { type: 'string', description: 'The complete file content.' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description:
      'Replace an exact piece of text in a file. old_string must appear exactly once unless replace_all is true.',
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File relative to the project root.' },
        old_string: { type: 'string', description: 'The exact text to replace.' },
        new_string: { type: 'string', description: 'The text to put in its place.' },
        replace_all: { type: 'boolean', description: 'Replace every occurrence. Default: false.' },
      },
      required: ['path', 'old_string', 'new_string'],
    },
  },
];

/** The project-relative form of a path, or an error when it leaves the project. */
export function resolveInside(
  root: string,
  requested: unknown,
): { file: string; relative: string } {
  if (typeof requested !== 'string' || !requested.trim()) throw new Error('path is required.');
  const file = path.resolve(root, requested);
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${requested} is outside the project.`);
  }
  return { file, relative: relative.split(path.sep).join('/') || '.' };
}

export function createFileTools(
  root: string,
): (name: string, input: Record<string, unknown>) => ToolOutcome | undefined {
  return (name, input) => {
    try {
      switch (name) {
        case 'list_files':
          return ok(list(root, input));
        case 'read_file':
          return ok(read(root, input));
        case 'search_files':
          return ok(search(root, input));
        case 'write_file':
          return write(root, input);
        case 'edit_file':
          return edit(root, input);
        default:
          return undefined;
      }
    } catch (error) {
      return { output: error instanceof Error ? error.message : String(error), isError: true };
    }
  };
}

const ok = (output: string): ToolOutcome => ({ output, isError: false });

function list(root: string, input: Record<string, unknown>): string {
  const { file, relative } = resolveInside(root, input.path ?? '.');
  if (!fs.statSync(file).isDirectory()) throw new Error(`${relative} is not a folder.`);
  const depth = clamp(input.depth, 1, 5, 2);
  const out: string[] = [];
  const walk = (dir: string, level: number) => {
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      if (out.length >= MAX_LIST) return;
      if (SKIP.has(e.name) || e.name === '.DS_Store') continue;
      const rel = path.relative(root, path.join(dir, e.name)).split(path.sep).join('/');
      const isDir = e.isDirectory();
      out.push(isDir ? `${rel}/` : rel);
      if (isDir && level < depth) walk(path.join(dir, e.name), level + 1);
    }
  };
  walk(file, 1);
  if (out.length >= MAX_LIST) out.push(`(stopped at ${MAX_LIST} entries: list a subfolder)`);
  return out.join('\n') || '(empty)';
}

function read(root: string, input: Record<string, unknown>): string {
  const { file, relative } = resolveInside(root, input.path);
  if (!fs.existsSync(file)) throw new Error(`${relative} does not exist.`);
  if (fs.statSync(file).isDirectory()) throw new Error(`${relative} is a folder: use list_files.`);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const offset = clamp(input.offset, 1, Math.max(1, lines.length), 1);
  const limit = clamp(input.limit, 1, 2000, 400);
  const slice = lines.slice(offset - 1, offset - 1 + limit);
  let text = slice.map((l, i) => `${String(offset + i).padStart(5)}\t${l}`).join('\n');
  if (text.length > MAX_READ_CHARS)
    text = `${text.slice(0, MAX_READ_CHARS)}\n(cut at ${MAX_READ_CHARS} characters)`;
  const end = offset - 1 + slice.length;
  const note =
    end < lines.length || offset > 1 ? `\n(lines ${offset}-${end} of ${lines.length})` : '';
  return `${text}${note}`;
}

function search(root: string, input: Record<string, unknown>): string {
  if (typeof input.pattern !== 'string' || !input.pattern) throw new Error('pattern is required.');
  let regex: RegExp;
  try {
    regex = new RegExp(input.pattern);
  } catch (error) {
    throw new Error(
      `Invalid regular expression: ${error instanceof Error ? error.message : String(error)}`,
      {
        cause: error,
      },
    );
  }
  const { file: start } = resolveInside(root, input.path ?? '.');
  const glob = typeof input.glob === 'string' && input.glob ? globToRegex(input.glob) : undefined;
  const out: string[] = [];
  const visit = (target: string) => {
    if (out.length >= MAX_MATCHES) return;
    let stat: fs.Stats;
    try {
      stat = fs.statSync(target);
    } catch {
      return; // A dangling symlink, or a file that went away: nothing to search.
    }
    if (stat.isDirectory()) {
      for (const e of fs.readdirSync(target).sort()) {
        if (SKIP.has(e)) continue;
        visit(path.join(target, e));
      }
      return;
    }
    if (glob && !glob.test(path.basename(target))) return;
    if (stat.size > 1_000_000) return;
    let text: string;
    try {
      text = fs.readFileSync(target, 'utf8');
    } catch {
      return;
    }
    if (text.includes('\u0000')) return;
    const rel = path.relative(root, target).split(path.sep).join('/');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length && out.length < MAX_MATCHES; i++) {
      const line = lines[i] ?? '';
      if (regex.test(line)) out.push(`${rel}:${i + 1}: ${line.trim().slice(0, 300)}`);
    }
  };
  visit(start);
  if (out.length >= MAX_MATCHES)
    out.push(`(stopped at ${MAX_MATCHES} matches: narrow the pattern or the path)`);
  return out.join('\n') || 'No matches.';
}

function write(root: string, input: Record<string, unknown>): ToolOutcome {
  const { file, relative } = resolveInside(root, input.path);
  assertWritable(relative);
  if (typeof input.content !== 'string') throw new Error('content is required.');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const existed = fs.existsSync(file);
  fs.writeFileSync(file, input.content);
  return {
    output: `${existed ? 'Replaced' : 'Created'} ${relative} (${input.content.split('\n').length} lines).`,
    isError: false,
    write: { file, kind: 'Write', content: input.content },
  };
}

function edit(root: string, input: Record<string, unknown>): ToolOutcome {
  const { file, relative } = resolveInside(root, input.path);
  assertWritable(relative);
  const { old_string: oldString, new_string: newString } = input;
  if (typeof oldString !== 'string' || !oldString) throw new Error('old_string is required.');
  if (typeof newString !== 'string') throw new Error('new_string is required.');
  if (!fs.existsSync(file)) throw new Error(`${relative} does not exist.`);
  const text = fs.readFileSync(file, 'utf8');
  const count = text.split(oldString).length - 1;
  if (!count) throw new Error(`old_string was not found in ${relative}.`);
  if (count > 1 && input.replace_all !== true) {
    throw new Error(
      `old_string appears ${count} times in ${relative}: add context, or set replace_all.`,
    );
  }
  fs.writeFileSync(file, text.split(oldString).join(newString));
  return {
    output: `Edited ${relative} (${count} replacement${count === 1 ? '' : 's'}).`,
    isError: false,
    write: { file, kind: 'Edit', oldString, newString },
  };
}

function assertWritable(relative: string): void {
  const parts = relative.split('/');
  if (parts.includes('node_modules') || parts.includes('.git')) {
    throw new Error(`${relative} is inside node_modules or .git, which this task must not change.`);
  }
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.min(max, Math.max(min, n));
}

/** `*.tsx`, `*.{ts,tsx}` and `button*` style name patterns. */
export function globToRegex(glob: string): RegExp {
  let source = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i] as string;
    if (c === '*') source += '.*';
    else if (c === '?') source += '.';
    else if (c === '{') {
      const end = glob.indexOf('}', i);
      if (end === -1) source += '\\{';
      else {
        source += `(?:${glob
          .slice(i + 1, end)
          .split(',')
          .map((s) => s.replace(/[.+^$()|[\]\\]/g, '\\$&').replace(/\*/g, '.*'))
          .join('|')})`;
        i = end;
      }
    } else source += c.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${source}$`);
}
