---
phase: 23
slug: user-experience-integration
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-10
audited: 2026-05-10
re_audited: 2026-05-10
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 + @testing-library/react 16.3.2 |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- Header.test.tsx -x` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds (Header tests), ~30 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- Header.test.tsx -x`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 0 | — | — | N/A | unit | `npm test -- Header.test.tsx -x` | [x] | green |
| 23-01-02 | 01 | 1 | UX-01, UX-02, UX-03 | — | N/A | unit | `npm test -- Header.test.tsx` | [x] | green |
| 23-01-03 | 01 | 1 | AUTH-02 | — | Session invalidated on sign-out | unit | `npm test -- Header.test.tsx` | [x] | green |
| 23-01-04 | 01 | 1 | — | — | N/A | unit | `npm test -- Header.test.tsx` | [x] | green |
| 23-01-05 | 01 | 1 | — | — | N/A | unit | `npm test -- Header.test.tsx` | [x] | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `src/components/__tests__/Header.test.tsx` — 6 tests for UX-01, UX-02, UX-03, AUTH-02, HYDRATION, LOADING
  - [x] Mock `@clerk/nextjs` components (UserButton, ClerkLoading, ClerkLoaded)
  - [x] Test ClerkLoading renders fallback skeleton
  - [x] Test UserButton receives appearance prop
  - [x] Test UserButton.MenuItems contains signOut action
  - [x] Test skeleton has correct 32px circular dimensions

*All Wave 0 requirements satisfied. 17 tests pass (11 existing + 6 new UserButton tests).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Theme toggle reflects in UserButton | UX-03 | Visual verification needed | 1. Toggle theme via next-themes 2. Observe UserButton colors change |
| No layout shift when UserButton loads | — | CLS metric verification | 1. Hard refresh page 2. Observe header area for any shift |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready

---

## Validation Audit 2026-05-10

| Metric | Count |
|--------|-------|
| Tasks audited | 5 |
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Result:** All requirements have automated verification. Phase is Nyquist-compliant.

---

## Re-Audit 2026-05-10

| Metric | Count |
|--------|-------|
| Tasks re-audited | 5 |
| Requirements verified | 4 (UX-01, UX-02, UX-03, AUTH-02) |
| Test files verified | 1 (Header.test.tsx) |
| Tests passing | 17 |
| Gaps found | 0 |

**Verification Method:**
- Cross-referenced PLAN.md requirements with SUMMARY.md deliverables
- Confirmed test file exists with 6 UserButton integration tests
- Ran `npm test -- Header.test.tsx` — 17 tests pass
- Manual-only items remain appropriately scoped

**Result:** Phase 23 remains Nyquist-compliant. No remediation required.
