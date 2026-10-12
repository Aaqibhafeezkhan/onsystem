import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SITE_URL } from '@/lib/site';

import { mono, sans } from './fonts';

import './globals.css';

const title = 'onsystem: keeps coding agents on your design system';
// 160 characters at most: search results cut longer descriptions off.
const description =
  'Keeps coding agents on your design system: catches invented components, props, variants and tokens, has the agent fix them, and gates PRs. Local, zero config.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: '%s · onsystem' },
  description,
  applicationName: 'onsystem',
  authors: [{ name: 'Diogo Esteves', url: 'https://github.com/dgesteves' }],
  keywords: [
    'design system',
    'design system linter',
    'agent guardrails',
    'Claude Code plugin',
    'Claude Code hook',
    'CI',
    'MCP server',
    'shadcn/ui',
    'React',
    'Tailwind CSS',
    'coding agents',
    'Cursor',
  ],
  openGraph: {
    type: 'website',
    siteName: 'onsystem',
    title,
    description,
    url: '/',
  },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport: Viewport = {
  themeColor: '#0d0f12',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
