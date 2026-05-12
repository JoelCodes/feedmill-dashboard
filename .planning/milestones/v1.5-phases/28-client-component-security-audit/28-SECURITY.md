---
phase: 28
slug: client-component-security-audit
status: verified
threats_open: 0
asvs_level: 1
block_on: critical
created: 2026-05-12
---

# Phase 28 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail for the client-component-security-audit phase.

Phase 28 closed the client-component data-leak and pre-guard exposure surface across `/demo/orders`, `/demo/customers`, `/demo/customers/[id]`, and `/demo/mill-production`. Every page now runs `await requireRole('demo')` as its first statement, no client component imports `@/services/*`, and a forward-looking `docs/security-patterns.md` documents the canonical pattern.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser → middleware (edge) | ACCESS-01 demo-role gate (`src/middleware.ts`) — outer layer, unchanged this phase | Auth cookie / session token |
| Middleware → RSC (page entry) | NEW page-level `await requireRole('demo')` defense-in-depth (D-05) | Session token (re-checked) |
| RSC → mock service module | `getOrders` / `getCustomers` / `getCustomerById` / `getActivityEvents` / `getBinsByCustomerId` / `getOrdersByCustomerId` / `getProductionOrders` execute server-side only | Mock customer/order/production data (treated as canonical "sensitive" per D-07) |
| RSC → client child (serialized prop edge) | `OrdersTableContent`, `OrdersTable`, `CustomersList`, `MillProductionUI` receive data via JSON-serialised props; no client component imports any `@/services/*` module | Pre-fetched, role-gated data |
| Test harness → production code | `src/test/fixtures/clerkAuth.ts` is test-only; never imported from `src/app/`, `src/components/`, or `src/lib/` | Mock auth-result shapes |
| Documentation → developer mental model | `docs/security-patterns.md` codifies the canonical pattern (page-level guard before fetch; client children must not import services) | Architectural rules-of-the-road |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-28-01-01 | Tampering | Fixture leaks into production bundle | mitigate | `src/test/fixtures/clerkAuth.ts` lives under `src/test/`; `grep -r "from '@/test/fixtures/clerkAuth'" src/app/ src/components/ src/lib/` returns only test files | closed |
| T-28-01-02 | Repudiation | Test bypasses real Clerk verification, hiding regression | accept | See AR-28-01 | closed |
| T-28-01-03 | Info disclosure | Fixture exports leak in JSDoc examples | accept | See AR-28-02 | closed |
| T-28-02-01 | Elevation of privilege | `/demo/customers/[id]` middleware drift | mitigate | `src/app/demo/customers/[id]/page.tsx:16` `await requireRole('demo');` before any data fetch; three redirect-branch tests in `page.test.tsx` | closed |
| T-28-02-02 | Info disclosure | Customer detail data fetched before guard runs | mitigate | Line-order verified: `requireRole` (L16) → `await params` (L18) → `Promise.all` data fetch (L21) | closed |
| T-28-02-03 | Tampering | Dropped `await` on `requireRole` | mitigate | All three redirect-branch tests use `await expect(...).rejects.toMatchObject(...)`; a dropped `await` would let the function proceed past the guard and fail assertions loudly | closed |
| T-28-02-04 | Repudiation | No logging of failed role checks | accept | See AR-28-03 | closed |
| T-28-03-01 | Info disclosure | Order data shipped in client bundle via `OrdersTable` | mitigate | `grep -c "getOrders" src/components/OrdersTable.tsx` = 0; `grep -c "from '@/services/orders'" src/components/OrdersTable.tsx` = 0 | closed |
| T-28-03-02 | Elevation of privilege | `/demo/orders` pre-guard exposure | mitigate | `src/app/demo/orders/page.tsx:8` `await requireRole('demo');`, L9: `await getOrders()` — guard precedes fetch; redirect-branch tests cover three branches | closed |
| T-28-03-03 | Info disclosure | Stale `useEffect` fetch race in OrdersTable | mitigate | `grep -c "useState<Order\[\]>" src/components/OrdersTable.tsx` = 0; no client-side fetch state remains | closed |
| T-28-03-04 | Tampering | Re-introduce client fetch in `OrdersTableContent` | accept | See AR-28-04 | closed |
| T-28-03-05 | Repudiation | No logging of failed role checks | accept | See AR-28-05 | closed |
| T-28-04-01 | Info disclosure | Customer data shipped in client bundle via `CustomersList` | mitigate | `grep -rn "from '@/services/customers'" src/components/` = 0 matches | closed |
| T-28-04-02 | Elevation of privilege | `/demo/customers` middleware drift | mitigate | `src/app/demo/customers/page.tsx:13` `await requireRole('demo');`; six redirect-branch tests across two page test files | closed |
| T-28-04-03 | Info disclosure | Sort timing exposes activity order before role check | mitigate | Line-order verified: `requireRole` (L13) → `sortCustomersByRecentActivity(await getCustomers())` (L14) | closed |
| T-28-04-04 | Tampering | Re-introduce `useEffect` fetch in `CustomersList` | accept | See AR-28-06 | closed |
| T-28-04-05 | Repudiation | No logging of failed role checks | accept | See AR-28-07 | closed |
| T-28-05-01 | Info disclosure | Production-order data in client bundle via `MillProductionUI` | mitigate | `grep -c "from '@/services/millProduction'" src/components/MillProductionUI.tsx` = 0 | closed |
| T-28-05-02 | Elevation of privilege | `/demo/mill-production` middleware drift | mitigate | `src/app/demo/mill-production/page.tsx:7` `await requireRole('demo');`, L8: `await getProductionOrders()`; three redirect-branch tests | closed |
| T-28-05-03 | Tampering | Re-introduce `useEffect` fetch in `MillProductionUI` | accept | See AR-28-08 | closed |
| T-28-05-04 | Repudiation | No logging of failed role checks | accept | See AR-28-09 | closed |
| T-28-06-01 | Info disclosure | Doc misleads contributor into `<Protect>`-wrapped data view | mitigate | `docs/security-patterns.md` §4 paraphrases the Clerk caveat with attribution (visually-hidden children remain accessible via source); `grep -rn "<Protect" src/` = 0 — no live example to imitate; all four `/demo/*` pages confirmed guarded | closed |
| T-28-06-02 | Repudiation | Audit-findings table goes stale | accept | See AR-28-10 | closed |
| T-28-06-03 | Tampering | Doc contradicts middleware (D-04) or settings exception (D-06/D-08) | mitigate | `docs/security-patterns.md` §3 names `src/middleware.ts` as outer gate (D-04); §5 names `/settings` as D-06/D-08 carve-out | closed |
| T-28-06-04 | Spoofing | Reader confuses `<Show>` and `<Protect>` Clerk control components | mitigate | Plan-spec delta: executor wrote §4 entirely about `<Protect>` natively rather than quoting `<Show>` then bridging. Spoofing vector is neutralised differently — `<Show>` is never introduced, so confusion has no entry point. See "Plan-Spec Delta" below | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-28-01 | T-28-01-02 | Fixture stubs only the inner page-level `requireRole`. Production middleware (ACCESS-01 / D-04) is the outer guard and is untouched. Phase 27 Playwright E2E covers the full real-Clerk chain — this fixture is a unit-test convenience, not a security surface. | gsd-security-auditor | 2026-05-12 |
| AR-28-02 | T-28-01-03 | Fixture file lives under `src/test/fixtures/` (not `src/lib/`). Only `*.test.ts` files reference it. JSDoc shows mock usage, not real-auth bypass. No live secrets present. | gsd-security-auditor | 2026-05-12 |
| AR-28-03 | T-28-02-04 | Intentional non-logging of failed role checks this milestone. Carried forward from Phase 25 D-02. Logging is deferred to a future observability phase. | gsd-security-auditor | 2026-05-12 |
| AR-28-04 | T-28-03-04 | Re-introduction of a client-side fetch in `OrdersTableContent.tsx` is accepted as a point-in-time risk. Phase-scoped source assertion `grep -c "from '@/services/orders'" src/components/OrdersTableContent.tsx` = 0 is the current guard. Lint/CI rule deferred to a future tooling phase per CONTEXT.md "Deferred Ideas." | gsd-security-auditor | 2026-05-12 |
| AR-28-05 | T-28-03-05 | Intentional non-logging per Phase 25 D-02. | gsd-security-auditor | 2026-05-12 |
| AR-28-06 | T-28-04-04 | Re-introduction of `useEffect` fetch in `CustomersList.tsx` accepted at phase scope. Source assertion `grep -c "useEffect" src/components/CustomersList.tsx` = 0 is the current guard. Lint rule deferred. | gsd-security-auditor | 2026-05-12 |
| AR-28-07 | T-28-04-05 | Intentional non-logging per Phase 25 D-02. | gsd-security-auditor | 2026-05-12 |
| AR-28-08 | T-28-05-03 | Re-introduction of `useEffect` fetch in `MillProductionUI.tsx` accepted at phase scope. Source assertion `grep -c "useEffect" src/components/MillProductionUI.tsx` = 0 is the current guard. Lint rule deferred. | gsd-security-auditor | 2026-05-12 |
| AR-28-09 | T-28-05-04 | Intentional non-logging per Phase 25 D-02. | gsd-security-auditor | 2026-05-12 |
| AR-28-10 | T-28-06-02 | Audit findings table in `docs/security-patterns.md` §1 will go stale as the codebase evolves. Mitigated by the explicit date stamp ("Findings as of phase 28 completion (2026-05-11)"). Programmatic lint enforcement is out of scope per CONTEXT.md "Deferred Ideas." | gsd-security-auditor | 2026-05-12 |

---

## Plan-Spec Delta (T-28-06-04)

**Declared mitigation (plan):** §4 of `docs/security-patterns.md` should contain a verbatim Clerk `<Show>` doc quote followed by the bridging phrase "the same caveat applies to `<Protect>`".

**Actual implementation:** §4 was written entirely about `<Protect>` natively. The `<Show>` quote was never introduced, so the bridging phrase was unnecessary. The Clerk caveat is present in paraphrased form (`docs/security-patterns.md:110`): "Clerk's own documentation for its control components states the same rule: visually-hidden children remain accessible via the browser's source code even if the user fails authentication or authorization checks."

**Threat-goal status:** The underlying spoofing vector — a contributor confusing `<Show>` and `<Protect>` — is effectively neutralised. §4 unambiguously treats `<Protect>` as UX-only throughout; `<Show>` is never introduced, so confusion has no entry point. Closed as substantively mitigated. Recorded as a documentation-layer plan-spec delta, not a security gap.

**Forward note:** If a future phase introduces a verbatim Clerk `<Show>` doc quote elsewhere (e.g., a migration guide), the bridging phrase should be added at that time.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-12 | 24 | 24 | 0 | gsd-security-auditor (claude-sonnet-4-6) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-12
