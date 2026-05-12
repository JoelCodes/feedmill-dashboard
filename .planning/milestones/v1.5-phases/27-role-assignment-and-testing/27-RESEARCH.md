# Phase 27: Role Assignment and Testing - Research

**Researched:** 2026-05-11
**Domain:** Clerk session-claim-based RBAC + Playwright E2E with `@clerk/testing`
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Utility Function API**
- **D-01:** Role utilities live in `src/lib/auth.ts` (auth-focused module; room for related helpers later)
- **D-02:** `checkRole(role: Role): Promise<boolean>` — async, reads `auth().sessionClaims?.metadata?.role`. No network call. Returns `false` if no session or no claim.
- **D-03:** `requireRole(role: Role): Promise<void>` — uses `next/navigation`'s `redirect()`. On wrong role: `redirect('/')` (mirrors middleware D-01 from Phase 25). On missing `userId`: `redirect('/sign-in')`. One-call guard for server components.

**Role Source Migration**
- **D-04:** Migrate middleware **and** utilities to read from `auth().sessionClaims?.metadata?.role`. Drop the per-request `clerkClient.users.getUser()` call and the `clerkClient` import.
- **D-05:** Clerk Dashboard JWT template customization is a **manual step** captured in `docs/clerk-setup.md`. The template adds `{"metadata": {"role": "{{user.public_metadata.role}}"}}` to the session token claims.
- **D-06:** No fallback to `clerkClient.getUser()` if the claim is missing — clean migration. Existing sessions get the new claim on next sign-in.
- **D-07:** Document the sign-out / sign-in requirement for existing users in `docs/clerk-setup.md` and the phase verification notes. No programmatic session revocation.

**Testing Strategy**
- **D-08:** Unit tests for `checkRole` / `requireRole` using `jest.mock('@clerk/nextjs/server')` to stub `auth()` (same pattern as existing `src/middleware.test.ts`). Cover: matching role, mismatched role, missing `sessionClaims`, missing `userId`, redirect targets for `requireRole`.
- **D-09:** Update `src/middleware.test.ts` to reflect the session-claims source (drop `clerkClient` assertions, add `sessionClaims.metadata.role` assertions).
- **D-10:** Unskip the existing `.skip()`'d test in `e2e/demo-route-protection.spec.ts` and add Playwright auth fixtures using **`@clerk/testing`** (Clerk's official Playwright integration with testing tokens — bypasses CAPTCHA/2FA).
- **D-11:** Four E2E scenarios required to land green:
  1. Demo user accesses `/demo/orders`, `/demo/customers`, `/demo/mill-production` successfully
  2. Non-demo user is redirected to `/` when accessing any `/demo/*` route
  3. Both demo and non-demo authenticated users can access `/settings`
  4. Unauthenticated user accessing `/demo/*` redirects to `/sign-in` (existing test, regression guard)

**Role Assignment Scope**
- **D-12:** Three real Clerk users created and role-assigned via the Clerk Dashboard: `e2e-demo@…` (role: `demo`), `e2e-norole@…` (no role), `e2e-admin@…` (role: `admin`). Admin user exists for completeness even though admin behavior isn't exercised in v1.5.
- **D-13:** Joel creates these users manually in Clerk Dashboard. Email patterns and role assignments documented in `docs/clerk-setup.md`. No backend-API seeding script in this phase.
- **D-14:** Test credentials stored in `.env.local` and documented in `.env.example`:
  - `E2E_DEMO_USER_EMAIL` / `E2E_DEMO_USER_PASSWORD`
  - `E2E_NOROLE_USER_EMAIL` / `E2E_NOROLE_USER_PASSWORD`
  - `E2E_ADMIN_USER_EMAIL` / `E2E_ADMIN_USER_PASSWORD`

**Verification**
- **D-15:** Phase verification ends with a manual UAT checklist (in `27-VERIFICATION.md` or PLAN.md acceptance block): sign in as each of the three users, navigate to `/demo/*` and `/settings`, confirm expected redirect/access behavior visually.

### Claude's Discretion
None — every selected area was explicitly decided in `/gsd-discuss-phase`.

### Deferred Ideas (OUT OF SCOPE)
- **Automatic role assignment on sign-up (ROLE-04):** Stays deferred per REQUIREMENTS.md. Phase 27 covers manual assignment only.
- **Admin role behavior:** Admin user exists for testing surface but no admin-only features in v1.5. Future milestone.
- **Programmatic test-user seeding script:** A `scripts/seed-test-users.ts` using `@clerk/backend` could replace manual Dashboard creation. Not in this phase — defer until test-user churn justifies the script.
- **Production E2E with real auth:** Still blocked by Clerk 2FA on the production custom domain. Same blocker as v1.4.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACCESS-02 | Role utility functions (`checkRole()`, `requireRole()`) available for server components | Standard Clerk RBAC pattern (verified against official `clerk.com/docs/guides/secure/basic-rbac`) maps directly to D-01/D-02/D-03. The session-claim source (D-04) eliminates network calls. Validation Architecture section below maps the requirement to specific unit + E2E tests. |
</phase_requirements>

## Summary

Phase 27 is **infrastructure activation**, not new capability. The Clerk RBAC pattern is canonical and documented end-to-end by Clerk — there is no design ambiguity. Two implementation moves account for nearly all of the work:

1. **Switch the role-source from a network call to a session claim.** Today `src/middleware.ts:36-38` does `clerkClient().users.getUser(userId).publicMetadata.role`. After this phase, both middleware and new utilities in `src/lib/auth.ts` read `(await auth()).sessionClaims?.metadata?.role`. This requires a manual JWT template change in the Clerk Dashboard (D-05) so the claim is populated; existing sessions need a sign-out/sign-in to refresh.

2. **Wire `@clerk/testing` into Playwright.** The package is already installed (`@clerk/testing@2.0.27` [VERIFIED: npm view @clerk/testing version]). Pattern is: a `global.setup.ts` project that calls `clerkSetup()` once per run, and per-test (or per-fixture) `clerk.signIn({ page, signInParams: { strategy: 'password', identifier, password } })`. Storage state per-role is the cleanest path for three users without re-signing-in inside every test.

