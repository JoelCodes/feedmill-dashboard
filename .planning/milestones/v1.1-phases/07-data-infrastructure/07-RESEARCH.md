# Phase 07: Data Infrastructure - Research

**Researched:** 2026-04-28
**Domain:** Mock data service expansion with realistic production order generation
**Confidence:** HIGH

## Summary

Phase 07 expands the existing mock production orders service from 12 to 30+ orders with realistic distribution across mill lines and production states. The work is constrained to pure TypeScript data generation — no external libraries, no database, no build-time data transformation. User decisions lock in the data fields (hybrid approach: add textureType and lineCode), volume (30+ orders), mill distribution (arbitrary demo assignment), and state distribution (production-weighted: 40-50% Completed, 25-30% Pending, 15-20% Mixing, 5-10% Blocked).

Research confirms the existing service architecture (async interface with delay simulation, module-level const arrays, type-safe data structures) is sound. The primary task is expanding the `mockOrders` array in `src/services/millProduction.ts` with realistic customer names, product descriptions, texture types, and line codes drawn from the example data files (Daily Delivery April 22nd and 23rd markdown files). No schema changes beyond adding two fields to the ProductionOrder type.

**Primary recommendation:** Expand mockOrders array inline using realistic names from example data; use weighted randomization helper for state distribution; add textureType and lineCode fields to type and data; maintain existing delay simulation pattern (200ms + random jitter).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Mock data storage | Frontend Server (SSR) | — | Service modules in Next.js live server-side in development, client-side after build |
| Data fetching | Frontend Server (SSR) | Browser / Client | Client-side React calls async service functions |
| Type definitions | Frontend Server (SSR) | — | Shared TypeScript types compiled at build time |
| State distribution logic | Frontend Server (SSR) | — | Data generation happens in service module |
| Realistic data sourcing | Frontend Server (SSR) | — | Hardcoded arrays reference example data values |

**Note:** Next.js 16 with "use client" directive means services execute client-side at runtime despite being in `src/` tree. No server-only restrictions apply to mock data services. [VERIFIED: src/app/mill-production/page.tsx has "use client" directive]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | Production orders mock data derived from Book1.xlsx structure | Example data files provide realistic customer names, product descriptions, texture types, line codes, and weight ranges |
| DATA-02 | Mock service returns orders with realistic mill line distribution | Existing service structure supports distribution; CONTEXT.md D-05/D-07 specify arbitrary demo assignment with roughly even distribution across Premix/Excel/CGM |
</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Data Fields (D-01, D-02, D-03):**
- Hybrid approach: Add `textureType` and `lineCode` to ProductionOrder type
- Keep current fields: `orderNumber`, `customer`, `product`, `weightLbs`, `deliveryTime`, `state`, `millLine`
- Farm Location Code and Salesperson ID stay out for now

**Data Volume (D-04, D-05):**
- Service returns 30+ mock orders (matching scale of daily delivery files)
- Orders distributed across all three mill lines (Premix, Excel, CGM)

**Mill Line Mapping (D-06, D-07):**
- Arbitrary mill assignment for demo purposes — no need to match real-world CGM/EFI processing rules
- Distribution roughly even across Premix, Excel, CGM columns

**State Distribution (D-08):**
- Production-weighted distribution:
  - Completed: 40-50%
  - Pending: 25-30%
  - Mixing: 15-20%
  - Blocked: 5-10%

### Claude's Discretion

- Realistic customer names drawn from example data (Westbridge Farm, Starbird @ Jaedel, etc.)
- Realistic product names drawn from example data (BROILER BRD 16% OS, SEVERINSKI DAIRY MASH, etc.)
- Delivery times spread throughout business hours (6:00 AM - 3:00 PM)
- Weight values in realistic ranges (3,000 - 18,000 lbs)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.7.3 | Type safety for mock data structures | Project uses TypeScript throughout; strict mode enabled [VERIFIED: tsconfig.json strict: true] |
| Next.js | 16.1.6 | React framework providing service module structure | Existing project framework; services follow Next.js patterns [VERIFIED: package.json] |

**Installation:**
No new packages required. All dependencies already installed.

**Version verification:**
```bash
# Verified 2026-04-28
npm view typescript version  # 6.0.3 (latest available)
# Project uses: ^5.7.3 (TypeScript 5.x series, compatible)
npm list next --depth=0      # 16.1.6 (current)
```

