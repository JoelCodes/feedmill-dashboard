# Feature Landscape: v2.0 Mill Production MVP

**Domain:** Feed mill operations — mixed-role production dashboard
**Researched:** 2026-05-12
**Milestone:** v2.0 — First production feature shipped to authenticated users (replaces Coming Soon)
**Confidence:** MEDIUM-HIGH

---

## Context

The existing `/demo/mill-production` view is a read-only kanban with static mock data. v2.0 promotes a DB-backed version to `/` and adds real capabilities across three distinct audiences who will use the same page at different times of day for different decisions.

**Audience summary:**
- **Operator** — on the floor, reads the page every 5–10 minutes, needs to know what to run next and what's stuck
- **Supervisor / shift lead** — checks in hourly, needs shift-level health and exception triage
- **Manager** — reviews daily/weekly, needs throughput trends and bottleneck patterns

**Sources consulted:**
- Easy Automation NexGen feed mill platform (live product)
- Livine Poultry Software (live product)
- MTech Systems feed mill management (live product)
- Tulip.co manufacturing dashboards research
- TeepTrak manufacturing dashboard design guide 2026
- Augmentir shift handover best practices
- Anitox: 6 KPIs for feed production throughput
- Smart Interface Design Patterns: bulk import UX
- LogRocket: URL state management, status change UX
- OEE.com, Evocon, Anitox: manufacturing KPI standards

---

## Section 1: Operator

The operator section is the primary queue: "what do I run next, and what's blocking what's already running?"

### Table Stakes — Operator

| Feature | Why Expected | Complexity | Dependencies | Source |
|---------|--------------|------------|--------------|--------|
| **Current queue with status** | Operators must know what's Pending/Mixing/Blocked at a glance — this IS the job | S | DB-backed orders (v2.0 infra) | Industry pattern |
| **"Next up" order highlight** | Operators waste time scrolling when queue has 30+ orders; the next order to run must be visually distinct | S | Order sort/sequence field | Industry pattern (Easy Automation whiteboard view) |
| **Blocked order alert band** | Blocked orders cost the most time; they must surface immediately, not hidden in kanban column | S | DB status field, status transitions | Tulip.co, Augmentir |
| **In-progress indicator** | "Mixing" orders need persistent visual signal (spinner, pulsing border, active badge) so operator knows what the mill is currently processing | S | Order status in DB | Industry standard |
| **Status transition buttons** | Operators update status (Pending → Mixing → Completed, or flag Blocked) — primary write action | M | Status audit trail, DB writes | Easy Automation, industry pattern |
| **Order details on tap/click** | Customer name, quantity, line code, formula, bin location — what you need to set up the batch | S | Existing demo order detail pattern | v1.x pattern carry-forward |
| **Per-column order count** | "How many left on CGM line?" — quick workload read per mill | S | Filtered count from DB | v1.1 pattern carry-forward |
| **Completed lbs / total lbs per column** | Progress tracking per mill line — shift completion percentage | S | Aggregate query from DB | v1.1 pattern carry-forward |
| **Real-time data freshness indicator** | Operator needs to trust the data is current; "Last updated 2 min ago" + manual refresh button | S | Polling or SWR revalidation | TeepTrak, Smashing Magazine |
| **Loading state / skeleton** | Network latency to DB must not show blank page | S | Existing LoadingSkeleton component | v1.x pattern carry-forward |
| **Empty state per status** | "No blocked orders" is a good sign — communicate it clearly | S | Existing null-return pattern | v1.1 pattern carry-forward |
| **Filter by status pill** | "Show me only Blocked orders" — already proven in demo, must port to production | S | URL filter state (see cross-cutting) | v1.1 carry-forward |

### Differentiators — Operator

