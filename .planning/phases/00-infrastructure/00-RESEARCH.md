# Phase 0: Infrastructure - Research

**Researched:** 2026-03-11
**Domain:** TypeScript data modeling, React component architecture, async service patterns
**Confidence:** HIGH

## Summary

Phase 0 establishes the data layer foundation and shared component library for the CGM Dashboard. This involves creating TypeScript types for Order data structures, implementing a mock orders service with an async interface (preparing for future API integration), extracting the StatusBadge component for reuse across the application, and building loading skeleton components for enhanced UX during data fetching.

The project is built on Next.js 16.1.6 with React 19.2.3 and TypeScript 5, using Tailwind CSS 4 for styling. The existing codebase already contains inline types and a StatusBadge implementation within OrdersTable.tsx that need to be extracted and formalized.

**Primary recommendation:** Use TypeScript interfaces for entity-like structures (Order, OrderLine), implement a simple async mock service that mirrors future API patterns, extract StatusBadge with shared status configuration constants, and create custom skeleton components that match the exact dimensions of actual content to prevent layout shift.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Status Values:**
- Use 5 statuses from requirements: Pending, Producing, Ready, In Transit, Complete
- Replace current prototype statuses (shipped, loading, mixing, pending)
- Color assignment by progression:
  - Pending = neutral gray
  - Producing = warning yellow
  - Ready = info blue
  - In Transit = purple
  - Complete = success green
- Labels are flexible — abbreviations like "Transit" allowed if space is tight

**Mock Data Scope:**
- ~15-20 orders in the mock dataset
- Cover all edge cases:
  - At least one order per status
  - Some orders with changes flag (hasChanges: true)
  - Some with long customer/product names
- Use real feed mill terminology from example-data/Book1.xlsx:
  - Texture types: PELLET, MASH, SH PELLET, FINE CR, C. CRUMBLE
  - Formula types: NON MEDICATED, MED ALBAC Z, MED ALBAC A, etc.
  - Realistic customer/farm names
- Simulate async delay (200-500ms) to test loading states

**File Organization:**
- Types: `src/types/` directory
- Services: `src/services/` directory
- Shared components: `src/components/ui/` directory
- Status config (colors, labels): Co-located with StatusBadge component

### Claude's Discretion
- Exact async delay duration within 200-500ms range
- Specific mock order data content (within constraints above)
- Skeleton component design details
- TypeScript type naming conventions

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | TypeScript types defined for Order data structure | TypeScript interface patterns, discriminated unions for status |
| INFRA-02 | Mock orders service with async interface | Async service patterns, Promise-based data fetching |
| INFRA-03 | StatusBadge component extracted with shared constants | Component extraction patterns, Record<Status, Config> mapping |
| INFRA-04 | Loading skeleton components for table and details | Custom skeleton patterns matching content dimensions |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | Type safety for data modeling | Industry standard for large-scale React apps in 2026, prevents runtime errors |
| Next.js | 16.1.6 | App framework with async support | Official async Server Components, modern data fetching patterns |
| React | 19.2.3 | Component architecture | Enhanced Suspense and concurrent rendering for loading states |
| Tailwind CSS | 4.x | Component styling | Already established in project, CSS variable integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.577.0 | Icons for skeleton placeholders | Already in project, lightweight icon library |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom skeletons | react-loading-skeleton | Custom = zero dependencies, exact dimension control; Library = faster setup but adds 10KB+ |
| Interfaces | Type aliases | Interfaces preferred for entity-like structures (extensible, better error messages) |
| Mock Service Worker (MSW) | Simple async functions | MSW = network-level mocking for tests; Simple functions = sufficient for development-only mocks |

**Installation:**
No additional packages needed. All requirements can be met with existing dependencies.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── types/
│   └── order.ts           # Order, OrderStatus, OrderLine interfaces
├── services/
│   └── orders.ts          # Mock orders service (async interface)
├── components/
│   └── ui/
│       ├── StatusBadge.tsx       # Extracted status badge
│       └── skeletons/
│           ├── TableSkeleton.tsx # Table loading state
│           └── DetailsSkeleton.tsx # Details panel loading
└── app/
    └── page.tsx           # Dashboard imports from above