### Supporting

No supporting libraries needed. This is pure TypeScript data generation using native language features.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline mock array | faker.js / @faker-js/faker | Adds dependency for what amounts to 30 hardcoded objects; overkill for static demo data |
| Hardcoded data | JSON file import | Extra file to maintain; no type safety at authoring time; same bundle size |
| Module-level const | Database (SQLite, PostgreSQL) | Massive complexity increase for demo data; contradicts "mock service" requirement |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Client-Side React)                                │
│  ┌────────────────────────────────────────┐                 │
│  │ /mill-production/page.tsx              │                 │
│  │                                        │                 │
│  │  useEffect(() => {                     │                 │
│  │    getProductionOrders()               │───────┐         │
│  │      .then(setOrders)                  │       │         │
│  │  }, [])                                │       │         │
│  └────────────────────────────────────────┘       │         │
│                                                    │         │
│                                                    ▼         │
│  ┌────────────────────────────────────────────────────┐     │
│  │ @/services/millProduction.ts                       │     │
│  │                                                    │     │
│  │  export async function getProductionOrders() {     │     │
│  │    await delay(200 + Math.random() * 100);         │     │
│  │    return mockOrders; ◄─────────────┐              │     │
│  │  }                                  │              │     │
│  │                                     │              │     │
│  │  const mockOrders: ProductionOrder[] = [           │     │
│  │    { id: "1", orderNumber: "ORD-255154", ... },    │     │
│  │    { id: "2", orderNumber: "ORD-255421", ... },    │     │
│  │    ... (30+ orders)                                │     │
│  │  ];                                                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ @/types/millProduction.ts                          │     │
│  │                                                    │     │
│  │  export interface ProductionOrder {                │     │
│  │    id: string;                                     │     │
│  │    orderNumber: string;                            │     │
│  │    customer: string;                               │     │
│  │    product: string;                                │     │
│  │    weightLbs: number;                              │     │
│  │    deliveryTime: string;                           │     │
│  │    state: ProductionState;                         │     │
│  │    millLine: MillLine;                             │     │
│  │    textureType?: string; ◄─── NEW                  │     │
│  │    lineCode?: string;    ◄─── NEW                  │     │
│  │  }                                                 │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘

Data Flow:
1. Page component mounts, calls getProductionOrders()
2. Service simulates network delay (200ms + jitter)
3. Service returns hardcoded mockOrders array
4. Component receives typed ProductionOrder[] data
5. Component filters/groups orders by millLine for column display
```

**Key architectural points:**
- No actual network request — delay simulates API latency for realistic UX
- Type safety enforced at compile time via ProductionOrder interface
- Service module pattern matches existing orders.ts and notifications.ts
- Client-side execution (Next.js "use client" page imports service directly)

### Recommended Project Structure

Current structure is already correct for mock services:

```
src/
├── services/
│   ├── millProduction.ts    # Expand mockOrders from 12 → 30+ items
│   ├── orders.ts             # Reference pattern for delay simulation
│   └── notifications.ts      # Reference pattern for const array + async export
├── types/
│   └── millProduction.ts     # Add textureType?, lineCode? to ProductionOrder
└── app/
    └── mill-production/
        └── page.tsx          # Consumes getProductionOrders() — no changes needed
```

**No structural changes required.** Existing organization matches Next.js conventions and project patterns.

### Pattern 1: Async Mock Service with Delay Simulation

**What:** Synchronous data (const array) wrapped in async function with artificial delay to simulate network latency.

**When to use:** Mock services that will eventually be replaced with real API calls. Maintains async interface so component code doesn't change when switching to real backend.

**Example:**
```typescript
// Source: Existing pattern from src/services/millProduction.ts and orders.ts

