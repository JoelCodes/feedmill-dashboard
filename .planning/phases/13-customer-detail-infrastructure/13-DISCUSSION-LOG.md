# Phase 13: Customer Detail Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 13-customer-detail-infrastructure
**Areas discussed:** Data fetching strategy, Customer not found handling, Tabs placeholder, Delivery preferences format

---

## Data Fetching Strategy

### Question 1: How should the customer detail page fetch data?

| Option | Description | Selected |
|--------|-------------|----------|
| Server Component (Recommended) | Async Server Component fetches customer + stats in parallel, no loading states needed | ✓ |
| Client Component with useEffect | Client-side fetch with loading skeleton (matches OrdersTable pattern) | |
| Hybrid - Server data, Client interactivity | Server fetch for initial data, client hooks for any dynamic behavior | |

**User's choice:** Server Component (Recommended)
**Notes:** None

### Question 2: Should customer and stats be fetched in parallel or sequentially?

| Option | Description | Selected |
|--------|-------------|----------|
| Parallel with Promise.all (Recommended) | Both requests fire at once, page renders when both complete | ✓ |
| Sequential (customer first) | Fetch customer, then fetch stats — simpler error handling | |

**User's choice:** Parallel with Promise.all (Recommended)
**Notes:** None

---

## Customer Not Found Handling

### Question 1: What should happen when a customer ID doesn't exist?

| Option | Description | Selected |
|--------|-------------|----------|
| Next.js notFound() (Recommended) | Show standard 404 page — consistent with Next.js conventions | ✓ |
| Redirect to /customers | Silently send user back to customer list | |
| Custom error state inline | Show error message in the detail page layout (like UI-SPEC error state) | |

**User's choice:** Next.js notFound() (Recommended)
**Notes:** None

### Question 2: What if customer exists but stats fetch fails?

| Option | Description | Selected |
|--------|-------------|----------|
| Show customer, fallback stats (Recommended) | Display header with customer info, show "-" or "0" for failed stat values | ✓ |
| Show error page | Treat partial failure as full failure | |
| You decide | Let Claude pick the most pragmatic approach | |

**User's choice:** Show customer, fallback stats (Recommended)
**Notes:** None

---

## Tabs Placeholder

### Question 1: What should appear below the CustomerDetailHeader in Phase 13?

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing — header only (Recommended) | Phase 13 is just infrastructure; timeline/bins come in Phase 14/15 | ✓ |
| Placeholder tabs (disabled) | Show tab bar skeleton with "Overview", "Bins" tabs but disabled | |
| Coming soon message | Show "Timeline and bins coming soon" below header | |

**User's choice:** Nothing — header only (Recommended)
**Notes:** None

---

## Delivery Preferences Format

### Question 1: Where should delivery preferences data come from?

| Option | Description | Selected |
|--------|-------------|----------|
| Add field to Customer type | Add deliveryPreferences: string to Customer interface and mock data | ✓ |
| Derive from order patterns | Compute from customer's order history (more complex, may be over-engineering) | |
| Skip for Phase 13 | Show only contact info; delivery prefs come in a later phase | |
| You decide | Let Claude pick the simplest approach that matches the design | |

**User's choice:** Add field to Customer type
**Notes:** None

### Question 2: What format for delivery preferences in mock data?

| Option | Description | Selected |
|--------|-------------|----------|
| Free-form string (Recommended) | Store as "Mon/Wed/Fri, 6-8 AM" directly — simple, matches design | ✓ |
| Structured object | { days: ['Mon', 'Wed', 'Fri'], timeWindow: '6-8 AM' } — more flexible but over-engineered for display | |
| You decide | Pick whatever fits the mock data pattern best | |

**User's choice:** Free-form string (Recommended)
**Notes:** None

---

## Claude's Discretion

None — all areas had explicit decisions from the user.

## Deferred Ideas

None — discussion stayed within phase scope.
