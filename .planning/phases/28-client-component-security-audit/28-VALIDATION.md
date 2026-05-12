---
phase: 28
slug: client-component-security-audit
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-11
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest (existing) — see `jest.config.*` |
| **Config file** | `jest.config.ts` / `jest.config.js` (detect at Wave 0) |
| **Quick run command** | `npm test -- --testPathPattern="(demo|auth|protect)" --runInBand` |
| **Full suite command** | `npm test -- --runInBand` |
| **Estimated runtime** | ~30–60 seconds (quick); ~3–5 min (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="<files-touched>" --runInBand`
- **After every plan wave:** Run `npm test -- --runInBand`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~60 seconds (quick run)

---

## Per-Task Verification Map

> *To be filled by planner. Each task in PLAN.md gets a row with concrete command + expected pass.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD-by-planner | — | — | (no REQ — security audit) | — | — | — | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Confirm `@clerk/nextjs/server` jest mock pattern from `src/lib/auth.test.ts` is reusable for page/RSC tests
- [ ] Verify async-RSC-as-function harness works for `/demo/*/page.tsx` (see RESEARCH A2)
- [ ] If async-RSC tests are flaky, fall back to E2E (Playwright) — flag in planning

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Non-demo user redirected from `/demo/*` to `/` | Success Criterion 3 | Cross-network redirect chain — easier as smoke test | Sign in as user without `demo` role, visit `/demo/orders`, expect redirect to `/` |
| Demo user sees all `/demo/*` pages without flash of unauthorized content | Success Criterion 1 | RSC streaming behavior best verified visually | Sign in as demo user, navigate to each `/demo/*` page, confirm no flicker |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
