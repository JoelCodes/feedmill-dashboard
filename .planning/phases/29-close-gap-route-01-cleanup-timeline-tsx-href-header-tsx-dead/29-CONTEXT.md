# Phase 29: ROUTE-01 cleanup — Timeline.tsx href, Header.tsx dead branches, stale E2E specs, settings → DashboardLayout - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the gaps identified in the `v1.5-MILESTONE-AUDIT.md` (status `gaps_found`). This is a cleanup phase: no new capabilities, only removing migration debt left behind by Phases 25–28.

When complete:
- `src/components/ui/Timeline.tsx:123` href navigates to `/demo/orders?selected=…` instead of the deleted `/orders` path (closes BLOCKER INT-01 / FLOW-01).
- `src/app/settings/page.tsx` wraps its body in `<DashboardLayout>` instead of inlining `<Sidebar/><main><Header/>…` (closes INT-02; fully satisfies NAV-02).
- `src/components/Header.tsx::getPageTitle` no longer contains the 3 unreachable `/orders`, `/customers`, `/mill-production` branches (closes INT-06).
- `e2e/route-protection.spec.ts` targets `/demo/*` paths instead of deleted production routes (closes INT-05).
- `e2e/production-smoke.spec.ts` is removed (closes INT-04 by deletion — Clerk-login fragility + Phase 27 replacement coverage).
- `src/lib/auth.ts::checkRole` and its 8 unit tests are removed; REQUIREMENTS.md ACCESS-02 is updated to reflect `requireRole`-only API (closes INT-03).
- Test pipeline is unblocked: `jest.config.ts` ignores `e2e/`, 21 fixture `tsc` errors are fixed, `PLAYWRIGHT_BASE_URL` leak to demo-user/norole-user projects is closed, and Tailwind v4 `@source` patterns exclude `.planning/**/*.md`.
- A new Jest component test on `Timeline.tsx` asserts the order-event `Link` href shape, preventing this exact class of regression.

Out of scope: the 14 pre-existing failing `/settings` tests (need `ClerkProvider` test-wrapper rework — deferred to its own phase).

</domain>

<decisions>
## Implementation Decisions

### Scope (which audit items are in)
- **D-01:** All 5 ROUTE-01-related audit items are in scope: INT-01 (blocker), INT-02, INT-04, INT-05, INT-06.
- **D-02:** INT-03 (`checkRole` orphan) is **also in scope** — reversing the audit's "intentional API surface" judgment because there is no near-term production consumer.
- **D-03:** Test-pipeline tech debt from `v1.5-MILESTONE-AUDIT.md` is **also in scope**: jest e2e ignore, 21 fixture `tsc` errors, `PLAYWRIGHT_BASE_URL` leak, Tailwind `@source` exclusion.
- **D-04:** The 14 pre-existing failing `/settings` tests are **deferred** to a follow-up phase — they need a `ClerkProvider` test wrapper rework that's distinct from this cleanup.

### INT-01 Timeline.tsx href fix + regression test
- **D-05:** Change `Timeline.tsx:123` href from `` `/orders?selected=${event.orderId}` `` to `` `/demo/orders?selected=${event.orderId}` ``. One-line fix.
- **D-06:** Add a **Jest component test** on `Timeline.tsx` asserting the order-event `Link`'s `href` matches `/demo/orders?selected=*`. No Playwright E2E for this — the component test is faster, less brittle, and catches the exact bug class the audit found.

### INT-02 /settings → DashboardLayout
- **D-07:** Replace the inline `<div className="bg-bg-page flex h-screen"><Sidebar /><main …><Header />{children}</main></div>` block in `src/app/settings/page.tsx` with `<DashboardLayout>…</DashboardLayout>`. Drop the now-unused direct `Sidebar` and `Header` imports.
- **D-08:** Layout swap **only** — do not touch `src/app/settings/__tests__/page.test.tsx`. Its 14 failing tests are pre-existing on baseline and need a separate `ClerkProvider`-wrapper phase.

