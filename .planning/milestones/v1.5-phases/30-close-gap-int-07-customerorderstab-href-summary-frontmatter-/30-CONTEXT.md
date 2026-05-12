# Phase 30: Close gap: INT-07 CustomerOrdersTab href + SUMMARY frontmatter backfill - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the single remaining v1.5 audit blocker (INT-07) so all 7 E2E flows wire end-to-end and ROUTE-01 is fully satisfied, then backfill the four `requirements-completed` SUMMARY frontmatters that the v1.5 milestone audit identified as documentation-lag tech debt.

When complete:
- `src/components/CustomerOrdersTab.tsx:159` href navigates to `/demo/orders?selected=…` instead of the deleted `/orders` path (closes BLOCKER INT-07 / FLOW-07).
- A new Jest component test on `CustomerOrdersTab` asserts the order-row `Link`'s `href` shape (`/demo/orders?selected=*`), mirroring Phase 29 D-06 on `Timeline.tsx`. Prevents this exact class of regression in the sibling component.
- `.planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md` frontmatter adds `ROUTE-01` to `requirements-completed`.
- `.planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md` frontmatter adds `ROLE-02` and `NAV-02` to `requirements-completed`.
- `.planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md` frontmatter adds `NAV-01` to `requirements-completed`.
- The v1.5 milestone moves from `gaps_found` to fully closed: 8/8 requirements declared in SUMMARY frontmatters (not only via VERIFICATION.md), all 7 flows green, no remaining blockers.

Out of scope:
- The Phase 27 VALIDATION.md `nyquist_compliant: false` flag — already noted as Phase 27 tech debt; not on the audit's blocker list.
- The 14 pre-existing failing `/settings` ClerkProvider tests (Phase 29 D-04 deferred).
- Any other tech-debt items not listed in the v1.5 audit's `tech_debt` block.

</domain>

<decisions>
## Implementation Decisions

### Scope (which audit items are in)
- **D-01:** INT-07 (the sole v1.5 blocker) is in scope — one-line href edit at `src/components/CustomerOrdersTab.tsx:159` from `` `/orders?selected=${order.id}` `` to `` `/demo/orders?selected=${order.id}` ``.
- **D-02:** A mirroring Jest component test on `CustomerOrdersTab` is in scope — same regression-prevention rationale as Phase 29 D-06 on `Timeline.tsx`. The audit explicitly notes this pattern.
- **D-03:** All four `requirements-completed` SUMMARY frontmatter backfills from the audit's `tech_debt.milestone-level (documentation lag)` block are in scope (ROUTE-01 → 26-03, ROLE-02 → 25-01, NAV-01 → 26-01, NAV-02 → 25-01).
- **D-04:** Phase 27 VALIDATION.md `nyquist_compliant: false` is **deferred** — not a milestone blocker and listed under Phase-27-specific tech debt, not milestone-level lag.

### INT-07 source fix
- **D-05:** Change `src/components/CustomerOrdersTab.tsx:159` href from `` `/orders?selected=${order.id}` `` to `` `/demo/orders?selected=${order.id}` ``. Single-line edit. Mirrors Phase 29 D-05 exactly (Timeline.tsx:123).

### Regression test (mirrors Phase 29 D-06)
- **D-06:** Add a **new** test file `src/components/__tests__/CustomerOrdersTab.test.tsx` with a Jest component test that renders `CustomerOrdersTab` with at least one mock `Order` and asserts the rendered row `<a>` (or `<Link>`) `href` matches `/demo/orders?selected=<order.id>`. Asserts the href shape directly — not merely that the link renders — same standard as D-06 on `Timeline.tsx`.
- **D-07:** **Test location:** `src/components/__tests__/CustomerOrdersTab.test.tsx`, not co-located. Rationale: sibling components in `src/components/` (CustomersList, Header, OrderDetails, OrdersTable, MillProductionUI) all use `src/components/__tests__/`. Timeline lives under `src/components/ui/` with co-located `Timeline.test.tsx` because `ui/` is a separate folder with its own convention.
- **D-08:** **Mock pattern:** reuse the `jest.mock('next/link', () => …)` MockLink pattern from `src/components/ui/Timeline.test.tsx` lines 8–14 (renders `<a href={href}>{children}</a>`) so the assertion can read `href` off the rendered DOM. Order fixtures should follow the shape used in `src/services/orders` / `src/types/order` (executor should grep — existing Order mock data likely lives in `src/__fixtures__/` or `src/services/orders.ts`).
- **D-09:** **Test scope is minimal — href shape only.** Do NOT add broader `CustomerOrdersTab` coverage (search, filter pills, empty state, status counts) in this phase. Adding coverage would expand scope beyond INT-07's audit fix and the audit explicitly scoped this to "1 Jest assertion in CustomerOrdersTab test verifying rendered `<a>` href shape." Broader coverage is a candidate for a future test-hardening phase.

