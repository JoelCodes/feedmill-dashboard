---
phase: 30
slug: close-gap-int-07-customerorderstab-href-summary-frontmatter
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 30 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Closure phase for v1.5 INT-07 blocker + documentation-lag tech debt.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest ^30.3.0 with `next/jest.js` integration |
| **Config file** | `jest.config.ts` (jsdom env, `@/` alias, `testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/']`) |
| **Quick run command** | `npm test -- --testPathPattern=CustomerOrdersTab` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5–10 seconds (full suite ≈30s; targeted test ~sub-second) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=CustomerOrdersTab` (plan 30-01 tasks) OR YAML parse + grep assertion on edited SUMMARY file (plan 30-02 tasks)
- **After every plan wave:** Run `npm test` full suite
- **Before `/gsd-verify-work`:** Full suite must be green AND repo-wide stale-href sweep `grep -rE "(^|[^/])/orders\\?selected=" src/` returns zero hits
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 30-01-01 | 01 | 0 | ROUTE-01 | — | N/A — pure routing fix; no auth/role surface change | unit (RED phase) | `npm test -- --testPathPattern=CustomerOrdersTab` exits non-zero (test must FAIL before source fix) | ❌ W0 (test file is new) | ⬜ pending |
| 30-01-02 | 01 | 0 | ROUTE-01 | — | Rendered `<a>` href for an order row matches `/demo/orders?selected=<order.id>` (not `/orders?selected=…`) | unit (GREEN phase) | `npm test -- --testPathPattern=CustomerOrdersTab` exits 0 | ✅ test from 30-01-01 | ⬜ pending |
| 30-02-01 | 02 | 0 | ROUTE-01 (docs) | — | `26-03-SUMMARY.md` frontmatter declares `requirements-completed:` containing `ROUTE-01` | docs lint | `grep -A 2 "^requirements-completed:" .planning/phases/26-route-restructuring-and-migration/26-03-SUMMARY.md \| grep -c "ROUTE-01"` returns ≥ 1 | ✅ file exists; field absent | ⬜ pending |
| 30-02-02 | 02 | 0 | ROLE-02 (docs) | — | `25-01-SUMMARY.md` frontmatter declares `requirements-completed:` containing `ROLE-02` AND `NAV-02` | docs lint | `grep -A 5 "^requirements-completed:" .planning/phases/25-foundation-and-middleware-configuration/25-01-SUMMARY.md \| grep -E "ROLE-02\|NAV-02" \| wc -l` returns 2 | ✅ file exists; field absent | ⬜ pending |
| 30-02-03 | 02 | 0 | NAV-01 (docs) | — | `26-01-SUMMARY.md` frontmatter declares `requirements-completed:` containing `NAV-01` | docs lint | `grep -A 2 "^requirements-completed:" .planning/phases/26-route-restructuring-and-migration/26-01-SUMMARY.md \| grep -c "NAV-01"` returns ≥ 1 | ✅ file exists; field absent | ⬜ pending |
| 30-02-04 | 02 | 0 | YAML validity (cross-cut) | — | All three edited SUMMARY frontmatters parse as valid YAML | yaml-parse | `node -e "const fs=require('fs'); const yaml=require('js-yaml'); const m=fs.readFileSync(F,'utf8').match(/^---\\n([\\s\\S]+?)\\n---/); yaml.load(m[1])"` per file exits 0 | js-yaml installed (verify by grep package.json) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/CustomerOrdersTab.test.tsx` — NEW FILE. Covers ROUTE-01 regression. Minimum content: one `it()` asserting `getByRole('link', …).toHaveAttribute('href', '/demo/orders?selected=<id>')` against an inline `Order[]` mock. Reuses `jest.mock('next/link', () => …)` MockLink pattern from `src/components/ui/Timeline.test.tsx:8-14`.
- [ ] No new framework install — Jest, next/jest, jsdom, @testing-library/react, jest-axe, and `toHaveAttribute` matcher all live and configured.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FLOW-07 end-to-end: demo user signs in → visits `/demo/customers/[id]` → opens Orders tab → clicks any order row → lands on `/demo/orders?selected=<id>` (not 404) | ROUTE-01 (FLOW-07) | E2E requires Clerk auth + dev server + manual browser interaction; covered structurally by the Jest assertion which proves the href shape | 1. `npm run dev`, 2. Sign in as demo user, 3. Navigate to any `/demo/customers/<id>`, 4. Click Orders tab, 5. Click any order row, 6. Verify URL is `/demo/orders?selected=<id>` and page renders (no 404) |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify (RED, GREEN, docs-lint, yaml-parse) — no `<manual>`-only tasks
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (this phase has 6 tasks, all with automated verify)
- [ ] Wave 0 covers the one MISSING test file (`src/components/__tests__/CustomerOrdersTab.test.tsx`)
- [ ] No watch-mode flags (`--watch`, `--watchAll` are forbidden in automated verify commands)
- [ ] Feedback latency < 30s (jest targeted run sub-second; full suite ~30s; grep/yaml assertions instant)
- [ ] `nyquist_compliant: true` set in frontmatter once all checkboxes above are satisfied

**Approval:** pending