const mockOrders: ProductionOrder[] = [
  { id: "1", orderNumber: "ORD-255154", customer: "Westbridge Farm", ... },
  { id: "2", orderNumber: "ORD-255421", customer: "Meadowview Poultry", ... },
  // ... 30+ total orders
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getProductionOrders(): Promise<ProductionOrder[]> {
  await delay(200 + Math.random() * 100); // Base delay + jitter
  return mockOrders;
}

export async function getOrdersByMillLine(
  millLine: MillLine
): Promise<ProductionOrder[]> {
  await delay(200 + Math.random() * 100);
  return mockOrders.filter((order) => order.millLine === millLine);
}
```

**Why this pattern:**
- Simulates realistic loading states in UI (skeleton → data)
- Prevents flickering on instant data loads
- Interface matches real async API (easy to swap implementation later)
- Random jitter prevents unrealistic "always exactly 200ms" behavior

**Established delay values in project:**
- `orders.ts`: 200-300ms depending on function
- `notifications.ts`: 200ms flat
- `millProduction.ts`: 200ms + random jitter (0-100ms)

**Recommendation:** Continue using 200ms + jitter pattern for consistency with existing millProduction.ts service.

### Pattern 2: Type-Safe Mock Data with Literal Arrays

**What:** Mock data defined as const arrays typed to match production interfaces. TypeScript compiler validates every field.

**When to use:** Small to medium datasets (under 100 items) where maintaining data inline is practical.

**Example:**
```typescript
// Source: Existing pattern from src/services/millProduction.ts

import { ProductionOrder, MillLine } from "@/types/millProduction";

const mockOrders: ProductionOrder[] = [
  // TypeScript validates each object matches ProductionOrder interface
  {
    id: "1",
    orderNumber: "ORD-255154",
    customer: "Westbridge Farm",
    product: "BROILER BRD 16% OS",
    weightLbs: 6000,
    deliveryTime: "8:30 AM",
    state: "Completed",
    millLine: "Premix",
    textureType: "MASH",      // NEW field
    lineCode: "33161",        // NEW field
  },
  // ... more orders
];
```

**Why this pattern:**
- Compile-time validation catches typos, missing fields, wrong types
- IDE autocomplete for all fields
- No runtime parsing overhead (unlike JSON import)
- Easy to review and edit (all data visible in one file)

### Pattern 3: Realistic Data Sourcing from Examples

**What:** Extract realistic values from example data files (customer names, product descriptions, texture types) to populate mock data.

**When to use:** When domain-specific terminology and realistic variety matters for UI testing. Generic faker.js data ("John Doe", "Product A") doesn't expose real-world data density issues.

**Example:**
```typescript
// Source: Derived from example-data/Daily Delivery April.22.nd.md

// Real customer names from example data
const customers = [
  "Westbridge Farm",
  "Starbird @ Jaedel",
  "Severinski Farm",
  "Rockwall @ Peardonville",
  "Cedarcroft Poultry",
  "Triple H Farms",
  "Whytebridge Farms",
  // ... etc
];

// Real product names from example data
const products = [
  "BROILER BRD 16% OS",
  "BROILER GROWER I MD",
  "SEVERINSKI DAIRY MASH",
  "JIREH COMPUTER PELLET",
  "FINISHER FEB 2026 WHEY",
  // ... etc
];

// Real texture types from example data
const textureTypes = ["MASH", "PELLET", "C. CRUMBLE", "SH PELLET", "FINE CR"];

// Mock data combines real values
const mockOrders: ProductionOrder[] = [
  {
    id: "1",
    customer: customers[0],
    product: products[0],
    textureType: textureTypes[0],
    // ...
  },
];
```

**Why this pattern:**
- Tests UI with realistic string lengths and character sets
- Exposes formatting issues early (e.g., long customer names wrapping)
- Maintains domain authenticity for stakeholder demos
- No external dependency (just manual extraction from .md files)

### Pattern 4: Weighted Distribution for Realistic State Mix

**What:** Generate production state assignments using weighted probabilities to match real-world distributions.

**When to use:** Mock data where certain states should be more common than others. Equal distribution (25% each) looks artificial.

**Example:**
```typescript
// Source: CONTEXT.md D-08 production-weighted distribution
// Completed: 40-50%, Pending: 25-30%, Mixing: 15-20%, Blocked: 5-10%

type StateWeight = { state: ProductionState; min: number; max: number };

const STATE_WEIGHTS: StateWeight[] = [
  { state: "Completed", min: 0.40, max: 0.50 },
  { state: "Pending", min: 0.25, max: 0.30 },
  { state: "Mixing", min: 0.15, max: 0.20 },
  { state: "Blocked", min: 0.05, max: 0.10 },
];

// For 30 orders: ~14 Completed, ~8 Pending, ~5 Mixing, ~3 Blocked
// Assign states in bulk, then shuffle for realistic interleaving
function generateStates(count: number): ProductionState[] {
  const states: ProductionState[] = [];

  // Use midpoint of range for predictable distribution
  const completedCount = Math.round(count * 0.45); // 45% target
  const pendingCount = Math.round(count * 0.275);  // 27.5% target
  const mixingCount = Math.round(count * 0.175);   // 17.5% target
  const blockedCount = count - completedCount - pendingCount - mixingCount;

  states.push(...Array(completedCount).fill("Completed"));
  states.push(...Array(pendingCount).fill("Pending"));
  states.push(...Array(mixingCount).fill("Mixing"));
  states.push(...Array(blockedCount).fill("Blocked"));

  // Shuffle to avoid all Completed orders first
  return states.sort(() => Math.random() - 0.5);
}
```

**Why this pattern:**
- Matches real production environments (most orders complete successfully)
- Provides enough variety in each state for testing filter UI
- Avoids artificial-looking even distribution
- Deterministic count (no random fluctuation across page loads)

**Alternative (simpler):** Manually assign states to each order in mockOrders array to hit target percentages. For 30 orders: 14 Completed, 8 Pending, 5 Mixing, 3 Blocked. More explicit, less code.

### Anti-Patterns to Avoid

**Anti-pattern: Dynamic data generation on every call**
```typescript
// BAD: Different data on every page refresh
export async function getProductionOrders(): Promise<ProductionOrder[]> {
  const orders = [];
  for (let i = 0; i < 30; i++) {
    orders.push({
      id: `${i}`,
      customer: customers[Math.floor(Math.random() * customers.length)],
      // ... generates different data each time
    });
  }
  return orders;
}
```
**Why bad:** UI tests become unreliable (can't reproduce specific edge cases). Filter counts change on every load. User confusion when refreshing page shows different data.

**Fix:** Define mockOrders as const array at module level. Same data every time.

---

**Anti-pattern: Incomplete type coverage**
```typescript
// BAD: Optional fields left undefined on some orders
const mockOrders: ProductionOrder[] = [
  { id: "1", orderNumber: "ORD-001", customer: "Farm A", ... }, // missing textureType, lineCode
  { id: "2", orderNumber: "ORD-002", customer: "Farm B", textureType: "MASH", ... }, // has textureType
];
```
**Why bad:** UI components can't rely on fields being present. Leads to defensive null checks or runtime errors.

**Fix:** If field is optional in type (textureType?: string), either populate it for ALL orders or for NONE. Consistency matters for testing.

---

**Anti-pattern: Unrealistic weight/time values**
```typescript
// BAD: All weights are round numbers, all times on the hour
{ weightLbs: 5000, deliveryTime: "8:00 AM" },
{ weightLbs: 10000, deliveryTime: "9:00 AM" },
```
**Why bad:** Doesn't expose real-world rendering issues (number formatting, time display width).

**Fix:** Use varied values from example data (6,000 lbs, 15,000 lbs, 18,000 lbs) and realistic times (6:30 AM, 9:45 AM, 2:30 PM).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Random data generation | Custom faker/generator | Hardcoded const array | For 30 orders, manual data is faster and more predictable than building a generator |
| CSV/JSON parsing | Custom parser for Book1.xlsx | Manual extraction to .ts | One-time task, no need for runtime parsing overhead |
| State distribution | Complex probability system | Simple array fill + shuffle (or manual assignment) | 30 orders = just assign 14 Completed, 8 Pending, 5 Mixing, 3 Blocked directly |
| Data validation | Custom validation logic | TypeScript interface | Type system catches all data structure errors at compile time |

**Key insight:** For small static datasets (30-50 items), the fastest, most maintainable solution is often a well-organized hardcoded array. Introducing abstraction (generators, parsers, randomization) adds complexity without benefit at this scale.

## Common Pitfalls

### Pitfall 1: Type Definition Mismatch Between Types and Service

**What goes wrong:** Add textureType and lineCode to ProductionOrder interface, but forget to update existing mockOrders data. TypeScript shows no error because fields are optional (?), but UI displays undefined values.

**Why it happens:** Optional fields (textureType?: string) compile successfully even when omitted. No immediate feedback that data is incomplete.

**How to avoid:**
1. After adding fields to interface, search codebase for all ProductionOrder[] arrays
2. Add new fields to every object in mockOrders array before committing
3. Consider making fields required (textureType: string) temporarily to force compiler errors, then switch to optional after data populated

**Warning signs:**
- UI shows "undefined" or blank spaces in texture type display
- Phase 8 filters break because textureType field is missing
- Console warnings about missing object properties

### Pitfall 2: Incorrect State Distribution Math

**What goes wrong:** Assign states to hit percentage targets, but math doesn't account for rounding. End up with 29 or 31 orders instead of 30+, or percentages drift far from target ranges.

**Why it happens:**
```typescript
// BAD: Rounding can cause total != 30
const completedCount = Math.round(30 * 0.45); // 14
const pendingCount = Math.round(30 * 0.275);  // 8
const mixingCount = Math.round(30 * 0.175);   // 5
const blockedCount = Math.round(30 * 0.10);   // 3
// Total: 14 + 8 + 5 + 3 = 30 ✓ (lucky!)

// But for 31 orders:
const completedCount = Math.round(31 * 0.45); // 14
const pendingCount = Math.round(31 * 0.275);  // 9
const mixingCount = Math.round(31 * 0.175);   // 5
const blockedCount = Math.round(31 * 0.10);   // 3
// Total: 14 + 9 + 5 + 3 = 31 ✓ (lucky again!)
```

**How to avoid:**
```typescript
// GOOD: Calculate first three, assign remainder to last
const completedCount = Math.round(count * 0.45);
const pendingCount = Math.round(count * 0.275);
const mixingCount = Math.round(count * 0.175);
const blockedCount = count - completedCount - pendingCount - mixingCount; // remainder
```

**Warning signs:**
- mockOrders.length !== expected count
- State percentages far outside D-08 ranges when checked manually
- One state has zero orders (math error wiped it out)

### Pitfall 3: Business Hours Time Format Inconsistency

**What goes wrong:** Mix time formats in deliveryTime field — some "8:30 AM", some "08:30", some "8:30am" (lowercase). UI displays inconsistently, sorting breaks.

**Why it happens:** Manual data entry without format validation. Copy-paste from different sources (example data uses "8:30 AM" format, but developer types "8:30am").

**How to avoid:**
1. Pick one format: "H:MM AM/PM" (e.g., "8:30 AM", "11:00 AM", "2:30 PM")
2. Create format documentation comment above mockOrders array
3. Use search/replace to normalize before committing
4. Consider helper function if generating times programmatically:

```typescript
// Helper for consistent time format
function formatDeliveryTime(hour: number, minute: number = 0): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
}
// formatDeliveryTime(8, 30) → "8:30 AM"
// formatDeliveryTime(14, 0) → "2:00 PM"
```

**Warning signs:**
- Times sort incorrectly (string sort puts "10:00 AM" before "8:00 AM")
- AM/PM display inconsistent in UI (some lowercase, some uppercase)
- Alignment issues in time column (varying string lengths)

### Pitfall 4: Copy-Paste ID Duplication

**What goes wrong:** Copy an order object to create a new one, change customer/product fields, but forget to update the id field. Two orders have id: "5", React key warnings appear, UI behavior breaks.

**Why it happens:** Fast copy-paste editing. ID field is at top of object, easy to overlook when focused on customer/product data at middle.

**How to avoid:**
1. When adding new order, change id FIRST before editing other fields
2. Use sequential numbering (1, 2, 3, ..., 30) for easy audit
3. Before committing, grep for duplicate IDs:

```bash
# Check for duplicate IDs in mockOrders
grep -oP 'id: "\K\d+' millProduction.ts | sort | uniq -d
# Output shows any duplicated ID numbers
```

**Warning signs:**
- React console warning: "Encountered two children with the same key"
- Clicking one card highlights a different card (ID collision)
- Filter counts don't match visible cards (duplicate IDs cause count errors)

### Pitfall 5: Mill Line Imbalance

**What goes wrong:** Assign orders to mill lines without checking totals. End up with Premix: 5 orders, Excel: 3 orders, CGM: 22 orders. UI looks broken with one column dominating.

**Why it happens:** Random assignment or manual editing without tracking distribution.

**How to avoid:**
1. Use block assignment: first 10 orders → Premix, next 10 → Excel, last 10+ → CGM
2. After data creation, count by mill line:

```typescript
// Verification helper (run in Node or browser console)
const countsByMill = mockOrders.reduce((acc, order) => {
  acc[order.millLine] = (acc[order.millLine] || 0) + 1;
  return acc;
}, {} as Record<MillLine, number>);
console.log(countsByMill);
// Should show roughly even split: { Premix: 10, Excel: 10, CGM: 10 }
```

**Target distribution (D-07: roughly even):**
- For 30 orders: 10 Premix, 10 Excel, 10 CGM
- For 33 orders: 11 Premix, 11 Excel, 11 CGM
- For 36 orders: 12 Premix, 12 Excel, 12 CGM

**Warning signs:**
- One mill column has 2x the cards of others
- Empty mill column (all orders assigned to wrong lines)
- Scrolling required for one column but not others

## Code Examples

Verified patterns from existing codebase and recommended implementations:

### Expanding ProductionOrder Type

```typescript
// Source: src/types/millProduction.ts (to be updated)
export type MillLine = "Premix" | "Excel" | "CGM";