Two landmines worth flagging:
- The Clerk basic-RBAC guide uses `"metadata": "{{user.public_metadata}}"` (entire object) but the existing `CustomJwtSessionClaims` declaration (`src/types/clerk.d.ts:19-23`) expects `metadata: { role?: Role }`. The CONTEXT.md JWT template `{"metadata": {"role": "{{user.public_metadata.role}}"}}` (D-05) is the correct shape — selects only the role field, matches the type, and stays well under Clerk's 1.2 KB custom-claim ceiling. [VERIFIED: clerk.com/docs/guides/secure/basic-rbac; CITED: clerk.com/docs/guides/sessions/session-tokens]
- The existing `src/middleware.test.ts` is a **source-code-string assertion** suite, not a behavior test (it does `fs.readFile(middleware.ts)` and greps for strings like `"clerkClient"`, `"publicMetadata"`). When we change the source, those strings must change too — this is not a Jest mock surface change, it's a literal string-search update. The mock at the top of the file (`jest.mock('@clerk/nextjs/server', …)`) is currently never exercised against middleware behavior.

**Primary recommendation:** Implement `src/lib/auth.ts` first using TDD (clear pure-ish I/O contract), then refactor `src/middleware.ts`, then rewrite `src/middleware.test.ts` string assertions to match. E2E layer comes last (depends on real Clerk users existing + JWT template active).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Read role from session claim | API / Backend (Node) | — | `auth()` only runs server-side; sessionClaims is a JWT decoded server-side. Never trust client-side role checks. |
| Middleware route enforcement | Edge / Middleware | — | Next.js middleware runs in Edge runtime before the route handler; correct place for redirect-before-render. |
| `checkRole()` utility | API / Backend (Node server components) | — | Server-component utility; reads `auth()` (server-only) and returns boolean. Caller decides what to do. |
| `requireRole()` utility | API / Backend (Node server components) | — | Server-component guard; reads `auth()` and calls `redirect()` from `next/navigation` (server-only). |
| Role assignment storage | Clerk-managed (external) | — | `publicMetadata` lives in Clerk's user store; Dashboard is the write surface. We never touch it programmatically in v1.5. |
| JWT template (claim shape) | Clerk Dashboard configuration | Docs/runbook (`docs/clerk-setup.md`) | Cannot be code-versioned (Dashboard-managed). Documented in repo so it's reproducible. |
| E2E auth setup | Playwright test runtime | `@clerk/testing` helper | Test-only concern; never touches production code paths. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@clerk/nextjs` | 7.3.3 (installed) [VERIFIED: package.json:17] | `auth()`, `clerkMiddleware`, `createRouteMatcher` | Already the project's auth layer; v7+ ships `auth()` as async on Node/Edge. |
| `@clerk/testing` | 2.0.27 (installed) [VERIFIED: package.json:28, npm view @clerk/testing version → 2.0.27 (2026-05-08)] | Playwright integration: `clerkSetup`, `clerk.signIn`, testing tokens | Official Clerk-maintained E2E helper. Bypasses CAPTCHA + bot detection via a per-session testing token. |
| `next/navigation` (built-in) | Next.js 16.1.6 [VERIFIED: package.json:21] | `redirect()` for server-side redirects | Standard Next.js redirect primitive; throws an internal sentinel (`NEXT_REDIRECT`) so callers don't need to `return` after it. |
| `@playwright/test` | 1.59.1 (installed) [VERIFIED: package.json:30] | Test runner, fixtures, projects | Already in place. |
| `jest` | 30.3.0 (installed) [VERIFIED: package.json:46] | Unit test runner | Already in place; `next/jest.js` config supports module aliasing. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@clerk/backend` | (transitively via `@clerk/nextjs`) | `createClerkClient` for admin user CRUD | NOT needed in Phase 27 — D-13 keeps user creation manual. Useful if a future phase scripts seeding. |
| `dotenv` | 17.4.2 (installed) [VERIFIED: package.json:40] | Load `.env.local` into Playwright | Already used in `playwright.config.ts:2-6`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `sessionClaims?.metadata?.role` | Keep `clerkClient.users.getUser()` | Network call per request, ~80–200 ms latency on Edge, blocks middleware. Rejected per D-04. |
| `auth.protect({ role: '…' })` | Built-in role check via `has()` | Clerk's `has()` is for **organization** roles/permissions, not `publicMetadata` flat roles. v1.5 explicitly uses publicMetadata (REQUIREMENTS.md "Out of Scope: Organization-based RBAC"). Wrong tool. [VERIFIED: clerk.com/docs/references/nextjs/clerk-middleware] |
| Per-test `clerk.signIn()` in every spec | Storage state files (`playwright/.clerk/{role}.json`) | Repeated sign-in across tests is slow and flakier. Storage state pattern is the canonical Clerk recommendation. [CITED: github.com/clerk/clerk-playwright-nextjs playwright.config.ts] |
| Programmatic test user seeding via `@clerk/backend` | Manual Dashboard creation | Seeding makes CI reproducible but adds an admin-key-handling concern. Deferred per D-13. |

**Installation:** All required dependencies already installed. No `npm install` required.

**Version verification:**
```bash
npm view @clerk/testing version   # → 2.0.27 (verified 2026-05-11)
npm view @clerk/nextjs version    # → 7.3.3 (matches installed)
```

## Architecture Patterns

### System Architecture Diagram

