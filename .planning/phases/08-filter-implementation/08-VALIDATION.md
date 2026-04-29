---
phase: 08
slug: filter-implementation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-29
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (Wave 0 installs) |
| **Config file** | vitest.config.mts (Wave 0 creates) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | FILTR-01 | — | N/A | unit | `npm test -- FilterPill.test.tsx` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | FILTR-01 | — | N/A | unit | grep for import | ✅ inline | ⬜ pending |
| 08-02-01 | 02 | 2 | FILTR-02, FILTR-03, FILTR-04, FILTR-05 | — | N/A | unit | grep for useState/useMemo | ✅ inline | ⬜ pending |
| 08-02-02 | 02 | 2 | FILTR-01, FILTR-02, FILTR-03 | — | N/A | unit | grep for FilterPill usage | ✅ inline | ⬜ pending |
| 08-02-03 | 02 | 2 | all | — | N/A | manual | browser verification | ✅ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom happy-dom vite-tsconfig-paths` — test infrastructure
- [ ] `vitest.config.mts` — Vitest config with React plugin
- [ ] `vitest.setup.ts` — testing-library/jest-dom setup
- [ ] `src/components/FilterPill.test.tsx` — FilterPill component tests

*Note: Wave 0 is OPTIONAL for this phase. Plans use TDD pattern with inline test creation (08-01-T1). Test infrastructure will be bootstrapped as part of the first plan execution if not already present.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Filter pills visible above columns | FILTR-01 | Visual layout | Open /mill-production, verify pills render horizontally above mill columns |
| Cards hide when filtered | FILTR-02, FILTR-03 | Visual behavior | Click filter pill, verify only matching cards remain visible |
| Count badges static | FILTR-04 | Visual verification | Toggle filters, verify count numbers don't change |
| Default shows all | FILTR-05 | Visual verification | Refresh page, verify all cards visible with no pills selected |

*Note: Human verification checkpoint in 08-02-T3 covers these manual verifications.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
