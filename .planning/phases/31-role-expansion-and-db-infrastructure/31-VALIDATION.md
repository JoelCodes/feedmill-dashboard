---
phase: 31
slug: role-expansion-and-db-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 31 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit), Playwright (E2E), TypeScript `tsc --noEmit`, `next build` |
| **Config file** | `jest.config.ts`, `playwright.config.ts`, `tsconfig.json` |
| **Quick run command** | `npm test -- --testPathPattern '<file>' --watchAll=false` |
| **Full suite command** | `npx tsc --noEmit && npm test -- --watchAll=false && npm run build` |
| **Estimated runtime** | ~60–120 seconds (build dominates) |

---

## Sampling Rate

- **After every task commit:** Run quick command targeting the file under change
- **After every plan wave:** Run `npx tsc --noEmit && npm test -- --watchAll=false`
- **Before `/gsd-verify-work`:** Full suite must be green INCLUDING `npm run build` (the canonical "no Edge-runtime contamination" smoke check per CONTEXT.md §specifics)
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

> Populated by the planner. The planner MUST add one row per task, marking TDD-eligible tasks (role-membership checks, validation logic) with `unit` and infrastructure tasks (env files, config files, runbook) with `build` or `manual`.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 31-XX-XX | XX | X | REQ-XX | T-31-XX / — | {expected} | unit/e2e/build | `{command}` | ✅ / ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/auth.test.ts` — extend existing suite for `'mill_operator'` role membership cases (or add `Role` union compile-time assertion test) — TDD pattern from Phase 27
- [ ] `src/test/fixtures/clerkAuth.ts` — extend factory for mill-operator-only and dual-role demo+mill_operator users
- [ ] `src/app/page.test.tsx` OR `src/components/__tests__/MillReadOnlyStub.test.tsx` — canEdit branch coverage (planner decides; per RESEARCH.md Open Question 1)
- [ ] `drizzle-orm`, `@neondatabase/serverless` deps; `drizzle-kit`, `dotenv` devDeps installed via `npm install`

*Wave 0 is install + fixture extension only — no new framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clerk Dashboard test users created and roles set | AUTH-04 | Clerk Dashboard UI / API, not in repo | Per `docs/clerk-setup.md` Step 3 update: create `e2e-mill-operator+clerk_test@example.com`, set `publicMetadata.roles: ['mill_operator']`; update `e2e-demo+clerk_test@example.com` to `roles: ['demo','mill_operator']` |
| JWT template includes `roles` claim | AUTH-04 | Clerk Dashboard config | Manual decode of a fresh JWT for the new user via clerk.com/jwks or jwt.io; confirm `metadata.roles` array present |
| Neon project provisioned + pooled/unpooled URLs in `.env.local` | DATA-01, DATA-08 | One-time provisioning at neon.tech | Per CONTEXT.md D-06: create `cgm-dashboard` Neon project; copy connection strings into `.env.local` |
| Vercel `auth-mill-operator` E2E secrets | AUTH-04 (deferred) | GitHub Actions secrets via `gh secret set` | If `.github/workflows/` exists, add `E2E_MILL_OPERATOR_USER_EMAIL` and `E2E_MILL_OPERATOR_USER_PASSWORD` (per RESEARCH.md Open Question 4) |

---

## Coverage Map (decisions → verification artifacts)

Per RESEARCH.md §"Validation Architecture", every CONTEXT.md decision (D-01..D-17) must be observable in at least one verification artifact. Planner-completed mapping must achieve:

| Decision Group | Coverage |
|----------------|----------|
| D-01..D-05 (enforcement model) | Unit test on `requireRole`/`checkRole` + page test on canEdit prop branch |
| D-06..D-08 (Neon provisioning) | `.env.example` source assertion + `drizzle.config.ts` source assertion (string match `DATABASE_URL_UNPOOLED`) |
| D-09..D-11 (Drizzle file layout) | Source assertion line 1 of `src/db/index.ts` == `import 'server-only'`; `drizzle.config.ts` at repo root |
| D-12..D-14 (test fixtures) | Fixture factory unit test + Playwright `auth-mill-operator` project smoke test |
| D-15..D-17 (criteria amendments) | ROADMAP.md + REQUIREMENTS.md diff present in same PR (source assertion) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `npm run build` (Edge-runtime contamination smoke) included in the final verification wave
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