export type ProductionState = "Completed" | "Mixing" | "Blocked" | "Pending";

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  customer: string;
  product: string;
  weightLbs: number;
  deliveryTime: string;
  state: ProductionState;
  millLine: MillLine;
  textureType?: string; // NEW: MASH, PELLET, C. CRUMBLE, SH PELLET, FINE CR
  lineCode?: string;    // NEW: Numeric code from example data (33161, 22563, etc.)
}
```

**Why optional (?):** CONTEXT.md D-01 says "add" these fields but D-03 says some other fields "stay out for now". Treating new fields as optional allows gradual adoption and backward compatibility if other code paths don't use them yet.

### Mock Order Structure (Single Example)

```typescript
// Source: Derived from existing millProduction.ts + example data
const mockOrders: ProductionOrder[] = [
  {
    id: "1",
    orderNumber: "ORD-255154",
    customer: "Westbridge Farm",
    product: "BROILER BRD 16% OS",
    weightLbs: 6000,
    deliveryTime: "8:30 AM",
    state: "Completed",
    millLine: "Premix",
    textureType: "MASH",
    lineCode: "33161",
  },
  {
    id: "2",
    orderNumber: "ORD-255421",
    customer: "Meadowview Poultry",
    product: "BRD PRE-START FINE CR",
    weightLbs: 6000,
    deliveryTime: "9:15 AM",
    state: "Mixing",
    millLine: "Premix",
    textureType: "FINE CR",
    lineCode: "33101",
  },
  // ... 28+ more orders
];
```

**Field notes:**
- `id`: Sequential string numbers ("1", "2", "3", ...)
- `orderNumber`: Format "ORD-" + document number from example data (ORD-255154, ORD-255421, etc.)
- `customer`: Real names from Daily Delivery .md files
- `product`: Real product descriptions from Daily Delivery .md files
- `weightLbs`: Numeric (no commas, no units) — range 3000-18000
- `deliveryTime`: "H:MM AM/PM" format, spread across 6:00 AM - 3:00 PM
- `state`: Distribution per D-08 (45% Completed, 27.5% Pending, 17.5% Mixing, 10% Blocked)
- `millLine`: Even split across Premix, Excel, CGM (10 each for 30 orders)
- `textureType`: Real values from example data
- `lineCode`: Real numeric codes from example data

### Delay Simulation Pattern

```typescript
// Source: Existing src/services/millProduction.ts (no changes needed)
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getProductionOrders(): Promise<ProductionOrder[]> {
  await delay(200 + Math.random() * 100); // 200-300ms simulated latency
  return mockOrders;
}

