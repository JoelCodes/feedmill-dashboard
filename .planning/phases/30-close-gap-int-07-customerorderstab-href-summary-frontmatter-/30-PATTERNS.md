# Phase 30: Close gap — INT-07 CustomerOrdersTab href + SUMMARY frontmatter backfill - Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 5 (1 source edit, 1 new test, 3 frontmatter edits)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/CustomerOrdersTab.tsx` (MODIFY) | client component (React) | request-response (Link navigation) | `src/components/ui/Timeline.tsx` (Phase 29 D-05 edit on line 123) | exact (sibling-component, same one-line href shape) |
| `src/components/__tests__/CustomerOrdersTab.test.tsx` (CREATE) | component test (Jest + RTL + jsdom) | request-response (rendered DOM assertion) | `src/components/ui/Timeline.test.tsx` (MockLink + href assertion) + `src/components/__tests__/OrdersTable.test.tsx` (inline `Order[]` fixture, sibling test layout) | exact (split analog: mock+assertion from Timeline; fixture+scaffold from OrdersTable) |
| `.planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md` (MODIFY) | YAML frontmatter | docs metadata | `.planning/phases/29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead/29-02-SUMMARY.md:36-37` | exact (same field, same indent, same `- ROUTE-01` entry) |
| `.planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md` (MODIFY) | YAML frontmatter | docs metadata | `.planning/phases/29-.../29-02-SUMMARY.md:36-37` (shape) + 29-03-SUMMARY (multi-entry precedent) | exact (same field, same indent, two entries) |
| `.planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md` (MODIFY) | YAML frontmatter | docs metadata | `.planning/phases/29-.../29-02-SUMMARY.md:36-37` | exact (same field, same indent, one entry) |

## Pattern Assignments

### `src/components/CustomerOrdersTab.tsx` (client component, request-response)

**Analog:** `src/components/ui/Timeline.tsx` (Phase 29 D-05 edit — git history shows the canonical one-line shape change)

**Current state at the edit site** (`src/components/CustomerOrdersTab.tsx:156-161`):
```typescript
filteredOrders.map((order, index) => (
  <div key={order.id}>
    <Link
      href={`/orders?selected=${order.id}`}
      className={`flex cursor-pointer items-center py-3 transition-colors hover:bg-gray-50`}
    >
```

**Target state** (one-line edit, **line 159 only**):
```typescript
      href={`/demo/orders?selected=${order.id}`}
```

**Edit type:** Single-line replace inside a JSX prop template literal. The leading 14-character indent (6 spaces + `href={\``) and the trailing `${order.id}\`}` must be preserved verbatim — only the 8-character substring `/orders?` becomes `/demo/orders?` (a 5-character delta inserted before `orders`).

**Imports pattern** (lines 1-8, unchanged — confirms client-component + `next/link`):
```typescript
"use client";

import { useState, useMemo } from "react";
import { Package, Search } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { Order, OrderStatus } from "@/types/order";
import { formatDeliveryDate } from "@/utils/formatDate";
import Link from "next/link";
```

**No other edits.** Per CONTEXT.md D-05 ("Single-line edit. No other changes to the file.") and D-11 (scope discipline). Do not touch surrounding markup, `filteredOrders.map`, `STATUS_FILTERS`, `statusCounts`, search input, or filter pills.

**Verification (post-edit) snippet to copy into the plan acceptance criteria:**
```bash
grep -n "href={\`/demo/orders?selected=\${order.id}\`}" src/components/CustomerOrdersTab.tsx
# Expected: exactly one hit at line 159
grep -nE "href=\{\`/orders\?selected=" src/components/CustomerOrdersTab.tsx
# Expected: zero hits
```

---

### `src/components/__tests__/CustomerOrdersTab.test.tsx` (component test, request-response)

**Analog (split):**
- **Mock + assertion shape:** `src/components/ui/Timeline.test.tsx` lines 1, 7-14, 81-82
- **Fixture scaffold + sibling test-file location:** `src/components/__tests__/OrdersTable.test.tsx` lines 1-20

