# Phase 31: Role Expansion and DB Infrastructure — Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 12 source/config + 3 planning docs = 15 files
**Analogs found:** 13 / 15 (Drizzle singleton + drizzle.config.ts have no in-repo analog — RESEARCH provides canonical shape)

## File Classification

| File | New/Modify | Role | Data Flow | Closest Analog | Match Quality |
|------|-----------|------|-----------|----------------|---------------|
| `src/db/index.ts` | NEW | server-only module / DB client singleton | server-only | `src/lib/auth.ts` (server-only JSDoc discipline) | partial — analog uses JSDoc disclaimer; new file uses `import 'server-only'` line 1 (D-10) |
| `src/db/schema.ts` | NEW | type module / placeholder | build-tool input | `src/types/clerk.d.ts:8` (`export {}` empty module) | exact — same single-line module shape |
| `drizzle.config.ts` | NEW | config (CLI / Node process) | config | `playwright.config.ts:1-7` (dotenv loading at repo root) | role-match — same env-loading pattern; RESEARCH §"Pattern 2" is the canonical shape |
| `src/components/MillReadOnlyStub.tsx` | NEW | client component (presentational) | client / prop-driven | `src/components/DashboardLayout.tsx:1-20` (`'use client'` + typed props) | role-match — same client-component shape (props-only, no fetching) |
| `src/types/clerk.d.ts` | MODIFY | type declaration | type-only | self (line 16 `Role` union) | exact — single-token union extension |
| `src/lib/auth.ts` | MODIFY | server-only utility | server-only | self (`requireRole` lines 41-49) | exact — `checkRole` mirrors `requireRole` shape minus redirect |
| `src/middleware.ts` | MODIFY | edge middleware | edge / request-response | self (lines 19-39) | exact — confirm-only; no structural change per D-05 |
| `src/app/page.tsx` | MODIFY | RSC (page) | server-only / request-response | self (current Coming Soon) + RESEARCH §"Pattern 4" | role-match — full body rewrite using `await auth()` + `await checkRole(...)` |
| `src/test/fixtures/clerkAuth.ts` | MODIFY | test fixture factory | test / mock | self (`mockDemoSession` lines 167-172, `mockNonDemoSession` lines 181-186) | exact — add `mockMillOperatorSession` + `mockDualRoleSession` mirroring existing factories |
| `playwright.config.ts` | MODIFY | test runner config | config | self (`demo-user`/`norole-user` project lines 36-54) | exact — append `auth-mill-operator` project entry |
| `e2e/global.setup.ts` | MODIFY | test setup script | test / I/O | self (`roles` record lines 36-52) | exact — append `'mill-operator'` entry to roles record |
| `.env.example` | MODIFY | env template | config | self (lines 11-18 E2E user pattern) | exact — add 4 new keys mirroring `E2E_DEMO_USER_*` shape |
| `package.json` | MODIFY | manifest | config | self (lines 16-26 deps, lines 27-52 devDeps) | exact — append 2 deps + 1 devDep entries |
| `docs/clerk-setup.md` | MODIFY | runbook | docs | self (Step 2 table lines 33-37, Step 3 lines 41-59) | exact — add 1 row to Step 2 table; update existing demo row in Step 3 |
| `.planning/REQUIREMENTS.md` | MODIFY | planning doc | docs | self (lines 25-28 AUTH-01..04) | exact — rewrite AUTH-02 and AUTH-03 bullets per D-17 |
| `.planning/ROADMAP.md` | MODIFY | planning doc | docs | self (lines 82-86 Phase 31 SC bullets) | exact — rewrite SC#2 and SC#4 bullets per D-15 + D-16 |

## Pattern Assignments

### `src/db/index.ts` (NEW — server-only DB singleton)

**Analog:** `src/lib/auth.ts` (server-only discipline — JSDoc form). The new file upgrades to runtime `import 'server-only'` per D-10.