| Feature | Value Proposition | Complexity | Dependencies | Source |
|---------|-------------------|------------|--------------|--------|
| **Batch sequence number / run order** | Operators run batches in a set order within a shift; showing the sequence (1, 2, 3…) removes ambiguity about what to run after the current batch completes | M | Sequence/priority field on order, editable by supervisor | Easy Automation whiteboard view — industry differentiator |
| **Blocking reason tag** | When an order is Blocked, showing WHY (ingredient short, equipment down, QC hold) lets operator decide if they can work around it vs. waiting | M | Blocker reason field on status transition form | Industry pattern — not in competing tools at this price point |
| **Formula change alert flag** | Existing data model has a `hasChanges` flag — surfacing it on operator cards prevents running wrong formula | S | `hasChanges` field already in mock data model | v1.x domain knowledge |
| **Estimated completion time** | "This batch takes ~45 min" — helps operator plan break and handoff timing | L | Batch duration history from completed orders; requires statistical inference | Industry pattern; defer to v2.1 |
| **Mill line capacity bar** | Visual fill indicator for each mill column showing % of day's quota completed | M | Capacity target config per mill line; aggregate query | Tulip.co production dashboard |

### Anti-Features — Operator

| Feature | Why Avoid | What to Do Instead |
|---------|-----------|-------------------|
| **Drag-drop card reordering** | Production sequence is determined by scheduling logic and formula constraints (you can't run incompatible formulas back-to-back without a flush). Drag-drop implies operator can override this — creates liability and safety risk in a regulated feed environment | Expose sequence as editable number field scoped to supervisor role only |
| **Inline card field editing** | Operators editing quantity, formula, or customer on floor cards bypasses QC validation and audit trail | All edits go through status transition form with confirmation; read-only cards |
| **Per-card refresh button** | Unnecessary complexity; global data freshness covers this | Single "refresh all" or auto-polling at page level |
| **Touch-optimized swipe gestures** | Not in scope for v2.0 (web-first, no mobile app requirement per PROJECT.md) | Keyboard + click interactions; responsive defer to v2.x |
| **Equipment status integration** | Showing pellet press RPM, conditioner temp from PLC — requires SCADA/OPC-UA bridge; massive infrastructure lift | DB-only MVP; equipment status as free-text in blocker reason field |

---

## Section 2: Supervisor / Shift Lead

The supervisor section answers "Is the mill on track today? Where are we behind?" — checked hourly, read at shift start, handed off at shift end.

### Table Stakes — Supervisor

| Feature | Why Expected | Complexity | Dependencies | Source |
|---------|--------------|------------|--------------|--------|
| **Shift progress summary** | Tons completed vs. daily target — the single most important supervisor metric | M | Completed order aggregate + configured day target | Industry standard; TeepTrak |
| **Exception list** | Surface all Blocked orders across all mill lines in one list — supervisor should not have to scan three columns | M | Status filter = Blocked, all mills, cross-column aggregate | Tulip.co, Augmentir |
| **Orders behind schedule** | Orders past their early delivery date still Pending or Mixing = at-risk deliveries | M | `earlyDeliveryDate` field vs. current date + status | Industry standard |
| **Shift handoff notes** | Free-text field for outgoing supervisor to summarize status, known issues, special instructions | M | New `shiftNote` DB table; current shift detection | Augmentir, Oxmaint — industry standard for 24/7 operations |
| **Daily throughput KPI card** | Tons produced today (sum of completed order quantities) — supervisor equivalent of progress bar | S | Aggregate query on completed orders with `completedAt` date filter | Anitox feed mill KPIs |
| **Active orders count by status** | Quick health read: "3 Mixing, 2 Blocked, 14 Pending" — supervisor digest | S | Status count aggregate query | Tulip.co dashboard patterns |
| **Filter to own shift** | If orders have `shiftAssignment`, show "my shift" subset; otherwise show full-day view | M | Shift assignment field; current shift detection by time-of-day | Industry pattern |

### Differentiators — Supervisor

| Feature | Value Proposition | Complexity | Dependencies | Source |
|---------|-------------------|------------|--------------|--------|
| **Scheduled vs. actual variance** | "We planned 180K lbs today, completed 140K by noon — 78% of target, on track for full day" — replaces mental math | M | Daily target config (per mill or global); aggregate queries for completed weight by time window | TeepTrak, industry planning tools |
| **Top blocker by frequency** | If Blocked orders cluster around one root cause, supervisor sees it fast without reading every card | M | Blocker reason field aggregated; requires blocking reason on status transition | Anitox OEE concept applied |
| **Shift-over-shift comparison** | Today vs. yesterday — gives context for "is 140K tons by noon good or bad?" | L | Historical completed order data; date-filtered aggregates | TeepTrak supervisor dashboard pattern |
| **One-click escalation flag** | Mark a specific order for manager attention with one action — pushes to manager exception view | M | `escalated` boolean field + audit trail; manager exception view in Section 3 | Domain differentiator — not in competing feed mill tools |

### Anti-Features — Supervisor

| Feature | Why Avoid | What to Do Instead |
|---------|-----------|-------------------|
| **Full OEE score** | OEE (Availability × Performance × Quality) requires equipment telemetry for Availability, cycle-time recording for Performance, and QC results for Quality — none of which exist in v2.0 data model | Track throughput rate (tons/hour) and completion rate as proxies; full OEE is a v3+ concern requiring PLC integration |
| **Automated shift assignment** | Detecting shift by time-of-day seems simple but breaks on overtime, split shifts, holidays, DST — immediate edge-case nightmare | Simple text field for supervisor to note shift; time-based auto-detection deferred |
| **Crew performance scoring** | Rating individual operator performance from dashboard data is premature, invasive, and likely to cause labor relations issues without formal process design | Aggregate mill-level metrics only; no per-person attribution |
| **Push notifications / SMS alerts** | Blocked order alerts sent to supervisor phone requires webhook infra, notification consent, phone number management — large scope increase | Supervisor checks the dashboard; on-screen exception list is sufficient for v2.0 |
| **Automated shift report PDF** | Nice-to-have but requires templating, print CSS, and PDF generation (Puppeteer/React-PDF) — scope creep | Shift handoff notes field is the MVP version; PDF export is v2.x |

---

## Section 3: Operations Manager

The manager section answers "How is the mill performing this week? Where are bottlenecks?" — reviewed daily/weekly, not real-time.

### Table Stakes — Manager

| Feature | Why Expected | Complexity | Dependencies | Source |
|---------|--------------|------------|--------------|--------|
| **Throughput KPI cards** | Tons today / Tons this week — fundamental production accounting | M | Aggregate queries on completed orders with date range filters | Anitox, TeepTrak, industry standard |
| **Tons per mill line breakdown** | "CGM line is at 60% of last week's output" — line-level comparison | M | Per-mill-line aggregate; week-over-week requires historical data | Industry standard |
| **Order volume trend** | Orders completed per day for last 7 days (bar or sparkline chart) — is output trending up or down? | M | Date-bucketed aggregate query; charting library (Recharts already in ecosystem) | TeepTrak, Tulip.co |
| **Blocked order history** | How many orders were blocked this week, and how long did they stay blocked on average? | L | Audit trail timestamps for Blocked → Mixing transition; dwell time calculation | Domain-critical for bottleneck management; industry standard |
| **Pending order backlog** | Total Pending orders and their weight — how much work is in the queue? | S | Status = Pending count + weight aggregate | Industry standard |
| **Formula mix breakdown** | What percentage of production was Pellet vs. Mash vs. Crumble? — capacity planning input | M | Texture type aggregate on completed orders; pie/donut or table | Feed mill domain knowledge from Book1.xlsx data |

### Differentiators — Manager

| Feature | Value Proposition | Complexity | Dependencies | Source |
|---------|-------------------|------------|--------------|--------|
| **Bottleneck heatmap by mill + day** | Color-coded grid (mill line × day-of-week) showing blocked order frequency — pattern-reveals at a glance which line/day combination has recurring problems | L | 30+ days of audit trail data; grid/heatmap visualization | Tulip.co shop floor overview pattern, adapted |
| **Delivery date compliance rate** | % of orders completed before `earlyDeliveryDate` — the customer-facing SLA metric | M | `completedAt` < `earlyDeliveryDate` ratio on closed orders | Feed mill domain; customer-facing KPI |
| **Customer concentration view** | Which customers represent the most volume? — operational priority input | M | Group completed orders by customer, sum weight | Domain differentiator; visible from Book1.xlsx data patterns |
| **Week-over-week throughput delta** | "This week: 820K lbs — last week: 750K lbs (+9%)" — single-number trend | M | Two-week aggregate comparison; requires >1 week of data | TeepTrak, industry standard |
| **Manager exception inbox** | Escalated orders flagged by supervisor surface here; manager can acknowledge and add notes | M | `escalated` flag + manager acknowledgment field; depends on supervisor escalation feature | Domain differentiator — closes the supervisor→manager loop |

### Anti-Features — Manager

| Feature | Why Avoid | What to Do Instead |
|---------|-----------|-------------------|
| **Full OEE dashboard** | OEE requires equipment telemetry not available in v2.0 (see Supervisor section). Displaying a fake OEE score from incomplete data misleads management decisions | Show throughput rate and completion rate explicitly; note what's excluded; full OEE is a future milestone with PLC integration |
| **Downtime tracking** | Real downtime tracking requires equipment event logs from PLC/SCADA — not available. "Blocked" orders are a proxy, not a downtime log | Use blocked-order dwell time as a downtime proxy; call it "blocked time", not "downtime" |
| **Predictive analytics / ML forecasting** | Premature at single-mill, <1 year of data | Compute simple 7-day rolling average; present as "recent trend", not prediction |
| **Financial cost per ton** | Cost accounting requires ingredient cost data, energy billing, labor hours — outside scope and data model | Throughput volume is the v2.0 metric; cost/ton belongs in ERP integration (future) |
| **Multi-mill comparison** | Single mill focus per PROJECT.md out-of-scope decision | Build single-mill dashboard cleanly; multi-mill is an explicit non-goal |
| **Custom report builder** | "Any date range, any dimension" report builder is a product in itself | Fixed date ranges (today, this week, last 7 days, this month); standard exports cover 90% |

---

## Section 4: Cross-Cutting Features

Features that affect all audiences regardless of section.

### 4.1 Real-Time Updates

| Feature | Category | Complexity | Dependencies | Recommendation |
|---------|----------|------------|--------------|----------------|
| **Polling-based auto-refresh (30s)** | Table stakes | S | SWR or React Query with refetchInterval | Use polling for v2.0; WebSocket is infrastructure overkill at current scale |
| **Data freshness timestamp** | Table stakes | S | `lastFetchedAt` client state | "Updated 45s ago" with manual refresh button |
| **"New orders available" banner** | Differentiator | M | Detect count change between polls; don't auto-scroll | Non-disruptive top-of-section banner with "Refresh" CTA; not a toast (toast auto-dismiss is dangerous in operations context) |
| **Optimistic status updates** | Differentiator | M | SWR/React Query mutation optimistic update | Status card moves to new state immediately on click; reverts on error |
| **WebSocket / SSE real-time push** | Anti-feature for v2.0 | L | Separate infra; Postgres LISTEN/NOTIFY or dedicated pubsub | Defer; polling covers the use case; add when user-reported lag becomes a complaint |
| **Auto-reload full page on update** | Anti-feature | S | N/A | Full-page reload resets scroll position, kills any in-flight status transitions, disrupts operator focus — never do this |

**UX guidance on toasts in operations context:** Toast notifications that auto-dismiss are inappropriate for critical production alerts (blocked orders, late deliveries) because operators may miss them while eyes are on equipment. Use persistent inline banners or badge counts instead. Toasts are appropriate only for confirmations of user-initiated actions (e.g., "Status updated to Mixing").

### 4.2 Bulk Import

| Feature | Category | Complexity | Dependencies | Recommendation |
|---------|----------|------------|--------------|----------------|
| **File upload (drag-drop + file picker)** | Table stakes | S | `react-dropzone` or native `<input type="file">` | Support both; drag-drop is the primary interaction |
| **XLSX and CSV parsing** | Table stakes | M | `xlsx` (SheetJS) for XLSX; built-in for CSV | SheetJS is the standard; parse server-side to avoid client memory issues on large files |
| **Column auto-detection from Book1.xlsx headers** | Table stakes | S | Header name matching against known schema | Match on `Document Number`, `Line Code`, `Texture Type`, `Customer Name`, `Ordered Quantity`, `Farm Location Code`, `Early Delivery Date`, `Formula Type` |
| **Row-count + weight preview before confirm** | Table stakes | S | Client-side parse first pass | "68 orders, 406,000 lbs — import?" before any DB writes |
| **Row-level error display** | Table stakes | M | Validation step before insert; error accumulation | Show which rows failed and why (missing required field, invalid value); don't fail the whole import for one bad row |
| **Partial import with error report** | Table stakes | M | DB transaction wrapping valid rows; error summary | Import valid rows, skip invalid rows, display summary: "62 imported, 6 skipped (see errors)" |
| **Duplicate detection (document number)** | Table stakes | M | Unique constraint on document number + import ID; warn-not-block | "3 duplicate document numbers found — skip / overwrite?" |
| **Import confirmation modal** | Table stakes | S | Modal component | Summary counts before committing; no implicit auto-import on file drop |
| **Column mapping UI for non-standard files** | Differentiator | L | Headless column mapper component | Needed if customers export from different ERP with different headers; defer to v2.x if Book1 format is universal |
| **Import history log** | Differentiator | M | `imports` table with timestamp, user, row count | Shows "last imported: April 22 by Joel, 68 orders" — operational trust feature |
| **Copy-paste from clipboard** | Differentiator | M | Parse tabular clipboard data | Power-user shortcut; secondary to file upload; defer to v2.x |

### 4.3 Status Transitions

| Feature | Category | Complexity | Dependencies | Recommendation |
|---------|----------|------------|--------------|----------------|
| **Per-card transition button** | Table stakes | S | DB write + audit trail | Primary: button on each order card for single-status advance (Pending → Mixing → Completed); one-click common path |
| **Status audit trail** | Table stakes | M | `order_status_events` table: order_id, from_status, to_status, user_id, timestamp, note | Non-negotiable for regulated feed environment (FDA/CFIA traceability); every transition logged |
| **Blocked status with reason field** | Table stakes | M | Status transition form with optional `reason` text | When marking Blocked, short free-text reason (ingredient shortage, equipment issue, QC hold); pre-filled options reduce friction |
| **Undo last transition (5-minute window)** | Table stakes | M | Soft-undo by reverting to previous status in audit trail; time-gated | Operators make errors; 5-minute undo prevents DB archaeology; longer undo creates audit integrity issues |
| **Bulk status transition (multi-select)** | Differentiator | M | Checkbox multi-select on cards; confirmation step | "Select 4 Pending orders → Mark as Mixing" — useful for shift start when loading multiple batches; requires confirmation step showing affected orders |
| **Right-rail / slide-out action panel** | Differentiator | M | Existing order detail panel pattern from v1.x | Full order context + transition form in one panel; prevents context switching; applies existing panel pattern |
| **Keyboard shortcut for status advance** | Differentiator | S | `Shift+Enter` or `Space` when card is focused | Fast for power operators; low implementation cost; document in tooltip |
| **Transition confirmation dialog** | Anti-feature for common transitions | S | N/A | Requiring confirmation for every Pending → Mixing transition creates click fatigue; only confirm irreversible transitions (Completed) or Blocked status |
| **Status dropdown on every card** | Anti-feature | S | N/A | Dropdown allows arbitrary status assignment (e.g., skip Mixing and go straight to Completed) breaking the state machine; use directed-transition buttons instead |

### 4.4 URL-Shareable Filter State

| Feature | Category | Complexity | Dependencies | Recommendation |
|---------|----------|------------|--------------|----------------|
| **Status filter persisted in URL** | Table stakes | S | `nuqs` library (type-safe URL state for Next.js) or native `useSearchParams` | `?status=Blocked,Mixing` — primary shareable filter; supervisor sends link to manager showing only exceptions |
| **Mill line filter in URL** | Table stakes | S | Same as above | `?mill=CGM` — share specific line view |
| **Search query in URL** | Table stakes | S | Debounced search + URL sync | `?q=Westbridge` — share customer-scoped view |
| **Date range in URL** | Differentiator | M | Date picker + URL serialization | `?from=2026-04-22&to=2026-04-23` — for manager views; not needed in operator section |
| **Deep links survive page reload** | Table stakes | S | Server-side read of search params in RSC | Filters must apply on initial load, not just after client hydration |
| **Named saved filter views** | Anti-feature for v2.0 | L | User preferences table; filter serialization | Defer; URL sharing satisfies the use case without DB complexity |

---

## Feature Dependencies

```
DB-backed orders (Postgres + Drizzle)
    ├── Order status transitions
    │       ├── Status audit trail (required for regulated ops)
    │       ├── Blocked reason field
    │       ├── Undo last transition
    │       └── Bulk status transition
    ├── Real-time polling / freshness
    ├── Throughput KPI aggregates (operator + supervisor + manager)
    │       ├── Tons today / this week
    │       ├── Shift progress summary
    │       └── Formula mix breakdown
    ├── Bulk import (creates orders)
    │       ├── Row-level validation
    │       ├── Duplicate detection
    │       └── Import history log
    ├── URL filter state
    │       └── (all filter features depend on this)
    └── Exception list (status = Blocked aggregate)

Shift handoff notes
    └── (standalone; no inter-feature deps, but needs DB)

Sequence / run order field
    └── Batch sequence display (operator next-up)

Blocking reason field (on status transition)
    └── Top blocker by frequency (supervisor differentiator)
    └── Blocked order history (manager)

Audit trail timestamps
    └── Blocked-order dwell time
    └── Delivery date compliance rate

Manager exception inbox
    └── Supervisor escalation flag (must ship together)

Week-over-week throughput delta
    └── Requires >7 days of production data
    └── Defer until data accumulates

Bottleneck heatmap
    └── Requires >30 days of audit trail data
    └── Defer to v2.1
```

---

## v2.0 MVP Recommendation

### Must-Ship for v2.0 (table stakes that unblock production use)

These are the minimum for the page to be useful to real operators on day one:

**Operator:**
- Current queue with status (DB-backed)
- Next-up order highlight
- Blocked order alert band
- In-progress indicator
- Status transition buttons (Pending → Mixing → Completed + Blocked with reason)
- Status audit trail
- Real-time data freshness (polling 30s + manual refresh)
- Filter by status pill (ported from demo)
- URL-shareable filter state

**Supervisor:**
- Daily throughput KPI card (tons completed today)
- Exception list (cross-column Blocked orders)
- Orders past early delivery date
- Active orders count by status
- Shift handoff notes

**Manager:**
- Throughput KPI cards (today + this week)
- Tons per mill line breakdown
- Order volume trend (7-day)
- Pending order backlog

**Cross-cutting:**
- Bulk import (file upload → preview → row-level validation → confirm → import)
- Row-level error display + partial import
- Duplicate detection

### Defer to v2.1 (validated differentiators)

- Batch sequence number / run order
- Blocking reason aggregation (top blocker)
- Shift-over-shift comparison
- One-click supervisor escalation + manager exception inbox
- Bulk status transition (multi-select)
- Right-rail action panel for status transitions
- Bottleneck heatmap (needs 30+ days data)
- Week-over-week throughput delta (needs 7+ days data)
- Delivery date compliance rate
- Import history log
- Column mapping UI for non-standard files

### Out of Scope (anti-features to document explicitly)

- Full OEE score
- Equipment/PLC telemetry
- Automated shift assignment by time-of-day
- Drag-drop card reordering
- Crew performance scoring
- Cost per ton
- Multi-mill comparison
- Custom report builder
- Push/SMS notifications
- WebSocket real-time push (polling sufficient)

---

## Feature Prioritization Matrix

| Feature | User Value | Impl Cost | Priority |
|---------|------------|-----------|----------|
| DB-backed queue with status | HIGH | M | P1 |
| Status transitions + audit trail | HIGH | M | P1 |
| Bulk import (file → preview → confirm) | HIGH | M | P1 |
| Exception list (Blocked aggregate) | HIGH | S | P1 |
| Daily throughput KPI | HIGH | S | P1 |
| URL-shareable filters | HIGH | S | P1 |
| Polling refresh + freshness indicator | HIGH | S | P1 |
| Shift handoff notes | MEDIUM | S | P1 |
| Blocked order alert band | HIGH | S | P1 |
| Next-up order highlight | HIGH | S | P2 |
| Row-level import errors | HIGH | M | P1 |
| Orders past delivery date | MEDIUM | S | P2 |
| 7-day order volume trend chart | MEDIUM | M | P2 |
| Formula mix breakdown | MEDIUM | M | P2 |
| Batch sequence number | MEDIUM | M | P2 |
| Undo last transition | MEDIUM | M | P2 |
| Bulk status transition | MEDIUM | M | P3 |
| Bottleneck heatmap | MEDIUM | L | P3 |
| Supervisor escalation flag | MEDIUM | M | P3 |
| Shift-over-shift comparison | LOW | M | P3 |

**Priority key:** P1 = must-ship v2.0 | P2 = ship in v2.0 if time permits | P3 = v2.1+

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Operator features | HIGH | Operator needs are well-validated by industry tools (Easy Automation, Livine, Tulip.co) and by the existing /demo prototype |
| Supervisor features | MEDIUM | Shift handoff patterns are well-documented; specific KPI targets (daily target lbs) need user confirmation — what IS the day's target? Is it configured per mill? |
| Manager features | MEDIUM | KPI selection is validated by Anitox/TeepTrak; bottleneck heatmap and OEE-style metrics are speculative until real data accumulates |
| Bulk import UX | HIGH | 5-stage framework (upload → map → validate → repair → confirm) is well-established; Book1.xlsx format is known |
| Status transition UX | HIGH | Directed-transition buttons + audit trail is the right pattern; audit trail is non-negotiable in regulated feed environments |
| Real-time UX | HIGH | Polling over WebSocket is the right call for v2.0 scale; banners over toasts for operational alerts is validated |
| URL state | HIGH | nuqs or native useSearchParams is the correct Next.js App Router approach |

---

## Open Questions for Scoping

1. **Daily throughput target** — is there a configured target lbs/day per mill line, or is it a fixed constant? (Affects supervisor "scheduled vs. actual variance" feature and KPI display)
2. **Shift definition** — does this mill run multiple shifts per day? If so, what are the shift boundaries? (Affects shift handoff notes, shift progress filtering)
3. **Sequence / run order** — are orders already sequenced in Book1.xlsx import data, or does the supervisor set sequence after import?
4. **Blocking reasons** — should the system provide a pre-set list of blocking reasons (ingredient shortage, equipment issue, QC hold, other) or free-text only? A pre-set list enables aggregation for "top blocker" reporting.
5. **Delivery date compliance** — is `earlyDeliveryDate` the hard SLA date or a target? This affects how "past delivery date" exceptions should be labeled and flagged.
6. **Book1.xlsx format universality** — will bulk imports always follow the Book1.xlsx column structure, or do different exporters produce different headers requiring column mapping?

---

## Sources

- [Easy Automation Feed Mill](https://www.easy-automation.com/feed) — NexGen platform features, whiteboard/queue view, automatic daily reporting
- [Livine Poultry Software](https://www.livine.io/feedmill-software) — real-time dashboard, production tracking
- [MTech Systems Feed Mill](https://mtechsystems.io/solutions/feedmill-management/) — inventory and formula traceability patterns
- [Tulip.co: 6 Manufacturing Dashboards](https://tulip.co/blog/6-manufacturing-dashboards-for-visualizing-production/) — operator vs. supervisor vs. executive dashboard taxonomy
- [TeepTrak Dashboard Design Guide 2026](https://teeptrak.com/en/manufacturing-dashboard-design-guide-2026/) — audience-specific KPI counts, refresh rates, visual standards
- [Augmentir: Shift Handover Best Practices](https://www.augmentir.com/blog/how-to-improve-manufacturing-shift-handover) — shift handoff information categories
- [Anitox: 6 KPIs for Feed Production Throughput](https://www.anitox.com/news/6-key-performance-indicators-for-measuring-feed-production-throughput) — TPH, energy/ton, PDI, OEE for feed mills specifically
- [Smart Interface Design Patterns: Bulk Import UX](https://smart-interface-design-patterns.com/articles/bulk-ux/) — 5-stage import framework
- [ImportCSV: Data Import UX](https://www.importcsv.com/blog/data-import-ux) — preview, error handling patterns
- [CSVBox Blog: Row-Level Error Messages](https://blog.csvbox.io/row-level-errors-csv/) — per-row error reporting
- [Smashing Magazine: UX for Real-Time Dashboards](https://smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/) — freshness indicators, polling vs. push
- [Carbon Design System: Notification Pattern](https://carbondesignsystem.com/patterns/notification-pattern/) — toast vs. banner vs. inline notification guidance
- [LogRocket: URL State with useSearchParams](https://blog.logrocket.com/url-state-usesearchparams/) — URL filter state pattern
- [nuqs: Type-Safe URL State for Next.js](https://dev.to/tphilus/stop-fighting-nextjs-search-params-use-nuqs-for-type-safe-url-state-2a0h) — recommended library

---

*Feature research for: CGM Dashboard v2.0 Mill Production MVP*
*Researched: 2026-05-12*
*Downstream: Requirements scoping — use section breakdowns to present features by audience for user selection*