export async function getOrdersByMillLine(
  millLine: MillLine
): Promise<ProductionOrder[]> {
  await delay(200 + Math.random() * 100);
  return mockOrders.filter((order) => order.millLine === millLine);
}
```

**Pattern rationale:**
- Base delay (200ms) matches existing services (notifications.ts uses 200ms)
- Random jitter (0-100ms) prevents artificial precision
- Async interface future-proofs for real API replacement
- Separate function per query type (all orders vs filtered by mill) matches REST patterns

### Example Data Sources (Reference)

Real values extracted from example-data/Daily Delivery April 22nd and 23rd:

```typescript
// Customer names (Poultry/CGM)
"Westbridge Farm"
"Starbird @ Jaedel"
"Rockwall @ Peardonville"
"Cedarcroft Poultry"
"Triple H Farms"
"Whytebridge Farms"
"Meadowview Poultry"
"Golden View Farm"
"Oranya @ Dixon Road"

// Customer names (Dairy/EFI)
"Severinski Farm"
"Jireh Farms"
"Corner's Pride Farm"
"Trilean Makin Bacon"

// Product names (Poultry/CGM)
"BROILER BRD 16% OS"
"BROILER GROWER I MD"
"BROILER STARTER MD"
"BROIL FINISH 1 PELLET"
"BROILER BRD LAY 1 T8"
"BRD PRE-START FINE CR"
"LAYER BRD PH 2 CR"