**Server-only disclaimer pattern from analog** (`src/lib/auth.ts` lines 1-12):
```typescript
/**
 * Server-only role utilities (ACCESS-02).
 *
 * These helpers read the role claim from the verified session JWT via
 * `auth().sessionClaims?.metadata?.roles` — no Clerk Backend API call.
 *
 * SERVER-ONLY: never import this module into a client component. `auth()`
 * from `@clerk/nextjs/server` is server-only and will throw when invoked
 * from the client. Role checks done in the browser are not a security
 * boundary — middleware + these server utilities are the enforcement
 * points (REQUIREMENTS.md "Out of Scope: client-side role checking").
 */
```

**Canonical shape to write (RESEARCH §"Pattern 1" + §"Code Examples" lines 593-607):**
```typescript
// File: src/db/index.ts
import 'server-only';                              // LINE 1 — D-10
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Use the Neon POOLED endpoint (-pooler.neon.tech) ' +
    'for application queries. drizzle.config.ts uses DATABASE_URL_UNPOOLED for migrations.'
  );
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql });
```

**Key rule (D-10):** `import 'server-only';` MUST be line 1 — readability discipline, not correctness requirement. Add a JSDoc block above the imports if a header comment is desired, but keep `import 'server-only';` syntactically at the top of the import block.

---

### `src/db/schema.ts` (NEW — Phase 31 placeholder)

**Analog:** `src/types/clerk.d.ts:8` (`export {};` empty-module pattern under `isolatedModules`).

**Excerpt from analog** (`src/types/clerk.d.ts:1-8`):
```typescript
/**
 * Clerk TypeScript type definitions for role-based access control.
 *
 * This module augments Clerk's global CustomJwtSessionClaims interface
 * to provide compile-time type safety for role checking throughout the app.
 */

export {};
```

**Canonical shape to write (RESEARCH §"Pattern 3" / §"Code Examples" lines 612-620):**
```typescript
// File: src/db/schema.ts
// Phase 31 placeholder. Real tables (production_orders, order_events,
// import_batches, users) defined in Phase 32 per DATA-02..05.
//
// `export {}` keeps this a valid TS module under isolatedModules without
// declaring any pgTable. drizzle-kit generate produces zero migrations
// in this state, which is the expected end-of-phase 31 outcome.

export {};
```

**Fallback if drizzle-kit rejects (RESEARCH §"Pitfall 8" lines 501-509):** a no-op `pgTable('_phase31_placeholder', { id: serial('id').primaryKey() })` dropped in Phase 32. Decision deferred to a verification step (`npx drizzle-kit generate` once).

---

### `drizzle.config.ts` (NEW — repo root, drizzle-kit CLI config)

**Analog:** `playwright.config.ts` lines 1-7 (dotenv loading pattern at repo root for a separate Node CLI process):
```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local for local development
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
```

**Canonical shape to write (RESEARCH §"Code Examples" lines 564-587):**
```typescript
// File: drizzle.config.ts (repo root)
import { config } from 'dotenv';
import path from 'path';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit is a separate Node process — must explicitly load .env.local
config({ path: path.resolve(__dirname, '.env.local') });

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error(
    'DATABASE_URL_UNPOOLED is not set. Use the Neon DIRECT (non-pooler) URL — ' +
    'PgBouncer transaction mode is incompatible with migration SET commands. ' +
    'See docs/clerk-setup.md or .env.example for the expected shape.'
  );
}

export default defineConfig({
  schema: './src/db/schema.ts',     // D-09: single file in Phase 31
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED,  // D-08
  },
});
```

**Critical:** reads `DATABASE_URL_UNPOOLED` (D-08); mirror the analog's `path.resolve(__dirname, '.env.local')` for consistency with `playwright.config.ts:6`.

---

### `src/components/MillReadOnlyStub.tsx` (NEW — `'use client'` placeholder)

**Analog:** `src/components/DashboardLayout.tsx` lines 1-20 (the canonical `'use client'` component-with-typed-props shape).

**Excerpt from analog** (`src/components/DashboardLayout.tsx:1-20`):
```typescript
'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

/**
 * DashboardLayout provides consistent structure for all dashboard pages.
 * ...
 */
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
```

