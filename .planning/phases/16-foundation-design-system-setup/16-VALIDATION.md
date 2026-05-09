---
phase: 16
slug: foundation-design-system-setup
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-07
validated: 2026-05-09
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 + React Testing Library 16.3.2 |
| **Config file** | jest.config.js |
| **Quick run command** | `npm test -- design-system` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- design-system`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 0 | FOUND-01 | — | N/A | unit | `npm test -- tokens.test` | ✅ | ✅ green |
| 16-01-02 | 01 | 1 | FOUND-01 | — | N/A | unit | `npm test -- tokens.test` | ✅ | ✅ green |
| 16-02-01 | 02 | 1 | FOUND-02 | — | N/A | integration | `npm test -- theme.test` | ✅ | ✅ green |
| 16-02-02 | 02 | 1 | FOUND-02 | — | N/A | integration | `npm test -- theme.test` | ✅ | ✅ green |
| 16-03-01 | 03 | 1 | FOUND-03 | — | N/A | unit | `npm test -- utils.test` | ✅ | ✅ green |
| 16-04-01 | 04 | 2 | FOUND-04 | — | N/A | unit | `npm run lint` | N/A | ✅ green |
| 16-05-01 | 05 | 2 | DES-01 | — | N/A | manual | Visual inspection in Pencil | N/A | ✅ verified |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/__tests__/design-system/tokens.test.ts` — token definitions verify CSS custom properties (19 tests passing)
- [x] `src/__tests__/design-system/theme.test.tsx` — ThemeProvider flash prevention, persistence (8 tests passing)
- [x] `src/lib/utils.test.ts` — cn() utility merging behavior (11 tests passing)
- [x] `eslint-rules/no-hardcoded-values.eslint-test.js` — hardcoded value detection (13 tests via ESLint RuleTester)

*Test infrastructure already installed (Jest 30.3.0 + RTL 16.3.2).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Theme switches without flash | FOUND-02 | Visual timing verification | Toggle theme 10x, observe for flash |
| Dark mode colors readable | FOUND-02 | Visual contrast verification | Check all text against dark backgrounds |
| Component library .pen structure | DES-01 | Design file organization | Open file, verify token sync |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s (runtime: ~0.4s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved

---

## Validation Audit 2026-05-09

| Metric | Count |
|--------|-------|
| Gaps found | 2 |
| Resolved | 2 |
| Escalated | 0 |

**Tests created:**
- `src/__tests__/design-system/tokens.test.ts` — 19 tests for CSS token definitions
- `src/__tests__/design-system/theme.test.tsx` — 8 tests for ThemeProvider configuration

**Total automated coverage:** 27 design-system tests + 11 utils tests + 13 ESLint rule tests = 51 tests
