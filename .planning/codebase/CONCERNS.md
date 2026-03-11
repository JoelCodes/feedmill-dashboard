# Codebase Concerns

**Analysis Date:** 2026-03-11

## Tech Debt

**Hardcoded Mock Data Throughout Components:**
- Issue: All order and KPI data is hardcoded in component files instead of being fetched from a data source or managed centrally. This makes the dashboard non-functional for real data and difficult to test.
- Files: `src/components/KPICard.tsx` (lines 11-40), `src/components/OrdersTable.tsx` (lines 14-51, 53-59), `src/components/OrderDetails.tsx` (lines 17-58)
- Impact: Cannot display real production data, orders, or metrics. Dashboard is purely a visual prototype. Adding real data sources requires modifying multiple component files.
- Fix approach: Extract data into a data layer (services, hooks, or API routes). Create centralized data models. Implement proper data fetching with loading/error states. Use React hooks or context for state management.

**Missing Error Handling and Loading States:**
- Issue: No error boundaries, loading states, or fallback UI for data operations. If data fetch fails or takes time, users see nothing.
- Files: All component files lack error handling logic
- Impact: Poor user experience if network issues occur. No feedback when data is loading.
- Fix approach: Add React error boundaries, implement loading skeletons, add try-catch blocks for async operations, display user-friendly error messages.

**No Tests**
- Issue: Zero test coverage. No unit, integration, or e2e tests exist.
- Files: No test files found anywhere in the project
- Impact: No way to verify component behavior, catch regressions, or refactor safely. High risk of introducing bugs when adding features.
- Fix approach: Add test framework (jest or vitest), write unit tests for components and logic, add integration tests for data flow.

**Inline Styling with Tailwind in Templates:**
- Issue: Complex styling logic embedded directly in JSX with long className strings (e.g., `src/components/OrderDetails.tsx` line 80, `src/components/OrdersTable.tsx` line 97). Hard to maintain and reuse.
- Files: `src/components/OrderDetails.tsx`, `src/components/OrdersTable.tsx`, `src/components/KPICard.tsx`, `src/components/Header.tsx`
- Impact: Difficult to refactor styles, easy to introduce inconsistencies, hard to create reusable styled components, verbose templates.
- Fix approach: Extract reusable styled components using Tailwind's component layer (@apply directives) or create a component library. Use design tokens consistently.

**Type Safety Issues:**
- Issue: Union types like `OrderStatus` in `src/components/OrdersTable.tsx` (line 3) use string literals. No validation that status values match the defined type. StatCard component (line 121-154) uses optional parameters that could lead to undefined rendering.
- Files: `src/components/OrdersTable.tsx`, `src/components/OrderDetails.tsx`
- Impact: Risk of passing invalid status values that won't render correctly. Difficult to add new statuses without updating multiple places.
- Fix approach: Use enums instead of string unions. Add runtime validation with zod or similar. Create factory functions for creating valid order objects.

## Known Bugs

**Missing Key Props on List Items:**
- Symptoms: React console warnings about missing key props when rendering lists with dynamic data
- Files: `src/components/KPICard.tsx` (line 46), `src/components/OrderDetails.tsx` (line 101), `src/components/OrdersTable.tsx` (line 163)
- Trigger: Render any component that maps over arrays. Would cause issues if data order changes.
- Workaround: Currently uses static data so order never changes; issue only manifests with real dynamic data.

**Type Assertion in Sidebar:**
- Symptoms: CSS class with variable reference has incorrect syntax in `src/components/Sidebar.tsx` line 91
- Files: `src/components/Sidebar.tsx` (line 91): `text-[--primary]` should be `text-[var(--primary)]`
- Trigger: Active nav items show wrong text color due to malformed CSS variable reference
- Workaround: Active state appears to work visually despite the bug due to other styling

**StatCard Props Don't Align:**
- Symptoms: StatCard component (lines 121-154) accepts optional `unit`, `percentage`, `subtext` but all three are never used simultaneously as displayed
- Files: `src/components/OrderDetails.tsx` (lines 93-95)
- Trigger: When rendering stat cards with mixed prop combinations, conditional rendering may create unexpected layouts
- Workaround: Currently hardcoded data matches prop patterns, but fragile if stat data changes