### INT-04 + INT-05 stale E2E specs
- **D-09:** **Delete** `e2e/production-smoke.spec.ts` entirely. Phase 27 added richer auth/role E2E coverage; this spec depends on a real Clerk sign-in and a custom-domain workaround that was already deferred from v1.4.
- **D-10:** **Update** `e2e/route-protection.spec.ts` — repoint the `protectedRoutes` constant from `['/orders', '/customers', '/mill-production', '/settings']` to `['/demo/orders', '/demo/customers', '/demo/mill-production', '/settings']`. Matches Phase 26 D-01 (clean-break, no 308 redirects).

### INT-06 Header.tsx dead branches
- **D-11:** **Delete outright** the 3 legacy lines in `src/components/Header.tsx::getPageTitle` (currently lines 33–36): the `/orders`, `/mill-production`, `/customers` `startsWith` branches and the `// Legacy routes (404 fallback)` comment. Any unknown path falls through to the existing `return 'Dashboard';` default. No replacement fallback (`'Page Not Found'` would change behavior for `/sign-in` and other unmatched paths).

### INT-03 checkRole removal
- **D-12:** Delete `checkRole` export from `src/lib/auth.ts`. Delete the 8 `checkRole` unit tests from the corresponding test file.
- **D-13:** Update `.planning/REQUIREMENTS.md` ACCESS-02 description to reference `requireRole` only (drop `checkRole`). Updates the audit trail to match reality — current text "checkRole(), requireRole()" becomes inaccurate after removal.

### Test pipeline tech debt
- **D-14:** Add `testPathIgnorePatterns: ['<rootDir>/e2e/']` (or equivalent) to `jest.config.ts`. Stops Jest from picking up Playwright specs; unblocks plain `npm test`.
- **D-15:** Fix the 21 `tsc` errors in test fixtures: drifted `customerId` and `activeBins` mock-data fields, and the regex `es2018` flag issue. Touch fixture files only; do not migrate type definitions.
- **D-16:** Stop `.env.local`'s `PLAYWRIGHT_BASE_URL` from leaking to the `demo-user` and `norole-user` Playwright projects. Fix in `playwright.config.ts` project config (project-level env override, not global).
- **D-17:** Tighten Tailwind v4 `@source not "../../.planning"` (or equivalent) so `.planning/**/*.md` is recursively excluded. Cosmetic dev-server perf fix.

### Claude's Discretion
- **Commit granularity** — Planner/executor decides. Atomic commits per logical concern is the project's standard pattern; expect ~7–9 commits.
- **Verification depth** — Planner decides which existing tests to re-run vs which need new tests. Mandatory new test: D-06 Timeline href component test.
- **File/line numbers** — All line references in this document are accurate as of commit `5eb6b3a` (audit time). Planner should re-grep before applying if any drift is suspected.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit source (drives every decision in this phase)
- `.planning/v1.5-MILESTONE-AUDIT.md` — defines INT-01 through INT-06, the FLOW-01 broken flow, the test-pipeline tech-debt bucket, and the deferred-requirements list. This phase exists to close `status: gaps_found`.

### Requirements + roadmap
- `.planning/REQUIREMENTS.md` §v1.5 Requirements — ROUTE-01, NAV-02, ACCESS-02 are the affected requirements; ACCESS-02 text must be edited (D-13).
- `.planning/ROADMAP.md` §Phase 29 — phase title enumerates the 4 core scope items.

### Prior phase decisions that constrain this phase
- `.planning/phases/26-route-restructuring-and-migration/26-CONTEXT.md` §D-01 — clean break, no 308 redirects from old paths. Why E2E specs are updated to `/demo/*` rather than testing redirects.
- `.planning/phases/25-foundation-and-middleware-configuration/25-CONTEXT.md` — `DashboardLayout` contract (NAV-02). `/settings` refactor (D-07) targets this component.
- `.planning/phases/27-role-assignment-and-testing/27-CONTEXT.md` — context for `requireRole` becoming the sole production guard (D-12, D-13).
- `.planning/phases/28-client-component-security-audit/28-CONTEXT.md` — most recent prior cleanup-style phase; verification patterns there are a reasonable template.

