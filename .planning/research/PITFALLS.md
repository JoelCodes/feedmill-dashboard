# Domain Pitfalls: Dashboard Interactivity

**Domain:** Feed mill operations dashboard — adding interactivity to existing static React prototype
**Researched:** 2026-03-11
**Confidence:** MEDIUM (based on training data, existing codebase analysis, and domain patterns)

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Filter State Explosion
**What goes wrong:** Multiple filter dimensions (status pills, search input, "has changes" flag) create combinatorial state management nightmare. Each filter adds state, and state updates trigger re-renders of unrelated components.

**Why it happens:**
- Starting with component-level `useState` for each filter
- No single source of truth for filter state
- Filters don't coordinate updates (race conditions)
- URL state and component state diverge
- Filter counts computed on every render instead of memoized

**Consequences:**
- Performance degrades as table grows (re-filtering entire dataset on every keystroke)
- Back button doesn't restore filters (no URL state)
- Filters reset when navigating away and back
- Can't share filtered views (no URL persistence)
- Inconsistent state between status counts and visible rows
- Race conditions when multiple filters change simultaneously

**Prevention:**
1. **Use URL as state source** — encode filters in query params from day one (`?status=shipped&search=greenfield&changes=true`)
2. **Single reducer for all filter state** — one `useReducer` hook managing all filter dimensions
3. **Debounce search input** — 300ms delay before applying search filter
4. **Memoize filtered results** — `useMemo` for expensive filter operations
5. **Compute counts from filtered data** — don't maintain separate count state

**Detection:**
- Multiple `useState` calls for filters in same component
- Filter pill counts hardcoded instead of computed
- Search triggers immediate re-render on keystroke
- URL doesn't change when filters applied
- Console shows excessive re-renders during filtering

**Phase impact:** Milestone 1 (Orders Table) — implement filter architecture correctly from start, or face rewrite before Milestone 2

---

### Pitfall 2: Mock Data Shape Mismatch
**What goes wrong:** Mock data structure doesn't match real API response structure. Code works with `orders: Order[]` mock array but real API returns `{ data: { orders: Order[], pagination: {...}, meta: {...} } }`. Entire data layer breaks on integration.

**Why it happens:**
- Mock data created by developer, not from API contract
- No API schema validation (no Zod, TypeScript-only types)
- Frontend defines data structure, backend defines differently
- Pagination, error states, loading states not in mock
- Real API has nested objects, mock has flat structure
- No API documentation/contract to reference

**Consequences:**
- Week-long rewrite when switching to real API
- Every component using order data breaks
- Loading/error states bolted on as afterthought
- Pagination requires full component refactor
- Type assertions (`as Order[]`) mask real structure
- Integration tests fail because mock doesn't match reality

**Prevention:**
1. **Define API contract first** — OpenAPI/Swagger spec or JSON schema before mock data
2. **Mock the entire response shape** — include `data`, `meta`, `pagination`, `errors` wrapper
3. **Use Zod schemas** — runtime validation catches shape mismatches
4. **Include edge cases in mock** — empty arrays, null values, error responses
5. **Mock loading/error states** — simulate network delay and failures
6. **Generate mocks from schema** — tools like MSW, faker-js with Zod
7. **Create data fetching abstraction early** — custom hooks like `useOrders()` that handle response unwrapping

**Detection:**
- Mock data is flat array, not wrapped in response object
- No `loading`, `error`, `isValidating` states in components
- No pagination properties in mock
- TypeScript types don't include API metadata
- Components import mock data directly instead of via hook
- No error boundary around data-dependent components

**Phase impact:** Infrastructure phase before Milestone 1 — mock data layer architecture determines integration difficulty

---

### Pitfall 3: Search Implementation Naive Loop
**What goes wrong:** Search filters on every keystroke by looping through all orders with `.includes()`. Works fine with 5 orders. Becomes unusable at 500 orders, crawls to halt at 5000+ orders.

**Why it happens:**
- No debouncing on search input
- Case-sensitive string matching (`.includes()` instead of `.toLowerCase().includes()`)
- Searching entire object instead of specific fields
- Re-running search on every render, not just when search term changes
- No search index or optimization
- Filtering happens in render function, not in memo

