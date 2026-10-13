'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/*
 * Ask ⌘K: ondocs's dialog over the docs. It is on only where the deployment has a model key,
 * which /api/ask reports (GET) at runtime: without one, there is no button, no shortcut and no
 * dialog. As on ondocs.vercel.app, the shortcut is handled here, so it works before the dialog's
 * code has loaded.
 */

const OPEN_EVENT = 'onsystem:ask';

/** The spark ondocs marks Ask with. */
function SparkIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.5c.6 4.9 3.6 7.9 8.5 8.5-4.9.6-7.9 3.6-8.5 8.5-.6-4.9-3.6-7.9-8.5-8.5 4.9-.6 7.9-3.6 8.5-8.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
const STATUS_KEY = 'onsystem-ask';

let status: Promise<boolean> | undefined;

/** Whether Ask is on: asked once per page load, and remembered for the visit. */
export function askStatus(load: typeof fetch = fetch): Promise<boolean> {
  status ??= (async () => {
    try {
      const stored = sessionStorage.getItem(STATUS_KEY);
      if (stored === 'on' || stored === 'off') return stored === 'on';
    } catch {
      // No storage: ask the server.
    }
    let on: boolean;
    try {
      const response = await load('/api/ask', { headers: { accept: 'application/json' } });
      on = response.ok && ((await response.json()) as { ask?: unknown }).ask === true;
    } catch {
      on = false;
    }
    try {
      sessionStorage.setItem(STATUS_KEY, on ? 'on' : 'off');
    } catch {
      // Asked again on the next page.
    }
    return on;
  })();
  return status;
}

/** For tests: forget the status, as a new page load would. */
export function resetAskStatus(): void {
  status = undefined;
}

function useAskEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let live = true;
    void askStatus().then((on) => {
      if (live) setEnabled(on);
    });
    return () => {
      live = false;
    };
  }, []);
  return enabled;
}

/** The theme the page shows, from the `.light` or `.dark` class on <html> (lib/theme.ts). */
function subscribeTheme(listener: () => void) {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => {
    observer.disconnect();
  };
}

function useResolvedTheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    subscribeTheme,
    () => (document.documentElement.classList.contains('light') ? 'light' : 'dark'),
    () => 'dark',
  );
}

const SiteAskDialog = dynamic(() => import('./ask-dialog').then((m) => m.SiteAskDialog), {
  ssr: false,
});

/** Text fields keep ⌘K, as the dialog's own shortcut would. */
function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !==
      null
  );
}

/** The dialog, mounted once in the root layout, opened by ⌘K, Ctrl+K or the header's button. */
export function Ask() {
  const enabled = useAskEnabled();
  const theme = useResolvedTheme();
  const [open, setOpenState] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const openRef = useRef(false);
  const setOpen = useCallback((next: boolean) => {
    openRef.current = next;
    setOpenState(next);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const show = () => {
      setLoaded(true);
      setOpen(true);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
      if (!openRef.current && isEditable(event.target)) return;
      event.preventDefault();
      setLoaded(true);
      setOpen(!openRef.current);
    };
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled, setOpen]);

  return enabled && loaded ? (
    <SiteAskDialog open={open} onOpenChange={setOpen} theme={theme} />
  ) : null;
}

const noSubscription = () => () => undefined;

/** "⌘K" on Apple platforms, "Ctrl K" elsewhere; the server renders the Mac form. */
function useShortcutLabel(): string {
  return useSyncExternalStore(
    noSubscription,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K'),
    () => '⌘K',
  );
}

/** The header's Ask button: "Ask ⌘K", and only the icon on phones. Nothing while Ask is off. */
export function AskButton({ className = '' }: { className?: string }) {
  const enabled = useAskEnabled();
  const shortcut = useShortcutLabel();
  if (!enabled) return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      aria-keyshortcuts="Meta+K Control+K"
      aria-label="Ask the docs"
      className={`inline-flex size-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg md:h-8 md:w-auto md:px-2.5 ${className}`}
    >
      <SparkIcon className="size-4 text-cyan" />
      <span className="hidden md:inline" aria-hidden="true">
        Ask
      </span>
      <kbd
        className="hidden rounded border border-line px-1 font-mono text-[11px] text-subtle md:inline"
        aria-hidden="true"
      >
        {shortcut}
      </kbd>
    </button>
  );
}