```
                                            CLERK DASHBOARD
                                            (manual config)
                                                  │
                                                  ▼
                                    JWT template: { metadata: { role } }
                                                  │
                       (claim baked into session token on sign-in)
                                                  │
                                                  ▼
       ┌──────────────────────────────────────────────────────────────────┐
       │ Browser request                                                   │
       │  - cookie: __session (JWT with metadata.role)                     │
       └──────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
       ┌──────────────────────────────────────────────────────────────────┐
       │  src/middleware.ts (Edge runtime)                                 │
       │   ① auth.protect()           — non-public routes need session    │
       │   ② if /demo/*:                                                  │
       │       const { userId, sessionClaims } = await auth()             │
       │       const role = sessionClaims?.metadata?.role                 │
       │       if role !== 'demo' → NextResponse.redirect('/')            │
       └──────────────────────────────────────────────────────────────────┘
                                  │ (allowed)
                                  ▼
       ┌──────────────────────────────────────────────────────────────────┐
       │  Server Component / Route Handler                                 │
       │                                                                   │
       │   import { checkRole, requireRole } from '@/lib/auth'             │
       │                                                                   │
       │   // pure boolean check (D-02)                                   │
       │   const isDemo = await checkRole('demo')                         │
       │                                                                   │
       │   // guard with redirect side-effect (D-03)                      │
       │   await requireRole('demo')   // throws NEXT_REDIRECT if not     │
       └──────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                              Render page

       ┌─── Test-time only ────────────────────────────────────────────────┐
       │ Playwright runner                                                 │
       │   global.setup.ts:                                                │
       │     await clerkSetup()                                            │
       │     // for each role: clerk.signIn + storageState                 │
       │   test files use storageState: 'playwright/.clerk/{role}.json'    │
       └──────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── lib/
│   ├── auth.ts                # NEW — checkRole(), requireRole()
│   ├── auth.test.ts           # NEW — unit tests for both utilities
│   ├── utils.ts               # existing
│   └── utils.test.ts          # existing (style reference)
├── middleware.ts              # MODIFIED — read sessionClaims, drop clerkClient
├── middleware.test.ts         # MODIFIED — update string assertions
└── types/
    └── clerk.d.ts             # UNCHANGED — already correct shape

e2e/
├── fixtures/
│   └── auth.ts                # NEW — per-role storage-state fixture
├── global.setup.ts            # NEW — clerkSetup + sign-in each role
├── demo-route-protection.spec.ts  # MODIFIED — unskip + add ACCESS-02 scenarios
├── route-protection.spec.ts   # unchanged (unauthenticated regression)
└── production-smoke.spec.ts   # unchanged (separate project)

playwright.config.ts            # MODIFIED — add global-setup project +
                                #            per-role projects with storageState

docs/
└── clerk-setup.md             # NEW — Dashboard runbook (template JSON,
                                #       test user emails, sign-out/sign-in note)

.env.example                    # MODIFIED — add 3 pairs of E2E user creds
```

### Pattern 1: Pure-ish utility that reads `auth()`
**What:** Server-only helper, no React, no side effects (for `checkRole`); single side effect for `requireRole` (redirect).
**When to use:** Whenever a server component or route handler needs to gate behavior on role.
**Example:**
```typescript
// Source: clerk.com/docs/guides/secure/basic-rbac (adapted to D-02/D-03)
// src/lib/auth.ts
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Role } from '@/types/clerk'

/** Returns true iff the current session has the given role. */
export async function checkRole(role: Role): Promise<boolean> {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata?.role === role
}

/**
 * Server-component guard. Redirects to /sign-in if unauthenticated,
 * or to / if the user lacks the required role. Never returns when redirecting
 * (next/navigation's redirect throws NEXT_REDIRECT internally).
 */
export async function requireRole(role: Role): Promise<void> {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }
  if (sessionClaims?.metadata?.role !== role) {
    redirect('/')
  }
}
```

### Pattern 2: Middleware reads same claim
**What:** Replace the `clerkClient.users.getUser()` network call with a claim read.
**When to use:** Every middleware request — this is what the migration enables.
**Example:**
```typescript
// Source: clerk.com/docs/guides/secure/basic-rbac (adapted to existing middleware.ts)
// src/middleware.ts (after Phase 27)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])
const isDemoRoute = createRouteMatcher(['/demo(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  if (isDemoRoute(request)) {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (sessionClaims?.metadata?.role !== 'demo') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
})
```
Notice: `clerkClient` import and `client.users.getUser()` call both removed. `Role` type import becomes unused (string literal `'demo'` is sufficient; TypeScript narrows via `CustomJwtSessionClaims`).

### Pattern 3: Jest unit test with `auth()` mock and `redirect()` sentinel
**What:** Mock both `@clerk/nextjs/server` (for `auth()`) and `next/navigation` (for `redirect()` throwing a sentinel).
**When to use:** Both `src/lib/auth.test.ts` files in this phase.
**Example:**
```typescript
// Source: github.com/vercel/next.js/discussions/59061 (sentinel-throw pattern)
//         combined with the existing src/middleware.test.ts mock style.
// src/lib/auth.test.ts
import { checkRole, requireRole } from './auth'

class TestRedirect extends Error {
  constructor(readonly url: string) { super(`redirect to ${url}`) }
}

const mockAuth = jest.fn()
jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}))
jest.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new TestRedirect(url) },
}))

beforeEach(() => mockAuth.mockReset())

describe('checkRole', () => {
  it('returns true when claim matches', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'demo' } } })
    expect(await checkRole('demo')).toBe(true)
  })

  it('returns false when claim does not match', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } })
    expect(await checkRole('demo')).toBe(false)
  })

  it('returns false when sessionClaims is undefined', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: undefined })
    expect(await checkRole('demo')).toBe(false)
  })

  it('returns false when metadata.role is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: {} } })
    expect(await checkRole('demo')).toBe(false)
  })

  it('returns false when userId is null (unauthenticated)', async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null })
    expect(await checkRole('demo')).toBe(false)
  })
})

describe('requireRole', () => {
  it('redirects to /sign-in when userId is missing', async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null })
    await expect(requireRole('demo')).rejects.toMatchObject({ url: '/sign-in' })
  })

  it('redirects to / when role does not match', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'user' } } })
    await expect(requireRole('demo')).rejects.toMatchObject({ url: '/' })
  })

  it('resolves without throwing when role matches', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'demo' } } })
    await expect(requireRole('demo')).resolves.toBeUndefined()
  })
})
```

