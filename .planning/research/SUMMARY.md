# Project Research Summary

**Project:** CGM Dashboard v1.2 - Customer Management & Bin Monitoring
**Domain:** Feed mill operations dashboard with customer activity tracking and bin inventory management
**Researched:** 2026-05-01
**Confidence:** HIGH

## Executive Summary

v1.2 adds customer-centric functionality to an existing feed mill operations dashboard, integrating customer management with order tracking and bin inventory monitoring. The good news: the existing Next.js/React/Tailwind stack is **completely sufficient** for all new features with **zero new dependencies required**. Research shows this milestone can leverage established patterns from v1.0-v1.1 (search from OrdersTable, timeline from OrderDetails, StatusBadge, FilterPill) while extending them to handle multi-source activity aggregation and bin fill visualizations.

The recommended approach is to build incrementally starting with the data layer (customer/bin services and types), then list view (reusing OrdersTable patterns), then detail view (combining timeline + bin visualization components). Critical success factors include: (1) implementing shared mock data layer to avoid stale data across pages, (2) using virtualization from the start for timeline to avoid memory leaks, (3) establishing cursor-based pagination pattern for order history before scale hits, and (4) avoiding charting library bloat by using CSS-only bin fill bars.

Key risk is **performance degradation from naive timeline aggregation**: fetching all events from multiple sources then merging client-side will fail at scale. Mitigation: structure mock services to return pre-aggregated ActivityEvent arrays, test with 100+ events per customer, and design data layer anticipating future backend aggregation table. Secondary risk is **inconsistent patterns**: new customer pages must audit and reuse existing components (StatusBadge, FilterPill, TimelineEvent structure) rather than reinventing similar UI.

## Key Findings

### Recommended Stack

**No new dependencies required.** All v1.2 features can be implemented with the existing v1.0-v1.1 stack: Next.js 16.1.6 App Router for customer routes (`/customers/[id]`), React 19.2.3 with hooks for state management, Tailwind CSS 4 for bin visualization bars, TypeScript for type safety, and lucide-react for icons (Container, Gauge, AlertTriangle, Bell already available).

**Core technologies:**
- **Next.js App Router:** Dynamic customer detail routes with server components and parallel data fetching
- **Native Array methods:** Customer search with `Array.filter()` and timeline merging with `Array.sort()` — no fuse.js or date-fns needed
- **CSS + Tailwind:** Bin fill level bars using `<div style={{ width: ${percent}% }}>` with design token colors — no charting library needed
- **Existing patterns:** Extend OrderDetails timeline for unified activity, reuse OrdersTable search pattern for customer list, continue mock service async pattern from orders.ts

**Explicitly rejected:**
- date-fns/dayjs (codebase uses native Intl API)
- recharts/chart.js (overkill for simple horizontal fill bars)
- Zustand/Redux (component-local state sufficient)
- fuse.js (dataset <100 customers, native string matching adequate)

### Expected Features

Research validated customer management features against industry patterns from CRM systems (Salesforce, Dynamics 365, Bitrix24) and bin monitoring platforms (BinSentry, BinMaster FeedView).

**Must have (table stakes):**
- Customer list with search by name — standard in all CRM/account management systems
- Status indicators on customer rows — operations teams expect at-a-glance account health (active orders, changes flag)
- Customer detail page with header + summary stats — universal CRM pattern
- Unified activity timeline (orders + deliveries + bin alerts) — industry standard chronological history
- Expandable timeline events — progressive disclosure prevents clutter
- Bin fill level visualization with percentage bars — table stakes in bin monitoring systems
- Alert thresholds with color coding (green/yellow/red) — automated alerts are expected in bin monitoring
- Multiple bins per customer — realistic scenario (2-5 bins for different feed types)

