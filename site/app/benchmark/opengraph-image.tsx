import { ImageResponse } from 'next/og';

import { ARM_LABELS, headline, headlineShort, perRun, row } from '@/lib/benchmark';
import { benchmark } from '@/lib/data';
import { C, ogFonts, PageCard, Panel } from '@/lib/og';

const h = headline(benchmark);

export const alt = `The onsystem benchmark: design-system rule violations per run, as onsystem ${h.version}'s own check counts them, went from ${h.from} to ${h.to} with onsystem's skill, MCP server and hook, over ${h.perArm} runs per arm.`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const max = Math.max(
    ...benchmark.arms.map((arm) => row(benchmark, 'all models', arm).onsystemErrors.value),
  );
  return new ImageResponse(
    <PageCard
      {...size}
      eyebrow={`Benchmark · ${benchmark.date}`}
      title={headlineShort(benchmark)}
      lead={`Counted by onsystem's own check, in runs without onsystem and with its skill, MCP server and hook. No measurable change in tsc pass rate or cost per run. ${h.perArm} runs per arm, ${h.models} models, ${h.providers} providers, ${h.repos} repositories.`}
      aside={
        <Panel>
          <span style={{ color: C.subtle, fontSize: 14 }}>
            onsystem {h.version} errors per run, all models
          </span>
          {benchmark.arms.map((arm) => {
            const value = row(benchmark, 'all models', arm).onsystemErrors.value;
            return (
              <div key={arm} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.fgSoft }}>{ARM_LABELS[arm] ?? arm}</span>
                  <span style={{ color: arm === 'none' ? C.muted : C.cyanBright }}>
                    {perRun(value)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    style={{
                      width: `${String(max === 0 ? 0 : Math.max((value / max) * 100, value > 0 ? 2 : 0))}%`,
                      borderRadius: 4,
                      backgroundColor: arm === 'none' ? '#5d6875' : C.cyan,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </Panel>
      }
    />,
    { ...size, fonts: await ogFonts() },
  );
}
