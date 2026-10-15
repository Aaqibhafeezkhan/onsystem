// Builds the population of distinct corpus findings from the raw per-run results that
// `node scripts/corpus.mjs --dir <corpus>` writes to <corpus>/.results/<run>.json.
//
//   node population.mjs <onsystem checkout> <corpus dir> <population.json> <population-summary.json>
//
// "Distinct" is the README's definition (test/readme.test.ts, site/scripts/generate.mjs):
//   - a run with its own `config` (dub-web-configured) re-checks another run's files: left out;
//   - a run with `sameAs` (the monorepo-root runs, and dub-web-package with sameAs ".") counts
//     only the findings outside the folders other runs check from inside (the snapshot's `added`);
//   - every other run counts all of its findings.
// Fingerprints and occurrences are computed exactly as scripts/corpus-lib.ts `findings()` does,
// over each run's full results, so a later label in corpus/labels.json can reuse them.
// No suggestion or fix text is copied: only whether the finding has a fix.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const [onsystemDir, corpusDir, outFile, summaryFile] = process.argv.slice(2);
if (!summaryFile) {
  console.error(
    'usage: node population.mjs <onsystem> <corpus dir> <population.json> <summary.json>',
  );
  process.exit(2);
}
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const repos = readJson(path.join(onsystemDir, 'corpus', 'repos.json')).repos;
const snapshot = readJson(path.join(onsystemDir, 'corpus', 'snapshot.json'));

const fingerprint = (run, file, rule, source, occurrence) =>
  createHash('sha256')
    .update([run, file, rule, source, String(occurrence)].join('\0'))
    .digest('hex')
    .slice(0, 12);
const prefix = (folder) => {
  const t = folder.replace(/\/+$/, '');
  return t === '.' ? '' : `${t}/`;
};
const join = (cwd, file) =>
  cwd === '.' || cwd === '' ? file : `${cwd.replace(/\/+$/, '')}/${file}`;

const population = [];
const perRun = {};
const mismatches = [];
for (const repo of repos) {
  for (const run of repo.runs) {
    const results = readJson(path.join(corpusDir, '.results', `${run.name}.json`));
    const all = [];
    for (const result of results) {
      const seen = new Map();
      for (const d of result.diagnostics) {
        const key = `${d.ruleId}\0${d.source}`;
        const occurrence = (seen.get(key) ?? 0) + 1;
        seen.set(key, occurrence);
        all.push({ result, d, occurrence });
      }
    }
    // Snapshot check: counts per rule for the whole run must equal snapshot.runs[run].rules.
    const count = (list) => {
      const out = {};
      for (const { d } of list) {
        const c = (out[d.ruleId] ??= { errors: 0, warnings: 0, fixes: 0 });
        if (d.severity === 'error') c.errors++;
        else c.warnings++;
        if (d.fix?.length) c.fixes++;
      }
      return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
    };
    const snap = snapshot.runs[run.name];
    if (JSON.stringify(count(all)) !== JSON.stringify(snap?.rules))
      mismatches.push(`${run.name}: rules`);

    let kept;
    let mode;
    if (run.config) {
      kept = [];
      mode = 'excluded (own config: re-checks another run)';
    } else if (run.sameAs) {
      const prefixes = Object.keys(run.sameAs).map(prefix);
      kept = all.filter(({ result }) => !prefixes.some((p) => result.file.startsWith(p)));
      mode = `added only (outside ${Object.keys(run.sameAs).join(', ')})`;
      if (JSON.stringify(count(kept)) !== JSON.stringify(snap?.added))
        mismatches.push(`${run.name}: added`);
    } else {
      kept = all;
      mode = 'all';
    }
    perRun[run.name] = {
      repo: repo.name,
      cwd: run.cwd,
      all: all.length,
      distinct: kept.length,
      mode,
    };
    for (const { result, d, occurrence } of kept) {
      const file = join(run.cwd, result.file);
      population.push({
        id: `${repo.name}:${file}:${d.line}:${d.column}:${d.ruleId}`,
        repo: repo.name,
        repoUrl: repo.url,
        sha: repo.sha,
        run: run.name,
        cwd: run.cwd,
        file,
        runFile: result.file,
        line: d.line,
        column: d.column,
        endLine: d.endLine,
        endColumn: d.endColumn,
        rule: d.ruleId,
        severity: d.severity,
        message: d.message,
        source: d.source,
        occurrence,
        fingerprint: fingerprint(run.name, result.file, d.ruleId, d.source, occurrence),
        hasFix: Boolean(d.fix?.length),
      });
    }
  }
}

// Ids must be unique, or two runs would count one finding twice.
const ids = new Map();
for (const f of population) ids.set(f.id, (ids.get(f.id) ?? 0) + 1);
const duplicateIds = [...ids].filter(([, n]) => n > 1);

const perRule = {};
for (const f of population) {
  const c = (perRule[f.rule] ??= { findings: 0, errors: 0, warnings: 0, withFix: 0 });
  c.findings++;
  if (f.severity === 'error') c.errors++;
  else c.warnings++;
  if (f.hasFix) c.withFix++;
}
const total = population.length;
const rules = Object.fromEntries(
  Object.entries(perRule)
    .sort(([a, x], [b, y]) => y.findings - x.findings || a.localeCompare(b))
    .map(([rule, c]) => [rule, { ...c, share: c.findings / total }]),
);

fs.writeFileSync(outFile, `${JSON.stringify(population)}\n`);
const summary = {
  total,
  rules,
  perRun,
  duplicateIds: duplicateIds.length,
  snapshotMismatches: mismatches,
};
fs.writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`);

console.log(`distinct findings: ${total}`);
for (const [rule, c] of Object.entries(rules))
  console.log(
    `  ${rule.padEnd(34)} ${String(c.findings).padStart(6)}  ${(c.share * 100).toFixed(2)}%`,
  );
console.log(
  `duplicate ids: ${duplicateIds.length}${
    duplicateIds.length
      ? ` e.g. ${duplicateIds
          .slice(0, 5)
          .map(([id]) => id)
          .join(', ')}`
      : ''
  }`,
);
console.log(`snapshot mismatches: ${mismatches.length ? mismatches.join('; ') : 'none'}`);