**Should have (competitive advantage):**
- Unified timeline across orders + bins + deliveries — BinSentry separates these, combining creates single customer view and reduces context switching
- Bin alerts in customer timeline — ties bin status to customer context rather than isolated monitoring
- Recent activity sorting on customer list — helps operations prioritize daily workflow

**Defer (v2+):**
- Days-until-empty prediction (requires consumption rate calculation from historical data)
- Customer health indicators in list (requires complex business logic combining bins + orders)
- Real-time bin updates (WebSocket complexity, minimal operational value for slow-changing feed levels)
- Trend graphs per bin (visual clutter, days-until-empty metric more actionable)
- Customer grouping/hierarchy (scope creep into territory management)

### Architecture Approach

Extend existing three-layer architecture (Presentation → Service → Types) with new customer domain alongside existing orders domain. Keep flat component structure, add customer routes to Next.js App Router, create separate services per entity (customers.ts, bins.ts) following established mock async pattern.

**Major components:**
1. **CustomersTable** — List view with search, reuses OrdersTable pattern with customer-specific columns and status indicators
2. **UnifiedTimeline** — Merges events from multiple sources (orders, deliveries, bin alerts) into chronological ActivityEvent[] array, extends existing OrderDetails timeline pattern
3. **BinVisualization** — Displays multiple bins per customer with CSS fill level bars (no charting library), threshold-based color coding using design tokens
4. **Customer/Bin Services** — Mock async services following orders.ts pattern, customers service aggregates from orders to compute stats, bins service calculates fill percentages and alert status server-side

**Critical integration points:**
- Add `customerId` field to existing Order interface to enable customer-order relationship
- Extract unique customers from existing mock orders in orders.ts
- Reuse StatusBadge component with customer-specific status colors
- Add Customers nav item to existing Sidebar between Orders and Inventory
- Create shared mock data singleton to avoid stale data inconsistency across pages

### Critical Pitfalls

Based on research into CRM systems, bin monitoring platforms, and Next.js performance patterns:

1. **Timeline aggregation performance** — Fetching all events from multiple sources (orders, deliveries, bins) then merging client-side creates massive database load and slow rendering with 1000+ events. **Avoid:** Design services to return pre-aggregated ActivityEvent[] from day one. Mock with 100+ events to expose early. Plan for future backend aggregation table.

2. **Infinite scroll memory leaks** — Timeline events stay mounted in DOM as users scroll, causing browser memory to climb from 50MB to 500MB+ until tab crashes. **Avoid:** Use react-virtuoso or react-window for virtualization from the start. Keep max 50 items in DOM. Test with 100+ timeline items in mock data.

3. **Stale data across pages** — Customer list shows "3 pending orders", detail page shows "2 pending orders" due to independent caching. Users lose trust. **Avoid:** Implement shared mock data layer (singleton pattern), not separate arrays per service. Add cache invalidation when order status changes. Use React Query or SWR if data fetching complexity increases.

