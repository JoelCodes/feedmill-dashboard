# Phase 4: Navigation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 04-navigation
**Areas discussed:** Active state behavior, Sidebar item scope

---

## Active State Detection

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-detect from pathname (Recommended) | Use Next.js usePathname() hook to match current URL to nav item href | ✓ |
| Exact match only | Only highlight if pathname === href exactly (no nested route matching) | |
| Prefix match | /orders highlights Orders for /orders, /orders/123, /orders/history | |

**User's choice:** Auto-detect from pathname (Recommended)
**Notes:** None

---

## Nested Route Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, prefix match (Recommended) | /orders/123 still highlights Orders nav item | ✓ |
| No, exact match only | /orders/123 would have no nav item highlighted | |
| You decide | Let Claude pick what makes sense for this app | |

**User's choice:** Yes, prefix match (Recommended)
**Notes:** None

---

## Sidebar Item Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Production section only | Dashboard, Production, Orders, Inventory, Shipments — Settings stays # for now | ✓ |
| All items including Formulas | Wire up Formulas in Settings section too | |
| Just fix existing # placeholders | Only change # to real routes, create stub pages as needed | |

**User's choice:** Production section only
**Notes:** None

---

## Stub Page Content

| Option | Description | Selected |
|--------|-------------|----------|
| Empty page with title | Just page name as header, keeps routing functional | ✓ |
| Coming soon placeholder | Styled placeholder indicating future content | |
| Copy Dashboard layout structure | Use same Sidebar + main area layout, empty main content | |
| You decide | Let Claude pick based on existing patterns | |

**User's choice:** Empty page with title
**Notes:** None

---

## Claude's Discretion

- Route path naming conventions (kebab-case, singular vs plural)
- Exact stub page layout structure
- Whether to extract a shared layout component or use Next.js route groups

## Deferred Ideas

- Settings section navigation (Formulas page)
- Page-specific content beyond stub title
- Breadcrumb navigation