**Consequences:**
- UI freezes on every keystroke with large datasets
- Typing "greenfield" triggers 10 filter operations (one per character)
- Mobile devices become unusable (slower JS execution)
- Battery drain from constant re-filtering
- Users abandon search and manually scroll
- Performance regression not caught until production with real data

**Prevention:**
1. **Debounce search input** — 300-500ms delay using `useDeferredValue` or custom debounce hook
2. **Memoize search results** — `useMemo` with dependency on debounced search term
3. **Case-insensitive search** — normalize both term and data to lowercase
4. **Search specific fields only** — whitelist `[customer, product, documentNumber]`, not entire object
5. **Consider server-side search** — if dataset grows beyond 1000 items
6. **Use fuzzy search library** — fuse.js for better UX, pre-builds search index
7. **Show "searching..." indicator** — during debounce delay, show loading state

**Detection:**
- Input onChange handler directly updates filter state
- Filter logic in component body, not `useMemo`
- No debounce delay between typing and filtering
- Console shows render on every keystroke
- Performance profiler shows filter function taking >16ms
- Users report "laggy typing" or "frozen table"

**Phase impact:** Milestone 1 (Orders Table) — search architecture determines scalability

---

### Pitfall 4: Selected Row State Without URL
**What goes wrong:** Row selection stored in component state (`useState`). Clicking row opens details panel, but refreshing page or sharing URL loses selection. No deep linking to specific orders.

**Why it happens:**
- Using `useState` for selected order ID
- Not considering shareable state
- Details panel coupled to table selection state
- No routing for detail view
- Developer thinking "it's just a panel, not a page"

**Consequences:**
- Can't share link to specific order with colleagues
- Refresh loses selected order (frustrating in production use)
- Browser back button doesn't close panel
- Can't open multiple orders in tabs
- No way to bookmark specific order
- Analytics can't track which orders viewed most

**Prevention:**
1. **Use URL for selection** — `?order=ORD-2847` query param
2. **Sync selection to URL** — update URL when row clicked, read URL on mount
3. **Close panel when URL cleared** — back button removes query param, panel closes
4. **Support direct navigation** — `/orders/ORD-2847` route for detail view
5. **Validate order ID from URL** — handle invalid/missing orders gracefully

**Detection:**
- Selection state in `useState`, not from URL
- Sharing URL doesn't restore UI state
- Back button doesn't close panel
- No query params in browser address bar when panel open
- Selection lost on page refresh

**Phase impact:** Milestone 2 (Order Details) — determines navigation UX and shareability

---

### Pitfall 5: Status Config Duplication
**What goes wrong:** `statusConfig` object duplicated in `OrdersTable.tsx` and `OrderDetails.tsx`. Adding new status requires updating both files. Status colors drift out of sync, badges show different colors than pills.

**Why it happens:**
- Copy-paste reuse instead of shared constants
- No design tokens for status colors
- Urgency to ship prevents refactoring
- "I'll clean it up later" that never happens
- Different developers working on different components

**Consequences:**
- Design inconsistency (status "shipped" is green in table, teal in details)
- Adding "cancelled" status requires 4 file edits (2 configs, 2 type definitions)
- Bug where one config updated, other forgotten
- Increased bundle size (duplicate objects)
- Maintenance nightmare as status list grows

**Prevention:**
1. **Extract to shared constants** — `src/constants/orderStatus.ts` from start
2. **Single source of truth** — one `OrderStatus` type, one `statusConfig` object
3. **Design tokens for colors** — CSS variables already exist, use them
4. **Status enum** — not string union, prevents typos
5. **Linting rule** — prevent duplicate constants in codebase

**Detection:**
- Grep for "statusConfig" shows multiple definitions
- Status colors differ between components
- TypeScript type for OrderStatus defined in multiple files
- Adding new status requires editing >2 files
- StatusBadge component duplicated across files

**Phase impact:** Milestone 1 cleanup — technical debt that compounds with each milestone

---

## Moderate Pitfalls

### Pitfall 6: Data Table Re-renders on Unrelated State Changes
**What goes wrong:** Entire table re-renders when unrelated state changes (e.g., opening settings modal, notification badge update). Each row re-mounts, performance degrades.

**Why it happens:**
- No React.memo on row components
- Table component not memoized
- Parent component state changes trigger full tree re-render
- Props reference changes (inline functions, new objects each render)

