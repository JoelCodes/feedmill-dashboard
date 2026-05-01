---
phase: quick-260430-thf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/services/millProduction.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Mill production cards display farm names matching the pencil design file"
    - "All 33 orders have customer names from the canonical farm list"
  artifacts:
    - path: "src/services/millProduction.ts"
      provides: "Mock production orders with correct farm names"
      contains: "Westbridge Farm"
  key_links:
    - from: "src/services/millProduction.ts"
      to: "designs/mill-production.pen"
      via: "customer field values"
      pattern: "(Westbridge|Meadowview|Starbird|Severinski|Jireh|Corner|Trilean|Rockwall|Cedarcroft|Triple H|Whytebridge)"
---

<objective>
Update mock production order customer names to match pencil design file.

Purpose: Align the mill production view with the design spec for consistent visual appearance.
Output: Updated millProduction.ts with real farm names instead of parody names.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
The pencil file (designs/mill-production.pen) uses these canonical farm names:
1. Westbridge Farm
2. Meadowview Poultry
3. Starbird @ Jaedel
4. Severinski Farm
5. Jireh Farms
6. Corner's Pride Farm
7. Trilean Makin Bacon
8. Rockwall @ Peardonville
9. Cedarcroft Poultry
10. Triple H Farms
11. Whytebridge Farms

The current code (src/services/millProduction.ts) has 33 orders with parody names like:
- "Chick Magnet Farms", "Fowl Play Poultry", "Eggs Benedict Arnold", "Cluckingham Palace"
- "Moo-licious Dairy", "Holy Cow Ranch", "Udderly Ridiculous"
- "Winner Winner Chicken", "Pecking Order Farms", "Drumstick Dynasty"
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace parody farm names with design-spec names</name>
  <files>src/services/millProduction.ts</files>
  <action>
Update the `customer` field for all 33 orders in the mockOrders array.

Replace the parody names with the canonical farm names from the pencil file. Distribute the 11 farm names across the 33 orders (each farm name appears ~3 times, cycling through the list).

Mapping strategy - cycle through farms in order:
- Orders 1-11: Westbridge Farm, Meadowview Poultry, Starbird @ Jaedel, Severinski Farm, Jireh Farms, Corner's Pride Farm, Trilean Makin Bacon, Rockwall @ Peardonville, Cedarcroft Poultry, Triple H Farms, Whytebridge Farms
- Orders 12-22: Repeat the cycle
- Orders 23-33: Repeat the cycle

This ensures consistent distribution across all three mill lines (Premix, Excel, CGM) with each having 11 orders.
  </action>
  <verify>
    <automated>grep -c "Westbridge Farm" src/services/millProduction.ts | grep -q "3" && grep -c "Chick Magnet" src/services/millProduction.ts | grep -q "0" && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>All 33 orders have customer names from the canonical 11-farm list; no parody names remain.</done>
</task>

</tasks>

<verification>
- `grep -E "(Chick Magnet|Fowl Play|Eggs Benedict|Cluckingham|Moo-licious|Holy Cow|Udderly|Winner Winner|Pecking Order|Drumstick)" src/services/millProduction.ts` returns no matches
- `grep -E "(Westbridge|Meadowview|Starbird|Severinski|Jireh|Corner.*Pride|Trilean|Rockwall|Cedarcroft|Triple H|Whytebridge)" src/services/millProduction.ts` returns 33 matches
- `npm run build` passes without errors
</verification>

<success_criteria>
- All 33 production orders use farm names from the design spec
- Zero parody farm names remain in the file
- Build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/260430-thf-the-farm-labels-on-the-mill-production-p/260430-thf-SUMMARY.md`
</output>