```

### Pattern 1: TypeScript Data Modeling with Discriminated Unions
**What:** Use interfaces for entity structures with string literal unions for type-safe status values
**When to use:** All data models representing domain entities (Order, Customer, Product)
**Example:**
```typescript
// Source: TypeScript 5.x best practices
export type OrderStatus = "Pending" | "Producing" | "Ready" | "In Transit" | "Complete";

export interface Order {
  id: string;
  documentNumber: string;
  customer: string;
  textureType: string;
  formulaType: string;
  quantity: number;
  location: string;
  deliveryDate: string;
  status: OrderStatus;
  hasChanges: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Pattern 2: Async Service Interface (Future-Ready)
**What:** Export async functions that return Promises, mimicking future API calls
**When to use:** All data fetching operations, even with mock data
**Example:**
```typescript
// Source: Next.js 16 async patterns
export async function getOrders(): Promise<Order[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockOrders;
}

export async function getOrderById(id: string): Promise<Order | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockOrders.find(order => order.id === id) || null;
}
```

### Pattern 3: Status Configuration with Record Type
**What:** Centralized status mapping using TypeScript's Record utility type
**When to use:** Any enumerated values with associated configuration (colors, labels, icons)
**Example:**
```typescript
// Source: Existing OrdersTable.tsx pattern (lines 61-93)
interface StatusConfig {
  bg: string;
  text: string;
  dot: string;
  countBg: string;
  label: string;
}

export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  "Pending": {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-600",
    countBg: "bg-gray-100",
    label: "Pending"
  },
  "Producing": {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
    countBg: "bg-[#975a1622]",
    label: "Producing"
  },
  // ... remaining statuses
};
```

### Pattern 4: Component Extraction with Props Interface
**What:** Extract inline component functions to separate files with explicit props interfaces
**When to use:** Any component used in multiple locations or logically independent
**Example:**
```typescript
// Source: React component extraction patterns 2026
interface StatusBadgeProps {
  status: OrderStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`inline-flex items-center gap-1 ${config.bg} rounded-lg px-2.5 py-1`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className={`text-[10px] font-bold ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}
```

### Pattern 5: Custom Skeleton Components (Dimension-Matched)
**What:** Build skeleton components that exactly match the dimensions of actual content
**When to use:** Loading states for tables, cards, details panels
**Example:**
```typescript
// Source: Custom skeleton patterns 2026
export default function TableSkeleton() {
  return (
    <div className="flex flex-col w-full">
      {/* Header row - matches OrdersTable header */}
      <div className="flex py-2.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Skeleton rows */}
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex py-3 items-center">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
          {/* ... more columns */}
        </div>
      ))}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Mixing inline types with extracted types:** Once types are extracted to `src/types/`, remove all inline type definitions to maintain single source of truth
- **Synchronous mock data:** Returning data directly prevents testing loading states and doesn't match future API patterns
- **Hard-coded status colors:** Always reference CSS variables from globals.css for consistency and theme support
- **Generic skeleton components:** Skeletons that don't match exact content dimensions cause layout shift when real content loads

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data validation | Custom validation logic | TypeScript types + runtime checks | TypeScript catches most errors at compile time, runtime checks only needed at boundaries |
| Complex test mocking | Custom mock implementation | MSW (if adding tests) | Network-level interception, works with SSR and client |
| Animation utilities | Custom animation timing | Tailwind's `animate-pulse` | Built-in, tested, performs well |
| Type utilities | Custom mapped types | TypeScript utility types (Record, Pick, Omit) | Well-tested, optimized compiler support |

**Key insight:** TypeScript's built-in utility types (Record, Pick, Omit, Partial) are highly optimized and handle edge cases that custom implementations often miss. The project's simple mock service needs don't justify the complexity of MSW unless planning to add comprehensive testing infrastructure.

## Common Pitfalls

### Pitfall 1: Status Type Mismatch
**What goes wrong:** Using string instead of the literal union type allows invalid status values to slip through
**Why it happens:** TypeScript defaults to `string` type inference without explicit typing
**How to avoid:** Always use `OrderStatus` type for status fields, never plain `string`
**Warning signs:** TypeScript not catching invalid status values like "shipped" or "pending" in new code

