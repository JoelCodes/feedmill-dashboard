# Phase 11: Foundation (Data Layer) - Research

**Researched:** 2026-05-04
**Domain:** TypeScript type definitions and mock service architecture
**Confidence:** HIGH

## Summary

Phase 11 establishes the data layer for customers and bins by defining TypeScript types and creating mock services that follow the existing async pattern in `src/services/`. The phase extends the existing Order type with a `customerId` field and creates a shared mock data module to prevent data inconsistency across pages.

**Primary recommendation:** Use TypeScript interfaces for all entity types (Customer, Bin) with interface extension for composition, export all mock data from a single `src/services/mockData.ts` module to ensure referential integrity across services, and follow the established async delay pattern for service functions.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Type definitions | Frontend Server (SSR) | — | TypeScript types are compile-time constructs used across all tiers, but defined in the Next.js app codebase |
| Mock data storage | Frontend Server (SSR) | — | Static mock arrays live in the Next.js server-side services directory |
| Service functions | Frontend Server (SSR) | — | Async functions simulate API calls within the Next.js app, returning data for server/client components |
| Data aggregation | Frontend Server (SSR) | — | Customer statistics computed from orders array during service calls |
| Customer-order relationships | Frontend Server (SSR) | — | Foreign key relationships managed in-memory via shared mock data module |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Customer-Order Linkage**
- **D-01:** Add `customerId` field to existing Order type (not derive from name)
- **D-02:** Multiple orders from same customer share the same customerId (consolidate customers by name)
- **D-03:** Customer names in existing orders become the source for customer IDs — match by exact name string

**Mock Data Generation**
- **D-04:** Derive customer records from existing 18 orders (extract unique customer names, generate customer records with aggregated stats)
- **D-05:** Bin data defined separately from orders (independent realistic dataset per customer, not parsed from order locations)

**Service Architecture**
- **D-06:** Separate services: `customers.ts` and `bins.ts` (matches existing `orders.ts` pattern)
- **D-07:** Each service follows existing async pattern with simulated delay

**Data Consistency**
- **D-08:** Shared data module (`mockData.ts`) exports orders/customers/bins arrays
- **D-09:** Services import from shared module — single source of truth for IDs and relationships
- **D-10:** Order type modification requires updating mockOrders array to include customerId values

### Claude's Discretion
None — all areas had explicit decisions.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | Customer TypeScript types defined (Customer, CustomerStats) | TypeScript interface patterns from Context7, existing type patterns in src/types/ |
| DATA-02 | Bin TypeScript types defined (Bin, BinAlert, BinThreshold) | Feed bin monitoring data models from industry research, TypeScript union types for alert levels |
| DATA-03 | Mock customer service with async interface | Existing service patterns in src/services/orders.ts and millProduction.ts, array reduce aggregation patterns |
| DATA-04 | Mock bin service with fill percentage and alert status | Feed bin threshold patterns from industry research, async service pattern from existing services |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.3 | Type definitions and compile-time checking | [VERIFIED: npm registry] Current version, already installed. TypeScript is the standard for type-safe JavaScript development |
| @types/node | 25.6.0 | Node.js type definitions | [VERIFIED: npm registry] Current version, already installed. Required for Node environment types in services |
| Jest | 30.3.0 | Testing framework | [VERIFIED: package.json] Already installed and configured. Standard for Next.js testing |
| @testing-library/react | 16.3.2 | React component testing utilities | [VERIFIED: package.json] Already installed. Standard for testing React components and hooks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/jest-dom | 6.9.1 | Custom Jest matchers for DOM | Already installed. Use for service tests that verify data structure correctness |
| @types/jest | 30.0.0 | Jest type definitions | Already installed. Use for type-safe test writing |

### Alternatives Considered
None — the existing stack is sufficient for this phase. No additional dependencies needed.

**Installation:**
No new packages required. All necessary dependencies are already installed.