### Files to edit (full paths, for executor)
- `src/components/ui/Timeline.tsx` — D-05 href fix.
- `src/components/Header.tsx` — D-11 delete dead branches.
- `src/app/settings/page.tsx` — D-07 wrap with DashboardLayout.
- `src/components/DashboardLayout.tsx` — read-only reference; no changes.
- `src/lib/auth.ts` — D-12 delete `checkRole`.
- `src/lib/__tests__/auth.test.ts` (or wherever the 8 `checkRole` unit tests live — executor should grep) — D-12.
- `.planning/REQUIREMENTS.md` — D-13 ACCESS-02 text edit.
- `e2e/route-protection.spec.ts` — D-10 update paths.
- `e2e/production-smoke.spec.ts` — D-09 delete file.
- `jest.config.ts` — D-14 add testPathIgnorePatterns.
- `playwright.config.ts` — D-16 project-level env override.
- Tailwind config (`tailwind.config.ts` or `src/app/globals.css` `@source` directive) — D-17 exclude `.planning/`.
- Test fixture files (grep for `customerId`, `activeBins` references in `__tests__`/`__fixtures__`) — D-15 fix 21 tsc errors.
- **New file** (or extension to an existing `Timeline.test.tsx`) — D-06 component test for the href shape.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`DashboardLayout`** (`src/components/DashboardLayout.tsx`) — the canonical layout wrapper. Already consumed by all `/demo/*` pages and the homepage. `/settings` is the last holdout and the target of D-07.
- **`requireRole`** (`src/lib/auth.ts`) — wired into all 4 demo pages. After D-12, this becomes the sole role-guard export.

### Established Patterns
- **Clean break, no redirects** (Phase 26 D-01) — old `/orders`, `/customers`, `/mill-production` paths 404. This is why D-10 updates E2E paths instead of testing redirects, and why D-11 simply deletes the dead Header branches (no fallback needed).
- **Atomic commits per concern** — standard GSD pattern across phases 25–28. Planner should break this phase into atomic commits.
- **Component test over E2E when possible** (project preference, reinforced by D-06) — Jest component tests are preferred for tight assertions about rendered output (e.g., link href shapes); Playwright reserved for true end-to-end flows.

### Integration Points
- `Timeline.tsx` is a UI primitive under `src/components/ui/` — that's why Phase 26's grep-based audit missed it. The new component test (D-06) is the structural mechanism that prevents recurrence.
- `Header.tsx::getPageTitle` is consumed by `Header.tsx` itself and only routes through `usePathname()`. No downstream consumers depend on the dead-branch return values.
- `route-protection.spec.ts` tests run on the unauthenticated Playwright project — they assert sign-in redirects, not page contents. Updating the `protectedRoutes` constant alone is sufficient (the middleware still gates `/demo/*`).

</code_context>

<specifics>
## Specific Ideas

- The **regression-prevention test for INT-01 must assert the href shape** (`/demo/orders?selected=<orderId>`), not merely that the link renders. The audit caught this bug because of the path mismatch, not because the link was missing.
- The **`/settings` refactor must drop the `Sidebar` and `Header` imports** when swapping to `DashboardLayout` — leaving them as dead imports would re-create lint debt.
- The **REQUIREMENTS.md edit (D-13)** should keep ACCESS-02's `[x]` Complete status — `requireRole` alone satisfies the requirement as worded for the current guarding use case.

</specifics>

<deferred>
## Deferred Ideas

- **Fix the 14 pre-existing failing `/settings` page tests** — They need a `ClerkProvider` test wrapper. Bundled as one follow-up phase (e.g., "Phase 30: Settings test pipeline rework"). Pre-existing on baseline; not caused by this milestone.
- **Replace Header.tsx's hardcoded `getPageTitle` switch with a route metadata pattern** — could be a future quality phase, not relevant to ROUTE-01 cleanup.
- **Re-add a `checkRole` (or similar non-redirecting role check) when a production feature actually needs one** — record in REQUIREMENTS.md as a future requirement when that feature is scoped, not before.
- **Add an integration check for "all `Link`/`href` strings in `src/**/*.tsx` resolve to existing routes"** — could prevent the entire class of bug INT-01 represents, beyond just Timeline.tsx. Out of scope here; candidate for a tooling/lint phase.

</deferred>

---

*Phase: 29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead*
*Context gathered: 2026-05-12*
