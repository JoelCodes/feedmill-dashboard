---
phase: 30
plan: 01
subsystem: client-components
type: tdd
tags:
  - cleanup
  - href-migration
  - tdd
  - regression-test
requirements-completed:
  - ROUTE-01
dependency-graph:
  requires:
    - Phase 26 (route restructuring established /demo/orders as the canonical route)
    - Phase 29 D-05/D-06 (precedent pattern: one-line href fix + paired Jest assertion)
  provides:
    - FLOW-07 end-to-end (demo customer detail → Orders tab → order detail)
    - Regression test locking the demo-prefixed href on CustomerOrdersTab
  affects:
    - src/components/CustomerOrdersTab.tsx (1 line edit)
    - src/components/__tests__/CustomerOrdersTab.test.tsx (new file, 40 lines)
tech-stack:
  added: []
  patterns:
    - MockLink jest.mock('next/link') verbatim reuse from Timeline.test.tsx (D-08)
    - Single atomic commit bundling source fix + regression test (D-12)
key-files:
  created:
    - src/components/__tests__/CustomerOrdersTab.test.tsx
  modified:
    - src/components/CustomerOrdersTab.tsx
decisions:
  - "D-05 applied: CustomerOrdersTab.tsx:159 href → /demo/orders?selected=${order.id}"
  - "D-06/D-07/D-08 applied: new test at src/components/__tests__/CustomerOrdersTab.test.tsx using verbatim MockLink pattern from Timeline.test.tsx"
  - "D-09 applied: minimal scope — single it() block, single-element fixture, href-only assertion"
  - "D-12 applied: source edit + test landed in one atomic commit (35afd69)"
metrics:
  duration: "≈25 minutes"
  completed: "2026-05-12"
  tasks-total: 2
  tasks-completed: 2
  files-changed: 2
  tests-added: 1
  tests-passing: 376 (375 baseline + 1 new)
  tests-failing-deferred: 14 (pre-existing /settings ClerkProvider failures, Phase 29 D-04 deferral)
must_haves:
  decisions_covered:
    - "D-01: scope — INT-07 (sole v1.5 blocker) is in scope"
    - "D-02: mirroring Jest component test on CustomerOrdersTab is in scope"
    - "D-05: CustomerOrdersTab.tsx:159 href → /demo/orders (sibling-component application of Phase 29 D-05)"
    - "D-06: new test file src/components/__tests__/CustomerOrdersTab.test.tsx asserts rendered href shape"
    - "D-07: test location is src/components/__tests__/ (matches sibling-component convention)"
    - "D-08: reused jest.mock('next/link') MockLink pattern verbatim from Timeline.test.tsx"
    - "D-09: test scope minimal — href shape only; no broader CustomerOrdersTab coverage"
    - "D-12: source edit + test file landed in a single atomic commit"
  truths:
    - "CustomerOrdersTab order-row Link href navigates to /demo/orders?selected=<orderId> (the live route after Phase 26)"
    - "An automated component test asserts the demo-prefixed href shape on CustomerOrdersTab, preventing this exact regression class on the sibling component Phase 29 missed"
    - "FLOW-07 (demo user → /demo/customers/[id] → Orders tab → click row → /demo/orders?selected=<id>) is wired end-to-end (no 404)"
  artifacts:
    - path: src/components/CustomerOrdersTab.tsx
      provides: "Order-row Link that points to the live /demo/orders route at line 159"
      contains: "/demo/orders?selected="
    - path: src/components/__tests__/CustomerOrdersTab.test.tsx
      provides: "Component test asserting the demo-prefixed href shape on a rendered order row"
      contains: "/demo/orders?selected=order-1"
      min_lines: 20
  key_links:
    - from: src/components/CustomerOrdersTab.tsx
      to: /demo/orders route
      via: next/link href template literal at line 159
      pattern: "href=\\{`/demo/orders\\?selected="
    - from: src/components/__tests__/CustomerOrdersTab.test.tsx
      to: CustomerOrdersTab.tsx href shape
      via: toHaveAttribute assertion against single-order fixture
      pattern: "toHaveAttribute\\('href', '/demo/orders\\?selected=order-1'\\)"
---

# Phase 30 Plan 01: INT-07 CustomerOrdersTab href + Regression Test Summary

**One-liner:** Closed v1.5's sole remaining audit blocker (INT-07) by fixing the `CustomerOrdersTab.tsx:159` href from the deleted `/orders` route to `/demo/orders` and paired the 5-character source edit with a Jest regression test (mirroring Phase 29 D-06 on Timeline.tsx) — bundled into a single D-12 atomic commit.

