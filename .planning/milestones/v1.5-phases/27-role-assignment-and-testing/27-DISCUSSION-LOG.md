# Phase 27: Role Assignment and Testing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 27-Role Assignment and Testing
**Areas discussed:** Utility function API, Session claims vs API lookup, Testing strategy, Role assignment scope

---

## Utility function API

### Q1: Where should the role utility functions live?

| Option | Description | Selected |
|--------|-------------|----------|
| `src/lib/auth.ts` | Auth-focused module name; room for future auth helpers | ✓ |
| `src/lib/roles.ts` | Role-specific module name; tightly scoped | |
| `src/lib/clerk.ts` | Groups with future Clerk-specific helpers | |

**User's choice:** `src/lib/auth.ts`

### Q2: What should checkRole(role) return and how should it read the role?

| Option | Description | Selected |
|--------|-------------|----------|
| Async boolean from session claims | `Promise<boolean>`; reads `auth().sessionClaims.metadata.role`; no network call | ✓ |
| Async boolean from `clerkClient.getUser()` | Fetches user record per call (current middleware pattern) | |
| Sync boolean accepting User param | `checkRole(user, role): boolean`; caller fetches user | |

**User's choice:** Async boolean from session claims

### Q3: What should requireRole(role) do when the role check fails?

| Option | Description | Selected |
|--------|-------------|----------|
| `redirect()` to root via `next/navigation` | Cancels rendering and sends to `/`; mirrors middleware D-01 P25 | ✓ |
| Throw a typed RoleError | Caller decides handling; more flexible but verbose | |
| Call `notFound()` to render 404 | Hides resource existence; inconsistent with middleware | |

**User's choice:** `redirect()` to root via `next/navigation`

### Q4: Should requireRole() also handle the unauthenticated case (no userId)?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — also redirect to `/sign-in` if no `userId` | One-call guard for server components | ✓ |
| No — assume middleware already enforced auth | Simpler; relies on middleware contract | |
| Throw if unauthenticated, redirect if wrong role | Treats unauth as programmer error | |

**User's choice:** Yes — also redirect to `/sign-in`

---

## Session claims vs API lookup

### Q1: How to resolve the network-call vs session-claims discrepancy?

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate to session claims now | Configure JWT template, update middleware; closes Phase 25 gap | ✓ |
| Keep `clerkClient.getUser()` pattern | Simpler but slower and leaves Phase 25 criterion unmet | |
| Hybrid — utilities use claims, middleware unchanged | Inconsistent data source | |

**User's choice:** Migrate to session claims now

### Q2: How should the plan capture the manual Clerk Dashboard JWT step?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual step with checklist + `docs/clerk-setup.md` | Reproducible; documents exact JSON | ✓ |
| Manual step, no separate doc | Lighter weight but harder to onboard | |
| Try Clerk Backend API automation | May not be supported; adds keys/scripts | |

**User's choice:** Manual step with checklist + `docs/clerk-setup.md`

### Q3: Remove clerkClient usage from middleware once session claims are wired?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — remove `clerkClient` usage | Slim middleware; no network calls | ✓ |
| Keep clerkClient as fallback | Belt-and-suspenders for missing claims | |
| Keep clerkClient call commented out | Anti-pattern; git history is the record | |

**User's choice:** Yes — remove `clerkClient` usage

### Q4: How to handle existing user sessions after the JWT change?

| Option | Description | Selected |
|--------|-------------|----------|
| Document sign-out / sign-in in deployment notes | No code burden; manual re-sign-in resolves | ✓ |
| Force session revocation programmatically | Heavier; forces every user to re-auth | |
| Add runtime check + force re-auth if claim missing | Defensive; adds complexity for one-time event | |

**User's choice:** Document sign-out / sign-in in deployment notes

---

## Testing strategy

### Q1: What level of coverage for the new role utilities?

