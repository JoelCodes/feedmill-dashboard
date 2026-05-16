# Phase 34 — UI Review

**Audited:** 2026-05-14
**Baseline:** UI-SPEC.md (approved design contract)
**Screenshots:** not captured (no dev server at localhost:3000, 5173, or 8080)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | All CTAs and locked strings match contract; filtered-column empty state uses generic "No orders" not "No [Status] orders" |
| 2. Visuals | 3/4 | Drawer header collapses two separate spec tiers into one combined h2; drop zone omits required Upload icon; no slide-in animation |
| 3. Color | 3/4 | Token usage is correct throughout; summary bar uses `--bg-page` tint instead of spec-required `--pending-light` |
| 4. Typography | 3/4 | `font-bold` introduced alongside `font-semibold` — a third weight beyond the two (regular/semibold) the spec allows; LastUpdatedChip uses `text-sm` not the spec's `11px` |
| 5. Spacing | 4/4 | All spacing from the declared scale; arbitrary values (`w-[480px]`, `text-[11px]`) are token-sanctioned exceptions in the spec |
| 6. Experience Design | 2/4 | `ImportFlow` has no try/catch around `previewImportAction` or `commitImportAction` — confirmed blocker (CR-01 in VERIFICATION.md); no ErrorBoundary anywhere in production route tree |

**Overall: 18/24**

---

## Top 3 Priority Fixes

1. **ImportFlow missing try/catch on async server actions (CR-01)** — A network error or server 500 during preview or commit leaves `isPending=true` permanently; operator must hard-refresh to recover. This is a stuck-spinner blocker. Fix: wrap both `await previewImportAction(...)` and `await commitImportAction(...)` in try/catch and call `setIsPending(false)` + `setError('Something went wrong. Please try again.')` in the catch block. (`src/components/ImportFlow.tsx:87, 147`)

2. **Drop zone missing Upload icon** — The UI-SPEC §8 explicitly requires an `Upload` (lucide) icon at 32px `--text-secondary` as the visual anchor of the drop zone. The implemented drop zone (`src/components/ImportFlow.tsx:199-228`) omits it entirely, reducing scannability and breaking the visual contract. Fix: import `Upload` from `lucide-react` and add `<Upload className="h-8 w-8 text-[var(--text-secondary)]" />` as the first child of the drop zone div.

3. **Drawer header merges two separate typography tiers into one** — UI-SPEC §5 specifies order number at 11px semibold `--text-secondary` and customer name at 20px bold `--text-primary` as two distinct nodes. The implementation (`src/components/ProductionDrawer.tsx:192-194`) renders both in a single `<h2>` at `text-lg` (18px) bold: `{order.orderNumber} — {order.customer}`. This loses the visual hierarchy that allows operators to scan order numbers separately from customer names. Fix: split into two elements — `<p className="text-[11px] font-semibold text-[var(--text-secondary)]">{order.orderNumber}</p>` and `<h2 className="text-xl font-bold text-[var(--text-primary)]">{order.customer}</h2>`.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**PASS — All locked CTA strings match contract exactly.**

Verified against the UI-SPEC Copywriting Contract table:

