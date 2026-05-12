---
phase: 28
plan: 01
subsystem: testing
tags:
  - security
  - testing
  - clerk
  - rsc
  - fixture
dependency_graph:
  requires:
    - src/lib/auth.ts
    - src/lib/auth.test.ts
    - src/types/clerk.d.ts
  provides:
    - src/test/fixtures/clerkAuth.ts (reusable Clerk auth + next/navigation mock harness for async-RSC page tests)
  affects:
    - .planning/phases/28-client-component-security-audit/28-02-PLAN.md (consumer)
    - .planning/phases/28-client-component-security-audit/28-03-PLAN.md (consumer)
    - .planning/phases/28-client-component-security-audit/28-04-PLAN.md (consumer)
    - .planning/phases/28-client-component-security-audit/28-05-PLAN.md (consumer)
tech_stack:
  added: []
  patterns:
    - jest-mock-factory-closure (deferred-invocation auth proxy: { auth: () => mockAuth() })
    - redirect-sentinel-throw (Object.assign(new Error('NEXT_REDIRECT'), { url }))
    - not-found-sentinel-throw (Object.assign(new Error('NEXT_NOT_FOUND'), {}))
    - mock-factory-import-pattern (factories exported from fixture module so jest.mock(...) callsite is hoisted with the import per Jest's hoisting rules)
key_files:
  created:
    - src/test/fixtures/clerkAuth.ts
    - src/test/fixtures/clerkAuth.test.ts
  modified: []
decisions:
  - "Expose factories (not pre-installed mocks): consumers call jest.mock('@clerk/nextjs/server', () => clerkAuthMockFactory()) themselves. This is forced by Jest's hoisting rule — a fixture cannot call jest.mock on a consumer's behalf — but it also has the benefit that page tests retain explicit, locally-visible mock setup at the top of every file."
  - "next/navigation factory bundles all dashboard-relevant navigation hooks (redirect, notFound, usePathname, useRouter, useSearchParams) with safe defaults. Rationale: every consumer page test renders DashboardLayout / Header / OrdersTable client children that call these hooks; without placeholders the tests crash before reaching the assertion."
  - "mockNonDemoSession(role: Exclude<Role, 'demo'> = 'user'): tightened the param type to exclude 'demo' so a type error catches mis-uses where a caller passes 'demo' to the 'non-demo' helper (catches the most likely bug at compile time, not runtime)."
  - "D-04 boundary preserved: fixture stubs only the inner page-level requireRole. Production middleware ACCESS-01 demo-role enforcement remains untouched; Phase 27 Playwright covers the full real-Clerk chain. Threat T-28-01-02 documented as 'accept' in plan threat model."
metrics:
  duration: ~12 minutes
  completed_date: "2026-05-11"
  tasks_completed: 2
  files_created: 2
  tests_added: 7
  tests_passing: 7
---

# Phase 28 Plan 01: Clerk Auth Test Fixture Summary

**One-liner:** Reusable Clerk auth + next/navigation mock fixture (factory exports + session helpers) that 28-02..28-05 page tests will import instead of redeclaring the 15-line mock block per file.

## Tasks Executed

| # | Task                                            | Type | Commit    | Files                                 |
| - | ----------------------------------------------- | ---- | --------- | ------------------------------------- |
| 1 | Write failing fixture-contract test (RED)       | TDD  | `4560624` | `src/test/fixtures/clerkAuth.test.ts` |
| 2 | Implement the clerkAuth fixture (GREEN)         | TDD  | `ca1b998` | `src/test/fixtures/clerkAuth.ts`      |

RED → GREEN gate sequence confirmed: commit `4560624` failed with `Cannot find module './clerkAuth'`; commit `ca1b998` lands the implementation and `npm test -- --runInBand src/test/fixtures/clerkAuth.test.ts` reports `Tests: 7 passed, 7 total`.

## Fixture API Shape

`src/test/fixtures/clerkAuth.ts` exports six symbols:

| Export                          | Kind           | Purpose                                                                                                                                                          |
| ------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mockAuth`                      | `jest.fn()`    | The single mock the factory closes over. Tests call `mockAuth.mockReset()` in `beforeEach`; helpers call `mockAuth.mockResolvedValue(...)`.                      |
| `clerkAuthMockFactory()`        | factory        | Returns `{ auth: () => mockAuth() }`. **Deferred invocation** — `auth` is a function so per-test `mockResolvedValue` calls take effect.                          |
| `nextNavigationMockFactory()`   | factory        | Returns `{ redirect, notFound, usePathname, useRouter, useSearchParams }`. `redirect` and `notFound` throw sentinel-shaped Errors; the hooks are `jest.fn()`s.   |
| `mockDemoSession()`             | helper         | Wires `mockAuth` to resolve with `{ userId: 'u1', sessionClaims: { metadata: { role: 'demo' } } }`.                                                              |
| `mockNonDemoSession(role?)`     | helper         | Wires `mockAuth` to resolve with the given non-demo `Role` (default `'user'`). Type is `Exclude<Role, 'demo'>` to prevent mis-use at compile time.               |
| `mockUnauthenticatedSession()`  | helper         | Wires `mockAuth` to resolve with `{ userId: null, sessionClaims: null }`.                                                                                        |

## Consumer Pattern (for plans 28-02 → 28-05)

```typescript
// At the top of src/app/demo/<route>/page.test.tsx:
import {
  clerkAuthMockFactory,
  nextNavigationMockFactory,
  mockAuth,
  mockDemoSession,
  mockNonDemoSession,
  mockUnauthenticatedSession,
} from '@/test/fixtures/clerkAuth';

jest.mock('@clerk/nextjs/server', () => clerkAuthMockFactory());
jest.mock('next/navigation', () => nextNavigationMockFactory());

// Now safe to import the page under test and any client children:
import Page from '../page';

beforeEach(() => {
  mockAuth.mockReset();
});

it('redirects unauthenticated visitors to /sign-in', async () => {
  mockUnauthenticatedSession();
  await expect(Page()).rejects.toMatchObject({ url: '/sign-in' });
});

it('redirects non-demo users to /', async () => {
  mockNonDemoSession();
  await expect(Page()).rejects.toMatchObject({ url: '/' });
});

it('renders the page for demo users', async () => {
  mockDemoSession();
  const rendered = await Page();
  render(rendered);
  expect(screen.getByText(/.../i)).toBeInTheDocument();
});
```

This is the **single canonical pattern** for the four `/demo/*` page tests in 28-02..28-05. No copy-paste of jest.mock blocks across files.

## Why Factory-Import Works Under Jest Hoisting

Jest hoists `jest.mock(...)` calls to the top of the module, above ESM `import` statements. Naively, that would make `clerkAuthMockFactory` unreachable from the factory arg. But Jest's hoister treats the named imports it tracks as available to mock factories — the import + the mock call rise together. The contract test in `src/test/fixtures/clerkAuth.test.ts` proves this works in practice (test 7 calls `auth()` from the mocked `@clerk/nextjs/server` and confirms it returns whatever `mockAuth.mockResolvedValue(...)` set).

The two factory functions are exported as **functions** (not pre-built objects) so the `jest.fn()` placeholders inside `nextNavigationMockFactory` are constructed fresh per `jest.mock(...)` callsite — avoiding cross-test pollution between files.

## Deviations from Plan

### Minor adjustments

**1. [Plan-driven] Type-narrowed `mockNonDemoSession(role)` to `Exclude<Role, 'demo'>`**
- **Plan said:** `mockNonDemoSession(role: Role = 'user')`
- **Implemented:** `mockNonDemoSession(role: Exclude<Role, 'demo'> = 'user')`
- **Reason:** The helper's name and purpose is to seed a **non-demo** session; passing `'demo'` would be a caller error (use `mockDemoSession()` for that). Excluding `'demo'` at the type level catches this at compile time. Behavior under the contract tests is identical — test 2 passes default `'user'`, test 3 passes `'admin'` — and downstream consumers (28-02..28-05) only ever pass `'user'` or `'admin'` per the page-test requirements.

**2. [Plan-driven] Moved `notFound` mock into `nextNavigationMockFactory`**
- **Plan said:** Include `notFound: jest.fn(() => { throw Object.assign(new Error('NEXT_NOT_FOUND'), {}); })` in `nextNavigationMockFactory`.
- **Implemented:** Implemented exactly as specified. (Listed here only because the `notFound` sentinel-throw is a useful detail for the downstream `customers/[id]/page.test.tsx` migration in 28-04, which exercises the 404 path.)

**3. [Plan-driven] Test placement of `jest.mock` relative to import**
- **Plan said:** "Place `jest.mock(...)` calls at the top BEFORE any non-mock imports, using `import { ... } from './clerkAuth'`."
- **Implemented:** The import of the factories from `./clerkAuth` is the only import above the two `jest.mock(...)` calls; all other imports (`auth`, `redirect`, helper functions) sit below the `jest.mock` calls. This is the exact ordering 28-02..28-05 must use.

No surprises encountered. No threat-model adjustments needed. No CLAUDE.md to honor (file does not exist).

### Auto-fixed Issues

**None.** Plan executed exactly as written; both tasks reached their done criteria on the first pass.

## Auth Gates Encountered

**None.** Unit-test fixture; no live auth touched.

## Verification Results

| Check                                                                                                | Result                              |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `npm test -- --runInBand src/test/fixtures/clerkAuth.test.ts`                                        | `Tests: 7 passed, 7 total`          |
| `grep -c "it(" src/test/fixtures/clerkAuth.test.ts`                                                  | `7`                                 |
| `grep -c "^export" src/test/fixtures/clerkAuth.ts`                                                   | `6` (≥ 6 required)                  |
| `grep "NEXT_REDIRECT" src/test/fixtures/clerkAuth.ts`                                                | matches found (sentinel + JSDoc)    |
| `grep -r "from '@/test/fixtures/clerkAuth'" src/app/ src/components/ src/lib/`                       | `0` lines (no production leak)      |
| `npx tsc --noEmit` errors specific to `clerkAuth.ts` / `clerkAuth.test.ts`                           | `0`                                 |
| Commit history shows RED → GREEN sequence                                                            | `test(...)` `4560624` → `feat(...)` `ca1b998` |

### Pre-existing TS errors (out of scope per Scope Boundary)

`npx tsc --noEmit` reports errors in `src/__tests__/design-system/theme.test.tsx` (possibly-null `capturedProps`) and `src/__tests__/design-system/tokens.test.ts` (regex flag targeting). These predate this plan and are unrelated to the new fixture files — Scope Boundary rule applies (only auto-fix issues directly caused by this task's changes). Logged for awareness only.

## TDD Gate Compliance

- **RED gate:** `test(28-01): add failing fixture-contract test for clerk auth harness` at `4560624` — the test suite failed to run (`Cannot find module './clerkAuth'`), proving the fixture did not yet exist.
- **GREEN gate:** `feat(28-01): implement reusable clerk auth test fixture` at `ca1b998` — `Tests: 7 passed, 7 total`.
- **REFACTOR gate:** not needed; the implementation went green on first pass and the API surface is minimal.

## Known Stubs

**None.** This is a test fixture module; the `jest.fn()` placeholders in `nextNavigationMockFactory` are intentional (they're mock implementations, not production stubs). They are exercised correctly by the contract tests.

## Self-Check: PASSED

- `src/test/fixtures/clerkAuth.ts` — FOUND
- `src/test/fixtures/clerkAuth.test.ts` — FOUND
- Commit `4560624` (test) — FOUND in `git log --oneline -3`
- Commit `ca1b998` (feat) — FOUND in `git log --oneline -3`
- 7/7 tests passing under `npm test -- --runInBand src/test/fixtures/clerkAuth.test.ts`
- No production-code imports of the fixture (`grep -r ... | wc -l` returns `0`)
- TypeScript clean on the two new files (`npx tsc --noEmit` zero new errors)
