# Research Summary: Dashboard Interactivity Stack

**Domain:** Feed mill operations dashboard - adding interactivity to existing Next.js/React/Tailwind prototype
**Researched:** 2026-03-11
**Overall Confidence:** MEDIUM (based on training data current through Jan 2025, web tools unavailable)

## Executive Summary

Adding interactivity to the existing feed mill dashboard requires introducing **three core capabilities**: data table management (filtering, sorting, searching), UI state management (selections, panel visibility), and a mock data layer that transitions seamlessly to real APIs. The recommended stack prioritizes **minimal dependencies**, **headless libraries** that preserve the existing Tailwind design system, and **architectural patterns** that enable mock-to-API transitions without component rewrites.

**Key architectural insight:** The critical success factor is introducing a **service layer abstraction** between components and data sources. This allows the entire mock data implementation to be swapped for real API calls by editing a single file, without touching any component code.

**Confidence caveat:** This research relied on training data (current through January 2025) due to web search and documentation tools being unavailable. Library versions and React 19 compatibility should be verified against official documentation before installation.

## Key Findings

**Stack:** TanStack Table v8 (headless data table) + Zustand v5 (state management) + MSW v2 (API mocking) + date-fns v4 (date utilities) + clsx/tailwind-merge (styling utilities)

**Architecture:** Container/Presentation component split with service layer abstraction. Containers manage state and data fetching, presentations render UI from props, services provide data (mock or API with identical interface).