## Security Considerations

**No Input Validation:**
- Risk: Search input in Header component (`src/components/Header.tsx` line 21-25) accepts any text with no validation or sanitization. Could be vector for XSS if integrated with real data.
- Files: `src/components/Header.tsx`
- Current mitigation: Currently non-functional (no-op), so user input isn't used anywhere
- Recommendations: Add input validation and sanitization. Use proper escaping when displaying user input. Consider using form libraries that handle validation (e.g., React Hook Form with zod).

**No Authentication/Authorization:**
- Risk: Dashboard displays sensitive production data (order details, shipment information) with no access control.
- Files: All component files expose data without permission checks
- Current mitigation: None - this is a prototype
- Recommendations: Implement authentication middleware, add role-based access control, protect API endpoints, validate permissions before rendering sensitive data.

**Hardcoded Sensitive Information Potential:**
- Risk: Customer names, farm locations, and order details are hardcoded in components. Production version must not hardcode real customer data.
- Files: `src/components/OrdersTable.tsx` (lines 14-51), `src/components/OrderDetails.tsx` (lines 17-58)
- Current mitigation: Mock data only, marked as "Greenfield Farms, TX" etc.
- Recommendations: Never hardcode real customer data. Use environment variables for sensitive config. Consider data classification strategy.

## Performance Bottlenecks

**Large Inline SVG/Icon Rendering:**
- Problem: Using Lucide icons (which render as SVG) extensively throughout components. Each icon renders without memoization.
- Files: `src/components/Header.tsx`, `src/components/KPICard.tsx`, `src/components/OrderDetails.tsx`, `src/components/OrdersTable.tsx`, `src/components/Sidebar.tsx`
- Cause: No component memoization, icons re-render on parent updates even if not changed
- Improvement path: Wrap icon components with React.memo. Consider sprite icons for high-frequency icons. Audit re-render count.

**Timeline Rendering Without Virtualization:**
- Problem: `src/components/OrderDetails.tsx` renders 5 timeline items. If this scales to 100+ items, rendering will lag.
- Files: `src/components/OrderDetails.tsx` (lines 100-115)
- Cause: Full list rendered in DOM without virtual scrolling
- Improvement path: Implement react-window or similar for long lists. Lazy-load timeline items.

**No Lazy Loading or Code Splitting:**
- Problem: All components loaded upfront in `src/app/page.tsx`. Heavy components aren't split.
- Files: `src/app/page.tsx`
- Cause: Static imports without dynamic imports
- Improvement path: Use Next.js dynamic imports for heavy components (e.g., tables, charts). Implement route-based code splitting.

## Fragile Areas

**OrderDetails Component - Timeline Logic:**
- Files: `src/components/OrderDetails.tsx` (lines 100-114)
- Why fragile: Timeline connector color logic hardcoded with index-based conditions (lines 105-111). Adding/removing timeline steps breaks color logic. No abstraction.
- Safe modification: Extract timeline color logic into separate function. Use TimelineStep data to determine colors instead of index.
- Test coverage: No tests exist for timeline rendering or color logic

**Status Configuration Objects:**
- Files: `src/components/OrdersTable.tsx` (lines 61-93), `src/components/OrderDetails.tsx` (lines 60-76)
- Why fragile: `statusConfig` objects duplicated across two files. Changing a status color requires updating both. Adding new status requires updates in multiple places.
- Safe modification: Move statusConfig to shared constants file. Create utility function to access config. Use TypeScript to enforce all statuses have config.
- Test coverage: No tests for status badge rendering or color application

**KPI Card Layout Assumptions:**
- Files: `src/components/KPICard.tsx` (lines 44-48)
- Why fragile: Layout assumes exactly 4 KPI cards fit in row with `flex gap-6 w-full`. Responsive behavior unclear. Adding 5th card breaks layout.
- Safe modification: Add responsive breakpoints. Test with different viewport sizes. Consider making gap and layout configurable.
- Test coverage: No visual regression tests

**Nav Item Active State Logic:**
- Files: `src/components/Sidebar.tsx` (lines 79-83, 86-88)
- Why fragile: Active state hardcoded in nav items data (lines 11-16, 18). No actual routing logic. Clicking items won't navigate. State doesn't sync with real routes.
- Safe modification: Replace hardcoded `active` boolean with actual routing. Use Next.js usePathname hook. Add onClick handlers.
- Test coverage: No tests for navigation behavior