### Pitfall 2: Async/Await Without Promise Return Type
**What goes wrong:** Mock service functions return data synchronously, making them incompatible with future API patterns
**Why it happens:** Adding `async` keyword without actually awaiting anything
**How to avoid:** Every service function must explicitly return `Promise<T>` and include `await` for simulated delay
**Warning signs:** Loading states never appear, components render instantly with data

### Pitfall 3: Layout Shift from Skeleton Misalignment
**What goes wrong:** Skeleton dimensions differ from actual content, causing visible jump when data loads
**Why it happens:** Using arbitrary skeleton sizes without measuring actual rendered content
**How to avoid:** Match skeleton height, padding, and gap values exactly to real components (e.g., `py-3` in both skeleton and real row)
**Warning signs:** Visible content "jump" when transitioning from skeleton to real data

### Pitfall 4: Circular Import Dependencies
**What goes wrong:** StatusBadge imports types, OrdersTable imports StatusBadge, types import OrdersTable types
**Why it happens:** Not maintaining clear import hierarchy (types → services → components → pages)
**How to avoid:** Types should never import from components or services. Services can import types. Components can import types and services. Pages import everything.
**Warning signs:** Build errors about circular dependencies, modules resolving to undefined

### Pitfall 5: Status Config Color Drift
**What goes wrong:** New status uses hard-coded color instead of CSS variable, breaking theme consistency
**Why it happens:** Copy-pasting status config without referencing globals.css
**How to avoid:** All colors in STATUS_CONFIG must use `var(--color-name)` syntax from globals.css
**Warning signs:** Some status badges don't match the overall color theme, colors break in dark mode (if implemented)

### Pitfall 6: Missing TypeScript Path Aliases
**What goes wrong:** Imports use relative paths `../../types/order` instead of `@/types/order`
**Why it happens:** Not aware that `@/*` alias is configured in tsconfig.json
**How to avoid:** Use `@/` prefix for all imports from src directory
**Warning signs:** Import paths with multiple `../` levels, imports break when files move

## Code Examples

Verified patterns from official sources and existing codebase.

### Type Definition with Exhaustive Status
```typescript
// Source: TypeScript discriminated unions pattern
// File: src/types/order.ts

export type OrderStatus = "Pending" | "Producing" | "Ready" | "In Transit" | "Complete";

export interface Order {
  id: string;
  documentNumber: string;
  customer: string;
  textureType: string;    // PELLET, MASH, SH PELLET, etc.
  formulaType: string;     // NON MEDICATED, MED ALBAC Z, etc.
  quantity: number;
  location: string;
  deliveryDate: string;    // ISO date string
  status: OrderStatus;
  hasChanges: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Async Mock Service with Delay
```typescript
// Source: Next.js 16 async data fetching patterns
// File: src/services/orders.ts

import { Order } from "@/types/order";

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    documentNumber: "2847",
    customer: "Greenfield Farms",
    textureType: "PELLET",
    formulaType: "NON MEDICATED",
    quantity: 24.5,
    location: "Bin 3A",
    deliveryDate: "2026-03-15",
    status: "Producing",
    hasChanges: false,
    createdAt: "2026-03-11T08:00:00Z",
    updatedAt: "2026-03-11T09:30:00Z"
  },
  // ... 14-19 more orders
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getOrders(): Promise<Order[]> {
  await delay(300);
  return mockOrders;
}

export async function getOrderById(id: string): Promise<Order | null> {
  await delay(200);
  return mockOrders.find(order => order.id === id) || null;
}

export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
  await delay(250);
  return mockOrders.filter(order => order.status === status);
}
```

### Extracted StatusBadge Component
```typescript
// Source: Existing OrdersTable.tsx (lines 237-250) extracted
// File: src/components/ui/StatusBadge.tsx

import { OrderStatus } from "@/types/order";

interface StatusConfig {
  bg: string;
  text: string;
  dot: string;
  countBg: string;
  label: string;
}