### Pattern 4: Playwright global setup + per-role storage state
**What:** Sign in once per role at suite startup; reuse the cookie/session across all tests.
**When to use:** This is the canonical `@clerk/testing` pattern for multi-role suites.
**Example:**
```typescript
// Source: github.com/clerk/clerk-playwright-nextjs/e2e/global.setup.ts
//         (adapted from emailAddress-only to password strategy + 3 roles)
// e2e/global.setup.ts
import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'
import path from 'path'

setup.describe.configure({ mode: 'serial' })

setup('global setup', async () => {
  await clerkSetup()   // obtains a testing token for the suite
})

type RoleFixture = {
  envEmail: string
  envPassword: string
  file: string
}

const roles: Record<'demo' | 'norole' | 'admin', RoleFixture> = {
  demo:   { envEmail: 'E2E_DEMO_USER_EMAIL',   envPassword: 'E2E_DEMO_USER_PASSWORD',   file: 'playwright/.clerk/demo.json' },
  norole: { envEmail: 'E2E_NOROLE_USER_EMAIL', envPassword: 'E2E_NOROLE_USER_PASSWORD', file: 'playwright/.clerk/norole.json' },
  admin:  { envEmail: 'E2E_ADMIN_USER_EMAIL',  envPassword: 'E2E_ADMIN_USER_PASSWORD',  file: 'playwright/.clerk/admin.json' },
}

for (const [role, cfg] of Object.entries(roles)) {
  setup(`authenticate ${role}`, async ({ page }) => {
    const email = process.env[cfg.envEmail]
    const password = process.env[cfg.envPassword]
    if (!email || !password) {
      throw new Error(`Missing env: ${cfg.envEmail} / ${cfg.envPassword}`)
    }
    await page.goto('/sign-in')
    await clerk.signIn({
      page,
      signInParams: { strategy: 'password', identifier: email, password },
    })
    // Wait for landing page after sign-in to ensure session cookies are set
    await page.goto('/')
    await page.context().storageState({ path: path.join(__dirname, '..', cfg.file) })
  })
}
```
```typescript
// playwright.config.ts (additions, not full replacement)
projects: [
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
  // existing 'production-smoke' project unchanged
],
```
[CITED: clerk.com/docs/guides/development/testing/playwright/test-helpers; clerk.com/docs/guides/development/testing/playwright/test-authenticated-flows; github.com/clerk/clerk-playwright-nextjs]

### Anti-Patterns to Avoid
- **Don't `auth.protect({ role: 'demo' })`** — that's Clerk's *organization* role helper, not publicMetadata. Wrong system. [VERIFIED: clerk.com/docs/references/nextjs/clerk-middleware]
- **Don't read role on the client.** Per REQUIREMENTS.md "Out of Scope", client-side role checking for security is theater. The middleware + server utilities are the only enforcement points.
- **Don't store the whole publicMetadata object in the JWT** (`{"metadata": "{{user.public_metadata}}"}`). Bigger payload, more chance of exceeding Clerk's 1.2 KB custom-claim cap. Use a field-by-field template: `{"metadata": {"role": "{{user.public_metadata.role}}"}}`. [CITED: clerk.com/docs/guides/sessions/session-tokens]
- **Don't try to invalidate live sessions programmatically** in this phase — D-07 explicitly accepts sign-out/sign-in as the propagation method. Programmatic revocation via `clerkClient.sessions.revokeSession()` exists but is out of scope.
- **Don't put `setupClerkTestingToken()` in tests that use `clerk.signIn()`.** The docs explicitly say "`clerk.signIn()` internally uses `setupClerkTestingToken()`, so you don't need to call it separately." [VERIFIED: clerk.com/docs/guides/development/testing/playwright/test-helpers]
- **Don't import `Role` into `src/middleware.ts` after migration.** The type narrowing comes from `CustomJwtSessionClaims` automatically; explicit `Role` import would be unused.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reading role from JWT | Custom JWT decode | `(await auth()).sessionClaims` | Clerk already decodes and validates the session JWT inside `auth()`. Decoding manually means duplicating signature verification, key rotation handling, and v1/v2 token format detection. |
| Programmatic sign-in for E2E | Form-fill the sign-in page in every test | `clerk.signIn({ page, signInParams: { strategy: 'password', ... } })` | Form-fill is slow, brittle to UI changes, and trips bot detection on real Clerk dev instances. `clerk.signIn` injects a testing token that bypasses both. [CITED: clerk.com/docs/guides/development/testing/playwright/test-helpers] |
| "Persisted login" between tests | A custom storage shim | Playwright's `storageState` + Clerk's `storageState` save pattern | First-class Playwright feature, zero custom code. |
| Test user creation | Hand-rolled HTTP calls to Clerk Backend API | (Not in this phase — manual per D-13.) If ever scripted: `createClerkClient` from `@clerk/backend` | But D-13 keeps it manual; don't pre-build this. |
| Mocking `redirect()` in Jest | A spy that just records calls | The sentinel-throw pattern (see Pattern 3) | `redirect()` is documented to never return; a plain spy lets the function under test continue executing, masking bugs. The sentinel-throw pattern mirrors real behavior. [CITED: github.com/vercel/next.js/discussions/59061] |
| Role hierarchy / inheritance | Anything with "if admin then also demo" logic | Flat string comparison | REQUIREMENTS.md "Out of Scope: Nested role hierarchies". v1.5 is flat. |

**Key insight:** Every piece of role-related logic this phase needs is **already provided by Clerk's standard pattern**. The work is wiring the pieces, not designing the pieces.

## Runtime State Inventory

