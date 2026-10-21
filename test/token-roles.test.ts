import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import { applyFixes } from '../src/lint/index.js';
import { fixture, load } from './helpers.js';

// Chart tokens used for something else. In bench/v2, agents asked for a green status label in a
// theme with no success token wrote `text-chart-2` (24 of 24 runs with the skill, MCP server and
// hook; 0 of 24 without onsystem), and no rule said a word: the class is a token.

const rule = 'no-hardcoded-color';
// `app/globals.css` from a fresh `shadcn init -d` (base-nova, neutral): chart-1 to chart-5 and
// the sidebar's colors, and no success token.
const globals = fs.readFileSync(
  path.join(import.meta.dirname, 'fixtures/shadcn-neutral/globals.css'),
  'utf8',
);
const BADGE = `import * as React from "react"
export function Badge({ variant, ...props }: React.ComponentProps<"span"> & { variant?: "default" | "outline" }) {
  return <span data-variant={variant} className="inline-flex rounded-md border px-2 text-xs" {...props} />
}`;

const CHART_MESSAGE =
  'is a chart color, and this is not a chart: it changes with the chart palette, and it does not say what a status or brand color says. For a status color, add a token for it to the theme, such as `--success`; otherwise use the semantic token that fits.';

let shadcn: DesignSystem;
beforeAll(async () => {
  shadcn = await load(fixture({ 'app/globals.css': globals, 'components/ui/badge.tsx': BADGE }));
});

const findings = (code: string, file: string, system = shadcn) =>
  system.check(code, file).diagnostics.filter((d) => d.ruleId === rule);
const sources = (code: string, file: string, system = shadcn) =>
  findings(code, file, system).map((d) => d.source);

