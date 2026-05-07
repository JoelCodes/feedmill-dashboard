---
phase: 16
slug: foundation-design-system-setup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 + React Testing Library 16.3.2 |
| **Config file** | jest.config.js |
| **Quick run command** | `npm test -- --testPathPattern="design-system"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="design-system"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 0 | FOUND-01 | — | N/A | unit | `npm test -- tokens.test` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | FOUND-01 | — | N/A | unit | `npm test -- tokens.test` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 1 | FOUND-02 | — | N/A | integration | `npm test -- theme.test` | ❌ W0 | ⬜ pending |
| 16-02-02 | 02 | 1 | FOUND-02 | — | N/A | integration | `npm test -- theme.test` | ❌ W0 | ⬜ pending |
| 16-03-01 | 03 | 1 | FOUND-03 | — | N/A | unit | `npm test -- utils.test` | ❌ W0 | ⬜ pending |
| 16-04-01 | 04 | 2 | FOUND-04 | — | N/A | unit | `npm run lint` | N/A | ⬜ pending |
| 16-05-01 | 05 | 2 | DES-01 | — | N/A | manual | Visual inspection in Pencil | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/design-system/tokens.test.ts` — token definitions verify CSS custom properties
- [ ] `src/__tests__/design-system/theme.test.tsx` — ThemeProvider flash prevention, persistence
- [ ] `src/__tests__/design-system/utils.test.ts` — cn() utility merging behavior
- [ ] `src/__tests__/design-system/eslint-rule.test.ts` — hardcoded value detection

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
