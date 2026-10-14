import fs from 'node:fs/promises';
import path from 'node:path';

import type { ReactNode } from 'react';

import { demo, type Demo, type Finding } from '@/lib/data';

/**
 * Open Graph images, drawn with next/og from the same generated data as the pages: the
 * findings on the home card are what check_ui returned for the demo draft at build time.
 */

export const C = {
  ink: '#0d0f12',
  raised: '#14181d',
  raised2: '#181c22',
  line: '#262b33',
  lineStrong: '#353c47',
  fg: '#f5f7fa',
  fgSoft: '#dfe6ee',
  muted: '#9aa6b4',
  subtle: '#808b99',
  cyan: '#22d3ee',
  cyanBright: '#67e8f9',
  magenta: '#f0468a',
  magentaSoft: '#ff7eb0',
};

const FONT_DIR = path.join(process.cwd(), 'node_modules/geist/dist/fonts');

async function font(file: string): Promise<ArrayBuffer> {
  const buffer = await fs.readFile(path.join(FONT_DIR, file));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

/** Geist and Geist Mono as TrueType, which the renderer reads (it does not read woff2). */
export async function ogFonts() {
  const [regular, medium, semibold, mono, monoMedium] = await Promise.all([
    font('geist-sans/Geist-Regular.ttf'),
    font('geist-sans/Geist-Medium.ttf'),
    font('geist-sans/Geist-SemiBold.ttf'),
    font('geist-mono/GeistMono-Regular.ttf'),
    font('geist-mono/GeistMono-Medium.ttf'),
  ]);
  return [
    { name: 'Geist', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Geist', data: medium, weight: 500 as const, style: 'normal' as const },
    { name: 'Geist', data: semibold, weight: 600 as const, style: 'normal' as const },
    { name: 'Geist Mono', data: mono, weight: 400 as const, style: 'normal' as const },
    { name: 'Geist Mono', data: monoMedium, weight: 500 as const, style: 'normal' as const },
  ];
}

function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512">
      <rect width="512" height="512" rx="112" fill="#11161b" />
      <rect x="105" y="105" width="136" height="136" rx="32" fill={C.cyan} />
      <rect
        x="277"
        y="111"
        width="124"
        height="124"
        rx="26"
        fill={C.raised}
        stroke={C.lineStrong}
        strokeWidth="12"
      />
      <rect
        x="111"
        y="277"
        width="124"
        height="124"
        rx="26"
        fill={C.raised}
        stroke={C.lineStrong}
        strokeWidth="12"
      />
      <rect
        x="271"
        y="271"
        width="136"
        height="136"
        rx="32"
        fill={C.raised}
        stroke={C.cyan}
        strokeWidth="12"
      />
      <path
        d="M 305 341 L 329 365 L 375 317"
        fill="none"
        stroke={C.cyan}
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Check({ size = 16, color = C.cyan }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        fill="none"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The shared frame: ink, a soft cyan glow, a faint grid, and the wordmark. */
export function Frame({
  width,
  height,
  footer,
  children,
}: {
  width: number;
  height: number;
  footer: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: C.ink,
        backgroundImage:
          'radial-gradient(900px 480px at 12% -10%, rgba(34,211,238,0.16), rgba(34,211,238,0) 70%), radial-gradient(700px 420px at 100% 100%, rgba(240,70,138,0.07), rgba(240,70,138,0) 70%)',
        color: C.fg,
        fontFamily: 'Geist',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '44px 64px 0' }}>
        <Logo size={40} />
        <span style={{ fontFamily: 'Geist Mono', fontSize: 24, fontWeight: 500, color: C.fg }}>
          onsystem
        </span>
      </div>
      <div style={{ display: 'flex', flex: 1, padding: '0 64px' }}>{children}</div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 64px 40px',
          fontFamily: 'Geist Mono',
          fontSize: 20,
          color: C.subtle,
        }}
      >
        <span>{footer}</span>
      </div>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'Geist Mono',
        fontSize: 20,
        letterSpacing: 3,
        color: C.cyan,
        textTransform: 'uppercase',
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.cyan }} />
      {children}
    </div>
  );
}

