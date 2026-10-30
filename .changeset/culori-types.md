---
'onsystem': patch
---

The published types no longer fail a TypeScript project that checks library types (`skipLibCheck: false`) with TS7016, "Could not find a declaration file for module 'culori'", as soon as it imports `onsystem`, as an `onsystem.config.ts` with `defineConfig` does. The color types the API uses come from `@types/culori`, which is now a dependency rather than a devDependency; with `skipLibCheck: true`, those types were read as `any`.
