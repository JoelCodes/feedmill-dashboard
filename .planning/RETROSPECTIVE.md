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

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 | 0% | useDebounce, useLocalStorage hooks |
| v1.1 | 11 | FilterPill 100% | FilterPill component, Jest infrastructure |
| v1.2 | 104 | Services, components | Mock data services, timeline component |
| v1.3 | 304 | CVA components | Design system, jest-axe, WCAG compliance |
| v1.4 | 304 + 5 E2E | Auth, routes | Clerk SDK, Playwright infrastructure |
| v1.5 | 304+ unit + parameterized E2E | Auth utilities, role guards, RSC pages | `checkRole`/`requireRole`, role middleware, RSC pattern |

### Top Lessons (Verified Across Milestones)

1. Derived state pattern avoids React lint violations and cascading renders
2. Outside-in development with visual prototype makes progress visible
3. Single source of truth for state (STATUS_CONFIG, localStorage-backed) prevents drift
4. TDD for shared components ensures clean extraction and documents behavior
5. Design tokens should be established early — retrofitting is more work
6. CSS variable references enable theme auto-switching without manual sync
7. Gap closure plans catch issues efficiently without derailing main execution
8. Milestone audits before completion surface documentation debt early
9. Re-audit loops keep finding gaps until clean — don't ship with known integration drift (v1.5)
10. Grep for stale path strings before planning route-rename phases — sibling components will be missed (v1.5)
11. Session JWT custom templates beat per-request Backend API calls for role claims (v1.5)