| Option | Description | Selected |
|--------|-------------|----------|
| Unit tests with mocked `auth()` | Same pattern as `src/middleware.test.ts` | ✓ |
| Unit + thin integration test | Heavier; may need fixtures | |
| Skip unit tests — verify via E2E only | Inconsistent with 304-test codebase | |

**User's choice:** Unit tests with mocked `auth()`

### Q2: What to do with the `.skip()`'d E2E test in `e2e/demo-route-protection.spec.ts`?

| Option | Description | Selected |
|--------|-------------|----------|
| Unskip with Playwright auth fixture | Closes a real coverage gap | ✓ |
| Keep `.skip()`'d, add a blocker comment | Test debt acknowledged but unaddressed | |
| Delete the skipped test entirely | Loses the E2E intent | |

**User's choice:** Unskip with Playwright auth fixture

### Q3: Playwright auth fixture mechanism?

| Option | Description | Selected |
|--------|-------------|----------|
| Clerk testing tokens via `@clerk/testing` | Clerk's official Playwright integration; bypasses CAPTCHA/2FA | ✓ |
| Programmatic sign-in via UI flow + `storageState` | Brittle if Clerk's UI changes | |
| Stub Clerk entirely in test env | Decouples from Clerk but tests less | |

**User's choice:** Clerk testing tokens via `@clerk/testing`

### Q4: Which E2E scenarios to cover? (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| Demo user accesses `/demo/*` successfully | Positive path | ✓ |
| Non-demo user redirected to `/` | Negative path (unskips existing test) | ✓ |
| All users access `/settings` | Success criterion #4 | ✓ |
| Unauthenticated `/demo/*` still redirects to sign-in | Regression guard (existing test) | ✓ |

**User's choice:** All four scenarios

---

## Role assignment scope

### Q1: How many real user accounts assigned roles during this phase?

| Option | Description | Selected |
|--------|-------------|----------|
| Two test users (demo + no-role) | Enough for both E2E paths | |
| Three test users (demo, no-role, admin) | Plus admin for completeness | ✓ |
| Just your account (demo) | Limited E2E coverage | |

**User's choice:** Three test users (demo, no-role, admin)
**Notes:** Admin role won't have testable behavior in v1.5 but is included for future milestones.

### Q2: Where should test user credentials live?

| Option | Description | Selected |
|--------|-------------|----------|
| Env vars in `.env.local` + `.env.example` | Standard gitignored pattern | ✓ |
| Dedicated `playwright.env` file | Cleaner separation, more files | |
| Hardcoded test fixtures in test files | Commits secrets; anti-pattern | |

**User's choice:** Env vars in `.env.local` + `.env.example`

### Q3: Who creates the test users and how does the plan capture it?

| Option | Description | Selected |
|--------|-------------|----------|
| Joel creates manually, plan documents emails | Phase ships with `docs/clerk-setup.md` containing email patterns and assignments | ✓ |
| Script via Clerk Backend API | Reproducible but adds code + secrets | |
| Plan stays abstract — emails ad hoc | Less prescriptive; no single source of truth | |

**User's choice:** Joel creates manually + plan documents emails

### Q4: Manual verification approach before marking the phase complete?

| Option | Description | Selected |
|--------|-------------|----------|
| UAT checklist in phase verification | Captures felt experience | ✓ |
| Rely on E2E suite only | Faster but misses redirect flicker, timing | |
| Both — E2E + brief manual smoke | Belt and suspenders | |

**User's choice:** UAT checklist in phase verification

---

## Claude's Discretion

None — every selected area was explicitly decided by the user.

## Deferred Ideas

- Automatic role assignment on sign-up (ROLE-04) — stays deferred per REQUIREMENTS.md
- Admin role behavior — admin user exists for testing surface but no admin-only features in v1.5
- Programmatic test-user seeding script — defer until test-user churn justifies it
- Production E2E with real auth — still blocked by Clerk 2FA (carried from v1.4)
