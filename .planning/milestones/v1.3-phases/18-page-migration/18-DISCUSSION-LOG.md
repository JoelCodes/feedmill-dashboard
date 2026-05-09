# Phase 18: Page Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** 18-page-migration
**Areas discussed:** Migration order, Hardcoded value handling, Component consolidation, Testing approach

---

## Migration Order

### Which page to start with?

| Option | Description | Selected |
|--------|-------------|----------|
| Settings (Recommended) | Simplest page, fewest components. Quick win validates the migration pattern works before tackling complex pages. | ✓ |
| Mill Production | Medium complexity. Uses FilterPill and production cards. Good middle ground. | |
| Orders | Most complex — OrdersTable (14K LOC), OrderDetails (12K LOC), StatusBadge, FilterPill. High impact but higher risk. | |
| Customers | Freshest code (v1.2). Uses ActivityTimeline, BinGauge, CustomerDetailHeader. Tests are most current. | |

**User's choice:** Settings (Recommended)
**Notes:** Start simple to validate the pattern.

### Sequence for remaining pages?

| Option | Description | Selected |
|--------|-------------|----------|
| Mill Production → Orders → Customers (Recommended) | Increasing complexity. Mill Production validates patterns, Orders is the main feature, Customers benefits from all learnings. | ✓ |
| Customers → Mill Production → Orders | Freshest to oldest. Tackles newest code while patterns are fresh, saves hardest for last. | |
| Orders → Mill Production → Customers | Most important first. Gets the core feature done early, even if it's riskier. | |

**User's choice:** Mill Production → Orders → Customers (Recommended)
**Notes:** Increasing complexity builds confidence.

---

## Hardcoded Value Handling

### How to find hardcoded values?

| Option | Description | Selected |
|--------|-------------|----------|
| ESLint errors (Recommended) | Run ESLint on each file — it already blocks hardcoded hex/#xxx and px values. Shows exact locations to fix. | ✓ |
| Grep + manual review | grep -E '#[0-9a-fA-F]{3,6}|\\d+px' to find all matches, manually review each. More control, slower. | |
| Both ESLint and grep | Use grep for initial inventory, then ESLint during actual fixes for enforcement. | |

**User's choice:** ESLint errors (Recommended)
**Notes:** Leverage existing tooling.

### How to pick the right token?

| Option | Description | Selected |
|--------|-------------|----------|
| Direct mapping guide (Recommended) | Create a simple table: #2A9D90 → --primary, #10B981 → --success, 16px → --space-4, etc. Reference during migration. | ✓ |
| Semantic inference | Look at the context (button? badge? text?) and pick semantic token. More thinking per change, but better token fit. | |
| You decide | Claude figures out the best token for each case based on component context and existing patterns. | |

**User's choice:** Direct mapping guide (Recommended)
**Notes:** Explicit mapping reduces ambiguity.

### When to create mapping table?

| Option | Description | Selected |
|--------|-------------|----------|
| Create upfront (Recommended) | First plan creates a mapping table from existing hardcoded values → tokens. Subsequent plans reference it. | ✓ |
| Discover as we go | Start migrating, document mappings when we encounter them. More organic but may duplicate effort. | |

**User's choice:** Create upfront (Recommended)
**Notes:** Front-load the analysis for consistency.

---

## Component Consolidation

### FilterPill location?

| Option | Description | Selected |
|--------|-------------|----------|
| Move to ui/ (Recommended) | It's already reusable with TDD (11 tests). Moving to ui/ makes it official design system. Update imports in both pages. | ✓ |
| Leave in components/ | Keep it where it is, just update to use tokens. It works, no need to reorganize. | |
| Merge into Button | FilterPill is basically a toggle button. Create a Button variant='filter' instead of separate component. | |

**User's choice:** Move to ui/ (Recommended)
**Notes:** Formalize it as design system component.

### Header and Sidebar handling?

| Option | Description | Selected |
|--------|-------------|----------|
| Upgrade in place (Recommended) | Keep in components/, update to use tokens and design system Button/Input where applicable. They're app-specific, not primitives. | ✓ |
| Move to components/layout/ | Create a layout subfolder to distinguish from feature components. More organized but adds a new convention. | |
| Extract primitives only | Pull out reusable pieces (NavItem, SearchInput) to ui/, leave shells in components/. Most modular but more work. | |

**User's choice:** Upgrade in place (Recommended)
**Notes:** They're layout components, not primitives.

### KPICard approach?

| Option | Description | Selected |
|--------|-------------|----------|
| Refactor to use Card (Recommended) | KPICard becomes: <Card onClick=...><Card.Content>icon + stats</Card.Content></Card>. Consistent with design system. | ✓ |
| Keep separate, use tokens | KPICard keeps its own structure, just updates hardcoded values to tokens. Less churn, same visual result. | |
| You decide | Claude picks based on how well KPICard's structure fits the Card compound pattern. | |

**User's choice:** Refactor to use Card (Recommended)
**Notes:** Consistency with design system.

### BinGauge and ActivityTimeline?

| Option | Description | Selected |
|--------|-------------|----------|
| Update to tokens only (Recommended) | Keep in components/, replace hardcoded colors/spacing with tokens. They're feature-specific, not design primitives. | |
| Extract gauge/timeline to ui/ | Make BinGauge a generic gauge component, ActivityTimeline a generic timeline. More reusable but may over-abstract. | ✓ |
| You decide | Claude evaluates whether these have reuse potential beyond customer pages. | |

**User's choice:** Extract gauge/timeline to ui/
**Notes:** User sees reuse potential for gauge (metrics) and timeline (audit logs, activity feeds).

---

## Testing Approach

### When to run tests?

| Option | Description | Selected |
|--------|-------------|----------|
| After each component (Recommended) | Run tests after migrating each component. Catches regressions immediately. ~104 tests, fast feedback. | ✓ |
| After each page | Batch tests per page migration. Faster overall but harder to isolate which change broke what. | |
| At the end only | Run full suite once after all migrations. Fastest but riskiest — hard to debug cascading failures. | |

**User's choice:** After each component (Recommended)
**Notes:** Fast feedback loop.

### Add new tests?

| Option | Description | Selected |
|--------|-------------|----------|
| Token usage tests (Recommended) | Add tests verifying components use tokens (like StatusBadge.test.tsx pattern). Ensures tokens are actually used, not just renamed. | ✓ |
| Visual regression tests | Snapshot component renders before/after. Catches unintended visual changes. More setup but higher confidence. | |
| No new tests | Existing 104 tests plus ESLint enforcement is sufficient. Migration shouldn't change behavior, just implementation. | |
| Both token + visual | Token usage tests AND visual regression. Maximum coverage but more test maintenance. | |

**User's choice:** Token usage tests (Recommended)
**Notes:** Follows StatusBadge.test.tsx pattern established in Phase 17.

---

## Claude's Discretion

None — user provided explicit choices for all areas.

## Deferred Ideas

None — discussion stayed within phase scope.
