---
phase: 31
slug: role-expansion-and-db-infrastructure
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-12
updated: 2026-05-12
---

# Phase 31 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 30.x (unit), Playwright 1.59 (E2E), TypeScript `tsc --noEmit`, `next build` |
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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 31-01-01 | 01 | 1 | AUTH-01 | T-31-01-01 | `'mill_operator'` is a member of `Role` union; `requireRole('mill_operator')` test cases pass | unit | `npx tsc --noEmit && npm test -- --testPathPattern='auth\.test' --watchAll=false` | ✅ src/lib/auth.test.ts exists; src/types/clerk.d.ts exists | ⬜ pending |
| 31-01-02 | 01 | 1 | AUTH-01, AUTH-02 | T-31-01-03 | `checkRole(role: Role): Promise<boolean>` exported; 5 branches covered (true, false, no-metadata, multi-role, unauth) | unit (TDD) | `npm test -- --testPathPattern='auth\.test' --watchAll=false` | ❌ W0 src/lib/auth.test.ts checkRole block (must be written before src/lib/auth.ts edit) | ⬜ pending |
| 31-01-03 | 01 | 1 | AUTH-01 | T-31-01-04 | `mockMillOperatorSession()` and `mockDualRoleSession()` factories exist; 2 new fixture tests pass | unit (TDD) | `npm test -- --testPathPattern='clerkAuth\.test' --watchAll=false` | ✅ src/test/fixtures/clerkAuth.test.ts exists | ⬜ pending |
| 31-01-04 | 01 | 1 | AUTH-02, AUTH-03 | T-31-01-04 | REQUIREMENTS.md AUTH-02/03 rewritten per D-04/D-05; ROADMAP.md Phase 31 SC#2/SC#4 rewritten per D-15/D-16 | source-assert (grep) | `grep -cE 'Mutating server actions \\(Phase 33' .planning/REQUIREMENTS.md && grep -cE 'read-only mode \\(edit affordances hidden\\)' .planning/ROADMAP.md` | ✅ both files exist | ⬜ pending |
| 31-02-01 | 02 | 1 | DATA-01 | T-31-02-03 | drizzle-orm@0.45.2, @neondatabase/serverless@1.1.0, drizzle-kit@0.31.10 pinned exact | source-assert | `node -e "const p=require('./package.json'); if(p.dependencies['drizzle-orm']!=='0.45.2'\|\|p.dependencies['@neondatabase/serverless']!=='1.1.0'\|\|p.devDependencies['drizzle-kit']!=='0.31.10') process.exit(1)"` | ✅ package.json exists | ⬜ pending |
| 31-02-02 | 02 | 1 | DATA-08 | T-31-02-01, T-31-02-05 | `import 'server-only'` is exactly line 1 of src/db/index.ts; file exports `db`; no client-side imports | unit (source-assert TDD) | `npm test -- --testPathPattern='db/__tests__/index' --watchAll=false && npx tsc --noEmit` | ❌ W0 src/db/__tests__/index.test.ts (must be written before src/db/index.ts) | ⬜ pending |
| 31-02-03 | 02 | 1 | DATA-01 | T-31-02-02 | drizzle.config.ts at repo root; reads DATABASE_URL_UNPOOLED (NOT pooled); schema './src/db/schema.ts' | source-assert | `test -f drizzle.config.ts && grep -c "process.env.DATABASE_URL_UNPOOLED" drizzle.config.ts && grep -c "process.env.DATABASE_URL\\b" drizzle.config.ts \| grep -q '^0$' && npx tsc --noEmit` | ❌ W0 drizzle.config.ts (new file) | ⬜ pending |
| 31-02-04 | 02 | 1 | DATA-01 | T-31-02-03 | .env.example has DATABASE_URL, DATABASE_URL_UNPOOLED, E2E_MILL_OPERATOR_USER_{EMAIL,PASSWORD} placeholders; no secrets | source-assert (grep) | `grep -c "^DATABASE_URL=$" .env.example && grep -c "^DATABASE_URL_UNPOOLED=$" .env.example && grep -c "E2E_MILL_OPERATOR_USER_EMAIL" .env.example` | ✅ .env.example exists | ⬜ pending |
| 31-03-01 | 03 | 1 | AUTH-04 | — | auth-mill-operator Playwright project exists; e2e/global.setup.ts has 'mill-operator' entry; tsc clean | source-assert | `grep -c "auth-mill-operator" playwright.config.ts && grep -c "'mill-operator':" e2e/global.setup.ts && npx tsc --noEmit` | ✅ playwright.config.ts + e2e/global.setup.ts exist | ⬜ pending |
| 31-03-02 | 03 | 1 | AUTH-04 | T-31-03-04 | e2e/mill-operator-smoke.spec.ts exists; asserts data-mode='edit' on /; tsc clean | source-assert | `test -f e2e/mill-operator-smoke.spec.ts && grep -E "toHaveAttribute\\('data-mode', 'edit'\\)" e2e/mill-operator-smoke.spec.ts && npx tsc --noEmit` | ❌ W0 e2e/mill-operator-smoke.spec.ts (new file) | ⬜ pending |
| 31-03-03 | 03 | 1 | AUTH-04 | T-31-03-01, T-31-03-03 | docs/clerk-setup.md has new user row, dual-role JSON, propagation reminder, Phase 31 note | source-assert (grep) | `grep -c "e2e-mill-operator+clerk_test" docs/clerk-setup.md && grep -cE '\\["demo", "mill_operator"\\]' docs/clerk-setup.md && grep -c "Phase 31" docs/clerk-setup.md` | ✅ docs/clerk-setup.md exists | ⬜ pending |
| 31-04-01 | 04 | 2 | AUTH-02, AUTH-03 | T-31-04-03, T-31-04-04 | page.test.tsx covers 4 branches (unauth-redirect, read-only, edit, dual-role-edit); RED first | unit (TDD-RED) | `npm test -- --testPathPattern='app/page\.test' --watchAll=false` (expected: FAIL during RED) | ✅ src/app/page.test.tsx exists | ⬜ pending |
| 31-04-02 | 04 | 2 | AUTH-02 | T-31-04-02, T-31-04-05 | MillReadOnlyStub.tsx is 'use client' presentational; no checkRole/requireRole/@clerk imports | source-assert | `head -1 src/components/MillReadOnlyStub.tsx \| grep -q "'use client';" && grep -c "checkRole\|requireRole\|@clerk/nextjs" src/components/MillReadOnlyStub.tsx \| grep -q '^0$' && npx tsc --noEmit` | ❌ W0 src/components/MillReadOnlyStub.tsx (new file) | ⬜ pending |
| 31-04-03 | 04 | 2 | AUTH-02, AUTH-03 | T-31-04-03 | page.tsx is async RSC with await auth() + checkRole; no requireRole; <MillReadOnlyStub canEdit> wired; 4 tests pass (GREEN) | unit (TDD-GREEN) | `npm test -- --testPathPattern='app/page\.test' --watchAll=false && npx tsc --noEmit` | ✅ src/app/page.tsx exists | ⬜ pending |
| 31-05-01 | 05 | 3 | DATA-01 | T-31-05-01 | Neon project provisioned; .env.local has pooled + unpooled URLs | manual + env-check | `node -e "require('dotenv').config({path:'.env.local'}); if(!process.env.DATABASE_URL\|\|!process.env.DATABASE_URL_UNPOOLED) process.exit(1)"` | ⚠️ operator runbook | ⬜ pending |
| 31-05-02 | 05 | 3 | AUTH-04 | T-31-05-02, T-31-05-03 | Clerk Dashboard has new mill_operator user + updated demo user; E2E_MILL_OPERATOR_USER_PASSWORD set | manual + JWT decode | (manual — operator confirms via jwt.io decode + browser smoke per docs/clerk-setup.md) | ⚠️ operator runbook | ⬜ pending |
| 31-05-03 | 05 | 3 | AUTH-04 | — | CI secrets decision recorded (added via gh CLI or deferred with rationale) | manual decision | `ls .github/workflows/ 2>/dev/null \|\| echo "no CI yet"` (informs decision) | ⚠️ operator decision | ⬜ pending |
| 31-05-04 | 05 | 3 | DATA-01, AUTH-04 | T-31-05-06 | Pre-gate sanity check: all 4 Phase-31 .env.local keys set; Clerk keys preserved; .env.local gitignored | env-check | `node -e "require('dotenv').config({path:'.env.local'}); const k=['DATABASE_URL','DATABASE_URL_UNPOOLED','E2E_MILL_OPERATOR_USER_EMAIL','E2E_MILL_OPERATOR_USER_PASSWORD','NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY','CLERK_SECRET_KEY']; if(k.some(x=>!process.env[x])) process.exit(1)"` | ✅ .env.local populated by 31-05-01 + 31-05-02 | ⬜ pending |
| 31-05-05 | 05 | 3 | ALL (AUTH-01..04, DATA-01, DATA-08) | T-31-05-04 | Canonical verification gate: tsc + jest + build (no Edge contamination) + playwright auth-mill-operator | smoke (build + e2e) | `npx tsc --noEmit && npm test -- --watchAll=false && (npm run build 2>&1 \| tee /tmp/phase31-build.log; ! grep -qE "Module not found: Can't resolve 'fs'\\|Edge runtime does not support\\|cannot be imported from a Client Component" /tmp/phase31-build.log) && npx playwright test --project=auth-mill-operator` | ✅ all infra from Plans 31-01..04 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/lib/__tests__/auth.test.ts` — extended in Plan 31-01 Task 1 + Task 2 for `'mill_operator'` requireRole cases AND new checkRole describe block (5 cases) — TDD pattern from Phase 27
- [x] `src/test/fixtures/clerkAuth.test.ts` — extended in Plan 31-01 Task 3 for mockMillOperatorSession + mockDualRoleSession factories (2 new cases)
- [x] `src/app/page.test.tsx` — REWRITTEN in Plan 31-04 Task 1 covering 4 behavior branches (RESEARCH Open Q1 recommendation: fold canEdit branch coverage into page.test.tsx, not a separate MillReadOnlyStub.test.tsx)
- [x] `src/db/__tests__/index.test.ts` — NEW file in Plan 31-02 Task 2; source-string assertion for line-1 `import 'server-only';` + 4 negative assertions (no client imports)
- [x] `e2e/mill-operator-smoke.spec.ts` — NEW file in Plan 31-03 Task 2; asserts data-mode='edit' on / for mill_operator user
- [x] `drizzle-orm`, `@neondatabase/serverless` deps; `drizzle-kit` devDep — installed in Plan 31-02 Task 1

*Wave 0 is install + fixture extension only — no new framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clerk Dashboard test users created and roles set | AUTH-04 | Clerk Dashboard UI / API, not in repo | Per `docs/clerk-setup.md` Step 3 update (Plan 31-03 Task 3 lands the runbook diff): create `e2e-mill-operator+clerk_test@example.com`, set `publicMetadata.roles: ['mill_operator']`; update `e2e-demo+clerk_test@example.com` to `roles: ['demo','mill_operator']`. Plan 31-05 Task 2 is the operator checkpoint. |
| JWT template includes `roles` claim | AUTH-04 | Clerk Dashboard config | Manual decode of a fresh JWT for the new user via jwt.io; confirm `metadata.roles` array present. Plan 31-05 Task 2 Step 8 covers this. |
| Neon project provisioned + pooled/unpooled URLs in `.env.local` | DATA-01, DATA-08 | One-time provisioning at neon.tech | Per CONTEXT.md D-06: create `cgm-dashboard` Neon project; copy connection strings into `.env.local`. Plan 31-05 Task 1 is the operator checkpoint. |
| GitHub Actions secrets for E2E_MILL_OPERATOR_* (optional) | AUTH-04 (deferred per Open Q4) | GitHub Actions secrets via `gh secret set` | Plan 31-05 Task 3 is the decision checkpoint — operator selects option-add (gh CLI invocation) or option-defer (no CI exists yet). |

---

## Coverage Map (decisions → verification artifacts)

Per RESEARCH.md §"Validation Architecture", every CONTEXT.md decision (D-01..D-17) must be observable in at least one verification artifact. Mapping:

| Decision Group | Coverage Path | Plan/Task |
|----------------|---------------|-----------|
| D-01 (mill_operator is edit role, not page-gate) | page.test.tsx Test 2 (non-operator reaches `/` without redirect, sees read-only); negative grep `requireRole` in page.tsx | 31-04 Tasks 1+3 |
| D-02 (auth gate only on `/`) | page.tsx contains `redirect('/sign-in')` AND no `requireRole('mill_operator')` (negative grep) | 31-04 Task 3 |
| D-03 (canEdit boolean prop) | <MillReadOnlyStub canEdit={canEdit} /> in page.tsx; canEdit in MillReadOnlyStub.tsx; no checkRole inside the stub (negative grep) | 31-04 Tasks 2+3 |
| D-04 (server actions enforce in Phase 33) | REQUIREMENTS.md AUTH-02 rewritten — text contains "Mutating server actions"; out-of-phase verification | 31-01 Task 4 (text only; runtime in Phase 33) |
| D-05 (no middleware coarse-gate on /) | src/middleware.ts UNCHANGED (no isMillOperatorRoute matcher); existing middleware.test.ts assertions still pass | (verified by absence of edit in any plan's files_modified) |
| D-06 (fresh Neon project, local only) | Plan 31-05 Task 1 operator runbook + .env.local population (manual) | 31-05 Task 1 |
| D-07 (pooled vs unpooled URL split) | .env.example has both keys; manual verification of hostname `-pooler` presence in DATABASE_URL only | 31-02 Task 4 + 31-05 Task 1 |
| D-08 (drizzle.config.ts reads UNPOOLED) | source-assert: grep DATABASE_URL_UNPOOLED in drizzle.config.ts; negative grep `DATABASE_URL\b` (alone) | 31-02 Task 3 |
| D-09 (single schema.ts placeholder file) | src/db/schema.ts exists; `ls src/db/schema/` fails (no directory) | 31-02 Task 2 |
| D-10 (server-only line 1) | src/db/__tests__/index.test.ts asserts `lines[0] === "import 'server-only';"` | 31-02 Task 2 |
| D-11 (drizzle.config.ts at repo root) | `ls drizzle.config.ts` succeeds at repo root; `ls src/drizzle.config.ts` fails | 31-02 Task 3 |
| D-12 (new mill_operator user) | docs/clerk-setup.md Step 2 table contains `e2e-mill-operator+clerk_test@example.com`; operator confirms via Clerk Dashboard + JWT decode | 31-03 Task 3 + 31-05 Task 2 |
| D-13 (demo user dual-role) | docs/clerk-setup.md Step 3 has `["demo", "mill_operator"]` JSON; page.test.tsx Test 4 covers dual-role; operator confirms via JWT decode | 31-01 Task 3 (fixture) + 31-03 Task 3 (runbook) + 31-04 Task 1 (Test 4) + 31-05 Task 2 (operator) |
| D-14 (Playwright project + env vars) | playwright.config.ts has auth-mill-operator entry; .env.example has E2E_MILL_OPERATOR_USER_{EMAIL,PASSWORD}; smoke spec runs under the project | 31-02 Task 4 (env keys) + 31-03 Task 1 (project) + 31-05 Task 5 (smoke run) |
| D-15 (ROADMAP SC#2 rewrite) | grep "read-only mode (edit affordances hidden)" in ROADMAP.md | 31-01 Task 4 |
| D-16 (ROADMAP SC#4 rewrite) | grep "Vercel env-var provisioning deferred to Phase 34" in ROADMAP.md; absence of "set in Vercel env" claim | 31-01 Task 4 |
| D-17 (REQUIREMENTS AUTH-02/03 rewrite) | grep "Mutating server actions" in REQUIREMENTS.md; absence of "enforced at the page level" | 31-01 Task 4 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (Wave 0 gaps marked with ❌ above are scheduled in the corresponding plan)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (the only manual-only tasks are 31-05-01 / 31-05-02 / 31-05-03 — the three checkpoints — and they are followed by 31-05-04 (env-check) and 31-05-05 (full smoke))
- [x] Wave 0 covers all MISSING references (4 new test/source files: src/db/__tests__/index.test.ts, src/components/MillReadOnlyStub.tsx, drizzle.config.ts, e2e/mill-operator-smoke.spec.ts)
- [x] No watch-mode flags (every command uses `--watchAll=false` or is one-shot)
- [x] Feedback latency < 120s (quick run < 5s; full suite ~30-60s; build smoke ~30-90s; playwright smoke ~10-30s)
- [x] `npm run build` (Edge-runtime contamination smoke) included in the final verification wave (Plan 31-05 Task 5 Step 3)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready

---

*Last updated: 2026-05-12 — Per-Task Verification Map populated by planner for 18 tasks across 5 plans.*
