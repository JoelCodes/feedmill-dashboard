# Phase 11: Foundation (Data Layer) - Pattern Map

**Mapped:** 2026-05-04
**Files analyzed:** 7 new/modified files
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/types/customer.ts` | type | N/A | `src/types/order.ts` | exact |
| `src/types/bin.ts` | type | N/A | `src/types/millProduction.ts` | exact |
| `src/types/order.ts` | type | N/A | `src/types/order.ts` | self (extend existing) |
| `src/services/mockData.ts` | data-module | N/A | `src/services/orders.ts` | role-match |
| `src/services/customers.ts` | service | CRUD | `src/services/orders.ts` | exact |
| `src/services/bins.ts` | service | CRUD | `src/services/orders.ts` | exact |
| `src/services/orders.ts` | service | CRUD | `src/services/orders.ts` | self (refactor existing) |

## Pattern Assignments

### `src/types/customer.ts` (type, N/A)

**Analog:** `src/types/order.ts`

**Type union pattern** (lines 1):
```typescript
export type OrderStatus = "Pending" | "Producing" | "Ready" | "In Transit" | "Complete";
```

**Interface pattern** (lines 3-16):
```typescript
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

**Apply to Customer type:**
- Use `export type` for union types (BinAlertLevel: "none" | "low" | "critical")
- Use `export interface` for entity types (Customer, CustomerStats)
- Include timestamp fields: createdAt, updatedAt (both Date type)
- Use optional fields with `?` for nullable properties (contactName?, contactPhone?, contactEmail?)

---

### `src/types/bin.ts` (type, N/A)

**Analog:** `src/types/millProduction.ts`

**Type union pattern** (lines 1-3):
```typescript
export type MillLine = "Premix" | "Excel" | "CGM";

export type ProductionState = "Completed" | "Mixing" | "Blocked" | "Pending";
```

**Interface pattern with optional fields** (lines 5-16):
```typescript
export interface ProductionOrder {
  id: string;
  orderNumber: string;
  customer: string;
  product: string;
  weightLbs: number;
  deliveryTime: string;
  state: ProductionState;
  millLine: MillLine;
  textureType?: string;  // MASH, PELLET, C. CRUMBLE, SH PELLET, FINE CR
  lineCode?: string;     // Numeric code from example data (33161, 22563, etc.)
}
```

**Apply to Bin type:**
- Define union type for alert levels: `export type BinAlertLevel = "none" | "low" | "critical"`
- Use optional fields with inline comments for clarity
- Include numeric fields for capacity and fill data (number type)
- Add lastUpdated timestamp (Date type)

---

### `src/types/order.ts` (type, N/A - extend existing)

**Analog:** `src/types/order.ts` (self)

