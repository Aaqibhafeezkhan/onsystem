// The independent scorer behind `run.mjs score --with shadcn-lint`, run as a child process:
// @shadcn/lint's rules in ESLint, on each run's file at its path in the prepared repository. The
// file is passed to ESLint as text with that path, so nothing is written into the repository.
//
// stdin:  { scorer, root, rules, files: [{ id, file, code }] }, where `scorer` is the folder
//         @shadcn/lint, ESLint and the parser are installed in, `root` the prepared repository
//         and `file` each run's file relative to it.
// stdout: one JSON line per file, { id, messages }.
//
// run.mjs starts it in the scorer's folder with a minimal environment. To know which classes
// exist, @shadcn/lint loads the Tailwind the repository installed (and the plugins its CSS
// names), as it would in the project itself.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { shadcnLintConfig } from './score.ts';

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const from = createRequire(path.join(input.scorer, 'package.json'));
const load = (id) => import(pathToFileURL(from.resolve(id)).href);
const [{ ESLint }, shadcn, parser] = await Promise.all([
  load('eslint'),
  load('@shadcn/lint'),
  load('@typescript-eslint/parser'),
]);

const eslint = new ESLint({
  cwd: input.root,
  // The repository's own ESLint config is never read: only the scorer's rules run.
  overrideConfigFile: true,
  overrideConfig: shadcnLintConfig({
    plugin: shadcn.plugin,
    parser: parser.default ?? parser,
    rules: input.rules,
  }),
});

for (const { id, file, code } of input.files) {
  const [result] = await eslint.lintText(code, {
    filePath: path.join(input.root, file),
    warnIgnored: true,
  });
  const messages = (result?.messages ?? []).map(
    ({ ruleId, severity, message, line, column, fatal }) => ({
      ruleId,
      severity,
      message,
      line,
      column,
      ...(fatal ? { fatal } : {}),
    }),
  );
  process.stdout.write(`${JSON.stringify({ id, messages })}\n`);
}