4. **Bin alert false positives** — Sensor drift, improper thresholds, displaying raw values without smoothing leads to "alert fatigue" where teams ignore all alerts and miss real critical events. **Avoid:** Implement threshold hysteresis (don't clear warning immediately), use 5-minute rolling average not instant values, document expected alert frequency, mock edge cases (threshold crossing scenarios).

5. **Offset-based pagination breaks at scale** — Customer with 1000+ orders experiences 10+ second load times for order history deep in list as database scans all preceding records. **Avoid:** Use cursor-based pagination (`WHERE id > cursor`) not offset/limit. Test with 100+ orders per customer in mock data. Add database indexes (customer_id, order_date, order_id) before real API.

## Implications for Roadmap

Based on dependencies discovered in research and component build-order requirements, suggested 4-phase structure:

### Phase 1: Foundation (Data Layer)
**Rationale:** Type definitions and services must exist before any UI can consume them. Establishing shared data layer prevents stale data pitfall. Customer service aggregates from existing orders service, creating integration point that must work before building dependent views.

**Delivers:**
- `types/customer.ts` and `types/bin.ts` with Customer, Bin, BinAlert, ActivityEvent interfaces
- `services/customers.ts` mock service with order aggregation logic
- `services/bins.ts` mock service with fill percentage calculation and alert status logic
- Add `customerId` field to existing Order interface
- Shared mock data singleton pattern to avoid inconsistency
- Mock data includes 100+ orders for one customer and 100+ timeline events to expose performance issues early

**Addresses:** Mock-to-real API type mismatch pitfall, stale data across pages pitfall

**Avoids:** Building UI before data contracts are defined, creating separate mock data per page

**Research flag:** Standard mock service pattern (skip phase research) — follows established orders.ts pattern

---

### Phase 2: Customer List Page
**Rationale:** List is entry point for navigation to detail pages. Testing search and status indicators here validates reuse of OrdersTable patterns before more complex detail page. Customer list proves services work before building timeline aggregation.

**Delivers:**
- `app/customers/page.tsx` route with layout
- `components/CustomersTable.tsx` with search (reuses OrdersTable pattern)
- Customer status indicators (active orders count, changes flag, bin alerts)
- Empty state for no search results
- Add Customers to Sidebar navigation with Users icon

**Uses:** Existing useDebounce hook for search, StatusBadge component for indicators, FilterPill if filtering needed

**Addresses:** Inconsistent design pattern pitfall by auditing and reusing existing components

**Avoids:** Reinventing search, creating new status badge component, inconsistent navigation patterns

**Research flag:** Standard list/search pattern (skip phase research) — well-documented, matches existing orders page

---

### Phase 3: Customer Detail Infrastructure
**Rationale:** Detail page structure and layout must exist before populating with timeline and bin components. Parallel data fetching pattern (customer metadata + orders + bins) establishes multi-source aggregation that timeline depends on. Setting up cursor-based pagination now prevents painful refactor later.

**Delivers:**
- `app/customers/[id]/page.tsx` dynamic route with parallel data fetching
- `components/CustomerDetail.tsx` layout shell (header + grid for timeline + bins)
- Customer header with summary stats
- Cursor-based pagination helper for order history
- Loading and error states (reuse existing skeleton patterns)

**Implements:** Architectural pattern from ARCHITECTURE.md for multi-source data fetching with Promise.all

**Addresses:** Offset pagination performance pitfall, Next.js prefetch overload pitfall

**Avoids:** Building offset pagination that breaks at scale, automatic prefetch on all customer links

**Research flag:** Needs research — pagination strategy requires validation against real data patterns

---

### Phase 4: Unified Activity Timeline
**Rationale:** Timeline is most complex component, requires multi-source aggregation working correctly. Depends on customer detail page infrastructure and shared data layer. Implementing virtualization from start avoids memory leak refactor later.

**Delivers:**
- `components/UnifiedTimeline.tsx` with ActivityEvent merging from orders + bins + deliveries
- Timeline event transformation utilities (transformOrderToEvent, transformBinAlertToEvent)
- Expandable event details (click to expand from summary)
- Event type icons and color coding (reuses existing timeline pattern from OrderDetails)
- Virtualization using react-virtuoso or react-window
- Consistent time display utilities using native Intl API

**Uses:** Extract and generalize TimelineItem from existing OrderDetails component

**Addresses:** Timeline aggregation performance pitfall, infinite scroll memory leak pitfall, timezone display pitfall

**Avoids:** Fetching all events then filtering client-side, keeping all items mounted in DOM, inconsistent time formatting

**Research flag:** Needs research — virtualization library choice and timeline aggregation pattern need validation

---

### Phase 5: Bin Visualization
**Rationale:** Standalone component that can be built independently after timeline. Uses services from Phase 1. CSS-only implementation avoids charting library decisions.

**Delivers:**
- `components/BinVisualization.tsx` with fill level bars
- Multiple bins per customer in card layout
- Threshold-based color coding (green/yellow/red) using design tokens
- Bin metadata display (location, capacity, current level, contents)
- Add bin threshold design tokens to globals.css

**Uses:** CSS + Tailwind for horizontal bars with dynamic width percentage, existing design token system

**Addresses:** Bin alert false positive pitfall, mixing charting libraries pitfall

**Avoids:** Adding recharts/chart.js for simple bars, hardcoding thresholds in components

**Research flag:** Standard visualization pattern (skip phase research) — CSS progress bars are well-documented

---

### Phase Ordering Rationale

- **Data layer first:** Services and types must exist before any UI. Shared data layer prevents stale data pitfall across pages.
- **List before detail:** Customer list is entry point, proves services work, validates pattern reuse before complex detail page.
- **Infrastructure before components:** Detail page layout and data fetching must work before building timeline and bins.
- **Timeline before bins:** Timeline is more complex (multi-source aggregation, virtualization), bins are simpler standalone component.
- **Incremental validation:** Each phase produces testable output that validates patterns before building dependent phases.

**Dependency chain:**
```
Phase 1 (Data Layer)
    ├──> Phase 2 (List) requires customer service
    └──> Phase 3 (Detail Infrastructure) requires customer + bin services
            ├──> Phase 4 (Timeline) requires detail page + aggregation pattern
            └──> Phase 5 (Bins) requires detail page + bin service
```

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Detail Infrastructure):** Pagination strategy and prefetch optimization need validation against expected data volumes and navigation patterns
- **Phase 4 (Unified Timeline):** Virtualization library choice (react-virtuoso vs react-window) and multi-source aggregation pattern need performance testing

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Data Layer):** Mock service pattern established in orders.ts, TypeScript interfaces are standard
- **Phase 2 (List Page):** Search/filter patterns match existing OrdersTable, well-documented
- **Phase 5 (Bin Visualization):** CSS progress bars are standard, threshold-based color coding is simple design token usage

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Validated against existing codebase files (package.json, OrderDetails.tsx, OrdersTable.tsx, orders.ts). Zero new dependencies needed, all features achievable with current stack. |
| Features | MEDIUM | Validated against multiple industry sources (BinSentry, BinMaster, Salesforce, Dynamics 365). Table stakes clear, differentiators identified, but some feature priorities based on inference from patterns. |
| Architecture | HIGH | Direct extension of existing patterns verified in codebase (services/orders.ts, components/OrderDetails.tsx). Three-layer architecture proven in v1.0-v1.1. Integration points identified. |
| Pitfalls | MEDIUM | Performance pitfalls validated via multiple sources (pagination best practices, feed aggregation patterns, memory leak prevention). Bin monitoring pitfalls from domain-specific sources. Some pitfalls inferred from general patterns. |