### SUMMARY frontmatter backfills
- **D-10:** **Four single-line YAML edits**, no behavior changes. Append entries to existing `requirements-completed:` lists in the listed files (or add the field if absent):
  - `.planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md` → add `- ROUTE-01`
  - `.planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md` → add `- ROLE-02` and `- NAV-02`
  - `.planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md` → add `- NAV-01`
- **D-11:** **Do not edit other frontmatter fields.** No re-dating, no `dependency_graph` updates, no metric changes. These edits are pure documentation-lag closure — the requirements are already verified-satisfied via `VERIFICATION.md`; this only aligns the SUMMARY frontmatter declarations with that ground truth.

### Commit granularity
- **D-12:** **Two atomic commits:**
  1. `fix(30): INT-07 CustomerOrdersTab href + regression test` — source edit (D-05) + new test file (D-06).
  2. `docs(30): backfill requirements-completed in 25-01, 26-01, 26-03 SUMMARYs` — four YAML edits across three files (D-10).
  Rationale: source/test belongs together (commit-bundles a regression-preventing test with its fix, same as Phase 29's atomic-commit pattern). Frontmatter backfills are pure docs-hygiene with no code coupling — keeping them in a separate commit makes the audit trail clear and lets reviewers focus on the substantive fix in commit 1.

### Audit-closure verification
- **D-13:** After execution, the v1.5 audit (`.planning/v1.5-MILESTONE-AUDIT.md`) and integration check (`.planning/v1.5-INTEGRATION-CHECK.md`) status entries should be updatable to `closed`/`passing`. This phase produces the evidence; a separate re-audit step (not in this phase) records closure. Do NOT edit `v1.5-MILESTONE-AUDIT.md` or `v1.5-INTEGRATION-CHECK.md` in this phase — they are immutable audit records.

### Claude's Discretion
- **Order mock fixture shape** — Executor decides between using existing mock data (grep `src/__fixtures__/` and `src/services/orders.ts`) versus defining a minimal inline `Order` object in the test file. Either is acceptable as long as the asserted `href` matches `/demo/orders?selected=<id>`.
- **Number of test cases in the new test file** — Minimum: one test asserting href shape on a single rendered row. Optional: a second test confirming the same shape for multiple rows. Beyond that is out-of-scope per D-09.
- **File/line numbers** — Line 159 in `CustomerOrdersTab.tsx` is accurate as of audit time (commit `b168649`). Executor should re-grep if any drift suspected.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit sources (drive every decision in this phase)
- `.planning/v1.5-MILESTONE-AUDIT.md` — defines INT-07, the FLOW-07 broken flow, and the four-item `tech_debt.milestone-level (documentation lag)` block. This phase exists to close `status: gaps_found` (re-audit #2).
- `.planning/v1.5-INTEGRATION-CHECK.md` — independent re-verification confirming INT-07 still present in source. Contains the exhaustive stale-reference sweep that proves only `CustomerOrdersTab.tsx:159` remains.

### Requirements + roadmap
- `.planning/REQUIREMENTS.md` — ROUTE-01, ROLE-02, NAV-01, NAV-02 are the affected requirements. All four are already marked `[x]` in the checklist and `Complete` in the traceability table; this phase only updates SUMMARY frontmatter declarations to match.
- `.planning/ROADMAP.md` §Phase 30 — phase scope enumeration (1 source edit + 1 Jest assertion + 4 frontmatter edits).

### Precedent — Phase 29 closed the same class of bug (INT-01 on Timeline.tsx)
- `.planning/phases/29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead/29-CONTEXT.md` §D-05, D-06 — the exact pattern this phase mirrors. D-05 = one-line href fix; D-06 = mirroring Jest assertion. Phase 30 is the sibling-component application of the same playbook.
- `.planning/phases/29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead/29-02-SUMMARY.md` — `requirements-completed: [ROUTE-01]` frontmatter shape to mirror for the 26-03 backfill.

### Files to edit (full paths, for executor)
- `src/components/CustomerOrdersTab.tsx` — D-05 href fix at line 159 (re-grep before applying).
- `src/components/__tests__/CustomerOrdersTab.test.tsx` — D-06 new test file (mirrors `src/components/ui/Timeline.test.tsx` MockLink pattern).
- `.planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md` — D-10 add `ROUTE-01` to `requirements-completed`.
- `.planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md` — D-10 add `ROLE-02` and `NAV-02` to `requirements-completed`.
- `.planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md` — D-10 add `NAV-01` to `requirements-completed`.

### Read-only references (no edits)
- `src/components/ui/Timeline.test.tsx` — MockLink + href-shape assertion template (lines 8–14 for the mock, line 82 for the href assertion).
- `src/types/order.ts` — `Order`, `OrderStatus` type definitions for mock fixture construction in the new test.
- `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/TESTING.md` — project test conventions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`MockLink` pattern** (`src/components/ui/Timeline.test.tsx` lines 8–14) — the established jest.mock('next/link') stub that renders `<a href={href}>{children}</a>`. Lets the new test read `href` directly off the rendered DOM. Copy-paste verbatim.
- **`Order` / `OrderStatus` types** (`src/types/order.ts`) — type-safe mock-data construction for the new test.
- **Phase 29 D-06 assertion shape** (`src/components/ui/Timeline.test.tsx:76–83`) — `screen.getByRole('link', …)` + `toHaveAttribute('href', '/demo/orders?selected=order-1')`. Direct template for the new CustomerOrdersTab assertion.

### Established Patterns
- **Test location: `src/components/__tests__/` for sibling components** — CustomersList, Header, OrderDetails, OrdersTable, MillProductionUI all live here. Timeline's co-located test is the `ui/` subfolder exception.
- **Surgical regression test paired with surgical fix** (Phase 29 D-05/D-06 pattern) — when the audit identifies a specific bug class, the test asserts only that bug class. Broader coverage expansion is its own phase.
- **Clean break, no redirects** (Phase 26 D-01, carried forward through 29) — `/orders` 404s. The href edit must point to `/demo/orders`, not rely on a redirect.
- **Atomic commits per concern** — standard GSD pattern. D-12 codifies this for Phase 30.

### Integration Points
- `CustomerOrdersTab` is rendered by `src/components/CustomerDetailTabs.tsx:49` (`<CustomerOrdersTab orders={orders} />`), which is rendered by `src/app/demo/customers/[id]/page.tsx:41` (`<DashboardLayout><CustomerDetailTabs … /></DashboardLayout>`). The render chain is live — the FLOW-07 break is reachable by any authenticated demo user on `/demo/customers/[id]` who opens the Orders tab.
- `CustomerOrdersTab` is a sibling of `Timeline.tsx` in the same render tree. Phase 29 fixed Timeline; Phase 30 fixes the missed sibling. After Phase 30, every `Link` href in the `/demo/customers/[id]` render chain points to a `/demo/*` route.
- Frontmatter backfills target audit-discovered docs-lag only. No verification logic depends on the SUMMARY `requirements-completed` declarations — they exist as the cross-reference index for future milestone audits.

</code_context>

<specifics>
## Specific Ideas

- The **new Jest assertion must check the href value**, not just `getByRole('link')`. The whole point of the regression test is to fail when the path drifts (which is exactly the bug class INT-07 represents).
- **Reuse the Timeline.test.tsx MockLink mock verbatim.** Same library (`next/link`), same need (read `href` off the rendered DOM). Don't invent a new mock pattern.
- **The four frontmatter backfills are documentation-lag closure, not requirement re-verification.** The requirements were already verified satisfied (`VERIFICATION.md` ground truth across phases 25, 26, 29). This phase only updates the per-plan declarations so milestone audits can trace each requirement to a specific plan SUMMARY without falling back to VERIFICATION.md.
- **25-01-SUMMARY gets two new entries (ROLE-02 + NAV-02).** They're independent backfills; the existing `requirements-completed:` block (if present) should be extended with both lines.
- **The audit's "expected scope" is the contract.** ROADMAP.md §Phase 30 enumerates: 1 source edit + 1 Jest assertion + 4 single-line YAML edits. Anything beyond that is scope creep.

</specifics>

<deferred>
## Deferred Ideas

- **Phase 27 VALIDATION.md `nyquist_compliant: false` resolution** — Phase-27-specific tech debt per the audit. Candidate for a follow-up VALIDATION.md reconstruction phase if/when Phase 27 is re-validated. Not a milestone blocker.
- **Broader `CustomerOrdersTab` test coverage** (search filtering, status pills, empty state, status counts, statusCounts memoization correctness) — out of scope here. Candidate for a future component-test-hardening phase that systematically covers all `src/components/*Tab.tsx` components.
- **Lint or codemod for "every Link href in `src/**/*.tsx` resolves to an existing route"** — would prevent the entire INT-01 + INT-07 bug class structurally instead of bug-by-bug. Carried over from Phase 29's deferred list; candidate for a tooling/lint phase, possibly post-v1.5.
- **Re-audit milestone after Phase 30 completes** — write a fresh `v1.5-MILESTONE-AUDIT.md` (re-audit #3) recording closure. This is not a code phase — it's a milestone-summary action, likely handled by `/gsd-audit-milestone` or similar.
- **Replace `getPageTitle` switch in `Header.tsx` with route metadata pattern** — carried over from Phase 29 deferred list. Quality phase, not relevant to ROUTE-01 closure.

</deferred>

---

*Phase: 30-close-gap-int-07-customerorderstab-href-summary-frontmatter-*
*Context gathered: 2026-05-12*
