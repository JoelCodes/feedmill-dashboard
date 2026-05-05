# Phase 14: Activity Timeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 14-activity-timeline
**Areas discussed:** Event types & data, Expand/collapse UX, Performance strategy

---

## Event Data Generation

| Option | Description | Selected |
|--------|-------------|----------|
| Generate from existing data | Derive timeline events from Order/Bin data on the fly. No new data model needed. | |
| Create ActivityEvent type | New persisted event records with explicit timestamp, type, and details. More flexible but requires mock data expansion. | ✓ |
| Hybrid approach | Generate order events from status, but store bin alert events explicitly. | |

**User's choice:** Create ActivityEvent type
**Notes:** User wanted explicit event records rather than derived data.

---

## Event Types Supported

| Option | Description | Selected |
|--------|-------------|----------|
| Order lifecycle only | Events: order_placed, order_modified, production_started, ready_for_pickup, out_for_delivery, delivered | |
| Orders + Deliveries | Order lifecycle events + explicit delivery events as separate type | |
| Orders + Deliveries + Bin alerts | Full scope matching TMLN-01 requirement | ✓ |

**User's choice:** Orders + Deliveries + Bin alerts
**Notes:** Full scope to cover TMLN-01 requirement exactly.

---

## Order Event Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| One event per lifecycle stage | order_placed, production_started, ready, out_for_delivery, delivered as separate events | ✓ |
| One event per order | Single event per order showing current state | |
| Key milestones only | Only placed + delivered events | |

**User's choice:** One event per lifecycle stage (Recommended)
**Notes:** Full history visualization preferred.

---

## Expand/Collapse Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Click entire row | Click anywhere on timeline item to toggle. Large tap target. | ✓ |
| Chevron button only | Small expand arrow button. More explicit but smaller target. | |
| Both options | Chevron shows intent, row click also works. | |

**User's choice:** Click entire row (Recommended)
**Notes:** None.

---

## Multi-Expand Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Multiple can be expanded | User can expand several events to compare | ✓ |
| Accordion (one at a time) | Expanding one collapses others | |
| You decide | Claude picks based on UX best practice | |

**User's choice:** Multiple can be expanded
**Notes:** User wants ability to compare events.

---

## Expanded Order Content

| Option | Description | Selected |
|--------|-------------|----------|
| Match design exactly | Quantity, Product, Status, View Order link | ✓ |
| Add delivery date | Include expected delivery date in addition | |
| Minimal: link only | Skip details, just show link | |

**User's choice:** Match design exactly
**Notes:** None.

---

## Performance Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Simple list with scroll | Render all events in scrollable container. Fine for 100 items. | ✓ |
| Pagination | Show 20-30 events with Load more button | |
| Virtual scrolling | Only render visible items. Best for 1000+. | |

**User's choice:** Simple list with scroll (Recommended)
**Notes:** Keep it simple for now.

---

## Claude's Discretion

None — all areas had explicit user decisions.

## Deferred Ideas

None — discussion stayed within phase scope.
