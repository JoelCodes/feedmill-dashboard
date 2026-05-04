---
type: quick
id: 260504-jfn
description: Add tabs under the customer detail header section
files_modified:
  - designs/customer-detail.pen
autonomous: true
---

<objective>
Add a tabbed interface between the customer detail header card and the content section.

Purpose: Enable switching between Activity Timeline and Orders views for customer details.
Output: Updated customer-detail.pen with tab bar component and restructured content sections.
</objective>

<context>
@designs/customer-detail.pen
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add tab bar and restructure content sections</name>
  <files>designs/customer-detail.pen</files>
  <action>
Modify customer-detail.pen JSON to add a tab bar between the header card and content:

1. After the "customer-header" frame (ends around line 782) and before "divider3-detail", insert a new tab bar frame:

```json
{
  "type": "frame",
  "id": "tab-bar",
  "name": "Tab Bar",
  "width": "fill_container",
  "gap": 0,
  "children": [
    {
      "type": "frame",
      "id": "tab-activity",
      "name": "Tab Activity Timeline",
      "padding": [12, 20],
      "stroke": {
        "align": "inside",
        "thickness": 2,
        "fill": "#4fd1c5ff",
        "sides": ["bottom"]
      },
      "children": [
        {
          "type": "text",
          "id": "tab-activity-label",
          "name": "tabActivityLabel",
          "fill": "#4fd1c5ff",
          "content": "Activity Timeline",
          "lineHeight": 1.5,
          "fontFamily": "Helvetica",
          "fontSize": 13,
          "fontWeight": "700"
        }
      ]
    },
    {
      "type": "frame",
      "id": "tab-orders",
      "name": "Tab Orders",
      "padding": [12, 20],
      "children": [
        {
          "type": "text",
          "id": "tab-orders-label",
          "name": "tabOrdersLabel",
          "fill": "#a0aec0ff",
          "content": "Orders",
          "lineHeight": 1.5,
          "fontFamily": "Helvetica",
          "fontSize": 13,
          "fontWeight": "500"
        }
      ]
    }
  ]
}
```

2. Remove the "divider3-detail" section divider (lines 783-790) as the tab bar provides visual separation.

3. Remove the "timeline-heading" text element (lines 813-822) from inside "timeline-section" since the tab now serves as the heading.

4. The timeline-section remains as-is (containing the ActivityTimeline) - it represents the active tab content.

Design tokens used:
- Active tab text/border: #4fd1c5ff (teal/primary)
- Inactive tab text: #a0aec0ff (gray)
- Font: Helvetica, 13px
- Padding: 12px vertical, 20px horizontal
  </action>
  <verify>Open designs/customer-detail.pen in Penpad and verify: (1) Tab bar appears below header card, (2) "Activity Timeline" tab shows active state with teal color and bottom border, (3) "Orders" tab shows inactive gray text, (4) Timeline content displays below tabs without duplicate heading</verify>
  <done>Tab bar component inserted between header and timeline content with proper active/inactive states matching the design system colors</done>
</task>

</tasks>

<success_criteria>
- Tab bar frame exists with id "tab-bar" after customer-header
- Two tabs present: "Activity Timeline" (active) and "Orders" (inactive)
- Active tab has teal (#4fd1c5) text and bottom border
- Inactive tab has gray (#a0aec0) text, no border
- Section divider removed (tabs provide separation)
- "Activity Timeline" heading removed from timeline-section (tab serves as heading)
- JSON remains valid and renders in Penpad
</success_criteria>

<output>
After completion, update STATE.md Quick Tasks Completed table.
</output>