**Canonical shape to write (RESEARCH §"Pattern 4" / §"Code Examples" lines 370-393):**
```typescript
// File: src/components/MillReadOnlyStub.tsx (Phase 31)
'use client';

export default function MillReadOnlyStub({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center" data-testid="mill-stub">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Mill Production Dashboard
        </h1>
        <p
          className="mt-2 text-sm text-text-secondary"
          data-testid="mill-mode"
          data-mode={canEdit ? 'edit' : 'read-only'}
        >
          {canEdit ? 'Edit mode (mill_operator)' : 'Read-only mode'}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          Production UI launching in Phase 34.
        </p>
      </div>
    </div>
  );
}
```

**Critical rule:** `canEdit` is a *prop* (computed server-side, passed in). NEVER call `checkRole` here — that would defeat the server-only enforcement boundary (CONTEXT.md tier-misassignment risk in §"Architectural Responsibility Map").

---

### `src/types/clerk.d.ts` (MODIFY — extend Role union)

**Analog:** self (line 16).

**Existing union** (`src/types/clerk.d.ts:10-16`):
```typescript
/**
 * User roles in the CGM Dashboard.
 * - 'demo': Access to demo routes (/demo/*)
 * - 'admin': Full administrative access
 * - 'user': Standard authenticated user
 */
export type Role = 'demo' | 'admin' | 'user';
```

**Target** (RESEARCH §"Code Examples" lines 516-528):
```typescript
/**
 * User roles in the CGM Dashboard.
 * - 'demo': Access to demo routes (/demo/*)
 * - 'admin': Full administrative access
 * - 'user': Standard authenticated user
 * - 'mill_operator': Edit role for mill production dashboard (v2.0)
 *   Gates mutating server actions and edit affordances; does NOT gate page access.
 */
export type Role = 'demo' | 'admin' | 'user' | 'mill_operator';
```

Single-token additive change. No consumer signature changes — all `Role`-generic functions (`requireRole`, `checkRole`, `mockNonDemoSession`) accept the new string automatically.

---

### `src/lib/auth.ts` (MODIFY — add `checkRole`)

**Analog:** self (`requireRole` lines 41-49). `checkRole` mirrors the auth() + sessionClaims read but returns boolean instead of redirecting.

**Existing `requireRole` shape** (`src/lib/auth.ts:41-49`):
```typescript
export async function requireRole(role: Role): Promise<void> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }
  if (!sessionClaims?.metadata?.roles?.includes(role)) {
    redirect('/');
  }
}
```

**Target — appended to `src/lib/auth.ts`** (RESEARCH §"Pattern 4" lines 396-409 + §"Code Examples" lines 555-558):
```typescript
/**
 * Returns whether the current session has `role`. Server-only.
 *
 * Use when a page needs to branch on role membership without a redirect
 * — e.g., to compute a `canEdit` prop for a client component.
 *
 * @example
 *   // src/app/page.tsx
 *   const canEdit = await checkRole('mill_operator');
 *   return <MillReadOnlyStub canEdit={canEdit} />;
 */
export async function checkRole(role: Role): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.roles?.includes(role) ?? false;
}
```

**Load-bearing note (RESEARCH §"Pitfall 7"):** `checkRole` is NOT yet exported. Without this addition, `src/app/page.tsx` fails to compile with `Module '@/lib/auth' has no exported member 'checkRole'`. The plan MUST schedule this addition before the page rewrite.

---

### `src/middleware.ts` (MODIFY — confirm-only, no structural change per D-05)

**Analog:** self (lines 19-39).

**Existing middleware body** (`src/middleware.ts:19-39`):
```typescript
export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Demo route protection per ACCESS-01
  if (isDemoRoute(request)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }

    if (!sessionClaims?.metadata?.roles?.includes('demo')) {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }
});
```

**Required change:** NONE. `/` is already protected by the `!isPublicRoute(request)` branch via `auth.protect()`. D-05 explicitly forbids adding an `isMillOperatorRoute` matcher.

**Verification only (RESEARCH §"Phase Requirements" AUTH-03):** Confirm the existing `src/middleware.test.ts:156-161` source-string assertions still pass — particularly the negative assertion that `isDemoRoute` is NOT widened.

---

