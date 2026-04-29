# Technology Stack: Mill Production Dashboard (v1.1)

**Project:** CGM Dashboard — Mill Production View
**Milestone:** v1.1 Status Filter Pills & Design Polish
**Researched:** 2026-04-28
**Confidence:** HIGH (validated stack additions, no breaking changes)

## Current Stack (Validated in v1.0)

| Technology | Version | Status | Reason |
|------------|---------|--------|--------|
| Next.js | 15.1.6 | Active | Full-stack React framework, Server Components, API routes |
| React | 19.2.3 | Active | UI library with Concurrent Features, hooks |
| Tailwind CSS | 4.0+ | Active | Utility-first CSS, design system foundation |
| TypeScript | ^5 | Active | Type safety across codebase |
| lucide-react | ^0.577.0 | Active | Icon library for status/action icons |

## Stack Additions for v1.1

### Core Changes: NONE REQUIRED

The existing stack is **sufficient** for v1.1 features:
- **Status filter pills** → Reuse `FilterPill` component from OrdersTable (lines 396-432)
- **Design polish** → Pure Tailwind CSS refinement, no new libraries
- **Mock JSON data service** → Extend existing `millProduction.ts` service pattern

### Optional: Data Import Tooling (Build-time Only)

If importing from Book1.xlsx requires programmatic transformation:

| Tool | Version | Purpose | When to Use | Confidence |
|------|---------|---------|-------------|------------|
| XLSX | ^0.18.0 | Parse .xlsx files to JSON | Automated Excel → mock data transformation | HIGH |
| N/A | — | Manual transformation preferred | Copy/paste Excel data into JSON, version-control the result | MEDIUM |

**Recommendation:** Start with **manual JSON creation** from Book1.xlsx (copy values into `mockOrders` array in `millProduction.ts`). If needing to regenerate mock data frequently from updated Excel files, add XLSX as a dev-only script:

```bash
npm install --save-dev xlsx
```

Then create a one-time script: `scripts/transform-excel.ts` to generate mock data. This keeps runtime clean (no xlsx in production bundle).

## Production State Configuration

Create config object mirroring `StatusBadge` pattern from v1.0:

### New: `src/components/ui/ProductionStateConfig.ts`

```typescript
import { ProductionState } from "@/types/millProduction";

export interface ProductionStateConfig {
  bg: string;        // Background color
  text: string;      // Text color
  border: string;    // Left border color
  label: string;     // Display label
}

export const PRODUCTION_STATE_CONFIG: Record<ProductionState, ProductionStateConfig> = {
  "Completed": {
    bg: "bg-[var(--success-light)]",
    text: "text-[var(--success-dark)]",
    border: "#38a169",
    label: "Completed"
  },
  "Mixing": {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    border: "#d69e2e",
    label: "Mixing"
  },
  "Blocked": {
    bg: "bg-[var(--error-light)]",
    text: "text-[var(--error)]",
    border: "#e53e3e",
    label: "Blocked"
  },
  "Pending": {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "#a0aec0",
    label: "Pending"
  }
};
```

**Rationale:** Centralizes mill production state styling (matching existing `STATUS_CONFIG` pattern). Used by:
- Filter pills (display colors, counts)
- ProductionCard left border (state indicator)
- Future: state badges, color-coded columns

## Filter Pill Component Integration

### Reuse Existing Pattern

The `FilterPill` component in `OrdersTable.tsx` (lines 396-432) can be **directly reused** for mill production:

```typescript
// In mill-production/page.tsx
import FilterPill from "@/components/OrdersTable"; // Or extract to shared location

// Usage example
<FilterPill
  label="Completed"
  count={completedCount}
  isActive={activeStates.has("Completed")}
  onClick={() => toggleState("Completed")}
/>
```

### If Extracting to Shared Component

Create `src/components/ui/FilterPill.tsx`:
- Make `status` prop optional (used for color override)
- Add config parameter for custom state/status mappings
- Keep toggle behavior identical to v1.0