## What Shipped

- **One-line href fix** at `src/components/CustomerOrdersTab.tsx:159`: `` `/orders?selected=${order.id}` `` → `` `/demo/orders?selected=${order.id}` ``. Restores FLOW-07 (demo user → `/demo/customers/[id]` → Orders tab → click row → `/demo/orders?selected=<id>`); previously the link 404'd on the deleted `/orders` route.
- **New regression test** at `src/components/__tests__/CustomerOrdersTab.test.tsx` (40 lines, 1 it() block). Renders `<CustomerOrdersTab orders={mockOrders} />` with a single-element `Order[]` fixture (`id: 'order-1'`, `status: 'Producing'`) and asserts `screen.getByRole('link').toHaveAttribute('href', '/demo/orders?selected=order-1')`. Uses the verbatim `MockLink` jest.mock('next/link') pattern from `Timeline.test.tsx` lines 7–14 (D-08).
- **Atomic D-12 commit** (`35afd69`) bundles source + test together. Commit message: `fix(30): INT-07 CustomerOrdersTab href + regression test`.

## How It Works

The TDD cycle ran exactly as planned:

1. **RED:** Created the test file first; ran `npm test -- --testPathPatterns=CustomerOrdersTab`; observed the expected failure with output `Expected: "/demo/orders?selected=order-1"` vs `Received: "/orders?selected=order-1"` — proving the assertion fires against line 159 of the source. (Transient RED commit `5a36f05` created for TDD gate compliance.)
2. **GREEN:** Applied the 5-character `/demo` prefix insertion at `CustomerOrdersTab.tsx:159`; re-ran the targeted test; observed PASS (1 passed, 0 failed); full suite re-run shows 375 passing + 1 new = 376 passing.
3. **Atomic commit:** Soft-reset the RED commit so the test stayed staged, then committed both files together as the D-12 atomic `fix(30): …` commit (`35afd69`). This preserves the D-12 atomicity contract while the RED-commit-gate predicate is satisfied by the transient RED commit during the GREEN phase.

The MockLink pattern is what makes the assertion possible: `next/link` is mocked to render `<a href={href}>{children}</a>`, so the rendered DOM exposes `href` directly to `toHaveAttribute`.

## Key Decisions Made

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| D-05: One-line href fix at line 159 | Mirrors Phase 29 D-05 on Timeline.tsx:123; surgical fix scoped to the exact INT-07 audit finding | Applied; 5-character edit |
| D-06/D-07: New test at `src/components/__tests__/CustomerOrdersTab.test.tsx` | Matches sibling-component convention (CustomersList/Header/OrderDetails/OrdersTable/MillProductionUI all use `__tests__/`) | Applied; test file created |
| D-08: Verbatim MockLink reuse from Timeline.test.tsx | Same library, same need (read `href` off DOM) — don't invent a new mock | Applied byte-for-byte |
| D-09: Minimal scope — href shape only | Audit explicitly scoped to "1 Jest assertion verifying rendered <a> href shape" — broader coverage is scope creep | Applied; exactly one it() block |
| D-12: Single atomic commit | Pairs the regression test with the fix it prevents (Phase 29 atomic-commit pattern) | Applied via soft-reset + amend pattern |

## Deviations from Plan

**None requiring user attention.** The plan executed exactly as written. Two minor process notes:

1. **Jest CLI flag drift:** The plan and validation docs use `--testPathPattern` (singular); current Jest version in this repo requires `--testPathPatterns` (plural — Jest 30 renamed the option). I used the correct plural form. No behavioral impact; identical match semantics. Not tracked as a deviation since it's a tooling-version detail outside the plan's authority. [Rule 3 — auto-fix blocking issue, tool-syntax-only]

2. **D-12 atomicity via soft-reset + amend:** The orchestrator prompt's "Preferred: option (a) — soft-reset before final commit" was followed. After soft-reset the source edit needed an explicit `git add` (it had been unstaged during the RED phase); after the initial atomic commit landed missing one file, a `git commit --amend --no-edit` brought the source file into the atomic commit. The amend operates on a commit I just created in this same execution (not pre-existing work), so it's safe under the git-safety protocol. Final commit `35afd69` contains exactly the two intended files.

## Pre-existing Failures Not Caused By This Plan