**Prevention:**
1. **Memo table rows** — `React.memo(OrderRow, (prev, next) => prev.order.id === next.order.id)`
2. **Stable callbacks** — use `useCallback` for onClick handlers passed to rows
3. **Separate state contexts** — notification state shouldn't trigger table re-render
4. **React DevTools Profiler** — measure re-renders, identify unnecessary updates

**Detection:**
- React DevTools shows table highlighted on unrelated state changes
- Console.log in row component fires when it shouldn't
- Performance degrades as features added
- Profiler shows row components re-rendering with identical props

**Phase impact:** Performance optimization phase (likely after Milestone 3)

---

### Pitfall 7: Filter Pills Active State Not Controlled
**What goes wrong:** FilterPill components have `active` prop but clicking them doesn't update active state. Filter pills non-functional, look interactive but don't work.

**Why it happens:**
- Active state hardcoded in JSX (`<FilterPill active />`)
- No onClick handler wired up
- No state management for active filter
- Visual design implemented before interaction logic
- "Make it look right first, make it work later"

**Prevention:**
1. **Controlled components from start** — `active={activeFilter === 'shipped'}` not `active`
2. **Wire onClick immediately** — even if handler just logs for now
3. **Test interaction in dev** — click every interactive element to verify it works
4. **TypeScript strict mode** — require onClick when interactive={true}

**Detection:**
- Clicking filter pills does nothing
- Active state never changes
- No onClick handlers in FilterPill component
- Active prop is boolean, not derived from state

**Phase impact:** Milestone 1 (Orders Table) — filters must work, not just look functional

---

### Pitfall 8: Missing Key Prop on Mapped Elements
**What goes wrong:** Timeline items, table rows, filter pills missing `key` prop. React console warnings in dev, re-order bugs in production.

**Why it happens:**
- Developer silences warnings with `key={index}`
- Not understanding React reconciliation
- Works with static data, breaks with dynamic sorting/filtering
- Copy-paste from tutorial code

**Consequences:**
- React can't efficiently update list when order changes
- Sorting table causes wrong rows to highlight
- Filtering causes input focus loss
- State attached to wrong items after re-order
- Animations glitch on reordering

**Prevention:**
1. **Use stable unique IDs** — `key={order.id}`, never `key={index}`
2. **Linting rule** — enforce key prop on mapped elements
3. **Generate IDs for items without them** — `uuid()` or nanoid for timeline steps
4. **Test reordering** — sort table, ensure selection persists correctly

**Detection:**
- React warning in console: "Each child should have unique key prop"
- Using `key={index}` in map functions
- Sorting table causes selected row to change
- Timeline items with key={step.title} (titles might duplicate)

**Phase impact:** Code quality issue, fix during Milestone 1 implementation

---

### Pitfall 9: Inline Event Handlers Create New Functions Every Render
**What goes wrong:** `onClick={() => handleRowClick(order.id)}` creates new function on every render. Breaks memo optimization, causes unnecessary re-renders.

**Why it happens:**
- Convenience of inline arrow functions
- Not understanding JavaScript closure creation
- Works fine in small apps, doesn't scale
- Linters don't catch by default

**Prevention:**
1. **useCallback for handlers** — `const handleClick = useCallback(() => {...}, [deps])`
2. **Data attributes** — `onClick={handleRowClick} data-order-id={order.id}`, read from `event.currentTarget.dataset`
3. **Curried functions** — `onClick={handleRowClick(order.id)}` where handleRowClick returns a function
4. **ESLint rule** — react/jsx-no-bind or similar

**Detection:**
- Inline arrow functions in JSX
- React.memo not preventing re-renders
- Profiler shows components re-rendering despite identical props
- Performance degrades with table size

**Phase impact:** Performance optimization, address in Milestone 1 or 2

---

### Pitfall 10: Search UX Has No Empty State
**What goes wrong:** Searching for non-existent customer shows empty table with no message. User doesn't know if search is broken, loading, or actually no results.

**Why it happens:**
- Only designing happy path (results exist)
- Not considering edge cases
- Filtering returns empty array, table renders nothing
- No UX design for "no results" state

