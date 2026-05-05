# Phase 11: Foundation (Data Layer) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 11-foundation-data-layer
**Areas discussed:** Customer-Order linkage, Mock data generation, Service architecture, Data consistency

---

## Customer-Order Linkage

| Option | Description | Selected |
|--------|-------------|----------|
| Add customerId to Order | Add customerId field to existing Order type, customer lookup by ID | ✓ |
| Derive from customer name | Parse unique customer names from orders array, no Order change needed | |
| You decide | Claude picks the best approach based on downstream needs | |

**User's choice:** Add customerId to Order (Recommended)
**Notes:** None

### Follow-up: Customer Consolidation

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, consolidate customers | e.g., "Greenfield Farms" appears twice → same customerId, aggregate order stats | ✓ |
| Keep 1:1 for now | Each mock order gets unique customerId (simpler but less realistic) | |
| You decide | Claude picks based on what makes the demo most useful | |

**User's choice:** Yes, consolidate customers (Recommended)
**Notes:** None

---

## Mock Data Generation

### Customer Data

| Option | Description | Selected |
|--------|-------------|----------|
| Derive from orders | Extract unique customer names from existing 18 orders, generate customer records with aggregated stats | ✓ |
| Define manually | Create separate hardcoded customer list with curated details (location, contact info) | |
| You decide | Claude picks based on realism and maintainability | |

**User's choice:** Derive from orders (Recommended)
**Notes:** None

### Bin Data

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-generate from order locations | Parse bin locations from orders ("Bin 1A", "Bin 2B"), create bin records per customer | |
| Define bins separately | Hardcode realistic bin set per customer independent of orders | ✓ |
| You decide | Claude picks based on data consistency needs | |

**User's choice:** Define bins separately
**Notes:** None — bins are an independent dataset (BinSentry-style) not derived from order delivery locations

---

## Service Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Separate services | customers.ts and bins.ts — matches existing orders.ts pattern, clear separation | ✓ |
| Unified service | One customers.ts with bin methods included — keeps customer data together | |
| You decide | Claude picks based on existing codebase patterns | |

**User's choice:** Separate services (Recommended)
**Notes:** None

---

## Data Consistency

| Option | Description | Selected |
|--------|-------------|----------|
| Shared data module | Single mockData.ts exports orders/customers/bins arrays — services import from there | ✓ |
| Independent datasets | Each service defines its own array — simpler but IDs may drift | |
| You decide | Claude picks based on complexity vs. consistency tradeoff | |

**User's choice:** Shared data module (Recommended)
**Notes:** None

---

## Claude's Discretion

None — all areas had explicit user decisions.

## Deferred Ideas

None — discussion stayed within phase scope.
