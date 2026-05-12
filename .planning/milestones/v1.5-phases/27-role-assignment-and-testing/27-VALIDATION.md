---
phase: 27
slug: role-assignment-and-testing
status: final
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-11
audited: 2026-05-12
---

# Phase 27 — Validation Strategy

> Per-phase validation contract. Phase delivered ACCESS-02 (role-based access control + E2E proof) across 5 plans, 3 waves. Audited 2026-05-12: all automated tasks COVERED; manual tasks are intentional (Clerk Dashboard config + D-15 UAT).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit) + @playwright/test 1.59.x with @clerk/testing 2.0.27 (E2E) |
| **Config file** | `jest.config.ts`, `playwright.config.ts` |
| **Unit quick run** | `npm test -- src/lib/auth.test.ts` / `npm test -- src/middleware.test.ts` |
| **E2E quick run** | `npx playwright test --project='demo-user' --project='norole-user' --project='chromium'` |
| **Full unit suite** | `npm test` |
| **Full E2E suite** | `npm run test:e2e` |
| **Estimated runtime** | unit ~10s · E2E ~110s |

---

## Sampling Rate

- **After every task commit:** Run unit tests touching changed files (e.g., `npm test -- src/lib/auth.test.ts`).
- **After every plan wave:** Run full unit suite (`npm test`).
- **Before `/gsd-verify-work`:** Full unit + E2E suite must be green.
- **Max feedback latency:** 30 s (unit), 120 s (E2E).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 27-01-T1 (RED) | 01 | 1 | ACCESS-02 | T-27-01..04 | Failing tests for `requireRole` exist before impl | unit | `npm test -- src/lib/auth.test.ts` | `src/lib/auth.test.ts` ✅ | ✅ green |
| 27-01-T2 (GREEN) | 01 | 1 | ACCESS-02 | T-27-01, T-27-03 | `requireRole(role)` redirects on missing userId / wrong role; resolves on match | unit | `npm test -- src/lib/auth.test.ts` | `src/lib/auth.ts` ✅ | ✅ green |
| 27-01-T3 (REFACTOR) | 01 | 1 | ACCESS-02 | — | JSDoc polish; no behavior change; full suite green | unit | `npm test` | `src/lib/auth.ts` ✅ | ✅ green |
| 27-02-T1 (RED) | 02 | 1 | ACCESS-02 | T-27-05..07 | Source-string suite fails against un-migrated middleware | unit | `npm test -- src/middleware.test.ts` | `src/middleware.test.ts` ✅ | ✅ green |
| 27-02-T2 (GREEN) | 02 | 1 | ACCESS-02 | T-27-05, T-27-07 | `src/middleware.ts` reads `sessionClaims.metadata.role`; no `clerkClient` | unit | `npm test -- src/middleware.test.ts` | `src/middleware.ts` ✅ | ✅ green |
| 27-02-T3 (regression) | 02 | 1 | ACCESS-02 | — | Full Jest suite green post-migration | unit | `npm test` | n/a | ✅ green |
| 27-03-T1 | 03 | 1 | ACCESS-02 | T-27-10 | Clerk Dashboard runbook with verbatim JWT template JSON | static-content | `grep -F '{"metadata": {"role": "{{user.public_metadata.role}}"}}' docs/clerk-setup.md` | `docs/clerk-setup.md` ✅ | ✅ green |
| 27-03-T2 | 03 | 1 | ACCESS-02 | T-27-09 | Six `E2E_*` env keys documented (passwords blank) | static-content | `grep -c "^E2E_" .env.example` returns `6` | `.env.example` ✅ | ✅ green |
| 27-03-T3 | 03 | 1 | ACCESS-02 | T-27-22 | `playwright/.clerk/` gitignored before Plan 05 ever runs | static-content | `git check-ignore -q playwright/.clerk/demo.json` | `.gitignore` ✅ | ✅ green |
| 27-04-T1 | 04 | 2 | ACCESS-02 | T-27-12..15 | Clerk Dashboard JWT template active + 3 test users + `.env.local` populated | manual | — (downstream proof via Plan 05 E2E + D-15 UAT) | (dashboard + `.env.local` operator-managed) | ⬜ manual-only |
| 27-05-T1 | 05 | 3 | ACCESS-02 | T-27-18 | `e2e/global.setup.ts` authenticates 3 roles serially via `@clerk/testing` | E2E setup | `npx playwright test --list \| grep 'authenticate'` (≥3 lines) | `e2e/global.setup.ts` ✅ | ✅ green |
| 27-05-T2 | 05 | 3 | ACCESS-02 | T-27-19 | `playwright.config.ts` declares `global setup`, `demo-user`, `norole-user`; chromium `testIgnore` anchored | E2E config | `npx playwright test --list` exits zero across 5 projects | `playwright.config.ts` ✅ | ✅ green |
| 27-05-T3 | 05 | 3 | ACCESS-02 | T-27-19 | Spec file split — PROT-03 in `-unauth.spec.ts` under chromium | E2E structure | `grep -F PROT-03 e2e/demo-route-protection.spec.ts` returns `0` | `e2e/demo-route-protection-unauth.spec.ts` ✅ | ✅ green |
| 27-05-T4 | 05 | 3 | ACCESS-02 | T-27-19 | 3 authenticated D-11 scenarios (#1 demo→/demo/*, #2 norole→/, #3 both→/settings); `.skip` removed | E2E | `npm run test:e2e` (demo-user + norole-user projects) | `e2e/demo-route-protection.spec.ts` ✅ | ✅ green |
| 27-05-T5 | 05 | 3 | ACCESS-02 | — | Full Playwright run green: 20 passed, 4 project-conditional skips | E2E | `npm run test:e2e` (or explicit `--project=` form) | n/a | ✅ green |
| 27-05-T6 | 05 | 3 | ACCESS-02 | T-27-20 | D-15 manual UAT — 11-row checklist across demo/norole/admin/unauth in real browser | manual | — (operator UAT against `npm run dev`) | n/a | ⬜ manual-only |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ⬜ manual-only*

---

## Wave 0 Requirements

- [x] `src/lib/auth.test.ts` — TDD seed authored as Plan 27-01 Task 1 (RED)
- [x] `e2e/global.setup.ts` — `@clerk/testing` Playwright global setup written in Plan 27-05 Task 1
- [x] `docs/clerk-setup.md` — Clerk Dashboard reproducibility runbook written in Plan 27-03 Task 1

*Existing infrastructure (`jest.config.ts`, `playwright.config.ts`, `src/middleware.test.ts`) covers the rest.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clerk Dashboard JWT template configured with `{"metadata": {"role": "{{user.public_metadata.role}}"}}` | ACCESS-02 | Dashboard config is not git-versioned; Clerk admin UI step (D-05) | Follow `docs/clerk-setup.md` Step 1 — Sessions → Customize session token → paste JSON → Save |
| Three test users (`e2e-demo`, `e2e-norole`, `e2e-admin`) created with correct `publicMetadata.role` | ACCESS-02 | Manual Dashboard creation per D-12 / D-13 (no backend-API seeding) | Follow `docs/clerk-setup.md` Step 2–3 user table; verify each user's `publicMetadata` in Dashboard |
| `.env.local` populated with six `E2E_*` keys (real passwords for dev-instance users) | ACCESS-02 | Operator-managed; gitignored — never enters repo | Per `docs/clerk-setup.md` Step 5; verify `grep -E '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_' .env.local` matches (dev instance) |
| JWT decode confirms `metadata.role` claim is populated post-sign-in | ACCESS-02 | Smoke check that template + role assignment + sign-in cycle is wired (RESEARCH Pitfall 1) | Sign in as `e2e-demo`, inspect `__session` cookie at jwt.io, payload contains `"metadata":{"role":"demo"}` |
| D-15 manual UAT — 11-row checklist across demo/norole/admin/unauth | ACCESS-02 | Felt-behavior confirmation; humans see redirect flashes E2E reporters can miss | UAT checklist in `27-05-PLAN.md` Task 6 — 11 rows; record any deviations in `27-05-SUMMARY.md` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify, or are intentional manual checkpoints with downstream automated proof
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (manual tasks 27-04-T1 and 27-05-T6 are followed/preceded by automated tasks)
- [x] Wave 0 covers all MISSING references (seed files all delivered)
- [x] No watch-mode flags (`--watch`, `--watchAll`, `--ui` MUST be absent — confirmed)
- [x] Feedback latency < 120 s (unit ~10 s, E2E ~110 s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved — 2026-05-12

---

## Validation Audit 2026-05-12

| Metric | Count |
|--------|-------|
| Tasks audited | 16 (across 5 plans) |
| COVERED (automated, green) | 14 |
| MANUAL-ONLY (intentional) | 2 (Plan 04-T1 entirely; Plan 05-T6 D-15 UAT) |
| Gaps found (MISSING) | 0 |
| Gaps found (PARTIAL) | 0 |
| Resolved by auditor | 0 (no spawn needed) |
| Escalated | 0 |

### Notes

- **Plan 01 historical drift (informational, not a gap):** Plan 27-01 originally authored 8 Jest cases (5 `checkRole` + 3 `requireRole`). Phase 29-05 commit `737289c` (INT-03 cleanup) removed the unused `checkRole` export and its 5 tests because no consumer ever imported it. The 3 `requireRole` cases remain green and exercise the surviving ACCESS-02 surface. The 27-01 plan/summary references to `checkRole` are stale by design — the cleanup was a deliberate downstream decision, not a regression. No corrective action required.
- **Plan 04 by design has zero automated verification at its own boundary** — it produces external state (Clerk Dashboard config + `.env.local`). The downstream automated proof is Plan 05's full E2E run: if the JWT template, users, or env are wrong, Plan 05 fails loudly with named error modes (RESEARCH §Pitfalls 1, 3, 4, 6).
- **Plan 05 Task 6 (D-15 UAT)** is intentionally manual per D-15 — felt-behavior confirmation that the E2E framework is not lying about redirect timing, flash-of-content, and post-Phase-26 page rendering.
- All assertions in this map were re-run live during the audit; no test was assumed green from prior summaries.
