# Feature Research: v1.2 Customers Page

**Domain:** Feed mill operations dashboard — customer management, activity tracking, bin monitoring
**Researched:** 2026-05-01
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

#### Customer List Page

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Search by customer name | Standard in all CRM/account management systems | LOW | Already implemented pattern in orders table |
| Status indicators/badges | Operations teams need at-a-glance account health (red/yellow/green) | LOW | Reuse existing StatusBadge component with customer health states |
| Sort options (name, recent activity, location) | Users expect configurable ordering — alphabetical is common default | MEDIUM | Natural sort (alphabetical) is standard; add recent activity as secondary option |
| Empty state for no results | UX best practice — explain what happened and provide next steps | LOW | Already implemented pattern in orders table |
| Activity indicators (order count, changes flag) | Operations context requires visibility into "what's happening" per customer | MEDIUM | Similar to orders table "changes" indicator — shows pending orders, recent deliveries |
| Customer metadata (location code, contact info) | B2B operations require identifying information beyond just name | LOW | Data structure exists in Book1.xlsx (Farm Location Code) |

#### Customer Detail Page

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Customer header (name, location, summary stats) | Standard CRM pattern — single page for each customer with overview | LOW | Dashboard-style header with key metrics |
| Unified activity timeline | Users expect chronological history — industry standard in CRM systems | MEDIUM | Combines orders, deliveries, bin alerts in reverse chronological order |
| Timeline event types (orders, deliveries, alerts) | Multi-type activity feeds are standard (Dynamics 365, Bitrix24, etc.) | MEDIUM | Each event type has icon, title, timestamp, expandable details |
| Expandable event details | Progressive disclosure prevents clutter while allowing drill-down | MEDIUM | Click to expand from summary to full details |
| Order history summary with links | Users need to navigate from timeline to full order details | LOW | Links to existing order details panel |
| Timestamps on all events | Operations require knowing "when" for every activity | LOW | Standard timeline component requirement |
| Empty state when no activity | Handle new customers or filtered views with no results | LOW | Follow established empty state patterns |

#### Bin Visualization

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Fill level bars (percentage) | Industry standard for bin monitoring (BinSentry, BinMaster, etc.) | LOW | Vertical or horizontal bar showing 0-100% fill |
| Alert thresholds (low/critical markers) | Automated alerts at configurable thresholds are table stakes in bin monitoring | MEDIUM | Visual markers on bar + color coding (yellow=low, red=critical) |
| Bin identification (location code, capacity) | Operations need to know "which bin" and "how much it holds" | LOW | Display bin name (BIN 5, BIN 4A) from existing data |
| Current level in tons/pounds | Percentage alone insufficient — need actual quantity for ordering | LOW | Calculate from percentage × capacity |
| Multiple bins per customer | Customers typically have 2-5 bins for different feed types | MEDIUM | Card-based layout showing all customer bins |
| Visual differentiation (color coding) | At-a-glance status requires color (green=good, yellow=warning, red=critical) | LOW | Use existing design token system |
| Bin contents label | Users need to know what's stored (feed type) | LOW | Display formula/texture type associated with bin |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Unified timeline across orders + bins + deliveries | BinSentry separates bin data from order history — combining creates single customer view | MEDIUM | Reduces context switching, faster decision making |
| Inline order summary in timeline | Users can see order details without leaving customer page | MEDIUM | Click order event → expand to show key info, link to full details |
| Days-until-empty prediction | Bin monitoring systems (BinMaster FeedView) predict runout dates based on consumption | HIGH | Requires consumption rate calculation from historical data |
| Bin alerts in customer timeline | Ties bin status to customer context rather than isolated monitoring | LOW | Shows bin alerts as timeline events alongside orders |
| Customer health indicators in list | Proactive flags (e.g., "low bin + no pending order" = at-risk) | HIGH | Requires business logic combining bin levels and order status |
| Recent activity sorting | Sort customer list by "who needs attention" (recent alerts, status changes) | MEDIUM | Helps operations prioritize daily workflow |
| Multi-bin overview visualization | Visual map showing all bins at once with status colors | MEDIUM | BinSentry Control Tower pattern — facility-wide view |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time bin level updates | "We want live data" sounds impressive | Adds WebSocket complexity, battery drain on sensors, minimal operational value (feed levels change slowly) | Poll every 15-30 minutes or manual refresh — adequate for feed consumption rates |
| Inline editing of customer info | "Quick edits from list view" | Accidental changes, no validation, conflicts with existing order form patterns | Link to dedicated customer form (out of scope for v1.2) |
| Trend graphs for every bin | "Charts show more detail" | Visual clutter, slow page load, most bins have predictable linear consumption | Show trend on click/expand, not by default; days-until-empty metric is more actionable |
| Advanced timeline filtering | "Filter by event type, date range, etc." | Complexity for rare use case — most users want "everything recent" | Default to recent activity (last 30 days), provide simple "show all" toggle |
| Per-bin alert configuration | "Each bin has different thresholds" | Multiplies configuration complexity, hard to maintain consistency | Global alert thresholds by feed type, not per bin |
| Customer grouping/hierarchy | "Organize by region or parent company" | Scope creep into territory management, unclear requirements | Defer to v2+ after validating core use case |

