import fs from 'node:fs';
import path from 'node:path';

import { DesignSystem, type DesignSystemModel, type ResolvedConfig } from 'onsystem';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Playground } from '@/components/playground';
import { PLAYGROUND_LIMITS, type Preset } from '@/lib/playground';
import {
  applyEdits,
  applyFixes,
  applyLabel,
  decisionFor,
  decisionNote,
  openingTagAt,
  PRINT_WIDTH,
  reflow,
  summaryText,
  tagAround,
  undecided,
} from '@/lib/playground-edits';

// The same generated model and drafts the playground serves (pnpm generate writes them).
const generated = (file: string): unknown =>
  JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../generated', file), 'utf8'));
const data = generated('playground-model.json') as {
  file: string;
  model: DesignSystemModel;
  config: ResolvedConfig;
};
const { presets } = generated('playground.json') as { presets: Preset[] };
const ds = new DesignSystem(data.model, data.config);
const check = (code: string) => ds.check(code, data.file).diagnostics;
const preset = (id: string): Preset => {
  const found = presets.find((p) => p.id === id);
  if (!found) throw new Error(`no preset ${id}`);
  return found;
};

/** What a visitor gets from Apply all and then one click on each suggestion, in order. */
function clickThrough(code: string) {
  const fixes = applyFixes(code, check(code));
  let current = fixes.code;
  const afterApplyAll = check(current);
  const clicks: string[] = [];
  for (let remaining = afterApplyAll; remaining.length; remaining = check(current)) {
    const d = remaining[0];
    const option = d && decisionFor(current, d)?.options[0];
    if (!d || !option || clicks.length > 5) break;
    clicks.push(option.label);
    current = applyEdits(current, option.edits).code;
  }
  return { fixes: fixes.count, afterApplyAll, clicks, code: current, left: check(current) };
}

describe('Apply all, on each draft', () => {
  it('says what it applies and what it leaves', () => {
    const rows = presets.map((p) => {
      const fixable = p.result.diagnostics.filter((d) => d.fix?.length).length;
      return [p.id, applyLabel(fixable), decisionNote(undecided(p.result.diagnostics))];
    });
    expect(rows).toEqual([
      ['danger-zone', 'Apply 9 fixes', '2 need a decision'],
      ['delete-dialog', 'Apply 7 fixes', '0 need a decision'],
      ['snippet', 'Apply 5 fixes', '1 needs a decision'],
      ['members', 'Apply 0 fixes', '0 need a decision'],
    ]);
  });

  it('applies every fix, then sums up what is left', () => {
    const summaries = presets
      .filter((p) => p.result.diagnostics.length)
      .map((p) => {
        const { code, count } = applyFixes(p.code, p.result.diagnostics);
        return summaryText({ fixes: count, suggestions: 0 }, check(code));
      });
    expect(summaries).toEqual([
      'Applied 9 fixes. 2 need a decision.',
      'Applied 7 fixes. No findings left.',
      'Applied 5 fixes. 1 needs a decision.',
    ]);
  });

  it('reaches no findings with one click per decision, on every draft', () => {
    const results = Object.fromEntries(
      presets.map((p) => {
        const { fixes, afterApplyAll, clicks, left } = clickThrough(p.code);
        expect(left, p.id).toEqual([]);
        expect(clicks, p.id).toHaveLength(afterApplyAll.length);
        return [p.id, { fixes, clicks }];
      }),
    );
    expect(results).toEqual({
      'danger-zone': {
        fixes: 9,
        clicks: ['variant="default"', 'Move `marginTop: 6` to className `mt-1.5`'],
      },
      'delete-dialog': { fixes: 7, clicks: [] },
      snippet: { fixes: 5, clicks: ['Remove `bg-blue-600` (`variant` sets the background)'] },
      members: { fixes: 0, clicks: [] },
    });
  });

  it('leaves the drafts formatted, within their line width', () => {
    for (const p of presets) {
      // Lines the draft already had stay as they are (Prettier leaves a long class string too).
      const own = new Set(p.code.split('\n'));
      const { code } = clickThrough(p.code);
      const long = code.split('\n').filter((line) => line.length > PRINT_WIDTH && !own.has(line));
      expect(long, p.id).toEqual([]);
    }
    const lines = clickThrough(preset('danger-zone').code).code.split('\n');
    const at = lines.findIndex((line) => line.includes('<p '));
    expect(lines.slice(at, at + 3)).toEqual([
      '        <p className="mt-1.5" style={{ color: "var(--muted-foreground)" }}>',
      '          Owners only.',
      '        </p>',
    ]);
    expect(clickThrough(preset('snippet').code).code).toBe(
      [
        '<div className="flex items-center gap-1.5">',
        '  <Badge variant="success">Active</Badge>',
        '  <Button variant="default" size="sm" className="px-4.5">',
        '    Save',
        '  </Button>',
        '</div>',
        '',
      ].join('\n'),
    );
  });

  it('offers every value of the renamed prop, since none is the old one', () => {
    const code = applyFixes(
      preset('danger-zone').code,
      preset('danger-zone').result.diagnostics,
    ).code;
    const tone = check(code).find((d) => d.ruleId === 'no-unknown-prop');
    const decision = tone && decisionFor(code, tone);
    expect(decision?.prompt).toBe('Needs a decision: set variant to');
    expect(decision?.options.map((o) => o.label)).toEqual([
      'variant="default"',
      'variant="secondary"',
      'variant="destructive"',
      'variant="success"',
      'variant="outline"',
    ]);
    const picked = decision?.options[2];
    expect(picked && applyEdits(code, picked.edits).code).toContain(
      '<Badge variant="destructive">Irreversible</Badge>',
    );
  });
});

