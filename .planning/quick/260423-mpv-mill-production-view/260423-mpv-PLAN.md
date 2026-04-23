---
phase: quick
plan: 260423-mpv
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/design/mill-production/page.tsx
autonomous: true
requirements: [DESIGN-MPV]
must_haves:
  truths:
    - "Design page displays three columns: Premix, Excel, CGM"
    - "Each column shows production cards with state indicators"
    - "Cards display state badge, label, and tons progress"
    - "States have correct colored backgrounds: Completed (green), Mixing (yellow), Blocked (red), Pending (grey)"
  artifacts:
    - path: "src/app/design/mill-production/page.tsx"
      provides: "Mill production view design prototype"
      min_lines: 80
  key_links: []
---

<objective>
Create a static design page for a mill production view with three columns (Premix, Excel, CGM) displaying production cards with state indicators and tons progress.

Purpose: Visual prototype for mill production monitoring that shows production states across different mill lines.
Output: Viewable design page at /design/mill-production
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/app/globals.css (CSS variables and color scheme)
@src/components/ui/StatusBadge.tsx (status badge pattern reference)
@src/components/KPICard.tsx (card component pattern reference)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Mill Production View Design Page</name>
  <files>src/app/design/mill-production/page.tsx</files>
  <action>
Create a design page with:

1. **Page Layout:**
   - Full-height page with bg-bg-page background
   - Header section with title "Mill Production" and date
   - Three-column layout using flex with equal width columns
   - Column headers: "Premix", "Excel", "CGM"

2. **Production Card Component (inline):**
   - Card with white background, rounded corners (rounded-xl), subtle shadow
   - State badge at top with colored background spanning full width:
     - Completed: bg-success-light text-success-dark
     - Mixing: bg-warning-light text-warning (yellow)
     - Blocked: bg-error-light text-error (red)
     - Pending: bg-gray-100 text-gray-600 (grey)
   - Label text below state (e.g., "Batch #1234", "Starter Mix")
   - Tons progress at bottom: "150 T / 250 T" format showing completed vs expected

3. **Mock Data:**
   - Premix column: 3-4 cards with varied states
   - Excel column: 3-4 cards with varied states
   - CGM column: 3-4 cards with varied states
   - Include at least one card of each state type across all columns

4. **Styling:**
   - Use existing CSS variables from globals.css (--success-light, --warning-light, --error-light, etc.)
   - Match existing design patterns (rounded-[15px], font-bold for labels)
   - Cards have vertical spacing (gap-4)
   - Columns have horizontal spacing (gap-6)
  </action>
  <verify>
    <automated>cd /Users/joel/Desktop/Projects/cgm-dashboard && npm run build 2>&1 | head -50</automated>
  </verify>
  <done>
    - Page renders at /design/mill-production
    - Three columns visible with headers
    - Cards show state badges with correct colors
    - Cards show label and tons progress
    - All four state types represented
  </done>
</task>

</tasks>

<verification>
- `npm run build` completes without errors
- Page accessible at http://localhost:3000/design/mill-production
- Visual inspection shows three-column layout
- State badges have correct colors (green, yellow, red, grey)
</verification>

<success_criteria>
- Design page compiles and renders
- All three columns (Premix, Excel, CGM) display with cards
- Cards show state, label, and tons progress
- Color coding matches specification
</success_criteria>

<output>
After completion, create `.planning/quick/260423-mpv-mill-production-view/260423-mpv-SUMMARY.md`
</output>
