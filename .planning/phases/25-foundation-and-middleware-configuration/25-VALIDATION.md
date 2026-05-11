---
phase: 25
slug: foundation-and-middleware-configuration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 + Testing Library 16.3.2 (unit), Playwright 1.59.1 (E2E) |
| **Config file** | jest.config.ts (unit), playwright.config.ts (E2E) |
| **Quick run command** | `npm test -- --testPathPattern=middleware` |
| **Full suite command** | `npm test && npm run test:e2e` |
| **Estimated runtime** | ~35 seconds (20s unit + 15s E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=middleware`
- **After every plan wave:** Run `npm test` (full unit suite)
- **Before `/gsd-verify-work`:** Full suite must be green (`npm test && npm run test:e2e`)
- **Max feedback latency:** 35 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | ROLE-02 | — | N/A (type definitions) | build | `npm run build` | ✅ | ⬜ pending |
| 25-02-01 | 02 | 1 | ACCESS-01 | T-25-01 | User without demo role redirected to / | unit | `npm test -- src/middleware.test.ts` | ❌ W0 | ⬜ pending |
| 25-02-02 | 02 | 1 | ACCESS-01 | T-25-01 | Demo route protection end-to-end | e2e | `npm run test:e2e -- --grep "demo route"` | ❌ W0 | ⬜ pending |
| 25-03-01 | 03 | 1 | NAV-02 | — | DashboardLayout renders Sidebar + Header + children | unit | `npm test -- DashboardLayout.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/middleware.test.ts` — middleware role check logic unit tests (ACCESS-01)
- [ ] `src/components/DashboardLayout.test.tsx` — layout structure tests (NAV-02)
- [ ] `e2e/demo-route-protection.spec.ts` — E2E test for demo route access control (ACCESS-01)

*Existing infrastructure covers Jest + Playwright setup. E2E auth helpers exist in `e2e/route-protection.spec.ts`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| publicMetadata.role included in session token | ROLE-01 | Clerk Dashboard configuration is external | 1. Configure session token in Dashboard 2. Sign in as test user 3. Add console.log in middleware for sessionClaims 4. Verify metadata.role present |
| TypeScript autocomplete for role field | ROLE-02 | Compile-time types have no runtime | 1. Open middleware.ts in VSCode 2. Hover over `sessionClaims.metadata.role` 3. Verify tooltip shows `role?: Role` |

---

## Security Threat Model

| Threat ID | STRIDE | Attack | Mitigation | Verified By |
|-----------|--------|--------|------------|-------------|
| T-25-01 | Tampering | User modifies client-side role check to bypass protection | Middleware enforces role check on edge before page render | E2E test: user without role cannot access /demo/* |
| T-25-02 | Elevation of Privilege | User assigns self 'demo' role | publicMetadata read-only from client, requires Clerk Backend API | Architecture (no mitigation task needed) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 35s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
