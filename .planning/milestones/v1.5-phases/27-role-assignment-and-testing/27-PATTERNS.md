# Phase 27: Role Assignment and Testing - Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 9
**Analogs found:** 8 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/auth.ts` (CREATE) | utility (server-only) | request-response (reads `auth()` claims) | `src/middleware.ts` (auth() usage shape) + `src/lib/utils.ts` (lib module shape) | role-match (no existing `src/lib/*` server util reads `auth()`) |
| `src/lib/auth.test.ts` (CREATE) | test (unit) | request-response | `src/middleware.test.ts` (jest.mock `@clerk/nextjs/server`) + `src/lib/utils.test.ts` (lib test colocation) | role-match |
| `src/middleware.ts` (MODIFY) | middleware (edge) | request-response | self — already canonical pattern; modifying in place | exact |
| `src/middleware.test.ts` (MODIFY) | test (unit, source-string asserts) | request-response | self — string assertions to update | exact |
| `e2e/demo-route-protection.spec.ts` (MODIFY) | test (E2E) | request-response | self + `e2e/production-smoke.spec.ts` (auth-flow spec shape) | exact |
| `e2e/fixtures/auth.ts` and/or `e2e/global.setup.ts` (CREATE) | test fixture / setup | request-response | No analog — greenfield. Closest existing shape: `e2e/production-smoke.spec.ts` for the `clerk.signIn` / env-var pattern; `playwright.config.ts:5-6` for `dotenv` precedent | no analog (greenfield) |
| `playwright.config.ts` (MODIFY) | config | n/a | self — extend `projects` array | exact |
| `.env.example` (MODIFY) | config | n/a | self — append new keys | exact |
| `docs/clerk-setup.md` (CREATE) | docs (runbook) | n/a | No analog — `docs/` directory does not exist (VERIFIED: `ls /docs` → not found). `README.md` exists at root but is a project README, not a runbook | no analog (greenfield) |

---

## Pattern Assignments

### `src/lib/auth.ts` (utility, server-only)

**Primary analog:** `src/middleware.ts` (auth() usage shape — this is the **only** existing file that calls `auth()` from `@clerk/nextjs/server`)
**Secondary analog:** `src/lib/utils.ts` (lib module shape — tiny, focused, pure-ish, exported functions with JSDoc)

**Imports pattern** — adopt these import paths verbatim from `src/middleware.ts:1-3` and `src/types/clerk.d.ts:16`:

```typescript
// FROM src/middleware.ts:1-3 — the exact import path for auth()/clerkMiddleware that the project uses
import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import type { Role } from '@/types/clerk';
```

For `src/lib/auth.ts`, the project-canonical import shape is therefore:
- `import { auth } from '@clerk/nextjs/server'` — same package + same v7 async API used in middleware
- `import { redirect } from 'next/navigation'` — NOT yet used anywhere server-side in this codebase; new but standard Next.js 16 primitive (`next/navigation` is mocked in page tests at `src/app/demo/customers/page.test.tsx:6` so the import is known to the project)
- `import type { Role } from '@/types/clerk'` — verbatim from `src/middleware.ts:3`; uses the `@/` path alias

**Core utility pattern** — `src/lib/utils.ts` is the lib-module style guide for shape (small file, JSDoc on each export, single concern):

```typescript
// src/lib/utils.ts:4-17 — copy the JSDoc + named export style
/**
 * Utility function for constructing className strings with Tailwind conflict resolution.
 *
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 * Use this for all component className props to ensure overrides work correctly.
 *
 * @example
 * cn("p-4", "p-2") // => "p-2" (later wins)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Core auth() invocation pattern** — `src/middleware.ts:29-43` shows the project's canonical shape for reading from auth (with the **old** `clerkClient` path that this phase will remove):

```typescript
// src/middleware.ts:29-43 — current (pre-Phase-27) pattern; the new utilities use only the userId+sessionClaims destructure
if (isDemoRoute(request)) {
  const { userId } = await auth();
  if (!userId) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role as Role | undefined;

  if (role !== 'demo') {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }
}
```

For `src/lib/auth.ts`, the new pattern (per D-02/D-03 + RESEARCH Pattern 1) is:

```typescript
// Target shape for src/lib/auth.ts — destructure both userId AND sessionClaims
export async function checkRole(role: Role): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
}

export async function requireRole(role: Role): Promise<void> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }
  if (sessionClaims?.metadata?.role !== role) {
    redirect('/');
  }
}
```

The `sessionClaims?.metadata?.role` shape is type-safe via `src/types/clerk.d.ts:18-24`:

```typescript
// src/types/clerk.d.ts:16-24 — already declares the claim shape; no type changes needed
export type Role = 'demo' | 'admin' | 'user';

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Role;
    };
  }
}
```

**Error handling pattern:** None — `checkRole` returns `false` on any missing data path (no throws); `requireRole` relies on `redirect()` throwing its internal `NEXT_REDIRECT` sentinel (callers do not need to `return` after it).

---

### `src/lib/auth.test.ts` (test, unit)

**Primary analog:** `src/middleware.test.ts` (Jest mock of `@clerk/nextjs/server`)
**Secondary analog:** `src/lib/utils.test.ts` (colocation + describe block shape for a `src/lib/*` module)

**Jest mock pattern** — `src/middleware.test.ts:1-12` is the canonical Clerk mock shape in this repo:

```typescript
// src/middleware.test.ts:1-12 — Mock Clerk imports before importing middleware
jest.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (fn: () => void) => fn,
  createRouteMatcher: () => () => false,
}));

// Mock next/server to avoid Request global requirement in test environment
jest.mock("next/server", () => ({
  NextResponse: {
    redirect: jest.fn(),
  },
}));
```

For `src/lib/auth.test.ts`, the mock surface is different — we need a mockable `auth()` (not `clerkMiddleware`) and a sentinel-throw `redirect()`. The mock shape adapts the existing pattern:

```typescript
// Target shape — derived from src/middleware.test.ts mock style + RESEARCH Pattern 3
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
```

**Next/navigation mock precedent** — `src/app/demo/customers/page.test.tsx:6-11` shows the project already mocks `next/navigation` in page tests (with `useRouter`/`usePathname`, not `redirect`, but same module surface):

```typescript
// src/app/demo/customers/page.test.tsx:6-11
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => '/demo/customers'),
}));
```

**Describe-block structure** — `src/lib/utils.test.ts:3` shows the project convention: one top-level `describe` per exported function, descriptive `it(...)` names:

```typescript
// src/lib/utils.test.ts:3-7 — describe-per-export, behavior-named tests
describe("cn utility", () => {
  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });
  // ...
});
```

For `src/lib/auth.test.ts`, apply this shape per D-08's enumerated cases (5 for `checkRole`, 3 for `requireRole` = 8 total — see RESEARCH §Phase Requirements → Test Map):

```typescript
// Target shape
describe('checkRole', () => {
  it('returns true when claim matches', async () => { /* ... */ });
  it('returns false when claim does not match', async () => { /* ... */ });
  it('returns false when sessionClaims is undefined', async () => { /* ... */ });
  it('returns false when metadata.role is missing', async () => { /* ... */ });
  it('returns false when userId is null (unauthenticated)', async () => { /* ... */ });
});