// Product names (Dairy/EFI + Hog)
"SEVERINSKI DAIRY MASH"
"JIREH COMPUTER PELLET"
"CPF ROBOT GRAIN PELLET"
"FINISHER FEB 2026 WHEY"
"PREGROW 1 JUNE 2025"

// Texture types
"MASH"
"PELLET"
"C. CRUMBLE"
"SH PELLET"
"FINE CR"
"CRUMBLE"

// Line codes (numeric strings)
"33161"
"33101"
"22563"
"22562"
"22564"
"66218"
"66554"
"44114"
```

**Usage:** Mix and match these real values when creating 30+ mock orders. No need to match customer→product→texture relationships from source data (D-06: arbitrary mill assignment). Focus on realistic string variety and lengths.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 12 mock orders | 30+ mock orders | Phase 7 (this phase) | Better represents daily delivery file scale |
| No texture type or line code | Add textureType and lineCode fields | Phase 7 (this phase) | Enables future filtering/grouping features |
| Generic names ("Meadowview Poultry") | Real customer names from example data | Phase 7 (this phase) | Realistic demo data for stakeholder review |
| Even state distribution | Production-weighted distribution | Phase 7 (this phase) | Matches real mill operations (most orders complete) |

**Deprecated/outdated:**
- **12-order dataset**: Previous mockOrders array had 12 items (4 per mill line). Phase 7 expands to 30+ to match daily delivery file scale and provide realistic filter testing data.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Optional fields (textureType?, lineCode?) are acceptable for type definition | User Constraints, Code Examples | If fields must be required, need to add fallback values ("UNKNOWN", "0000") for legacy data paths |
| A2 | Business hours range is 6:00 AM - 3:00 PM | User Constraints, Common Pitfalls | If actual mill operates 24/7 or different shift hours, delivery times won't reflect reality |
| A3 | TypeScript strict mode catches all type errors at compile time | Standard Stack | If tsconfig.json strict: false, missing field errors might only surface at runtime |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Should textureType and lineCode be required or optional?**
   - What we know: CONTEXT.md D-01 says "add" them; existing code has optional pattern for hasChanges field
   - What's unclear: Whether every order MUST have these fields or they can be omitted for some orders
   - Recommendation: Start with optional (?), populate for all 30+ orders, switch to required if no legacy compatibility issues arise

2. **Should order IDs be sequential or match document numbers?**
   - What we know: Current mockOrders uses sequential string IDs ("1", "2", "3", ...); document numbers are 255154, 255421, etc.
   - What's unclear: Whether id should match orderNumber suffix for easier cross-referencing
   - Recommendation: Keep sequential IDs (simpler, no risk of duplicate document numbers), use orderNumber for display

3. **How to handle products without texture types in example data?**
   - What we know: Some example data rows have blank Texture Type column (e.g., "CANOLA MEAL")
   - What's unclear: Whether to omit textureType field (undefined) or use placeholder ("BULK", "N/A")
   - Recommendation: Use undefined (omit field) to match optional type definition, or filter those products out of mock data if they're edge cases

## Environment Availability

> This phase has no external dependencies (code-only changes to TypeScript files).

All work happens in existing TypeScript service and type files. No build tools, CLI utilities, or external services required beyond standard Next.js development environment already confirmed working.

**Verification:**
```bash
# TypeScript compiler available (verified via package.json and successful prior builds)
npx tsc --version  # Would show TypeScript version if needed

