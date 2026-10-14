import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { labelKey, type Label, type Snapshot } from '../scripts/corpus-lib.js';
import { loadConfig, RULE_IDS } from '../src/config.js';

// Every number the README and the docs quote comes from a file in the repository; these tests
// fail when the text and the file disagree, so a new snapshot or benchmark run means an update.
const root = path.resolve(import.meta.dirname, '..');

interface Repos {
  repos: { name: string; sha: string; runs: { name: string; config?: string }[] }[];
}
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const readme = read('README.md');
/** A `## heading` section of the README, up to the next one. */
const section = (heading: string) => {
  const start = readme.indexOf(`\n${heading}\n`);
  expect(start, heading).toBeGreaterThan(-1);
  const end = readme.indexOf('\n## ', start + 1);
  return readme.slice(start, end === -1 ? undefined : end);
};

describe('the README', () => {
  // test/install.test.ts checks what each install link installs.
  it('opens with one-click installs for Cursor, VS Code and Claude Code', () => {
    const top = readme.slice(0, readme.indexOf('<!-- npm-readme:video -->'));
    expect(top).toContain('](https://cursor.com/en/install-mcp?name=onsystem&config=');
    expect(top).toContain(
      '](https://insiders.vscode.dev/redirect/mcp/install?name=onsystem&config=',
    );
    expect(top).toContain('](https://onsystem.vercel.app/docs/plugin)');
  });

  it('links the MCP Registry badge to the server.json name, and reads the version from there', () => {
    const top = readme.slice(0, readme.indexOf('<!-- npm-readme:video -->'));
    const { name } = JSON.parse(read('server.json')) as { name: string };
    // The lookup by name, not the search: the search (/v0/servers?search=) takes seconds, so
    // shields.io gives up and the badge reads "inaccessible", and the registry's page with ?q=
    // did not show the server.
    const lookup = `https://registry.modelcontextprotocol.io/v0.1/servers/${encodeURIComponent(name)}/versions/latest`;
    expect(top).toContain(
      `url=${encodeURIComponent(lookup)}&query=${encodeURIComponent('$.server.version')}&`,
    );
    expect(top).toContain(`](${lookup})`);
    expect(top).not.toContain('search%3D');
  });

  it('shows no download count', () => {
    // npm's weekly count is mostly mirrors and bots: the deprecated placeholders 0.0.1 and
    // 0.0.0-stage get as many downloads as the latest version (api.npmjs.org/versions/onsystem/last-week).
    expect(readme).not.toMatch(/shields\.io\/npm\/d[wmyt]\//);
  });

  it('points GitHub Action users at the Action before the badges', () => {
    // The Marketplace listing shows this README, which opens on the MCP server.
    const pitch = readme.slice(0, readme.indexOf('[!['));
    expect(pitch).toContain('`uses: dgesteves/onsystem@v0`');
    expect(pitch).toContain('](https://onsystem.vercel.app/docs/ci)');
  });

  it('links the Quickstart to the guide for code from shadcn registries', () => {
    expect(section('## Quickstart')).toContain(
      '](https://onsystem.vercel.app/docs/configuration#code-from-shadcn-registries)',
    );
  });

  it('links each client badge to a section of docs/clients.md', () => {
    const top = readme.slice(0, readme.indexOf('<!-- npm-readme:video -->'));
    // The site's ids: a heading's or a <details> summary's text, as site/components/markdown-blocks.tsx slugs it.
    const slug = (text: string) =>
      text
        .toLowerCase()
        .replace(/<[^>]+>|`/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    const clients = read('docs/clients.md');
    const ids = new Set([
      ...[...clients.matchAll(/^#{1,4} (.+)$/gm)].map((m) => slug(m[1] ?? '')),
      ...[...clients.matchAll(/<summary>(?:<strong>)?(.*?)(?:<\/strong>)?<\/summary>/g)].map((m) =>
        slug(m[1] ?? ''),
      ),
    ]);
    const anchors = [
      ...top.matchAll(/\]\(https:\/\/onsystem\.vercel\.app\/docs\/clients#([\w-]+)\)/g),
    ].map((m) => m[1]);
    expect(anchors.length).toBeGreaterThan(5);
    for (const anchor of anchors) expect(ids, anchor).toContain(anchor);
  });

  it('lists every rule with its default severity', async () => {
    const { rules } = await loadConfig({ cwd: fs.mkdtempSync(path.join(os.tmpdir(), 'readme-')) });
    const rows = readme.split('\n').filter((line) => /^\| `[\w-]+` +\|/.test(line));
    expect(rows.map((row) => /^\| `([\w-]+)`/.exec(row)?.[1]).sort()).toEqual([...RULE_IDS].sort());
    for (const id of RULE_IDS) {
      const row = rows.find((r) => r.startsWith(`| \`${id}\``));
      expect(row?.split('|')[2]?.trim(), id).toBe(rules[id].severity);
    }
  });

  // The corpus paragraph: what was checked, what the labels cover, and a false-positive rate only
  // when a sample can give one for all findings.
  const corpus = () => {
    const labels = JSON.parse(read('corpus/labels.json')) as Label[];
    const snapshot = JSON.parse(read('corpus/snapshot.json')) as Snapshot;
    const repos = JSON.parse(read('corpus/repos.json')) as Repos;
    const random = labels.filter((l) => l.sample === 'random');
    // The random sample, among the findings the snapshot says are still reported.
    const sample = random.filter((l) => snapshot.labels[labelKey(l)]);
    // A run with a config of its own checks the same files as another run: not counted twice.
    const rechecks = new Set(
      repos.repos.flatMap((r) => r.runs.filter((run) => run.config).map((run) => run.name)),
    );
    let distinct = 0;
    // Distinct findings in a run and rule with at least one label in the sample.
    let covered = 0;
    let unknown = 0;
    let unknownInFlowise = 0;
    // A run from a monorepo root counts only the findings it adds to the runs from its projects.
    for (const [run, { rules, added }] of Object.entries(snapshot.runs)) {
      for (const [rule, counts] of Object.entries(added ?? rules)) {
        const n = counts.errors + counts.warnings;
        if (!rechecks.has(run)) {
          distinct += n;
          if (sample.some((l) => l.run === run && l.rule === rule)) covered += n;
        }
        if (/^no-unknown-(component|prop|variant)$/.test(rule)) {
          unknown += n;
          if (run === 'flowise-ui') unknownInFlowise += n;
        }
      }
    }
    return { snapshot, repos, random, sample, distinct, covered, unknown, unknownInFlowise };
  };
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  // The paragraph's percentages: the coverage it states, and any rate.
  const paragraph = /\*\*How often it is wrong\.\*\*.*/.exec(readme)?.[0] ?? '';

  it('quotes the corpus size and how much of it the labelled sample covers', () => {
    const { snapshot, repos, random, sample, distinct, covered, unknown, unknownInFlowise } =
      corpus();
    const text = readme.replace(/\s+/g, ' ');
    expect(text).toContain(`on ${String(repos.repos.length)} public repositories pinned by commit`);
    expect(text).toContain(
      `${String(Object.keys(snapshot.runs).length)} runs, ${distinct.toLocaleString('en-US')} distinct findings`,
    );
    expect(text).toContain(
      `the runs and rules it has labels for hold ${pct(covered / distinct)} of them`,
    );
    // A fix that removes a finding takes its label out of the sample: most were false positives.
    const fp = random.filter((l) => l.verdict === 'FP');
    const fixed = fp.filter((l) => !sample.includes(l));
    expect(text).toContain(
      `${String(fixed.length)} of its ${String(fp.length)} false positives were fixed`,
    );
    // Invented components, props and variants: MUI's Flowise has most of them.
    const unknownSample = sample.filter((l) => /^no-unknown-/.test(l.rule));
    expect(text).toContain(
      `those three rules have ${String(unknown)} findings in the corpus, ${String(unknownInFlowise)} of them in Flowise, an MUI app`,
    );
    expect(text).toContain(`the ${String(unknownSample.length)} still in the sample are all right`);
    expect(unknownSample.every((l) => l.verdict === 'TP')).toBe(true);
  });

  it('quotes no false-positive rate until a random sample covers the findings and is intact', () => {
    const { random, sample, distinct, covered } = corpus();
    // A rate from the sample speaks only for the runs and rules it has labels for, so it needs
    // labels where the findings are (at least 80% of them, as CONTRIBUTING.md says). And once
    // the false positives a sample found are fixed, the labels left behind under-count them.
    const coverage = covered / distinct;
    const fixed = random.length - sample.length;
    const state = `the random sample covers ${pct(coverage)} of ${distinct.toLocaleString('en-US')} distinct findings, and ${String(fixed)} of its ${String(random.length)} labels are no longer reported`;
    console.info(`corpus labels: ${state}`);
    const quotable = coverage >= 0.8 && fixed === 0;
    // Any percentage besides the coverage is a rate. When one is quotable, test it here.
    const rates = [...paragraph.matchAll(/\d+(?:\.\d+)?%/g)]
      .map((m) => m[0])
      .filter((p) => p !== pct(coverage));
    expect(paragraph).not.toBe('');
    expect(quotable ? [] : rates, `no rate to quote: ${state}`).toEqual([]);
  });

  it('says who made the corpus labels, and never that they were made by hand', () => {
    // PR #98: the labels in corpus/labels.json were not all made by hand.
    const files = [
      'README.md',
      'CONTRIBUTING.md',
      'site/lib/faq.ts',
      ...fs
        .readdirSync(path.join(root, 'docs'))
        .filter((file) => file.endsWith('.md'))
        .map((file) => `docs/${file}`),
    ];
    const hits = files.flatMap((file) =>
      read(file)
        .split('\n')
        .flatMap((line, i) =>
          /hand[- ]label|label(?:l?ed)? by hand|human[- ]label/i.test(line)
            ? [`${file}:${String(i + 1)}`]
            : [],
        ),
    );
    expect(hits).toEqual([]);
    expect(paragraph).toContain('labels made by an AI reviewer');
  });

  it('says the labels leave out code installed from shadcn registries', () => {
    // vercel/chatbot keeps Vercel's AI Elements, installed from a shadcn registry, in
    // components/ai-elements, inside the chatbot run's folders.
    const labels = JSON.parse(read('corpus/labels.json')) as Label[];
    expect(labels.filter((l) => /(^|\/)components\/ai-elements\//.test(l.file))).toEqual([]);
    expect(paragraph).toContain("such as the chatbot's `components/ai-elements`, has no labels");
    expect(paragraph).toContain(
      '](https://onsystem.vercel.app/docs/configuration#code-from-shadcn-registries)',
    );
  });

  it('quotes benchmark v2 with its size, the version it ran, and what its count cannot show', () => {
    interface Rate {
      value: number;
    }
    interface Row {
      model: string;
      arm: string;
      runs: number;
      tscPass: Rate;
      onsystemErrors: Rate;
    }
    const v2 = (file: string) => JSON.parse(read(`bench/v2/${file}`)) as unknown;
    const { info, rows, deltas } = v2('results/standard/results.json') as {
      info: { onsystem: string; repos: Record<string, unknown> };
      rows: Row[];
      deltas: { model: string; arm: string; tscPass: { low: number; high: number } }[];
    };
    const { models } = v2('config/models.json') as { models: { id: string; provider: string }[] };
    const { tasks } = v2('config/tasks.json') as { tasks: { repo: string }[] };
    const key = v2('results/standard/labels/key.json') as Record<string, { arm: string }>;
    const arms = ['none', 'skill', 'mcp', 'hook', 'all'];
    const pooled = (arm: string) => {
      const row = rows.find((r) => r.model === 'all models' && r.arm === arm);
      expect(row, arm).toBeDefined();
      return row as Row;
    };
    const [none, all] = [pooled('none'), pooled('all')];
    const ids = new Set(rows.filter((r) => !r.model.endsWith(' models')).map((r) => r.model));
    const providers = new Set([...ids].map((id) => models.find((m) => m.id === id)?.provider));
    const perArm = new Set(arms.map((arm) => pooled(arm).runs));
    const labelled = new Set(
      arms.map((arm) => Object.values(key).filter((k) => k.arm === arm).length),
    );
    expect(perArm.size).toBe(1);
    expect(labelled.size).toBe(1);
    // "No measurable change": the paired difference's interval holds 0.
    const tsc = deltas.find((d) => d.model === 'all models' && d.arm === 'all')?.tscPass;
    expect(tsc && tsc.low <= 0 && tsc.high >= 0).toBe(true);

    const pct = (rate: Rate) => `${String(Math.round(rate.value * 100))}%`;
    const total = arms.reduce((n, arm) => n + pooled(arm).runs, 0);
    const help = section('## Does it help?').replace(/\s+/g, ' ');
    expect(help).toContain('[Benchmark v2](bench/v2)');
    expect(help).toContain(
      `${String(ids.size)} models from ${String(providers.size)} providers (Anthropic, OpenAI and Google) ${String(tasks.filter((t) => t.repo in info.repos).length)} single-file UI tasks in ${String(Object.keys(info.repos).length)} open-source repositories`,
    );
    expect(help).toContain(
      `${total.toLocaleString('en-US')} runs, ${String([...perArm][0])} per arm`,
    );
    expect(help).toContain(
      `Counted by onsystem ${info.onsystem}'s own check, design-system errors per run went from ${none.onsystemErrors.value.toFixed(2)} without onsystem to ${all.onsystemErrors.value.toFixed(2)} with all three, with no measurable change in the \`tsc\` pass rate (${pct(none.tscPass)} → ${pct(all.tscPass)})`,
    );
    // The count is onsystem's own, it rewards chart tokens used as status colors, and the
    // independent labels are a small sample.
    expect(help).toContain('the MCP server and the hook show the agent the same errors');
    expect(help).toContain('`chart-*` tokens');
    // Three tasks, not two: bench/v2's Threats to validity names them and counts their runs.
    expect(help).toContain(
      'In tasks that ask for a green status label in a design system with no success token',
    );
    expect(help).toContain(
      `The blind labels by an AI reviewer, ${String([...labelled][0])} files per arm, are too few to confirm the count either way`,
    );
    expect(help).not.toContain('bench/agents');
  });
});

describe('the docs', () => {
  const snapshot = JSON.parse(read('corpus/snapshot.json')) as Snapshot;
  const repos = JSON.parse(read('corpus/repos.json')) as Repos;
  const run = (name: string) => {
    const found = snapshot.runs[name];
    if (!found) throw new Error(`no run ${name} in the snapshot`);
    const count = (rule: string) =>
      (found.rules[rule]?.errors ?? 0) + (found.rules[rule]?.warnings ?? 0);
    const total = Object.keys(found.rules).reduce((n, rule) => n + count(rule), 0);
    const inspect = found.inspect as { components: number; tokens: Record<string, number> };
    return {
      ...found,
      count,
      total,
      components: inspect.components,
      tokens: Object.values(inspect.tokens).reduce((n, t) => n + t, 0),
    };
  };
  const n = (value: number) => value.toLocaleString('en-US');

  it('quote the corpus snapshot in the table of real codebases', () => {
    const doc = read('docs/how-it-works.md');
    const row = (repo: string) => {
      const sha = repos.repos.find((r) => r.name === repo)?.sha.slice(0, 7) ?? '';
      const line = doc.split('\n').find((l) => l.startsWith('| [') && l.includes(`\`${sha}\``));
      expect(line, `a row for ${repo} at ${sha}`).toBeDefined();
      // Cells are padded to line the table up.
      return (line ?? '').replace(/\s+/g, ' ');
    };

    const chatbot = run('chatbot');
    expect(row('chatbot')).toContain(
      `${n(chatbot.components)} components, ${n(chatbot.tokens)} tokens | ${n(chatbot.total)} in \`app/\` and \`components/\`: ${n(chatbot.count('no-hardcoded-color'))} raw colors, ${n(chatbot.count('prefer-design-system-component'))} native elements the design system wraps, ${n(chatbot.count('icon-button-accessible-name'))} icon-only buttons without an accessible name, ${n(chatbot.count('no-hardcoded-radius'))} arbitrary radius`,
    );

    const midday = run('midday-dashboard');
    expect(row('midday')).toContain(
      `${n(midday.components)} components | ${n(midday.total)} in \`src/\`, including ${n(midday.count('icon-button-accessible-name'))} icon-only buttons`,
    );

    const shadcn = run('shadcn-website');
    const colors = shadcn.count('no-hardcoded-color');
    expect(colors * 2).toBeGreaterThan(shadcn.total);
    expect(row('shadcn-ui')).toContain(
      `${n(shadcn.components)} components | ${n(shadcn.total)} in \`app/\` and \`components/\`, mostly raw colors (${n(colors)})`,
    );
  });

  it("quote midday's baseline in the CI guide", () => {
    const midday = run('midday-dashboard');
    const ci = read('docs/ci.md').replace(/\s+/g, ' ');
    expect(ci).toContain(`midday's dashboard has ${n(midday.total)})`);
    expect(ci).toContain(
      `Baseline: ${n(midday.total)} findings in ${n(midday.flagged ?? 0)} files → onsystem.baseline.json`,
    );
    expect(ci).toContain(
      `No new problems in ${n(midday.files)} files (${n(midday.total)} in the baseline).`,
    );
  });
});
