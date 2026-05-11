---
phase: 27
slug: role-assignment-and-testing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-11
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit) + @playwright/test (E2E) |
| **Config file** | `jest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern=src/lib/auth.test.ts` |
| **Full suite command** | `npm test && npm run e2e` |
| **Estimated runtime** | ~120 seconds (unit ~10s, E2E ~110s) |

---

## Sampling Rate

- **After every task commit:** Run unit tests touching changed files (e.g., `npm test -- src/lib/auth.test.ts`)
- **After every plan wave:** Run full unit suite (`npm test`)
- **Before `/gsd-verify-work`:** Full unit + E2E suite must be green
- **Max feedback latency:** 30 seconds (unit), 120 seconds (E2E)

---

## Per-Task Verification Map

> Populated during planning. One row per plan task with automated verification.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | ACCESS-02 | — | TBD | TBD | TBD | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/auth.test.ts` — TDD seed with skeleton tests for `checkRole` / `requireRole` (RED-phase placeholder for ACCESS-02)
- [ ] `e2e/fixtures/auth.ts` or `global.setup.ts` — Clerk `@clerk/testing` global setup scaffold
- [ ] `docs/clerk-setup.md` — Clerk Dashboard reproducibility doc skeleton

*Existing infrastructure (`jest.config.ts`, `playwright.config.ts`, `src/middleware.test.ts`) covers the rest.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clerk Dashboard JWT template configured with `{"metadata": {"role": "{{user.public_metadata.role}}"}}` | ACCESS-02 | Dashboard config not codified — Clerk UI step | Follow `docs/clerk-setup.md` — Sessions → Customize session token → paste JSON → Save |
| Three test users (`e2e-demo`, `e2e-norole`, `e2e-admin`) created with correct `publicMetadata.role` | ACCESS-02 | Manual Dashboard creation per D-12/D-13 | Follow `docs/clerk-setup.md` user table; verify each user's `publicMetadata` in Dashboard |
| UAT — sign in as each role, navigate `/demo/*` and `/settings`, confirm redirect/access matches D-11 scenarios | ACCESS-02 | Real-user felt-behavior confirmation per D-15 | UAT checklist in PLAN.md acceptance — 4 scenarios × 3 users |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (`--watch`, `--watchAll`, `--ui` MUST be absent)
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
