import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Building a TypeScript program for the fixtures takes a moment on cold CI runners.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Measured by pnpm test:coverage, not pnpm test, since it slows the suite down: CI measures it
    // in one job. Istanbul instruments only the files below. v8 counts every block V8 runs, the
    // TypeScript compiler's included, and made the tests that build a program about six times
    // slower on CI.
    coverage: {
      provider: 'istanbul',
      include: ['src/**', 'action/**'],
      reporter: ['text', 'json-summary'],
      // What the suite covers now, rounded down, so a change can't lower it. Raise them when it
      // goes up.
      thresholds: { lines: 94, branches: 84, functions: 93, statements: 91 },
    },
  },
});