**Imports pattern** — copy verbatim from Timeline.test.tsx:1 + OrdersTable.test.tsx:1-3 + the new component's default-export shape:
```typescript
import { render, screen } from '@testing-library/react';
import CustomerOrdersTab from '../CustomerOrdersTab';
import { Order } from '@/types/order';
```

Note: `CustomerOrdersTab` is a **default export** (`src/components/CustomerOrdersTab.tsx:16` — `export default function CustomerOrdersTab(...)`). OrdersTable is also default-exported (`import OrdersTable from "../OrdersTable";` in OrdersTable.test.tsx:2). The import form `import CustomerOrdersTab from '../CustomerOrdersTab';` matches the established pattern.

**MockLink pattern** (VERBATIM from `src/components/ui/Timeline.test.tsx` lines 7-14 — D-08 locks reuse):
```typescript
// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});
```

**Inline mock fixture pattern** (shape verbatim from `src/components/__tests__/OrdersTable.test.tsx` lines 5-20 — single-element variant; satisfies `Order` interface at `src/types/order.ts:3-17`):
```typescript
const mockOrders: Order[] = [
  {
    id: "order-1",
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

**Why `id: "order-1"`:** Matches the precedent assertion literal in `Timeline.test.tsx:82` (`'/demo/orders?selected=order-1'`). Keeps the new assertion bytewise-mirror of the Phase 29 D-06 assertion, which is the audit's locked-in baseline.

**Why `status: "Producing"`:** `CustomerOrdersTab.tsx:14` defines `STATUS_FILTERS: OrderStatus[] = ["Producing", "Ready", "Complete"]`; with default `activeStatuses = new Set()` (line 18), all orders render unfiltered (line 36-38: `if (activeStatuses.size > 0) { ... }` — gate is false on default state). Either `"Producing"` (matches OrdersTable precedent) or `"Pending"` would render. Choose `"Producing"` to mirror OrdersTable.test.tsx:16 verbatim.

**Single-link assertion pattern** (VERBATIM shape from `src/components/ui/Timeline.test.tsx:81-82` — Phase 29 D-06 precedent):
```typescript
const link = screen.getByRole('link');
expect(link).toHaveAttribute('href', '/demo/orders?selected=order-1');
```

Note: Timeline.test.tsx:81 uses `screen.getByRole('link', { name: /View Order Details/i })` because Timeline has multiple ARIA-link candidates after expansion. CustomerOrdersTab with a **single-order fixture** has exactly one rendered `<Link>` per row → exactly one `<a>` after MockLink replacement → `getByRole('link')` is unambiguous (no `name:` filter required). This matches the D-09 minimal-scope decision and Pitfall 1 in RESEARCH.md.

**Full test scaffold** (assembly of the four patterns above — copyable template the executor mirrors line-by-line):
```typescript
import { render, screen } from '@testing-library/react';
import CustomerOrdersTab from '../CustomerOrdersTab';
import { Order } from '@/types/order';

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