## Feature Dependencies

```
Customer List Page
    └──requires──> Customer Data Structure
                       └──requires──> Farm Location Code from existing data

Customer Detail Page
    ├──requires──> Customer List (navigation source)
    ├──requires──> Unified Activity Timeline
    │                  ├──requires──> Order History
    │                  ├──requires──> Bin Alert Events
    │                  └──requires──> Delivery Events
    └──requires──> Bin Visualization
                       └──requires──> Mock Bin Data Service

Bin Visualization
    ├──requires──> Alert Threshold Logic
    └──enhances──> Unified Activity Timeline (bin alerts appear in feed)

Order History Links
    └──requires──> Existing Order Details Panel

Days-Until-Empty Prediction
    └──requires──> Historical Bin Data (multiple readings over time)

Customer Health Indicators
    ├──requires──> Bin Data
    ├──requires──> Order Status
    └──requires──> Business Rules (what constitutes "at-risk")
```

### Dependency Notes

- **Customer Detail requires Customer List:** Users navigate from list to detail view — list is entry point
- **Unified Timeline requires multiple data sources:** Must aggregate orders (existing), deliveries (new mock), and bin alerts (from bin service)
- **Bin Visualization enhances Timeline:** When bins trigger alerts, those events appear in customer timeline — creates unified view
- **Days-Until-Empty requires historical data:** Can't predict without trend — mock service needs multiple readings per bin
- **Customer Health conflicts with simple MVP:** Requires complex business logic combining bins + orders — defer to later iteration

## MVP Definition

### Launch With (v1.2)

Minimum viable product — what's needed for sales/delivery team to look up customers and monitor bins.

- [x] Customer list with search — Must be able to find customers quickly
- [x] Customer list status indicators — At-a-glance visibility into account activity
- [x] Customer detail page header — Context for who/where the customer is
- [x] Unified activity timeline (orders + deliveries + bin alerts) — Core value: single view of customer
- [x] Timeline event types with icons and timestamps — Visual differentiation of event types
- [x] Expandable timeline events — Progressive disclosure keeps page scannable
- [x] Order history with links to existing detail panel — Leverage existing infrastructure
- [x] Bin visualization with fill level bars — Primary use case: "is bin getting low?"
- [x] Alert thresholds (visual markers) — Prevent runout by flagging low bins
- [x] Multiple bins per customer — Realistic scenario (most customers have 2-5 bins)
- [x] Mock bin data service — Following project pattern: mock before real infrastructure

### Add After Validation (v1.2.x)

Features to add once core customer page is working and validated by operations team.

- [ ] Days-until-empty prediction — Add when historical mock data is available (requires timeline of readings)
- [ ] Recent activity sort — Add when team confirms "sort by needs attention" is useful
- [ ] Multi-bin overview visualization — Add if team wants facility-wide view beyond per-customer
- [ ] Customer health indicators in list — Add when business rules are defined (what = healthy vs at-risk)
- [ ] Timeline filtering (simple show/hide by type) — Add if default "show all recent" proves overwhelming
- [ ] Bin consumption rate display — Add if team wants to see tons/day metric alongside days-until-empty

### Future Consideration (v2+)

Features to defer until v1.2 is validated and team prioritizes next iteration.