# Next.js dev server working (confirmed by existing Phase 6 completion)
npm run dev  # Starts development server on localhost:3000
```

**No blockers identified.** Environment sufficient for Phase 7 work.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test config found [VERIFIED: no jest.config.*, vitest.config.*, or *.test.ts files in project root] |
| Config file | none — see Wave 0 |
| Quick run command | `npm test` (after framework setup) |
| Full suite command | `npm test` (after framework setup) |

**Note:** Project uses TypeScript strict mode [VERIFIED: tsconfig.json strict: true], which provides compile-time validation for type safety. This catches many errors that would require unit tests in JavaScript projects.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Mock service returns 30+ orders with all required fields | unit | `npm test -- millProduction.test.ts -t "returns 30+ orders"` | ❌ Wave 0 |
| DATA-01 | Each order has textureType and lineCode fields populated | unit | `npm test -- millProduction.test.ts -t "has texture and line code"` | ❌ Wave 0 |
| DATA-02 | Orders distributed across all three mill lines (Premix, Excel, CGM) | unit | `npm test -- millProduction.test.ts -t "mill line distribution"` | ❌ Wave 0 |
| DATA-02 | Mill line counts roughly even (within ±2 of target) | unit | `npm test -- millProduction.test.ts -t "even distribution"` | ❌ Wave 0 |
| D-08 | State distribution matches production-weighted targets (Completed 40-50%, Pending 25-30%, Mixing 15-20%, Blocked 5-10%) | unit | `npm test -- millProduction.test.ts -t "state distribution"` | ❌ Wave 0 |

**Manual validation (until automated tests exist):**
1. Compile TypeScript: `npm run build` — confirms type safety
2. Visual inspection: `npm run dev`, navigate to /mill-production — confirms UI renders 30+ cards
3. Console log counts: Add `console.log(mockOrders.length)` temporarily — confirms count
4. Mill column balance: Visual check that three columns have similar card counts
5. State variety: Visual check that all four states appear in UI

### Sampling Rate

- **Per task commit:** `npm run build` (TypeScript compilation validates types)
- **Per wave merge:** `npm run build && npm run dev` (manual visual check at /mill-production)
- **Phase gate:** TypeScript compilation clean + visual confirmation of 30+ cards distributed across mill lines before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/services/millProduction.test.ts` — covers DATA-01, DATA-02, D-08
- [ ] Test framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom` — if testing infrastructure desired
- [ ] `vitest.config.ts` — configure path aliases (@/) for test imports

*(If no testing infrastructure is added, TypeScript strict mode + manual visual validation remains the quality gate.)*

## Sources

### Primary (HIGH confidence)

- Existing codebase files:
  - `src/services/millProduction.ts` — Current mock service structure [VERIFIED: Read tool]
  - `src/services/orders.ts` — Established delay simulation pattern [VERIFIED: Read tool]
  - `src/types/millProduction.ts` — Current type definitions [VERIFIED: Read tool]
  - `src/app/mill-production/page.tsx` — Service consumer, confirms async pattern [VERIFIED: Read tool]
  - `tsconfig.json` — TypeScript configuration, strict mode enabled [VERIFIED: Read tool]
  - `package.json` — Dependency versions [VERIFIED: Read tool]
- Example data files:
  - `example-data/Daily Delivery April.22.nd.md` — Real customer names, products, texture types, line codes [VERIFIED: Read tool]
  - `example-data/Daily Delivery April.23rd.md` — Additional realistic data variety [VERIFIED: Read tool]
- Phase context:
  - `.planning/phases/07-data-infrastructure/07-CONTEXT.md` — User decisions D-01 through D-08 [VERIFIED: Read tool]
  - `.planning/REQUIREMENTS.md` — DATA-01, DATA-02 requirements [VERIFIED: Read tool]

### Secondary (MEDIUM confidence)

- npm registry:
  - TypeScript 6.0.3 (latest available as of 2026-04-28) [VERIFIED: npm view typescript version]
  - Next.js 16.1.6 (project version) [VERIFIED: package.json]
- Context7:
  - Next.js library documentation search results — confirmed Next.js 16.x supports client-side service patterns [VERIFIED: npx ctx7 library next.js "async server components data fetching"]

### Tertiary (LOW confidence)

None — all research findings verified against project files or official package registries.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed; versions verified against npm registry; existing code confirms patterns work
- Architecture: HIGH - Patterns extracted from working codebase files; Next.js 16 client-side execution confirmed via "use client" directive usage
- Pitfalls: MEDIUM - Derived from common TypeScript/mock data patterns and manual data entry experience; specific to this project based on field count and distribution requirements
- Data sources: HIGH - Example .md files provide comprehensive realistic values; customer names, products, texture types all verified by reading source files

**Research date:** 2026-04-28
**Valid until:** 2026-05-28 (30 days — mock data patterns and TypeScript practices stable)

**Cavebase verification:**
- No external APIs consulted (all research from local files)
- No assumptions about future features beyond Phase 7 scope
- No dependencies on unverified training data claims
