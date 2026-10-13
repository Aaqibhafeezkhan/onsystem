import Link from 'next/link';
import type { ReactNode } from 'react';

import { LogoMark } from '@/components/logo';
import {
  AUTHOR,
  compactNumber,
  MORE,
  NPM,
  REGISTRY,
  REPO,
  repoLink,
  VERSION,
  WEEKLY_DOWNLOADS,
} from '@/lib/site';

const link = 'text-muted transition-colors hover:text-fg';

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title}>
      <h2 className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">{title}</h2>
      <ul className="mt-3 grid gap-2 text-sm">{children}</ul>
    </nav>
  );
}

/** The footer shared with ondocs and signoff-ui: the project, what agents read, and the siblings. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.4fr]">
        <div className="max-w-xs sm:col-span-3 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-6" />
            <span className="font-mono text-[13px] font-semibold text-fg">onsystem</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Keeps coding agents on your design system. MIT licensed, by{' '}
            <a
              className="text-fg-soft underline decoration-line-strong underline-offset-4 hover:text-fg"
              href={AUTHOR.url}
            >
              {AUTHOR.name}
            </a>
            . The demo, rules and benchmark here are generated from the repository when the site is
            built.
          </p>
        </div>
        <Column title="Project">
          <li>
            <Link className={link} href="/docs">
              Docs
            </Link>
          </li>
          <li>
            <a className={link} href={repoLink('CHANGELOG.md')}>
              Changelog
            </a>
          </li>
          <li>
            <a className={link} href={`${REPO}/issues`}>
              Issues
            </a>
          </li>
          <li>
            <a className={link} href={NPM}>
              npm
              {WEEKLY_DOWNLOADS !== null && (
                <span className="text-subtle"> · {compactNumber(WEEKLY_DOWNLOADS)} a week</span>
              )}
            </a>
          </li>
          <li className="font-mono text-[13px] text-subtle">v{VERSION}</li>
        </Column>
        <Column title="For agents">
          <li>
            <a className={link} href="/llms.txt">
              llms.txt
            </a>
          </li>
          <li>
            <a className={link} href="/llms-full.txt">
              llms-full.txt
            </a>
          </li>
          <li>
            <a className={link} href={REGISTRY}>
              MCP server
            </a>
          </li>
          <li>
            <Link className={link} href="/docs#use-these-docs-from-your-agent">
              Docs over MCP
            </Link>
          </li>
        </Column>
        <nav aria-label={`More by ${AUTHOR.name}`}>
          <h2 className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            More by {AUTHOR.name}
          </h2>
          <ul className="mt-3 grid gap-3 text-sm">
            {MORE.map((project) => (
              <li key={project.name}>
                <a className="group block" href={project.url}>
                  <span className="font-mono text-[13px] text-fg-soft transition-colors group-hover:text-cyan-bright">
                    {project.name}
                  </span>
                  <span className="mt-0.5 block text-muted">{project.description}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