/** The demo's findings that `tsc` reports too: an invalid variant, an unknown prop, a missing member. */
export const TSC_RULES = new Set(['no-unknown-variant', 'no-unknown-prop', 'no-unknown-component']);

/**
 * The rules on the finding card: palette colors and native elements the design system wraps,
 * the two rules behind every finding in the v2 benchmark, then an API it lacks, which the
 * benchmark never recorded.
 */
const CARD_RULES = ['no-hardcoded-color', 'prefer-design-system-component', 'no-unknown-variant'];

/** One finding on the card: the line the agent wrote, and where on it the finding is. */
export interface CardFinding extends Finding {
  /** The draft's line, without its indentation. */
  code: string;
  /** The finding's span on `code`. */
  mark: { start: number; end: number };
}

/**
 * The finding card on the home page's first screen and its social card, from the demo draft:
 * one finding per rule in {@link CARD_RULES}, the import the native element's fix relies on, and
 * how many of the draft's problems `tsc` reports next to check_ui.
 */
export function findingCard(source: Demo = demo) {
  const lines = source.draft.split('\n');
  const lineStart = (line: number) =>
    lines.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
  const findings: CardFinding[] = CARD_RULES.map((ruleId) => {
    const found = source.findings.find((f) => f.ruleId === ruleId);
    if (!found) throw new Error(`The demo draft has no ${ruleId} finding for the finding card`);
    const raw = lines[found.line - 1] ?? '';
    const code = raw.trim();
    const offset = lineStart(found.line) + raw.length - raw.trimStart().length;
    const start = Math.max(0, found.start - offset);
    return { ...found, code, mark: { start, end: Math.min(code.length, found.end - offset) } };
  });
  // The component the native element becomes, and the line that imports it.
  const native = findings.find((f) => f.ruleId === 'prefer-design-system-component');
  const component = /^<(\w+)>$/.exec(native?.fix ?? '')?.[1] ?? '';
  const importAt = lines.findIndex((line) =>
    new RegExp(`^import \\{[^}]*\\b${component}\\b[^}]*\\} from `).test(line),
  );
  if (!component || importAt < 0) {
    throw new Error(`The demo draft does not import ${component || 'the component'} it should use`);
  }
  const total = source.findings.length;
  const tsc = source.findings.filter((f) => TSC_RULES.has(f.ruleId)).length;
  return {
    file: source.file,
    findings,
    imports: { line: importAt + 1, code: lines[importAt] ?? '' },
    tsc,
    total,
    strip: `tsc ${String(tsc)}/${String(total)} · onsystem ${String(total)}/${String(total)} on this draft`,
  };
}

/** The finding card as the social card draws it: dark, mono, the marked span in magenta. */
function FindingPanel({ width }: { width: number }) {
  const card = findingCard();
  const mono = { fontFamily: 'Geist Mono', fontSize: 13.5 };
  const numbered = (line: number, children: ReactNode) => (
    <div style={{ display: 'flex', gap: 14, whiteSpace: 'pre' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: 22, color: C.subtle }}>
        {line}
      </div>
      {children}
    </div>
  );
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width,
        borderRadius: 16,
        border: `1px solid ${C.line}`,
        backgroundColor: 'rgba(20,24,29,0.92)',
        overflow: 'hidden',
        ...mono,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: `1px solid ${C.line}`,
          backgroundColor: '#11151a',
          fontSize: 13,
          color: C.subtle,
        }}
      >
        <span>{card.file}</span>
        <span style={{ color: C.cyanBright }}>onsystem · check_ui</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 18px' }}>
        {card.findings.map((f) => (
          <div key={f.ruleId} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {f.ruleId === 'prefer-design-system-component' &&
              numbered(
                card.imports.line,
                <span style={{ color: C.muted }}>{card.imports.code}</span>,
              )}
            {numbered(
              f.line,
              <div style={{ display: 'flex', color: C.fgSoft }}>
                <span>{f.code.slice(0, f.mark.start)}</span>
                <span style={{ color: C.magentaSoft, borderBottom: `2px solid ${C.magenta}` }}>
                  {f.code.slice(f.mark.start, f.mark.end)}
                </span>
                <span>{f.code.slice(f.mark.end)}</span>
              </div>,
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 36 }}>
              <Dot error={f.severity === 'error'} />
              <span style={{ color: C.subtle }}>{f.ruleId}</span>
            </div>
            <div style={{ display: 'flex', paddingLeft: 54, whiteSpace: 'pre' }}>
              <span style={{ color: C.fgSoft }}>{f.found}</span>
              <span style={{ color: C.subtle }}>{' → '}</span>
              <span style={{ color: C.cyanBright }}>{f.fix}</span>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 18px',
          borderTop: `1px solid ${C.line}`,
          backgroundColor: '#11151a',
          color: C.fgSoft,
        }}
      >
        <Check size={18} />
        <span>{card.strip}</span>
      </div>
    </div>
  );
}

