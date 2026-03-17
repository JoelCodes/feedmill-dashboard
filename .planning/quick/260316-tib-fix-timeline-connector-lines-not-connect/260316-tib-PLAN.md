---
phase: quick
plan: 260316-tib
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/OrderDetails.tsx
autonomous: false
requirements: [QUICK-tib-01]

must_haves:
  truths:
    - "Timeline connector lines visually connect to circular icons"
    - "No gaps between timeline items and their connectors"
    - "Last item in each section (completed/pending) has no connector extending below"
  artifacts:
    - path: "src/components/OrderDetails.tsx"
      provides: "Integrated timeline connector within TimelineItem"
      contains: "showConnector"
  key_links:
    - from: "TimelineItem component"
      to: "connector line"
      via: "showConnector prop"
      pattern: "showConnector.*flex-1"
---

<objective>
Fix timeline connector lines to visually connect to circular icons instead of floating separately.

Purpose: The current implementation renders connectors as separate elements between items, creating visual gaps. The fix integrates the connector line into each TimelineItem's left column.

Output: Timeline with continuous visual flow from icon to icon.
</objective>

<execution_context>
@/Users/joel/.claude/get-shit-done/workflows/execute-plan.md
@/Users/joel/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- Current TimelineItem structure (lines 374-416) -->
```typescript
function TimelineItem({
  icon: Icon,
  title,
  description,
  date,
  color,
  isPending,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  date: string;
  color: "primary" | "success" | "error" | "pending";
  isPending?: boolean;
}) {
  // Left column: w-9 (36px), contains h-7 w-7 (28x28) circle
  // Currently NO connector line
}

function TimelineConnector({ color }: { color: "primary" | "success" | "error" | "pending" }) {
  // Separate component: h-8 pl-4.25
  // Renders bar BETWEEN items, not connected to them
}

const colorMap = {
  primary: { bg: "bg-primary", bar: "bg-primary", text: "text-primary" },
  success: { bg: "bg-success", bar: "bg-success", text: "text-success" },
  error: { bg: "bg-error", bar: "bg-error", text: "text-error" },
  pending: { bg: "bg-white border-2 border-pending", bar: "bg-pending", text: "text-text-secondary" },
};
```

<!-- Current rendering (lines 290-331) -->
```tsx
{sortedCompleted.map((event, index) => (
  <div key={event.id}>
    <TimelineItem ... />
    {index < sortedCompleted.length - 1 && (
      <TimelineConnector color={event.color} />
    )}
  </div>
))}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Integrate connector line into TimelineItem component</name>
  <files>src/components/OrderDetails.tsx</files>
  <action>
Modify TimelineItem to include a connector line extending from below the icon:

1. Add `showConnector?: boolean` prop to TimelineItem

2. Update left column structure (the `w-9` div):
   - Make it `flex flex-col items-center` (already is)
   - Keep the icon circle as-is (h-7 w-7)
   - Add a connector line below when showConnector is true:
     ```tsx
     {showConnector && (
       <div className={`flex-1 w-0.5 ${colors.bar}`} />
     )}
     ```
   - The `flex-1` makes the line fill remaining vertical space

3. Important: The parent div needs to use `items-stretch` so the left column stretches to match content height. Change:
   ```tsx
   // From:
   <div className="flex gap-3.5">
   // To:
   <div className="flex items-stretch gap-3.5">
   ```

4. Delete the standalone TimelineConnector component (lines 419-426) - no longer needed

5. Update both rendering locations to pass showConnector:
   - sortedCompleted.map: `showConnector={index < sortedCompleted.length - 1}`
   - sortedPending.map: `showConnector={index < sortedPending.length - 1}`

6. Between sections (completed to pending), update to just render the badge without extra connector:
   - Remove the `{sortedCompleted.length > 0 && <TimelineConnector color="pending" />}` line before PendingBadge
   - The last completed item should have showConnector=false (already handled by condition)
  </action>
  <verify>
    <automated>cd /Users/joel/Desktop/Projects/cgm-dashboard && npm run lint && npm run build</automated>
  </verify>
  <done>Timeline connector lines extend from icon circles, visually connecting consecutive timeline items without gaps</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Visual verification of timeline connectors</name>
  <files>src/components/OrderDetails.tsx</files>
  <action>User verifies the visual appearance of timeline connectors in the browser</action>
  <what-built>Timeline connectors now extend from within each timeline item's icon column, creating a continuous visual flow</what-built>
  <how-to-verify>
1. Run `npm run dev` and open http://localhost:3000
2. Select any order to view its details
3. Verify the timeline shows:
   - Connector lines start directly below each circular icon (no gap)
   - Lines extend to meet the next icon
   - Last item in "Completed" section has no line below
   - First item in "Pending" section has line extending to next pending item
   - Last pending item has no line below
4. Test with different order statuses to see various timeline lengths
  </how-to-verify>
  <verify>Visual inspection confirms continuous connector flow</verify>
  <done>User confirms timeline connectors visually connect icons without gaps</done>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- Lint passes: `npm run lint`
- Build passes: `npm run build`
- Visual: Timeline items have continuous connector flow
</verification>

<success_criteria>
- No visual gaps between timeline icons and connector lines
- Connector lines properly omitted for last items in each section
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/260316-tib-fix-timeline-connector-lines-not-connect/260316-tib-SUMMARY.md`
</output>