**Critical Pitfall:** Filter state explosion - multiple filter dimensions (status, search, "has changes") can create performance and UX issues if not architected correctly from the start. Use URL state for shareable filters and single reducer for all filter logic.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 0: Infrastructure (Before Milestone 1)
**Focus:** Establish data layer and component architecture
- **Addresses:** Mock data shape mismatch (Pitfall #2), service layer abstraction
- **Avoids:** Rewrite when switching to real API
- **Key Deliverables:**
  - Create `lib/services/orders-service.ts` with mock data
  - Define TypeScript types for Order data structure
  - Set up MSW for API mocking (optional but recommended)
  - Extract StatusBadge and shared constants to prevent duplication (Pitfall #5)
- **Duration:** 2-3 days
- **Research Flag:** NONE - standard patterns, low risk

### Phase 1: Milestone 1 - Orders Table Interactivity
**Focus:** Implement filtering, searching, sorting, row selection
- **Addresses:** Core table stakes features from FEATURES.md
- **Avoids:** Filter state explosion (Pitfall #1), search performance issues (Pitfall #3)
- **Key Deliverables:**
  - Create OrdersTableContainer (client component with state)
  - Extract OrdersTableUI (presentation component)
  - Implement URL-based filter state (status, search, hasChanges)
  - Add debounced search with memoized results
  - Row selection with visual highlight (local state, not URL)
  - Status filter pills with computed counts
  - Empty state components
  - Loading skeleton UI
- **Duration:** 1-2 weeks
- **Research Flag:** NONE - patterns covered in this research

### Phase 2: Milestone 2 - Order Details Panel
**Focus:** Click row to show order details, timeline, change history
- **Addresses:** Drill-down interaction, order lifecycle visibility
- **Avoids:** Selected row state without URL (Pitfall #4)
- **Key Deliverables:**
  - Use URL query param for selected order (`?order=ORD-2847`)
  - OrderDetailsContainer + OrderDetailsUI components
  - Timeline visualization component
  - Change history display
  - Panel open/close animation
  - Browser back button closes panel (URL sync)
- **Duration:** 1 week
- **Research Flag:** LOW - timeline visualization may need design research for UX patterns

### Phase 3: Milestone 3 - KPI Cards Interactivity (Future)
**Focus:** Make KPI cards dynamic and clickable
- **Addresses:** Real-time metrics, drill-down to filtered views
- **Avoids:** Table re-renders on unrelated state (Pitfall #6)
- **Key Deliverables:**
  - Compute KPI values from order data
  - Click KPI to filter table (e.g., click "18 Ready" → filter to Ready status)
  - Separate state contexts to prevent unnecessary re-renders
  - Loading states for KPI data
- **Duration:** 3-5 days
- **Research Flag:** NONE - patterns from Phases 1-2 apply

### Phase 4: Milestone 4-5 - Navigation & Header (Future)
**Focus:** Functional routing, search, notifications, settings
- **Addresses:** Multi-view dashboard, global search, notifications
- **Avoids:** Scope TBD based on requirements
- **Research Flag:** HIGH - needs dedicated research when scope defined

**Phase Ordering Rationale:**

1. **Infrastructure first** prevents data layer rewrites and establishes component boundaries
2. **Table before details** creates the interaction foundation (selection, state management)
3. **Details before KPIs** builds on selection state, validates URL state pattern
4. **KPIs use table patterns** can reuse filtering/state logic from table phase
5. **Navigation deferred** until core interactions proven, prevents premature routing complexity

**Research Flags for Phases:**

- **Phase 0 (Infrastructure):** Standard patterns, no additional research needed
- **Phase 1 (Orders Table):** Covered in this research, no additional research needed
- **Phase 2 (Order Details):** Timeline visualization UX might need design pattern research
- **Phase 3 (KPI Cards):** Standard patterns, no additional research needed
- **Phase 4+ (Navigation/Header):** Needs dedicated research when scope defined

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack - Data Tables** | MEDIUM | TanStack Table v8 widely used as of Jan 2025, React 19 compatibility likely but unverified |
| **Stack - State Management** | MEDIUM | Zustand v5 stable, React 19 compatible as of Jan 2025, but unable to verify current state |
| **Stack - Mock Data** | MEDIUM | MSW v2 stable pattern, version current as of Jan 2025 |
| **Stack - Utilities** | HIGH | clsx, tailwind-merge, date-fns are stable libraries with minimal API changes |
| **Features - Table Stakes** | HIGH | Search, filter, sort are established patterns in all modern dashboards |
| **Features - Interaction Patterns** | HIGH | Based on widely-adopted patterns in data table libraries and design systems |
| **Features - Domain Specifics** | MEDIUM | Feed mill change indicators and delivery date prominence inferred from context |
| **Architecture - Patterns** | HIGH | Container/Presentation, service layer abstraction are established React patterns |
| **Architecture - Next.js Integration** | MEDIUM | App Router server/client boundaries based on Next.js 16 docs, but specifics unverified |
| **Pitfalls - React Patterns** | HIGH | Filter state, search performance, key props are well-documented pitfalls |
| **Pitfalls - Domain Specific** | MEDIUM | Feed mill specific pitfalls inferred from project context |

## Gaps to Address

**Verification needed:**
1. **Library versions** - Check npm for latest versions, verify React 19 compatibility
2. **TanStack Table API** - Review current documentation for breaking changes since Jan 2025
3. **Zustand v5 features** - Verify DevTools integration and TypeScript patterns
4. **MSW v2 setup** - Confirm Next.js 16 integration pattern (browser vs server setup)
5. **date-fns v4** - Check for API changes from v3

**Research gaps:**
1. **Timeline visualization UX** - Best practices for order lifecycle timelines (Milestone 2)
2. **Virtual scrolling** - If dataset exceeds 500+ rows, research TanStack Virtual or react-window
3. **URL state management** - Consider libraries like `nuqs` or `next-usequerystate` for Phase 2
4. **Real-time updates** - If multi-user collaboration required, research polling vs WebSocket patterns
5. **Advanced table features** - Column resizing, pinning, density toggle if requested by users

**Domain-specific gaps:**
1. **Feed mill workflows** - User research on actual operator workflows would validate filter priorities
2. **Change tracking importance** - Validate whether "has changes" filter is actually high priority
3. **Delivery date criticality** - Confirm delivery date should be primary sort/filter dimension
4. **Status transitions** - Understand if status changes are manual or automatic (affects UX)

**Technical gaps:**
1. **Next.js 16 specifics** - Server Actions, server component data fetching patterns
2. **React 19 features** - Whether new features (useOptimistic, useFormStatus) apply to this use case
3. **Tailwind CSS 4** - Any new utility classes or patterns relevant to interactive tables

## Detailed Research Output

This summary synthesizes findings from four detailed research files:

### STACK.md
**Purpose:** Technology recommendations with versions and rationale

**Key Recommendations:**
- **TanStack Table v8.20.0+** for headless data tables (filtering, sorting, searching)
- **Zustand v5.0.0+** for lightweight state management (filters, selections, UI state)
- **MSW v2.0.0+** (dev dependency) for API mocking with service worker
- **@faker-js/faker v9.0.0+** (dev dependency) for realistic mock data generation
- **clsx v2.1.0+** and **tailwind-merge v2.5.0+** for conditional className logic
- **date-fns v4.1.0+** for date formatting and manipulation

**Alternatives Rejected:**
- AG Grid / MUI DataGrid (too heavy, bring own UI, design system conflicts)
- Redux Toolkit (overkill for UI state, too much boilerplate)
- Mirage.js / json-server (less active, more complex than MSW)
- Moment.js / Luxon (deprecated or larger bundles than date-fns)

**Bundle Impact:** ~36kb minified + gzipped for production dependencies

### FEATURES.md
**Purpose:** Feature landscape - what to build, what to defer, what to avoid

**Table Stakes (Milestone 1):**
- Status filtering (pills, multi-select)
- Text search (customer, product, order number)
- Sort by column (delivery date, status, quantity)
- Row selection (visual highlight)
- Status badges (color-coded)
- Changes indicator (red dot when `hasChanges: true`)
- Empty states (no results messaging)
- Loading states (skeleton UI)

**Differentiators (Future):**
- Multi-column sorting (status + delivery date)
- Column visibility toggle
- Keyboard shortcuts (arrow keys, Enter to select)
- Export to Excel
- Saved filter presets

**Anti-Features (Explicitly NOT building):**
- Real-time updates via WebSocket (polling sufficient)
- Inline editing (dedicated form better)
- Drag-and-drop reordering (no use case)
- Advanced query builder (simple filters sufficient)
- Mobile app (web-first per project scope)

### ARCHITECTURE.md
**Purpose:** Component structure, data flow, patterns

**Core Pattern:** Container/Presentation split
- **Container:** Manages state, data fetching, event handlers (client component with "use client")
- **Presentation:** Renders UI from props, no state or side effects (pure component)
- **Service:** Provides data with identical interface whether mock or API

**Data Flow:** Unidirectional (top-down)
```
User Interaction → Event Handler (Container) → State Update
→ Re-render with New Props → Presentation Component Updates
```

**Mock-First Development:**
1. **Phase 1:** Static mock data in component
2. **Phase 2:** Extract to mock service with async interface
3. **Phase 3:** Add client state and interactions
4. **Phase 4:** Swap mock service for API calls (container code unchanged)

**State Management Strategy:**
- `useState` for component-local state (filters, search query)
- `Context` for cross-component state (selected order ID)
- `URL` for shareable state (status filter, search term)
- NOT using Redux/Zustand for component state (over-engineering)

**Server/Client Boundaries:**
- Page components STAY server components
- Add "use client" to interactive containers only
- Presentation components inherit client context

### PITFALLS.md
**Purpose:** Common mistakes and how to avoid them

**Critical Pitfalls:**
1. **Filter state explosion** - Multiple filters create state management nightmare. Fix: URL state + single reducer
2. **Mock data shape mismatch** - Mock array doesn't match API response structure. Fix: Define API contract first
3. **Search naive loop** - Re-filtering on every keystroke. Fix: Debounce + useMemo
4. **Selected row without URL** - Can't share/bookmark. Fix: Use query param for selection
5. **Status config duplication** - Same constants in multiple files. Fix: Extract to shared constants

**Moderate Pitfalls:**
- Table re-renders on unrelated state changes (fix: React.memo, useCallback)
- Filter pills non-functional (fix: wire onClick handlers immediately)
- Missing key props (fix: use stable IDs, not index)
- Inline event handlers (fix: useCallback or data attributes)
- No empty states (fix: design alongside happy path)

**Minor Pitfalls:**
- Hardcoded static text (fix: audit for dynamic content)
- Filter counts manually maintained (fix: compute from data)
- No loading skeleton (fix: add skeleton UI)
- Timezone confusion (fix: ISO timestamps, display with timezone)
- Product display logic duplication (fix: shared utility functions)

## Next Steps for Roadmap Creation

**Use this research to inform:**

1. **Milestone scoping** - Features.md table stakes → Milestone 1 requirements
2. **Technical tasks** - Architecture.md patterns → implementation tasks
3. **Risk mitigation** - Pitfalls.md → acceptance criteria and code review checklist
4. **Dependency installation** - Stack.md → package.json updates
5. **Phase ordering** - This summary's implications → roadmap phase structure

**Validation recommendations:**

Before implementing:
1. **Verify library versions:** `npm view <package> version` for each library
2. **Test installation:** Install in project, ensure no dependency conflicts
3. **Review changelogs:** Check TanStack Table, Zustand for React 19 compatibility notes
4. **Prototype patterns:** Create small proof-of-concept for container/presentation split
5. **Design empty states:** Add to Pencil.dev designs before implementation

**Open questions for product owner:**

1. **Default filters:** Should table default to "All" or specific status (e.g., "Pending + Producing")?
2. **Default sort:** Delivery date ascending (soonest first) or descending (furthest first)?
3. **Search scope:** Customer + product only, or include document number, location, etc.?
4. **Pagination:** Show all rows or paginate? Threshold for introducing pagination?
5. **Mobile:** Tablet-responsive (768px+) sufficient, or phone support needed?

## Sources

**Note:** This research was conducted using training data current through January 2025. Web search and documentation fetch tools were unavailable during this research session.

**Primary Sources (training data):**
- TanStack Table official documentation (tanstack.com/table)
- Zustand GitHub repository (github.com/pmndrs/zustand)
- MSW official documentation (mswjs.io)
- React 19 documentation and release notes
- Next.js 16 documentation
- Established React patterns (Container/Presentation, service layer abstraction)

**Codebase Sources:**
- .planning/PROJECT.md - Project context, requirements, constraints
- .planning/codebase/STACK.md - Existing stack (Next.js 16, React 19, Tailwind CSS 4)
- .planning/codebase/CONCERNS.md - Identified risks (mentioned in original analysis)

**Confidence Assessment:**
- Stack recommendations: **MEDIUM** - Based on stable patterns and library ecosystems as of Jan 2025
- Version numbers: **MEDIUM** - Versions current as of Jan 2025, may have newer releases
- React 19 compatibility: **MEDIUM** - Libraries listed were React 19 compatible or planning compatibility as of Jan 2025
- Architecture patterns: **HIGH** - Container/Presentation, service layer are timeless patterns
- Feature recommendations: **HIGH** - Table stakes features are industry standard across all modern dashboards
- Pitfalls: **HIGH** (React patterns), **MEDIUM** (domain-specific)

**Recommended verification:**
- Check npm registry for latest versions of all libraries
- Review each library's changelog for React 19 compatibility confirmation
- Test installation in Next.js 16 + React 19 environment
- Verify TanStack Table API hasn't changed significantly since Jan 2025
- Check MSW v2 setup for Next.js 16 App Router (browser vs server setup)

---

*Research completed: 2026-03-11*
*Research mode: Stack dimension for dashboard interactivity*
*Confidence: MEDIUM (training data based, verification recommended)*
*Feeds into: Milestone 1 roadmap creation and implementation tasks*