const mockOrders: Order[] = [
  {
    id: "order-1",
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

describe('CustomerOrdersTab', () => {
  it('renders order row link with /demo/orders?selected=<id> href', () => {
    render(<CustomerOrdersTab orders={mockOrders} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/demo/orders?selected=order-1');
  });
});
```

**Test scope discipline (D-09):** Exactly one `it(...)` test asserting href shape. Do NOT add: search-input tests, filter-pill tests, empty-state tests, `statusCounts` memoization tests, hover-state tests, multi-order link tests, accessibility tests, `jest-axe` integration. Those are all out-of-scope per D-09; broader coverage is a future test-hardening phase.

**Error handling pattern:** Not applicable — pure render-and-assert; no error paths under test. If `getByRole('link')` finds zero or multiple links, Jest throws synchronously and the test fails (this is the desired RED behavior during TDD pre-fix verification).

**Validation pattern (RED → GREEN cycle, mirrors Phase 29 D-06):**
1. Create the test file FIRST with `/demo/orders?selected=order-1` assertion.
2. Run `npm test -- --testPathPattern=CustomerOrdersTab` → RED. Diff message expected: `Expected '/demo/orders?selected=order-1', received '/orders?selected=order-1'`.
3. Apply the one-line edit at `CustomerOrdersTab.tsx:159`.
4. Re-run `npm test -- --testPathPattern=CustomerOrdersTab` → GREEN.
5. (Plan-merge gate) Run `npm test -- --testPathPattern="Timeline|CustomerOrdersTab"` → both green.

---

### `.planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md` (YAML frontmatter, docs metadata)

**Analog:** `.planning/phases/29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead/29-02-SUMMARY.md` lines 36-37

**Current frontmatter shape** (verified — `requirements-completed:` field is ABSENT; sibling fields use 2-space indent):
```yaml
dependencies:
  requires: [26-01, 26-02]
  provides: [demo-routes, demo-orders, demo-customers, demo-mill-production]
  affects: [navigation, routing]

tech_stack:
  added: []
  patterns: [DashboardLayout-wrapper, pathname-remapping]
```

**Anchor and insertion point:** Insert after the closing of the `dependencies:` block (after line 11 `affects: [navigation, routing]`) and before the blank line preceding `tech_stack:` (line 13). Exact placement: between lines 11 and 13, inserting a new blank line + 2-line block, so the result reads:
```yaml
dependencies:
  requires: [26-01, 26-02]
  provides: [demo-routes, demo-orders, demo-customers, demo-mill-production]
  affects: [navigation, routing]

requirements-completed:
  - ROUTE-01

tech_stack:
```

**Verbatim block to insert** (mirrors 29-02-SUMMARY.md:36-37):
```yaml
requirements-completed:
  - ROUTE-01
```

**Indent:** Top-level key flush-left; list item prefixed with exactly 2 spaces then `- ` (matches 29-02-SUMMARY.md:37, where `  - ROUTE-01` has 2 leading spaces). Pitfall 3 in RESEARCH.md cites this exactly.

**Constraints (D-11):** Do not re-date, do not modify `completed:`, `dependencies`, `metrics`, `tasks_completed`, or any other frontmatter field. Pure single-block addition.

---

### `.planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md` (YAML frontmatter, docs metadata)

**Analog:** `.planning/phases/29-.../29-02-SUMMARY.md:36-37` (shape) + Phase 29 precedent that the field can be multi-entry (29-02 single, 29-03 single — but YAML `- ITEM` lists trivially extend).

**Current frontmatter shape** (verified — `requirements-completed:` field is ABSENT):
```yaml
dependency_graph:
  requires: []
  provides: [Role-type, CustomJwtSessionClaims, DashboardLayout-component]
  affects: [middleware, dashboard-pages]
tech_stack:
  added: []
  patterns: [module-augmentation, client-component, layout-composition]
```

**Anchor and insertion point:** Insert after the closing of the `dependency_graph:` block (after line 8 `affects: [middleware, dashboard-pages]`) and before `tech_stack:` (line 10). Note this file uses NO blank lines between top-level keys (unlike 26-03), so the new block must follow the same compact convention.

**Verbatim block to insert** (extends the 29-02 shape to two entries):
```yaml
requirements-completed:
  - ROLE-02
  - NAV-02
```

**Result around the insertion point:**
```yaml
dependency_graph:
  requires: []
  provides: [Role-type, CustomJwtSessionClaims, DashboardLayout-component]
  affects: [middleware, dashboard-pages]
requirements-completed:
  - ROLE-02
  - NAV-02
tech_stack:
  added: []
```

**Indent:** Same 2-space list indent as 29-02-SUMMARY.md:37. Each list item on its own line, prefixed with `  - ` (2 spaces, dash, space).

**Order of entries:** `ROLE-02` then `NAV-02` — matches the alphabetical / requirement-family order used elsewhere in `REQUIREMENTS.md`. Either order is YAML-equivalent; choose this order for reviewer consistency.

**Constraints (D-11):** Do not modify `metrics`, `decisions`, `key_files`, `tech_stack`, `tasks_completed`, or `completed:`. Pure additive single-block change.

---

### `.planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md` (YAML frontmatter, docs metadata)

**Analog:** `.planning/phases/29-.../29-02-SUMMARY.md:36-37` (exact shape — single-entry, identical indent)

**Current frontmatter shape** (verified — `requirements-completed:` field is ABSENT; file uses blank lines between top-level keys):
```yaml
dependency_graph:
  requires: []
  provides:
    - context-aware-sidebar-navigation
  affects:
    - src/components/Sidebar.tsx

tech_stack:
  added: []
  patterns:
    - Route-based context detection using usePathname().startsWith()
```

**Anchor and insertion point:** Insert after the closing of the `dependency_graph:` block (after line 14 `- src/components/Sidebar.tsx`) and the blank line on line 15, before `tech_stack:` on line 16. Result:
```yaml
dependency_graph:
  requires: []
  provides:
    - context-aware-sidebar-navigation
  affects:
    - src/components/Sidebar.tsx

requirements-completed:
  - NAV-01

tech_stack:
```

**Verbatim block to insert** (identical shape to 29-02-SUMMARY.md:36-37 with REQ-ID swap):
```yaml
requirements-completed:
  - NAV-01
```

**Indent:** 2-space list indent. `  - NAV-01` with exactly 2 leading spaces.

**Constraints (D-11):** Do not modify `decisions:`, `key_files:`, `metrics:`, `completed:`, or `duration_minutes:`. Pure additive single-block change.

---

## Shared Patterns

### Pattern A: TDD RED → GREEN cycle for surgical source fix

**Source precedent:** Phase 29 D-05/D-06 (29-02-SUMMARY.md key-decisions, line 30; `patterns-established` line 33-34).

**Apply to:** Plan 30-01 (Task ordering: test-first, then source edit).

**Pattern shape:**
1. Task 1 (RED): Create new component test asserting the **post-fix** href value.
2. Run the test and confirm it fails with the EXACT diff message (`Expected '/demo/...', received '/...'`).
3. Task 2 (GREEN): Apply the surgical source edit at the cited line.
4. Re-run the test and confirm it passes.
5. Both tasks land in a single atomic commit (D-12, commit #1): `fix(30): INT-07 CustomerOrdersTab href + regression test`.

**Why bundled in one commit:** The test prevents regression for the fix it accompanies. Splitting them across commits leaves either a broken test (red CI between commits) or an unprotected fix (no regression net). Phase 29 D-06 establishes the bundle-test-with-fix precedent.

---

### Pattern B: MockLink jest mock for `next/link` (`href`-readable rendered DOM)

**Source precedent:** `src/components/ui/Timeline.test.tsx:7-14` (the ONLY current `jest.mock('next/link', ...)` in the repo — repo-wide grep `grep -rln "jest.mock.*next/link" src/` confirms only Timeline.test.tsx, per RESEARCH.md Sources).

**Apply to:** Every test file that renders a component containing `<Link>` from `next/link` AND needs to assert `href` value. Specifically: new `CustomerOrdersTab.test.tsx`. Future tests that follow the same pattern would copy this mock verbatim.

**Verbatim code:**
```typescript
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});
```

**Critical placement:** Above the `describe(...)` block and above any `import CustomerOrdersTab from '../CustomerOrdersTab';` is NOT required (Jest hoists `jest.mock` calls), but the project convention (Timeline.test.tsx:7) places the mock immediately after imports and before fixtures. Mirror this placement for grep-friendliness.

---

### Pattern C: Inline `mockOrders: Order[]` fixture (no shared fixture directory)

**Source precedent:** `src/components/__tests__/OrdersTable.test.tsx:5-51` (3-element array; the new test uses a 1-element subset).

**Apply to:** New `CustomerOrdersTab.test.tsx` (and any future component test that consumes `Order[]`).

**Rationale:** No `src/__fixtures__/` exists. `src/test/fixtures/` contains only `clerkAuth.ts` (Clerk-specific). Inline mock is the established project convention for `Order` data in component tests. Reusing this shape keeps fixture construction grep-able and identical to the sibling test (`OrdersTable.test.tsx`).

**`Order` type contract** (`src/types/order.ts:3-17` — required fields):
```typescript
export interface Order {
  id: string;
  documentNumber: string;
  customer: string;
  customerId: string;
  textureType: string;
  formulaType: string;
  quantity: number;
  location: string;
  deliveryDate: Date;
  status: OrderStatus;
  hasChanges: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

All 13 fields must be present in each mock object (TypeScript will fail the test compile otherwise).

---

### Pattern D: YAML frontmatter `requirements-completed:` block

**Source precedent:** `.planning/phases/29-.../29-02-SUMMARY.md:36-37` (verbatim shape).

**Apply to:** All three SUMMARY files in plan 30-02 (25-01, 26-01, 26-03). Same block, REQ-ID(s) swapped per file.

**Verbatim block (single entry):**
```yaml
requirements-completed:
  - <REQ-ID>
```

**Verbatim block (multi-entry, for 25-01):**
```yaml
requirements-completed:
  - <REQ-ID-1>
  - <REQ-ID-2>
```

**Indent contract:** Top-level key flush-left (column 0). List items prefixed with exactly 2 spaces + `- ` (column 2 dash, column 4 first identifier char). Matches 29-02-SUMMARY.md:36-37 byte-for-byte except for the REQ-ID literal.

**Placement contract:** Insert as a NEW top-level key immediately after the `dependency_graph:` / `dependencies:` block in each target file. Do not nest inside another key. Do not move adjacent top-level keys.

**Blank-line convention:** Match the surrounding file's convention. 26-03 and 26-01 use blank lines between top-level keys (insert with surrounding blank lines). 25-01 uses no blank lines between top-level keys (insert with no surrounding blank lines).

**Validation hook** (per RESEARCH.md Validation Architecture row "YAML validity"):
```bash
node -e "require('js-yaml').loadAll(require('fs').readFileSync('FILE','utf8'))" && echo OK
```
Exit code 0 = valid YAML. Run on each edited file post-write.

**Audit-trail grep** (per RESEARCH.md Test Map):
```bash
grep -c "^requirements-completed:" FILE   # expect 1
grep -A 4 "^requirements-completed:" FILE | grep -c "<REQ-ID>"   # expect ≥ 1 per ID
```

---

### Pattern E: Atomic commit granularity (D-12)

**Source precedent:** Phase 29 D-12 (atomic commit pattern).

**Apply to:** All commits in Phase 30.

**Commits:**
1. `fix(30): INT-07 CustomerOrdersTab href + regression test`
   - `src/components/CustomerOrdersTab.tsx`
   - `src/components/__tests__/CustomerOrdersTab.test.tsx` (new file)
2. `docs(30): backfill requirements-completed in 25-01, 26-01, 26-03 SUMMARYs`
   - `.planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md`
   - `.planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md`
   - `.planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md`

**Staging discipline:** Use `git add` with explicit file paths per commit. Do NOT use `git add -A` or `git add .`. RESEARCH.md Pitfall 5 cites this.

---

## No Analog Found

(none — every file in scope has a direct, exact in-repo analog)

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All five files map to exact precedents (Timeline.test.tsx, OrdersTable.test.tsx, 29-02-SUMMARY.md, 29-03-SUMMARY.md). |

---

## Metadata

**Analog search scope:**
- `src/components/__tests__/` (sibling component tests location, per D-07)
- `src/components/ui/` (Timeline.test.tsx — co-located test)
- `src/types/` (Order interface)
- `.planning/phases/29-.../` (Phase 29 precedent — closed and verified)

**Files scanned:** 9 (CustomerOrdersTab.tsx, Timeline.test.tsx, OrdersTable.test.tsx, order.ts, 29-02-SUMMARY.md, 25-01-SUMMARY.md, 26-01-SUMMARY.md, 26-03-SUMMARY.md, 30-CONTEXT.md + 30-RESEARCH.md as required reading)

**Files re-read:** 0 (each file read once; targeted limits used for large SUMMARY frontmatter reads)

**Pattern extraction date:** 2026-05-12

**Notes for planner:**
- Plans 30-01 and 30-02 are parallel-safe (disjoint file sets: 30-01 touches `src/`, 30-02 touches `.planning/phases/**/SUMMARY.md`). RESEARCH.md confirms wave 0 for both.
- The `requirements-completed:` field is **absent** in all three target SUMMARY files (not "append to existing list"). Plan tasks must use Edit-tool insertions with surrounding-context anchors, NOT pattern-replacement on a non-existent anchor (RESEARCH.md Pitfall 4).
- Every code/YAML excerpt above is copyable byte-for-byte by the executor. No paraphrase, no synthesis — verbatim from the cited analog source.