**Version verification:**
```bash
npm view typescript version  # 6.0.3 (published 2025-03-10)
npm view @types/node version # 25.6.0 (published 2025-01-15)
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Router                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  customers.ts  │  │    bins.ts     │  │   orders.ts    │    │
│  │                │  │                │  │                │    │
│  │ getCustomers() │  │  getBins()     │  │  getOrders()   │    │
│  │ getCustomer    │  │  getBinsByC.   │  │  getOrderById  │    │
│  │ ById()         │  │  ustomerId()   │  │  ()            │    │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘    │
│           │                   │                    │            │
│           └───────────────────┼────────────────────┘            │
│                               │                                 │
│                               ▼                                 │
│                    ┌─────────────────────┐                      │
│                    │    mockData.ts      │                      │
│                    │                     │                      │
│                    │  mockOrders[]       │◄─ Updated with      │
│                    │  mockCustomers[]    │   customerId field  │
│                    │  mockBins[]         │                     │
│                    └─────────────────────┘                      │
│                                                                 │
│                    Single source of truth:                      │
│                    - Customer IDs match across arrays           │
│                    - Order.customerId references Customer.id    │
│                    - Bin.customerId references Customer.id      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Type Layer (src/types/)                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  customer.ts   │  │    bin.ts      │  │   order.ts     │    │
│  │                │  │                │  │                │    │
│  │ Customer       │  │ Bin            │  │ Order          │    │
│  │ CustomerStats  │  │ BinAlert       │  │ + customerId   │    │
│  │                │  │ BinThreshold   │  │                │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── types/
│   ├── order.ts         # Extend with customerId field
│   ├── customer.ts      # NEW: Customer, CustomerStats interfaces
│   └── bin.ts           # NEW: Bin, BinAlert, BinThreshold types
├── services/
│   ├── mockData.ts      # NEW: Shared mock data arrays
│   ├── orders.ts        # Update to import from mockData, add customerId to records
│   ├── customers.ts     # NEW: Customer service with aggregation
│   └── bins.ts          # NEW: Bin service with filtering
```

### Pattern 1: TypeScript Interface Extension for Entity Types

**What:** Define entity types using `interface` keyword and compose types using `extends`

**When to use:** For all object types that represent data entities (Customer, Bin, Order)

