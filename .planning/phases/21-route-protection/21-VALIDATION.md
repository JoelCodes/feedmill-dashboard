---
phase: 21
slug: route-protection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-09
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.59.1 |
| **Config file** | playwright.config.ts (none — Wave 0 creates) |
| **Quick run command** | `npx playwright test --project=chromium` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --project=chromium`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 0 | — | — | N/A | setup | `npm install -D @playwright/test playwright @clerk/testing` | ❌ W0 | ⬜ pending |
| 21-01-02 | 01 | 1 | PROT-01 | — | Unauthenticated users redirected to /sign-in | E2E | `npx playwright test e2e/route-protection.spec.ts -g "redirects to sign-in"` | ❌ W0 | ⬜ pending |
| 21-01-03 | 01 | 1 | PROT-02 | — | All dashboard pages require authentication | E2E | `npx playwright test e2e/route-protection.spec.ts -g "protected routes"` | ❌ W0 | ⬜ pending |
| 21-01-04 | 01 | 1 | — | — | Return URL preserved after redirect | E2E | `npx playwright test e2e/route-protection.spec.ts -g "returnBackUrl"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `playwright.config.ts` — Playwright config with baseURL, testDir, webServer
- [ ] `e2e/route-protection.spec.ts` — Tests for PROT-01, PROT-02, return URL
- [ ] `.gitignore` updates — Add test-results/, playwright-report/, playwright/.auth/
- [ ] `package.json` scripts — test:e2e, test:e2e:ui, test:e2e:debug
- [ ] Framework install: `npm install -D @playwright/test playwright @clerk/testing && npx playwright install chromium`

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
