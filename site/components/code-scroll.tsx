'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A code block's scrolling area. While more of a line is out of view to the right, it gets
 * `data-more`, which fades its right edge (app/globals.css), so a block that scrolls says so.
 */
export function CodeScroll({ className, children }: { className: string; children: ReactNode }) {
  const pre = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const element = pre.current;
    if (!element) return;
    const update = () => {
      const more = element.scrollWidth - element.clientWidth - element.scrollLeft > 1;
      element.toggleAttribute('data-more', more);
    };
    update();
    element.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);
  return (
    // Focusable so it scrolls from the keyboard (axe: scrollable-region-focusable).
    <pre ref={pre} tabIndex={0} className={className}>
      {children}
    </pre>
  );
}