> Phase 27 is **not** a rename/refactor migration in the runtime-state sense — it's a feature delivery. But the JWT template change has runtime-state characteristics (existing user sessions become outdated), so worth documenting explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `publicMetadata.role` already exists on the three test users (set by Joel via Clerk Dashboard during this phase per D-12); no migration of stored records needed. | None — Dashboard is the write surface, not the repo. |
| Live service config | **Clerk Dashboard JWT template** — must be updated to add `{"metadata": {"role": "{{user.public_metadata.role}}"}}` (D-05). This config lives in the Clerk Dashboard UI, NOT in git. Reproducibility is via `docs/clerk-setup.md`. | Manual Dashboard step + documentation in `docs/clerk-setup.md`. |
| OS-registered state | None — no OS-level integrations. | None. |
| Secrets/env vars | Six new env var names: `E2E_{DEMO,NOROLE,ADMIN}_USER_{EMAIL,PASSWORD}`. New names, not renames — no read-side code yet exists, so no breakage. | Add to `.env.local` (gitignored) and document keys in `.env.example` (D-14). |
| Build artifacts | None — pure source change. | None. |

**Critical: live-session-cache state.** Any user with an active Clerk session at the moment the JWT template is changed in the Dashboard will continue to use their existing token (no `metadata.role` claim) until that token refreshes. Clerk session tokens refresh on a short cadence (~60 s, configurable in Dashboard), but the canonical Clerk recommendation for picking up new template fields is sign-out/sign-in. D-07 captures this; `docs/clerk-setup.md` must call it out. [CITED: clerk.com/docs/guides/secure/basic-rbac, "role changes require users to sign out and sign back in"]

## Common Pitfalls

### Pitfall 1: JWT template not active when tests run
**What goes wrong:** E2E tests sign in successfully but `sessionClaims.metadata.role` is `undefined`, so even the demo user gets redirected to `/`. The four scenarios collapse to two passing (norole + unauth → /) and two failing (demo).
**Why it happens:** JWT template is a Dashboard-managed setting; nothing in CI/repo enforces it. Easy to forget when setting up a new Clerk instance or after Dashboard changes.
**How to avoid:** Add a smoke assertion early in `global.setup.ts` — after signing in the demo user, hit `/demo/orders` and expect the page to load (not redirect). If it redirects, fail fast with a clear message about the JWT template.
**Warning signs:** All three roles get redirected to `/`. Demo user's session cookie decodes (via jwt.io) without a `metadata.role` claim.

### Pitfall 2: Existing user sessions outdated after template change
**What goes wrong:** Joel signs out the existing dev user, signs back in, and his role still doesn't propagate — because he updated `publicMetadata.role` on the user *after* the existing session was issued, and Clerk's session refresh interval hasn't elapsed.
**Why it happens:** Two-step state. Step 1: edit JWT template. Step 2: assign role in publicMetadata. The session token reflects both, but the cookie in the browser is the one issued at last sign-in.
**How to avoid:** Document the procedure in `docs/clerk-setup.md` strictly: (1) save JWT template, (2) for each test user, edit `publicMetadata.role`, (3) sign out and sign in. Any deviation from order causes confusion.
**Warning signs:** Decoded JWT cookie shows `metadata.role` is `null` despite Dashboard showing the value set.

### Pitfall 3: `clerk.signIn` called before page navigates
**What goes wrong:** `TypeError: Cannot read properties of undefined (reading 'signIn')` or similar — Clerk client isn't loaded yet.
**Why it happens:** `clerk.signIn` requires `window.Clerk` to be available, which requires the page to have hydrated a Clerk-aware route.
**How to avoid:** Always `await page.goto('/sign-in')` (or any non-public route after `ClerkProvider` mounts) before calling `clerk.signIn`. [VERIFIED: clerk.com/docs/guides/development/testing/playwright/test-helpers, "Before calling clerk.signIn(), you must call page.goto() and navigate to an unprotected page that loads Clerk."]
**Warning signs:** First-test-of-the-run failures; reruns sometimes pass because pages are warm.

### Pitfall 4: `@clerk/testing` requires dev-instance keys
**What goes wrong:** Tests fail with bot-detection errors or 401s; testing token isn't accepted.
**Why it happens:** Testing tokens only work against Clerk **development** instances. Production instances reject them.
**How to avoid:** Phase 27 is explicitly dev-only (per CONTEXT.md specifics: "Phase 27 E2E runs in dev environment only"). Make sure `.env.local` points to a `pk_test_...` / `sk_test_...` key pair, not `pk_live_...`.
**Warning signs:** `CLERK_PUBLISHABLE_KEY` starts with `pk_live_`. `clerkSetup()` fails or `clerk.signIn` returns an error mentioning bot detection.

### Pitfall 5: `next/navigation` `redirect()` swallowed in tests
**What goes wrong:** Test for `requireRole` "wrong role" case passes for the wrong reason — `redirect()` is mocked as a no-op spy, function under test continues, no error, test asserts on a spy call but doesn't catch state corruption.
**Why it happens:** `redirect()` in real code throws `NEXT_REDIRECT` internally; the calling function never returns. A plain `jest.fn()` mock doesn't replicate this.
**How to avoid:** Use the sentinel-throw pattern (Pattern 3 above). The test asserts via `.rejects.toMatchObject({ url: '/' })`, which mirrors real runtime behavior.
**Warning signs:** Tests pass even if you "accidentally" forget to call `redirect()` and execution continues.

### Pitfall 6: Parallel Playwright workers + `clerk.signIn` race condition
**What goes wrong:** Two workers simultaneously try to sign in the same user → one times out.
**Why it happens:** Known issue [VERIFIED: github.com/clerk/javascript/issues/7891 — "@clerk/testing: signIn() times out with concurrent Playwright workers"]. Clerk's session APIs aren't fully concurrency-safe for the same user.
**How to avoid:** Use storage-state pattern (Pattern 4) — sign in once per role in `global.setup.ts` (which runs serial), then run tests in parallel with cached cookies. This is also the documented best practice. If parallelism still hits limits, run different roles in different workers (Playwright projects naturally do this).
**Warning signs:** Flaky sign-in failures in CI but not locally; failures correlate with `workers > 1`.