| Contract String | File:Line | Status |
|-----------------|-----------|--------|
| "Start Mixing" | `TransitionButtons.tsx:81` | PASS |
| "Complete Order" | `TransitionButtons.tsx:117` | PASS |
| "Block Order" | `TransitionButtons.tsx:133` | PASS |
| "Resume to Mixing" | `TransitionButtons.tsx:164` (computed) | PASS |
| "Resume to Pending" | `TransitionButtons.tsx:164` (computed) | PASS |
| "Import Orders" | `ProductionDashboard.tsx:243` | PASS |
| "Commit Import" | `ImportFlow.tsx:351` | PASS |
| "Confirm Block" | `BlockReasonModal.tsx:117` | PASS |
| "Block Order" (modal title) | `BlockReasonModal.tsx:90` | PASS |
| "Reason (required)" (label) | `BlockReasonModal.tsx:95` | PASS |
| "Describe the issue..." (placeholder) | `BlockReasonModal.tsx:99` | PASS |
| "Order not found" | `ProductionDrawer.tsx:155` | PASS |
| "No orders" | `MillColumn.tsx:129` | PASS (for empty column) |
| "No imports yet" | `ImportHistoryTable.tsx:42` | PASS |
| "Drop your Excel file here" | `ImportFlow.tsx:206` | PASS |
| "or click to browse — .xlsx only, max 2 MB" | `ImportFlow.tsx:208-209` | PASS |
| "File exceeds 2 MB limit. Please upload a smaller file." | `ImportFlow.tsx:77` | PASS |
| "Updated Xs ago" / "Updated Xm ago" | `LastUpdatedChip.tsx:32,34` | PASS |
| "Order was modified by another user. Please refresh." | `TransitionButtons.tsx:37` | PASS |

**WARNING — Filtered column empty state does not follow spec.**

The UI-SPEC Copywriting Contract specifies: `"No [Status] orders"` when a column is filtered (e.g., "No Pending orders"). The `MillColumn.tsx:129` empty state simply renders `"No orders"` regardless of whether the emptiness is caused by a filter being active or the column genuinely containing no orders. Since the `MillColumn` component receives an already-filtered `orders` array, it cannot distinguish the two cases without additional props. The spec copy cannot be honoured without passing the active filter context into `MillColumn`.

**Minor — "Cancel" appears as generic CTA label in ImportFlow.tsx:359.**

The spec permits "Cancel" as the secondary action label in the block modal. Its presence in `ImportFlow.tsx` for the preview-to-entry transition is contextually appropriate; the user intent is clear. Not flagged as a blocking issue but the spec does not explicitly permit it at that site.

---

### Pillar 2: Visuals (3/4)

**WARNING — Drawer header collapses two separate spec tiers.**

UI-SPEC §5 defines:
- Order number: 11px semibold `--text-secondary`
- Customer name: 20px bold `--text-primary`

Implementation at `ProductionDrawer.tsx:192-194`:
```
<h2 className="text-lg font-bold text-[var(--text-primary)] truncate">
  {order.orderNumber} — {order.customer}
</h2>
```
The combined element is `text-lg` (18px) in one weight and color. The visual hierarchy separation between the order-number label tier and the customer-name title tier is lost. Operators who scan drawers by order number cannot distinguish the number from the name at a glance.

**WARNING — Drop zone missing Upload icon visual anchor.**

UI-SPEC §8: "Icon: `Upload` (lucide), 32px, `--text-secondary`" as the top element of the drop zone. The implementation at `ImportFlow.tsx:199-228` contains text and a "Browse file" button label but no `Upload` icon. Without the icon, the drop zone lacks an immediate visual cue that it accepts file drops.

**WARNING — No slide-in animation on drawer.**

UI-SPEC §5: "Animation: slide-in from right, `translate-x-full` to `translate-x-0`, 200ms ease-out." The `ProductionDrawer.tsx` renders the `<aside>` as `fixed right-0 top-0` with no transition classes. The drawer appears/disappears instantly. This is an interaction contract gap.

**PASS — Visual hierarchy within board columns.**

Column headers use `text-2xl font-bold text-primary` (`MillColumn.tsx:120`). State section headings use `text-xl font-bold` with status-specific header color inline style (`MillColumn.tsx:70`). Cards use the correct 4-tier label/title/weight/delivery hierarchy. The `isNextUp` teal pill and `isInProgress` animated dot are implemented.

**PASS — Icon-only buttons have aria-labels.**

The close button in `ProductionDrawer.tsx:201-207` has `aria-label="Close drawer"`. The `LastUpdatedChip.tsx:77` refresh button has `aria-label="Refresh"`. The in-progress dot has `aria-label="In progress"` (`ProductionCard.tsx:106`).

