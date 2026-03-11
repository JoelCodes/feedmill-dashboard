---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - eslint.config.mjs
autonomous: true
requirements: [QUICK-1]

must_haves:
  truths:
    - "Running npm run lint reports no Tailwind-related errors"
    - "Tailwind classes are validated by ESLint"
  artifacts:
    - path: "package.json"
      provides: "eslint-plugin-tailwindcss dependency"
      contains: "eslint-plugin-tailwindcss"
    - path: "eslint.config.mjs"
      provides: "Tailwind ESLint plugin configuration"
      contains: "tailwindcss"
  key_links:
    - from: "eslint.config.mjs"
      to: "eslint-plugin-tailwindcss"
      via: "plugin import and rules"
      pattern: "tailwindcss"
---

<objective>
Set up Tailwind CSS linting and fix any reported errors.

Purpose: Ensure consistent Tailwind class usage and catch invalid class names at lint time.
Output: Working Tailwind ESLint configuration with clean lint output.
</objective>

<execution_context>
@/Users/joel/.claude/get-shit-done/workflows/execute-plan.md
@/Users/joel/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@eslint.config.mjs
@package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install and configure eslint-plugin-tailwindcss</name>
  <files>package.json, eslint.config.mjs</files>
  <action>
    1. Install eslint-plugin-tailwindcss as a dev dependency:
       `npm install -D eslint-plugin-tailwindcss`

    2. Update eslint.config.mjs to include the Tailwind plugin:
       - Import the plugin: `import tailwindcss from "eslint-plugin-tailwindcss"`
       - Add plugin configuration with recommended rules
       - Configure for Tailwind v4 if needed (check plugin docs for v4 compatibility)

    Note: eslint-plugin-tailwindcss may have limited Tailwind v4 support. If the plugin
    doesn't support v4 features (like @theme inline), configure it to ignore those patterns
    or use only class validation rules that work.
  </action>
  <verify>
    <automated>npm run lint 2>&1 | head -50</automated>
  </verify>
  <done>ESLint config includes Tailwind plugin, npm run lint executes without configuration errors</done>
</task>

<task type="auto">
  <name>Task 2: Fix any Tailwind lint errors reported</name>
  <files>src/components/*.tsx, src/components/ui/*.tsx, src/app/*.tsx</files>
  <action>
    1. Run `npm run lint` to identify Tailwind-related errors

    2. Common fixes the plugin may report:
       - Class order: Reorder Tailwind classes to follow recommended order
       - Invalid classes: Fix any classes that don't exist in Tailwind
       - Contradictory classes: Remove duplicate/conflicting utilities

    3. If plugin reports false positives for CSS variable syntax like `bg-[var(--primary)]`,
       add appropriate configuration to whitelist arbitrary values or adjust rules.

    4. Run lint again to verify all errors are resolved.
  </action>
  <verify>
    <automated>npm run lint && echo "Lint passed"</automated>
  </verify>
  <done>npm run lint passes with zero errors</done>
</task>

</tasks>

<verification>
- `npm run lint` completes with exit code 0
- `npm run build` still succeeds (no regressions)
</verification>

<success_criteria>
- eslint-plugin-tailwindcss is installed and configured
- All Tailwind lint errors are resolved
- Build continues to work
</success_criteria>

<output>
After completion, create `.planning/quick/1-fix-tailwind-lint-errors/1-SUMMARY.md`
</output>