**Existing pattern** (lines 3-16):
```typescript
export interface Order {
  id: string;
  documentNumber: string;
  customer: string;
  textureType: string;
  formulaType: string;
  quantity: number;
  location: string,
  deliveryDate: Date;
  status: OrderStatus;
  hasChanges: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Extension pattern:**
- Add `customerId: string;` field after `customer: string;` (line 6)
- Maintain alphabetical-like grouping (ID fields first, then descriptive fields, then metadata)
- All 18 order records in `mockOrders` array must be updated with customerId values

---

### `src/services/mockData.ts` (data-module, N/A)

**Analog:** `src/services/orders.ts`

**Import pattern** (lines 1):
```typescript
import { Order, OrderStatus } from "@/types/order";
```

**Mock data array pattern** (lines 5-267):
```typescript
const mockOrders: Order[] = [
  // Pending orders (4)
  {
    id: "ORD-2847",
    documentNumber: "2847",
    customer: "Greenfield Farms",
    textureType: "PELLET",
    formulaType: "NON MEDICATED",
    quantity: 24.5,
    location: "Bin 1A",
    deliveryDate: new Date("2026-03-12T08:00:00Z"),
    status: "Pending",
    hasChanges: false,
    createdAt: new Date("2026-03-11T06:30:00Z"),
    updatedAt: new Date("2026-03-11T06:30:00Z"),
  },
  // ... more records
];
```

**Apply to mockData.ts:**
- Import all types from `@/types/*` at top
- Group arrays with comments (// Customers, // Orders, // Bins)
- Use typed arrays: `export const mockOrders: Order[] = [...]`
- Use ISO date strings in Date constructors
- Export arrays with `export const` (not `export default`)
- Add inline comments for sections (e.g., "// Pending orders (4)")

---

### `src/services/customers.ts` (service, CRUD)

**Analog:** `src/services/orders.ts`

**Imports pattern** (lines 1):
```typescript
import { Order, OrderStatus } from "@/types/order";
```

**Delay helper pattern** (line 3):
```typescript
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
```

**Get all function pattern** (lines 269-272):
```typescript
export async function getOrders(): Promise<Order[]> {
  await delay(300);
  return mockOrders;
}
```

**Get by ID function pattern** (lines 274-277):
```typescript
export async function getOrderById(id: string): Promise<Order | null> {
  await delay(200);
  return mockOrders.find(order => order.id === id) || null;
}
```

**Filter function pattern** (lines 279-282):
```typescript
export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
  await delay(250);
  return mockOrders.filter(order => order.status === status);
}
```

**Apply to customers.ts:**
- Import Customer types from `@/types/customer`
- Import mock data from `./mockData` (not inline)
- Copy delay helper function verbatim
- Use `await delay(300)` for list operations, `await delay(200)` for single record
- Return `Type | null` for getById functions, use `.find() || null` pattern
- Use array `.map()` to attach calculated stats to each customer
- Create private helper function `calculateCustomerStats(customerId: string): CustomerStats` for aggregation
- Use `.filter()` and `.some()` for array aggregation (total orders, active orders, hasChanges)

---

### `src/services/bins.ts` (service, CRUD)

**Analog:** `src/services/orders.ts`

**Same patterns as customers.ts:**
- Import bin types from `@/types/bin`
- Import mockBins from `./mockData`
- Copy delay helper verbatim
- Use `await delay(300)` for list operations
- Return `Bin[]` for getBins(), `Bin[] ` for getBinsByCustomerId()
- Use `.filter()` with customerId match for filtering

**Additional pattern for alert level calculation:**
- Create helper function `calculateBinAlertLevel(bins: Bin[]): BinAlertLevel`
- Use thresholds: critical < 20%, low 20-40%, none > 40%
- Return highest alert level from array of bins (critical > low > none)

---

### `src/services/orders.ts` (service, CRUD - refactor existing)

**Analog:** `src/services/orders.ts` (self)

**Current pattern** (lines 1-282):
- Inline mockOrders array (lines 5-267)
- Service functions import from same file

**Refactor pattern:**
- REMOVE mockOrders array definition (lines 5-267)
- ADD import: `import { mockOrders } from "./mockData";` at top (line 1 or 2)
- KEEP all existing service functions unchanged (getOrders, getOrderById, getOrdersByStatus)
- KEEP delay helper function

**No changes to:**
- Function signatures
- Export statements
- Delay timing (300ms, 200ms, 250ms)

---

## Shared Patterns

### Delay Helper
**Source:** `src/services/orders.ts` (line 3)
**Apply to:** All service files (customers.ts, bins.ts)
```typescript
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
```

### Async Service Function Structure
**Source:** `src/services/orders.ts` (lines 269-282)
**Apply to:** All service functions
```typescript
export async function getFoo(): Promise<Foo[]> {
  await delay(300); // List operations: 300ms
  return mockFoos;
}

export async function getFooById(id: string): Promise<Foo | null> {
  await delay(200); // Single record: 200ms
  return mockFoos.find(item => item.id === id) || null;
}

export async function getFoosByFilter(filter: string): Promise<Foo[]> {
  await delay(250); // Filtered list: 250ms
  return mockFoos.filter(item => item.property === filter);
}
```

### TypeScript Type Definitions
**Source:** `src/types/order.ts` (lines 1-16)
**Apply to:** All new type files (customer.ts, bin.ts)
```typescript
// Union types for constrained strings
export type Status = "Value1" | "Value2" | "Value3";

// Interfaces for entity types
export interface Entity {
  id: string;
  // ... properties
  createdAt: Date;
  updatedAt: Date;
}

// Optional fields with ?
export interface EntityWithOptional {
  required: string;
  optional?: string;
}
```

### Array Methods for Aggregation
**Source:** `src/services/orders.ts` (line 282) + common TypeScript patterns
**Apply to:** Customer stats calculation in customers.ts
```typescript
// Filter for subset
const activeOrders = orders.filter(o => o.status !== "Complete");

// Find for single item
const order = orders.find(o => o.id === id);

// Map for transformation
const customersWithStats = customers.map(c => ({
  ...c,
  stats: calculateStats(c.id)
}));

// Some for boolean check
const hasChanges = orders.some(o => o.hasChanges);
```

### ISO Date Strings in Mock Data
**Source:** `src/services/orders.ts` (lines 15, 18-19)
**Apply to:** All date fields in mockData.ts
```typescript
deliveryDate: new Date("2026-03-12T08:00:00Z"),
createdAt: new Date("2026-03-11T06:30:00Z"),
updatedAt: new Date("2026-03-11T06:30:00Z"),
```

---

## Test Patterns

### Test File Structure
**Source:** `src/components/FilterPill.test.tsx`

**Imports pattern** (lines 1-2):
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import FilterPill from './FilterPill';
```

**Describe block pattern** (lines 4-76):
```typescript
describe('ComponentName', () => {
  it('describes expected behavior', () => {
    // Arrange
    render(<Component prop={value} />);

    // Act (if needed)
    fireEvent.click(screen.getByRole('button'));

    // Assert
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});
```

**Apply to service tests:**
- Use `describe('ServiceName', () => {})` for service test suite
- Use `it('describes behavior', async () => {})` for async service tests
- Use `expect(...).toBe(...)` for value assertions
- Use `expect(...).toHaveLength(...)` for array length
- Use `expect(...).toEqual({...})` for object comparison

**Service test pattern (NEW - adapted from component test):**
```typescript
import { getCustomers, getCustomerById } from './customers';

describe('customers service', () => {
  it('returns array of customers with stats', async () => {
    const customers = await getCustomers();
    expect(customers).toHaveLength(18); // Based on 18 unique customer names
    expect(customers[0]).toHaveProperty('id');
    expect(customers[0]).toHaveProperty('stats');
  });

  it('returns customer by id with stats', async () => {
    const customer = await getCustomerById('CUST-001');
    expect(customer).not.toBeNull();
    expect(customer?.stats).toHaveProperty('totalOrders');
  });

  it('returns null for non-existent customer', async () => {
    const customer = await getCustomerById('INVALID-ID');
    expect(customer).toBeNull();
  });
});
```

---

## No Analog Found

No files in this phase lack a close analog. All patterns are well-established in the existing codebase.

---

## Metadata

**Analog search scope:**
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/types/` (all type files)
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/services/` (all service files)
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components/` (test pattern reference)

**Files scanned:** 6 files
**Pattern extraction date:** 2026-05-04

**Key findings:**
1. Strong type definition patterns exist (Order, ProductionOrder)
2. Consistent async service pattern with delay simulation
3. Mock data uses ISO date strings and typed arrays
4. Test pattern established with @testing-library/react and Jest
5. All new files can follow exact patterns from existing code

**Pattern consistency:** HIGH - All patterns are established and consistent across existing codebase. No conflicting approaches found.
