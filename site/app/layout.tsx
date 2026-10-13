import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { Ask } from '@/components/ask';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SITE_URL } from '@/lib/site';
import { THEME_SCRIPT } from '@/lib/theme';

import { mono, sans } from './fonts';

import './globals.css';

// The title, description, canonical URL and social cards are each page's own (app/page.tsx for
// the home page), so a page without metadata never takes the home page's.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'onsystem', template: '%s · onsystem' },
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
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0f12' },
  ],
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The theme class is added before paint by THEME_SCRIPT, so the server's markup can't match it.
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans">
        <SiteHeader />
        {children}
        <SiteFooter />
        <Ask />
      </body>
    </html>
  );
}
