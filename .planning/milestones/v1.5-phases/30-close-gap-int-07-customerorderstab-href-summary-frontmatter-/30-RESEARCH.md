# Phase 30: Close gap — INT-07 CustomerOrdersTab href + SUMMARY frontmatter backfill — Research

**Researched:** 2026-05-12
**Domain:** v1.5 milestone audit-closure (one-line source fix + Jest regression test + four YAML frontmatter edits)
**Confidence:** HIGH

## Summary

Phase 30 is the second-pass closure of v1.5 milestone audit (re-audit #2, 2026-05-12T23:00:00Z). It mirrors Phase 29's D-05/D-06 pattern exactly: one-line `href` fix in a sibling client component, paired with a Jest assertion that locks the corrected href shape. Plus four single-line YAML frontmatter additions to bring SUMMARY documentation declarations in line with the verified-satisfied ground truth in VERIFICATION.md.

**Independent re-verification confirms all audit claims:**
- `src/components/CustomerOrdersTab.tsx:159` still contains `` href={`/orders?selected=${order.id}`} `` (live grep, this session). [VERIFIED: Read src/components/CustomerOrdersTab.tsx]
- A repo-wide stale-href sweep (`grep -rn "href={" src/ | grep -v "/demo/" | grep -E "/(orders|customers|mill-production)"`) returns **exactly one hit**: CustomerOrdersTab.tsx:159. No siblings remain. [VERIFIED: this session]
- All four target SUMMARY files (25-01, 26-01, 26-03, 29-02 reference) confirmed; none of the three edit-target SUMMARYs currently contains a `requirements-completed:` field — all four edits are *additions* of the field, not appendings to an existing list. [VERIFIED: grep on the three files]

**Primary recommendation:** Execute as two atomic plans, both wave 0, no inter-dependencies. Plan 1 = source fix + regression test (one logical unit per D-12). Plan 2 = four frontmatter edits across three SUMMARY files. Both plans are unblocking; either order works. The fix uses the verbatim `MockLink` jest mock from `src/components/ui/Timeline.test.tsx` lines 8–14 and the verbatim `toHaveAttribute('href', '/demo/orders?selected=…')` assertion shape from line 82.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scope (which audit items are in):**
- **D-01:** INT-07 (sole v1.5 blocker) — one-line href edit at `src/components/CustomerOrdersTab.tsx:159` from `` `/orders?selected=${order.id}` `` to `` `/demo/orders?selected=${order.id}` ``. Mirrors Phase 29 D-05 (Timeline.tsx:123).
- **D-02:** Mirroring Jest component test on `CustomerOrdersTab` — same regression-prevention rationale as Phase 29 D-06 on `Timeline.tsx`.
- **D-03:** All four `requirements-completed` SUMMARY frontmatter backfills are in scope (ROUTE-01 → 26-03, ROLE-02 → 25-01, NAV-01 → 26-01, NAV-02 → 25-01).
- **D-04:** Phase 27 VALIDATION.md `nyquist_compliant: false` is **deferred** (Phase-27-specific tech debt, not milestone-level).

**INT-07 source fix:**
- **D-05:** Change line 159 of `src/components/CustomerOrdersTab.tsx`: `/orders?selected=` → `/demo/orders?selected=`. Single-line edit. No other changes to the file.

**Regression test (mirrors Phase 29 D-06):**
- **D-06:** New file `src/components/__tests__/CustomerOrdersTab.test.tsx`. Render `CustomerOrdersTab` with at least one mock `Order`; assert rendered `<a>` (mocked `Link`) `href` equals `/demo/orders?selected=<order.id>`. Asserts href value, not just link presence.
- **D-07:** Test location is `src/components/__tests__/` (not co-located). Sibling components in `src/components/` (CustomersList, Header, OrderDetails, OrdersTable, MillProductionUI) all use `__tests__/`. Timeline's co-located test is the `ui/` subfolder exception.
- **D-08:** Mock pattern: reuse `jest.mock('next/link', () => …)` MockLink from `src/components/ui/Timeline.test.tsx` lines 8–14 verbatim. Renders `<a href={href}>{children}</a>` so `toHaveAttribute('href', …)` works.
- **D-09:** Test scope minimal — href shape only. NO broader CustomerOrdersTab coverage (search, filter pills, empty state, status counts). Broader coverage is a future test-hardening phase.

**SUMMARY frontmatter backfills:**
- **D-10:** Four single-line YAML edits, no behavior change:
  - `.planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md` → add `- ROUTE-01`
  - `.planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md` → add `- ROLE-02` and `- NAV-02`
  - `.planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md` → add `- NAV-01`
- **D-11:** Do not edit other frontmatter fields. No re-dating, no `dependency_graph` updates, no metric changes. Pure docs-lag closure.

**Commit granularity:**
- **D-12:** Two atomic commits:
  1. `fix(30): INT-07 CustomerOrdersTab href + regression test` — source edit (D-05) + new test file (D-06).
  2. `docs(30): backfill requirements-completed in 25-01, 26-01, 26-03 SUMMARYs` — four YAML edits across three files (D-10).

**Audit-closure verification:**
- **D-13:** Do NOT edit `v1.5-MILESTONE-AUDIT.md` or `v1.5-INTEGRATION-CHECK.md`. They are immutable audit records. A separate re-audit step records closure.

### Claude's Discretion

- **Order mock fixture shape:** Inline minimal `Order` object in the test file vs reuse fixtures (no shared `src/__fixtures__/` exists; the only fixture dir is `src/test/fixtures/clerkAuth.ts` which is Clerk-specific). Inline mock is the established pattern — see `OrdersTable.test.tsx` lines 5–51 (inline `mockOrders: Order[]`).
- **Number of test cases:** Minimum one test asserting href shape on a single rendered row. Optional second test confirming the same shape for multiple rows. Anything beyond is out of scope per D-09.
- **File/line numbers:** Line 159 confirmed accurate as of this research session. Re-grep before applying if drift suspected.

### Deferred Ideas (OUT OF SCOPE)

- Phase 27 VALIDATION.md `nyquist_compliant: false` resolution.
- Broader `CustomerOrdersTab` test coverage (search filtering, status pills, empty state, statusCounts memoization).
- Lint or codemod for "every Link href in `src/**/*.tsx` resolves to an existing route" (carried over from Phase 29 deferred list).
- Re-audit milestone after Phase 30 completes (separate `/gsd-audit-milestone` action, not a code phase).
- Replace `getPageTitle` switch in `Header.tsx` with route metadata pattern (carried over from Phase 29).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROUTE-01 | Existing pages (orders, customers, mill-production) moved to `/demo/*` subdirectory | Live grep confirms CustomerOrdersTab.tsx:159 still uses stale `/orders` path. Phase 29 closed INT-01 (Timeline sibling) — Phase 30 closes the missed CustomerOrdersTab sibling on the same render chain. Frontmatter backfill (26-03 + 29-02 declarations) aligns SUMMARY docs with verified-satisfied state. |
| ROLE-02 (doc-hygiene only) | TypeScript `CustomJwtSessionClaims` interface extended for type-safe role checking | Already verified satisfied per 25-VERIFICATION.md and 25-01-SUMMARY.md prose ("ROLE-02: TypeScript provides autocomplete for `auth.sessionClaims.metadata.role`"). Backfill adds `- ROLE-02` to 25-01-SUMMARY.md `requirements-completed` field (field currently absent). |
| NAV-01 (doc-hygiene only) | Sidebar displays different navigation based on route context | Already verified satisfied per 26-VERIFICATION.md and 26-01-SUMMARY.md prose ("NAV-01: ✅ Sidebar displays context-appropriate navigation"). Backfill adds `- NAV-01` to 26-01-SUMMARY.md `requirements-completed` field (field currently absent). |
| NAV-02 (doc-hygiene only) | DashboardLayout wraps all pages, eliminating layout duplication | Already verified satisfied; declared in 29-03-SUMMARY only. 25-01-SUMMARY.md prose states "NAV-02: DashboardLayout enables consistent layout across dashboard pages" but lacks frontmatter declaration. Backfill adds `- NAV-02`. |

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` exists at the project root or in `.claude/` skill directories (verified this session). No project-specific directives constrain this phase beyond the locked CONTEXT.md decisions and existing GSD workflow rules.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| href string in client component | Browser / Client (rendered JSX) | — | `CustomerOrdersTab` is a Next.js client component (`"use client"` at line 1). The `next/link` href is template-literal interpolation evaluated at render time in the browser-targeted bundle. |
| Regression test assertion | Test infrastructure (Jest + jsdom) | — | Jest 30 with `next/jest.js` integration, jsdom env (`testEnvironment: 'jsdom'`), `@testing-library/react`. The test mocks `next/link` to a plain `<a>` so jsdom can read the rendered `href` attribute. |
| YAML frontmatter edits | Documentation (planning meta) | — | Pure metadata changes to `.planning/phases/**/SUMMARY.md` files. No runtime, no build, no test impact. Consumed by `/gsd-audit-milestone` to trace REQ-ID → plan. |

## Standard Stack

### Core (already installed and configured)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | ^30.3.0 | Test runner | Established project test framework. Configured via `jest.config.ts`. [VERIFIED: package.json + jest.config.ts] |
| @testing-library/react | (next/jest preset) | Component render + DOM queries | Project default. Used by all existing component tests including `src/components/ui/Timeline.test.tsx`. [VERIFIED: imports in Timeline.test.tsx line 1] |
| next/link | ^15.x (Next.js dep) | Client-side navigation primitive | Component-under-test imports this on line 8. The new test must mock it (D-08). [VERIFIED: Read CustomerOrdersTab.tsx line 8] |
| jest-axe | ^10.0.0 | A11y assertions | Used by Timeline.test.tsx for accessibility tests. NOT NEEDED for Phase 30 — D-09 scopes test to href shape only. [VERIFIED: package.json + Timeline.test.tsx line 2] |

**No new dependencies required.** All test infrastructure is in place. Phase 29 already added regression tests using this exact stack.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Jest component test | Playwright E2E | E2E is slower, more brittle, and requires Clerk auth. Component test catches the exact bug class in <1 sec. CONTEXT.md D-06 locks the Jest approach. |
| Inline mock Order object | Shared `src/__fixtures__/orders.ts` | No shared fixture directory exists. `src/test/fixtures/` contains only Clerk auth fixtures. Inline mock matches `OrdersTable.test.tsx` precedent. |
| Custom next/link mock | Reuse Timeline.test.tsx MockLink | CONTEXT.md D-08 locks reuse. Inventing a new mock pattern would add test-infrastructure variability with no benefit. |

**Installation:** None required. All packages already present.

**Version verification:** Skipped per scope — no new packages added.

## Architecture Patterns

### System Architecture Diagram

```
Demo user request: GET /demo/customers/[id]
            │
            ▼
┌────────────────────────────────────────┐
│  src/middleware.ts                     │
│  isDemoRoute → requireRole('demo')     │  (already wired; Phase 25)
└────────────────────────────────────────┘
            │ authorized
            ▼
┌────────────────────────────────────────┐
│  src/app/demo/customers/[id]/page.tsx  │
│  await requireRole('demo')             │  (Phase 27)
│  <DashboardLayout>                     │
│    <CustomerDetailTabs                 │
│      events={events}                   │
│      orders={orders} />                │
│  </DashboardLayout>                    │
└────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│  src/components/CustomerDetailTabs.tsx │
│  activeTab === "activity"              │
│   ? <ActivityTimeline events=…/>       │  (Phase 29 fixed this branch — INT-01)
│   : <CustomerOrdersTab orders=…/>      │  (Phase 30 fixes this branch — INT-07)
└────────────────────────────────────────┘
            │ "orders" tab active
            ▼
┌────────────────────────────────────────┐
│  src/components/CustomerOrdersTab.tsx  │
│  filteredOrders.map(order =>           │
│    <Link                               │
│      href={`/orders?selected=...`}     │  ← LINE 159: BROKEN (404)
│    >...</Link>                         │
│  )                                     │
│  After Phase 30:                       │
│    href={`/demo/orders?selected=...`}  │  ← FIXED, wires to existing route
└────────────────────────────────────────┘
            │ click order row
            ▼
┌────────────────────────────────────────┐
│  src/app/demo/orders/page.tsx          │
│  Already exists (Phase 26)             │
│  Receives ?selected=<id> query param   │
└────────────────────────────────────────┘
```

### Component Responsibilities

| Component / File | Responsibility | Status |
|------------------|----------------|--------|
| `src/components/CustomerOrdersTab.tsx` | Render orders table inside CustomerDetail Orders tab; each row links to order-detail | **EDIT — line 159 href** |
| `src/components/__tests__/CustomerOrdersTab.test.tsx` | Lock the corrected href shape | **CREATE — new file** |
| `src/components/ui/Timeline.test.tsx` | Read-only reference for MockLink + assertion shape | Read only |
| `src/components/CustomerDetailTabs.tsx` | Parent that renders CustomerOrdersTab when "orders" tab active | Read only |
| `src/types/order.ts` | `Order`, `OrderStatus` types for test fixture construction | Read only |
| `.planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md` | Phase 25 Plan 01 summary; phase that built ROLE-02 + NAV-02 | **EDIT — add 2 entries** |
| `.planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md` | Phase 26 Plan 01 summary; phase that built NAV-01 | **EDIT — add 1 entry** |
| `.planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md` | Phase 26 Plan 03 summary; phase that built ROUTE-01 | **EDIT — add 1 entry** |

### Recommended Wave / Plan Structure

```
Wave 0 (no dependencies between plans)
├── 30-01-PLAN.md  source fix + regression test
│     Task 1 (RED):   create src/components/__tests__/CustomerOrdersTab.test.tsx
│                     with failing assertion (expects /demo/orders?...)
│     Task 2 (GREEN): edit src/components/CustomerOrdersTab.tsx line 159
│                     /orders → /demo/orders
│     Atomic commit (D-12 commit #1):
│       fix(30): INT-07 CustomerOrdersTab href + regression test
│
└── 30-02-PLAN.md  SUMMARY frontmatter backfill (parallel-safe)
      Task 1: append `requirements-completed:\n  - ROUTE-01` to
              .planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md
      Task 2: append `requirements-completed:\n  - ROLE-02\n  - NAV-02` to
              .planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md
      Task 3: append `requirements-completed:\n  - NAV-01` to
              .planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md
      Atomic commit (D-12 commit #2):
        docs(30): backfill requirements-completed in 25-01, 26-01, 26-03 SUMMARYs
```

Both plans are wave 0 (no inter-dependencies). They modify disjoint file sets:
- 30-01 touches `src/components/CustomerOrdersTab.tsx` + new `src/components/__tests__/CustomerOrdersTab.test.tsx`
- 30-02 touches three `.planning/phases/**/SUMMARY.md` files

A conservative orchestrator could serialize them (30-01 then 30-02). A parallel orchestrator can run both concurrently; no merge conflicts possible.

### Pattern 1: Mirror Phase 29 D-06 (MockLink + href assertion)

**What:** New Jest test file renders `CustomerOrdersTab` with a single mock `Order`, then asserts the rendered `<a>` (via `screen.getByRole('link')`) carries `href='/demo/orders?selected=<id>'`.

**When to use:** Whenever a `next/link` href value needs structural protection against route-drift bugs. This is the exact pattern Phase 29 D-06 established for `Timeline.test.tsx`.

**Example (template — verbatim adaptation of Timeline.test.tsx):**
```typescript
// Source: src/components/ui/Timeline.test.tsx (Phase 29 D-06 — verified this session)
// File: src/components/__tests__/CustomerOrdersTab.test.tsx (NEW)

import { render, screen } from '@testing-library/react';
import CustomerOrdersTab from '../CustomerOrdersTab';
import { Order } from '@/types/order';

// MockLink pattern — VERBATIM from Timeline.test.tsx lines 8–14 (D-08 locked)
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Inline mock Order — matches OrdersTable.test.tsx pattern (lines 5–51)
const mockOrders: Order[] = [
  {
    id: 'order-1',
    documentNumber: '12345',
    customer: 'Test Farm',
    customerId: 'CUST-001',
    textureType: 'Coarse',
    formulaType: 'Grower',
    quantity: 10,
    location: 'Springfield, IL',
    deliveryDate: new Date('2026-05-15'),
    status: 'Producing',
    hasChanges: false,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
  },
];

describe('CustomerOrdersTab', () => {
  it('renders order row link with /demo/orders?selected=<id> href', () => {
    render(<CustomerOrdersTab orders={mockOrders} />);
    // CustomerOrdersTab renders the order row as <Link>. With MockLink replacing
    // next/link, the rendered DOM is a plain <a href=...>. There is only one
    // link per row, so getByRole('link') is unambiguous for a single-order
    // fixture.
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/demo/orders?selected=order-1');
  });
});
```

**Assertion shape (Phase 29 D-06 precedent, Timeline.test.tsx:82):**
```typescript
expect(link).toHaveAttribute('href', '/demo/orders?selected=order-1');
```
[CITED: src/components/ui/Timeline.test.tsx line 82]

### Pattern 2: YAML frontmatter requirements-completed addition

**What:** Add a `requirements-completed:` block listing satisfied REQ-IDs to a plan SUMMARY.md frontmatter. Place near other dependency/metadata fields.

**Precedent shape (Phase 29 — verified this session):**
```yaml
# From .planning/phases/29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead/29-02-SUMMARY.md
requirements-completed:
  - ROUTE-01

# From 29-03-SUMMARY.md
requirements-completed:
  - NAV-02
```

**Targets — exact additions:**

1. `.planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md`
   ```yaml
   requirements-completed:
     - ROUTE-01
   ```

2. `.planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md`
   ```yaml
   requirements-completed:
     - ROLE-02
     - NAV-02
   ```

3. `.planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md`
   ```yaml
   requirements-completed:
     - NAV-01
   ```

**Placement guidance:** Insert near `dependency_graph`/`dependencies`/`tags` lines, before `metrics:`. Existing frontmatter in target files (verified this session):
- 26-03 has `dependencies:`, `tech_stack:`, `key_files:`, `decisions:`, `metrics:` — append `requirements-completed:` after `dependencies:` block.
- 26-01 has `dependency_graph:`, `tech_stack:`, `key_files:`, `decisions:`, `metrics:` — append after `dependency_graph:` block.
- 25-01 has `dependency_graph:`, `tech_stack:`, `key_files:`, `decisions:`, `metrics:` — append after `dependency_graph:` block.

**Critical:** Do NOT touch any other frontmatter field. No re-dating. No dependency/metric/decision edits. (D-11 locked.)

### Anti-Patterns to Avoid

- **Asserting only link presence (`screen.getByRole('link')` without `.toHaveAttribute(...)`).** The whole point of the test is to catch path drift. A presence-only assertion would have passed on the broken pre-Phase-29 Timeline AND on the still-broken pre-Phase-30 CustomerOrdersTab — useless for regression detection. [CITED: CONTEXT.md §Specifics line 122]
- **Inventing a new `next/link` mock.** D-08 explicitly locks reuse of the Timeline.test.tsx MockLink. The component-under-test imports the real `next/link`; the established mock pattern is the only one verified to work in this project (only Timeline.test.tsx currently mocks `next/link` — [VERIFIED: repo-wide grep]).
- **Adding broader CustomerOrdersTab coverage in this phase.** D-09 explicitly scopes to href shape only. Search/filter/empty-state coverage is a future test-hardening phase.
- **Editing `v1.5-MILESTONE-AUDIT.md` or `v1.5-INTEGRATION-CHECK.md`.** D-13 marks them immutable. Closure is recorded by a separate re-audit run.
- **Touching other frontmatter fields in the SUMMARY edits.** D-11 locked. Re-dating, dependency_graph updates, metric changes are all out of scope — would muddy the audit trail for a pure docs-lag fix.
- **Co-locating the new test (`src/components/CustomerOrdersTab.test.tsx`) instead of `__tests__/`.** D-07 locks the `__tests__/` location to match sibling component tests in the same directory.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reading href off a rendered `next/link` | Custom DOM walker, regex over container.innerHTML | `jest.mock('next/link')` + `toHaveAttribute('href', …)` | next/link is a React component, not a plain `<a>`. Without a mock, `getByRole('link')` returns the rendered output but reading `.href` includes the jsdom-resolved base URL. MockLink + `toHaveAttribute` is the canonical, established project pattern (Timeline.test.tsx). |
| YAML frontmatter parsing / validation | Custom YAML script | `npx --yes js-yaml` or `node -e "require('js-yaml').load(...)"` for validation in CI | The four edits are single-line additions. A pre-flight YAML parse in the verification step catches malformed indentation. Don't write a custom YAML walker. |
| Asserting "no other stale `/orders` hrefs remain" | Custom AST walker | `grep -rE "(^\|[^/])/orders\?selected=" src/` | The exhaustive sweep this session showed grep is sufficient — exactly one hit, the known INT-07 location. |

**Key insight:** Both the source fix and the test are deceptively small (one string, one assertion), but the *value* is structural: the test would have caught INT-01 + INT-07 had it existed during Phase 26. Don't expand scope by reaching for broader instrumentation — the surgical fix-plus-test pattern is the project's established response to this bug class (Phase 29 D-05/D-06 set the precedent and Phase 30 mirrors it exactly).

## Common Pitfalls

### Pitfall 1: `getByRole('link')` ambiguity with multiple orders rendered

**What goes wrong:** If the test fixture has multiple orders, `screen.getByRole('link')` throws because it expects exactly one match.

**Why it happens:** `CustomerOrdersTab` renders one `<Link>` per filtered order. With N orders, jsdom sees N links.

**How to avoid:** Either (a) use a single-order fixture so `getByRole('link')` is unambiguous (preferred for the minimal D-09 scope), or (b) use `screen.getAllByRole('link')[0]`, or (c) scope the query via a containing element (e.g., search by document number text first). Pattern (a) is what `Timeline.test.tsx:81` uses — single-event fixture, unambiguous query.

**Warning signs:** Jest error message `"Found multiple elements with role 'link'"`.

### Pitfall 2: Test passes against broken implementation (false negative)

**What goes wrong:** The assertion is written but doesn't actually exercise the line-159 href. Result: test still passes after a future regression breaks the path.

**Why it happens:** Possible causes — (1) MockLink mock not applied (mock declared after import, missing module path); (2) assertion checks a different element (filter pill instead of order link); (3) fixture has no `filteredOrders` so the link isn't rendered at all (Order array empty after status filter).

**How to avoid:** TDD discipline. Write the test FIRST asserting `/demo/orders?selected=order-1`. Run `npm test -- --testPathPattern=CustomerOrdersTab` BEFORE fixing line 159. Confirm RED with the exact diff message: "Expected `/demo/orders?selected=order-1`, received `/orders?selected=order-1`." THEN fix line 159 and confirm GREEN. This mirrors the Phase 29 D-05/D-06 RED-GREEN cycle (29-01-PLAN.md Task 1 → Task 2). [CITED: 29-01-PLAN.md acceptance_criteria]

**Warning signs:** Test passes on first run before the line-159 fix is applied.

### Pitfall 3: SUMMARY frontmatter YAML indentation drift

**What goes wrong:** Adding `requirements-completed:\n  - ROUTE-01` with the wrong indentation breaks the YAML and downstream `/gsd-audit-milestone` parsing fails.

**Why it happens:** The four target SUMMARYs use 2-space indentation under top-level keys (verified this session: `dependencies:\n  requires: [...]` in 26-03; `dependency_graph:\n  requires: []` in 26-01 and 25-01). The new `requirements-completed:` block must use the same 2-space indent for its list items.

**How to avoid:** Use `- ROUTE-01` with exactly 2 spaces before the dash. Match the existing pattern: e.g., 29-02-SUMMARY has `requirements-completed:\n  - ROUTE-01` (verified). A pre-commit YAML parse check (e.g., `node -e "console.log(require('js-yaml').load(require('fs').readFileSync('FILE','utf8')))"`) catches indentation drift.

**Warning signs:** Audit tools reporting "frontmatter unparseable" or "requirements-completed: not a list."

### Pitfall 4: `requirements-completed:` field doesn't yet exist in target files

**What goes wrong:** A "find-and-append" script assumes the field exists and silently no-ops when it doesn't.

**Why it happens:** Verified this session — *none* of the three edit-target SUMMARYs (25-01, 26-01, 26-03) currently contains a `requirements-completed:` field. All four backfills are *additions* of the field, not list-appendings to an existing field. The closest precedent (29-02, 29-03) added the field as a top-level frontmatter key, post-`dependency_graph`/`dependencies`.

**How to avoid:** Plan tasks must explicitly state "add the `requirements-completed:` field (does not currently exist)." Acceptance criteria should grep for the new field's presence (`grep -c "^requirements-completed:" FILE` returns `1`) AND the new entries.

**Warning signs:** Sed/awk patches that target an anchor pattern not in the file silently fail. Use direct file edits (Edit tool) with the surrounding context block, not pattern-based replacement.

### Pitfall 5: Conflating the source-fix commit with the docs-hygiene commit

**What goes wrong:** Single commit bundles `src/components/CustomerOrdersTab.tsx` + test + four `.planning/**/SUMMARY.md` edits.

**Why it happens:** Convenience.

**How to avoid:** D-12 locked. Two atomic commits — source/test together, frontmatter backfills separate. Use `git add` with explicit file lists per commit, not `git add -A`. This matches Phase 29's atomic-commit pattern and keeps the audit-closure trail clean for reviewers.

**Warning signs:** A single `git status` showing both `src/` and `.planning/` changes staged together before either commit lands.

## Code Examples

Verified patterns from official sources and this codebase.

### MockLink pattern (verbatim from Timeline.test.tsx lines 8–14)

```typescript
// Source: src/components/ui/Timeline.test.tsx:7-14 (verified this session)
// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});
```

### Inline mock Order fixture (verbatim shape from OrdersTable.test.tsx)

```typescript
// Source: src/components/__tests__/OrdersTable.test.tsx:5-21 (verified this session)
const mockOrders: Order[] = [
  {
    id: "ORD-001",
    documentNumber: "12345",
    customer: "Test Farm",
    customerId: "CUST-001",
    textureType: "Coarse",
    formulaType: "Grower",
    quantity: 10,
    location: "Springfield, IL",
    deliveryDate: new Date("2026-05-15"),
    status: "Producing",
    hasChanges: false,
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-01"),
  },
];
```

The `Order` interface (verified this session — `src/types/order.ts:3-17`) requires all 13 fields above. `OrderStatus` is `"Pending" | "Producing" | "Ready" | "In Transit" | "Complete"`. Using `status: "Pending"` would be filtered OUT by the `STATUS_FILTERS` check (`STATUS_FILTERS: OrderStatus[] = ["Producing", "Ready", "Complete"]` — CustomerOrdersTab.tsx:14), but only when status filters are active. With no active filter (default `activeStatuses: Set<OrderStatus> = new Set()` — line 18), all orders render. Either `"Pending"` or `"Producing"` works for the fixture.

### href assertion (verbatim shape from Timeline.test.tsx:82)

```typescript
// Source: src/components/ui/Timeline.test.tsx:76-83 (verified this session)
it('shows View Order Details link when expanded', async () => {
  const user = userEvent.setup();
  render(<Timeline events={mockEvents} />);
  const orderEvent = screen.getByRole('button', { name: 'Order Placed' });
  await user.click(orderEvent);
  const link = screen.getByRole('link', { name: /View Order Details/i });
  expect(link).toHaveAttribute('href', '/demo/orders?selected=order-1');
});
```

**Adaptation for CustomerOrdersTab:** Timeline requires a button click to expand and reveal the link. `CustomerOrdersTab` renders the link directly in the row (CustomerOrdersTab.tsx:156–188 — `filteredOrders.map(...)` returns `<Link>...</Link>` synchronously). So the new test does NOT need `user.click(...)` setup. Direct render → query.

### YAML frontmatter additions (verbatim shape from 29-02-SUMMARY)

```yaml
# Source: .planning/phases/29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead/29-02-SUMMARY.md
# (verified this session via grep)
requirements-completed:
  - ROUTE-01
```

```yaml
# Source: .planning/phases/29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead/29-03-SUMMARY.md
# (verified this session via grep)
requirements-completed:
  - NAV-02
```

## State of the Art

No tech-stack changes since v1.4. No upgrades, no deprecations relevant to this phase.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pre-Phase-26 routes (`/orders`, `/customers`, `/mill-production`) | Demo subdirectory (`/demo/orders`, etc.) | Phase 26 (2026-05-11) | Stale hrefs in client components produce 404s — INT-01 (Timeline, fixed Phase 29) and INT-07 (CustomerOrdersTab, fixed Phase 30) are the discovered instances. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| (none) | All claims verified in this session via direct file reads or grep | n/a | — |

**Empty by design.** Every factual claim in this research was verified by file read or grep against the live tree this session. No `[ASSUMED]` tags appear in the document body.

## Open Questions

None. Scope is fixed by the audit (1 source edit + 1 Jest assertion + 4 frontmatter edits). CONTEXT.md locks all implementation decisions. Independent re-verification confirms the audit's claims are still accurate (no commits have touched the affected files since the audit ran).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node + npm | jest test runner | ✓ | (project uses node 20+ per Next.js 15) | — |
| jest | Test execution | ✓ | ^30.3.0 | — |
| @testing-library/react | Component render in tests | ✓ | (next/jest preset, established) | — |
| jest-axe | Already-installed a11y matcher | ✓ | ^10.0.0 | not needed for this phase |
| next/link (Next.js) | Component import | ✓ | Next.js 15.x | — |
| git | Atomic commits per D-12 | ✓ | system git | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

All dependencies installed and verified via `package.json` + `jest.config.ts` reads this session.

## Validation Architecture

> `workflow.nyquist_validation: true` confirmed in `.planning/config.json`. This section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest ^30.3.0 with next/jest.js integration |
| Config file | `jest.config.ts` (jsdom env, `@/` alias, ignores `e2e/`) |
| Quick run command | `npm test -- --testPathPattern=CustomerOrdersTab` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUTE-01 (closure) | Rendered order row Link has `href='/demo/orders?selected=<order.id>'` | unit (Jest component) | `npm test -- --testPathPattern=CustomerOrdersTab` | ❌ Wave 0 (new file: `src/components/__tests__/CustomerOrdersTab.test.tsx`) |
| ROUTE-01 (docs) | `26-03-SUMMARY.md` frontmatter declares `requirements-completed: [ROUTE-01]` | docs lint | `grep -A 2 "^requirements-completed:" .planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md \| grep -c "ROUTE-01"` returns ≥ 1 | ✅ file exists; field absent (target of plan 02) |
| ROLE-02 (docs) | `25-01-SUMMARY.md` frontmatter declares `requirements-completed:` containing `ROLE-02` | docs lint | `grep -A 4 "^requirements-completed:" .planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md \| grep -c "ROLE-02"` returns ≥ 1 | ✅ file exists; field absent |
| NAV-01 (docs) | `26-01-SUMMARY.md` frontmatter declares `requirements-completed:` containing `NAV-01` | docs lint | `grep -A 2 "^requirements-completed:" .planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md \| grep -c "NAV-01"` returns ≥ 1 | ✅ file exists; field absent |
| NAV-02 (docs) | `25-01-SUMMARY.md` frontmatter declares `requirements-completed:` containing `NAV-02` | docs lint | `grep -A 4 "^requirements-completed:" .planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md \| grep -c "NAV-02"` returns ≥ 1 | ✅ file exists; field absent |
| YAML validity (cross-cut) | All three edited SUMMARY frontmatters parse as valid YAML | yaml-parse | `node -e "require('js-yaml').loadAll(require('fs').readFileSync('FILE','utf8'))"` (per file) exits 0 | js-yaml available via `npx --yes` (no install needed) |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=CustomerOrdersTab` (sub-second; tests only the new file)
- **Per plan merge (30-01):** `npm test -- --testPathPattern="Timeline|CustomerOrdersTab"` (verifies both sibling tests pass together)
- **Per plan merge (30-02):** YAML parse + grep assertions on the three edited SUMMARY files
- **Phase gate:** `npm test` full suite green AND repo-wide stale-href sweep returns zero hits: `grep -rE "(^\|[^/])/orders\?selected=" src/` produces no output

### Wave 0 Gaps
- [ ] `src/components/__tests__/CustomerOrdersTab.test.tsx` — NEW FILE. Covers ROUTE-01 closure regression. Single test: `it('renders order row link with /demo/orders?selected=<id> href', () => {...})`. Optional second test for multi-order fixture (D-09 allows; not required).
- [ ] No framework install needed (Jest already present per `package.json` + `jest.config.ts`).
- [ ] No `jest.setup.ts` changes needed (existing setup loads jest-dom matchers; `toHaveAttribute` is from `@testing-library/jest-dom` which is wired through `next/jest`).

*(No other gaps. The frontmatter edits have no behavioral component; they are validated by grep + YAML parse, not by Jest.)*

### Dimension 8 (Nyquist) Hooks Summary

The Nyquist principle requires that behavioral changes (= source edits) be sampled by automated assertions at a rate sufficient to catch regression. For Phase 30:

| Change | Behavioral? | Sampling Hook |
|--------|-------------|---------------|
| `src/components/CustomerOrdersTab.tsx:159` href edit | YES — produces user-visible navigation difference | `npm test -- --testPathPattern=CustomerOrdersTab` (the new D-06 assertion) |
| 4 YAML frontmatter edits | NO — pure documentation, no runtime/build/test impact | grep + js-yaml parse (`node -e "require('js-yaml').load(...)"`) — no behavioral sampling required, only structural validity |

This phase is Nyquist-compliant if and only if the new test file exists with the asserted href shape AND Wave 0 marks the file present before plan 30-01 closes.

## Security Domain

> `.planning/config.json` does NOT set `security_enforcement: false`. Default is enabled — section included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth changes. Existing Clerk middleware unchanged. |
| V3 Session Management | no | No session changes. |
| V4 Access Control | no | No access control changes. `requireRole('demo')` on `/demo/customers/[id]` is already in place (Phase 27). The href fix changes the post-click destination from a 404 to an existing `/demo/orders` route which is ALSO behind the same `requireRole('demo')` guard. No new attack surface. |
| V5 Input Validation | no | `order.id` is interpolated into a URL template literal that becomes a Next.js client-side route. Next.js's router URL-encodes path/query segments at navigation time, and the destination page validates `?selected=<id>` server-side. No new injection vector introduced (the existing Timeline.tsx pattern after Phase 29 already established this). |
| V6 Cryptography | no | No cryptographic operations. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect via href interpolation | Tampering | Destination is a hard-coded `/demo/orders` path; only the `order.id` interpolates and it is owned data (typed `Order.id: string`, not user input). No external URL or scheme interpolation. |
| XSS via Link href | Tampering | `next/link`'s `href` prop is a navigation directive, not HTML/JS execution context. React's JSX escaping plus Next.js router parsing both prevent script injection. |
| Route enumeration via 404 → 200 transition | Information disclosure | Both `/orders` (404) and `/demo/orders` (auth-guarded 200/redirect) are gated by middleware that fires before page render. Fixing the 404 does not change what an unauthenticated probe learns. |

**No new security surface is introduced by this phase.** The change is a 12-character edit to a string template that already exists in a route gated by both middleware-level and page-level role checks (verified in `v1.5-INTEGRATION-CHECK.md` §"DashboardLayout — 6 Consumers Verified" and §"requireRole — 4 Demo Pages Verified").

## Sources

### Primary (HIGH confidence — verified by direct file read this session)

- `src/components/CustomerOrdersTab.tsx` (read in full) — confirmed line 159 has stale href; file structure and imports documented.
- `src/components/ui/Timeline.test.tsx` (read in full) — MockLink pattern (lines 8–14) and href assertion shape (line 82) confirmed.
- `src/components/CustomerDetailTabs.tsx` (read in full) — render chain CustomerDetailTabs → CustomerOrdersTab confirmed at line 49.
- `src/types/order.ts` (read in full) — `Order` interface fields confirmed for mock fixture construction.
- `src/components/__tests__/OrdersTable.test.tsx` (read partially) — inline `mockOrders: Order[]` pattern confirmed lines 5–51.
- `jest.config.ts` (read in full) — Jest 30 + jsdom + `@/` alias + e2e/ ignore confirmed.
- `package.json` (grep) — `jest ^30.3.0`, `jest-axe ^10.0.0`, `npm test` script confirmed.
- `.planning/config.json` (read in full) — `nyquist_validation: true` and `commit_docs: true` confirmed.
- `.planning/v1.5-MILESTONE-AUDIT.md` (read in full) — INT-07 specification, scope, fix recommendation.
- `.planning/v1.5-INTEGRATION-CHECK.md` (read in full) — independent re-verification of INT-07 + exhaustive sweep table.
- `.planning/phases/30-close-gap-int-07-customerorderstab-href-summary-frontmatter-/30-CONTEXT.md` (read in full) — locked decisions D-01 through D-13.
- `.planning/phases/29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead/29-CONTEXT.md` (read in full) — precedent D-05/D-06 pattern.
- `.planning/phases/29-.../29-01-PLAN.md` (read in full) — concrete two-task RED/GREEN plan structure to mirror.
- `.planning/phases/29-.../29-02-PLAN.md` (read partial) — confirms two-task plan structure for the source-edit-plus-test pattern.
- `.planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md` (read in full) — confirmed `requirements-completed:` field is ABSENT; field will be added, not appended.
- `.planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md` (read in full) — confirmed `requirements-completed:` field is ABSENT.
- `.planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md` (read in full) — confirmed `requirements-completed:` field is ABSENT.
- `.planning/phases/29-.../29-02-SUMMARY.md` and `29-03-SUMMARY.md` (grep) — frontmatter shape confirmed as `requirements-completed:\n  - ROUTE-01` (29-02) and `requirements-completed:\n  - NAV-02` (29-03).
- `.planning/REQUIREMENTS.md` (read in full) — REQ-ID descriptions and traceability table.
- `.planning/ROADMAP.md` §Phase 30 (read partial) — phase scope contract confirmed.
- `.planning/STATE.md` (read in full) — milestone position and resume file confirmed.
- `.planning/codebase/TESTING.md`, `.planning/codebase/CONVENTIONS.md` (read in full) — noted these are dated 2026-03-11 and predate the Jest infrastructure. Live `package.json` + `jest.config.ts` are the authoritative source (used here).
- Repo-wide grep: `grep -rn "href={" src/ | grep -v "/demo/" | grep -E "/(orders|customers|mill-production)"` (this session) — independently confirms INT-07 is the only remaining stale href.
- Repo-wide grep: `grep -rln "jest.mock.*next/link" src/` (this session) — confirms only Timeline.test.tsx currently mocks `next/link`; new CustomerOrdersTab.test.tsx will be the second.

### Secondary (MEDIUM confidence — official-source-aligned but not freshly fetched)

- Next.js 15 client component / next/link behavior — knowledge consistent with the actually-imported `import Link from "next/link"` at CustomerOrdersTab.tsx:8 and Timeline.tsx. Behavior validated by the existing Timeline.test.tsx test passing in the project. [CITED: project test outcomes referenced in v1.5-INTEGRATION-CHECK.md]
- `@testing-library/jest-dom` `toHaveAttribute` matcher — used at Timeline.test.tsx:82 successfully; standard React Testing Library behavior.

### Tertiary (LOW confidence — flagged for validation)

None. All claims in this document are verified by direct file read or grep against the live tree this session.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package.json + jest.config.ts read this session; no new deps required.
- Architecture: HIGH — render chain confirmed via direct file reads of CustomerDetailTabs.tsx + CustomerOrdersTab.tsx.
- Pitfalls: HIGH — drawn from Phase 29 D-05/D-06 precedent (closed and verified) and from the live structural facts of the three target SUMMARY files (`requirements-completed:` absent in all three).
- Validation Architecture: HIGH — Jest config and existing test patterns verified; test command exists; new file location follows D-07 lock.

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (30 days — stable; phase scope is fully locked and verified)