---

### Pillar 3: Color (3/4)

**PASS — Status border and header colors use exact spec tokens.**

All status state colors use `var(--status-{state}-border)` and `var(--status-{state}-header)` CSS custom properties via inline style injection (`ProductionCard.tsx:67`, `MillColumn.tsx:65`). Filter pill configs use `bg-success-light`, `text-success-dark`, `bg-warning-light`, etc., matching the spec table exactly (`ProductionDashboard.tsx:79-104`).

**PASS — Accent (`--primary`) usage is within declared scope.**

Primary color is used for: active FilterPill background (via FilterPill component), column header text (`text-primary` on `MillColumn.tsx:120`), "Next Up" badge background (`bg-[var(--primary)]` on `ProductionCard.tsx:94`), "Browse file" button in drop zone (`bg-[var(--primary)]` on `ImportFlow.tsx:224`), and the search input focus ring. This is consistent with spec-declared usages.

**PASS — No hardcoded hex values in Phase 34 components.**

The grep of Phase 34 components returned zero hardcoded hex values. The only hits were in `CustomerDetailHeader.tsx` (pre-Phase-34, out of scope).

**WARNING — Import preview summary bar uses wrong background token.**

UI-SPEC §8: "Background `--pending-light`, padding 8px 16px, rounded `--radius-md`" for the summary bar. The implementation at `ImportFlow.tsx:245`:
```
bg-[var(--bg-page)]
```
The `--bg-page` (#f8f9fa) is the page background, not `--pending-light` (which would be a pale blue-grey tint matching the pending pill). The visual distinction that signals "this is a summary of a pending operation" is absent. Fix: change `bg-[var(--bg-page)]` to `bg-[var(--pending-light)]` on `ImportFlow.tsx:245`.

**INFO — `STATE_COLORS` dead code retained in `ProductionDashboard.tsx:53-73`.**

The const is defined, then suppressed via `void STATE_COLORS` on line 73. This is noted as an anti-pattern in `34-VERIFICATION.md`. Not a color contract violation but a maintenance smell.

---

### Pillar 4: Typography (3/4)

**Font weights in use (Phase 34 components):**
- `font-semibold` — order numbers (cards), pill text, field labels (drawer), "Recent Imports" heading
- `font-bold` — customer names (cards), column headers, state section headings, drawer header, modal title, h2 headings in ImportFlow
- `font-medium` — weight+product line in cards, delivery time, skip/overwrite radio labels, transition button sub-elements

**WARNING — Three font weights used; spec permits two.**

UI-SPEC Typography section: "Weights used: **400 (regular)** and **700 (bold)**. Semibold (600) is used only for label-tier text (11px labels, pill text, breadcrumbs)."

In practice three weights appear: semibold, bold, and medium. `font-medium` appears in cards (`ProductionCard.tsx:118,123`), column sub-labels (`MillColumn.tsx:121`), drawer field labels (`ProductionDrawer.tsx:109`), and blocked band text. The spec does not list `font-medium` (500) as a permitted weight — it restricts weight use to regular (400), bold (700), and semibold (600) for specific label tiers only.

This is a minor deviation; `font-medium` is used only for secondary/metadata text which could reasonably be considered label-tier, but it is not explicitly sanctioned.

**WARNING — LastUpdatedChip uses `text-sm` (14px) not spec's 11px.**

UI-SPEC §1: "text format: 'Updated Xs ago', 11px, `--text-secondary`." The implementation at `LastUpdatedChip.tsx:69` uses `text-sm` (14px). The chip renders noticeably larger than specified.

**WARNING — MillColumn sub-label uses `text-base` (16px) not spec's 14px.**

UI-SPEC §3 column header sub-label: "14px, semibold, `--text-muted`." The implementation at `MillColumn.tsx:121` uses `text-base` (16px). Minor size overage; readable but not spec-compliant.

**PASS — ProductionCard 4-tier typography uses correct semantic classes.**

Cards use `text-card-label` (maps to `--fs-11` = 11px), `text-card-title` (maps to `--fs-15` = 15px), `text-sm` (14px for weight/product), and `text-xs` (12px for delivery). Defined in `globals.css:264-265` as `@theme inline` utilities. This matches the spec tiers.

**PASS — Drawer field labels use `text-[11px]` (spec: 11px semibold).**

`ProductionDrawer.tsx:109`: `text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)]`. Note `font-medium` rather than `font-semibold` — minor deviation but visual outcome is very similar at this size.

---

### Pillar 5: Spacing (4/4)

All spacing in Phase 34 components uses Tailwind scale values from the spec's declared scale.

**Spacing audit results:**

Dominant patterns: `gap-3` (6 uses), `p-6` (4 uses), `gap-2`/`gap-4`/`gap-5`/`gap-6` — all on the declared spacing scale. No arbitrary `[Npx]` or `[Nrem]` spacing classes were found.

**PASS — Arbitrary values are spec-sanctioned.**

Two types of `[...]` arbitrary values appear:
- `w-[480px]` — the drawer width (`ProductionDrawer.tsx:153,186`, `DrawerSkeleton.tsx:19`). UI-SPEC §5 explicitly locks this to 480px.
- `text-[11px]`, `text-[10px]` — used for label-tier text in cards and timeline. These correspond to `--fs-11` and `--fs-10` tokens which the spec designates for those specific contexts.

**PASS — Column gap matches spec.**

`ProductionDashboard.tsx:255`: `flex gap-6` (24px). UI-SPEC §3: "Column container: `flex gap-6` (24px gap)."

**PASS — Card padding consistent with spec.**

`ProductionCard.tsx:91`: `py-2.5 pr-4 pl-5`. This matches the card inner padding pattern from the spec's declared component.

**PASS — Blocked band padding matches spec.**

`BlockedAlertBand.tsx:42`: `px-4 py-3` (16px left/right, 12px top/bottom). UI-SPEC §2: "Padding: 12px top/bottom, 16px left/right."

**PASS — FilterPill gap matches spec.**

`ProductionDashboard.tsx:214`: `gap-2.5` (10px). UI-SPEC §1: "Gap: 10px (gap-2.5)."

---

### Pillar 6: Experience Design (2/4)

**BLOCKER — ImportFlow has no try/catch around async server actions.**

`ImportFlow.tsx:87`: `const result: PreviewResult = await previewImportAction(formData);`
`ImportFlow.tsx:147`: `const result = await commitImportAction(formData, decisions);`

Neither call is wrapped in try/catch. A network error, server 500, or timeout during either call will throw an unhandled promise rejection, leaving `isPending=true` permanently (spinner stuck). The operator must hard-refresh to recover. This is documented as `CR-01` in `34-VERIFICATION.md:142` with severity "Blocker" (qualified: does not block the phase goal but is a shipped defect).

**BLOCKER — No ErrorBoundary in the production route tree.**

A grep of `src/` for `ErrorBoundary` returns zero matches in non-test files. The production dashboard at `/` uses `<Suspense>` boundaries for loading states but there is no React ErrorBoundary wrapping `ProductionDashboard`, `ProductionDrawer`, or the `/import` page. If an unexpected render error occurs (e.g., malformed DB data, null pointer in `ProductionCard`), the entire page will display a React white-screen crash with no recovery path. Next.js App Router provides a built-in `error.tsx` convention; an `src/app/error.tsx` would cover the route.

**PASS — Loading states are fully implemented.**

- Per-column Suspense: `<Suspense fallback={<ColumnSkeleton />}>` at 3 sites (`ProductionDashboard.tsx:257,270,283`).
- Drawer Suspense: `<Suspense fallback={<DrawerSkeleton />}>` (`ProductionDashboard.tsx:300`).
- Button loading states: all `TransitionButtons` sub-components use `loading={isPending}` prop (`TransitionButtons.tsx:80,116,169`).
- ImportFlow pending: `isPending` disables buttons and shows "Processing…"/"Committing…" labels.

**PASS — Error states are covered for all mutation paths.**

- Conflict banner (D-14): inline red banner + auto `router.refresh()` on all `TransitionButtons` sub-components (`TransitionButtons.tsx:44-50, 83-85, 119-122, 172-175`).
- Block validation error: inline via `Textarea` `error` prop (`BlockReasonModal.tsx:100`).
- ImportFlow file-size error: inline red banner (`ImportFlow.tsx:232-236`).
- Commit/preview server errors: `setError(result.message)` path exists when `result.ok === false`.

**PASS — Empty states are covered.**

- Empty column: "No orders" (`MillColumn.tsx:129`).
- Empty drawer (stale ID): "Order not found" + Close button (`ProductionDrawer.tsx:155-163`).
- Empty import history: "No imports yet" (`ImportHistoryTable.tsx:42`).
- Empty timeline: "No transitions yet." (`ProductionDrawer.tsx:239`).

**PASS — Destructive actions have confirmation.**

The Block Order flow requires a modal with a required textarea before `blockOrder()` is called. Cancel returns to the drawer without any action (`BlockReasonModal.tsx:104-110`). Confirm button is disabled when the reason is empty (`BlockReasonModal.tsx:114`).

**PASS — Disabled states prevent double-submit.**

`TransitionButtons` sub-components pass `loading={isPending}` to `Button` which renders disabled during in-flight actions. `ImportFlow.tsx:348-360`: both Commit and Cancel buttons have `disabled={isPending}`.

**WARNING — `useProductionPolling` has no pause on visibility change.**

The 30s `setInterval` runs unconditionally whether the tab is visible or not (`useProductionPolling.ts` confirmed via summary). This is not a contract violation (the spec does not require it) but causes unnecessary DB load when the tab is backgrounded. A `document.visibilitychange` pause is a quality improvement, not a blocker.

**INFO — Anti-pattern: `eslint-disable-next-line react-hooks/exhaustive-deps` without justification comment.**

`ProductionDashboard.tsx:167`: suppresses dep warning for `setQuery` (stable nuqs reference). The suppression has no inline comment explaining WHY `setQuery` is safe to exclude. Future maintenance risk per `34-VERIFICATION.md:143`. Not a visual/UX issue.

---

## Registry Safety

Registry audit: no shadcn initialized (`components.json` absent). No third-party registries declared in UI-SPEC.md. `@radix-ui/react-dialog` is a standard npm package installed directly (not via a registry). Registry audit not applicable.

---

## Files Audited

**Phase 34 new components:**
- `src/components/ProductionDashboard.tsx`
- `src/components/ProductionCard.tsx`
- `src/components/ProductionDrawer.tsx`
- `src/components/MillColumn.tsx`
- `src/components/BlockedAlertBand.tsx`
- `src/components/TransitionButtons.tsx`
- `src/components/BlockReasonModal.tsx`
- `src/components/LastUpdatedChip.tsx`
- `src/components/ColumnSkeleton.tsx`
- `src/components/DrawerSkeleton.tsx`
- `src/components/ImportFlow.tsx`
- `src/components/ImportHistoryTable.tsx`

**Phase 34 modified components:**
- `src/components/Sidebar.tsx`
- `src/components/Header.tsx`

**Supporting files:**
- `src/app/globals.css` (token verification)
- `src/app/page.tsx` (auth gate + RSC structure, via summaries)
- `src/app/import/page.tsx` (via summaries)

**Planning documents read:**
- `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-UI-SPEC.md`
- `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-CONTEXT.md`
- `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-VERIFICATION.md`
- `34-01-SUMMARY.md` through `34-12-SUMMARY.md`
