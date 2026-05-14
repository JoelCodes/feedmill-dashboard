// scripts/_server-only-shim.mjs
//
// Preload shim that short-circuits the `server-only` import so dev-only
// harness scripts can `import { db } from '@/db'` from plain Node/tsx.
//
// Why this exists:
//   src/db/index.ts begins with `import 'server-only'` (D-10 from
//   33-CONTEXT.md). The npm `server-only` package throws at import time
//   by design — it's an RSC-boundary marker expected to be replaced by a
//   no-op stub via Next.js's webpack alias at build time. Plain Node has
//   no such alias, so any harness that goes through `@/db` blows up.
//
// How it's wired in:
//   package.json scripts use `tsx --import ./scripts/_server-only-shim.mjs ...`
//   so this file runs BEFORE the harness module is loaded. An inline shim
//   inside the harness itself does NOT work because ESM hoists all `import`
//   statements ahead of any module-level code.
//
// Scope:
//   Only loaded by dev-only test:* harness scripts in package.json. Never
//   loaded by `next build`, `next dev`, jest, or playwright — those go
//   through the real RSC bundler / RSC test environment where the package
//   is correctly aliased.

import { Module } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STUB_PATH = path.join(__dirname, '_server-only-stub.cjs');

const _resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === 'server-only') {
    // Return the absolute path to the no-op stub. _resolveFilename callers
    // (Module._load → readFileSync) expect a filesystem path, not a bare
    // module specifier — node:* builtins go through a different loader
    // path that the CJS loader does NOT honor when re-routed via this hook.
    return STUB_PATH;
  }
  return _resolve.call(this, request, ...rest);
};