describe('requireRole', () => {
  it('redirects to /sign-in when userId is missing', async () => { /* ... */ });
  it('redirects to / when role does not match', async () => { /* ... */ });
  it('resolves without throwing when role matches', async () => { /* ... */ });
});
```

---

### `src/middleware.ts` (middleware, edge — MODIFY)

**Analog:** self. The file is already in canonical Clerk middleware shape. The Phase 27 modification removes the `clerkClient`-based role-fetch (lines 36-38) and replaces it with a `sessionClaims` read.

**Current state — `src/middleware.ts:1` (import to drop part of):**

```typescript
import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
```

After Phase 27: drop `clerkClient` (only used at line 36).

**Current state — `src/middleware.ts:29-43` (the block to refactor):**

```typescript
if (isDemoRoute(request)) {
  const { userId } = await auth();
  if (!userId) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  const client = await clerkClient();           // ← REMOVE
  const user = await client.users.getUser(userId); // ← REMOVE
  const role = user.publicMetadata?.role as Role | undefined; // ← REPLACE

  if (role !== 'demo') {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }
}
```

**Target shape** (per D-04 + RESEARCH Pattern 2):

```typescript
if (isDemoRoute(request)) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }
  if (sessionClaims?.metadata?.role !== 'demo') {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }
}
```

**Notes on imports after migration:**
- Drop `clerkClient` from the `@clerk/nextjs/server` named imports (line 1).
- The `import type { Role } from '@/types/clerk'` (line 3) becomes unused after migration — `'demo'` is a string literal and TypeScript narrows `sessionClaims?.metadata?.role` via `CustomJwtSessionClaims`. Remove this import too (per RESEARCH "Anti-Patterns to Avoid").
- `NextResponse` from `next/server` (line 2) and `clerkMiddleware`/`createRouteMatcher` from `@clerk/nextjs/server` remain untouched.

**Unchanged sections to leave alone:** Lines 5-24 (route matchers + public-route protection), lines 47-59 (matcher config) — these are correct.

---

### `src/middleware.test.ts` (test, unit — MODIFY)

**Analog:** self. This is a **file-content / source-string** assertion suite, NOT a behavior test. The fs-readFile + `expect(content).toContain(...)` pattern is repeated across 8+ tests in the file.

**Existing pattern — `src/middleware.test.ts:140-151` (the block that MUST change):**

```typescript
// src/middleware.test.ts:140-151 — current assertions check OLD strings
it("checks role for demo routes via publicMetadata", async () => {
  const fs = await import("fs/promises");
  const path = await import("path");

  const middlewarePath = path.join(__dirname, "middleware.ts");
  const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

  // Per ACCESS-01: Check user.publicMetadata.role via clerkClient
  expect(middlewareContent).toContain("clerkClient");      // ← MUST CHANGE
  expect(middlewareContent).toContain("publicMetadata");   // ← MUST CHANGE
  expect(middlewareContent).toContain("role");
});
```

**Target shape** (per D-09):

```typescript
// Target — assertions check NEW strings after D-04 migration
it("checks role for demo routes via sessionClaims", async () => {
  const fs = await import("fs/promises");
  const path = await import("path");

  const middlewarePath = path.join(__dirname, "middleware.ts");
  const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

  // Per D-04: Read role from sessionClaims.metadata.role (no network call)
  expect(middlewareContent).toContain("sessionClaims");
  expect(middlewareContent).toContain("metadata");
  expect(middlewareContent).toContain("role");
  expect(middlewareContent).not.toContain("clerkClient");        // negative-assert the removal
  expect(middlewareContent).not.toContain("publicMetadata");
});
```

**Unchanged sections to leave alone:**
- Lines 1-12 (Jest mocks of `@clerk/nextjs/server` and `next/server`) — keep
- Lines 20-60 (`middleware configuration` describe block — config.matcher tests) — keep
- Lines 62-122 (`public route configuration` describe block — sign-in route tests) — keep
- Lines 128-138 + 153-175 (other demo-route tests asserting `isDemoRoute`, `/demo(.*)`, `NextResponse.redirect`, etc.) — keep, no string changes needed

**Only the assertion at lines 148-149 changes literal strings.** All other source-string assertions in the file reference strings that remain in the file post-migration.

---

### `e2e/demo-route-protection.spec.ts` (test, E2E — MODIFY)

**Analog:** self + `e2e/production-smoke.spec.ts` (for the env-var auth pattern, though we replace its form-fill with `clerk.signIn`).

**Existing skipped test — `e2e/demo-route-protection.spec.ts:29-52` (unskip per D-10):**

```typescript
// e2e/demo-route-protection.spec.ts:29-52 — the test to unskip
test.describe('ACCESS-01: Authenticated user without demo role redirected to root', () => {
  // Note: This test documents expected behavior but requires Playwright auth setup
  // to run green. The middleware implementation is verified by unit tests.
  test.skip('authenticated user without demo role is redirected to root', async ({ page }) => {
    // ...
    await page.goto('/demo/orders');
    await expect(page).toHaveURL('/');
  });
});
```

**Existing describe-block convention — `e2e/demo-route-protection.spec.ts:15-27`:**

```typescript
// e2e/demo-route-protection.spec.ts:13-27 — requirement-ID-prefixed describe blocks
const demoRoutes = ['/demo/orders', '/demo/customers'] as const;

