# Integration Guide: Mill Production v1.1 Filter Implementation

**Target audience:** Developer implementing the filters
**Purpose:** Step-by-step integration instructions, exact file locations, code snippets
**Prerequisite:** Approval of MILL-PRODUCTION-V1.1-ARCHITECTURE.md

## Quick Reference

### Files to Create
- `/src/components/ui/FilterPill.tsx` (extract from OrdersTable)

### Files to Modify
- `/src/app/mill-production/page.tsx` (add state + filtering)
- `/src/components/OrdersTable.tsx` (import FilterPill instead of inline)

### Files Unchanged
- `/src/services/millProduction.ts`
- `/src/types/millProduction.ts`
- All other components

### New Dependencies
- None (use existing React hooks)

### Import Changes
```typescript
// mill-production/page.tsx
import { useMemo } from "react"; // Already imported, ensure it's there
import FilterPill from "@/components/ui/FilterPill"; // NEW
```

## Phase 1: Extract FilterPill

### Step 1.1: Examine Current Implementation (Reference)

**File:** `/src/components/OrdersTable.tsx`
**Lines:** 396-432
**Current code:**
```typescript
interface FilterPillProps {
  label: string;
  count: number;
  status?: OrderStatus;
  isActive: boolean;
  onClick: () => void;
  showDot?: boolean;
  dotColor?: string;
}

function FilterPill({ label, count, status, isActive, onClick, showDot, dotColor }: FilterPillProps) {
  const config = status ? STATUS_CONFIG[status] : null;

  // Only show dot when selected
  const hasDot = isActive && (showDot || !!config?.dot);

  // Colors change based on active state, structure stays the same
  const bgClass = isActive ? 'bg-primary' : (config?.bg || 'bg-gray-100');
  const textClass = isActive ? 'text-white' : (config?.text || 'text-gray-600');
  const countBgClass = isActive ? 'bg-white/20' : (config?.countBg || 'bg-gray-200');
  const dotBgClass = isActive
    ? (showDot ? 'bg-white' : 'bg-white/60')
    : (showDot ? (dotColor || 'bg-gray-600') : (config?.dot || 'bg-gray-600'));

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 ${bgClass} rounded-xl px-2.5 py-2 transition-colors hover:opacity-90`}
    >
      {hasDot && <div className={`h-2 w-2 rounded-full ${dotBgClass}`} />}
      <span className={`text-[11px] font-bold ${textClass}`}>{label}</span>
      <div className={`${countBgClass} flex items-center rounded-lg px-1.5`}>
        <span className={`text-[10px] font-bold ${textClass}`}>{count}</span>
      </div>
    </button>
  );
}
```

### Step 1.2: Create New File

**File path:** `/src/components/ui/FilterPill.tsx`

**Content:**
```typescript
import { OrderStatus } from "@/types/order";
import { STATUS_CONFIG } from "@/components/ui/StatusBadge";

interface FilterPillProps {
  label: string;
  count: number;
  status?: OrderStatus;
  isActive: boolean;
  onClick: () => void;
  showDot?: boolean;
  dotColor?: string;
}