**Prevention:**
1. **Empty state component** — "No orders match your search. Try different terms."
2. **Show search term in message** — "No results for 'zzzz'"
3. **Suggest actions** — "Clear filters" button, "View all orders" link
4. **Differentiate empty states** — "No orders yet" vs "No matching orders" vs "Loading..."
5. **Design empty states upfront** — include in Pencil.dev designs

**Detection:**
- Blank white space when no results
- No feedback when search returns nothing
- Users confused whether search is working
- No way to recover except manual URL edit

**Phase impact:** UX polish in Milestone 1, can be added incrementally

---

## Minor Pitfalls

### Pitfall 11: Hardcoded "18 dispatched this week" Static Text
**What goes wrong:** Stat text "18 dispatched this week" is hardcoded string. Doesn't update with real data, looks broken when real numbers show.

**Why it happens:**
- Design includes specific example text
- Developer copies exact text from design
- Not thinking about data source for secondary stats
- "Ship the MVP, fix later"

**Prevention:**
1. **Identify all dynamic text during planning** — audit design for numbers/dates
2. **Mock data includes all displayed values** — if it's shown, it's in the data
3. **Flag TODOs** — `// TODO: Calculate from real dispatch data`
4. **Use realistic ranges in mock** — vary the number between 12-25 to make dynamic nature obvious

**Detection:**
- Grep for hardcoded numbers in JSX
- Values never change despite data changing
- Numbers don't match actual order counts
- Copy-paste from design file includes static numbers

**Phase impact:** Data architecture in Infrastructure phase, noticed in testing

---

### Pitfall 12: Filter Counts Manually Maintained
**What goes wrong:** `statusCounts` object manually updated when mock data changes. Real data requires recomputing counts, but code structure assumes hardcoded counts.

**Why it happens:**
- Static mock data approach
- Counts easier to hardcode than compute
- Not thinking about dynamic data
- Copy from design spec which shows example counts

**Prevention:**
1. **Compute counts from data** — `const counts = useMemo(() => orders.reduce((acc, o) => {...}, {}), [orders])`
2. **Derive, don't duplicate** — single source of truth (orders array), derive everything else
3. **Test with varying data** — change mock data, verify counts update automatically
4. **Make derivation obvious** — function named `computeStatusCounts(orders)`

**Detection:**
- Separate `statusCounts` object exists
- Counts don't update when filtering
- Adding mock order doesn't change count badge
- Filtered view shows wrong counts

**Phase impact:** Milestone 1 implementation, fixing requires refactor

---

### Pitfall 13: No Loading Skeleton for Table
**What goes wrong:** Table switches instantly from empty to full data. With real API, there's 200-500ms loading time showing blank screen.

**Why it happens:**
- Mock data loads synchronously
- No loading state in component
- Didn't simulate async loading in dev
- Skeleton states seem like "nice to have"

**Prevention:**
1. **Add loading prop to table** — `<OrdersTable loading={isLoading} />`
2. **Render skeleton rows** — 5 animated skeleton rows during load
3. **Simulate delay in mock** — `await sleep(300)` in mock data hook
4. **Loading states in all data components** — KPIs, table, details all need skeletons

**Detection:**
- No loading indicator when fetching data
- Flash of empty content before data appears
- No skeleton UI in codebase
- Components assume data always available immediately

**Phase impact:** Infrastructure phase, before real API integration

---

### Pitfall 14: Timezone Handling Assumptions
**What goes wrong:** Timeline shows dates like "Mar 18, 2026 · 9:15 AM" but doesn't specify timezone. Server stores UTC, display shows user's local time, causing confusion ("order says 9:15 AM but I placed it at 11:15 AM").

**Why it happens:**
- Mock data has formatted strings, not Date objects
- No consideration of multi-timezone users
- JavaScript Date defaults to local timezone
- Backend and frontend timezone mismatch

**Prevention:**
1. **Store dates as ISO 8601** — `"2026-03-18T09:15:00Z"` not formatted strings
2. **Display with timezone** — "Mar 18, 2026 · 9:15 AM CST" or use relative time "2 hours ago"
3. **Use date library** — date-fns or day.js for formatting
4. **Consistent timezone in app** — all times in mill's local timezone, or all in user's timezone (decide and document)
5. **Include timezone in API response** — `{ timestamp: "...", timezone: "America/Chicago" }`

**Detection:**
- Date strings in mock data instead of ISO timestamps
- No timezone indicator in UI
- Using `new Date().toString()` instead of library
- Date formatting inconsistent across components

