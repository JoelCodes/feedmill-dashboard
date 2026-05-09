---
phase: 16-foundation-design-system-setup
plan: 04
subsystem: build-tooling
tags: [eslint, design-tokens, enforcement]
dependencies:
  requires: [16-01]
  provides: [eslint-rule-no-hardcoded-values]
  affects: [all-components]
tech_stack:
  added: [eslint-custom-rule]
  patterns: [ast-traversal, jsx-attribute-validation]
key_files:
  created:
    - eslint-rules/no-hardcoded-values.js
    - eslint-rules/no-hardcoded-values.test.js
  modified:
    - eslint.config.mjs
decisions:
  - Use regex patterns for hex color and px value detection
  - Handle both static strings and template literals in className
  - Set error severity to block builds per D-08
metrics:
  duration: 130
  tasks_completed: 3
  files_created: 2
  files_modified: 1
  tests_added: 13
  completed_date: 2026-05-07
---

# Phase 16 Plan 04: ESLint Token Enforcement Summary

**One-liner:** Custom ESLint rule blocks hardcoded hex colors and px values in className attributes, enforcing design token usage at error severity.

## What Was Built

Created a custom ESLint rule (`no-hardcoded-values`) that scans className attributes for hardcoded design values and forces developers to use design tokens instead. The rule integrates into the existing ESLint 9 flat config and runs at error severity, blocking builds when violations are detected.

**Key capabilities:**
- Detects hex colors in both 3-digit (#fff) and 6-digit (#4fd1c5) formats
- Detects px values in Tailwind arbitrary syntax (e.g., w-[24px])
- Handles static className strings, JSX expressions, and template literals
- Provides clear error messages pointing to token alternatives
- Ignores non-className attributes (style, data-*, etc.)
- Integrated at error severity per D-08 decision

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create custom ESLint rule | 527711c | eslint-rules/no-hardcoded-values.js |
| 2 | Integrate rule into ESLint config | 7b8f94c | eslint.config.mjs |
| 3 | Test ESLint rule behavior | 7623638 | eslint-rules/no-hardcoded-values.test.js |

## Implementation Details

### Custom Rule Architecture

**File:** `eslint-rules/no-hardcoded-values.js`

The rule uses ESLint's AST traversal to examine JSX attributes:

1. **AST Node Selection:** Targets `JSXAttribute` nodes with name="className"
2. **Value Extraction:** Handles three value types:
   - Static strings: `className="bg-[#fff]"`
   - JSX expressions: `className={"bg-[#fff]"}`
   - Template literals: ``className={`bg-[#${color}] hover:opacity-50`}``
3. **Pattern Matching:**
   - Hex colors: `/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g`
   - Px values: `/\[(\d+)px\]/g`
4. **Error Reporting:** Uses `messageId` for clear, actionable error messages

### ESLint Config Integration

**File:** `eslint.config.mjs`

Added custom plugin configuration to the flat config array:

```javascript
{
  plugins: {
    custom: {
      rules: {
        "no-hardcoded-values": noHardcodedValues,
      },
    },
  },
  rules: {
    "custom/no-hardcoded-values": "error",
  },
}
```

### Test Coverage

**File:** `eslint-rules/no-hardcoded-values.test.js`

13 test cases covering:

**Valid (6 cases):**
- Standard Tailwind utilities (p-4, text-white)
- Design token usage (bg-[var(--primary)])
- Template literals with tokens
- Non-className attributes (style, data-color)
- Tailwind color utilities (text-red-500)

**Invalid (7 cases):**
- Static hex colors (#4fd1c5, #fff)
- Multiple hex colors in one className
- Hex in template literals
- Px values in arbitrary syntax ([24px])
- Multiple px values
- Mix of hex and px violations

All tests pass with clear error messages.

## Deviations from Plan

None - plan executed exactly as written.

## Threat Surface

No new security surface introduced. ESLint rules run at build time only and do not process user input or interact with runtime code.

## Known Stubs

None - rule is fully functional.

## Verification Results

✅ **Automated Tests:**
- `node eslint-rules/no-hardcoded-values.test.js` outputs "All tests passed!"
- All 13 test cases pass (6 valid, 7 invalid)

✅ **Integration:**
- `grep "no-hardcoded-values" eslint.config.mjs` confirms rule configuration
- Rule severity set to "error" per D-08
- Import statement present: `import noHardcodedValues from "./eslint-rules/no-hardcoded-values.js"`

✅ **Must-Have Truths (from plan frontmatter):**
- Rule structure verified: module.exports with meta and create properties
- messageId "hexColor" present with helpful error message
- messageId "pxValue" present with helpful error message
- JSXAttribute handler present
- Literal and TemplateLiteral value types handled

## Dependencies

**Requires:**
- 16-01 (Token system expansion) - Rule references token naming patterns in error messages

**Provides:**
- `eslint-rule-no-hardcoded-values` - Build-time enforcement of token usage

**Affects:**
- All future components - Developers cannot introduce hardcoded values
- Existing codebase - Will show errors if hardcoded values exist (expected, cleanup not in this plan's scope)

## Next Steps

**For Phase 17 (Component Library):**
1. Fix any existing violations in current components before component library work begins
2. Consider temporary `eslint-disable` comments for legacy components if cleanup is deferred
3. Verify Button, Input, and other primitives use only token references

**Future Enhancements (deferred):**
- Add auto-fix capability to suggest token replacements
- Extend rule to check style prop objects
- Add rule configuration options (severity per pattern type)

## Self-Check

**Files created:**
- ✅ eslint-rules/no-hardcoded-values.js exists
- ✅ eslint-rules/no-hardcoded-values.test.js exists

**Files modified:**
- ✅ eslint.config.mjs contains import and rule configuration

**Commits:**
- ✅ 527711c exists: feat(16-04): create custom ESLint rule for token enforcement
- ✅ 7b8f94c exists: feat(16-04): integrate custom ESLint rule into config
- ✅ 7623638 exists: test(16-04): add comprehensive tests for ESLint rule

**Self-Check: PASSED**
