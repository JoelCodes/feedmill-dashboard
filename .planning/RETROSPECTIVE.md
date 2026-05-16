# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-29
**Phases:** 5 (of 6) | **Plans:** 12 | **Timeline:** 49 days

### What Was Built
- Infrastructure layer with TypeScript types, mock services, StatusBadge component, loading skeletons
- Interactive orders table with multi-status filtering, debounced search, text highlighting, keyboard navigation
- Order details panel with dynamic data display, timeline visualization, change history
- Functional navigation with auto-detecting active state using usePathname() and prefix matching
- Complete header system with global search wiring, notification dropdown, settings page

### What Worked
- **Design → Infrastructure → Build pattern:** Ensured consistent UX before implementation
- **Derived state pattern:** Avoided setState in useEffect across multiple components
- **Outside-in development:** Starting from visual prototype made incremental progress visible
- **Single source of truth patterns:** localStorage-backed read state, STATUS_CONFIG for styling
- **Quick tasks for small fixes:** Timeline connector lines, pending items section handled efficiently

### What Was Inefficient
- **Phase 3 not started:** KPI Cards were deprioritized but remain in v1.0 scope — should have been explicitly deferred earlier
- **ROADMAP.md tracking:** Phase 2 marked incomplete in ROADMAP despite being executed — tracking state drift
- **Quick task cleanup:** 9 quick task directories accumulated without proper status tracking

### Patterns Established
- `usePathname()` with prefix matching for auto-detecting active navigation
- Derived state for selection validation: `validSelectedId = selectedId && visibleIds.includes(selectedId)`
- localStorage-backed state with SSR guard pattern (useLocalStorage hook)
- externalSearchTerm || debouncedSearch priority pattern for multi-source search

### Key Lessons
1. **Defer explicitly, not implicitly:** Phase 3 should have been marked "deferred to v1.1" in ROADMAP.md before starting Phase 4
2. **Clean up quick tasks:** Quick task directories should be archived or deleted at milestone close
3. **Verification human_needed items:** Phase 4 verification gaps should be resolved or acknowledged before milestone close
4. **ROADMAP.md must be updated after execution:** Stale checkboxes (Phase 2 showing unchecked) cause audit confusion

### Cost Observations
- Model mix: Primarily Sonnet for execution, Opus for planning
- Plans executed efficiently: Average ~2-3 minutes per plan
- Total execution time: ~13 minutes for 12 plans

---

## Milestone: v1.1 — Mill Production Dashboard

**Shipped:** 2026-04-29
**Phases:** 4 | **Plans:** 5 | **Timeline:** 2 days

### What Was Built
- Status filter pills design with 4 interaction states (hover, active, multi-select, filtered)
- Expanded mock production orders from 12 to 33 with realistic Book1.xlsx data
- Reusable FilterPill component with generic color props and 11 unit tests
- Multi-select filter toggle behavior for mill production page
- Design token system eliminating all hardcoded hex colors and inline styles

### What Worked
- **TDD for FilterPill:** 11 tests established clear contract before extraction
- **Generic color props:** Made component reusable across orders and mill-production contexts
- **Design tokens in globals.css:** Centralized styling enables future theme support
- **Set<ProductionState> for multi-select:** O(1) has() lookups, clean toggle logic
- **Memoization strategy:** stateCounts (static) vs filteredOrders (dynamic) correctly separated

### What Was Inefficient
- **Quick task cleanup still pending:** 10 quick task directories carry over from v1.0
- **One-liner extraction from SUMMARY.md:** SDK didn't extract properly, required manual fix
- **Verification gap in Phase 06:** human_needed status carried forward without resolution