export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  "Pending": {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-600",
    countBg: "bg-gray-100",
    label: "Pending"
  },
  "Producing": {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
    countBg: "bg-[#975a1622]",
    label: "Producing"
  },
  "Ready": {
    bg: "bg-[var(--info-light)]",
    text: "text-[var(--info)]",
    dot: "bg-[var(--info)]",
    countBg: "bg-[#2b6cb022]",
    label: "Ready"
  },
  "In Transit": {
    bg: "bg-purple-100",
    text: "text-purple-600",
    dot: "bg-purple-600",
    countBg: "bg-purple-100",
    label: "Transit"
  },
  "Complete": {
    bg: "bg-[var(--success-light)]",
    text: "text-[var(--success-dark)]",
    dot: "bg-[var(--success-dark)]",
    countBg: "bg-[#2f855a22]",
    label: "Complete"
  }
};

interface StatusBadgeProps {
  status: OrderStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={`inline-flex items-center gap-1 ${config.bg} rounded-lg px-2.5 py-1`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className={`text-[10px] font-bold ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}
```

### Table Skeleton Component
```typescript
// Source: Custom skeleton patterns matching OrdersTable structure
// File: src/components/ui/skeletons/TableSkeleton.tsx

export default function TableSkeleton() {
  return (
    <div className="flex-1 bg-white rounded-[15px] p-[21px] flex flex-col gap-4 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse mt-1" />
        </div>
      </div>

      {/* Filter pills skeleton */}
      <div className="flex gap-2.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-8 bg-gray-200 rounded-xl w-20 animate-pulse" />
        ))}
      </div>

      {/* Table structure */}
      <div className="flex flex-col w-full">
        {/* Header row */}
        <div className="flex py-2.5">
          {["ORDER", "DESTINATION", "PRODUCT", "TONS", "STATUS"].map(header => (
            <div key={header} className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="h-px bg-[var(--divider)]" />

        {/* Skeleton rows */}
        {[1, 2, 3, 4, 5].map(rowIndex => (
          <div key={rowIndex}>
            <div className="flex py-3 items-center">
              <div className="flex-1 flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded-lg w-20 animate-pulse" />
              </div>
            </div>
            {rowIndex < 5 && <div className="h-px bg-[var(--divider)]" />}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `type` for everything | `interface` for entities, `type` for unions | 2024-2025 | Better error messages, easier to extend |
| Spinner loading states | Skeleton screens | 2022-2023 | Reduced perceived load time by up to 67% |
| useEffect data fetching | Server Components async | Next.js 15-16 (2024) | Eliminates race conditions, simpler code |
| Class components | Function components + hooks | React 16.8+ (2019) | Standard since 2020 |
| Manual theme colors | CSS variables | Tailwind 4 (2025) | Better theme consistency, easier dark mode |

**Deprecated/outdated:**
- Class components with lifecycle methods: Replaced by function components with hooks
- Synchronous mock data: Should always simulate async to match real API patterns
- Hard-coded RGB colors: Use CSS variables for theme consistency
- `React.FC` type annotation: No longer recommended by React team (adds complexity without benefit)

## Open Questions

1. **Purple color variable for "In Transit" status**
   - What we know: globals.css has success, warning, error, info colors but no purple
   - What's unclear: Should we add --purple variables to globals.css or use Tailwind's purple-* scale?
   - Recommendation: Add purple to globals.css for consistency with other status colors (--purple: #9333ea, --purple-light: #f3e8ff, --purple-dark: #7e22ce)

2. **Test infrastructure setup timing**
   - What we know: No test config exists, Vitest recommended for Next.js 16 in 2026
   - What's unclear: Should test setup be part of Phase 0 or deferred?
   - Recommendation: Defer to Wave 0 if nyquist_validation is enabled (see Validation Architecture section)

3. **Exact mock data count**
   - What we know: User specified ~15-20 orders
   - What's unclear: Exact count within that range
   - Recommendation: Use 18 orders (allows 3-4 per status with good distribution)

## Validation Architecture

> nyquist_validation is enabled in .planning/config.json

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (recommended for Next.js 16 in 2026) |
| Config file | vitest.config.ts (none — see Wave 0) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Order type has all required fields | unit | `npm run test -- src/types/order.test.ts -t "Order type"` | ❌ Wave 0 |
| INFRA-01 | OrderStatus only accepts valid values | unit | `npm run test -- src/types/order.test.ts -t "OrderStatus"` | ❌ Wave 0 |
| INFRA-02 | getOrders returns array of orders | unit | `npm run test -- src/services/orders.test.ts -t "getOrders"` | ❌ Wave 0 |
| INFRA-02 | Service functions simulate async delay | unit | `npm run test -- src/services/orders.test.ts -t "async delay"` | ❌ Wave 0 |
| INFRA-03 | StatusBadge renders with correct color | unit | `npm run test -- src/components/ui/StatusBadge.test.tsx -t "renders"` | ❌ Wave 0 |
| INFRA-03 | STATUS_CONFIG has all 5 statuses | unit | `npm run test -- src/components/ui/StatusBadge.test.tsx -t "config"` | ❌ Wave 0 |
| INFRA-04 | TableSkeleton matches table dimensions | manual-only | Visual inspection | N/A (manual) |
| INFRA-04 | Skeletons use animate-pulse | unit | `npm run test -- src/components/ui/skeletons/TableSkeleton.test.tsx -t "pulse"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test` (quick validation)
- **Per wave merge:** `npm run test:coverage` (full suite with coverage check)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vitest configuration with Next.js setup
- [ ] `src/types/order.test.ts` — Type validation tests
- [ ] `src/services/orders.test.ts` — Mock service tests
- [ ] `src/components/ui/StatusBadge.test.tsx` — Component rendering tests
- [ ] `src/components/ui/skeletons/TableSkeleton.test.tsx` — Skeleton component tests
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom`

## Sources

### Primary (HIGH confidence)
- [Next.js Getting Started: Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data) - Official async data fetching patterns
- [Next.js Getting Started: Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) - Official file organization conventions
- [Next.js Testing: Vitest](https://nextjs.org/docs/app/guides/testing/vitest) - Official Vitest setup guide
- Existing codebase: `/src/components/OrdersTable.tsx` (lines 1-250) - Current patterns, StatusBadge implementation
- Existing codebase: `/src/app/globals.css` (lines 1-72) - CSS variables for theming

### Secondary (MEDIUM confidence)
- [Building Reusable React Components in 2026](https://medium.com/@romko.kozak/building-reusable-react-components-in-2026-a461d30f8ce4) - Component extraction patterns
- [Modern TypeScript Patterns — Practical Guide (Mar 9, 2026)](https://www.sachith.co.uk/modern-typescript-patterns-practical-guide-mar-9-2026/) - Data modeling patterns
- [Next.js App Router: The Patterns That Actually Matter in 2026](https://dev.to/teguh_coding/nextjs-app-router-the-patterns-that-actually-matter-in-2026-146) - Project structure patterns
- [Skeletons: The Pinnacle of Loading States in React 19](https://balevdev.medium.com/skeletons-the-pinnacle-of-loading-states-in-react-19-427cbb5a1f48) - Skeleton component patterns
- [Vitest vs Jest 2026: Speed, Features, Migration](https://devtoolswatch.com/en/vitest-vs-jest-2026) - Testing framework comparison

### Tertiary (LOW confidence)
- [Interfaces or Types — Which One Is Actually Better in 2026?](https://medium.com/@Angular_With_Awais/interfaces-or-types-which-one-is-actually-better-in-2026-24eb46cf47b0) - Type vs interface discussion
- [Mastering Mock Service Worker with TypeScript](https://www.xjavascript.com/blog/mock-service-worker-typescript/) - MSW patterns (not used but researched)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Next.js 16.1.6 and React 19.2.3 are confirmed from package.json, patterns are officially documented
- Architecture: HIGH - Patterns verified from existing codebase and official Next.js docs
- Pitfalls: MEDIUM-HIGH - Based on common TypeScript/React issues and project-specific code inspection
- Validation: MEDIUM - Test framework recommendation based on 2026 best practices, not yet implemented in project

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (30 days - stable stack)
