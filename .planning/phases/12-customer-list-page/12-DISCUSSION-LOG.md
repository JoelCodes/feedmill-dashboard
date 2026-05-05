# Phase 12: Customer List Page - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 12-customer-list-page
**Areas discussed:** Row click behavior, Default sort order, Empty state trigger, Loading state

---

## Row Click Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Navigate to /customers/[id] | Full page navigation — detail page replaces list (Recommended: matches Phase 13 'Customer Detail Infrastructure' as separate page) | ✓ |
| Show detail panel | Split view like OrdersTable — keeps list visible with panel on right | |
| You decide | Claude picks based on design patterns | |

**User's choice:** Navigate to /customers/[id]
**Notes:** Aligns with Phase 13 which handles customer detail infrastructure as a separate page route.

---

## Default Sort Order

| Option | Description | Selected |
|--------|-------------|----------|
| Most recent order date | Sort by the delivery date of the customer's most recent order (Recommended: aligns with order-centric dashboard) | ✓ |
| Customer updated date | Sort by customer.updatedAt timestamp from the data model | |
| Combined activity | Consider orders, deliveries, and bin changes — whichever is most recent | |
| You decide | Claude picks based on available data | |

**User's choice:** Most recent order date
**Notes:** Order delivery date is already available in the data model. Customers with no orders will appear at the end.

---

## Empty State Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Search results only | Only when search filters out all customers — assume data always has customers (Recommended: mock data has customers, this is the common case) | |
| Both scenarios | Show for empty search AND if customer list is truly empty (edge case for fresh installs) | ✓ |
| You decide | Claude picks based on typical dashboard patterns | |

**User's choice:** Both scenarios
**Notes:** Handles edge case gracefully where customer list could be truly empty.

---

## Loading State

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton rows | Animated placeholder rows like OrdersTable — shows table structure (Recommended: consistent with existing patterns) | ✓ |
| Centered spinner | Simple loading indicator in center of table area | |
| You decide | Claude picks based on codebase consistency | |

**User's choice:** Skeleton rows
**Notes:** Maintains visual consistency with existing OrdersTable pattern.

---

## Claude's Discretion

None — user made explicit choices for all areas.

## Deferred Ideas

None — discussion stayed within phase scope.