**Overall confidence:** HIGH

### Gaps to Address

**Open questions needing validation during implementation:**

1. **Bin sensor data model:** Mock bins derived from order locations (BIN 1A, BIN 2B) but real BinSentry API contract not verified. **Handle:** Design bin service interface flexible enough to adapt, validate with actual API docs when available.

2. **Customer aggregation performance:** Deriving customer list from orders works for MVP but may need optimization. **Handle:** Include performance test with 500+ orders across 50+ customers in Phase 1, establish benchmark.

3. **Timeline event priorities:** Which events should be expandable vs inline? **Handle:** Start with all expandable (simpler implementation), refine based on content length during Phase 4.

4. **Bin threshold configuration:** Are thresholds global or per-customer/per-bin? **Handle:** Start with global constants (simplest), document need for customer-specific config in v1.3.

5. **Real-time vs polling:** When does bin data need to update? **Handle:** Manual refresh for MVP, add polling strategy discussion to Phase 5 if needed.

## Sources

### Primary (HIGH confidence)

**Existing Codebase:**
- `src/components/OrderDetails.tsx` L16-24 — Timeline pattern to extend for UnifiedTimeline
- `src/components/OrdersTable.tsx` — Search and filter pattern to reuse for CustomersTable
- `src/services/orders.ts` — Mock service async pattern to replicate for customers/bins
- `src/utils/formatDate.ts` — Native Intl API usage for timeline dates
- `src/components/ui/StatusBadge.tsx` — Design token pattern for customer status indicators
- `package.json` — Validated no new dependencies needed

