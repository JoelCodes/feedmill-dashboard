# Phase 29: ROUTE-01 Cleanup — Research

**Researched:** 2026-05-12
**Domain:** Next.js / React cleanup — href fix, dead-code deletion, E2E spec updates, test-pipeline unblocking
**Confidence:** HIGH (all key questions answered from live codebase inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scope (which audit items are in)**
- D-01: All 5 ROUTE-01-related audit items in scope: INT-01 (blocker), INT-02, INT-04, INT-05, INT-06.
- D-02: INT-03 (checkRole orphan) also in scope — no near-term production consumer.
- D-03: Test-pipeline tech debt also in scope: jest e2e ignore, 21 fixture tsc errors, PLAYWRIGHT_BASE_URL leak, Tailwind @source exclusion.
- D-04: 14 pre-existing failing /settings tests are DEFERRED to follow-up phase (ClerkProvider wrapper rework).

**INT-01 Timeline.tsx href fix + regression test**
- D-05: Change Timeline.tsx:123 href from `/orders?selected=${event.orderId}` to `/demo/orders?selected=${event.orderId}`. One-line fix.
- D-06: Add Jest component test on Timeline.tsx asserting order-event Link href matches `/demo/orders?selected=*`. No Playwright E2E for this.

**INT-02 /settings → DashboardLayout**
- D-07: Replace inline `<div className="bg-bg-page flex h-screen"><Sidebar /><main …><Header />{children}</main></div>` in `src/app/settings/page.tsx` with `<DashboardLayout>…</DashboardLayout>`. Drop unused direct Sidebar and Header imports.
- D-08: Layout swap only — do NOT touch `src/app/settings/__tests__/page.test.tsx`. Its 14 failing tests are pre-existing on baseline.

**INT-04 + INT-05 stale E2E specs**
- D-09: DELETE `e2e/production-smoke.spec.ts` entirely.
- D-10: UPDATE `e2e/route-protection.spec.ts` — repoint `protectedRoutes` constant from `['/orders', '/customers', '/mill-production', '/settings']` to `['/demo/orders', '/demo/customers', '/demo/mill-production', '/settings']`. Matches Phase 26 D-01 (clean-break, no 308 redirects).

**INT-06 Header.tsx dead branches**
- D-11: DELETE outright the 3 legacy lines in `src/components/Header.tsx::getPageTitle` (lines 33–36): the `/orders`, `/mill-production`, `/customers` startsWith branches and the `// Legacy routes (404 fallback)` comment. Any unknown path falls through to `return 'Dashboard';`.

**INT-03 checkRole removal**
- D-12: Delete `checkRole` export from `src/lib/auth.ts`. Delete the 8 `checkRole` unit tests from the corresponding test file.
- D-13: Update `.planning/REQUIREMENTS.md` ACCESS-02 description to reference `requireRole` only (drop `checkRole`). Keep `[x]` Complete status.

**Test pipeline tech debt**
- D-14: Add `testPathIgnorePatterns: ['<rootDir>/e2e/']` (or equivalent) to `jest.config.ts`.
- D-15: Fix the 21 tsc errors in test fixtures: drifted `customerId` and `activeBins` mock-data fields, and the regex `es2018` flag issue. Touch fixture files only.
- D-16: Stop `.env.local`'s `PLAYWRIGHT_BASE_URL` from leaking to `demo-user` and `norole-user` Playwright projects. Fix in `playwright.config.ts` project config (project-level env override, not global).
- D-17: Tighten Tailwind v4 `@source not "../../.planning"` so `.planning/**/*.md` is recursively excluded.

### Claude's Discretion
- Commit granularity — Atomic commits per logical concern (expect ~7–9 commits).
- Verification depth — Planner decides which existing tests to re-run vs which need new tests. Mandatory new test: D-06 Timeline href component test.
- File/line numbers — All line references accurate as of commit `5eb6b3a`. Re-grep before applying if drift suspected.

### Deferred Ideas (OUT OF SCOPE)
- Fix the 14 pre-existing failing /settings page tests (need ClerkProvider test wrapper rework — Phase 30).
- Replace Header.tsx hardcoded getPageTitle switch with route metadata pattern.
- Re-add checkRole when a production feature needs it.
- Add integration check for "all Link/href strings in src/**/*.tsx resolve to existing routes".
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROUTE-01 | Existing pages (orders, customers, mill-production) moved to `/demo/*` subdirectory | D-05 (Timeline href), D-10 (E2E paths), D-11 (Header dead branches) are the remaining ROUTE-01 cleanup items |
| NAV-02 | DashboardLayout component wraps all pages, eliminating layout duplication | D-07 (/settings is the last holdout; DashboardLayout is `children`-only interface) |
| ACCESS-02 | Role utility functions available for server components | D-12 (checkRole removal), D-13 (REQUIREMENTS.md text update) closes the "dangling export" audit gap |

**Note:** No new REQ-IDs are introduced by this phase. Phase 29 resolves the audit status of ROUTE-01, NAV-02, and ACCESS-02 from "partial" to "satisfied" by removing the specific evidence gaps identified in `v1.5-MILESTONE-AUDIT.md`.
</phase_requirements>

---

## Summary

Phase 29 is a pure cleanup phase with no new capabilities. Every decision (D-01 through D-17) is a targeted removal or a one-to-few-line edit closing an audit gap found in `v1.5-MILESTONE-AUDIT.md`. The work splits cleanly into two buckets: (1) five source-code fixes addressing INT-01 through INT-06, and (2) four test-pipeline unblocking items addressing jest/tsc/playwright/tailwind tech debt aggregated from Phases 27 and 28.

The research confirmed all specific line numbers and file structures from the CONTEXT.md. The critical findings are: the tsc error count is **12** (not 21 as stated in the audit — the count has drifted downward since audit time); the `Timeline.test.tsx` file **already exists** and already contains a test at line 82 asserting `href='/orders?selected=order-1'` — the D-06 work is updating that existing test (not creating a new file); and the `DashboardLayout` accepts only `children: React.ReactNode` with no other props.

The `@source not "../../.planning"` Tailwind v4 syntax is already the correct form per official docs (directory paths without glob suffixes are recursively excluded). D-17's fix may need to verify the path resolves correctly or switch to a more explicit glob pattern if subdirectory scanning is still observed in practice.

**Primary recommendation:** Execute decisions in dependency order — D-05/D-06 (blocker fix + test) first, then source deletions (D-07, D-09, D-10, D-11, D-12, D-13), then pipeline fixes (D-14, D-15, D-16, D-17). Commit atomically per logical concern.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Timeline href fix (D-05) | Browser / Client | — | Timeline.tsx is a 'use client' UI primitive; the Link href is a rendered prop |
| Timeline href regression test (D-06) | Test layer | — | Jest component test; no tier assignment in the app itself |
| /settings layout swap (D-07) | Frontend Server (SSR) | Browser / Client | settings/page.tsx is 'use client'; DashboardLayout is also 'use client'; swap is a render-tree concern |
| Header.tsx dead branch deletion (D-11) | Browser / Client | — | getPageTitle is a pure function inside a client component |
| checkRole deletion (D-12) | API / Backend | — | auth.ts is server-only (explicit in JSDoc); never import into client |
| REQUIREMENTS.md update (D-13) | Documentation | — | Not a runtime tier |
| E2E spec updates (D-09, D-10) | Test layer | — | Playwright specs; no runtime tier |
| Jest ignore pattern (D-14) | Test layer | — | jest.config.ts |
| tsc fixture errors (D-15) | Test layer | — | Test fixtures only; type definitions unchanged |
| Playwright env override (D-16) | Test layer | — | playwright.config.ts project config |
| Tailwind @source exclude (D-17) | CDN / Static | — | Build-time CSS scanning; dev-server perf |

---

## Standard Stack

No new libraries are introduced in this phase. All changes touch existing files or delete them.

### Core (already installed — read-only reference)
| Library | Installed Version | Role in This Phase |
|---------|------------------|--------------------|
| Next.js / React | (project version) | Framework for components being edited |
| `@testing-library/react` | (project version) | D-06 component test uses `render`, `screen`, `userEvent` |
| `jest` | (project version) | D-06, D-14, D-15 |
| `@playwright/test` | (project version) | D-09, D-10, D-16 |
| `tailwindcss` | 4.2.1 [VERIFIED: node_modules] | D-17 `@source not` syntax |

**No `npm install` required for this phase.**

---

## Architecture Patterns

### System Architecture Diagram

```
BLOCKER (INT-01/FLOW-01):
  demo customer detail page
    └─ Timeline.tsx (UI primitive, src/components/ui/)
         └─ Link href="/orders?selected=X"   [BROKEN — 404 after Phase 26]
              ↓  D-05 fix
         └─ Link href="/demo/orders?selected=X"   [CORRECT]

  Timeline.test.tsx (already exists)
    └─ line 82: expect(link).toHaveAttribute('href', '/orders?selected=order-1')  [STALE]
         ↓  D-06 update
    └─ expect(link).toHaveAttribute('href', '/demo/orders?selected=order-1')  [CORRECT]

CLEANUP (INT-02):
  src/app/settings/page.tsx
    └─ inlines <Sidebar/> + <Header/>   [DUPLICATES DashboardLayout structure]
         ↓  D-07 swap
    └─ <DashboardLayout>…</DashboardLayout>   [eliminates duplication]
    └─ drops: import Sidebar, import Header

CLEANUP (INT-06):
  Header.tsx::getPageTitle
    ├─ '/demo/orders' → 'Orders'   (kept)
    ├─ '/demo/customers' → 'Customers'   (kept)
    ├─ '/demo/mill-production' → 'Mill Production'   (kept)
    ├─ '/' → 'Coming Soon'   (kept)
    ├─ '/settings' → 'Settings'   (kept)
    ├─ '/orders' → 'Orders'   [DELETED — D-11]
    ├─ '/mill-production' → 'Production'   [DELETED — D-11]
    ├─ '/customers' → 'Customers'   [DELETED — D-11]
    └─ return 'Dashboard'   (kept — default fallback)

CLEANUP (INT-03):
  src/lib/auth.ts
    ├─ export checkRole()   [DELETED — D-12]
    └─ export requireRole()   (kept — sole production guard)

  src/lib/auth.test.ts
    ├─ describe('checkRole', …) { 5 tests }   [DELETED — D-12]
    └─ describe('requireRole', …) { 3 tests }   (kept)

E2E CLEANUP (INT-04, INT-05):
  e2e/production-smoke.spec.ts   [DELETED — D-09]
  e2e/route-protection.spec.ts
    └─ protectedRoutes: ['/orders', …]  →  ['/demo/orders', …]   [D-10]

TEST PIPELINE:
  jest.config.ts
    └─ + testPathIgnorePatterns: ['<rootDir>/e2e/']   [D-14]
  4 test fixture files (12 tsc errors)   [D-15]
  playwright.config.ts demo-user/norole-user projects
    └─ + env: { PLAYWRIGHT_BASE_URL: '' }   [D-16]
  src/app/globals.css
    └─ @source not "../../.planning"   [D-17 — verify/fix]
```

### Recommended Project Structure
No structural changes. All edits are within existing files or file deletions.

---

## Key Technical Facts (Verified from Codebase)

### D-05: Timeline.tsx href fix

**File:** `src/components/ui/Timeline.tsx`
**Line:** 123 [VERIFIED: grep]
**Current value:** `` href={`/orders?selected=${event.orderId}`} ``
**Correct value:** `` href={`/demo/orders?selected=${event.orderId}`} ``

The fix is the string `/orders` → `/demo/orders` inside the template literal. The surrounding `Link` JSX is unchanged.

### D-06: Timeline href regression test

**Key finding:** `src/components/ui/Timeline.test.tsx` ALREADY EXISTS. [VERIFIED: file read]

A test at line 76–83 currently reads:
```typescript
// Source: src/components/ui/Timeline.test.tsx:76-83 [VERIFIED]
it('shows View Order Details link when expanded', async () => {
  const user = userEvent.setup();
  render(<Timeline events={mockEvents} />);
  const orderEvent = screen.getByRole('button', { name: 'Order Placed' });
  await user.click(orderEvent);
  const link = screen.getByRole('link', { name: /View Order Details/i });
  expect(link).toHaveAttribute('href', '/orders?selected=order-1');  // STALE — update to /demo/orders
});
```

D-06 work = UPDATE the assertion on the last line: `'/orders?selected=order-1'` → `'/demo/orders?selected=order-1'`.

This is NOT a new test file. The planner must NOT create `Timeline.test.tsx` — it exists. The planner should treat D-06 as a one-line test update inside an existing file.

The test uses:
- `@testing-library/react` `render`, `screen`
- `@testing-library/user-event` `userEvent`
- `next/link` mocked at line 8: `MockLink = ({ children, href }) => <a href={href}>{children}</a>`

Mock shape is correct for asserting `href` on the rendered `<a>`.

### D-07: DashboardLayout contract

**File:** `src/components/DashboardLayout.tsx` [VERIFIED: file read]

Interface:
```typescript
// Source: src/components/DashboardLayout.tsx [VERIFIED]
interface DashboardLayoutProps {
  children: React.ReactNode;
}
```

Children-only. No `onSearch`, no `className`, no other props.

**settings/page.tsx current structure** (lines 54–141 [VERIFIED]):
```
<div className="bg-bg-page flex h-screen">
  <Sidebar />
  <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
    <Header />
    {/* page content */}
  </main>
</div>
```

**After D-07:**
```
<DashboardLayout>
  {/* page content — everything except the outer div, Sidebar, main, and Header */}
</DashboardLayout>
```

The "page content" that becomes DashboardLayout children is the `<div className="mx-auto w-full max-w-2xl">` block and everything inside it (lines ~60–138).

**Imports to drop:** `Sidebar` from `@/components/Sidebar` and `Header` from `@/components/Header`.
**Import to add:** `DashboardLayout` from `@/components/DashboardLayout`.

Both `settings/page.tsx` and `DashboardLayout.tsx` are `'use client'` — no RSC boundary issue.

### D-09: production-smoke.spec.ts deletion

**File:** `e2e/production-smoke.spec.ts` [VERIFIED: file read]

The `production-smoke` project entry in `playwright.config.ts` (lines 33–40) references this file via `testMatch: '**/production-smoke.spec.ts'`. After deleting the spec, the `production-smoke` project entry in `playwright.config.ts` should also be removed (it will error with no matching tests). The CONTEXT.md D-09 says delete the file — the planner should note the orphaned playwright project entry as a companion edit.

### D-10: route-protection.spec.ts path update

**File:** `e2e/route-protection.spec.ts` [VERIFIED: file read]

Changes needed:
1. `protectedRoutes` constant (lines 13–18): `'/orders'`, `'/customers'`, `'/mill-production'` → `'/demo/orders'`, `'/demo/customers'`, `'/demo/mill-production'`
2. PROT-02 test (lines 34–48): hardcodes `await page.goto('/orders')` and `expect(returnBackUrl).toContain('/orders')` — these also need updating to `/demo/orders`

The PROT-01 for-loop and PROT-02 return-URL test currently test the old paths. After D-10, the correct paths are the `/demo/*` variants. The PROT-01 tests will still pass for `/settings` (Clerk still guards it via `auth.protect()`).

### D-11: Header.tsx dead branch deletion

**File:** `src/components/Header.tsx` [VERIFIED: file read]

Lines to delete:
```typescript
// Lines 33–36 [VERIFIED]
  // Legacy routes (404 fallback)
  if (path.startsWith('/orders')) return 'Orders';
  if (path.startsWith('/mill-production')) return 'Production';
  if (path.startsWith('/customers')) return 'Customers';
```

After deletion, `getPageTitle` function body is:
```typescript
const getPageTitle = (path: string): string => {
  if (path.startsWith('/demo/orders')) return 'Orders';
  if (path.startsWith('/demo/customers')) return 'Customers';
  if (path.startsWith('/demo/mill-production')) return 'Mill Production';
  if (path === '/') return 'Coming Soon';
  if (path.startsWith('/settings')) return 'Settings';
  return 'Dashboard';
};
```

**Header.test.tsx impact:** The existing test mocks `usePathname` as `'/orders'` (line 52). After D-11, `getPageTitle('/orders')` returns `'Dashboard'` instead of `'Orders'`. However, no assertion in `Header.test.tsx` checks the rendered page title text — all tests assert on UserButton/Clerk behavior only. No Header.test.tsx changes needed for D-11. [VERIFIED: file read]

### D-12: checkRole deletion

**File:** `src/lib/auth.ts` — delete the entire `checkRole` function (lines 22–41 approximately) and its JSDoc (lines 22–36) [VERIFIED: file read]

**File:** `src/lib/auth.test.ts` — delete the entire `describe('checkRole', …)` block (lines 24–64, 5 tests) [VERIFIED: file read]

The `requireRole` describe block (lines 66–90, 3 tests) stays intact. The `mockAuth` setup and `jest.mock` calls at the top stay intact. The `checkRole` import on line 18 changes from `import { checkRole, requireRole }` to `import { requireRole }`.

**Confirmed 5 checkRole tests** (not 8 as stated in CONTEXT.md — audit may have counted differently):
1. `returns true when claim matches`
2. `returns false when claim does not match`
3. `returns false when sessionClaims is undefined`
4. `returns false when metadata.role is missing`
5. `returns false when userId is null (unauthenticated)`

The CONTEXT.md says "8 checkRole unit tests" but the actual file has 5 in the `describe('checkRole')` block. The planner should use the verified count (5).

### D-13: REQUIREMENTS.md ACCESS-02 text edit

**File:** `.planning/REQUIREMENTS.md` [VERIFIED: file read]

Current line 26: `- [x] **ACCESS-02**: Role utility functions (\`checkRole()\`, \`requireRole()\`) available for server components`

After D-13: `- [x] **ACCESS-02**: Role utility functions (\`requireRole()\`) available for server components`

Keep `[x]` status as required by CONTEXT.md specifics.

### D-14: jest.config.ts testPathIgnorePatterns

**File:** `jest.config.ts` [VERIFIED: file read]

Current config object:
```typescript
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
}
```

Add `testPathIgnorePatterns` to the config object:
```typescript
testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
```

The default Jest `testPathIgnorePatterns` includes `/node_modules/` — include it in the override to avoid accidentally re-enabling node_modules scanning. [ASSUMED: default Jest behavior; explicit inclusion is defensive]

**Confirmed: Jest IS currently picking up e2e files** — `npm test -- --listTests` output shows `e2e/production-smoke.spec.ts`, `e2e/route-protection.spec.ts`, and `e2e/demo-route-protection.spec.ts` in the test list. [VERIFIED: npm test --listTests]

### D-15: tsc fixture errors

**Verified count: 12 errors across 4 files** (the CONTEXT.md "21" figure reflects the audit snapshot; some errors were apparently resolved in earlier work). [VERIFIED: npx tsc --noEmit]

| File | Error Count | Error Type | Fix Required |
|------|-------------|-----------|--------------|
| `src/__tests__/design-system/theme.test.tsx` | 7 | `TS18047: 'capturedProps' is possibly 'null'` | Add non-null assertion `capturedProps!.` or `expect(capturedProps).not.toBeNull()` guard before accessing properties |
| `src/__tests__/design-system/tokens.test.ts` | 3 | `TS1501: regex /s flag requires es2018 target` | Change `tsconfig.json` target from `"ES2017"` to `"ES2018"` OR rewrite regexes to avoid `/s` flag (change `/\.dark\s*\{[^}]+\}/s` to a non-dotAll alternative) |
| `src/components/__tests__/OrderDetails.test.tsx` | 1 | `TS2741: 'customerId' missing in Order mock` | Add `customerId: 'CUST-001'` to the `mockOrder` object at line 13 |
| `src/utils/customerSort.test.ts` | 1 | `TS2741: 'activeBins' missing in CustomerStats mock` | Add `activeBins: 0` to the `stats` object in the `createCustomer` helper |

**Fix strategy for tsconfig target (tokens.test.ts):** The `es2018` flag IS needed for dotall regex. The project `tsconfig.json` target is `"ES2017"`. Two valid fixes: (a) bump `target` to `"ES2018"` in `tsconfig.json`, or (b) rewrite the 3 regexes in `tokens.test.ts` to not use `/s`. Option (a) is cleaner and has no downside for a Next.js app targeting modern browsers. D-15 says "touch fixture files only; do not migrate type definitions" — this suggests option (b) for the regex issue, keeping tsconfig unchanged.

**Exact rewrite for tokens.test.ts** (avoids touching tsconfig):
```typescript
// Current (3 instances):
const darkBlock = globalsCss.match(/\.dark\s*\{[^}]+\}/s);
// After (use [\s\S] instead of /s flag):
const darkBlock = globalsCss.match(/\.dark\s*\{[\s\S]+?\}/);
```

**Exact fix for theme.test.tsx** (7 instances of accessing `capturedProps.property` after its possibly-null type):
Pattern: `expect(capturedProps.attribute)` → `expect(capturedProps?.attribute)` or add `if (!capturedProps) return` guard, or use non-null assertion operator `capturedProps!.attribute`. The non-null assertion is the minimal change: `capturedProps!.attribute`.

### D-16: PLAYWRIGHT_BASE_URL leak fix

**Verified:** `.env.local` contains `PLAYWRIGHT_BASE_URL=<value>`. [VERIFIED: grep]

The global `use.baseURL` in `playwright.config.ts` (line 16) reads this value. The `demo-user` and `norole-user` projects do NOT have a `use:` block overriding `baseURL` — they inherit the production URL when `PLAYWRIGHT_BASE_URL` is set. These projects should run against `localhost:3000` (where `global setup` creates the Clerk session cookies).

**Fix:** Add `env: { PLAYWRIGHT_BASE_URL: '' }` to both `demo-user` and `norole-user` project configs, which forces their `baseURL` to fall back to `'http://localhost:3000'`:

```typescript
// Source: playwright.config.ts project pattern [VERIFIED: file read]
{
  name: 'demo-user',
  testMatch: /demo-route-protection\.spec\.ts$/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.clerk/demo.json',
    baseURL: 'http://localhost:3000',  // explicit override
  },
  dependencies: ['global setup'],
},
```

Alternatively, use a project-level `env` key if Playwright supports it, but directly setting `baseURL` in the project's `use:` block is the most straightforward and readable approach. [ASSUMED: Playwright project-level `use.baseURL` overrides global `use.baseURL`; this is the standard pattern per Playwright docs]

### D-17: Tailwind v4 @source not fix

**File:** `src/app/globals.css` [VERIFIED: file read, line 4]

Current value:
```css
@source not "../../.planning";
```

The path `../../.planning` relative to `src/app/globals.css` resolves to `.planning/` at the project root. This is the correct target.

**Tailwind v4 @source not behavior:** Official docs (Context7 /tailwindlabs/tailwindcss.com) show bare directory paths WITHOUT trailing glob, e.g. `@source not "../src/components/legacy"`. The semantics exclude the directory and all contents recursively. [CITED: https://tailwindcss.com/docs/detecting-classes-in-source-files]

**Diagnosis of audit note ("doesn't recursively exclude"):** The audit's claim that the current directive "doesn't recursively exclude `.planning/**/*.md`" is most likely explained by the path already being correct syntactically, but the path resolution may have been broken at the time the audit was run (stale dev-server cache). The planner should:
1. Verify the current directive still resolves correctly after the phase
2. If dev-server still scans `.planning/**/*.md`, switch to an explicit glob: `@source not "../../.planning/**"`

**Tailwind v4 installed version:** 4.2.1 [VERIFIED: node_modules/tailwindcss/package.json]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Null-checking in test assertions | Custom null-check utilities | TypeScript non-null assertion `!` or `expect(x).not.toBeNull()` guard | Standard TS/Jest pattern |
| Excluding test directories from Jest | Manual glob patterns | `testPathIgnorePatterns` in jest.config | Built-in Jest feature |
| Project-level Playwright baseURL override | Env var injection scripts | `use: { baseURL: '...' }` in project config | Native Playwright project config |

---

## Common Pitfalls

### Pitfall 1: Creating Timeline.test.tsx Instead of Updating It
**What goes wrong:** Planner creates a new test file for D-06, duplicating the existing file.
**Why it happens:** CONTEXT.md says "New file (or extension to an existing Timeline.test.tsx)" — the existing file was not confirmed during planning.
**How to avoid:** The file EXISTS at `src/components/ui/Timeline.test.tsx`. D-06 is a one-line update to the existing `shows View Order Details link when expanded` test assertion on line 82. Do NOT create a new file.
**Warning signs:** If the plan says "create Timeline.test.tsx", it's wrong.

### Pitfall 2: Leaving Orphaned production-smoke Playwright Project
**What goes wrong:** `e2e/production-smoke.spec.ts` is deleted but the `production-smoke` project entry in `playwright.config.ts` (lines 33–40) is left behind. Playwright will warn or error at `npx playwright test` time.
**Why it happens:** D-09 only says "delete the file" — the orphaned config entry is implicit.
**How to avoid:** The planner must include a companion edit to remove the `production-smoke` project block from `playwright.config.ts` as part of D-09.

### Pitfall 3: Counting checkRole Tests as 8 Instead of 5
**What goes wrong:** Plan says "delete 8 checkRole tests" but only 5 exist in the `describe('checkRole')` block.
**Why it happens:** CONTEXT.md says "8 unit tests" — the audit may have counted differently or the file was edited since the audit.
**How to avoid:** The verified count in `src/lib/auth.test.ts` is 5 checkRole tests + 3 requireRole tests = 8 total. The CONTEXT.md's "8" likely refers to 8 tests in the checkRole+requireRole file — but only the 5 in `describe('checkRole')` are deleted. The 3 requireRole tests STAY.

### Pitfall 4: Touching tsconfig.json for D-15
**What goes wrong:** Executor changes `tsconfig.json` target from ES2017 to ES2018 to fix the regex `/s` flag errors.
**Why it happens:** It's the easiest fix.
**How to avoid:** D-15 says "touch fixture files only; do not migrate type definitions." Rewrite the 3 regex instances in `tokens.test.ts` to use `[\s\S]` instead of the `/s` flag.

### Pitfall 5: Missing PROT-02 Path Update in D-10
**What goes wrong:** Only `protectedRoutes` constant is updated; the hardcoded `/orders` references in the PROT-02 test body (lines 36, 47) are left stale.
**Why it happens:** D-10 specifically calls out the `protectedRoutes` constant — the PROT-02 hardcoded references are implicitly included.
**How to avoid:** Update ALL old-path references in `route-protection.spec.ts`: the constant AND the PROT-02 `page.goto('/orders')` and `expect(returnBackUrl).toContain('/orders')`.

### Pitfall 6: Dropping Default /node_modules/ from testPathIgnorePatterns
**What goes wrong:** `testPathIgnorePatterns: ['<rootDir>/e2e/']` replaces the default (which includes `/node_modules/`), causing Jest to scan node_modules.
**Why it happens:** Jest merges some config but replaces `testPathIgnorePatterns` entirely when set explicitly.
**How to avoid:** Set `testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/']`.

---

## Code Examples

### D-06: Updated Timeline test assertion
```typescript
// Source: src/components/ui/Timeline.test.tsx:82 — update THIS line [VERIFIED]
// Before:
expect(link).toHaveAttribute('href', '/orders?selected=order-1');
// After:
expect(link).toHaveAttribute('href', '/demo/orders?selected=order-1');
```

### D-07: settings/page.tsx layout swap
```typescript
// Source: src/app/settings/page.tsx — replace wrapper [VERIFIED shape from file read]
// Remove imports:
// import Sidebar from "@/components/Sidebar";
// import Header from "@/components/Header";
// Add import:
import DashboardLayout from "@/components/DashboardLayout";

// Replace the outer JSX:
// Before:
return (
  <div className="bg-bg-page flex h-screen">
    <Sidebar />
    <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
      <Header />
      {/* page content */}
    </main>
  </div>
);
// After:
return (
  <DashboardLayout>
    {/* page content — the <div className="mx-auto w-full max-w-2xl"> block */}
  </DashboardLayout>
);
```

### D-14: jest.config.ts testPathIgnorePatterns
```typescript
// Source: jest.config.ts — add to existing config object [VERIFIED shape from file read]
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
}
```

### D-15: tokens.test.ts regex fix (3 instances)
```typescript
// Source: src/__tests__/design-system/tokens.test.ts — lines 93, 99, 105 [VERIFIED]
// Before (3 instances):
const darkBlock = globalsCss.match(/\.dark\s*\{[^}]+\}/s);
// After (avoids /s flag, compatible with ES2017 target):
const darkBlock = globalsCss.match(/\.dark\s*\{[\s\S]+?\}/);
```

### D-15: theme.test.tsx null assertion fix (7 instances)
```typescript
// Source: src/__tests__/design-system/theme.test.tsx — lines 38,48,58,68,78,88,109 [VERIFIED]
// Before (example):
expect(capturedProps.attribute).toBe("class");
// After (non-null assertion):
expect(capturedProps!.attribute).toBe("class");
```

### D-16: Playwright demo-user/norole-user baseURL override
```typescript
// Source: playwright.config.ts — add baseURL to demo-user and norole-user projects [VERIFIED shape]
{
  name: 'demo-user',
  testMatch: /demo-route-protection\.spec\.ts$/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.clerk/demo.json',
    baseURL: 'http://localhost:3000',  // prevents PLAYWRIGHT_BASE_URL leak from .env.local
  },
  dependencies: ['global setup'],
},
{
  name: 'norole-user',
  testMatch: /demo-route-protection\.spec\.ts$/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.clerk/norole.json',
    baseURL: 'http://localhost:3000',  // prevents PLAYWRIGHT_BASE_URL leak from .env.local
  },
  dependencies: ['global setup'],
},
```

---

## TDD Classification

This section classifies each decision for the TDD-mode planner.

| Decision | Classification | Reasoning |
|----------|---------------|-----------|
| D-05: Timeline href fix | `execute` | Config/plumbing — change a string literal in a template literal. No business logic, no I/O contract to test. |
| D-06: Timeline href regression test | `tdd` | Has defined I/O: given `mockEvents` with `orderId: 'order-1'`, the expanded Link href MUST equal `/demo/orders?selected=order-1`. This is a targeted assertion update on an existing test. Write/update test first, then fix D-05. |
| D-07: settings DashboardLayout swap | `execute` | UI plumbing — swap one layout wrapper for another with identical visual output. No business logic. |
| D-08: Do not touch settings tests | `execute` | Non-action decision (skip). |
| D-09: Delete production-smoke.spec.ts | `execute` | File deletion + playwright project config cleanup. |
| D-10: Update route-protection.spec.ts | `execute` | String replacement in E2E spec paths. The paths being tested are already validated by middleware; no new logic to assert. |
| D-11: Delete Header.tsx dead branches | `tdd` | Testable behavior change: `getPageTitle('/orders')` should now return `'Dashboard'` (falls through to default) rather than `'Orders'`. However, `getPageTitle` is NOT exported — so the test must render `<Header>` with a mocked `usePathname` returning `'/orders'` and assert the breadcrumb text is `'Dashboard'`. **Note:** Because `Header.test.tsx` already mocks `usePathname` as `'/orders'` but doesn't assert on the title text, the executor must ADD a title-text assertion, not just delete the branches. This makes D-11 a `tdd` item. |
| D-12: Delete checkRole | `execute` | Deletion of export and its tests. No new behavior — only removing an unused function. After deletion, running `npm test` proves no consumer broke. |
| D-13: REQUIREMENTS.md text edit | `execute` | Documentation edit. |
| D-14: jest.config.ts ignore pattern | `execute` | Config/plumbing. Verification: `npm test -- --listTests` should NOT include e2e files after the change. |
| D-15: Fix 12 tsc errors | `execute` | Type annotation fixes and regex rewrites in test fixtures. No business logic changes. |
| D-16: Playwright env override | `execute` | Config plumbing in playwright.config.ts. |
| D-17: Tailwind @source fix | `execute` | CSS config edit. |

**TDD summary:**
- `tdd` decisions: D-06 (update assertion first, then fix href), D-11 (add negative test for dead branch, then delete branches)
- `execute` decisions: D-05, D-07, D-08, D-09, D-10, D-12, D-13, D-14, D-15, D-16, D-17

**TDD execution order for D-06:**
1. Update `Timeline.test.tsx` line 82: assertion to `'/demo/orders?selected=order-1'` → test now FAILS (red)
2. Update `Timeline.tsx` line 123: href to `/demo/orders?selected=${event.orderId}` → test PASSES (green)

**TDD execution order for D-11:**
1. In `Header.test.tsx` (or a new describe block), add: render Header with `usePathname` mocked as `'/orders'`, assert breadcrumb/h1 text is `'Dashboard'` → test now FAILS (red, because dead branch returns `'Orders'`)
2. Delete dead branches from Header.tsx → test PASSES (green)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (via `next/jest`) |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npm test -- --testPathPattern=Timeline` |
| Full suite command | `npm test` |
| E2E command | `npm run test:e2e` |

### Phase Requirements → Test Map

| Decision | Behavior | Test Type | Automated Command | Validation |
|----------|----------|-----------|-------------------|------------|
| D-05 (href fix) | Timeline Link navigates to `/demo/orders` | component | `npm test -- --testPathPattern=Timeline` | Passes after D-06 update |
| D-06 (test update) | `href='/demo/orders?selected=order-1'` assertion | component | `npm test -- --testPathPattern=Timeline` | Red before D-05, green after |
| D-07 (layout swap) | `/settings` renders via DashboardLayout | manual / visual | dev server inspection | No automated test (D-08 defers settings tests) |
| D-09 (file delete) | `production-smoke.spec.ts` does not exist | negative-existence | `ls e2e/production-smoke.spec.ts` (exit 2) | Shell exit code check |
| D-10 (path update) | route-protection tests target `/demo/*` paths | E2E | `npm run test:e2e -- --project=chromium route-protection` | Playwright passes |
| D-11 (dead branch delete) | `getPageTitle('/orders')` → `'Dashboard'` | component | `npm test -- --testPathPattern=Header` | Red before deletion (new assert), green after |
| D-12 (checkRole delete) | `checkRole` is not importable; 5 tests removed | unit | `npm test -- --testPathPattern=auth` | `import { checkRole }` compile error if still present |
| D-13 (docs edit) | ACCESS-02 text references only requireRole | manual | `grep 'checkRole' .planning/REQUIREMENTS.md` → 0 matches | grep exit code check |
| D-14 (jest ignore) | `npm test` does not scan e2e/ | negative-existence | `npm test -- --listTests \| grep e2e` → no output | grep returns no matches |
| D-15 (tsc errors) | `npx tsc --noEmit` exits 0 | type-check | `npx tsc --noEmit` | Exit code 0 |
| D-16 (PW env) | demo-user/norole-user use localhost:3000, not PLAYWRIGHT_BASE_URL | config | `npm run test:e2e -- --project=demo-user` | Playwright connects to localhost |
| D-17 (tailwind) | `.planning/**/*.md` not scanned by Tailwind | manual | dev-server startup time / no Tailwind warnings | Dev-server observation |

### Negative-Existence Assertions (Deletions)

These require verifying that code NO LONGER EXISTS after the change:

| Deleted Item | Verification Command | Expected Result |
|-------------|---------------------|-----------------|
| `e2e/production-smoke.spec.ts` | `ls e2e/production-smoke.spec.ts` | exit 2 (no such file) |
| `checkRole` function | `grep 'export.*checkRole' src/lib/auth.ts` | 0 matches |
| `checkRole` import in test | `grep 'checkRole' src/lib/auth.test.ts` | 0 matches |
| Legacy `/orders` Header branch | `grep "path.startsWith.*'/orders'" src/components/Header.tsx` | 0 matches |
| `production-smoke` playwright project | `grep 'production-smoke' playwright.config.ts` | 0 matches after cleanup |
| Old E2E paths | `grep "'/orders'" e2e/route-protection.spec.ts` | 0 matches |

### Wave 0 Gaps

None — all test infrastructure already exists. The only new test work is:
1. Updating the existing assertion in `Timeline.test.tsx` line 82 (D-06)
2. Adding a title-text assertion in `Header.test.tsx` for the D-11 dead-branch TDD cycle

---

## Validation Architecture (Nyquist)

`workflow.nyquist_validation: true` — this section is required.

### Sampling Rate
- **Per commit:** Run test file most relevant to the commit (see Test Map above)
- **Per wave merge:** `npm test` (full Jest suite)
- **Phase gate:** `npm test` green + `npx tsc --noEmit` exit 0 before `/gsd-verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. No new fixture files, no new framework installs.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact for This Phase |
|--------------|-----------------|--------------|----------------------|
| `@tailwindcss/postcss` + `tailwind.config.ts` | CSS `@import "tailwindcss"` + `@source` directives in globals.css | Tailwind v4 | D-17 targets globals.css, not tailwind.config.ts |
| Jest `testPathPattern` for test scoping | `testPathIgnorePatterns` for negative exclusion | Jest 27+ | D-14 |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Default Jest `testPathIgnorePatterns` includes `/node_modules/`; explicit override replaces it | D-14 code example | Minimal — worst case, Jest scans node_modules (slow but not broken) |
| A2 | Playwright project-level `use.baseURL` overrides global `use.baseURL` | D-16 code example | Low — if not, use `process.env` override in project `env:` block instead |
| A3 | Tailwind v4 `@source not "path"` on a directory recursively excludes all contents | D-17 | Low — if recursive exclusion requires `/**` glob, fix is trivial |
| A4 | The `production-smoke` playwright project entry (playwright.config.ts lines 33–40) should be removed when the spec file is deleted | D-09 | Medium — Playwright may error or warn on a project with no matching test files |

**If this table is empty for verified claims:** All other claims in this research were verified from live codebase inspection or official documentation.

---

## Open Questions (RESOLVED)

1. **D-17: Why does the current @source not not work recursively?**
   - What we know: Current directive `@source not "../../.planning"` points to correct directory. Tailwind v4 docs show bare directory paths as the standard syntax. Tailwind 4.2.1 is installed.
   - What's unclear: Whether the audit note about "doesn't recursively exclude" reflects a resolved dev-server cache issue or an actual syntax problem.
   - Recommendation: Verify in dev-server after the phase. If `.planning` content still appears to be scanned, switch to `@source not "../../.planning/**"` as the explicit recursive form.
   - **RESOLVED:** Implemented as Plan 29-06 Task 5 — verify-first then conditional edit. Both post-states (current directive retained OR explicit `/**` glob form) are accepted by the task acceptance criteria.

2. **D-10: Should PROT-02 test be updated or deleted?**
   - What we know: PROT-02 tests return-URL preservation from `/orders`. After D-10, `/orders` is no longer a primary test path; `/demo/orders` is.
   - What's unclear: Whether return-URL preservation via Clerk still works for `/demo/orders` the same way.
   - Recommendation: Update PROT-02 to use `/demo/orders` — this tests the same Clerk redirect_url behavior but for the live demo route.
   - **RESOLVED:** Implemented as Plan 29-04 Task 2 — PROT-02 body hardcoded `/orders` references (×2) are part of the 5 substitutions in the route-protection.spec.ts update.

---

## Environment Availability

All external dependencies are the project's own runtime stack — no new tools required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | All | ✓ | (project runtime) | — |
| `jest` | D-06, D-14, D-15 | ✓ | (installed) | — |
| `npx tsc` | D-15 verification | ✓ | ES2017 target | — |
| `@playwright/test` | D-09, D-10, D-16 | ✓ | (installed) | — |
| `tailwindcss` 4.x | D-17 | ✓ | 4.2.1 | — |

**No missing dependencies.** This phase is entirely code/config changes to existing project files.

---

## Security Domain

No security-relevant changes in this phase. The deletions (checkRole, dead Header branches) reduce attack surface marginally but introduce no new security concerns. `requireRole` remains as the sole server-side role guard — this is a reduction in surface area, not a weakening.

| ASVS Category | Applies | Notes |
|---------------|---------|-------|
| V4 Access Control | yes (tangential) | Removing checkRole (unused) does not affect enforced access control; requireRole is unchanged |
| V5 Input Validation | no | No new input paths |

---

## Sources

### Primary (HIGH confidence)
- `src/components/ui/Timeline.tsx` — verified line 123 href value [VERIFIED: file read]
- `src/components/ui/Timeline.test.tsx` — verified existing test at line 82 [VERIFIED: file read]
- `src/components/Header.tsx` — verified getPageTitle dead branches at lines 33–36 [VERIFIED: file read]
- `src/app/settings/page.tsx` — verified current layout structure [VERIFIED: file read]
- `src/components/DashboardLayout.tsx` — verified children-only props contract [VERIFIED: file read]
- `src/lib/auth.ts` — verified checkRole function exists [VERIFIED: file read]
- `src/lib/auth.test.ts` — verified 5 checkRole tests + 3 requireRole tests [VERIFIED: file read]
- `jest.config.ts` — verified current config shape [VERIFIED: file read]
- `playwright.config.ts` — verified project configs and PLAYWRIGHT_BASE_URL usage [VERIFIED: file read]
- `src/app/globals.css` — verified `@source not "../../.planning"` at line 4 [VERIFIED: file read]
- `npx tsc --noEmit` — verified 12 actual errors (not 21) [VERIFIED: command output]
- `npm test -- --listTests` — verified e2e files are currently picked up by Jest [VERIFIED: command output]
- `.env.local` — verified PLAYWRIGHT_BASE_URL is set [VERIFIED: grep]
- Context7 `/tailwindlabs/tailwindcss.com` — @source not directory syntax [CITED: https://tailwindcss.com/docs/detecting-classes-in-source-files]

### Secondary (MEDIUM confidence)
- `tsconfig.json` — target ES2017 explains tokens.test.ts regex /s flag errors [VERIFIED: file read]
- `e2e/route-protection.spec.ts` — full spec read confirming PROT-02 hardcoded /orders references [VERIFIED: file read]
- `e2e/production-smoke.spec.ts` — confirmed file exists and navigates to /orders [VERIFIED: file read]

---

## Metadata

**Confidence breakdown:**
- Source code facts (file contents, line numbers): HIGH — verified from live codebase
- tsc error count (12 vs 21 in audit): HIGH — verified from `npx tsc --noEmit`
- checkRole test count (5 vs 8 in CONTEXT.md): HIGH — verified from file read
- Tailwind @source not recursive behavior: MEDIUM — documented behavior per Context7, but unverified at runtime
- Jest default testPathIgnorePatterns merge behavior: ASSUMED — standard Jest behavior

**Research date:** 2026-05-12
**Valid until:** 2026-06-11 (stable tech stack — no fast-moving dependencies)