describe('suggestions on code a visitor writes', () => {
  const apply = (code: string, which = 0) => {
    const d = check(code)[0];
    const option = d && decisionFor(code, d)?.options[which];
    return option ? applyEdits(code, option.edits).code : undefined;
  };

  it('picks a value for a variant that has no close one', () => {
    expect(apply('<Badge variant="warning">x</Badge>', 1)).toBe(
      '<Badge variant="secondary">x</Badge>',
    );
    expect(apply("<Badge variant={on ? 'warning' : 'default'}>x</Badge>", 3)).toBe(
      "<Badge variant={on ? 'success' : 'default'}>x</Badge>",
    );
  });

  it('moves a style value to className, keeping the rest of the style', () => {
    expect(apply('<p style={{ marginTop: 6 }}>x</p>')).toBe('<p className="mt-1.5">x</p>');
    expect(apply('<p className="text-sm" style={{ marginTop: 6, color: c }}>x</p>')).toBe(
      '<p className="text-sm mt-1.5" style={{ color: c }}>x</p>',
    );
    expect(apply('<p style={{ color: c, marginTop: 6 }}>x</p>')).toBe(
      '<p className="mt-1.5" style={{ color: c }}>x</p>',
    );
    expect(apply('<p\n  style={{\n    color: c,\n    marginTop: 6,\n  }}\n>\n  x\n</p>')).toBe(
      '<p\n  className="mt-1.5"\n  style={{\n    color: c,\n  }}\n>\n  x\n</p>',
    );
    expect(apply('<p className="" style={{\n  marginTop: 6,\n}}>x</p>')).toBe(
      '<p className="mt-1.5">x</p>',
    );
  });

  it('leaves a style alone when the edit would not be safe', () => {
    for (const code of [
      '<p className={cn("a", b)} style={{ marginTop: 6 }}>x</p>',
      '<p style={{ marginTop: on ? 6 : 0 }}>x</p>',
      '<p style={styles}>x</p>',
    ]) {
      const decisions = check(code).map((d) => decisionFor(code, d));
      expect(
        decisions.every((d) => d === undefined),
        code,
      ).toBe(true);
    }
  });

  it('removes an override the variant already sets', () => {
    expect(apply('<Button className="bg-blue-600">Save</Button>')).toBe('<Button>Save</Button>');
    expect(apply('<Button className="px-4 bg-blue-600">Save</Button>')).toBe(
      '<Button className="px-4">Save</Button>',
    );
    expect(apply('<Button className={cn("hover:bg-blue-600 px-4", x)}>Save</Button>')).toBe(
      '<Button className={cn("px-4", x)}>Save</Button>',
    );
    // A plain element has no variant to fall back on: no suggestion.
    const div = '<div className="bg-blue-600">x</div>';
    expect(check(div).map((d) => decisionFor(div, d))).toEqual([undefined]);
  });

  it('moves a color attribute to className', () => {
    const code = '<X color="#ef4444" />';
    expect(check(code)[0]?.suggestion).toBe('className="text-destructive"');
    expect(apply(code)).toBe('<X className="text-destructive" />');
  });

  it('offers nothing for a finding that already has a fix', () => {
    const code = '<Badge variant="green">x</Badge>';
    expect(check(code).map((d) => decisionFor(code, d))).toEqual([undefined]);
  });
});