- [ ] Customer grouping/hierarchy — Wait for territory management requirements to be defined
- [ ] Bin trend graphs — Wait for feedback on whether days-until-empty is sufficient
- [ ] Per-bin alert configuration — Wait to see if global thresholds are adequate
- [ ] Inline customer editing — Wait for customer management features to be scoped
- [ ] Export customer timeline — Wait for reporting requirements to be defined
- [ ] Real-time bin updates — Wait for evidence that polling frequency is insufficient

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Customer list with search | HIGH | LOW | P1 |
| Unified activity timeline | HIGH | MEDIUM | P1 |
| Bin visualization with fill levels | HIGH | MEDIUM | P1 |
| Alert thresholds (visual) | HIGH | LOW | P1 |
| Expandable timeline events | MEDIUM | MEDIUM | P1 |
| Customer status indicators | HIGH | LOW | P1 |
| Order history links | HIGH | LOW | P1 |
| Mock bin data service | HIGH | MEDIUM | P1 |
| Empty states | MEDIUM | LOW | P1 |
| Days-until-empty prediction | MEDIUM | HIGH | P2 |
| Recent activity sort | MEDIUM | MEDIUM | P2 |
| Customer health indicators | HIGH | HIGH | P2 |
| Multi-bin overview | MEDIUM | MEDIUM | P2 |
| Timeline filtering | LOW | MEDIUM | P3 |
| Bin consumption rate | LOW | LOW | P3 |
| Trend graphs | LOW | MEDIUM | P3 |
| Customer grouping | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.2 launch — core customer management functionality
- P2: Should have for v1.2.x — add after validation when quick wins
- P3: Nice to have for v2+ — defer until product-market fit and clear requirements

## Industry Pattern Analysis

### Customer List Pages (CRM/B2B Operations)

**Standard patterns observed:**

- **Default sorting:** Alphabetical (natural sort) is industry standard across QuickBooks, Salesforce, SuiteCRM
- **Search positioning:** Header-level search with auto-suggestions for larger datasets
- **Status badges:** Color-coded health indicators (red/yellow/green) are universal in customer success tools (HubSpot, Gainsight, Freshdesk)
- **Metadata display:** Customer name + location + key metrics (order count, health status) in list view
- **Empty states:** Clear messaging ("No results found for 'X'. Try adjusting filters.") with next steps

