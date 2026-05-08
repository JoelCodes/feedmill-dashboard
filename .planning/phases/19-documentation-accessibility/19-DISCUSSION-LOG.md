# Phase 19: Documentation & Accessibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-08
**Phase:** 19-documentation-accessibility
**Areas discussed:** Documentation format, Token guidelines depth, Accessibility testing, Component usage examples

---

## Documentation format

### Q1: Where should component documentation live?

| Option | Description | Selected |
|--------|-------------|----------|
| README.md in /ui folder | Single file with all components documented. Simple, no extra tooling. | ✓ |
| Storybook integration | Interactive component demos with controls. More setup effort. | |
| You decide | Claude picks based on project constraints. | |

**User's choice:** README.md in /ui folder

### Q2: What should the README structure cover?

| Option | Description | Selected |
|--------|-------------|----------|
| All components in one file | README.md with ## sections per component. Easy to navigate. | ✓ |
| Per-component README files | Button/README.md, Card/README.md, etc. More granular. | |
| You decide | Claude picks based on component count. | |

**User's choice:** All components in one file

### Q3: Should the README include visual examples (screenshots/images)?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, with screenshots | Add light/dark mode screenshots. More visual but needs maintenance. | |
| Code-only documentation | Just code snippets and props tables. Stays in sync with code. | ✓ |
| You decide | Claude picks based on maintenance burden. | |

**User's choice:** Code-only documentation

---

## Token guidelines depth

### Q1: How detailed should token usage guidelines be?

| Option | Description | Selected |
|--------|-------------|----------|
| Quick reference table | Token name → purpose → example. One row per token. Fast to scan. | ✓ |
| Detailed guide with do/don't | Full explanations + anti-patterns. More thorough but longer. | |
| You decide | Claude picks based on token complexity. | |

**User's choice:** Quick reference table

### Q2: Should token docs be in the same README as components, or separate?

| Option | Description | Selected |
|--------|-------------|----------|
| Same README | Single source of truth. Tokens section first, then components. | ✓ |
| Separate TOKENS.md file | Dedicated file for tokens only. Cleaner separation. | |
| You decide | Claude picks based on doc size. | |

**User's choice:** Same README

---

## Accessibility testing

### Q1: What accessibility testing approach should we use?

| Option | Description | Selected |
|--------|-------------|----------|
| Automated + manual | eslint-plugin-jsx-a11y + axe-core + manual screen reader spot-check. | ✓ |
| Automated only | Just ESLint rules + axe-core. Covers ~50% of WCAG issues. | |
| You decide | Claude picks based on WCAG AA requirements. | |

**User's choice:** Automated + manual

### Q2: How should we document accessibility findings?

| Option | Description | Selected |
|--------|-------------|----------|
| ACCESSIBILITY.md report | Dedicated file with WCAG checklist, pass/fail per component. | |
| Inline in README | Add 'Accessibility' section per component in main README. | ✓ |
| You decide | Claude picks based on audit scope. | |

**User's choice:** Inline in README

### Q3: For manual screen reader verification, which screen reader should we test with?

| Option | Description | Selected |
|--------|-------------|----------|
| VoiceOver (macOS) | Built into macOS. No extra setup needed. | ✓ |
| NVDA (Windows) | Free, widely used. Requires Windows environment. | |
| You decide | Claude picks based on OS. | |

**User's choice:** VoiceOver (macOS)

---

## Component usage examples

### Q1: How should component usage examples be presented?

| Option | Description | Selected |
|--------|-------------|----------|
| Code snippets in README | JSX snippets with all variant combinations. | ✓ |
| Codesandbox/StackBlitz links | Interactive playground per component. External dependency. | |
| You decide | Claude picks based on maintenance burden. | |

**User's choice:** Code snippets in README

### Q2: Should examples include do/don't patterns as mentioned in DOC-02?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, brief do/don't per component | 1-2 anti-patterns per component. Prevents common mistakes. | ✓ |
| Examples only, no don'ts | Just show correct usage. Simpler. | |
| You decide | Claude picks based on component complexity. | |

**User's choice:** Yes, brief do/don't per component

---

## Claude's Discretion

None — user provided explicit choices for all areas.

## Deferred Ideas

None — discussion stayed within phase scope.