**Phase impact:** Data modeling phase, harder to fix after launch

---

### Pitfall 15: Product Display Logic Duplication
**What goes wrong:** Product column shows "Layer Mash" (combining Texture Type + Formula Type). Logic exists in table but when detail view needs same formatting, it's duplicated or inconsistent.

**Why it happens:**
- No utility functions for display logic
- Each component formats data independently
- "Just interpolate the string in JSX"
- Data transformation scattered across components

**Prevention:**
1. **Utility functions for formatting** — `formatProductName(order)` in `src/utils/formatting.ts`
2. **Derive display values in data layer** — add `displayName` to order object during fetch
3. **Shared display components** — `<ProductName order={order} />` used everywhere
4. **Document formatting rules** — "Product = {texture} {formula}" in data docs

**Detection:**
- String interpolation for product name in multiple files
- Grep for "order.product" shows different formatting logic
- Detail panel shows "Mash" but table shows "Layer Mash"
- No shared formatting utilities

**Phase impact:** Code organization, refactor before Milestone 2

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Milestone 1: Orders Table** | Filter state explosion (Critical #1) | Implement URL-based filter state from start, use single reducer |
| **Milestone 1: Orders Table** | Search naive loop (Critical #3) | Debounce input, memoize results, test with 500+ items |
| **Milestone 1: Orders Table** | Filter pills non-functional (Moderate #7) | Wire onClick handlers before visual polish |
| **Milestone 1: Orders Table** | Missing keys on rows (Moderate #8) | Use order.id as key, enable ESLint rule |
| **Milestone 1: Orders Table** | Hardcoded counts (Minor #12) | Compute from filtered data, don't maintain separate count state |
| **Infrastructure before M1** | Mock data shape mismatch (Critical #2) | Define API contract first, mock entire response structure including meta/pagination |
| **Infrastructure before M1** | No loading states (Minor #13) | Add skeleton UI, simulate async loading in dev |
| **Milestone 2: Order Details** | Selected row without URL (Critical #4) | Use query param for selected order, sync with URL state |
| **Milestone 2: Order Details** | Status config duplication (Critical #5) | Extract to shared constants before adding features |
| **Milestone 2: Order Details** | Timezone confusion (Minor #14) | Use ISO timestamps, display with timezone or relative time |
| **Milestone 3: KPI Cards** | Table re-renders on KPI click (Moderate #6) | Memo table components, use stable callbacks |
| **Cross-cutting** | Inline event handlers (Moderate #9) | Use useCallback or data attributes from start |
| **Cross-cutting** | Product formatting duplication (Minor #15) | Create shared utility functions for display logic |
| **Design → Code** | Empty states missing (Moderate #10) | Design empty states in Pencil.dev, implement alongside happy path |
| **Design → Code** | Static text hardcoded (Minor #11) | Audit designs for dynamic content, add to data model |

---

## Research Notes

**Confidence assessment:**
- **HIGH confidence:** Pitfalls #1, #2, #3, #5, #7, #8 are well-documented React patterns from training data and existing codebase analysis shows these exact risks
- **MEDIUM confidence:** Pitfalls #4, #6, #9, #10, #12, #13, #15 are general React best practices applicable to this domain
- **LOW confidence:** Pitfalls #11, #14 are domain-specific assumptions based on feed mill operations context

**Sources:**
- Existing codebase analysis (.planning/codebase/CONCERNS.md identified many of these risks)
- React documentation patterns (training data)
- Dashboard interactivity patterns from training data
- Feed mill domain context from PROJECT.md

**Gaps:**
- Real-world feed mill operations workflows not researched (would improve domain-specific pitfalls)
- Specific React 19 gotchas not verified (training data from Jan 2025)
- Next.js 16 specific patterns not researched (version released after training cutoff)
- TanStack Table or other table library patterns not researched (might be better than custom implementation)

**Recommendations for deeper research:**
- Phase-specific: Before Milestone 1, research React table libraries (TanStack Table, react-window) for performance patterns
- Phase-specific: Before Infrastructure phase, research Next.js 15+ data fetching patterns (Server Components, Server Actions)
- Phase-specific: Before Milestone 2, research URL state management libraries (nuqs, next-usequerystate)
