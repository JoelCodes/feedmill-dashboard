---
phase: 23
slug: user-experience-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
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
| 23-01-01 | 01 | 0 | — | — | N/A | unit | `npm test -- Header.test.tsx -x` | ❌ W0 | ⬜ pending |
| 23-01-02 | 01 | 1 | UX-01, UX-02, UX-03 | — | N/A | unit | `npm test -- Header.test.tsx::user-button -x` | ❌ W0 | ⬜ pending |
| 23-01-03 | 01 | 1 | AUTH-02 | — | Session invalidated on sign-out | unit | `npm test -- Header.test.tsx::sign-out -x` | ❌ W0 | ⬜ pending |
| 23-01-04 | 01 | 1 | — | — | N/A | unit | `npm test -- Header.test.tsx::skeleton -x` | ❌ W0 | ⬜ pending |
| 23-01-05 | 01 | 1 | — | — | N/A | unit | `npm test -- Header.test.tsx::hydration -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/Header.test.tsx` — stubs for UX-01, UX-02, UX-03, AUTH-02, HYDRATION, LOADING
  - Mock `@clerk/nextjs` components (UserButton, ClerkLoaded) following existing pattern from `sign-in/__tests__/page.test.tsx`
  - Test ClerkLoaded renders fallback skeleton
  - Test UserButton receives correct props (appearance, afterSignOutUrl)
  - Test UserButton.MenuItems contains only signOut action
  - Test no hydration warnings in console

*Existing test infrastructure covers all requirements. No framework installation needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Theme toggle reflects in UserButton | UX-03 | Visual verification needed | 1. Toggle theme via next-themes 2. Observe UserButton colors change |
| No layout shift when UserButton loads | — | CLS metric verification | 1. Hard refresh page 2. Observe header area for any shift |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
