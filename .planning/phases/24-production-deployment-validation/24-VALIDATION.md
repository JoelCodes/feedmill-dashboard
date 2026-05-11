---
phase: 24
slug: production-deployment-validation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright + vitest |
| **Config file** | `playwright.config.ts`, `vitest.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test:e2e` |
| **Estimated runtime** | ~30 seconds (local) / ~60 seconds (CI against production) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test:e2e`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | SC-01: Live keys | — | N/A (config) | manual | N/A | — | ⬜ pending |
| 24-01-02 | 01 | 1 | SC-02: Domain assoc | — | N/A (config) | manual | N/A | — | ⬜ pending |
| 24-02-01 | 02 | 2 | SC-03: Sign-in works | — | Auth flow completes | e2e | `npx playwright test tests/e2e/prod-smoke.spec.ts` | ❌ W0 | ⬜ pending |
| 24-02-02 | 02 | 2 | SC-04: Clerk events | — | N/A (observability) | manual | N/A | — | ⬜ pending |
| 24-02-03 | 02 | 2 | SC-05: No key errors | — | N/A (observability) | manual | N/A | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/prod-smoke.spec.ts` — production smoke test for sign-in flow
- [ ] `.github/workflows/prod-smoke.yml` — GitHub Actions workflow for post-deploy validation

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live keys configured in Vercel | SC-01 | Dashboard config, no API access | Check Vercel > Project Settings > Environment Variables for pk_live_/sk_live_ |
| Domain added to Clerk | SC-02 | Clerk Dashboard config | Check Clerk > Production > Domains for Vercel subdomain |
| Clerk Dashboard shows events | SC-04 | Clerk Dashboard observability | Check Clerk > Logs for production domain activity |
| No key errors in Vercel logs | SC-05 | Log inspection | Check Vercel > Deployments > Functions logs for errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
