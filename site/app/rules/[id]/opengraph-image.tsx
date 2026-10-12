import { ImageResponse } from 'next/og';

import { ruleCatalog } from '@/lib/data';
import { C, Dot, Eyebrow, Frame, ogFonts, Panel } from '@/lib/og';
import { plainText } from '@/lib/site';

export const alt = 'An onsystem rule: what it catches, and the fix check_ui suggests.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams(): { id: string }[] {
  return ruleCatalog.rules.map((rule) => ({ id: rule.id }));
}

/** The rule's name, what it is about, and what check_ui said about the example: found → fix. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rule = ruleCatalog.rules.find((r) => r.id === id);
  if (!rule) throw new Error(`No rule ${id}`);
  return new ImageResponse(
    <Frame width={size.width} height={size.height} footer="onsystem.vercel.app/rules">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          gap: 22,
        }}
      >
        <Eyebrow>{`Rule · ${rule.severity === 'error' ? 'error' : 'warning'} by default`}</Eyebrow>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Geist Mono',
            fontSize: 50,
            fontWeight: 500,
            letterSpacing: -1,
            color: C.fg,
          }}
        >
          {rule.id}
        </div>
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', marginTop: 6 }}>
          <div style={{ display: 'flex', flex: 1, fontSize: 26, lineHeight: 1.4, color: C.muted }}>
            {plainText(rule.description)}
          </div>
          <div style={{ display: 'flex', width: 470 }}>
            <Panel>
              <span style={{ color: C.subtle, fontSize: 14 }}>check_ui</span>
              {rule.findings.slice(0, 3).map((f, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap' }}
                >
                  <Dot error={f.severity === 'error'} />
                  <span style={{ color: C.fgSoft }}>{rule.bad.slice(f.start, f.end)}</span>
                  <span style={{ color: C.subtle }}>→</span>
                  <span style={{ color: C.cyanBright }}>{f.suggestion ?? 'see the message'}</span>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </div>
    </Frame>,
    { ...size, fonts: await ogFonts() },
  );
}
