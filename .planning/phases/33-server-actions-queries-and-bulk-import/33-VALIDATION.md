---
phase: 33
slug: server-actions-queries-and-bulk-import
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-13
---

# Phase 33 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `33-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 + ts-jest |
| **Config file** | `jest.config.ts` (root) |
| **Quick run command** | `npm test -- --testPathPatterns="src/actions\|src/db/queries" --watchAll=false` |
| **Full suite command** | `npm test` |
| **Type check** | `npx tsc --noEmit` |
| **Estimated runtime** | ~1-3s (quick) / ~30s (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPatterns="src/actions|src/db/queries" --watchAll=false`
- **After every plan wave:** Run `npm test` (full Jest suite) + `npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

*Populated during planning/execution. Task IDs map to PLAN.md tasks once plans land.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | transitions | 1 | TRANS-01 | T-33-AuthZ | `requireRole('mill_operator')` first line | unit | `npm test -- --testPathPatterns="actions/transitions"` | ❌ W0 | ⬜ pending |
| TBD | transitions | 1 | TRANS-02 | — | state=Mixing precondition | unit | `npm test -- --testPathPatterns="actions/transitions"` | ❌ W0 | ⬜ pending |
| TBD | transitions | 1 | TRANS-03 | — | `reason` required (TS signature) | unit | `npm test -- --testPathPatterns="actions/transitions"` | ❌ W0 | ⬜ pending |
| TBD | transitions | 1 | TRANS-04 | — | from Blocked only | unit | `npm test -- --testPathPatterns="actions/transitions"` | ❌ W0 | ⬜ pending |
| TBD | transitions | 1 | TRANS-05 | T-33-Audit | `order_events` row written | unit | `npm test -- --testPathPatterns="actions/transitions"` | ❌ W0 | ⬜ pending |
| TBD | transitions | 1 | TRANS-06 | T-33-Stale | `.returning().length === 0` → `code: 'conflict'` + locked message | unit | `npm test -- --testPathPatterns="actions/transitions"` | ❌ W0 | ⬜ pending |
| TBD | transitions | 1 | TRANS-07 | — | `revalidateTag('production-orders')` invoked | unit (mock) | `npm test -- --testPathPatterns="actions/transitions"` | ❌ W0 | ⬜ pending |
| TBD | import-schema | 1 | IMPORT-02 | T-33-Input | Zod accepts valid row | unit (TDD) | `npm test -- --testPathPatterns="actions/import"` | ❌ W0 | ⬜ pending |
| TBD | import-schema | 1 | IMPORT-02 | T-33-Input | Zod rejects missing required fields | unit (TDD) | `npm test -- --testPathPatterns="actions/import"` | ❌ W0 | ⬜ pending |
| TBD | import-schema | 1 | IMPORT-02 | — | Zod accepts null `textureType`/`lineCode` | unit (TDD) | `npm test -- --testPathPatterns="actions/import"` | ❌ W0 | ⬜ pending |
| TBD | import-preview | 2 | IMPORT-01 | — | preview returns `{ summary, rows }` | unit | `npm test -- --testPathPatterns="actions/import"` | ❌ W0 | ⬜ pending |
| TBD | import-commit | 2 | IMPORT-04 | — | partial-import: valid rows commit, invalid reported | unit | `npm test -- --testPathPatterns="actions/import"` | ❌ W0 | ⬜ pending |
| TBD | import-commit | 2 | IMPORT-04 | — | weight coercion: number → string for DB insert | unit | `npm test -- --testPathPatterns="actions/import"` | ❌ W0 | ⬜ pending |
| TBD | import-commit | 2 | IMPORT-05 | — | intra-file duplicate detection (same `orderNumber` twice) | unit | `npm test -- --testPathPatterns="actions/import"` | ❌ W0 | ⬜ pending |
| TBD | import-commit | 2 | IMPORT-05 | T-33-Audit | overwrite event row has `from_state === to_state` + `[OVERWRITE]` note | unit | `npm test -- --testPathPatterns="actions/import"` | ❌ W0 | ⬜ pending |
| TBD | import-commit | 2 | IMPORT-06 | — | `import_batches` row written on success only | unit | `npm test -- --testPathPatterns="actions/import"` | ❌ W0 | ⬜ pending |
| TBD | import-commit | 2 | IMPORT-07 | T-33-DoS | `file.size > 2MB` → `code: 'validation'` | unit | `npm test -- --testPathPatterns="actions/import"` | ❌ W0 | ⬜ pending |
| TBD | queries-orders | 1 | (consumer contract for Phase 34) | — | `getProductionOrders(filters?)` shape | unit | `npm test -- --testPathPatterns="db/queries/orders"` | ❌ W0 | ⬜ pending |
| TBD | queries-events | 1 | (consumer contract for Phase 34) | — | `getOrderEvents(orderId)` ordering | unit | `npm test -- --testPathPatterns="db/queries/events"` | ❌ W0 | ⬜ pending |
| TBD | next-config | 1 | IMPORT-07 | T-33-DoS | `experimental.serverActions.bodySizeLimit: '2mb'` in `next.config.ts` | source-assert | `grep -q "bodySizeLimit.*2mb" next.config.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install read-excel-file` — dependency add; blocks all import action work
- [ ] `src/actions/__tests__/transitions.test.ts` — covers TRANS-01..07 (all states + conflict + revalidateTag mock)
- [ ] `src/actions/__tests__/import.test.ts` — covers Zod schema, intra-file duplicate detection, size guard, overwrite event shape
- [ ] `src/db/queries/__tests__/orders.test.ts` — covers `getProductionOrders` filter shapes
- [ ] `src/db/queries/__tests__/events.test.ts` — covers `getOrderEvents` ordering

**Mock strategy** (Phase 32 JSON-fixture pattern carried forward):

```typescript
jest.mock('@/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([{ state: 'Pending', id: 'order-1' }]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 'order-1' }]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock('@/lib/auth', () => ({ requireRole: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn().mockResolvedValue({ userId: 'u1' }) }));
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));
```

Conflict path: override `returning` → `mockResolvedValue([])` (empty array = stale-write detected).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real Neon dev DB end-to-end import of Book1.xlsx | IMPORT-01..06 | No CI Neon branch yet (same constraint as Phase 32); requires connected `.env.local` | Run `npm run dev`, sign in as `mill_operator`, exercise Phase 34 import form (when built) against dev DB, confirm rows appear in `production_orders` and one row in `import_batches`. Defer to Phase 34 demo. |
| Concurrent same-transition race (SC#2) | TRANS-06 | Requires two browser sessions or scripted concurrent calls against live DB | Two `mill_operator` sessions; both attempt `transitionToMixing(order, version)` simultaneously; exactly one returns `{ok:true}`, the other returns `{ok:false, code:'conflict', message:"Order was modified by another user. Please refresh."}`. Run in staging post-Phase-34. |
| `revalidateTag('production-orders')` cache-invalidation observed in browser | TRANS-07 | Requires Next.js running with `unstable_cache` consumer (Phase 34) | After any successful transition, the Phase 34 dashboard reflects new state without manual refresh. Defer to Phase 34 verify-phase. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter (after planner fills task IDs)

**Approval:** pending
