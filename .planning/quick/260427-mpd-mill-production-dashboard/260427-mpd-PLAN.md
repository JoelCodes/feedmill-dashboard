---
phase: quick
plan: 260427-mpd
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/mill-production/page.tsx
  - src/services/millProduction.ts
  - src/types/millProduction.ts
autonomous: true
requirements: [MPD-01]
must_haves:
  truths:
    - "Mill production page exists at /mill-production route"
    - "Page displays three columns: Premix, Excel, CGM"
    - "Each column groups cards by state: Completed, Mixing, Blocked, Pending"
    - "Cards show order number, customer name, weight + product, delivery time"
    - "Left border indicates state color: green (Completed), yellow (Mixing), red (Blocked), grey (Pending)"
    - "Column headers show total completed / total expected weight"
    - "State headers show state name with total weight for that state"
  artifacts:
    - path: "src/app/mill-production/page.tsx"
      provides: "Mill production dashboard page"
      min_lines: 100
    - path: "src/services/millProduction.ts"
      provides: "Mock data service for mill production"
      min_lines: 40
    - path: "src/types/millProduction.ts"
      provides: "TypeScript types for mill production"
      min_lines: 10
  key_links: []
---

<objective>
Create a functional mill production dashboard at /mill-production route with three columns (Premix, Excel, CGM), production cards grouped by state, and mock data service.

Purpose: Production monitoring view showing orders by mill line and production state.
Output: Working page at /mill-production based on the design in designs/mill-production.pen
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/app/globals.css (CSS variables)
@designs/mill-production.pen (Design reference)
@src/app/design/mill-production/page.tsx (Existing prototype for patterns)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create TypeScript types for mill production</name>
  <files>src/types/millProduction.ts</files>
  <action>
Create types for mill production:

1. **MillLine type:**
   ```typescript
   type MillLine = "Premix" | "Excel" | "CGM";
   ```

2. **ProductionState type:**
   ```typescript
   type ProductionState = "Completed" | "Mixing" | "Blocked" | "Pending";
   ```

3. **ProductionOrder interface:**
   ```typescript
   interface ProductionOrder {
     id: string;
     orderNumber: string;
     customer: string;
     product: string;
     weightLbs: number;
     deliveryTime: string;
     state: ProductionState;
     millLine: MillLine;
   }
   ```

Export all types.
  </action>
  <verify>
    <automated>npx tsc src/types/millProduction.ts --noEmit</automated>
  </verify>
  <done>
    - Types exported from src/types/millProduction.ts
    - MillLine, ProductionState, ProductionOrder defined
  </done>
</task>

<task type="auto">
  <name>Task 2: Create mock data service</name>
  <files>src/services/millProduction.ts</files>
  <action>
Create mock data service with realistic mill production data based on the design file.

1. **Mock data matching designs/mill-production.pen:**
   - Premix: Westbridge Farm (Completed), Meadowview Poultry (Mixing), Starbird @ Jaedel (Blocked), Starbird @ Jaedel (Pending)
   - Excel: Severinski Farm (Completed), Jireh Farms (Completed), Corner's Pride Farm (Mixing), Trilean Makin Bacon (Pending)
   - CGM: Rockwall @ Peardonville (Completed), Cedarcroft Poultry (Mixing), Triple H Farms (Blocked), Whytebridge Farms (Pending)

2. **Service functions:**
   ```typescript
   export async function getProductionOrders(): Promise<ProductionOrder[]>
   export async function getOrdersByMillLine(millLine: MillLine): Promise<ProductionOrder[]>
   ```

3. **Add delay (200-300ms) to simulate async behavior**
  </action>
  <verify>
    <automated>npx tsc src/services/millProduction.ts --noEmit</automated>
  </verify>
  <done>
    - Mock data includes orders for all three mill lines
    - Each state type represented across lines
    - Async functions with delay
  </done>
</task>

<task type="auto">
  <name>Task 3: Create mill production page</name>
  <files>src/app/mill-production/page.tsx</files>
  <action>
Create functional mill production page matching the design:

1. **Page layout:**
   - Full page with bg-bg-page background
   - Header with "Mill Production" title and today's date
   - Three-column layout (Premix, Excel, CGM)

2. **Column component:**
   - Column header: Mill name + total progress (e.g., "32K / 406K lbs")
   - Cards grouped by state with state headers

3. **State header:**
   - State name in state color (Completed=green, Mixing=yellow, Blocked=red, Pending=grey)
   - Total weight for that state

4. **Production card:**
   - White background with rounded corners
   - Left border color matching state
   - Order number (small, grey)
   - Customer name (bold)
   - Weight + Product (e.g., "6,000 lbs • BROILER BRD 16% OS")
   - Delivery time (e.g., "Delivery: 8:30 AM")

5. **State colors from design:**
   - Completed: #38a169 (green)
   - Mixing: #d69e2e (yellow)
   - Blocked: #e53e3e (red)
   - Pending: #a0aec0 (grey)

6. **Add loading state with skeleton**
  </action>
  <verify>
    <automated>cd /Users/joel/Desktop/Projects/cgm-dashboard && npm run build 2>&1 | head -50</automated>
  </verify>
  <done>
    - Page renders at /mill-production
    - Three columns with headers
    - Cards grouped by state within each column
    - State headers with totals
    - Cards show all required info with colored borders
  </done>
</task>

</tasks>

<verification>
- `npm run build` completes without errors
- Page accessible at http://localhost:3000/mill-production
- Visual inspection shows three-column layout with grouped cards
- State colors match design specification
</verification>

<success_criteria>
- Types defined and exported
- Mock service returns realistic data
- Page displays all three columns with proper grouping
- Cards match design (order number, customer, weight, product, delivery time)
- State indicators (left border + header color) correct
</success_criteria>

<output>
After completion, create `.planning/quick/260427-mpd-mill-production-dashboard/260427-mpd-SUMMARY.md`
</output>