### Pitfall 7: Updating `src/middleware.test.ts` mock without updating string assertions
**What goes wrong:** The current test file (`src/middleware.test.ts`) is a *file-content* test suite — it asserts the literal string `"clerkClient"` and `"publicMetadata"` exist in the source. After D-04 migration, those strings won't exist; the tests fail even though behavior is correct.
**Why it happens:** The existing tests are not behavior tests; they're source-code-shape tests. Easy to miss when re-reading the file.
**How to avoid:** Update the string-search assertions to look for `"sessionClaims"` and `"metadata"` instead of `"clerkClient"` and `"publicMetadata"`. Optionally, in the same edit, replace string assertions with actual behavior tests using the existing `jest.mock('@clerk/nextjs/server', ...)` at lines 2-5 — but that's a refactor beyond the phase's minimum.
**Warning signs:** `npm test` red after middleware change; failures are all string-contains assertions.

## Code Examples

See **Architecture Patterns** above. All examples are verified against:
- `clerk.com/docs/guides/secure/basic-rbac` (canonical RBAC pattern)
- `clerk.com/docs/guides/development/testing/playwright/test-helpers` (sign-in API)
- `github.com/clerk/clerk-playwright-nextjs` (canonical setup pattern, fetched via gh API)
- `github.com/vercel/next.js/discussions/59061` (redirect mock pattern)
- Existing `src/middleware.test.ts` (project's established mock style)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `clerkClient.users.getUser(userId).publicMetadata.role` per request | `(await auth()).sessionClaims?.metadata?.role` (session-claim-based) | Clerk's recommended pattern since v6+ (custom session token claims maturity); reinforced as canonical in v7. [CITED: clerk.com/docs/guides/secure/basic-rbac] | Eliminates per-request Clerk Backend API call. Saves ~80–200 ms on Edge runtime. Phase 25's success criterion #1 ("role data available in session token without additional network requests") is satisfied. |
| `auth()` sync (Clerk v5) | `await auth()` (Clerk v6+) | Clerk v6 release | Already adopted in `src/middleware.ts:23,30`. No change needed. |
| Per-test form-fill sign-in | `clerk.signIn` programmatic with testing token | `@clerk/testing` package (Clerk's official, stable since 2024) | Bypasses CAPTCHA, faster, no UI brittleness. |
| Session Token JWT v1 | Session Token JWT v2 (org claims nested under `o`) | Clerk released 2025-04-14 [CITED: clerk.com/changelog/2025-04-14-session-token-jwt-v2] | Does NOT affect this phase — our template uses `metadata.role`, not organization claims. v1 vs v2 transparent for our shape. |

**Deprecated/outdated:**
- Anything referencing `auth()` as synchronous (pre-v6 Clerk patterns in older blog posts). Project is on v7, always async.
- `auth.protect({ role: '…' })` for **publicMetadata** roles — this signature is for organization roles. Don't conflate.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@clerk/nextjs` | Middleware, utilities, runtime | ✓ | 7.3.3 | — |
| `@clerk/testing` | Playwright E2E | ✓ | 2.0.27 | — |
| `@playwright/test` | E2E test runner | ✓ | 1.59.1 | — |
| `jest` (+ `next/jest`) | Unit tests | ✓ | 30.3.0 | — |
| `next/navigation` (built-in) | `redirect()` in `requireRole` | ✓ | (Next.js 16.1.6) | — |
| Clerk dev-instance API keys (`pk_test_…`, `sk_test_…`) | `@clerk/testing` requires dev keys | Assumed ✓ (`.env.example:5` shows `pk_test_…` shape) | — | None — production keys won't work with testing tokens. |
| Three Clerk users with `publicMetadata.role` set in Dashboard | E2E scenarios 1–3 (D-11) | ✗ (per D-12, Joel creates manually during phase) | — | None — phase explicitly requires these to exist before E2E can run green. Plan must surface this as a manual prerequisite step. |
| JWT template configured in Clerk Dashboard | All session-claim reads (middleware + utilities + E2E) | ✗ (per D-05, manual Dashboard step) | — | None — same as above. |
| `docs/` directory | New `docs/clerk-setup.md` | Need to verify | — | Create dir if absent (mkdir-on-write). |

**Missing dependencies with no fallback:** Three real Clerk users + JWT template — both must be set up by Joel in Clerk Dashboard during the phase. The plan should structure this so unit tests + middleware refactor can complete green *before* the Dashboard work blocks E2E (i.e., E2E is the last wave).

**Missing dependencies with fallback:** None.

**Verification:** Run after the Dashboard configuration to confirm:
```bash
# Hit a /demo/* route as demo user, expect 200, check decoded cookie
# (manual UAT, D-15)
```

## Validation Architecture

> Phase config `nyquist_validation: true` and `tdd_mode: true` are both enabled in `.planning/config.json:24,28`. This section is REQUIRED.

### Test Framework
| Property | Value |
|----------|-------|
| Unit framework | Jest 30.3.0 with `next/jest` config (`jest.config.ts`) |
| Unit config file | `jest.config.ts` + `jest.setup.ts` (existing) |
| Unit quick run | `npm test -- src/lib/auth.test.ts src/middleware.test.ts` |
| Unit full suite | `npm test` |
| E2E framework | Playwright 1.59.1 |
| E2E config file | `playwright.config.ts` (existing, will be extended) |
| E2E single-spec run | `npx playwright test e2e/demo-route-protection.spec.ts` |
| E2E full suite | `npm run test:e2e` |
| Phase gate | All unit tests green + E2E `demo-route-protection.spec.ts` green + manual UAT (D-15) checklist complete |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACCESS-02 | `checkRole('demo')` returns true when sessionClaims.metadata.role === 'demo' | unit | `npm test -- src/lib/auth.test.ts -t "returns true when claim matches"` | ❌ Wave 0 — `src/lib/auth.ts` + `src/lib/auth.test.ts` need to be created (TDD: write test first per `tdd_mode: true`) |
| ACCESS-02 | `checkRole(role)` returns false on mismatch | unit | `npm test -- src/lib/auth.test.ts -t "returns false when claim does not match"` | ❌ Wave 0 |
| ACCESS-02 | `checkRole(role)` returns false when sessionClaims undefined | unit | `npm test -- src/lib/auth.test.ts -t "returns false when sessionClaims is undefined"` | ❌ Wave 0 |
| ACCESS-02 | `checkRole(role)` returns false when metadata.role missing | unit | `npm test -- src/lib/auth.test.ts -t "returns false when metadata.role is missing"` | ❌ Wave 0 |
| ACCESS-02 | `checkRole(role)` returns false on unauthenticated session | unit | `npm test -- src/lib/auth.test.ts -t "returns false when userId is null"` | ❌ Wave 0 |
| ACCESS-02 | `requireRole(role)` redirects to /sign-in when userId missing | unit | `npm test -- src/lib/auth.test.ts -t "redirects to /sign-in when userId is missing"` | ❌ Wave 0 |
| ACCESS-02 | `requireRole(role)` redirects to / when role mismatched | unit | `npm test -- src/lib/auth.test.ts -t "redirects to / when role does not match"` | ❌ Wave 0 |
| ACCESS-02 | `requireRole(role)` resolves silently when role matches | unit | `npm test -- src/lib/auth.test.ts -t "resolves without throwing when role matches"` | ❌ Wave 0 |
| ACCESS-02 (D-09) | Middleware references sessionClaims, not clerkClient | unit | `npm test -- src/middleware.test.ts` | ⚠️ Exists but assertions need updating (drop `clerkClient`/`publicMetadata` string checks, add `sessionClaims`/`metadata` string checks) |
| ACCESS-01 regression (D-11 #4) | Unauthenticated user → `/demo/*` redirects to `/sign-in` | E2E | `npx playwright test e2e/demo-route-protection.spec.ts -g "unauthenticated"` | ✅ Already passing (PROT-03 block in existing file) |
| ACCESS-02 + ACCESS-01 (D-11 #1) | Demo user accesses `/demo/orders`, `/demo/customers`, `/demo/mill-production` successfully | E2E | `npx playwright test e2e/demo-route-protection.spec.ts -g "demo user accesses"` --project=demo-user | ❌ Wave 0 — new test cases needed |
| ACCESS-02 + ACCESS-01 (D-11 #2) | Non-demo user redirected to `/` when accessing `/demo/*` | E2E | `npx playwright test e2e/demo-route-protection.spec.ts -g "non-demo user is redirected"` --project=norole-user | ⚠️ Skipped test exists at `e2e/demo-route-protection.spec.ts:32` — needs unskip + auth fixture (D-10) |
| ACCESS-02 (D-11 #3) | All authenticated users can access `/settings` regardless of role | E2E | `npx playwright test e2e/demo-route-protection.spec.ts -g "settings"` | ❌ Wave 0 — new test cases (run under both `demo-user` and `norole-user` projects) |
| ACCESS-02 (D-15) | UAT: visual confirmation of each role across `/demo/*` and `/settings` | manual | n/a — recorded in `27-VERIFICATION.md` checklist | ❌ Wave 0 — checklist authored by planner |

### TDD Eligibility (per `tdd_mode: true`)

| Item | TDD Eligible? | Rationale |
|------|---------------|-----------|
| `src/lib/auth.ts` (`checkRole`, `requireRole`) | **YES** (canonical) | Pure I/O contract, deterministic given mocked `auth()`. Eight clear test cases enumerated above. Write tests first → watch them go red → implement → watch them go green. |
| `src/middleware.ts` refactor | Partial | Existing tests are string-search assertions, not behavior tests. The cleanest TDD play: update the string assertions to expect `"sessionClaims"`/`"metadata"` strings BEFORE editing middleware.ts — tests go red, then edit middleware.ts → tests go green. |
| Playwright E2E (D-11 scenarios 1–3) | NO (integration) | Depends on real Clerk users + active JWT template; not a unit-level TDD seam. Standard write-spec-then-make-it-pass cadence applies, but not "RED/GREEN/REFACTOR" in the unit sense. |
| `docs/clerk-setup.md` | NO | Documentation; no executable contract. |

### Sampling Rate
- **Per task commit:** `npm test -- <changed test file>` (single file, < 5 s)
- **Per wave merge:** `npm test` (full unit suite, includes auth + middleware tests; current baseline 304 tests passing per STATE.md:50)
- **Per E2E task commit:** `npx playwright test e2e/demo-route-protection.spec.ts` (~20 s expected)
- **Phase gate:** `npm test && npm run test:e2e` both green + D-15 manual UAT checklist signed off, before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/auth.ts` — implementation file (created during TDD GREEN step)
- [ ] `src/lib/auth.test.ts` — unit test file (created during TDD RED step, 8 test cases above)
- [ ] `src/middleware.test.ts` — update string-search assertions (sessionClaims/metadata instead of clerkClient/publicMetadata)
- [ ] `e2e/global.setup.ts` — Playwright global setup for clerkSetup + per-role sign-in
- [ ] `e2e/fixtures/auth.ts` (optional helper, if planner prefers a fixture over storageState-only) — wrapper for role-based test contexts
- [ ] `playwright.config.ts` — add `global setup` project + `demo-user` + `norole-user` projects with storageState
- [ ] `e2e/demo-route-protection.spec.ts` — unskip line 32 + add demo-user + settings access scenarios
- [ ] `docs/clerk-setup.md` — Dashboard runbook (JWT template JSON, test user emails, role assignment steps, sign-out/sign-in note, dev-vs-prod note from D-15)
- [ ] `.env.example` — add 6 new lines for E2E credentials (3 email + 3 password)
- [ ] `27-VERIFICATION.md` (or PLAN.md acceptance block) — manual UAT checklist (D-15)

*(Existing test infrastructure — jest config, playwright config, test directories — all in place. No framework install needed.)*

### Validation Coverage Claim

Phase delivery satisfies ACCESS-02 when:
1. All 8 `src/lib/auth.test.ts` unit cases green.
2. Updated `src/middleware.test.ts` string assertions green (assertions match the new sessionClaims-based source).
3. All 4 D-11 E2E scenarios green under their respective Playwright projects (`demo-user`, `norole-user`, default for unauthenticated).
4. D-15 manual UAT signed off (cannot be automated due to acknowledged Clerk 2FA constraint on production).
5. JWT template active in Clerk Dashboard (verified by E2E #1 passing — if template were missing, demo user would be redirected).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Joel's existing `.env.local` uses `pk_test_…` / `sk_test_…` (dev instance) keys, not prod | Environment Availability, Pitfall 4 | If using prod keys, `@clerk/testing` will reject testing tokens. E2E can't run. Plan should add an explicit env-shape check early. |
| A2 | The `docs/` directory does not exist yet (need verification at plan time) | Recommended Project Structure | Minor — if absent, plan adds `mkdir -p docs` to the relevant task. |
| A3 | Clerk session refresh interval is configured at default (~60 s) on this instance | Pitfall 2, Runtime State Inventory | Higher: if refresh interval is set very long, sign-out/sign-in might still not propagate quickly. Manual UAT (D-15) catches this. |

**These three assumptions should be confirmed during planning** (A1, A2 in particular — trivial to check) and surfaced as Pre-flight checks in the PLAN.md.

## Open Questions

1. **Should `e2e/fixtures/auth.ts` be a separate file, or is the per-project `storageState` config in `playwright.config.ts` sufficient?**
   - What we know: Per-project storageState (Pattern 4) is the canonical Clerk pattern and requires no fixture file.
   - What's unclear: Whether the planner wants a fixture wrapper for ergonomic per-test reasons (e.g., one `test.use({ storageState })` repeated in many files in the future).
   - Recommendation: Start with per-project storageState only (no `fixtures/auth.ts`). If a future phase needs role-switching mid-test or per-test role overrides, introduce a fixture then.

2. **Does Joel want to use Clerk's `+clerk_test` email pattern for the three test users (per `e2e/production-smoke.spec.ts` precedent), or real-looking emails like `e2e-demo@…`?**
   - What we know: D-12 specifies `e2e-demo@…`, `e2e-norole@…`, `e2e-admin@…` — pattern with role prefix.
   - What's unclear: Whether the `@` domain matters. `+clerk_test` is Clerk's special pattern that prevents actual email delivery during verification flows.
   - Recommendation: Suggest `e2e-demo+clerk_test@…` (combines D-12 prefix with Clerk's safe-mailbox marker). Surface as a question in plan-check, but not a blocker.

3. **Should `requireRole('admin')` be exercised in any unit test, given v1.5 has no admin-only feature?**
   - What we know: D-12 mentions admin user exists "for completeness" but D-11 scenarios only cover demo/norole.
   - What's unclear: Whether a unit test asserting `requireRole('admin')` redirects correctly counts as ACCESS-02 coverage or premature.
   - Recommendation: Use admin in unit-test parameterization (since it adds no runtime cost) but don't add E2E scenarios for admin. The pattern is generic — proving it works for one role proves it for all.

## Sources

### Primary (HIGH confidence)
- [Clerk Docs — Basic RBAC](https://clerk.com/docs/guides/secure/basic-rbac) — canonical RBAC pattern, JWT template, `checkRole` utility, sign-out/sign-in caveat
- [Clerk Docs — Playwright Test Helpers](https://clerk.com/docs/guides/development/testing/playwright/test-helpers) — `clerk.signIn` signature, `signInParams` password strategy, `setupClerkTestingToken` integration
- [Clerk Docs — Playwright Test Authenticated Flows](https://clerk.com/docs/guides/development/testing/playwright/test-authenticated-flows) — global-setup pattern, storage state, fixture approaches
- [Clerk Docs — Playwright Overview](https://clerk.com/docs/testing/playwright/overview) — `clerkSetup`, environment variables, dev-instance requirement
- [Clerk Docs — Customize Session Tokens](https://clerk.com/docs/guides/sessions/customize-session-tokens) — Dashboard UI path, 1.2 KB size limit
- [Clerk Docs — Session Tokens](https://clerk.com/docs/guides/sessions/session-tokens) — publicMetadata + custom claims, size guidance ("don't store entire public_metadata object")
- [GitHub — clerk/clerk-playwright-nextjs](https://github.com/clerk/clerk-playwright-nextjs) — canonical `global.setup.ts` and `playwright.config.ts` (fetched directly via gh API)
- Local: `src/middleware.ts`, `src/middleware.test.ts`, `src/types/clerk.d.ts`, `e2e/demo-route-protection.spec.ts`, `playwright.config.ts`, `package.json` — verified existing implementation state
- npm registry: `npm view @clerk/testing version` → 2.0.27 (verified 2026-05-11)

### Secondary (MEDIUM confidence)
- [Vercel — Next.js Discussions #59061](https://github.com/vercel/next.js/discussions/59061) — `redirect()` mock pattern with sentinel-throw; community-confirmed approach
- [Clerk — Session Token JWT v2 changelog](https://clerk.com/changelog/2025-04-14-session-token-jwt-v2) — confirms v2 token format doesn't affect our claim shape (only nests org claims)
- [GitHub — clerk/javascript issue #7891](https://github.com/clerk/javascript/issues/7891) — known `clerk.signIn` concurrency limitation; mitigation = storage state

### Tertiary (LOW confidence)
- *(None — all critical claims verified against official docs or codebase.)*

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries installed and verified, versions checked against npm registry
- Architecture: HIGH — pattern is canonical Clerk RBAC, official docs match CONTEXT.md decisions exactly
- Pitfalls: HIGH — drawn from official docs (size limit, dev-instance requirement, page-loaded requirement, sign-out/sign-in caveat) plus a confirmed GitHub issue for the concurrency landmine
- Validation Architecture: HIGH — test file paths, frameworks, and project config all confirmed against repo state

**Research date:** 2026-05-11
**Valid until:** 2026-06-10 (30 days — Clerk's testing API has been stable since 2024, RBAC pattern is canonical; no near-term API churn expected)