### `src/app/page.tsx` (MODIFY — full body rewrite)

**Analog:** self (existing Coming Soon page) + RESEARCH §"Pattern 4" RSC + client wrapper shape.

**Existing body to replace** (`src/app/page.tsx:1-18`):
```typescript
import DashboardLayout from '@/components/DashboardLayout';

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Coming Soon
          </h1>
          ...
```

**Target shape (RESEARCH §"Code Examples" lines 346-367):**
```typescript
// File: src/app/page.tsx (Phase 31)
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkRole } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import MillReadOnlyStub from '@/components/MillReadOnlyStub';

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');  // D-02: auth gate ONLY (no role gate)
  }
  const canEdit = await checkRole('mill_operator');  // D-03

  return (
    <DashboardLayout>
      <MillReadOnlyStub canEdit={canEdit} />
    </DashboardLayout>
  );
}
```

**Critical rules (D-01, D-02, D-03):**
- Function MUST become `async` (RSC pattern; `auth()` + `checkRole()` return promises).
- NO `await requireRole('mill_operator')` — D-01 explicitly forbids a page-level role gate.
- `canEdit` is computed server-side, never recomputed in the browser.

---

### `src/test/fixtures/clerkAuth.ts` (MODIFY — add multi-role session factories)

**Analog:** self (`mockDemoSession` lines 167-172, `mockNonDemoSession` lines 181-186).

**Existing factory shape** (`src/test/fixtures/clerkAuth.ts:167-186`):
```typescript
export function mockDemoSession(): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { roles: ['demo'] } },
  });
}

export function mockNonDemoSession(role: Exclude<Role, 'demo'> = 'user'): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { roles: [role] } },
  });
}
```

**Target — additions (RESEARCH §"Code Examples" lines 670-693):**
```typescript
/**
 * Seed mockAuth to resolve with a session whose roles array contains 'mill_operator'.
 */
export function mockMillOperatorSession(): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { roles: ['mill_operator'] } },
  });
}

/**
 * Seed mockAuth to resolve with a session whose roles array contains BOTH
 * 'demo' and 'mill_operator' — the canonical multi-role coverage path (D-13).
 * Verifies Array.prototype.includes membership semantics for multi-role users.
 */
export function mockDualRoleSession(): void {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { roles: ['demo', 'mill_operator'] } },
  });
}
```

**No-touch (RESEARCH lines 695):** `mockNonDemoSession(role: Exclude<Role, 'demo'> = 'user')` widens automatically once `Role` includes `'mill_operator'`. Do NOT edit the signature.

---

### `playwright.config.ts` (MODIFY — add `auth-mill-operator` project)

**Analog:** self (existing `demo-user` and `norole-user` projects lines 36-54).

**Existing project shape** (`playwright.config.ts:36-44`):
```typescript
{
  name: 'demo-user',
  testMatch: /demo-route-protection\.spec\.ts$/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.clerk/demo.json',
    baseURL: 'http://localhost:3000',
  },
  dependencies: ['global setup'],
},
```

**Target — append to projects[] (RESEARCH §"Code Examples" lines 644-654):**
```typescript
{
  name: 'auth-mill-operator',
  testMatch: /demo-route-protection\.spec\.ts$/,  // existing spec OR new mill-operator smoke spec
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.clerk/mill-operator.json',
    baseURL: 'http://localhost:3000',
  },
  dependencies: ['global setup'],
},
```