**Industry Standards:**
- [BinSentry Control Tower](https://www.feedandgrain.com/business-markets/company-news/news/15819605/binsentry-inc-binsentry-launches-control-tower-software-platform-for-feed-mills-and-grain-elevators) — Bin monitoring data model, dashboard patterns, alert thresholds
- [BinMaster FeedView](https://binmaster.com/feedview) — Inventory management software, days-until-empty predictions
- [Dynamics 365 Timeline](https://stoneridgesoftware.com/configuring-the-timeline-in-the-unified-interface-crm/) — Multi-type activity aggregation pattern
- [Salesforce List View Patterns](https://trailhead.salesforce.com/trailblazer-community/feed/0D54S00000JgI7sSAF) — Default sorting, status indicators

### Secondary (MEDIUM confidence)

**Performance & Pagination:**
- [GreatFrontEnd Large Datasets](https://www.greatfrontend.com/blog/how-to-handle-large-datasets-in-front-end-applications) — Pagination strategies, virtualization patterns
- [Keyset Pagination](https://medium.com/@fathullahmunadi1406/optimizing-sql-pagination-for-large-datasets-boost-performance-with-the-keyset-pagination-method-93678c528220) — Cursor-based pagination best practices

**Activity Timeline:**
- [Bitrix24 Unified Activity](https://www.newswire.com/news/bitrix24-redefines-crm-productivity-with-all-in-one-activity-view-22651303) — Activity feed design patterns
- [Aubergine Activity Feeds](https://www.aubergine.co/insights/a-guide-to-designing-chronological-activity-feeds) — Progressive disclosure, event components
- [Stream Aggregated Feeds](https://getstream.io/blog/aggregated-feeds-demystified/) — Timeline aggregation anti-patterns

**Memory Leaks & Virtualization:**
- [React Memory Leaks](https://dev.to/fazal_mansuri_/memory-leaks-in-javascript-react-the-hidden-enemy-74p) — Event listener cleanup, component unmounting
- [Infinite Scroll Issues](https://utahedu.devcamp.com/dissecting-react-js/guide/refactoring-infinite-scroll-feature-fix-memory-leak) — Virtualization as solution

**Bin Monitoring:**
- [BinConnect Monitoring](https://www.nanolike.com/binconnect/) — Real-time volume tracking, alert systems
- [BinMaster Grain Monitoring](https://binmaster.com/news/system-considerations-when-monitoring-bin-levels-in-the-grain-industry.html) — Sensor calibration, threshold tuning
- [Sensor Calibration Drift](https://pollution.sustainability-directory.com/term/sensor-calibration-drift/) — False positive prevention

**Next.js Performance:**
- [Next.js Navigation Lag](https://dev.to/kcsujeet/debugging-nextjs-app-router-navigation-lag-dynamic-routes-and-prefetching-akk) — Prefetch optimization strategies
- [Fast Next.js Navigation](https://upstash.com/blog/fast-nextjs) — Dynamic route performance patterns

### Tertiary (LOW confidence)

**Design Consistency:**
- [Design System Best Practices](https://www.eleken.co/blog-posts/how-to-design-a-crm-system-all-you-need-to-know-about-custom-crm) — CRM pattern libraries (general guidance)
- [Figma Design Consistency](https://www.figma.com/resource-library/consistency-in-design/) — Component reuse principles (general UX)

---

*Research completed: 2026-05-01*
*Ready for roadmap: Yes*