/** The home page's card: app/og/home/route.tsx draws it. */
export const HOME_CARD = {
  path: '/og/home',
  size: { width: 1280, height: 640 },
  alt: homeCardAlt(),
};

function homeCardAlt(): string {
  const card = findingCard();
  const pairs = card.findings.map((f) => `${f.found} → ${f.fix}`).join(', ');
  return `onsystem keeps coding agents on your design system. A finding card from an agent's draft: ${pairs}, each with its line and rule; tsc reports ${String(card.tsc)} of its ${String(card.total)} problems, onsystem all ${String(card.total)}.`;
}

/** The home card, also the GitHub social preview: the claim, and the first screen's finding card. */
export function HomeCard({
  width,
  height,
  footer,
}: {
  width: number;
  height: number;
  footer: string;
}) {
  return (
    <Frame width={width} height={height} footer={footer}>
      <div style={{ display: 'flex', width: '100%', gap: 48, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 22 }}>
          <Eyebrow>MCP server · hook · CI check</Eyebrow>
          <div
            style={{
              display: 'flex',
              fontSize: 46,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -1.2,
            }}
          >
            Keeps coding agents on your design system.
          </div>
          <div style={{ display: 'flex', fontSize: 23, lineHeight: 1.4, color: C.muted }}>
            Palette colors, native elements and APIs your design system lacks, caught at every edit
            and pull request, with the fix.
          </div>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              gap: 10,
              marginTop: 6,
              padding: '10px 16px',
              borderRadius: 10,
              border: `1px solid ${C.lineStrong}`,
              backgroundColor: C.raised,
              fontFamily: 'Geist Mono',
              fontSize: 20,
            }}
          >
            <span style={{ color: C.subtle }}>$</span>
            <span style={{ color: C.fg }}>npx -y onsystem check .</span>
          </div>
        </div>
        <FindingPanel width={Math.round(width * 0.44)} />
      </div>
    </Frame>
  );
}

/** A page card: what the page is, in a sentence, with real detail on the right. */
export function PageCard({
  width,
  height,
  eyebrow,
  title,
  lead,
  aside,
}: {
  width: number;
  height: number;
  eyebrow: string;
  title: string;
  lead: string;
  /** Without it, the title and lead take the whole width. */
  aside?: ReactNode;
}) {
  return (
    <Frame width={width} height={height} footer="onsystem.vercel.app">
      <div style={{ display: 'flex', width: '100%', gap: 48, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 22 }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <div
            style={{
              display: 'flex',
              fontSize: 52,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -1.4,
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', fontSize: 24, lineHeight: 1.4, color: C.muted }}>
            {lead}
          </div>
        </div>
        {aside && <div style={{ display: 'flex', width: Math.round(width * 0.4) }}>{aside}</div>}
      </div>
    </Frame>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 10,
        borderRadius: 16,
        border: `1px solid ${C.line}`,
        backgroundColor: 'rgba(20,24,29,0.92)',
        padding: '20px 22px',
        fontFamily: 'Geist Mono',
        fontSize: 17,
      }}
    >
      {children}
    </div>
  );
}

export function Dot({ error }: { error: boolean }) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: error ? C.magenta : C.cyan,
        flexShrink: 0,
      }}
    />
  );
}