**Optional new spec (RESEARCH §"Open Questions" #2):** `e2e/mill-operator-smoke.spec.ts` asserting `data-mode="edit"` on `<MillReadOnlyStub>`. If added, point `testMatch` at it instead of the demo-route spec.

---

### `e2e/global.setup.ts` (MODIFY — extend roles record)

**Analog:** self (lines 36-52 `roles` record).

**Existing roles record** (`e2e/global.setup.ts:36-52`):
```typescript
const roles: Record<'demo' | 'norole' | 'admin', RoleFixture> = {
  demo: {
    envEmail: 'E2E_DEMO_USER_EMAIL',
    envPassword: 'E2E_DEMO_USER_PASSWORD',
    file: 'playwright/.clerk/demo.json',
  },
  norole: { ... },
  admin: { ... },
};
```

**Target — extend type union and add entry (RESEARCH §"Code Examples" lines 657-662):**
```typescript
const roles: Record<'demo' | 'norole' | 'admin' | 'mill-operator', RoleFixture> = {
  // ... existing 3 entries unchanged ...
  'mill-operator': {
    envEmail: 'E2E_MILL_OPERATOR_USER_EMAIL',
    envPassword: 'E2E_MILL_OPERATOR_USER_PASSWORD',
    file: 'playwright/.clerk/mill-operator.json',
  },
};
```

The `Object.entries(roles)` for-loop at line 54 picks up the new entry automatically.

---

### `.env.example` (MODIFY — append 4 new keys)

**Analog:** self (lines 11-18 E2E user pattern).

**Existing pattern** (`.env.example:11-18`):
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

**Target — append (RESEARCH §"Code Examples" lines 628-637):**
```bash
# E2E mill-operator test user (Phase 31, D-12 + D-14)
E2E_MILL_OPERATOR_USER_EMAIL=e2e-mill-operator+clerk_test@example.com
E2E_MILL_OPERATOR_USER_PASSWORD=

# Neon Postgres (Phase 31, D-07)
# DATABASE_URL: pooled endpoint (-pooler.neon.tech) for application queries.
# DATABASE_URL_UNPOOLED: direct endpoint for drizzle-kit migrations only.
# PgBouncer transaction mode breaks migration SET commands — never swap these.
DATABASE_URL=
DATABASE_URL_UNPOOLED=
```

Mirror the existing pattern: email line, then empty-value password line, then a blank line separator.

---

### `package.json` (MODIFY — add 3 packages)

**Analog:** self (deps lines 16-26, devDeps lines 27-52).

**Target additions:**
- `dependencies`: `"drizzle-orm": "0.45.2"`, `"@neondatabase/serverless": "1.1.0"`
- `devDependencies`: `"drizzle-kit": "0.31.10"`

**Install command (RESEARCH §"Standard Stack" lines 132-135):**
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

**Do NOT add (RESEARCH §"Anti-Patterns" line 422):** `nuqs`, `zod`, `read-excel-file`. They belong to later phases (Phase 33-34). `dotenv` is already present at `^17.4.2` (line 40) — no action needed.

**Versions:** Pin exact versions matching research baseline (no `^` prefix per RESEARCH line 114). Re-verify via `npm view <pkg> version` before install.

---

### `docs/clerk-setup.md` (MODIFY — Step 2 + Step 3 updates)

**Analog:** self (Step 2 table lines 33-37, Step 3 lines 41-59).

**Step 2 — existing table** (`docs/clerk-setup.md:33-37`):
```markdown
| Email | Password | publicMetadata.roles |
|-------|----------|----------------------|
| `e2e-demo+clerk_test@example.com` | (set during creation, store in `.env.local` as `E2E_DEMO_USER_PASSWORD`) | `["demo"]` |
| `e2e-norole+clerk_test@example.com` | (set during creation, store in `.env.local` as `E2E_NOROLE_USER_PASSWORD`) | _(not set)_ |
| `e2e-admin+clerk_test@example.com` | (set during creation, store in `.env.local` as `E2E_ADMIN_USER_PASSWORD`) | `["admin"]` |
```

**Step 2 — target:** Update the existing `e2e-demo` row to `["demo", "mill_operator"]` (D-13). Append a new row:
```markdown
| `e2e-mill-operator+clerk_test@example.com` | (set during creation, store in `.env.local` as `E2E_MILL_OPERATOR_USER_PASSWORD`) | `["mill_operator"]` |
```

**Step 3 — existing single-role example** (`docs/clerk-setup.md:49-57`):
```json
{"roles": ["demo"]}
```

**Step 3 — target:** Add a multi-role example for the demo user (D-13) and a new `mill_operator`-only example:
```json
{"roles": ["demo", "mill_operator"]}
```
```json
{"roles": ["mill_operator"]}
```

Also extend Step 5 ("Populate .env.local") with the new key pair, and add a verification line for the mill_operator user's decoded JWT.

**Reiterate Pitfall 6 (RESEARCH lines 482-487):** After updating the demo user's metadata, the operator MUST sign out + sign back in to refresh the cookie. Add an explicit reminder line tied to D-13.

---

### `.planning/REQUIREMENTS.md` (MODIFY — rewrite AUTH-02 and AUTH-03 per D-17)

**Analog:** self (lines 25-28).

**Existing requirement bullets** (`.planning/REQUIREMENTS.md:25-28`):
```markdown
- [ ] **AUTH-01**: `mill_operator` role string added to the `Role` union in `src/types/clerk.d.ts`.
- [ ] **AUTH-02**: `requireRole('mill_operator')` enforced at the page level in `src/app/page.tsx` (canonical server-side guard).
- [ ] **AUTH-03**: Middleware coarse-gate added for `/` as defense-in-depth, mirroring the `/demo/*` pattern from v1.5.
- [ ] **AUTH-04**: `docs/clerk-setup.md` runbook updated with `mill_operator` test user assignment and JWT template verification step.
```

**Target rewrite (D-04 + D-05):**
```markdown
- [ ] **AUTH-02**: Mutating server actions (Phase 33: transitions, bulk import) enforce `await requireRole('mill_operator')` as the canonical server-side guard for v2.0 write operations. `/` page-level enforcement is NOT used — any authenticated user may view `/` in read-only mode.
- [ ] **AUTH-03**: Middleware adds `/` to the `auth.protect()` flow only (already covered by the existing `!isPublicRoute(request)` branch). NO `mill_operator` coarse-gate matcher mirroring `/demo/*`.
```

AUTH-01 and AUTH-04 are unchanged. DATA-01 and DATA-08 (lines 14, 21) unchanged in text — D-16 amends only ROADMAP SC#4.

---

### `.planning/ROADMAP.md` (MODIFY — rewrite Phase 31 SC#2 and SC#4 per D-15 + D-16)

**Analog:** self (lines 82-86).

**Existing success criteria** (`.planning/ROADMAP.md:82-86`):
```markdown
  1. `'mill_operator'` is a member of the `Role` union; TypeScript compiles clean with `tsc --noEmit`
  2. An authenticated user without `mill_operator` in their `roles` array is redirected away from `/` at both the middleware and page level
  3. `src/db/index.ts` exists with `import 'server-only'` as line 1; `next build` completes with no Edge-bundle errors
  4. `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) are set in Vercel env; `drizzle.config.ts` references `DATABASE_URL_UNPOOLED` for migrations
  5. `docs/clerk-setup.md` runbook updated with `mill_operator` test user assignment and JWT template verification
```

**Target rewrite:**
- **SC#2 (D-15):** "An authenticated user without `mill_operator` sees `/` in read-only mode (edit affordances hidden); mutating server actions (Phase 33) reject without `mill_operator`."
- **SC#4 (D-16):** "`DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) set in `.env.local`; `drizzle.config.ts` references `DATABASE_URL_UNPOOLED` for migrations. Vercel env-var provisioning deferred to Phase 34 first deploy."

SC#1, SC#3, SC#5 unchanged.

---

## Shared Patterns

### Server-only enforcement
**Source:** `src/lib/auth.ts:1-12` (JSDoc form) + RESEARCH §"Pattern 1" (`import 'server-only'` line-1 form).
**Apply to:** `src/db/index.ts` (REQUIRED — uses runtime `import 'server-only'` per D-10), `src/lib/auth.ts` (existing JSDoc form preserved when `checkRole` is added).

**Forbidden:** importing either module into any `'use client'` file (RESEARCH §"Anti-Patterns" line 416, CONTEXT.md §"Architectural Responsibility Map"). The browser bundle MUST NOT contain `drizzle`, `@neondatabase/serverless`, or `@clerk/nextjs/server`.

### Test fixture mocking pattern
**Source:** `src/lib/auth.test.ts:1-22` (mock placement + `mockAuth` sentinel-throw redirect) and `src/test/fixtures/clerkAuth.ts:56-60` + `:136-161` (factory pattern with deferred invocation).

**Excerpt** (`src/lib/auth.test.ts:6-16`):
```typescript
const mockAuth = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });
  },
}));
```

**Apply to:** any new Jest test that exercises `requireRole('mill_operator')`, `checkRole('mill_operator')`, or `src/app/page.tsx`'s `await auth()` + `await checkRole(...)` branches. The clerkAuth fixture (`mockMillOperatorSession`, `mockDualRoleSession`) is the canonical setup.

### Module-level test pattern for new tests under `src/db/`
**Source:** `src/middleware.test.ts:156-174` (source-string inspection via `fs.readFile`).
**Apply to:** new `src/db/__tests__/index.test.ts` (RESEARCH §"Validation Architecture" DATA-08 row 791) — asserts that `lines[0] === "import 'server-only';"`. Mirror the `fs.readFile` + `expect(content).toContain(...)` shape from the middleware test.

### Env-loading for repo-root config files
**Source:** `playwright.config.ts:1-7`.
**Apply to:** `drizzle.config.ts` (D-08) — same `path.resolve(__dirname, '.env.local')` pattern. NOT inherited from `next dev`/`next build` (which load `.env.local` automatically); drizzle-kit is a separate Node process (RESEARCH §"Pitfall 4" lines 471-475).

### Clerk dashboard runbook pattern
**Source:** `docs/clerk-setup.md` Step 2 table + Step 3 metadata-JSON blocks + Step 4 sign-out reminder.
**Apply to:** all v2.0+ phases that introduce new test users. Phase 31 adds 1 row (mill_operator) and updates 1 row (demo → dual-role).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/db/index.ts` | Drizzle-Neon HTTP singleton with `import 'server-only'` line 1 | server-only | No Drizzle code exists in repo yet. RESEARCH §"Pattern 1" + §"Code Examples" lines 593-607 (verified against orm.drizzle.team/docs/connect-neon) is the canonical shape. `src/lib/auth.ts` provides the *server-only discipline* analog but not the *Drizzle/Neon API* shape. |
| `drizzle.config.ts` | drizzle-kit CLI config at repo root | config (Node CLI) | No existing drizzle-kit config in repo. `playwright.config.ts` provides the *dotenv-at-repo-root* analog for env loading; RESEARCH §"Pattern 2" + §"Code Examples" lines 564-587 is the canonical full shape. |

For these two files, the planner should reference RESEARCH.md directly rather than an in-repo file. Both shapes are verified against the official Drizzle Neon tutorial (orm.drizzle.team/docs/connect-neon, verified 2026-05-12).

---

## Metadata

**Analog search scope:**
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/lib/`
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/types/`
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/middleware*.ts`
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/app/page.{tsx,test.tsx}`
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components/DashboardLayout.tsx`
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/test/fixtures/`
- `/Users/joel/Desktop/Projects/cgm-dashboard/playwright.config.ts`, `e2e/global.setup.ts`
- `/Users/joel/Desktop/Projects/cgm-dashboard/.env.example`, `package.json`
- `/Users/joel/Desktop/Projects/cgm-dashboard/docs/clerk-setup.md`
- `/Users/joel/Desktop/Projects/cgm-dashboard/.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`

**Files scanned:** 14 analog candidates read; 13 produced concrete excerpts; 2 NEW files (`src/db/index.ts`, `drizzle.config.ts`) defer to RESEARCH.md for the canonical shape.

**Pattern extraction date:** 2026-05-12

**Project conventions discovered:**
- No `CLAUDE.md` or `AGENTS.md` at repo root.
- No `.claude/skills/` or `.agents/skills/` directories.
- Effective constraints come from `docs/security-patterns.md`, `docs/clerk-setup.md`, `.planning/STATE.md` (per RESEARCH §"Project Constraints").
- TypeScript `isolatedModules: true` requires explicit module markers (`export {}`) on empty modules — pattern verified in `src/types/clerk.d.ts:8`.
- All role checks use `metadata.roles.includes(role)` (post-quick-task-260512-kfy). No singular `role` field anywhere.