describe('no-hardcoded-color on chart tokens outside a chart', () => {
  it('warns on a chart token used as a status color', () => {
    // bench/v2/results/standard/runs/claude-haiku-5-5--all--chatbot--settings-card--r1, line 14,
    // and the forms other runs used: a tint, a border, a dark-mode class.
    const code = `import { Badge } from "@/components/ui/badge"

export function ModelSettingsCard() {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium text-base text-foreground">Model settings</h2>
        <Badge className="text-chart-2" variant="outline">
          Connected
        </Badge>
      </div>
      <span className="rounded-full border border-chart-2/30 bg-chart-2/10 px-2 text-xs dark:text-chart-1">
        Active
      </span>
    </section>
  )
}`;
    const result = shadcn.check(code, 'components/chat/model-settings-card.tsx');
    const diagnostics = result.diagnostics.filter((d) => d.ruleId === rule);
    expect(diagnostics.map((d) => [d.line, d.source, d.severity])).toEqual([
      [8, 'text-chart-2', 'warning'],
      [12, 'border-chart-2/30', 'warning'],
      [12, 'bg-chart-2/10', 'warning'],
      [12, 'dark:text-chart-1', 'warning'],
    ]);
    for (const d of diagnostics) {
      expect(d.message).toBe(`\`${d.source}\` ${CHART_MESSAGE}`);
      expect(d.suggestion).toBeUndefined();
      expect(d.fix).toBeUndefined();
    }
    // A warning: check passes, the hook does not block, and --fix changes nothing.
    expect(result.errorCount).toBe(0);
    expect(applyFixes(code, diagnostics)).toBe(code);
    // In a map of classes by status.
    expect(
      sources(
        `const tone = { active: "bg-chart-2 text-white", paused: "bg-muted" }
export const Status = ({ status }: { status: keyof typeof tone }) => (
  <span className={tone[status]}>{status}</span>
)`,
        'components/status.tsx',
      ),
    ).toEqual(['bg-chart-2']);
  });

  it('leaves chart tokens alone in a file that draws a chart', () => {
    const legend = `<div className="flex gap-2"><span className="size-2 rounded-full bg-chart-1" />Desktop</div>`;
    // A chart component, a chart library, chart data, a file named for charts: legend dots and all.
    expect(
      findings(
        `import { ChartContainer } from "@/components/ui/chart"
export function Visitors() {
  return <><ChartContainer config={{}}>{null}</ChartContainer>${legend}</>
}`,
        'app/dashboard/page.tsx',
      ),
    ).toEqual([]);
    expect(
      findings(
        `import { Bar, BarChart } from "recharts"
export function Visitors() {
  return <>${legend}<BarChart data={[]}><Bar dataKey="desktop" className="fill-chart-1" /></BarChart></>
}`,
        'components/visitors.tsx',
      ),
    ).toEqual([]);
    expect(
      findings(`export const Legend = () => ${legend}`, 'components/charts/legend.tsx'),
    ).toEqual([]);
    // shadcn/ui's apps/v4 cards draw charts by hand: bars from `chartData`, a sparkline in an
    // <svg>, bars in a `role="img"` (power-usage.tsx, analytics-card.tsx, dividend-income.tsx).
    expect(
      findings(
        `const chartData = [{ hour: "6a", usage: 1.2 }]
export function PowerUsage() {
  return chartData.map((item) => <div key={item.hour} className="min-h-2 rounded-t bg-chart-2" />)
}`,
        'app/cards/power-usage.tsx',
      ),
    ).toEqual([]);
    expect(
      findings(
        `export function Analytics() {
  return (
    <svg viewBox="0 0 100 86" className="w-full text-chart-1" role="img" aria-label="Visitor trend">
      <path d="M0 52L18 40" stroke="currentColor" />
    </svg>
  )
}`,
        'app/cards/analytics-card.tsx',
      ),
    ).toEqual([]);
    expect(
      findings(
        `export function Dividends({ data }: { data: { q: string; value: number }[] }) {
  return (
    <div className="flex h-8 items-end gap-1" role="img" aria-label="Quarterly dividends">
      {data.map((item) => <div key={item.q} className="flex-1 rounded-t-sm bg-chart-2" />)}
    </div>
  )
}`,
        'app/cards/dividend-income.tsx',
      ),
    ).toEqual([]);
    // The same dot in a stat card that draws no chart is reported.
    expect(sources(`export const Stat = () => ${legend}`, 'components/stat-card.tsx')).toEqual([
      'bg-chart-1',
    ]);
  });

  it('leaves chart tokens alone when the design system uses them outside a chart', async () => {
    // Category badges colored by the chart palette in the design system itself.
    const system = await load(
      fixture({
        'app/globals.css': globals,
        'components/ui/badge.tsx': `import * as React from "react"
export function Badge(props: React.ComponentProps<"span">) {
  return <span className="rounded-md bg-chart-1 px-2 text-xs text-white" {...props} />
}`,
      }),
    );
    expect(findings(`<span className="text-chart-2">Active</span>`, 'a.tsx', system)).toEqual([]);
  });

  it('leaves sidebar tokens alone: apps use them for their frame', () => {
    // vercel/chatbot's shell and header, and openstatus's auth layout, take the sidebar's color.
    expect(
      findings(
        `export function Header() {
  return <header className="sticky top-0 flex h-14 items-center gap-2 bg-sidebar px-3">Chat</header>
}`,
        'components/chat/chat-header.tsx',
      ),
    ).toEqual([]);
  });

  it('takes the allow list and a suppression comment', async () => {
    const allowing = await load(
      fixture({
        'app/globals.css': globals,
        'onsystem.config.json': JSON.stringify({
          rules: { 'no-hardcoded-color': ['error', { allow: ['text-chart-2'] }] },
        }),
      }),
    );
    expect(findings(`<span className="text-chart-2">Active</span>`, 'a.tsx', allowing)).toEqual([]);
    expect(
      findings(
        `// onsystem-disable-next-line no-hardcoded-color -- the design system's teal
const tone = "text-chart-2";`,
        'a.tsx',
      ),
    ).toEqual([]);
  });
});