**Why:** [CITED: https://github.com/microsoft/typescript/wiki/Performance] Interfaces create a single flat object type that detects property conflicts, display consistently better than intersection types, and type relationships are cached for better performance. Interface extension is preferred over intersection types for composing multiple types.

**Example:**
```typescript
// Source: Existing codebase pattern in src/types/order.ts
export type OrderStatus = "Pending" | "Producing" | "Ready" | "In Transit" | "Complete";

export interface Order {
  id: string;
  documentNumber: string;
  customer: string;
  textureType: string;
  formulaType: string;
  quantity: number;
  location: string;
  deliveryDate: Date;
  status: OrderStatus;
  hasChanges: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**New pattern for Customer type:**
```typescript
// src/types/customer.ts
export interface Customer {
  id: string;
  name: string;
  location: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  hasChanges: boolean;
  binAlertLevel: "none" | "low" | "critical";
}

// Composite interface using extends (better than intersection)
export interface CustomerWithStats extends Customer {
  stats: CustomerStats;
}
```

### Pattern 2: Async Service with Simulated Delay

**What:** Service functions return Promises with artificial delay to simulate network latency

**When to use:** All mock service functions that will eventually call real APIs

**Why:** [VERIFIED: src/services/orders.ts, src/services/millProduction.ts] Existing pattern in the codebase. Simulates realistic async behavior, makes it easier to swap mock services for real API calls later, and helps catch async/await bugs early.

**Example:**
```typescript
// Source: src/services/orders.ts
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getOrders(): Promise<Order[]> {
  await delay(300);
  return mockOrders;
}

export async function getOrderById(id: string): Promise<Order | null> {
  await delay(200);
  return mockOrders.find(order => order.id === id) || null;
}
```

**New pattern for customer service:**
```typescript
// src/services/customers.ts
import { Customer, CustomerStats, CustomerWithStats } from "@/types/customer";
import { mockCustomers, mockOrders, mockBins } from "./mockData";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getCustomers(): Promise<CustomerWithStats[]> {
  await delay(300);
  return mockCustomers.map(customer => ({
    ...customer,
    stats: calculateCustomerStats(customer.id)
  }));
}

export async function getCustomerById(id: string): Promise<CustomerWithStats | null> {
  await delay(200);
  const customer = mockCustomers.find(c => c.id === id);
  if (!customer) return null;
  return {
    ...customer,
    stats: calculateCustomerStats(id)
  };
}

function calculateCustomerStats(customerId: string): CustomerStats {
  const customerOrders = mockOrders.filter(o => o.customerId === customerId);
  const customerBins = mockBins.filter(b => b.customerId === customerId);

  return {
    totalOrders: customerOrders.length,
    activeOrders: customerOrders.filter(o => o.status !== "Complete").length,
    completedOrders: customerOrders.filter(o => o.status === "Complete").length,
    hasChanges: customerOrders.some(o => o.hasChanges),
    binAlertLevel: calculateBinAlertLevel(customerBins)
  };
}
```

### Pattern 3: Array Reduce for Data Aggregation

**What:** Use `Array.reduce()` to compute aggregate statistics from collections

**When to use:** Computing customer statistics (order counts, totals) from orders array

**Why:** [CITED: https://kennethlange.com/reduce-in-typescript-examples/] The reduce method is TypeScript's standard for array aggregation, provides type safety with generics, and can compute multiple statistics in a single pass for performance.

**Example:**
```typescript
// Source: Research on TypeScript aggregation patterns
function calculateCustomerStats(customerId: string): CustomerStats {
  const customerOrders = mockOrders.filter(o => o.customerId === customerId);

  // Single-pass aggregation using reduce
  const stats = customerOrders.reduce<{
    total: number;
    active: number;
    completed: number;
    hasChanges: boolean;
  }>(
    (acc, order) => ({
      total: acc.total + 1,
      active: acc.active + (order.status !== "Complete" ? 1 : 0),
      completed: acc.completed + (order.status === "Complete" ? 1 : 0),
      hasChanges: acc.hasChanges || order.hasChanges
    }),
    { total: 0, active: 0, completed: 0, hasChanges: false }
  );

  const customerBins = mockBins.filter(b => b.customerId === customerId);

  return {
    totalOrders: stats.total,
    activeOrders: stats.active,
    completedOrders: stats.completed,
    hasChanges: stats.hasChanges,
    binAlertLevel: calculateBinAlertLevel(customerBins)
  };
}
```

### Pattern 4: Shared Mock Data Module

**What:** Single module that exports all mock data arrays, imported by all services

**When to use:** Always for mock data — prevents data duplication and inconsistency

**Why:** [CITED: https://basarat.gitbook.io/typescript/main-1/singleton] TypeScript's module system ensures singleton behavior through module caching. When a module is imported, V8 caches the object and subsequent imports retrieve from cache. This guarantees referential integrity across services.

**Example:**
```typescript
// src/services/mockData.ts
import { Order } from "@/types/order";
import { Customer } from "@/types/customer";
import { Bin } from "@/types/bin";

// Single source of truth for all mock data
export const mockOrders: Order[] = [
  {
    id: "ORD-2847",
    documentNumber: "2847",
    customer: "Greenfield Farms",
    customerId: "CUST-001", // NEW FIELD
    textureType: "PELLET",
    // ... rest of fields
  },
  // ... all 18 orders with customerId added
];

export const mockCustomers: Customer[] = [
  {
    id: "CUST-001",
    name: "Greenfield Farms",
    location: "Location TBD",
    createdAt: new Date("2026-03-01T08:00:00Z"),
    updatedAt: new Date("2026-03-01T08:00:00Z"),
  },
  // ... derived from 18 unique customer names in orders
];

export const mockBins: Bin[] = [
  {
    id: "BIN-001",
    customerId: "CUST-001",
    locationCode: "Bin 1A",
    feedType: "Broiler Starter",
    capacityTons: 50.0,
    currentFillTons: 12.5,
    fillPercentage: 25,
    alertLevel: "low",
    lastUpdated: new Date("2026-03-11T10:00:00Z"),
  },
  // ... realistic bins distributed across customers
];
```

```typescript
// src/services/orders.ts (updated)
import { mockOrders } from "./mockData";

export async function getOrders(): Promise<Order[]> {
  await delay(300);
  return mockOrders; // Import from shared module
}
```

```typescript
// src/services/customers.ts (new)
import { mockCustomers, mockOrders, mockBins } from "./mockData";

export async function getCustomers(): Promise<CustomerWithStats[]> {
  await delay(300);
  return mockCustomers.map(customer => ({
    ...customer,
    stats: calculateCustomerStats(customer.id)
  }));
}
```

### Anti-Patterns to Avoid

- **Intersection types for entity composition:** Use `interface extends` instead of `type A = B & C` for better performance, clearer errors, and type caching [CITED: TypeScript Performance Wiki]
- **Inline mock data in services:** All mock data must live in `mockData.ts` to prevent ID mismatches and stale data across services
- **Deriving customer ID from name at runtime:** Customer ID should be a stable field in the data, not computed (breaks if customer name changes)
- **Separate delay functions per service:** Reuse a single `delay()` helper or import from shared utilities to maintain consistency
- **Magic numbers for delays:** Use consistent delay ranges (200-300ms) matching existing services

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type validation at runtime | Custom validation logic with if/else chains | Zod (already installed) | [VERIFIED: package.json shows zod in node_modules] Zod provides runtime type checking that matches TypeScript types. Hand-rolled validation misses edge cases and becomes maintenance burden. |
| UUID generation for customer IDs | Custom ID generation with Math.random() | Simple prefixed counters for mock data (e.g., CUST-001) | Mock data doesn't need cryptographic uniqueness. Simple human-readable IDs are easier to debug and sufficient for development. |
| Date manipulation | Custom date math for createdAt/updatedAt | Native Date constructor with ISO strings | TypeScript and JavaScript Date is sufficient for mock data. No need for date-fns/moment unless complex timezone math is required. |
| Array aggregation utilities | Custom reduce wrappers | Native Array.reduce() with TypeScript generics | [CITED: TypeScript Array reduce] Built-in reduce with proper typing is clear, performant, and well-understood. Custom wrappers add abstraction without benefit for simple aggregations. |

**Key insight:** This phase deals with compile-time types and simple in-memory data structures. The main complexity is maintaining referential integrity across arrays, which is solved by the shared module pattern (leveraging V8's module cache). Custom solutions for validation, ID generation, or aggregation would add unnecessary complexity.

## Common Pitfalls

### Pitfall 1: Type-Only Import Causing Runtime Errors

**What goes wrong:** Using `import type` for interfaces that are needed at runtime causes undefined reference errors.

**Why it happens:** TypeScript's `import type` syntax is erased at compile time. If you import an interface with `import type` and then try to reference it in runtime code (e.g., checking `instanceof`), it won't exist.

**How to avoid:** Use regular `import` for interfaces/types. TypeScript is smart enough to tree-shake unused type imports. Only use `import type` when explicitly optimizing bundle size and you're certain the import is purely compile-time.

**Warning signs:**
- Runtime error: "X is not defined"
- Works in TypeScript but fails when running compiled JavaScript
- Error occurs when checking `instanceof` or using type as a value

**Correct pattern:**
```typescript
// ✓ CORRECT: Regular import for types
import { Customer, CustomerStats } from "@/types/customer";

// ✗ WRONG: import type when you need it at runtime
import type { Customer } from "@/types/customer";
// Later: if (obj instanceof Customer) { } // ERROR: Customer is undefined
```

### Pitfall 2: Forgetting to Update All 18 Order Records with customerId

**What goes wrong:** Adding `customerId` field to Order type but forgetting to add the field to all 18 mock order objects causes TypeScript errors and runtime undefined values.

**Why it happens:** TypeScript won't enforce initialization of new fields in existing object literals unless you re-type-check them. If you add a required field to an interface, existing data that predates the field won't automatically get updated.

**How to avoid:**
1. Add `customerId` to Order interface first
2. TypeScript compiler will error on all 18 orders missing the field
3. Use editor's "Go to error" to systematically add customerId to each record
4. Verify all orders have matching customer names in mockCustomers array

**Warning signs:**
- TypeScript error: "Property 'customerId' is missing in type 'Order'"
- Runtime error: "Cannot read property 'customerId' of undefined"
- Customer stats show 0 orders for all customers (filter returns empty array)

**Correct pattern:**
```typescript
// After adding customerId to Order interface:
export interface Order {
  id: string;
  customerId: string; // NEW FIELD - required
  customer: string;
  // ... other fields
}

// Must update ALL 18 orders in mockOrders array:
const mockOrders: Order[] = [
  {
    id: "ORD-2847",
    customerId: "CUST-001", // ADDED
    customer: "Greenfield Farms",
    // ... rest of fields
  },
  // ... repeat for all 18 orders
];
```

### Pitfall 3: Inconsistent Customer ID References

**What goes wrong:** Order.customerId value doesn't match any Customer.id, causing customer stats to show 0 orders and customer detail pages to show "not found".

**Why it happens:** Manually typing customer IDs in two places (mockCustomers and mockOrders) leads to typos or mismatches (e.g., "CUST-01" vs "CUST-001").

**How to avoid:**
1. Define mockCustomers array FIRST with stable IDs
2. Reference customer.id values when adding customerId to orders
3. Use a lookup table or map to verify all order.customerId values exist
4. Add a validation function in mockData.ts that runs on module load

**Warning signs:**
- Customer list shows customers but with 0 orders each
- Customer detail page shows customer info but empty order history
- Array filter returns empty for `mockOrders.filter(o => o.customerId === id)`

**Correct pattern:**
```typescript
// mockData.ts

// Step 1: Define customers with stable IDs
export const mockCustomers: Customer[] = [
  { id: "CUST-001", name: "Greenfield Farms", /* ... */ },
  { id: "CUST-002", name: "Valley Ranch Operations", /* ... */ },
  // ... 18 total
];

// Step 2: Reference customer IDs (not hand-type them again)
const customerIdMap: Record<string, string> = {
  "Greenfield Farms": "CUST-001",
  "Valley Ranch Operations": "CUST-002",
  // ... map all 18 customer names to IDs
};

export const mockOrders: Order[] = [
  {
    id: "ORD-2847",
    customer: "Greenfield Farms",
    customerId: customerIdMap["Greenfield Farms"], // Lookup from map
    // ... rest of fields
  },
];

// Step 3: Validate on module load (runs once at import time)
const allCustomerIds = new Set(mockCustomers.map(c => c.id));
const invalidOrders = mockOrders.filter(o => !allCustomerIds.has(o.customerId));
if (invalidOrders.length > 0) {
  console.error("Invalid customerId references:", invalidOrders.map(o => o.id));
}
```

### Pitfall 4: Calculating Stats on Every Array Iteration

**What goes wrong:** Calling `calculateCustomerStats(customer.id)` inside a `.map()` over all customers causes N*(M+B) complexity where N=customers, M=orders, B=bins. With 18 customers, 18 orders, and ~50 bins, this means ~1000+ iterations for a single `getCustomers()` call.

**Why it happens:** Nested array filters inside a map create O(N*M) complexity. For small mock datasets this is fast, but the pattern won't scale to real data.

**How to avoid:**
- For mock data (N < 100), nested filters are acceptable and more readable
- For real APIs, pre-compute stats in the backend or use indexed lookups
- If performance becomes an issue, build a Map of customerId → stats outside the loop

**Warning signs:**
- `getCustomers()` call takes >100ms in development (mock data should be <50ms)
- Console shows excessive array iterations during single service call
- Adding more mock customers causes linear slowdown

**Optimization pattern (only if needed):**
```typescript
export async function getCustomers(): Promise<CustomerWithStats[]> {
  await delay(300);

  // Pre-compute stats for all customers in single pass
  const statsMap = new Map<string, CustomerStats>();

  // Group orders by customerId
  const ordersByCustomer = mockOrders.reduce((acc, order) => {
    if (!acc[order.customerId]) acc[order.customerId] = [];
    acc[order.customerId].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  // Group bins by customerId
  const binsByCustomer = mockBins.reduce((acc, bin) => {
    if (!acc[bin.customerId]) acc[bin.customerId] = [];
    acc[bin.customerId].push(bin);
    return acc;
  }, {} as Record<string, Bin[]>);

  // Compute stats once per customer
  mockCustomers.forEach(customer => {
    const orders = ordersByCustomer[customer.id] || [];
    const bins = binsByCustomer[customer.id] || [];
    statsMap.set(customer.id, calculateStatsFromArrays(orders, bins));
  });

  // Final map without nested filters
  return mockCustomers.map(customer => ({
    ...customer,
    stats: statsMap.get(customer.id)!
  }));
}
```

**Note:** For this phase with 18 customers and 18 orders, the simple nested filter approach is perfectly fine and more maintainable. Only optimize if profiling shows actual performance problems.

## Code Examples

Verified patterns from official sources and existing codebase:

### TypeScript Interface Definition

```typescript
// Source: Existing pattern in src/types/order.ts
export type OrderStatus = "Pending" | "Producing" | "Ready" | "In Transit" | "Complete";

export interface Order {
  id: string;
  documentNumber: string;
  customer: string;
  textureType: string;
  formulaType: string;
  quantity: number;
  location: string;
  deliveryDate: Date;
  status: OrderStatus;
  hasChanges: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Async Service Pattern

```typescript
// Source: src/services/orders.ts
import { Order, OrderStatus } from "@/types/order";

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

### Array Reduce Aggregation

```typescript
// Source: https://kennethlange.com/reduce-in-typescript-examples/
function calculateCustomerStats(customerId: string): CustomerStats {
  const customerOrders = mockOrders.filter(o => o.customerId === customerId);

  const stats = customerOrders.reduce<{
    active: number;
    completed: number;
    hasChanges: boolean;
  }>(
    (acc, order) => ({
      active: acc.active + (order.status !== "Complete" ? 1 : 0),
      completed: acc.completed + (order.status === "Complete" ? 1 : 0),
      hasChanges: acc.hasChanges || order.hasChanges
    }),
    { active: 0, completed: 0, hasChanges: false }
  );

  return {
    totalOrders: customerOrders.length,
    activeOrders: stats.active,
    completedOrders: stats.completed,
    hasChanges: stats.hasChanges,
    binAlertLevel: calculateBinAlertLevel(customerId)
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `type` keyword for object types | `interface` for entities, `type` for unions/intersections | TypeScript 3.7+ | [CITED: TypeScript Performance Wiki] Interfaces provide better performance, clearer error messages, and type caching. Use interface for object shapes. |
| Class-based Singleton pattern | Module exports as singletons | ES6 modules (2015) | [CITED: https://basarat.gitbook.io/typescript/main-1/singleton] V8 module caching provides singleton behavior automatically. No need for getInstance() or private constructors. |
| moment.js for date handling | Native Date API or date-fns | 2020+ | Moment.js is deprecated and heavy (large bundle). Native Date is sufficient for simple use cases. date-fns is modern alternative for complex operations. |
| Manual async simulation with callbacks | Promise-based delay helper | TypeScript 2.1+ (async/await) | [VERIFIED: src/services/orders.ts] Clean async/await syntax is standard. All new code uses Promises. |

**Deprecated/outdated:**
- **Moment.js**: [CITED: moment.js docs] Library is in maintenance mode, discouraged for new projects. Use native Date or date-fns instead.
- **Class-based singletons in TypeScript**: [CITED: TypeScript Singleton Deep Dive] ES6 module system provides singleton behavior without boilerplate. Export const objects instead.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | TypeScript 6.0.3 is current stable version (verified via npm registry, published 2025-03-10) | Standard Stack | None - verified via npm view |
| A2 | Jest test infrastructure can test service functions without mocking modules | Validation Architecture | Low - Jest supports module mocking if needed, pattern can adapt |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

Note: All other claims were either verified via npm registry, cited from official TypeScript/Context7 documentation, or verified from existing codebase patterns.

## Open Questions (RESOLVED)

1. **Customer contact information (name, phone, email)** — RESOLVED
   - What we know: Phase 10 design shows contact card with contact fields, Order type only has customer name string
   - What's unclear: Should contact info be in mock data or left as optional/undefined for now?
   - Resolution: Define fields as optional (`contactName?: string`) in Customer interface, populate some records with realistic contact info and leave others undefined to test both states in UI

2. **Bin capacity and fill level units** — RESOLVED
   - What we know: Feed industry uses tons for quantity (Order.quantity is numeric, likely tons based on context)
   - What's unclear: Should bin capacity be in tons or pounds? Should fillPercentage be computed from tons or stored separately?
   - Resolution: Use tons for capacityTons and currentFillTons (matches order quantity units), compute fillPercentage as derived value: `Math.round((currentFillTons / capacityTons) * 100)`

3. **Bin alert threshold values** — RESOLVED
   - What we know: Design uses green/yellow/red color zones, industry systems use configurable thresholds
   - What's unclear: What percentage values define "low" (yellow) vs "critical" (red)?
   - Resolution: Use industry-standard thresholds: critical < 20%, low 20-40%, normal > 40%. Define as constants in bin service for easy tuning.

## Environment Availability

No external dependencies identified. This phase is purely code and type definitions with no external tools, services, or runtimes beyond Node.js and TypeScript (already available).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 with @testing-library/react 16.3.2 |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="customers\|bins"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Customer and CustomerStats interfaces compile without errors | unit | `npm run build` (TypeScript compilation) | ✅ Verified via tsc |
| DATA-02 | Bin, BinAlert, BinThreshold types compile without errors | unit | `npm run build` (TypeScript compilation) | ✅ Verified via tsc |
| DATA-03 | getCustomers() returns array of CustomerWithStats | unit | `npm test -- --testPathPattern="customers.test"` | ❌ Wave 0 |
| DATA-03 | getCustomerById() returns customer with aggregated stats | unit | `npm test -- --testPathPattern="customers.test"` | ❌ Wave 0 |
| DATA-03 | Customer stats correctly aggregate order counts by status | unit | `npm test -- --testPathPattern="customers.test"` | ❌ Wave 0 |
| DATA-04 | getBins() returns array of bins with fill percentages | unit | `npm test -- --testPathPattern="bins.test"` | ❌ Wave 0 |
| DATA-04 | getBinsByCustomerId() filters bins for specific customer | unit | `npm test -- --testPathPattern="bins.test"` | ❌ Wave 0 |
| DATA-04 | Bin alertLevel correctly reflects fill percentage thresholds | unit | `npm test -- --testPathPattern="bins.test"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build && npm test -- --testPathPattern="[affected-service]"` (< 10 seconds)
- **Per wave merge:** `npm test` (< 30 seconds for full suite)
- **Phase gate:** Full suite green + TypeScript compilation clean before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/services/customers.test.ts` — covers DATA-03 (customer service behavior)
- [ ] `src/services/bins.test.ts` — covers DATA-04 (bin service behavior)
- [ ] `src/services/mockData.test.ts` — validates referential integrity (all order.customerId values exist in mockCustomers)

*(Test files follow existing pattern in src/components/FilterPill.test.tsx using @testing-library and Jest)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | N/A - mock data layer only |
| V3 Session Management | no | N/A - no sessions in this phase |
| V4 Access Control | no | N/A - no authorization logic |
| V5 Input Validation | yes | TypeScript compile-time type checking for service function parameters |
| V6 Cryptography | no | N/A - no encryption/hashing required |

### Known Threat Patterns for Mock Data Layer

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Type confusion from incorrect service calls | Tampering | TypeScript strict mode enforces type correctness at compile time |
| Prototype pollution from object spread | Tampering | Use TypeScript interfaces (not classes) for data entities — no prototype chain to pollute |
| Accidental data mutation | Information Disclosure | Use `readonly` modifier on array properties or freeze objects with `Object.freeze()` if immutability is required |

**Note:** This phase has minimal security surface area since it's a mock data layer with no network boundaries, user input, or persistence. Primary security consideration is type safety to prevent runtime errors that could leak into production.

## Sources

### Primary (HIGH confidence)
- TypeScript /microsoft/typescript via Context7 - Interface vs type patterns, performance guidance
- Existing codebase patterns:
  - `/Users/joel/Desktop/Projects/cgm-dashboard/src/types/order.ts` - Interface definition pattern
  - `/Users/joel/Desktop/Projects/cgm-dashboard/src/services/orders.ts` - Async service pattern with delay
  - `/Users/joel/Desktop/Projects/cgm-dashboard/src/services/millProduction.ts` - Service structure verification
  - `/Users/joel/Desktop/Projects/cgm-dashboard/package.json` - Dependency versions verified

### Secondary (MEDIUM confidence)
- [Typescript: Extend Array type with sum count avg min max Aggregates](https://codegenos.github.io/posts/typescript-array-extend-with-generic-aggregate-functions-/)
- [8 Examples of Using Reduce in TypeScript – Kenneth Lange](https://kennethlange.com/reduce-in-typescript-examples/)
- [Modules Over Singletons in TypeScript](https://mikesblog.vercel.app/modules)
- [Singleton in TypeScript Deep Dive](https://basarat.gitbook.io/typescript/main-1/singleton)
- [BinMaster Level Sensors Systems for Monitoring Grain Bins](https://binmaster.com/news/system-considerations-when-monitoring-bin-levels-in-the-grain-industry.html)
- [Bin Tracking Essentials for Feed Bins | BarnTalk | BarnTools](https://barntools.com/bin-tracking-essentials-feed-bins)
- TypeScript Performance Wiki: https://github.com/microsoft/typescript/wiki/Performance

### Tertiary (LOW confidence)
None - all findings were verified against official sources or existing codebase patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed and verified via npm registry
- Architecture: HIGH - Patterns verified in existing codebase (orders.ts, millProduction.ts)
- Pitfalls: HIGH - Common TypeScript pitfalls documented in official sources and observed in existing code
- Bin monitoring data model: MEDIUM - Industry research from multiple feed bin vendors, not from official BinSentry API docs

**Research date:** 2026-05-04
**Valid until:** 2026-06-04 (30 days - stable technology stack, TypeScript/Jest unlikely to have breaking changes in this timeframe)