**No new libraries needed.** Tailwind CSS handles all styling via className strings.

## Mock Data Service Pattern

### Extend Existing Service

Current `millProduction.ts` pattern:
1. Define `ProductionOrder` interface in `types/millProduction.ts` ✓
2. Create array of mock data in `millProduction.ts` ✓
3. Export async function `getProductionOrders()` with artificial delay ✓

For v1.1:
- **Expand mock data array** with production orders from Book1.xlsx
- **No API calls** — mock service sufficient for this phase
- **Consistent async interface** — maintains consistent testing behavior

### Data Transformation Workflow (Optional)

If creating a build-time transformation script:

```bash
# Install dev dependency
npm install --save-dev xlsx

# Create transformation script
src/scripts/transform-excel.ts

# Run to generate mock data
npx ts-node src/scripts/transform-excel.ts

# Output: Updated src/services/millProduction.ts with new mock data
```

**Why optional:** Transformation is one-time activity. Manual JSON entry into the service file is simpler for this milestone and keeps build process clean.

## Version Updates (Recommended but NOT Blocking)

The following updates are **safe and recommended** but not required for v1.1:

| Package | Current | Latest | Impact | Risk |
|---------|---------|--------|--------|------|
| react | 19.2.3 | 19.2.5 | Bug fixes, ESLint v10 support | LOW — patch version |
| lucide-react | ^0.577.0 | ^1.11.0 | New icons, performance improvements | LOW — stable API |
| Tailwind CSS | 4.0 | 4.2.0 | Webpack plugin, logical properties, perf | LOW — opt-in features |
| Next.js | 15.1.6 | 16.2.4 | Turbopack improvements (400% faster dev) | MEDIUM — major upgrade, test thoroughly |

**Recommendation for v1.1:**
```bash
npm update react lucide-react
npm update -D tailwindcss @tailwindcss/postcss
```

**Hold on Next.js 16 upgrade** → v1.2 (separate phase). Verify Turbopack integration, test build times.

## What NOT to Add

| Tool | Why Not | Alternative |
|------|---------|-------------|
| **Redux/Zustand** | Filter state already in component state (OrdersTable pattern) | Keep local React state with useState + useMemo |
| **Tanstack Query/SWR** | Mock service has no cache invalidation needs | Direct async/await pattern |
| **Form libraries** (React Hook Form, Formik) | No input forms in this milestone | Plain HTML inputs suffice |
| **Data validation** (Zod, Yup) | Types sufficient, mock data is curated | Use TypeScript types for compile-time checks |
| **Excel runtime parsing** (XLSX in browser) | Unnecessarily increases bundle | Transform at build time or manually |
| **New icon libraries** | lucide-react has 4000+ icons | Avoid duplication |

## Integration Checklist

- [ ] Reuse `FilterPill` from OrdersTable (or extract to shared if needed)
- [ ] Create `PRODUCTION_STATE_CONFIG` matching `STATUS_CONFIG` pattern
- [ ] Expand `mockOrders` array in `millProduction.ts` with Book1.xlsx data
- [ ] Add filter state management to mill-production/page.tsx (useCallback, useState)
- [ ] Wire toggle handlers to filter displayed cards
- [ ] Match .pen design colors to PRODUCTION_STATE_CONFIG
- [ ] Update TypeScript imports (PRODUCTION_STATE_CONFIG)
- [ ] Verify Tailwind CSS classes compile (no new utilities needed)

## Sources

- [Next.js 16.2 Release Notes](https://github.com/vercel/next.js/releases)
- [React 19.2.5 Release](https://react.dev/blog/2025/10/01/react-19-2)
- [Tailwind CSS 4.2.0 Features](https://tailwindcss.com/blog)
- [XLSX Library Documentation](https://docs.sheetjs.com/)
- [lucide-react NPM Package](https://www.npmjs.com/package/lucide-react)