describe('reading JSX', () => {
  it('reads attributes past nested braces, strings and spreads', () => {
    const code = '<Button {...rest} onClick={() => go({ a: "}" })} title=\'x\' disabled>';
    const tag = openingTagAt(code, 0);
    expect(tag?.name).toBe('Button');
    expect(tag?.end).toBe(code.length);
    expect(tag?.attributes.map((a) => code.slice(a.start, a.end))).toEqual([
      '{...rest}',
      'onClick={() => go({ a: "}" })}',
      "title='x'",
      'disabled',
    ]);
  });

  it('finds the tag around a position, not a comparison before it', () => {
    const code = '{a<b && <Card className="p-[13px]" />}';
    expect(tagAround(code, code.indexOf('p-['))?.name).toBe('Card');
    expect(tagAround(code, code.indexOf('&&'))).toBeUndefined();
  });
});

describe('reflow', () => {
  it('breaks a line an edit made too long, the way Prettier does', () => {
    const before = '    <p style={{ color: "#737373" }}>Owners only.</p>';
    const after =
      '    <p style={{ color: "var(--muted-foreground)", marginTop: 6 }}>Owners only.</p>';
    expect(reflow(before, after)).toBe(
      '    <p style={{ color: "var(--muted-foreground)", marginTop: 6 }}>\n      Owners only.\n    </p>',
    );
    const tag = `  <Input {...field} className="${'a '.repeat(30)}b" placeholder="acme-web" />`;
    expect(reflow('', tag)).toBe(
      `  <Input\n    {...field}\n    className="${'a '.repeat(30)}b"\n    placeholder="acme-web"\n  />`,
    );
  });

  it('leaves lines it did not make, and lines that are not one element', () => {
    const long = `const x = "${'y'.repeat(90)}"`;
    expect(reflow(long, long)).toBe(long);
    expect(reflow('', long)).toBe(long);
    const mixed = `<p className="${'a '.repeat(30)}">Hello <b>you</b></p>`;
    expect(reflow('', mixed)).toBe(mixed);
  });
});

describe('on a phone', () => {
  // Below lg the findings come after the editor: on a 390 px screen the Agent draft's 1,355 px
  // editor puts them 2.4 screens down, so the status in the editor's bar is a link to them.
  const html = renderToStaticMarkup(
    createElement(Playground, { presets, maxBytes: PLAYGROUND_LIMITS.maxBytes }),
  );
  const bar = /<div class="code-bar[^"]*">([\s\S]*?)<\/div>/.exec(html)?.[1] ?? '';

  it('jumps from the editor’s bar to the findings', () => {
    const link = /<a ([^>]*)>([\s\S]*?)<\/a>/.exec(bar);
    expect(link?.[1] ?? '').toContain('href="#findings"');
    expect(link?.[2]).toMatch(/^Jump to 11 findings/);
    expect(html).toMatch(/<section [^>]*id="findings"/);
  });

  it('keeps the counts on wide screens, where the findings sit beside the editor', () => {
    const link = /<a ([^>]*)>/.exec(bar)?.[1] ?? '';
    expect(link).toMatch(/class="[^"]*\blg:hidden\b/);
    const status = /<span class="([^"]*)">8 errors · 3 warnings<\/span>/.exec(bar)?.[1] ?? '';
    expect(status).toMatch(/\bmax-lg:hidden\b/);
  });

  it('has no link for a draft with no findings', () => {
    const clean = presets.filter((p) => p.result.diagnostics.length === 0);
    expect(clean.length).toBeGreaterThan(0);
    for (const p of clean) {
      const page = renderToStaticMarkup(
        createElement(Playground, { presets: [p], maxBytes: PLAYGROUND_LIMITS.maxBytes }),
      );
      expect(page).not.toContain('Jump to');
      expect(page).toContain('No design-system problems');
    }
  });
});