test.describe('Demo Route Protection', () => {
  test.describe('PROT-03: Unauthenticated user accessing /demo/* redirects to sign-in', () => {
    for (const route of demoRoutes) {
      test(`unauthenticated user accessing ${route} redirects to sign-in`, async ({ page }) => {
        await page.goto(route);
        await expect(page).toHaveURL(/\/sign-in/);
      });
    }
  });
  // ...
});
```

**Add new describe blocks (per D-11):**
- `ACCESS-02 #1: Demo user accesses /demo/orders, /demo/customers, /demo/mill-production` — runs under `demo-user` project (storageState = `playwright/.clerk/demo.json`)
- `ACCESS-02 #2: Non-demo user is redirected to /` — runs under `norole-user` project (this replaces the existing `.skip()`'d test)
- `ACCESS-02 #3: Both demo and non-demo users can access /settings` — runs under both projects

**D-11 list note:** the four scenarios include `/demo/mill-production` (per D-11 #1) — the existing `demoRoutes` constant only has `/demo/orders` and `/demo/customers`. Extend it:

```typescript
// Target — add /demo/mill-production
const demoRoutes = ['/demo/orders', '/demo/customers', '/demo/mill-production'] as const;
```

**Auth-flow precedent — `e2e/production-smoke.spec.ts:17-43` shows the existing env-var + sign-in pattern (to be REPLACED, not copied, by `clerk.signIn`):**

```typescript
// e2e/production-smoke.spec.ts:17-43 — current pattern (form-fill); Phase 27 replaces this with @clerk/testing
test.describe('Production Authentication Smoke Tests', () => {
  test('user can sign in and access protected routes', async ({ page }) => {
    const email = process.env.CLERK_TEST_USER_EMAIL!;
    const password = process.env.CLERK_TEST_USER_PASSWORD!;

    await page.goto('/sign-in');
    await page.fill('input[name="identifier"]', email);
    await page.click('button:has-text("Continue")');
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Continue")');

    await expect(page).toHaveURL('/');
    // ...
  });
});
```

**Lesson:** in `demo-route-protection.spec.ts`, don't form-fill — rely on the per-project `storageState` (set in `playwright.config.ts`) so the test starts already signed in. No `clerk.signIn` call inside the spec. Tests are short:

```typescript
// Target shape for new scenarios — no sign-in inside the test; storageState handles it
test('demo user can access /demo/orders', async ({ page }) => {
  await page.goto('/demo/orders');
  await expect(page).toHaveURL('/demo/orders');  // no redirect
});
```

---

### `e2e/global.setup.ts` (CREATE — no analog, greenfield)

**No existing fixture or setup file in `e2e/`.** Closest existing shape to inform the design:

- `playwright.config.ts:1-6` (dotenv loading precedent — env-var lookup pattern):
  ```typescript
  // playwright.config.ts:1-6
  import { defineConfig, devices } from '@playwright/test';
  import dotenv from 'dotenv';
  import path from 'path';

  // Load .env.local for local development
  dotenv.config({ path: path.resolve(__dirname, '.env.local') });
  ```
- `e2e/production-smoke.spec.ts:19-20` (env-var reads for credentials):
  ```typescript
  // e2e/production-smoke.spec.ts:19-20
  const email = process.env.CLERK_TEST_USER_EMAIL!;
  const password = process.env.CLERK_TEST_USER_PASSWORD!;
  ```

**Implementation source — RESEARCH §Pattern 4** (verified against `github.com/clerk/clerk-playwright-nextjs`):

```typescript
// e2e/global.setup.ts (greenfield)
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import path from 'path';

setup.describe.configure({ mode: 'serial' });

setup('global setup', async () => {
  await clerkSetup();
});

const roles = {
  demo:   { envEmail: 'E2E_DEMO_USER_EMAIL',   envPassword: 'E2E_DEMO_USER_PASSWORD',   file: 'playwright/.clerk/demo.json' },
  norole: { envEmail: 'E2E_NOROLE_USER_EMAIL', envPassword: 'E2E_NOROLE_USER_PASSWORD', file: 'playwright/.clerk/norole.json' },
  admin:  { envEmail: 'E2E_ADMIN_USER_EMAIL',  envPassword: 'E2E_ADMIN_USER_PASSWORD',  file: 'playwright/.clerk/admin.json' },
};

for (const [role, cfg] of Object.entries(roles)) {
  setup(`authenticate ${role}`, async ({ page }) => {
    const email = process.env[cfg.envEmail];
    const password = process.env[cfg.envPassword];
    if (!email || !password) {
      throw new Error(`Missing env: ${cfg.envEmail} / ${cfg.envPassword}`);
    }
    await page.goto('/sign-in');
    await clerk.signIn({
      page,
      signInParams: { strategy: 'password', identifier: email, password },
    });
    await page.goto('/');
    await page.context().storageState({ path: path.join(__dirname, '..', cfg.file) });
  });
}
```

**Open Question O-1 from RESEARCH:** Whether to also create a separate `e2e/fixtures/auth.ts` fixture file. RESEARCH recommends **starting without one** (per-project `storageState` is sufficient for 3 roles × 1 spec file). Planner should default to no `fixtures/auth.ts` unless a future phase needs mid-test role switching.

---

### `playwright.config.ts` (MODIFY)

**Analog:** self — extend the existing `projects` array.

**Existing structure — `playwright.config.ts:19-34`:**

```typescript
// playwright.config.ts:19-34 — current projects array
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'production-smoke',
    testMatch: '**/production-smoke.spec.ts',
    use: {
      ...devices['Desktop Chrome'],
      baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    },
    retries: 0,
    timeout: 30000,
  },
],
```

**Target structure** — keep both existing projects, **add** new ones (per RESEARCH Pattern 4):

```typescript
// Target additions (append to projects array, do not replace)
{
  name: 'global setup',
  testMatch: /global\.setup\.ts/,
},
{
  name: 'demo-user',
  testMatch: /demo-route-protection\.spec\.ts/,
  use: { ...devices['Desktop Chrome'], storageState: 'playwright/.clerk/demo.json' },
  dependencies: ['global setup'],
},
{
  name: 'norole-user',
  testMatch: /demo-route-protection\.spec\.ts/,
  use: { ...devices['Desktop Chrome'], storageState: 'playwright/.clerk/norole.json' },
  dependencies: ['global setup'],
},
```

**Constraints:**
- The existing `chromium` project must keep `testMatch` excluding `global.setup.ts` and `demo-route-protection.spec.ts`, or it will run those specs without auth and fail. Either narrow `chromium`'s `testMatch` to `[route-protection.spec.ts]` (the unauthenticated regression) OR add `testIgnore` for the new files.
- The `production-smoke` project (lines 25-33) is unrelated to Phase 27 — leave untouched.
- The `webServer` block (lines 35-42) and the top-level `dotenv.config` call (lines 5-6) are unchanged. The dotenv load already pulls in `.env.local` so the new `E2E_*` env vars are available to `global.setup.ts`.

---

### `.env.example` (MODIFY)

**Analog:** self. The file is 9 lines (verified). Format is `# Comment header` then `KEY=PLACEHOLDER_VALUE`, grouped by purpose with blank line separators.

**Existing file — `.env.example:1-9` (full file):**

```bash
# Clerk Authentication Keys
# Copy this file to .env.local and fill in your keys from https://dashboard.clerk.com

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Clerk custom page URLs (required for custom sign-in/sign-up pages)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**Target additions** — append a new section block following the same `# Comment header` + key-list pattern (per D-14):

```bash

# E2E test user credentials (per Phase 27, D-14)
# These are dev-instance Clerk users. See docs/clerk-setup.md for creation steps.
E2E_DEMO_USER_EMAIL=e2e-demo+clerk_test@example.com
E2E_DEMO_USER_PASSWORD=
E2E_NOROLE_USER_EMAIL=e2e-norole+clerk_test@example.com
E2E_NOROLE_USER_PASSWORD=
E2E_ADMIN_USER_EMAIL=e2e-admin+clerk_test@example.com
E2E_ADMIN_USER_PASSWORD=
```

**Note:** The existing `.env.example` does NOT contain `CLERK_TEST_USER_EMAIL` / `CLERK_TEST_USER_PASSWORD` (used by `e2e/production-smoke.spec.ts:19-20`) — those are presumably in `.env.local` only. Planner should consider whether to add those to `.env.example` while editing the file, but that's out of D-14's strict scope.

---

### `docs/clerk-setup.md` (CREATE — no analog, greenfield)

**No existing `docs/` directory in the repo** (VERIFIED: `ls docs` returned "NO docs/ DIR"). This is greenfield — the planner's task includes `mkdir -p docs` before write.

**Closest precedent in the repo:** `README.md` at the project root (a standard project README — different content type from a runbook). The `.planning/` directory contains many `.md` files but they are phase-tracking documents, not runbooks.

**Reference shape from RESEARCH §Architecture Patterns / Code Examples:**

Required sections (per D-05, D-07, D-12, D-13):
1. **JWT Template configuration** — Clerk Dashboard path (Sessions → Customize session token), exact JSON to paste: `{"metadata": {"role": "{{user.public_metadata.role}}"}}`
2. **Test user creation** — three users with their email patterns (`e2e-demo+clerk_test@…`, `e2e-norole+clerk_test@…`, `e2e-admin+clerk_test@…`), how to set `publicMetadata.role` in the Dashboard
3. **Sign-out/sign-in caveat** — existing sessions don't refresh until next sign-in
4. **Dev-instance requirement** — `@clerk/testing` only works against `pk_test_…` / `sk_test_…` keys (per RESEARCH Pitfall 4)
5. **Order of operations** — JWT template first, THEN role assignment, THEN sign-out/sign-in (per RESEARCH Pitfall 2)

Format hint from existing `.planning/` markdown style (heading hierarchy, fenced code blocks for JSON/bash): the project consistently uses GitHub-flavored Markdown with `##` for sections and triple-backtick fences. Apply the same.

---

## Shared Patterns

### Pattern A: Server-only Clerk auth via `auth()` from `@clerk/nextjs/server`
**Source:** `src/middleware.ts:1, 20, 30`
**Apply to:** `src/lib/auth.ts`
```typescript
// src/middleware.ts:1
import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// src/middleware.ts:30
const { userId } = await auth();
```
The `@clerk/nextjs/server` package and the `await auth()` async destructure are project-canonical. `src/lib/auth.ts` follows the same package + await shape.

### Pattern B: Type-safe role narrowing via `CustomJwtSessionClaims`
**Source:** `src/types/clerk.d.ts:16-24`
**Apply to:** `src/lib/auth.ts`, `src/middleware.ts` (post-refactor)
```typescript
// src/types/clerk.d.ts:16-24 — already declared, no changes needed
export type Role = 'demo' | 'admin' | 'user';
declare global {
  interface CustomJwtSessionClaims {
    metadata: { role?: Role; };
  }
}
```
This type augmentation means `(await auth()).sessionClaims?.metadata?.role` is typed as `Role | undefined` automatically — no manual cast needed (unlike the existing `user.publicMetadata?.role as Role | undefined` cast at `src/middleware.ts:38`).

### Pattern C: Jest mock placement (mock BEFORE import)
**Source:** `src/middleware.test.ts:1-14`
**Apply to:** `src/lib/auth.test.ts`, `src/middleware.test.ts` (preserved)
```typescript
// src/middleware.test.ts:1-14 — mocks declared at top, source imported after
jest.mock("@clerk/nextjs/server", () => ({ /* ... */ }));
jest.mock("next/server", () => ({ /* ... */ }));
import { config } from "./middleware";
```
The hoisted-mock convention (`jest.mock(...)` calls before any `import`) is universal across the test files in this repo (also seen in `src/app/demo/customers/page.test.tsx:6-34`).

### Pattern D: Test colocation in `src/lib/`
**Source:** `src/lib/utils.ts` + `src/lib/utils.test.ts` (sibling files); `src/lib/clerk-theme.ts` + `src/lib/clerk-theme.test.ts` (sibling files)
**Apply to:** `src/lib/auth.ts` + `src/lib/auth.test.ts`
The project convention is `<name>.ts` and `<name>.test.ts` next to each other in `src/lib/` (NOT a `__tests__` subdirectory). `src/middleware.ts` and `src/middleware.test.ts` follow the same sibling-file convention. Place `src/lib/auth.test.ts` next to `src/lib/auth.ts`.

### Pattern E: Requirement-ID-prefixed `describe` blocks in E2E specs
**Source:** `e2e/demo-route-protection.spec.ts:15-29`, `e2e/route-protection.spec.ts:20-33`
**Apply to:** all new E2E describes added to `e2e/demo-route-protection.spec.ts`
```typescript
// e2e/demo-route-protection.spec.ts:16
test.describe('PROT-03: Unauthenticated user accessing /demo/* redirects to sign-in', () => { /* ... */ });
// e2e/route-protection.spec.ts:21
test.describe('PROT-01: Unauthenticated redirect to sign-in', () => { /* ... */ });
```
New describes should follow the pattern: `'<REQ-ID>: <human-readable scenario>'`. For Phase 27 scenarios, use `ACCESS-02 #1: …` etc. (the requirement maps to ACCESS-02 + the four sub-scenarios in D-11).

### Pattern F: Env-var loading via dotenv at Playwright config level
**Source:** `playwright.config.ts:2-6`
**Apply to:** Nothing new — already handles the new `E2E_*` keys automatically once they're in `.env.local`
```typescript
// playwright.config.ts:2-6
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
```
No new dotenv setup is needed in `e2e/global.setup.ts`; the Playwright config-level load already exposes `process.env.E2E_DEMO_USER_EMAIL` etc. to the setup file.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `e2e/global.setup.ts` | test setup | request-response | No existing Playwright setup files in `e2e/`. Greenfield — use RESEARCH Pattern 4 + canonical `github.com/clerk/clerk-playwright-nextjs` template. |
| `e2e/fixtures/auth.ts` (optional, planner discretion) | test fixture | request-response | No existing fixtures directory. RESEARCH recommends deferring this file unless cross-spec reuse demands it. |
| `docs/clerk-setup.md` | docs (runbook) | n/a | `docs/` directory does not exist yet. No comparable in-repo runbook — `README.md` is project-level, `.planning/*.md` are phase-tracking documents. Use RESEARCH §Architecture Patterns + the canonical Clerk RBAC guide structure. |

---

## Metadata

**Analog search scope:**
- `src/` (full tree — `lib/`, `middleware*`, `types/`, `__tests__/`, `app/demo/`)
- `e2e/` (all three existing spec files)
- Root config: `playwright.config.ts`, `jest.setup.ts`, `package.json`, `.env.example`
- Greenfield directories verified absent: `docs/`, `e2e/fixtures/`, `.claude/skills/`, `.agents/skills/`

**Files scanned:** ~15 (Read), 4 (Grep)

**Pattern extraction date:** 2026-05-11

**Key observations:**
- Every server-side Clerk pattern in the repo (1 location: `src/middleware.ts`) currently uses the old `clerkClient.getUser()` network-call shape; Phase 27 introduces the session-claim shape repo-wide.
- `src/middleware.test.ts` is a **source-string assertion suite**, not a behavior suite — the mocks at lines 1-12 are declared but never exercised against actual middleware behavior. This shape is a constraint, not a model: `src/lib/auth.test.ts` should be a **behavior** suite (mocks exercised), not a string-search suite, because `checkRole`/`requireRole` are pure-ish functions with a clear contract.
- The codebase has no precedent for `next/navigation`'s `redirect()` server-side — pages mock `useRouter`/`usePathname` for client navigation tests, but `redirect()` is a server-only primitive. Phase 27 introduces it cleanly via `src/lib/auth.ts`.
- `@clerk/testing` (2.0.27) is installed (`package.json:28`) but has no usage anywhere in `e2e/` yet — Phase 27 is its first wiring.