**Sources:** [Salesforce Trailblazer Community](https://trailhead.salesforce.com/trailblazer-community/feed/0D54S00000JgI7sSAF), [SuiteCRM Community](https://community.suitecrm.com/t/list-view-default-sorting-order/70039), [HubSpot Customer Health Score](https://knowledge.hubspot.com/help-desk/customize-a-health-score-in-the-customer-success-workspace)

### Activity Timelines (Unified Feeds)

**Standard patterns observed:**

- **Reverse chronological order:** Most recent events at top (universal across Dynamics 365, Bitrix24, WPResidence CRM)
- **Event components:** Avatar/icon, actor name, action description, timestamp, expandable details
- **Multi-type aggregation:** Combining appointments, emails, tasks, notes, system events in single feed
- **Progressive disclosure:** Summary by default, expand on click to avoid clutter
- **Visual differentiation:** Icons and color coding by event type

**Sources:** [Dynamics 365 Timeline Configuration](https://stoneridgesoftware.com/configuring-the-timeline-in-the-unified-interface-crm/), [Bitrix24 Activity View](https://www.newswire.com/news/bitrix24-redefines-crm-productivity-with-all-in-one-activity-view-22651303), [Aubergine Activity Feed Guide](https://www.aubergine.co/insights/a-guide-to-designing-chronological-activity-feeds), [UX Patterns Timeline](https://uxpatterns.dev/patterns/data-display/timeline)

### Bin Level Visualization (Industrial Monitoring)

**Standard patterns observed:**

- **Fill level display:** Percentage (0-100%) with visual bar representation is universal
- **Color coding:** Green = normal (>60%), Yellow = low (20-60%), Red = critical (<20%)
- **Alert thresholds:** Configurable high/low warnings with automated notifications via text/email
- **Multi-bin dashboard:** Card-based layout or facility map with status colors at-a-glance
- **Quantitative + qualitative:** Show both percentage and actual quantity (tons, pounds)
- **Prediction features:** Days-until-empty calculated from consumption rate (BinMaster FeedView)

**Sources:** [BinSentry Control Tower](https://www.feedandgrain.com/business-markets/company-news/news/15819605/binsentry-inc-binsentry-launches-control-tower-software-platform-for-feed-mills-and-grain-elevators), [BinMaster Level Sensors](https://binmaster.com/feedview), [ThingsBoard Waste Management](https://thingsboard.io/use-cases/waste-management/), [Smart Manufacturing Dashboard](https://dashtera.com/articles/smart-manufacturing-iot-cloud-monitoring-dashboard/)

## Competitive Feature Comparison

| Feature Category | BinSentry Control Tower | CRM Systems (Dynamics 365, Salesforce) | Our v1.2 Approach |
|------------------|--------------------------|----------------------------------------|-------------------|
| Customer List | Not applicable (bin-focused) | Search, filters, health scores, custom views | Search, status indicators, alphabetical sort |
| Activity Timeline | Separate bin monitoring view | Unified timeline with multiple event types | Unified timeline: orders + deliveries + bin alerts |
| Bin Visualization | 3D renderings, interactive facility map, hover details | Not applicable | Fill level bars with alert thresholds per customer |
| Integration | Bins + orders (Control Tower innovation) | Activities + contacts + deals | Bins + orders + deliveries in customer context |
| Predictions | N/A in public docs | N/A | Defer days-until-empty to v1.2.x |

**Our differentiation:** Unified customer view combining operational timeline (orders/deliveries) with bin monitoring, whereas competitors keep these separate. BinSentry focuses on bins, CRMs focus on activities — we bridge both.

## Patterns to Adopt

### From CRM Systems

- **Timeline pattern:** Reverse chronological feed with event icons, timestamps, expandable details
- **Status badges:** Color-coded indicators (reuse existing design token system)
- **Progressive disclosure:** Summary + expand rather than showing all details immediately
- **Empty states:** Clear messaging with next steps when filters yield no results

### From Bin Monitoring Systems

- **Visual fill indicators:** Vertical or horizontal bars showing percentage
- **Color-coded thresholds:** Green/Yellow/Red based on fill level
- **Multi-bin cards:** Each bin as card with status, level, location, contents
- **Alert prominence:** Visual differentiation for bins requiring attention

### From Operations Dashboards

- **Search in header:** Consistent with existing orders table pattern
- **Filter pills:** Multi-select filters for event types (reuse FilterPill component)
- **Default views:** Show actionable information first (recent activity, alerts)
- **Performance:** Pagination/windowing for large datasets

## Implementation Notes

### Reuse Existing Patterns

- **Search:** Already implemented in orders table — same pattern for customer search
- **StatusBadge component:** Extend with customer health states (Healthy, Warning, Critical, Active, Inactive)
- **FilterPill component:** Use for timeline event type filtering if needed
- **Design tokens:** Status colors, spacing, typography already defined in globals.css
- **Empty states:** Pattern exists in orders table — replicate for customer list
- **Mock data service:** Follow pattern from orders (async interface, realistic data)

### New Patterns Required

- **Timeline component:** Vertical chronological list with multi-type events
- **Fill level bar component:** Visual indicator with percentage and alert markers
- **Event expansion:** Toggle to show/hide event details in timeline
- **Multi-bin layout:** Card grid showing multiple bins per customer

### Complexity Considerations

**LOW complexity (leverage existing):**
- Customer list search and sort
- Status badges for customer health
- Empty states
- Order history links (navigate to existing detail panel)

**MEDIUM complexity (new but standard patterns):**
- Unified activity timeline (multi-type event aggregation)
- Bin visualization with fill bars and alerts
- Expandable timeline events
- Multiple bins per customer (card layout)
- Mock bin data service

**HIGH complexity (defer or future):**
- Days-until-empty prediction (requires consumption rate calculation)
- Customer health indicators (business logic combining bins + orders)
- Real-time updates (WebSocket infrastructure)
- Trend graphs and analytics

## Mock Data Requirements

### Bin Data Service

**Structure:**

```typescript
interface Bin {
  id: string;
  customerId: string;
  locationCode: string;        // "BIN 5", "BIN 4A"
  capacity: number;            // in pounds
  currentLevel: number;        // in pounds
  fillPercentage: number;      // 0-100
  contents: string;            // "PELLET NON MEDICATED", etc.
  lowThreshold: number;        // percentage for yellow alert
  criticalThreshold: number;  // percentage for red alert
  lastUpdated: Date;
  status: 'normal' | 'low' | 'critical';
}

interface BinAlert {
  id: string;
  binId: string;
  type: 'low' | 'critical';
  triggeredAt: Date;
  resolved: boolean;
}
```

**Mock data needs:**

- 2-5 bins per customer from Book1.xlsx
- Mix of fill levels (20% critical, 30% low, 50% normal)
- Realistic capacities for feed bins (5,000-20,000 lbs typical)
- Alert history for timeline integration
- Bin contents match formula types from existing orders

### Timeline Event Data

**Event types:**

1. **Order events:** From existing orders data (created, status changes)
2. **Delivery events:** New mock data (delivered, scheduled)
3. **Bin alerts:** From bin service (low threshold, critical threshold, refilled)

**Aggregation logic:**

- Combine all event types by timestamp (descending)
- Each event has type, icon, description, timestamp, expandable details
- Link order events to existing order detail panel

## Sources

**Customer List & CRM Patterns:**
- [B2B Website Design Best Practices](https://www.trajectorywebdesign.com/blog/b2b-website-design-best-practices)
- [CRM Design System Best Practices](https://www.eleken.co/blog-posts/how-to-design-a-crm-system-all-you-need-to-know-about-custom-crm)
- [Best UI Patterns for CRM Applications](https://eseospace.com/blog/the-best-ui-patterns-for-crm-applications/)
- [Salesforce Default List View Sort Order](https://trailhead.salesforce.com/trailblazer-community/feed/0D54S00000JgI7sSAF)
- [Customer Health Score Guide](https://www.custify.com/blog/customer-health-score-guide/)

**Activity Timeline Patterns:**
- [Timeline Pattern - UX Patterns for Developers](https://uxpatterns.dev/patterns/data-display/timeline)
- [Aubergine Activity Feed Design Guide](https://www.aubergine.co/insights/a-guide-to-designing-chronological-activity-feeds)
- [Activity Feed Design Ultimate Guide](https://getstream.io/blog/activity-feed-design/)
- [Dynamics 365 Timeline Configuration](https://stoneridgesoftware.com/configuring-the-timeline-in-the-unified-interface-crm/)
- [Bitrix24 Unified Activity View](https://www.newswire.com/news/bitrix24-redefines-crm-productivity-with-all-in-one-activity-view-22651303)
- [Microsoft Timeline Control](https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/set-up-timeline-control)
- [PostalParcel Unified Tracking](https://www.postalparcel.com/unified-tracking-oms-multichannel-fulfillment/)

**Bin Monitoring & Visualization:**
- [BinSentry Control Tower Platform](https://www.feedandgrain.com/business-markets/company-news/news/15819605/binsentry-inc-binsentry-launches-control-tower-software-platform-for-feed-mills-and-grain-elevators)
- [BinMaster FeedView Inventory Management](https://binmaster.com/feedview)
- [BinMaster Level Sensors](https://binmaster.com/news/system-considerations-when-monitoring-bin-levels-in-the-grain-industry.html)
- [ThingsBoard IoT Monitoring Dashboard](https://thingsboard.io/monitoring-dashboard/)
- [Smart Manufacturing IoT Dashboard](https://dashtera.com/articles/smart-manufacturing-iot-cloud-monitoring-dashboard/)
- [Manufacturing Dashboards - Tulip](https://tulip.co/blog/6-manufacturing-dashboards-for-visualizing-production/)

**Empty State Design:**
- [Empty States - The Most Overlooked Aspect of UX](https://www.toptal.com/designers/ux/empty-state-ux-design)
- [Empty State UX Examples - Eleken](https://www.eleken.co/blog-posts/empty-state-ux)
- [Designing Empty States in Complex Applications - NN/g](https://www.nngroup.com/articles/empty-state-interface-design/)
- [PatternFly Empty State Guidelines](https://www.patternfly.org/components/empty-state/design-guidelines/)

**Dashboard & Filter Patterns:**
- [Dashboard Filter Design Guide](https://www.aufaitux.com/blog/dashboard-filter-design-guide/)
- [Filter UX Design Patterns - Eleken](https://www.eleken.co/blog-posts/filter-ux-and-ui-for-saas)
- [Filter UX Design - Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering)

---
*Feature research for: Feed mill operations dashboard — customer management (v1.2)*
*Researched: 2026-05-01*
*Confidence: MEDIUM — Web search verified with multiple industry sources (CRM systems, bin monitoring platforms, operations dashboards). Context7 not used (domain-specific operational software). Patterns converge across sources.*