### Patterns Established
- Design token naming: semantic (text-card-label) over technical (text-11)
- Hex alpha format (#rrggbb38) for opacity variants in CSS variables
- FilterPillColorConfig interface for reusable pill styling
- STATE_ORDER constant for consistent status rendering order

### Key Lessons
1. **TDD pays off for shared components:** FilterPill extraction was clean because tests documented behavior
2. **Static vs dynamic memoization:** Always separate counts (static) from filtered results (dynamic) in filter UIs
3. **Design tokens should happen earlier:** Would have been cleaner to establish tokens before Phase 8 implementation
4. **Quick task hygiene needed:** v1.0 backlog carried into v1.1 — need explicit cleanup phase

### Cost Observations
- Phases completed in 2 days (fast turnaround)
- All 5 plans executed under 10 minutes total
- Jest infrastructure added (one-time cost, now available for future tests)

---

## Milestone: v1.4 — Auth with Clerk

**Shipped:** 2026-05-10
**Phases:** 5 | **Plans:** 9 | **Timeline:** 2 days

### What Was Built
- Clerk SDK integration with ClerkProvider and clerkMiddleware
- Themed sign-in page with 79 CSS variable mappings for design token integration
- Playwright E2E testing infrastructure with 5 parameterized route protection tests
- UserButton in header with sign-out action and loading skeleton
- Production deployment on Vercel with Clerk production keys

### What Worked
- **CSS variable references for theme auto-switching:** Clerk appearance API using `var(--token)` means light/dark theme works without manual sync
- **Parameterized E2E tests:** Single test block covers all 4 protected routes efficiently
- **ClerkLoading + ClerkLoaded pattern:** Clean loading state handling without flash of unauthenticated content
- **Gap closure plans:** 20-03 and 20-04 caught and fixed env var and ThemeToggle issues before UAT
- **Milestone audit before completion:** Surfaced documentation debt early, allowing cleanup

### What Was Inefficient
- **VERIFICATION.md not generated for phases 21-24:** Functional evidence existed in tests/summaries but formal reports skipped
- **Clerk API documentation drift:** Research documented `fallback` prop on ClerkLoaded and `afterSignOutUrl` on UserButton — neither worked in v7.3.3
- **Production E2E blocked:** Clerk 2FA on production instance cannot be disabled without custom domain — infrastructure ready but untestable

### Patterns Established
- `clerkAppearance` config with 79 CSS variable references for comprehensive theme integration
- `ClerkLoading` + `ClerkLoaded` sibling pattern (not nested fallback)
- `afterSignOutUrl` on ClerkProvider (not UserButton) for sign-out redirect
- Playwright webServer health check on public route (/sign-in) instead of root

### Key Lessons
1. **Verify API against installed version:** Research docs don't always match installed package — test props before planning
2. **E2E tests need auth bypass strategy:** Production 2FA blocks automated testing; plan for custom domain or test instance
3. **Documentation debt is acceptable:** Missing VERIFICATION.md files don't block functional completion when test evidence exists
4. **Gap closure plans work:** Catching issues in UAT and creating targeted fix plans is efficient

### Cost Observations
- Fast milestone: 2 days for 5 phases
- Clerk integration mostly straightforward — SDK handles complexity
- E2E test setup (~10 min) provides ongoing regression protection

---

## Milestone: v1.5 — Production Transition

**Shipped:** 2026-05-12
**Phases:** 6 (25-30) | **Plans:** 24 | **Timeline:** 3 days

### What Was Built
- `/demo/*` namespace migration: orders, customers, mill-production relocated with 404s on legacy paths
- Coming Soon homepage at `/` rendered through the shared DashboardLayout
- Role-based access control end-to-end: Clerk session JWT custom template, `CustomJwtSessionClaims`, middleware enforces `demo` role on `/demo/*`
- Server-only `checkRole(role)` and `requireRole(role)` utilities reading session claims directly (no Clerk Backend API call), TDD-driven with 8-case Jest suite
- Async RSC refactor of `/demo/orders`, `/demo/customers`, `/demo/mill-production` with extracted client list components
- Context-aware Sidebar (demo vs production), `DashboardLayout` adopted across all pages including `/settings`
- Playwright E2E expansion: parameterized role-asymmetric route-protection with Clerk auth fixtures and JWT template scenarios
- `docs/security-patterns.md` and `docs/clerk-setup.md` runbooks
- Two integration-closure phases (29, 30) resolving post-audit cross-phase drift

### What Worked
- **Session JWT custom template:** eliminates per-request Clerk Backend API calls in middleware and utilities, simpler and faster
- **TypeScript role types up front:** `CustomJwtSessionClaims` compile-time safety killed an entire class of string-literal bugs
- **Server-only role utilities with TDD:** 8 Jest cases documented contract before implementation, refactors were trivial
- **Async RSC + extracted client list components:** kept sensitive logic off the client without inventing new patterns
- **Clean-break 404 over redirect for legacy paths (D-01):** simpler middleware, no legacy URL contract to maintain
- **Two integration-closure phases (29, 30):** milestone audit caught cross-phase drift; surgical closure phases were the right call versus carrying tech debt forward
- **Re-audit loop:** Phase 29 closed the first audit's gaps; second audit found INT-07 (sibling-component miss); Phase 30 closed it; third audit verified clean. The audit's job is to keep looking until it can't find anything.

### What Was Inefficient
- **Sibling-component miss (INT-07):** Phase 29's INT-01 scope fixed `Timeline.tsx` href but missed the same stale `/orders?selected=` href in `CustomerOrdersTab.tsx`. A grep for the offending path string at planning time would have caught both in one phase instead of two
- **SUMMARY frontmatter documentation lag:** four `requirements-completed:` declarations went unfilled during phase execution and only surfaced as tech debt at audit time; should be enforced earlier in the phase verify step
- **SDK accomplishment extraction noisy:** `gsd-sdk milestone.complete` pulled "One-liner:" header text instead of actual one-liners for most plans — required manual rewrite of the MILESTONES.md entry. The SUMMARY templates' one-liner field is being filled inconsistently across plans

### Patterns Established
- Session JWT custom template + `CustomJwtSessionClaims` interface for type-safe role claims
- Server-only role utilities reading session claims (not Clerk Backend API)
- Async RSC + extracted client list component as the canonical "page needs auth + interactive list" pattern
- DashboardLayout as the single page-wrapper component (no inline Sidebar+Header)
- Context-aware Sidebar via route prefix matching (parallel to v1.0's usePathname() pattern)
- Localhost-pinned Playwright authenticated projects to prevent env leak
- Integration-closure phases as a first-class response to milestone-audit findings (vs. carrying tech debt)

### Key Lessons
1. **Grep for stale path strings before planning route-rename phases:** sibling components hold the same href and will be missed by phase scoping that names files individually. Phase 29 → 30 was an entire extra closure phase that wouldn't have happened with a `git grep "/orders?selected="`
2. **Push session JWT templates over Backend API calls:** the v1.4 decision to call `clerkClient` for role checking was superseded in v1.5 — every Backend API call is a network hop and a Clerk rate-limit unit
3. **Milestone audits are the integration test for phase planning:** a phase can ship green per its own VERIFICATION.md and still leave cross-phase drift. Audits catch this and re-audit loops keep going until clean
4. **Requirements traceability via SUMMARY frontmatter must be enforced at phase-verify time, not at audit time** — by the time the audit catches it, you're back-filling four files instead of one
5. **TDD pays off again for utilities:** the 8-case `checkRole`/`requireRole` suite made the Phase 27 → Phase 29 deletion of the `checkRole` orphan a one-line confidence move

### Cost Observations
- 6 phases / 24 plans in 3 days — comparable per-plan throughput to v1.3 and v1.4
- Two integration-closure phases (29, 30) added ~30% phase count overhead vs. the original 4-phase plan, but closed all audit gaps in the same milestone (no tech debt rollover)
- Re-audit loop ran 3 times; each loop was cheap (single audit agent) vs. shipping with known gaps

---

## Milestone: v2.0 — Mill Production MVP

**Shipped:** 2026-05-16
**Phases:** 7 (31-37) | **Plans:** 52 | **Tasks:** 74 | **Timeline:** 3 days

### What Was Built

- Coming Soon homepage replaced with live mill production dashboard at `/` — three-column DB-backed view (Premix / Excel / CGM), role-aware read-only/edit modes
- Postgres + Drizzle persistence layer on Neon HTTP: 4 tables (production_orders, order_events, import_batches, users), `version`-column optimistic concurrency, `import 'server-only'` enforcement, migration discipline (no push)
- Status transitions with optimistic concurrency + audit trail: 4 server actions (Pending→Mixing→Completed + Block/Resume), `revalidateTag('production-orders')` invariant, locked-conflict UX
- Bulk XLSX import using `read-excel-file` 9.0.9 (SheetJS CVE avoided): preview → commit with row-level errors, duplicate detection, partial-import semantics, 2 MB body cap
- 8 server-aggregated KPI sections closing the v1.0 deferred KPI ask: mill-wide + per-line tons-today, per-column header strip, pending backlog, Pellet/Mash/Crumble mix, 7-day sparkline, blocked exception list, overdue badges
- 30-second polling via `useProductionPolling` hook (`REFRESH_INTERVAL_MS = 30_000`) + `nuqs` URL-synced filter/search (shallow) and drawer key (non-shallow)
- Two closure phases (36, 37): Phase 36 closed BUILD-01 (TypeScript `void` cast on `nuqs setQuery`) + authored Phase 35's VERIFICATION.md + UAT.md; Phase 37 (docs-only) mechanically closed 4 hygiene warnings from the post-Phase-36 audit

### What Worked

- **Three-source requirement traceability:** VERIFICATION.md ⨯ SUMMARY.md frontmatter ⨯ REQUIREMENTS.md traceability cells must all agree. Mechanical surfacing of drift turned the post-Phase-36 audit's "passed_with_warnings" into an actionable 4-item checklist that Phase 37's Wave 1 closed in parallel.
- **`version` column on `production_orders` from day 1 (DATA-02):** retrofitting optimistic concurrency cascades into all action signatures. Putting it in the initial schema kept Phase 33's transition actions clean.
- **Live-DB harnesses for race conditions:** `scripts/test-concurrent-transition.ts` ran 5 iterations × 2 operator invocations = 10 sample points against the real Neon dev DB, eliminating mock-DB false positives that wouldn't have caught the actual UPDATE...RETURNING contract.
- **Phase 36 + 37 as parallel-Wave hygiene phases:** mirrors v1.5 Phase 30 INT-07 pattern. Four independent doc-only plans in Wave 1 with zero file overlap closed all audit warnings in a single audit-replay cycle.
- **`import 'server-only'` source-string TDD (DATA-08):** test asserts on the raw source line, not just runtime behavior — catches accidental removal of the import that would silently leak the DB driver into the Edge bundle.
- **Mutation invariant as definition-of-done:** every server action that mutates data MUST call `revalidateTag('production-orders')` before returning. Enforced in plan-level checklists across Phase 33's 6 action plans; zero stale-cache drift discovered in subsequent integration checks.
- **Yolo mode + worktrees for parallel waves:** Phase 37 Wave 1's 4 independent plans ran in worktrees against separate file targets; no manual coordination needed.

### What Was Inefficient

- **Mock-DB unit tests missed real SQL bugs:** the 5 `getSevenDayTrend` SQL fix commits (`ba54b4a..4d61194`) all passed mock-DB unit tests but failed against real Neon SQL semantics. Backlog candidate for v2.1: KPI SQL integration smoke tests against the real DB.
- **Dev `unstable_cache` invalidation gap:** after `npm run db:seed`, the drawer fetches stale UUIDs and shows "Order not found" until `npm run dev` restarts. Captured in user memory and v2.1 backlog (`/api/revalidate?tag=production-orders` POST endpoint).
- **SUMMARY frontmatter `requirements-completed:` lag (recurrent):** same issue as v1.5. ~22 of 45 v2.0 REQ-IDs went untraced in SUMMARY frontmatter during phase execution, surfaced as a Phase 37 hygiene plan. The v1.5 retrospective lesson "enforce SUMMARY frontmatter at phase-verify, not at audit time" did not become an enforced gate.
- **REQUIREMENTS.md traceability table not flipped at phase close (recurrent):** All 45 cells stayed "Pending" despite VERIFICATION.md SATISFIED status, requiring a dedicated Phase 37 Plan 02. Same root-cause as the SUMMARY-FM lag — phase-verify doesn't gate on REQUIREMENTS.md updates.
- **Pre-existing strict-yaml parse failures in `decisions:` arrays:** 3 SUMMARY files (32-01, 33-02, 34-01) won't strict-parse but the forgiving parser handles them. Surfaced repeatedly during Phase 37 metadata sweeps; deferred to a future strict-yaml-fix sweep.
- **Chain-delegation UAT provenance:** Phase 35 UAT scenarios were operator-confirmed rather than executor-witnessed. Documented transparently but represents a delegation step the executor would normally own.
- **Audit ran 4 times before clean verdict:** pre-Phase-35 (`gaps_found`), post-Phase-35 (`gaps_found`), post-Phase-36 (`passed_with_warnings`), post-Phase-37 (`passed`). Each loop was cheap, but a stricter phase-verify gate could have collapsed loops #3 → final into a single pass.

### Patterns Established

- Neon HTTP driver + `drizzle-orm/neon-http` + `import 'server-only'` line 1 as the canonical RSC-safe DB client
- `version INTEGER DEFAULT 1` + `UPDATE ... WHERE version = $v RETURNING id` as the v2.0 optimistic-concurrency idiom
- `revalidateTag('production-orders')` as the mutation invariant for every server action that writes
- `nuqs` 2.8.9 split-key pattern: `shallow:true` for snappy filter/search updates, `shallow:false` for keys that need RSC re-fetch (drawer)
- `useProductionPolling` hook with exported `REFRESH_INTERVAL_MS` constant — simple `setInterval(() => router.refresh(), N)` over SSE/Pusher complexity
- Live-DB script harnesses (`scripts/test-xlsx-import.ts`, `scripts/test-concurrent-transition.ts`) over mock-DB unit tests for SQL semantics
- Three-source requirement traceability (VERIFICATION ⨯ SUMMARY-FM ⨯ REQUIREMENTS) — mechanical drift detection
- Closure phases (36 = code-fix + missing verification artifacts, 37 = parallel doc hygiene) as the standard response to milestone-audit warnings
- Source-string TDD for boundary-enforcement imports (e.g., `import 'server-only'`)
- `read-excel-file` 9.0.9 + `experimental.serverActions.bodySizeLimit = '2mb'` as the XLSX-upload canonical stack (SheetJS banned)

### Key Lessons

1. **Phase-verify must gate on SUMMARY frontmatter + REQUIREMENTS.md traceability** — this is the second consecutive milestone (v1.5, v2.0) where audit caught these drift items. The v1.5 retrospective lesson didn't translate to enforcement. The next milestone should either (a) bake a phase-verify check that fails when SUMMARY-FM `requirements-completed:` is empty for a satisfied REQ-ID, or (b) accept that a docs-hygiene closure phase per milestone is the cost of doing business.
2. **Mock DB unit tests can't validate real SQL semantics** — `getSevenDayTrend`'s 5 fix commits all passed unit tests. v2.1 should add a thin live-DB smoke harness for query functions, mirroring `scripts/test-xlsx-import.ts`'s shape but for read paths.
3. **Live-DB harnesses pay off for race conditions** — the concurrent-transition script's 10-sample design (5 iterations × 2 invocations) eliminated false positives that flaky-race testing would have allowed. Pattern for any future contention-sensitive code path.
4. **`version` column from day 1 saved a cascade** — optimistic concurrency added retroactively would have touched every action signature in Phase 33. Schema decisions like this belong in the first schema plan, not "we'll add it when we need it."
5. **Yolo mode + worktrees + atomic plan commits make parallel waves cheap** — Phase 37 Wave 1's 4 plans ran fully parallel with zero file overlap, each landing as an atomic commit. The branching strategy `"none"` + worktree merge model is the right configuration for this workflow.
6. **Closure phases beat tech-debt carry** — v2.0 closed 4 hygiene warnings in Phase 37 Wave 1 (parallel, ~4 commits) rather than carrying them into v2.1. This matches the v1.5 INT-07 / Phase 30 pattern; both milestones validate the discipline.

### Cost Observations

- 7 phases / 52 plans / 74 tasks in 3 days — highest plan-throughput-per-day of any milestone, driven by yolo mode + worktree parallelization + atomic plan commits
- Audit re-ran 4 times across the milestone; each loop was a single agent invocation. Cheap relative to shipping with known drift
- Phase 37 (5 plans, docs-only, ran in worktrees parallel) closed all hygiene warnings in the same milestone — no v2.0 tech debt rolled into v2.1
- Two closure phases (36, 37) added ~30% phase count overhead vs. the original 5-phase plan — same pattern and same proportion as v1.5

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 12 | Established Design → Infra → Build pattern |
| v1.1 | 4 | 5 | Added TDD, design tokens, shared component extraction |
| v1.2 | 6 | 15 | Customer management system, activity timeline |
| v1.3 | 4 | 27 | Design system foundation, CVA components, WCAG compliance |
| v1.4 | 5 | 9 | Auth integration, E2E testing, production deployment |
| v1.5 | 6 | 24 | Role-based access control, demo/production split, integration-closure phases |
| v2.0 | 7 | 52 | Real Postgres + Drizzle persistence, optimistic concurrency, bulk XLSX import, 8 KPI sections, closure phase pattern (36+37) |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 | 0% | useDebounce, useLocalStorage hooks |
| v1.1 | 11 | FilterPill 100% | FilterPill component, Jest infrastructure |
| v1.2 | 104 | Services, components | Mock data services, timeline component |
| v1.3 | 304 | CVA components | Design system, jest-axe, WCAG compliance |
| v1.4 | 304 + 5 E2E | Auth, routes | Clerk SDK, Playwright infrastructure |
| v1.5 | 304+ unit + parameterized E2E | Auth utilities, role guards, RSC pages | `checkRole`/`requireRole`, role middleware, RSC pattern |
| v2.0 | 304+ unit + E2E + live-DB harnesses | Schema, queries, server actions, RSC pages, UI components | Drizzle/Neon stack, `read-excel-file`, `nuqs`, `useProductionPolling`, KPI query layer, optimistic-concurrency pattern |

### Top Lessons (Verified Across Milestones)

1. Derived state pattern avoids React lint violations and cascading renders
2. Outside-in development with visual prototype makes progress visible
3. Single source of truth for state (STATUS_CONFIG, localStorage-backed) prevents drift
4. TDD for shared components ensures clean extraction and documents behavior
5. Design tokens should be established early — retrofitting is more work
6. CSS variable references enable theme auto-switching without manual sync
7. Gap closure plans catch issues efficiently without derailing main execution
8. Milestone audits before completion surface documentation debt early
9. Re-audit loops keep finding gaps until clean — don't ship with known integration drift (v1.5, v2.0)
10. Grep for stale path strings before planning route-rename phases — sibling components will be missed (v1.5)
11. Session JWT custom templates beat per-request Backend API calls for role claims (v1.5)
12. Schema-cascading concerns (`version` for optimistic concurrency) belong in the first schema plan, not retrofitted (v2.0)
13. Live-DB harnesses validate SQL semantics that mock DBs miss; pattern: 5 iterations × 2 invocations for race conditions (v2.0)
14. SUMMARY frontmatter `requirements-completed:` lag is recurrent across v1.5 and v2.0 — phase-verify must gate on it, not audit (v1.5, v2.0)
15. Closure phases (one for code/verification, one parallel for docs) beat tech-debt carry into next milestone (v1.5, v2.0)