## Scaling Limits

**Static Component Model:**
- Current capacity: 5 orders shown, 4 KPI cards, 1 selected order detail
- Limit: Dashboard breaks if more than 5-7 orders displayed (no pagination/virtualization). Header search non-functional if actual search implemented. Settings/Notification buttons non-functional.
- Scaling path: Add pagination to OrdersTable. Implement virtual scrolling for long lists. Add real search backend. Connect buttons to actual pages.

**No Database Integration:**
- Current capacity: Hardcoded data only
- Limit: Cannot scale to real production data, multiple users, historical data
- Scaling path: Add database (PostgreSQL/MongoDB). Create API layer. Implement caching strategy. Add real-time updates if needed.

**Monolithic Component Structure:**
- Current capacity: Small dashboard works with 7 component files
- Limit: Adding features (filtering, export, drill-down) requires modifying existing components. No clear module boundaries.
- Scaling path: Create feature-based directory structure. Extract shared logic to hooks. Create compound component patterns for complex sections.

## Dependencies at Risk

**React 19.2.3 - Early Adoption Risk:**
- Risk: React 19.2.3 is a relatively recent version. Breaking changes less likely but ecosystem may lag behind.
- Impact: Potential compatibility issues with third-party libraries, limited community examples, less battle-tested patterns
- Migration plan: Stay on current version for now. Monitor for security updates. Have plan to upgrade to LTS version if issues emerge.

**Next.js 16.1.6 - Rapid Release Cycle:**
- Risk: Next.js releases frequently. Staying on latest requires constant updates.
- Impact: If not updated regularly, security vulnerabilities could accumulate. Breaking changes in minor versions possible.
- Migration plan: Pin versions in package-lock.json (already done). Set up automated dependency updates. Run tests on upgrades before merging.

**Tailwind CSS v4 (PostCSS):**
- Risk: PostCSS integration adds build dependency. CSS-in-JS with Tailwind can cause specificity issues.
- Impact: Build failures if PostCSS config breaks. CSS specificity wars if custom CSS added.
- Migration plan: Keep CSS in separate globals.css. Use Tailwind's @apply sparingly. Consider CSS Modules for component-specific styles.

## Missing Critical Features

**No Real Data Integration:**
- Problem: Dashboard displays no real production, order, or shipment data
- Blocks: Cannot be used operationally until data APIs/database connected

**No User Interaction:**
- Problem: Search, Settings, Notifications, and navigation buttons non-functional. Cannot filter orders, change settings, or navigate to other pages.
- Blocks: Cannot test user workflows. Cannot deploy without interactivity.

**No Responsive Design:**
- Problem: Sidebar width fixed to 280px, main content layout assumes 1920px+ viewport. Not tested on mobile/tablet.
- Blocks: Cannot use on mobile devices. May break on smaller screens.

**No State Management:**
- Problem: No way to track selected order, filter state, user preferences
- Blocks: Cannot implement features like "remember last selected order" or apply filters across page

## Test Coverage Gaps

**All Components Untested:**
- What's not tested: Every React component (Header, Sidebar, KPICard, OrdersTable, OrderDetails). No unit tests for rendering, props handling, or conditional logic.
- Files: All files in `src/components/` and `src/app/`
- Risk: Changes to component logic could break UI without detection. Styling regressions undetected.
- Priority: High - must add component tests before adding features

**No Integration Tests:**
- What's not tested: Data flow between components, state updates, prop drilling chains
- Files: N/A - no integration test layer exists
- Risk: Components work individually but fail when composed
- Priority: High - critical for catching integration bugs

**No E2E Tests:**
- What's not tested: User workflows (selecting order, navigating pages, filtering)
- Files: N/A - no e2e test infrastructure
- Risk: User-facing bugs only caught in production
- Priority: Medium - necessary before public launch

**Style/Layout Tests Missing:**
- What's not tested: Responsive behavior, icon rendering, color application, text overflow
- Files: All component files
- Risk: Visual regressions on different devices/browsers
- Priority: Medium - needed for quality assurance

---

*Concerns audit: 2026-03-11*