`npm test` full suite reports 14 failing tests, all in `src/app/settings/__tests__/page.test.tsx` (ClerkProvider context errors). Per `30-CONTEXT.md` §"Out of scope": *"The 14 pre-existing failing /settings ClerkProvider tests (Phase 29 D-04 deferred)"* — these failures predate this plan, are not regressions caused by this plan's edits, and are explicitly out of scope. `git diff e270376..HEAD --name-only` confirms my commits only touched `src/components/CustomerOrdersTab.tsx` and `src/components/__tests__/CustomerOrdersTab.test.tsx` — neither file is involved in any of the failing settings tests.

## Verification Evidence

All acceptance criteria from `30-01-PLAN.md` are satisfied:

| Check | Expected | Actual |
|-------|----------|--------|
| Test file exists | `test -f src/components/__tests__/CustomerOrdersTab.test.tsx` → `OK` | ✓ |
| Demo-prefixed assertion literal count | `grep -c "/demo/orders?selected=order-1"` returns `1` | ✓ |
| MockLink mock present | `grep -c "MockLink.displayName = 'MockLink'"` returns `1` | ✓ |
| Single it() block | `grep -c "  it("` returns `1` | ✓ |
| Default-import form | `grep -c "^import CustomerOrdersTab from '../CustomerOrdersTab';"` returns `1` | ✓ |
| Source contains demo-prefixed template | `grep -cF 'href={`/demo/orders?selected=${order.id}`}'` returns `1` | ✓ |
| Truly-stale `/orders?selected=` repo-wide (quote/backtick-prefixed) | zero hits in `src/` | ✓ zero hits |
| Targeted test passes | `npm test -- --testPathPatterns=CustomerOrdersTab` exits 0 | ✓ 1 passed, 0 failed |
| Commit subject | `fix(30): INT-07 CustomerOrdersTab href + regression test` | ✓ |
| Files in atomic commit | exactly two: `src/components/CustomerOrdersTab.tsx`, `src/components/__tests__/CustomerOrdersTab.test.tsx` | ✓ |

## Phase Must-Haves (Goal-Backward Verification)

| # | Must-Have | Status |
|---|-----------|--------|
| 1 | `src/components/CustomerOrdersTab.tsx:159` contains `/demo/orders?selected=` (not `/orders?selected=`) | ✓ Verified: line 159 reads `href={\`/demo/orders?selected=${order.id}\`}` |
| 2 | `src/components/__tests__/CustomerOrdersTab.test.tsx` exists with at least one `toHaveAttribute('href', '/demo/orders?selected=...')` assertion | ✓ Verified: 1 such assertion |
| 3 | `npm test -- --testPathPatterns=CustomerOrdersTab` exits 0 | ✓ Verified: 1 passed, 0 failed |
| 4 | `npm test` full suite exits 0 (no regressions) | ⚠ 375 passing + 14 pre-existing failures (Phase 29 D-04 deferred /settings ClerkProvider tests). My commits introduced zero new failures — see "Pre-existing Failures" section above. |
| 5 | `grep -rE "(^|[^/])/orders\\?selected=" src/` returns zero hits (no stale refs) | ⚠ The literal regex matches `/demo/orders?selected=` (because `o` precedes `/orders` and `o ≠ /`), which is the corrected href, not a stale ref. A stricter sweep targeting truly-stale references (`grep -rE "[\"\\\`']/orders\\?selected=" src/`) returns zero hits, confirming no stale references remain. |

Must-haves 4 and 5 have explanatory notes above; both reflect documentation phrasing issues, not actual scope failures.

## Known Stubs

None. No hardcoded empty values, placeholder text, or unwired data sources introduced. The plan changed exactly 1 line in a production component and added 1 component test — both have real, fully-wired behavior.

## TDD Gate Compliance

- **RED gate (`test(30-01): ...`)** — satisfied: transient commit `5a36f05` was created with the failing test before any source change, then folded into the D-12 atomic commit via soft-reset + amend.
- **GREEN gate (`feat`/`fix(30-01): ...`)** — satisfied: final commit `35afd69` is `fix(30): INT-07 CustomerOrdersTab href + regression test` and the test passes against it.
- **REFACTOR gate** — not applicable: no refactor needed for a 5-character routing edit.

## Self-Check: PASSED

- File `src/components/__tests__/CustomerOrdersTab.test.tsx` exists: FOUND
- File `src/components/CustomerOrdersTab.tsx` modified: FOUND (line 159 contains `/demo/orders`)
- Commit `35afd69` exists in git log: FOUND
- Both files appear in `git log -1 --name-only` for commit `35afd69`: FOUND
- Targeted Jest run passes: FOUND (1 passed)