export default function FilterPill({
  label,
  count,
  status,
  isActive,
  onClick,
  showDot,
  dotColor,
}: FilterPillProps) {
  const config = status ? STATUS_CONFIG[status] : null;

  // Only show dot when selected
  const hasDot = isActive && (showDot || !!config?.dot);

  // Colors change based on active state, structure stays the same
  const bgClass = isActive ? 'bg-primary' : (config?.bg || 'bg-gray-100');
  const textClass = isActive ? 'text-white' : (config?.text || 'text-gray-600');
  const countBgClass = isActive ? 'bg-white/20' : (config?.countBg || 'bg-gray-200');
  const dotBgClass = isActive
    ? (showDot ? 'bg-white' : 'bg-white/60')
    : (showDot ? (dotColor || 'bg-gray-600') : (config?.dot || 'bg-gray-600'));

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 ${bgClass} rounded-xl px-2.5 py-2 transition-colors hover:opacity-90`}
    >
      {hasDot && <div className={`h-2 w-2 rounded-full ${dotBgClass}`} />}
      <span className={`text-[11px] font-bold ${textClass}`}>{label}</span>
      <div className={`${countBgClass} flex items-center rounded-lg px-1.5`}>
        <span className={`text-[10px] font-bold ${textClass}`}>{count}</span>
      </div>
    </button>
  );
}
```

### Step 1.3: Update OrdersTable to Import FilterPill

**File:** `/src/components/OrdersTable.tsx`
**Action:** Replace inline FilterPill function with import

**Before:**
```typescript
// ... existing imports ...

interface FilterPillProps {
  label: string;
  count: number;
  status?: OrderStatus;
  isActive: boolean;
  onClick: () => void;
  showDot?: boolean;
  dotColor?: string;
}

function FilterPill({ label, count, status, isActive, onClick, showDot, dotColor }: FilterPillProps) {
  // ... 30 lines of implementation ...
}

export default function OrdersTable({ ... }) {
  // ... component code ...
}
```

**After:**
```typescript
import FilterPill from "@/components/ui/FilterPill";
// ... other imports ...

export default function OrdersTable({ ... }) {
  // ... component code remains identical ...
}
```

### Step 1.4: Test Phase 1

**Action:** Run the app and verify OrdersTable still works

```bash
npm run dev
```

**Verification:**
- [ ] Navigate to `/orders`
- [ ] All filter pills visible
- [ ] Click filter pills → filtering works
- [ ] Counts update correctly
- [ ] No console errors
- [ ] No TypeScript errors

**Expected time:** 15 minutes

---

## Phase 2: Update Mill Production Page

### Step 2.1: Add Imports

**File:** `/src/app/mill-production/page.tsx`
**Location:** Top of file, after existing imports

**Add:**
```typescript
import { useMemo } from "react";
import FilterPill from "@/components/ui/FilterPill";
```

**Check existing imports for:**
- `useEffect` (should already exist)
- `useState` (should already exist)
- `ProductionState` type (should already exist)

### Step 2.2: Add State Variables

**File:** `/src/app/mill-production/page.tsx`
**Location:** Inside `MillProductionPage` function, after existing useState calls (around line 165)

**Current code:**
```typescript
export default function MillProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... existing fetch code ...
  }, []);
```

**Add after `setLoading` line:**
```typescript
  const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());
```

**Complete section should look like:**
```typescript
export default function MillProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());

  useEffect(() => {
    // ... existing fetch code ...
  }, []);
```

### Step 2.3: Add Toggle Handler

**Location:** Inside `MillProductionPage`, after useEffect (around line 180)

**Add:**
```typescript
  const toggleState = (state: ProductionState) => {
    setActiveStates(prev => {
      const next = new Set(prev);
      if (next.has(state)) {
        next.delete(state);
      } else {
        next.add(state);
      }
      return next;
    });
  };
```

**Complete section should look:**
```typescript
  useEffect(() => {
    // ... existing code ...
  }, []);

  const toggleState = (state: ProductionState) => {
    setActiveStates(prev => {
      const next = new Set(prev);
      if (next.has(state)) {
        next.delete(state);
      } else {
        next.add(state);
      }
      return next;
    });
  };
```

### Step 2.4: Add Computed Values

**Location:** Inside `MillProductionPage`, after toggleState handler (around line 195)

**Add:**
```typescript
  const stateCounts = useMemo(() => {
    const counts: Record<ProductionState, number> = {
      Completed: 0,
      Mixing: 0,
      Blocked: 0,
      Pending: 0,
    };
    orders.forEach(o => counts[o.state]++);
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeStates.size === 0) return orders;
    return orders.filter(o => activeStates.has(o.state));
  }, [orders, activeStates]);
```

### Step 2.5: Update Mill Grouping Logic

**Location:** Inside `MillProductionPage`, around line 182-186

**Current code:**
```typescript
  const ordersByMill: Record<MillLine, ProductionOrder[]> = {
    Premix: orders.filter((o) => o.millLine === "Premix"),
    Excel: orders.filter((o) => o.millLine === "Excel"),
    CGM: orders.filter((o) => o.millLine === "CGM"),
  };
```

**Change to:**
```typescript
  const ordersByMill: Record<MillLine, ProductionOrder[]> = {
    Premix: filteredOrders.filter((o) => o.millLine === "Premix"),
    Excel: filteredOrders.filter((o) => o.millLine === "Excel"),
    CGM: filteredOrders.filter((o) => o.millLine === "CGM"),
  };
```

**Key change:** `orders` → `filteredOrders` (3 places)

### Step 2.6: Render Filter Pills

**Location:** Inside `MillProductionPage` render section, between `<Header />` and the columns (around line 191)

**Current code:**
```typescript
  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex gap-6">
```

**Insert after `<Header />`:**
```typescript
        <div className="flex gap-2.5">
          {(['Completed', 'Mixing', 'Blocked', 'Pending'] as const).map((state) => (
            <FilterPill
              key={state}
              label={state}
              count={stateCounts[state]}
              isActive={activeStates.has(state)}
              onClick={() => toggleState(state)}
            />
          ))}
        </div>
```

**Complete section should look:**
```typescript
  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        <div className="flex gap-2.5">
          {(['Completed', 'Mixing', 'Blocked', 'Pending'] as const).map((state) => (
            <FilterPill
              key={state}
              label={state}
              count={stateCounts[state]}
              isActive={activeStates.has(state)}
              onClick={() => toggleState(state)}
            />
          ))}
        </div>
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex gap-6">
```

### Step 2.7: Test Phase 2

```bash
npm run dev
```

**Verification:**
- [ ] Navigate to `/mill-production`
- [ ] Filter pills visible below header
- [ ] Each pill shows correct count (Completed, Mixing, Blocked, Pending totals)
- [ ] Click a pill → it highlights (changes to primary blue)
- [ ] Columns update to show only that state
- [ ] Click again → pill unhighlights, all states shown again
- [ ] Multiple pills can be active at once (click Completed, then Mixing → shows both)
- [ ] Counts never change (always show totals, not filtered counts)
- [ ] Empty states handled: if no Blocked orders, Blocked column disappears when selected
- [ ] No console errors
- [ ] No TypeScript errors

**Expected time:** 30 minutes

### Step 2.8: Verify No Regressions

**Action:** Test entire app still works

```bash
npm run dev
```

- [ ] `/orders` page works (OrdersTable filters work with imported FilterPill)
- [ ] `/mill-production` page works (new filters work)
- [ ] `/kpi` page works (unchanged)
- [ ] `/settings` page works (unchanged)
- [ ] Sidebar navigation works (unchanged)
- [ ] Header works (unchanged)
- [ ] No console errors anywhere

**Expected time:** 15 minutes

---

## Phase 3: Design Polish (Design-Dependent)

### Step 3.1: Verify Color Scheme

**Action:** Check if design specifies pill colors

**Location:** Check `.pen` design file for filter pill styling

**Questions to answer:**
- Are inactive pills gray-100 background? (current default)
- Are active pills primary blue background? (current default)
- Is count badge lighter than pill background? (current: white/20 for active)
- Should there be different colors per state? (Completed=green, Mixing=yellow, etc.)

**If design differs from current:**
- Modify FilterPill component styling in `/src/components/ui/FilterPill.tsx`
- Test both OrdersTable and MillProduction pages

### Step 3.2: Verify Spacing

**Action:** Check spacing between filter pills and columns

**Current spacing:**
- Between pills: `gap-2.5`
- Pill padding: `px-2.5 py-2`
- Between pills row and columns: margin from surrounding flex layout

**If design differs:**
- Adjust `gap-2.5` on the filter pill container
- Adjust `px-2.5 py-2` on individual pills
- Adjust margin above columns

**Location:** The div that wraps the pills (around line 191-198 after Phase 2)

### Step 3.3: Responsive Testing

**Action:** If mobile is in scope, test responsive behavior

**Test at breakpoints:**
- Desktop (1920px) - pills should wrap if many (not in this scope, only 4 pills)
- Tablet (768px) - should be readable, maybe columns become narrower
- Mobile (375px) - probably out of scope, but if included, verify

**Current implementation:** Pills are in a flex row. Columns are flex with gap. Should be responsive already.

### Step 3.4: Dark Mode Testing (If Supported)

**Action:** If dark mode is supported in your design system, test it

**Verify:**
- Pills are visible in dark mode
- Text is readable
- Count badge contrasts well
- Active state is distinguishable

**Current implementation:** Uses Tailwind CSS classes like `bg-primary`, `text-gray-600`. These should respect dark mode if design system supports it.

### Step 3.5: Accessibility Testing

**Action:** Verify keyboard and screen reader support

**Keyboard testing:**
- Tab to each pill
- Space/Enter activates pill
- Visual focus indicator visible

**Current implementation:** FilterPill is a `<button>`, so keyboard support is automatic.

**Screen reader testing:**
- Pills have accessible labels (the label prop)
- Count is announced (the count is in the button)
- Active state is announced (depends on screen reader implementation)

**If needed:** Add `aria-pressed={isActive}` to button for better semantics.

---

## Code Review Checklist

Before marking implementation complete:

### Phase 1 (FilterPill Extraction)
- [ ] New file `/src/components/ui/FilterPill.tsx` created
- [ ] Implementation matches current OrdersTable inline code
- [ ] OrdersTable.tsx imports FilterPill instead of inline
- [ ] OrdersTable still renders (visual regression test)
- [ ] No TypeScript errors
- [ ] No console errors

### Phase 2 (MillProduction Updates)
- [ ] `activeStates` state added
- [ ] `toggleState` handler added
- [ ] `stateCounts` useMemo added
- [ ] `filteredOrders` useMemo added
- [ ] `ordersByMill` updated to use `filteredOrders`
- [ ] Filter pill div rendered with correct props
- [ ] Pills toggle when clicked
- [ ] Columns update when pills toggle
- [ ] Counts are accurate
- [ ] Empty columns handled gracefully
- [ ] No TypeScript errors
- [ ] No console errors

### Phase 3 (Design Polish)
- [ ] Colors match design
- [ ] Spacing matches design
- [ ] Responsive behavior works
- [ ] Accessibility standards met
- [ ] Dark mode works (if applicable)

---

## Troubleshooting

### Problem: "Cannot find module '@/components/ui/FilterPill'"

**Cause:** File not created in Phase 1

**Solution:**
1. Create `/src/components/ui/FilterPill.tsx`
2. Copy the FilterPill code from this guide
3. Make sure path alias `@` is configured in `tsconfig.json`

### Problem: Pills don't toggle

**Cause:** `toggleState` handler not wired correctly

**Solution:**
1. Check that `onClick={() => toggleState(state)}` is in each FilterPill
2. Check that `toggleState` function is defined
3. Check that `setActiveStates` is updating correctly (add console.log)

### Problem: Columns don't update when pills toggle

**Cause:** `filteredOrders` not being used in mill grouping

**Solution:**
1. Check that `ordersByMill` uses `filteredOrders` not `orders`
2. Check that `filteredOrders` is computed correctly (add console.log)
3. Verify that columns receive filtered data

### Problem: Counts are wrong

**Cause:** `stateCounts` calculation is off

**Solution:**
1. Check that `stateCounts` uses `orders` not `filteredOrders`
2. Add console.log to verify counts match actual data
3. Check that forEach loop initializes all states

### Problem: TypeScript errors about ProductionState

**Cause:** Type not imported

**Solution:**
1. Verify `import { ProductionState } from "@/types/millProduction"` exists
2. Check that filter pill map uses `as const` to preserve types

---

## Performance Notes

**No optimization needed for v1.1:**
- Data size: 12 orders (very small)
- useMemo prevents unnecessary recalculations
- Filtering is O(n) where n=12
- No virtual scrolling needed
- No pagination needed

**Future optimization (if data grows):**
- Could add debouncing to filter changes (not needed for toggle buttons)
- Could virtualize columns if 1000+ orders
- Could memoize MillColumn components if they become expensive

---

## Timeline Estimate

| Phase | Task | Duration | Effort |
|-------|------|----------|--------|
| 1 | Create FilterPill, update OrdersTable | 30 min | Low |
| 1 | Test Phase 1 | 15 min | Low |
| 2 | Add state + handlers + computed values | 45 min | Medium |
| 2 | Add filter pills UI + mill grouping | 15 min | Low |
| 2 | Test Phase 2 | 30 min | Medium |
| 3 | Design polish (colors, spacing, responsive) | 1-2 hours | Medium |
| Total | | 3-4 hours | |

**Estimated total with testing:** 3-4 hours

---

## Sign-Off Criteria

Implementation is complete when:

1. ✅ All code changes from this guide implemented
2. ✅ All tests passing (existing tests + manual QA)
3. ✅ No TypeScript errors
4. ✅ No console errors
5. ✅ Filter pills visible and functional
6. ✅ Columns update when pills clicked
7. ✅ Counts accurate
8. ✅ OrdersTable still works (no regressions)
9. ✅ Design matches .pen file
10. ✅ Code review passed

---

**Ready to implement. Good luck!**
