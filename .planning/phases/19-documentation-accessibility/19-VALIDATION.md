---
phase: 19
slug: documentation-accessibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-08
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- --testPathPattern="ui/"` |
| **Full suite command** | `npm test && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="ui/"`
- **After every plan wave:** Run `npm test && npm run lint`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 0 | DOC-03 | — | N/A | integration | `npm run lint` | ❌ W0 | ⬜ pending |
| 19-01-02 | 01 | 0 | DOC-03 | — | N/A | unit | `npm test -- --testPathPattern="Button"` | ✅ modify | ⬜ pending |
| 19-02-01 | 02 | 1 | DOC-01 | — | N/A | manual | `grep -c "^|" src/components/ui/README.md` | ❌ W1 | ⬜ pending |
| 19-03-01 | 03 | 2 | DOC-02 | — | N/A | manual | `grep "## Button\|## Card\|## Input" src/components/ui/README.md` | ❌ W2 | ⬜ pending |
| 19-04-01 | 04 | 2 | DOC-03 | — | N/A | unit | `npm test -- --testPathPattern="ui/.*\\.test\\.tsx"` | ✅ modify | ⬜ pending |
| 19-05-01 | 05 | 3 | DOC-03 | — | N/A | manual | VoiceOver checklist verification | ❌ W3 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `eslint-plugin-jsx-a11y@6.10.2` — install and configure in eslint.config.mjs
- [ ] `jest-axe@10.0.0` — install and extend expect() in jest.setup.ts
- [ ] `toHaveNoViolations` matcher — add to jest.setup.ts

*Wave 0 installs accessibility testing infrastructure before documentation work.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Token table completeness | DOC-01 | Counting tokens in CSS vs README is too simple for automation | `grep -c "^--" src/app/globals.css` should match README.md table row count |
| Component section structure | DOC-02 | Presence of sections is manual verification | Each component has ## heading, API, Variants, Usage, Do/Don't, Accessibility subsections |
| VoiceOver screen reader | DOC-03 | JSDOM can't run screen readers | Cmd+F5 to activate, test Button/Input/Select/ThemeToggle with state variations |
| Color contrast validation | DOC-03 | JSDOM can't compute CSS | Chrome DevTools > Accessibility panel for contrast ratios |

*Manual verifications documented per research: JSDOM limitation prevents color contrast and screen reader automation.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
