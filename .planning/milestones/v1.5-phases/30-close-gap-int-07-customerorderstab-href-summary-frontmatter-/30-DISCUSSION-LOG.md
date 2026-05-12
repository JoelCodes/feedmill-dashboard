# Phase 30: Close gap: INT-07 CustomerOrdersTab href + SUMMARY frontmatter backfill - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 30-close-gap-int-07-customerorderstab-href-summary-frontmatter-
**Mode:** --auto (autonomous; Claude selected recommended option for every gray area; no user interaction)
**Areas discussed:** Scope inclusion, Test location, Test scope, Mock pattern, Frontmatter edit shape, Commit granularity

---

## Scope inclusion (which audit items in this phase)

| Option | Description | Selected |
|--------|-------------|----------|
| INT-07 only (audit blocker) + 4 frontmatter backfills (recommended) | Exactly the audit's "expected scope" enumeration in ROADMAP.md §Phase 30 | ✓ |
| INT-07 only; defer frontmatter backfills to a separate docs-hygiene phase | Splits the work into two phases | |
| INT-07 + frontmatter backfills + Phase 27 VALIDATION.md re-validation | Folds in a Phase-27-level tech debt item | |

**Auto-selection rationale:** ROADMAP.md §Phase 30 explicitly enumerates "1 source edit + 1 Jest assertion + 4 single-line YAML frontmatter edits" — that's the contract. Splitting into two phases adds overhead with no closure-window benefit; folding in Phase 27 VALIDATION is scope creep (not on the audit's milestone-blocker list).

---

## Test location for new CustomerOrdersTab test

| Option | Description | Selected |
|--------|-------------|----------|
| `src/components/__tests__/CustomerOrdersTab.test.tsx` (recommended) | Matches sibling pattern: CustomersList, Header, OrderDetails, OrdersTable, MillProductionUI all in `__tests__/` | ✓ |
| Co-locate as `src/components/CustomerOrdersTab.test.tsx` | Matches Timeline's convention | |

**Auto-selection rationale:** Timeline.test.tsx is co-located because Timeline lives under `src/components/ui/` — that folder uses co-location. `src/components/` (the sibling folder containing CustomerOrdersTab) uses `__tests__/` exclusively. Follow the convention of the folder the file lives in.

---

## Test scope (how much to cover in the new test file)

| Option | Description | Selected |
|--------|-------------|----------|
| href-shape assertion only — minimal regression test (recommended) | Exactly mirrors Phase 29 D-06 — one or two tests asserting `/demo/orders?selected=<id>` | ✓ |
| href-shape assertion + search/filter behaviour | Expands coverage to filtering, status pills, search | |
| Full CustomerOrdersTab test suite | All state, props, empty state, statusCounts | |

**Auto-selection rationale:** Audit explicitly scoped this to "a Jest assertion in CustomerOrdersTab test verifying rendered `<a>` href shape" (mirrors D-06 on Timeline). Broader coverage is its own phase. Surgical regression test paired with surgical fix is the Phase 29 pattern.

---

## Mock pattern for next/link

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse Timeline.test.tsx MockLink verbatim (recommended) | `jest.mock('next/link', () => …)` returning `<a href={href}>{children}</a>` | ✓ |
| Use a different mock approach (manual mock under `__mocks__/`) | More central, but inconsistent with established pattern | |
| Don't mock — let next/link render natively | next/link client component does not work in Jest test environment | |

**Auto-selection rationale:** Same library, same need (read `href` off DOM). Established working pattern in `src/components/ui/Timeline.test.tsx`. No reason to deviate.

---

## SUMMARY frontmatter edit shape

| Option | Description | Selected |
|--------|-------------|----------|
| Single-line YAML additions to existing `requirements-completed:` lists (recommended) | Append `- ROUTE-01` / `- ROLE-02` / `- NAV-02` / `- NAV-01` to existing blocks; create the block if absent | ✓ |
| Rewrite each entire SUMMARY frontmatter | Touches more lines, risks unintended diffs | |
| Append at end-of-file outside frontmatter | Would not be picked up by frontmatter readers | |

**Auto-selection rationale:** Audit specifies "4 single-line YAML frontmatter edits across existing SUMMARY.md files (no behavior change)". Minimum-touch approach matches the audit contract and keeps the diff reviewable.

---

## Commit granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Two atomic commits: (1) source+test, (2) frontmatter backfills (recommended) | Couples regression test with its fix; isolates pure docs-hygiene commit | ✓ |
| Single combined commit | Less granular audit trail | |
| Three commits: source / test / frontmatter | Splits test from fix — defeats the "test-with-fix" pattern | |
| Per-file commits (one per SUMMARY edit) | Atomic to a fault; reviewer noise | |

**Auto-selection rationale:** Phase 29's atomic-commit pattern bundles each behavioural change with its regression test. Frontmatter backfills are a separate logical concern (docs-hygiene, no code coupling) so they get their own commit.

---

## Claude's Discretion

- Order mock-fixture construction (reuse existing fixtures vs minimal inline mock) — executor decides during plan-phase.
- Whether the new test file has one or two test cases (single-row href, plus optional multi-row href) — executor decides; minimum is one.
- Exact wording of commit messages — planner/executor follows project commit-style convention.

## Deferred Ideas

- Phase 27 VALIDATION.md `nyquist_compliant: false` resolution → future Phase 27 re-validation.
- Broader CustomerOrdersTab test coverage (search, filter pills, empty state, statusCounts) → candidate for a component-test-hardening phase.
- Lint/codemod for "every Link href resolves to an existing route" → candidate tooling phase (carried over from Phase 29 deferred list).
- Post-Phase-30 milestone re-audit (re-audit #3) → not a code phase; handled by `/gsd-audit-milestone` or equivalent.
- Replace `getPageTitle` switch in `Header.tsx` with route metadata pattern → carried over from Phase 29 deferred list.
