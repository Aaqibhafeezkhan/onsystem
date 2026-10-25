import localFont from 'next/font/local';

// Geist, from the `geist` package, declared here rather than through `geist/font` so the mono
// face is not preloaded: the largest paint is the headline, which is set in the sans.
//
// Neither swap may move the layout. The sans is preloaded and `optional`: it is used when it
// arrives in time for the first paint, which it does on a repeat visit or a fast connection, and
// otherwise the page keeps its size-adjusted Arial fallback instead of reflowing every paragraph
// when it lands. The mono swaps, but from a fallback that sets each line as wide: every glyph of
// Geist Mono is 0.6 em wide, as in Courier New (0.600 em), Liberation Mono, made to Courier New's
// metrics, and Menlo (0.602 em). Arial, size-adjusted to Geist Mono's average, is proportional:
// it wrapped an uppercase eyebrow onto a second line, which went back to one when the font came.
export const sans = localFont({
  src: '../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'optional',
});

export const mono = localFont({
  src: '../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  preload: false,
  adjustFontFallback: false,
  fallback: ['Menlo', 'Courier New', 'Liberation Mono', 'monospace'],
});
