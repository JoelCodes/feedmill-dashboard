---
phase: 36
slug: close-gap-build-01-void-cast-phase-35-verification
status: passthrough
references: ../35-kpi-sections-and-role-specific-metrics/35-UI-SPEC.md
created: 2026-05-15
---

# Phase 36 — UI Design Contract (passthrough)

Phase 36 introduces **no new UI**. Its scope is:

1. A type-only one-line fix at `src/components/BlockedAlertBand.tsx:44` (add `void` cast on `nuqs setQuery` inside `startTransition`). No visual or behavioral change — the component already renders correctly; the fix unblocks the production TypeScript build.
2. Authoring `35-VERIFICATION.md` and `35-UAT.md` (verification artifacts for Phase 35).
3. Re-classifying `35-VALIDATION.md` from `draft` → `complete`.

**Authoritative UI design contract for any UAT work in this phase:**
`.planning/phases/35-kpi-sections-and-role-specific-metrics/35-UI-SPEC.md`

That spec covers:
- KPI strip layout (KPI-01, KPI-02, KPI-04, KPI-05)
- 7-day trend chart geometry (KPI-06)
- BlockedExceptionList row format + overdue badge (KPI-07, KPI-08)
- BlockedAlertBand placement and a11y (PROD-06, the component touched by BUILD-01)
- Tz cookie flow visual surface (KPI-01, KPI-06)

The Phase 36 UAT in `35-UAT.md` will measure observed dashboard behavior against
**that** spec. Phase 36 does not extend, refine, or supersede any part of it.
