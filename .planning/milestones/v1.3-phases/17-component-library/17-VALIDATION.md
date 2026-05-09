# Phase 17: Component Library — Validation Strategy

**Phase:** 17-component-library
**Created:** 2026-05-07

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + Testing Library |
| Config file | `jest.config.ts` + `jest.setup.ts` |
| Quick run command | `npm test -- --testPathPattern=Button` |
| Full suite command | `npm test` |

## Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| COMP-01 | Button renders with correct variant classes | unit | `npm test -- Button.test.tsx` |
| COMP-01 | Button applies correct size classes | unit | `npm test -- Button.test.tsx` |
| COMP-01 | Button handles disabled/loading states | unit | `npm test -- Button.test.tsx` |
| COMP-02 | Input shows error state with aria-invalid | unit | `npm test -- Input.test.tsx` |
| COMP-02 | Select renders options correctly | unit | `npm test -- Select.test.tsx` |
| COMP-02 | Textarea supports validation states | unit | `npm test -- Textarea.test.tsx` |
| COMP-03 | Card renders with compound components | unit | `npm test -- Card.test.tsx` |
| COMP-04 | ThemeToggle switches theme on click | integration | `npm test -- ThemeToggle.test.tsx` |
| COMP-05 | StatusBadge uses design tokens | unit | `npm test -- StatusBadge.test.tsx` |

## Sampling Rate

- **Per task commit:** `npm test -- [ComponentName].test.tsx` (< 5 seconds)
- **Per wave merge:** `npm test` (full suite, < 30 seconds)
- **Phase gate:** Full suite green before `/gsd-verify-work`

## Acceptance Criteria

All components must:
1. Use design tokens from `globals.css` (no hardcoded hex values)
2. Support light/dark themes via CSS variable switching
3. Pass accessibility checks (ARIA attributes, keyboard navigation)
4. Have unit tests covering all variants and states

## Per-Task Verification Map

| Plan | Task | Requirement | Test File | Tests | Status |
|------|------|-------------|-----------|-------|--------|
| 17-01 | Button component | COMP-01 | Button.test.tsx | 14 | ✅ COVERED |
| 17-02 | ThemeToggle component | COMP-04 | ThemeToggle.test.tsx | 7 | ✅ COVERED |
| 17-03 | Input component | COMP-02 | Input.test.tsx | 10 | ✅ COVERED |
| 17-03 | Select component | COMP-02 | Select.test.tsx | 7 | ✅ COVERED |
| 17-03 | Textarea component | COMP-02 | Textarea.test.tsx | 7 | ✅ COVERED |
| 17-04 | Card compound component | COMP-03 | Card.test.tsx | 10 | ✅ COVERED |
| 17-05 | StatusBadge refactor | COMP-05 | StatusBadge.test.tsx | 10 | ✅ COVERED |

**Total Coverage: 65 component tests**

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + React Testing Library |
| Accessibility | jest-axe for automated a11y checks |
| Config | `jest.config.ts`, `jest.setup.ts` |
| Coverage | All requirements have automated tests |

## Manual-Only Items

None — all requirements have automated verification.

## Validation Audit 2026-05-09

| Metric | Count |
|--------|-------|
| Requirements audited | 7 |
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Test files verified | 7 |
| Total tests | 80 |
| All tests passing | ✅ |

**Nyquist Compliant:** Yes — all behaviors have automated verification at or above the sampling rate.
