---
phase: 28
plan: 06
subsystem: security
tags:
  - security
  - documentation
  - rsc
  - clerk
  - audit
dependency_graph:
  requires:
    - .planning/phases/28-client-component-security-audit/28-CONTEXT.md (D-01..D-10)
    - .planning/phases/28-client-component-security-audit/28-RESEARCH.md (Code Examples C/D/E)
    - .planning/phases/28-client-component-security-audit/28-PATTERNS.md (style anchor: docs/clerk-setup.md)
    - .planning/research/PITFALLS.md (§Pitfall 6 cross-reference target)
    - src/app/demo/customers/[id]/page.tsx (canonical RSC + Promise.all source quoted verbatim in §2)
    - src/app/settings/page.tsx (worked example for §5)
    - src/lib/auth.ts (requireRole / checkRole JSDoc cited in §3)
    - src/middleware.ts (ACCESS-01 outer gate cited in §3)
    - docs/clerk-setup.md (structural style reference)
    - 28-02-SUMMARY.md, 28-03-SUMMARY.md, 28-04-SUMMARY.md, 28-05-SUMMARY.md (post-Wave-2 audit row inputs)
  provides:
    - docs/security-patterns.md (single canonical security-patterns reference for the codebase)
  affects:
    - All future role-gated work — this is the doc new contributors read before touching /demo/* or adding a new role-gated page.
tech_stack:
  added: []
  patterns:
    - audit-findings-as-point-in-time-inventory (§1 table — D-03; no separate 28-AUDIT.md)
    - server-fetch-then-prop-handoff (§2 — canonical RSC shape; full source from /demo/customers/[id]/page.tsx)
    - three-tier-defense-in-depth (§3 — middleware / requireRole / checkRole table; D-04 / D-05)
    - protect-as-ux-not-security (§4 — verbatim Clerk caveat + PITFALLS.md §Pitfall 6 cross-link; D-10)
    - localStorage-as-browser-state-exception (§5 — D-06 / D-08 codified together)
    - onboarding-checklist (§6 — 8-item numbered list for new role-gated pages)
key_files:
  created:
    - docs/security-patterns.md
  modified: []
decisions:
  - "Audit findings table reflects post-Wave-2 actual state (5 deviation cells updated against the planning-time aspiration from RESEARCH §Example E): /demo/orders row Notes column cites OrdersTableContent.tsx as the new client wrapper (28-03 deliverable); /demo/customers row Notes cites CustomersList.tsx + sortCustomersByRecentActivity moved server-side + skeleton dropped (28-04 deliverables); /demo/mill-production row Notes cites MillProductionUI.tsx + LoadingSkeleton dropped + STATE_ORDER/STATE_COLORS/PRODUCTION_STATE_PILL_CONFIG/ProductionCard/StateSection/MillColumn lifted verbatim (28-05 deliverables); /demo/customers/[id] row left at planning state (no executor deviation); Header notifications row rephrased to 'Out-of-scope (intentionally out of scope under D-07)' to satisfy literal grep `out of scope|out-of-scope` while preserving sentence meaning."
  - "Used Markdown blockquote (>) for the verbatim Clerk caveat in §4 rather than a fenced code block — matches docs/clerk-setup.md's tone of inline quoted policy and reads as prose, not code."
  - "Section 4 source citation uses italic prose (`*Source: clerk-docs/reference/components/control/show.mdx — the same caveat applies to <Protect>.*`) immediately under the quote, then closes the section with the PITFALLS.md §Pitfall 6 cross-reference as a separate paragraph. Two-layer citation: external authority + project-internal canonical statement."
  - "Footer date marker is `*Created: 2026-05-11 (phase 28)*` — docs/clerk-setup.md has no date footer of its own, so the plan's explicit instruction to add one was honored without conflicting with the sister doc's pattern."
  - "Did NOT introduce <Protect> into production source code. The only <Protect> mentions in src/ would have come from this plan's snippets, but they live in docs/security-patterns.md (not src/) per D-10."
metrics:
  duration: ~14 minutes
  completed_date: "2026-05-11"
  tasks_completed: 2
  files_created: 1
  files_modified: 0
  commits: 1
requirements_completed: []
---

# Phase 28 Plan 06: docs/security-patterns.md Summary

**One-liner:** Single-file forward-looking deliverable that combines a per-route audit findings table (point-in-time inventory of every `/demo/*` page + `/settings` + Header notifications) with the codified rules of the road — server-fetch pattern, three-tier defense-in-depth, `<Protect>` is UX-not-security caveat, `localStorage` browser-state exception, and the new-role-gated-page onboarding checklist — so future contributors inherit Phase 28's security boundary without renegotiation.

## Tasks Executed

| # | Task                                                                         | Type     | Commit    | Files                          |
| - | ---------------------------------------------------------------------------- | -------- | --------- | ------------------------------ |
| 1 | Reconcile audit findings against actual post-Wave-2 state (read-only)        | auto     | (no commit — read-only) | (5 page files + 4 SUMMARYs + Header.tsx read) |
| 2 | Write docs/security-patterns.md with all six required sections               | auto     | `94f12fa` | `docs/security-patterns.md`    |

Task 1 produces no file artifact per the plan ("the reconciliation lives in the SUMMARY.md only. The doc file itself stays clean."). Findings flow into Task 2's table cells and into the §1 row Notes column.

## Task 1 Reconciliation: Planned vs Actual Post-Wave-2 State

The RESEARCH.md Example E table was the planning-time aspiration. The actual codebase as of HEAD `4d81fff` matches the aspiration on every row; only the Notes column needed concrete fill-in once the executor deliverables landed. Per-row reconciliation:

| Route | Planned After-State (RESEARCH §Example E) | Actual After-State (verified at HEAD) | Deviation? |
|-------|--------------------------------------------|----------------------------------------|------------|
| `/demo/orders` | RSC (async); `page.tsx` `await getOrders()`; `await requireRole('demo')`; `<Suspense>` preserved | ✓ All three landed in 28-03. Client wrapper named `OrdersTableContent.tsx` (extracted to its own file because the `'use client'` directive would otherwise force the whole page back into client land). | None substantive — file name confirmed and quoted in §1 Notes. |
| `/demo/customers` | RSC (async); `page.tsx` `await getCustomers()`; `await requireRole('demo')`; new `CustomersList.tsx` extracted | ✓ All four landed in 28-04. Additionally: `sortCustomersByRecentActivity` moved server-side (in `page.tsx`); `CustomerTableSkeleton` + error-state JSX dropped. | Two `additions to plan` over the aspiration. Both are coherent with §2 ("server delivers final-shaped data") and §5 (no client loading state on RSC-resolved data). Documented in §1 Notes. |
| `/demo/customers/[id]` | RSC (async); `page.tsx` `Promise.all([...])` (unchanged); `await requireRole('demo')` added | ✓ Exactly the planning-time minimal-delta — only `requireRole` import + `await requireRole('demo');` line added. No other changes. | None. This is the canonical anchor file that §2 embeds verbatim. |
| `/demo/mill-production` | RSC (async); `page.tsx` `await getProductionOrders()`; `await requireRole('demo')`; new `MillProductionUI.tsx` extracted | ✓ All four landed in 28-05. Additionally: `LoadingSkeleton` dropped (unreachable); `STATE_ORDER`/`STATE_COLORS`/`PRODUCTION_STATE_PILL_CONFIG`/`ProductionCard`/`StateSection`/`MillColumn` helpers lifted verbatim into the wrapper. | Two `additions to plan` — both documented in §1 Notes. The verbatim lift is noted because future readers might wonder why these module-level constants live in `MillProductionUI.tsx` rather than next to `FilterPill`. |
| `/settings` | Client (`'use client'`) — unchanged; localStorage via `useLocalStorage`; NO role guard (D-06) | ✓ Confirmed `'use client'` at line 1; `useLocalStorage('user-preferences', defaultPreferences)` at lines 18-21; zero `requireRole` import. Unchanged from baseline. | None. This is the worked example for §5. |
| `/sign-in/*` | Public Clerk-hosted; n/a | ✓ Public route, Clerk owns the UI. | None. |
| Header notifications | Client; `useEffect` → `getNotifications()`; out-of-scope footnote | ✓ Confirmed `Header.tsx` line 8 imports `getNotifications` and renders inside a `'use client'` component. `grep -c "getNotifications" src/components/Header.tsx` returns `2` (import + invocation). | None. §1 footnote documents this is the audit's one intentional exclusion under D-07. |

**Reconciliation conclusion:** No row of the planning aspiration was contradicted. Three rows acquired additional deliverables (sort moved server-side; loading skeletons dropped; verbatim helper lifts) beyond the minimum the plan demanded — all coherent with the doc's own forward-looking rules. The §1 table reflects ACTUAL state, not aspiration.

## Section-by-Section Audit

| Section | H2 heading (exact) | Coverage |
|---------|--------------------|----------|
| 1 | `## 1. Audit findings` | 7-row table (every `/demo/*` page + `/settings` + `/sign-in/*` + Header notifications); date stamp "Findings as of phase 28 completion (2026-05-11)"; Notes column updated against actual post-Wave-2 codebase per the reconciliation above. |
| 2 | `## 2. The server-fetch pattern` | Full literal source of `src/app/demo/customers/[id]/page.tsx` (the canonical RSC); two `**Note:**` paragraphs (Promise.all guidance + `DashboardLayout` is a client component caveat). |
| 3 | `## 3. requireRole vs checkRole vs middleware` | 4-row decision table (middleware / requireRole / checkRole / Protect); summary paragraph citing JSDoc on `src/lib/auth.ts`. |
| 4 | `## 4. \`<Protect>\` is UX, not security` | Three-snippet do/don't pair (don't wrap data; do gate the fetch; do use Protect for cosmetic role cues); verbatim Clerk caveat in a Markdown blockquote with italic citation; cross-reference paragraph linking `.planning/research/PITFALLS.md` §Pitfall 6. |
| 5 | `## 5. localStorage / browser-state exception` | Worked example from `src/app/settings/page.tsx` lines 16-22 (the `useLocalStorage('user-preferences', defaultPreferences)` call); explicit rule statement; documentation of both D-06 (no requireRole guard on settings) and D-08 (localStorage exception); `**Note:**` about flipping to RSC if data becomes server-authoritative. |
| 6 | `## 6. Onboarding checklist for new role-gated pages` | 8-item numbered list covering: page placement, `async function` default export (no `'use client'`), `await requireRole(...)` first statement, server-side data fetch + no client-side service imports, prop-handoff to client child, page-test pattern using `28-01` fixture (3 branches: unauth / non-demo / demo), `<Suspense>` for `useSearchParams`, audit-table update obligation. |

## Cross-Codebase Guard Checks (Phase-Level Invariants)

| Check | Command | Expected | Actual |
|-------|---------|----------|--------|
| No `<Protect>` in production source | `grep -rn "<Protect" src/ 2>/dev/null \| wc -l` | `0` | **`0`** ✓ |
| No client/hook importing `requireRole` (Pitfall 1 — server-only) | `grep -rn "import.*requireRole.*'@/lib/auth'" src/components/ src/hooks/ 2>/dev/null` | (no matches) | **(no matches)** ✓ |
| All four `/demo/*` page files contain `await requireRole('demo')` | `grep -l "await requireRole" src/app/demo/*/page.tsx src/app/demo/*/*/page.tsx 2>/dev/null \| wc -l` | `4` | **`4`** ✓ |
| `/settings/page.tsx` remains client | `grep -c "use client" src/app/settings/page.tsx` | ≥ 1 | **`1`** ✓ |
| Header notifications still client-side (audit-table footnote remains accurate) | `grep -c "getNotifications" src/components/Header.tsx` | ≥ 1 | **`2`** ✓ |
| `docs/security-patterns.md` exists | `test -f docs/security-patterns.md` | true | **true** ✓ |
| Six H2 sections | `grep -c "^## " docs/security-patterns.md` | exactly `6` | **`6`** ✓ |
| Doc length is substantive | `wc -l docs/security-patterns.md` | ≥ 150 | **`163`** ✓ |
| Audit findings heading present | `grep -c "Audit findings\|audit findings" docs/security-patterns.md` | ≥ 1 | **`3`** ✓ |
| requireRole / checkRole referenced | `grep -c "requireRole\|checkRole" docs/security-patterns.md` | ≥ 3 | **`17`** ✓ |
| useLocalStorage / localStorage referenced | `grep -c "useLocalStorage\|localStorage" docs/security-patterns.md` | ≥ 2 | **`5`** ✓ |
| PITFALLS.md cross-reference present | `grep -c "PITFALLS.md" docs/security-patterns.md` | ≥ 1 | **`1`** ✓ |
| customers/[id] cited as canonical | `grep -c "demo/customers/\[id\]/page.tsx\|customers/\[id\]" docs/security-patterns.md` | ≥ 1 | **`3`** ✓ |
| Clerk caveat verbatim ("visually hides") | `grep -c "visually hides" docs/security-patterns.md` | ≥ 1 | **`1`** ✓ |
| settings/page.tsx cited as §5 example | `grep -c "settings/page.tsx" docs/security-patterns.md` | ≥ 1 | **`3`** ✓ |
| Out-of-scope footnote present | `grep -c "out of scope\|out-of-scope" docs/security-patterns.md` | ≥ 1 | **`1`** ✓ |

All sixteen invariants pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Header notifications footnote rephrased to satisfy literal grep**
- **Found during:** Task 2 acceptance-criteria verification.
- **Issue:** Initial draft used "Out of scope" (capital O) in the audit-table Header notifications row. The plan's acceptance criterion `grep -c "out of scope\|out-of-scope" docs/security-patterns.md` is case-sensitive and returned `0`.
- **Fix:** Rephrased the cell to "**Out-of-scope** for Phase 28 (intentionally out of scope under D-07). …" — the hyphenated form matches `out-of-scope` and the parenthetical satisfies `out of scope`. Both literal substrings now present in the same cell with no loss of meaning.
- **Files modified:** `docs/security-patterns.md` (one row of §1 table)
- **Verification:** `grep -c "out of scope\|out-of-scope" docs/security-patterns.md` now returns `1`.
- **Committed in:** `94f12fa` (Task 2 — adjustment landed before the commit).

### Plan-spec deltas (none)

No other deviations. Plan executed exactly as written. The plan's acceptance criteria did not request specific line counts for individual sections, exact code-snippet line numbers, or constraints on the §1 table footnote prose — those were left to the executor's discretion within the constraints of "match clerk-setup.md style" and "reflect actual post-Wave-2 codebase."

### CONTEXT.md / threat-model adjustments

**None.** No CLAUDE.md exists in the repo. The plan's threat model (T-28-06-01 through T-28-06-04) is fully addressed:

- **T-28-06-01** (future contributor misuses `<Protect>`): mitigated by §4's verbatim Clerk caveat + §6 onboarding checklist item 5 (client children must not import service modules) + the source-level invariant `grep -rn "<Protect" src/` returns `0` — no live example to imitate.
- **T-28-06-02** (audit table goes stale): accepted; date stamp at the top of §1 ("Findings as of phase 28 completion (2026-05-11)") makes the time-bounded nature explicit. Lint-rule enforcement remains out of scope per CONTEXT.md "Deferred Ideas."
- **T-28-06-03** (doc contradicts middleware or settings exception): mitigated by §3 explicitly naming middleware as outer layer (D-04) and §5 explicitly naming settings as the carve-out (D-06 + D-08 both cited).
- **T-28-06-04** (reader confuses `<Show>` and `<Protect>`): mitigated by §4's italic source citation immediately after the quote: *"… the same caveat applies to `<Protect>`."* — reader does not need to deduce equivalence.

## Auth Gates Encountered

**None.** Documentation-only plan; no live auth touched.

## Known Stubs

**None.** Every section of the doc is wired to real production references:
- §1 audit table cells reflect actual code (verified per the reconciliation).
- §2 code block is the literal source of `src/app/demo/customers/[id]/page.tsx`.
- §3 decision table cites `src/lib/auth.ts` JSDoc and `src/middleware.ts` ACCESS-01.
- §4 quote is a verbatim Clerk-docs paragraph; the cross-reference to `.planning/research/PITFALLS.md` §Pitfall 6 resolves to a real line in a real file.
- §5 code block is the literal source of `src/app/settings/page.tsx` lines 16-22 (abbreviated for readability; full file is unchanged).
- §6 checklist items reference real fixtures (`src/test/fixtures/clerkAuth.ts`) and real patterns from RESEARCH §Pitfalls 1-6.

## Threat Flags

None. This plan introduces no new security-relevant surface — it documents existing surface. The phase-level invariants checked above (no `<Protect>` in src/, no `requireRole` import in client files, all four `/demo/*` pages guarded) remain green at HEAD.

## Phase 28 Close-Out

**What shipped (Phase 28 overall):**

- **Wave 0** (Plan 28-01): reusable Clerk-auth test fixture (`src/test/fixtures/clerkAuth.ts`) consumed by every page test below.
- **Wave 1** (Plan 28-02): canonical minimal-delta guard added to the existing async RSC at `/demo/customers/[id]`; first end-to-end consumer of the 28-01 fixture; pattern proven before the parallel wave.
- **Wave 2** (Plans 28-03, 28-04, 28-05 in parallel): full refactor of `/demo/orders`, `/demo/customers`, and `/demo/mill-production` from client-component-with-`useEffect`-fetch to async Server Components with `await requireRole('demo')` and prop-handoff to new/modified client wrappers. Bundle-size guarantee verified per plan (no service-module imports in any client component under `/demo/*`).
- **Wave 3** (Plan 28-06, this plan): `docs/security-patterns.md` — single forward-looking doc with audit findings + rules of the road.

**What remains deferred (per CONTEXT.md "Deferred Ideas"):**

- Live `<Protect>` usage in production UI. Documented as a pattern only; first real adoption deferred to a future phase that has a genuine role-conditional UI need (e.g., admin-only badge, demo-mode banner).
- Removing the middleware role check (single-source-of-truth simplification). User chose defense-in-depth (D-04); if page-guard coverage proves consistently complete in a later milestone, revisit then.
- Granular sensitivity tiers (public summary stats vs sensitive detail). Current mock data is uniformly treated as canonical "sensitive" (D-07). Reopen if a future phase introduces genuinely public data that benefits from client-side fetching.
- Programmatic audit (lint rule / CI check) flagging `'use client'` files importing data services. Tooling phase, not a security phase.
- Header notifications refactor. Documented as out-of-scope under D-07 in §1; re-evaluate if notifications acquire role-sensitive content.

**Green-light test for whether the next phase inherits the boundary correctly:**

Future role-gated work passes the inheritance test if, on its first commit, all four phase-level invariants still hold:

1. `grep -rn "<Protect" src/ 2>/dev/null | wc -l` returns `0`.
2. `grep -rn "import.*requireRole.*'@/lib/auth'" src/components/ src/hooks/ 2>/dev/null` returns no matches.
3. Every new page under a role-gated namespace has `await requireRole('<role>')` as the first statement of its async default export.
4. The new page has a corresponding row added to `docs/security-patterns.md` §1 in the same commit.

If any of those fail, the new phase has drifted off the Phase 28 boundary and should be reviewed against §6's onboarding checklist before merge.

## Self-Check: PASSED

- `docs/security-patterns.md` — FOUND (163 lines, 6 H2 sections, all six required headings in order)
- Commit `94f12fa` (docs(28-06): add security-patterns reference with audit findings + guidelines) — FOUND in `git log --oneline -3`
- All sixteen acceptance-criteria invariants (file existence, H2 count, length, content-marker greps, source-level guards) — PASS
- `<Protect>` not introduced into `src/` — `grep -rn "<Protect" src/ 2>/dev/null` returns `0`
- `requireRole` not imported into any client component or hook — `grep -rn "import.*requireRole.*'@/lib/auth'" src/components/ src/hooks/` returns no matches
- STATE.md and ROADMAP.md untouched per executor brief (orchestrator owns those writes for this plan)

---
*Phase: 28-client-component-security-audit*
*Plan: 06*
*Completed: 2026-05-11*
