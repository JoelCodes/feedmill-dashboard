# Phase 10: Design - Research

**Researched:** 2026-05-01
**Domain:** UI/UX design for customer management pages in Pencil.dev
**Confidence:** HIGH

## Summary

Phase 10 involves creating design files in Pencil.dev for the customers page (customer list view and customer detail page with bin visualization). The project already uses Pencil.dev extensively with 4 existing .pen files establishing design patterns. The UI-SPEC contract provides comprehensive design tokens, spacing, typography, and color specifications that must be followed.

Pencil.dev uses JSON-based .pen files with a structured object tree format similar to HTML/SVG. Design files include frames, text, icons, shapes, and support flexbox-style layouts with variables for colors, spacing, and typography. All existing designs follow a consistent system using lucide-react icons, design tokens from globals.css, and established component patterns from OrdersTable and OrderDetails.

The research identifies three critical design domains: (1) table-based list views with search and status indicators, (2) vertical tank gauges for bin fill level visualization with color-coded threshold zones, and (3) expandable timeline patterns for activity history. User decisions from CONTEXT.md lock all major design choices, leaving no discretionary areas.

**Primary recommendation:** Create customers.pen and customer-detail.pen files using the established .pen JSON structure, reusing design tokens and patterns from existing files, with bin gauges as vertical tanks with bottom-to-top fill and color thresholds matching --success/--warning/--error tokens.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design file creation | Static / Design | — | .pen files are version-controlled design artifacts, not runtime code |
| Visual specification | Static / Design | Frontend (consumer) | Design defines UI contract; frontend implements it |
| Component patterns | Static / Design | Frontend (implementation) | Designs specify reusable component structure; code builds them |
| Design token definitions | Static / Design | Frontend (globals.css) | Tokens are already defined in globals.css; designs reference them |
| User interaction flows | Static / Design | Frontend (event handlers) | Designs show interaction states; code implements behavior |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSGN-01 | Customer list view designed in customers.pen | Pencil.dev .pen format documented; existing OrdersTable pattern provides table row layout reference; UI-SPEC defines CustomerTable component structure |
| DSGN-02 | Customer detail page layout designed in customer-detail.pen | .pen format supports frame-based layouts; OrderDetails pattern provides header + scrollable content reference; UI-SPEC defines CustomerDetailHeader, BinGaugeRow, ActivityTimeline components |
| DSGN-03 | Bin visualization component designed with fill bars and alert states | Vertical gauge best practices researched; color threshold patterns established via --success/--warning/--error tokens; .pen format supports shapes, fills, and gradient styling |

</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Customer List Layout:**
- **D-01:** Table rows layout (matches OrdersTable pattern for consistency)
- **D-02:** Minimal columns: Name + Status only (details on click)
- **D-03:** Combined status indicator uses stacked icons (orders badge + changes dot + bin alert icon)
- **D-04:** Search box only at top (no status filter pills) - matches Header search pattern

**Customer Detail Structure:**
- **D-05:** Header + single scroll layout (fixed header with customer info, scrollable content below)
- **D-06:** Full contact card header (name, location, contact info, delivery preferences)
- **D-07:** Section order: Bins first, then Timeline (bin status is quick-glance, timeline is detailed history)
- **D-08:** Browser back only for navigation (no explicit back button or breadcrumbs)

**Bin Visualization Style:**
- **D-09:** Vertical tank gauge (fill bar grows bottom to top like a tank level indicator)
- **D-10:** Color fills threshold zones (green above low threshold, yellow in warning zone, red in critical zone)
- **D-11:** Compact row of gauges layout (just tank gauges side by side, metadata on hover/click)
- **D-12:** Display location code + feed type near each gauge, percentage shown in gauge itself

**Visual Consistency:**
- **D-13:** Use existing color tokens from globals.css (--success, --warning, --error) for bin alert states
- **D-14:** Use Lucide icons (lucide-react) for customer list status icons (Package for orders, AlertTriangle for alerts, etc.)
- **D-15:** Extend existing TimelineItem pattern from OrderDetails for activity timeline (add event types for deliveries and bin alerts)
- **D-16:** Match Header search styling for the customer list search box

### Claude's Discretion

None - all areas had explicit decisions.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pencil.dev | 2.8+ | UI design and prototyping | JSON-based .pen format; version-control friendly; AI-readable; supports variables, components, flexbox layouts; already used in project with 4 existing .pen files [VERIFIED: existing designs/order-dashboard.pen shows version 2.8] |
| lucide-react | 0.577.0 | Icon library | Consistent icon system across all project components; Search, Package, AlertTriangle icons already in use [VERIFIED: package.json, OrdersTable.tsx, Header.tsx] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| JSON Schema | — | .pen file validation | Optional: validate .pen file structure before committing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pencil.dev | Figma | Figma requires separate handoff process, no IDE integration, not JSON-based; Pencil.dev files live in git alongside code [CITED: docs.pencil.dev/core-concepts/pen-files] |
| Pencil.dev | Sketch | macOS-only, proprietary format, no git-friendly versioning [ASSUMED] |
| Pencil.dev | Adobe XD | Discontinued by Adobe in 2023, cloud-dependent [ASSUMED] |
| Pencil.dev | Penpot | Open-source alternative but different ecosystem; switching costs high [ASSUMED] |

**Installation:**

Pencil.dev is IDE-integrated (VSCode extension) or desktop application. No npm installation required.

**Version verification:** Existing .pen files use version 2.8 format [VERIFIED: designs/order-dashboard.pen line 2]

## Architecture Patterns

### System Architecture Diagram

```
Design Phase Flow (Non-Runtime):

┌─────────────────────────────────────────────────────────────┐
│                    Design Requirements                       │
│          (REQUIREMENTS.md: DSGN-01, DSGN-02, DSGN-03)       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
         ┌────────────────────────────┐
         │   Design Token Reference    │
         │  (globals.css, UI-SPEC.md) │
         └─────────────┬──────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│              Pencil.dev Design Canvas                         │
│  ┌──────────────────┐          ┌────────────────────────┐   │
│  │  customers.pen   │          │ customer-detail.pen     │   │
│  │                  │          │                         │   │
│  │ - CustomerTable  │          │ - CustomerDetailHeader │   │
│  │ - SearchBox      │          │ - BinGaugeRow          │   │
│  │ - StatusIcons    │          │ - ActivityTimeline     │   │
│  └────────┬─────────┘          └──────────┬─────────────┘   │
│           │                               │                  │
└───────────┼───────────────────────────────┼──────────────────┘
            │                               │
            └───────────┬───────────────────┘
                        │
                        ↓ (reference during implementation)
               ┌────────────────────┐
               │ Frontend Code      │
               │ (Phase 12-15)      │
               │ - React components │
               │ - CSS styles       │
               └────────────────────┘
```

**Flow explanation:**
1. Requirements define what must be designed (3 components)
2. Design tokens provide color, spacing, typography constraints
3. Designer creates .pen files in Pencil.dev using JSON structure
4. .pen files contain frame hierarchies, component definitions, and visual specifications
5. Frontend phases reference .pen designs to implement components

**Design file structure (.pen JSON):**

```json
{
  "version": "2.8",
  "variables": {
    "color.background": { "type": "color", "value": "#f8f9fa" },
    "color.primary": { "type": "color", "value": "#4fd1c5" },
    "spacing.md": { "type": "number", "value": 16 }
  },
  "children": [
    {
      "type": "frame",
      "id": "unique-id",
      "name": "Component Name",
      "width": 1920,
      "height": 1200,
      "fill": "$color.background",
      "children": [
        { "type": "text", "content": "...", "fontSize": 12 },
        { "type": "iconFont", "icon": "Search", "library": "lucide" }
      ]
    }
  ]
}
```

[CITED: docs.pencil.dev/for-developers/the-pen-format]

### Recommended Project Structure

```
designs/
├── customers.pen                 # Customer list view design
├── customer-detail.pen           # Customer detail page design
├── order-dashboard.pen           # (existing) Reference for table patterns
├── design-system.pen             # (existing) Design token definitions
├── page-layout.pen               # (existing) Layout structure reference
└── mill-production.pen           # (existing) Filter pill patterns

src/
├── app/globals.css               # Design tokens (--success, --warning, --error, etc.)
├── components/
│   ├── OrdersTable.tsx           # Reference pattern for CustomerTable
│   ├── OrderDetails.tsx          # Reference pattern for CustomerDetail + Timeline
│   └── Header.tsx                # Reference pattern for search box styling
```

### Pattern 1: Table Row Layout with Minimal Columns

**What:** Table structure with Name + Status columns only, row click for navigation, stacked status icons
**When to use:** Customer list view (DSGN-01, D-01, D-02)

**Example from OrdersTable.tsx:**

```typescript
// Table structure: header + rows, minimal columns, click-to-select
<div className="flex py-2.5">
  <div className="text-text-secondary flex-1 text-[10px] font-bold">
    DOCUMENT #
  </div>
  <div className="text-text-secondary flex-1 text-[10px] font-bold">
    CUSTOMER
  </div>
  {/* ... additional columns */}
</div>

// Row with click handler and hover state
<div
  onClick={() => handleSelectOrder(order.id)}
  className={`flex cursor-pointer items-center py-3 transition-colors
    ${validSelectedId === order.id ? 'bg-primary/10' : 'hover:bg-gray-50'}`}
>
  {/* Row content */}
</div>
```

**Design equivalent (.pen):**

```json
{
  "type": "frame",
  "name": "CustomerTable Row",
  "layout": "horizontal",
  "padding": [12, 0],
  "gap": 16,
  "fill": "#ffffff",
  "children": [
    {
      "type": "text",
      "content": "Customer Name",
      "fontSize": 12,
      "fill": "#2d3748"
    },
    {
      "type": "frame",
      "name": "Status Indicators",
      "layout": "horizontal",
      "gap": 8,
      "children": [
        { "type": "iconFont", "icon": "Package", "library": "lucide" },
        { "type": "ellipse", "width": 8, "height": 8, "fill": "#e53e3e" },
        { "type": "iconFont", "icon": "AlertTriangle", "library": "lucide", "fill": "#975a16" }
      ]
    }
  ]
}
```

[VERIFIED: OrdersTable.tsx lines 333-428 show table header and row structure]

### Pattern 2: Fixed Header + Scrollable Content Layout

**What:** Header frame with fixed position, scrollable body below, no explicit back button
**When to use:** Customer detail page (DSGN-02, D-05, D-08)

**Example from OrderDetails.tsx:**

```typescript
// Fixed header section
<div className="flex flex-col gap-1">
  <div className="flex items-center gap-2">
    <h2 className="text-text-primary text-lg font-bold">
      {displayOrder.documentNumber} - {displayOrder.customer}
    </h2>
    <StatusBadge status={displayOrder.status} />
  </div>
  <p className="text-text-secondary text-sm">
    {displayOrder.quantity} tons {displayOrder.textureType} · {displayOrder.location}
  </p>
</div>

// Scrollable content sections (stats, timeline)
<div className="flex gap-3">
  <StatCard label="Quantity" value={displayOrder.quantity.toString()} unit="tons" />
  {/* ... more stats */}
</div>
<div className="flex flex-col gap-4">
  <h3 className="text-text-primary text-sm font-bold">Timeline</h3>
  {/* Timeline items */}
</div>
```

[VERIFIED: OrderDetails.tsx lines 256-322]

**Design equivalent:** Frame with `height: "fill_container"`, nested frames for header (fixed height) and body (remaining space with overflow scroll).

### Pattern 3: Vertical Tank Gauge with Color Zones

**What:** Vertical rectangle representing tank, fill from bottom-to-top, color changes based on threshold percentage
**When to use:** Bin fill level visualization (DSGN-03, D-09, D-10)

**Design structure (.pen):**

```json
{
  "type": "frame",
  "name": "Bin Gauge",
  "width": 60,
  "height": 120,
  "layout": "vertical",
  "children": [
    {
      "type": "frame",
      "name": "Gauge Container",
      "width": 40,
      "height": 100,
      "cornerRadius": 8,
      "stroke": { "fills": [{ "color": "#e2e8f0" }], "thickness": 2 },
      "children": [
        {
          "type": "rectangle",
          "name": "Fill Bar",
          "width": 36,
          "height": 75,
          "fill": "$color.success",
          "cornerRadius": 6,
          "comment": "75% fill = green (normal)"
        },
        {
          "type": "text",
          "content": "75%",
          "fontSize": 10,
          "fontWeight": 700,
          "fill": "#ffffff",
          "textAlign": "center"
        }
      ]
    },
    {
      "type": "text",
      "name": "Location Label",
      "content": "Bin A - Starter",
      "fontSize": 10,
      "fill": "#2d3748"
    }
  ]
}
```

**Color thresholds (from D-10, D-13):**
- Above 30%: `--success` (#48bb78) — green, normal state
- 15-30%: `--warning` (#975a16) — yellow, low state
- Below 15%: `--error` (#e53e3e) — red, critical state

[CITED: docs.pencil.dev/for-developers/the-pen-format for rectangle/fill structure]
[VERIFIED: globals.css lines 19-28 for color token values]

### Pattern 4: Expandable Timeline with Event Types

**What:** Vertical timeline with icon + connector bars, event items expand/collapse for details
**When to use:** Activity timeline in customer detail (D-15)

**Example from OrderDetails.tsx:**

```typescript
function TimelineItem({
  icon: Icon,
  title,
  description,
  date,
  color,
  isPending,
  showConnector,
}: { /* ... */ }) {
  const colors = colorMap[color];

  return (
    <div className="flex items-stretch gap-3.5">
      {/* Left - Icon + Connector */}
      <div className="flex w-9 flex-col items-center">
        <div className={`h-7 w-7 ${colors.bg} flex shrink-0 items-center justify-center rounded-full`}>
          <Icon className={`h-3.5 w-3.5 ${isPending ? 'text-pending' : 'text-white'}`} />
        </div>
        {showConnector && <div className={`w-0.5 flex-1 ${colors.bar}`} />}
      </div>
      {/* Right - Content */}
      <div className="flex flex-1 flex-col gap-0.5 pb-8">
        <span className="text-text-primary text-[13px] font-bold">{title}</span>
        <p className="text-text-secondary text-[11px] leading-relaxed">{description}</p>
        <span className={`text-[10px] font-bold ${colors.text}`}>{date}</span>
      </div>
    </div>
  );
}
```

[VERIFIED: OrderDetails.tsx lines 361-409]

**Design equivalent:** Frame with horizontal layout, left child = icon circle + vertical connector line, right child = text content frame.

### Anti-Patterns to Avoid

- **Horizontal gauge for tanks:** Confuses users expecting vertical tank representation (D-09) — use vertical only [CITED: uinkits.com/blog-post/how-to-use-gauge-elements-in-ui-design]
- **Too many gauge segments:** More than 4 color zones causes visual clutter [CITED: uinkits.com/blog-post/how-to-use-gauge-elements-in-ui-design]
- **Timeline events on alternating sides:** Adds cognitive load for scanning chronological order — use single-side vertical layout [CITED: uxpatterns.dev/patterns/data-display/timeline]
- **Expanded timeline items by default:** Violates progressive disclosure — show summary only, expand on interaction [CITED: uxpatterns.dev/patterns/data-display/timeline]
- **Custom hex colors in designs:** Breaks design token system — always reference CSS variables or use tokens from UI-SPEC (D-13) [VERIFIED: UI-SPEC.md defines complete color system]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table row selection state | Custom click handlers with state management | Existing OrdersTable pattern | Already implements row selection, keyboard navigation, auto-scroll, filtered selection tracking [VERIFIED: OrdersTable.tsx lines 188-246] |
| Search box styling | New input component | Header search pattern (D-16) | Consistent styling, debounced search, placeholder text, icon positioning already established [VERIFIED: Header.tsx lines 93-103] |
| Timeline item layout | Custom timeline component | OrderDetails TimelineItem pattern (D-15) | Icon + connector structure, color mapping, pending state handling already implemented [VERIFIED: OrderDetails.tsx lines 361-409] |
| Design token definitions | Hardcoded colors in .pen files | globals.css variables + UI-SPEC (D-13) | Centralized theme system, semantic naming, ensures consistency across designs and code [VERIFIED: globals.css lines 3-78, UI-SPEC.md lines 62-88] |
| Icon assets | Custom SVG icons | lucide-react library (D-14) | Package, AlertTriangle, Search, Clock, MapPin, Phone, Mail icons already available [VERIFIED: package.json line 14, OrdersTable.tsx line 4, OrderDetails.tsx lines 3-8] |
| Component spacing/sizing | Arbitrary pixel values | UI-SPEC spacing scale | 4px-based scale (xs/sm/md/lg/xl/2xl/3xl) ensures visual consistency [VERIFIED: UI-SPEC.md lines 30-46] |

**Key insight:** Phase 10 is design-only (no code), but designs must reference existing patterns and tokens to ensure implementation phases (12-15) can build components directly from .pen files without inventing new solutions. The UI-SPEC contract is the single source of truth for all visual specifications.

## Common Pitfalls

### Pitfall 1: Hardcoding Colors Instead of Referencing Tokens

**What goes wrong:** Designer uses hex values like #48bb78 directly in .pen files instead of referencing design token variables, leading to inconsistency when tokens change or themes are added.

**Why it happens:** .pen format supports both direct hex values and variable references; hex values are faster to type but bypass the token system.

**How to avoid:**
1. Define variables in .pen file matching globals.css tokens:
   ```json
   "variables": {
     "color.success": { "type": "color", "value": "#48bb78" },
     "color.warning": { "type": "color", "value": "#975a16" },
     "color.error": { "type": "color", "value": "#e53e3e" }
   }
   ```
2. Reference variables in fills: `"fill": "$color.success"` not `"fill": "#48bb78"`

**Warning signs:**
- Hex color values appear in `fill`, `stroke`, or `color` properties without `$` prefix
- Same color value copy-pasted across multiple nodes
- Color changes in globals.css don't reflect in design mockups

[CITED: docs.pencil.dev/for-developers/the-pen-format — variables section]

### Pitfall 2: Designing Interactive States Without State Labels

**What goes wrong:** Designer creates hover/focus/active states but doesn't clearly name frames or variants, making it unclear to implementers which state is which.

**Why it happens:** .pen files don't have built-in state management like Figma variants; states must be organized via frame naming and structure.

**How to avoid:**
1. Use descriptive frame names: "CustomerRow - Default", "CustomerRow - Hover", "CustomerRow - Selected"
2. Group state variations in a parent frame named "Component States"
3. Add `context` metadata to frames explaining interaction:
   ```json
   {
     "type": "frame",
     "name": "Search Box - Focus",
     "context": "Focus state: border changes to primary, ring appears"
   }
   ```

**Warning signs:**
- Multiple similar-looking frames without clear naming differences
- No documentation of which design shows which interaction state
- Implementer asks "What's the difference between these two designs?"

[CITED: UI-SPEC.md lines 176-188 — Interaction States table shows expected states]

### Pitfall 3: Inconsistent Spacing Values

**What goes wrong:** Designs use spacing values like 14px or 18px that don't align with the 4px-based spacing scale, causing implementation drift and visual inconsistency.

**Why it happens:** Designer eyeballs spacing or uses arbitrary values without checking the spacing scale in UI-SPEC.

**How to avoid:**
1. Reference spacing scale from UI-SPEC: xs(4), sm(8), md(16), lg(24), xl(32), 2xl(48), 3xl(64)
2. Define spacing variables in .pen file:
   ```json
   "variables": {
     "spacing.sm": { "type": "number", "value": 8 },
     "spacing.md": { "type": "number", "value": 16 }
   }
   ```
3. Use variables for gap, padding: `"gap": "$spacing.md"` or direct multiples of 4

**Warning signs:**
- Padding/gap values ending in non-multiples of 4 (10px, 14px, 18px)
- Visual alignment feels "off" when comparing to existing components
- Developer asks "What's the correct spacing here?"

[VERIFIED: UI-SPEC.md lines 30-46 defines spacing scale; OrdersTable.tsx uses consistent spacing]

### Pitfall 4: Designing Beyond Phase Scope

**What goes wrong:** Designer adds features or screens not in DSGN-01/02/03 requirements (e.g., edit customer form, bin alert settings, customer filters), causing scope creep.

**Why it happens:** Natural inclination to design complete flows, but Phase 10 is strictly limited to list view, detail page, and bin visualization.

**How to avoid:**
1. Check CONTEXT.md deferred ideas — features explicitly out of scope
2. Validate each component against REQUIREMENTS.md: does it map to DSGN-01, DSGN-02, or DSGN-03?
3. If tempted to add a feature, note it in design comments for future phases but don't create screens

**Warning signs:**
- .pen file contains more than 2 main screens (customers list + customer detail)
- Design shows forms, modals, or settings panels not mentioned in requirements
- Reviewer says "That looks great but it's not in scope for this phase"

[VERIFIED: REQUIREMENTS.md lines 10-14 define exactly 3 design requirements; CONTEXT.md lines 98-104 show no deferred ideas]

### Pitfall 5: Misinterpreting Existing Patterns

**What goes wrong:** Designer looks at OrdersTable but misses key details like row selection state, keyboard navigation indicators, or auto-scroll behavior, creating an incomplete design.

**Why it happens:** Code includes behavior (hover, click, keyboard) that's not always visible in static screenshots; designer sees layout but not interaction logic.

**How to avoid:**
1. Read the pattern source code (OrdersTable.tsx, OrderDetails.tsx) to understand all states
2. Reference UI-SPEC Interaction States table (lines 176-188) for expected behaviors
3. Create design frames for EVERY state: default, hover, selected/active, focus, empty
4. Add interaction notes in .pen frame context properties

**Warning signs:**
- Design only shows default state, no hover or selected variants
- Timeline design doesn't show expanded vs collapsed states
- Search box design missing focus state with ring/border change

[VERIFIED: OrdersTable.tsx lines 379-387 show hover and selected state styling; OrderDetails timeline has collapsed/expanded states]

## Code Examples

Since Phase 10 is design-only, code examples show the **reference patterns** from existing components that designs should mirror, not code to write.

### Customer List Table Structure (Reference: OrdersTable.tsx)

```typescript
// Table header with uppercase labels, 10px font, secondary text color
<div className="flex py-2.5">
  <div className="text-text-secondary flex-1 text-[10px] font-bold">
    CUSTOMER NAME
  </div>
  <div className="text-text-secondary flex-1 text-[10px] font-bold">
    STATUS
  </div>
</div>

// Table row with hover and selected states
<div
  onClick={() => handleSelectOrder(order.id)}
  className={`flex cursor-pointer items-center py-3 transition-colors
    ${validSelectedId === order.id ? 'bg-primary/10' : 'hover:bg-gray-50'}`}
>
  <div className="text-text-primary flex-1 text-xs">
    {order.customer}
  </div>
  <div className="flex-1">
    {/* Stacked status indicators: orders badge + changes dot + bin alert */}
  </div>
</div>
```

**Design should show:**
- Header row with uppercase 10px bold text in --text-secondary
- Data row with 12px text in --text-primary
- Hover state: bg-gray-50
- Selected state: bg-primary/10 (10% opacity)

[VERIFIED: OrdersTable.tsx lines 333-428]

### Search Box Styling (Reference: Header.tsx)

```typescript
<div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
  <Search className="text-text-secondary h-4 w-4" />
  <input
    type="text"
    placeholder="Type here..."
    className="placeholder:text-text-secondary w-32 bg-transparent text-xs outline-none"
  />
</div>
```

**Design should show:**
- White background with subtle shadow
- 8px gap between icon and input
- 12px horizontal padding, 8px vertical padding
- Search icon 16x16 in secondary color
- Placeholder text in --text-secondary
- Focus state: border-primary ring-primary (from UI-SPEC)

[VERIFIED: Header.tsx lines 93-103]
[VERIFIED: UI-SPEC.md lines 133-136 defines CustomerSearchBox matching Header pattern]

### Timeline Item Pattern (Reference: OrderDetails.tsx)

```typescript
<div className="flex items-stretch gap-3.5">
  {/* Left: Icon + Connector */}
  <div className="flex w-9 flex-col items-center">
    <div className={`h-7 w-7 ${colors.bg} flex shrink-0 items-center justify-center rounded-full`}>
      <Icon className={`h-3.5 w-3.5 text-white`} />
    </div>
    {showConnector && <div className={`w-0.5 flex-1 ${colors.bar}`} />}
  </div>

  {/* Right: Content */}
  <div className="flex flex-1 flex-col gap-0.5 pb-8">
    <span className="text-text-primary text-[13px] font-bold">Order Placed</span>
    <p className="text-text-secondary text-[11px] leading-relaxed">Order received from Customer Name</p>
    <span className="text-[10px] font-bold text-primary">Jan 5, 2026 · 3:45 PM</span>
  </div>
</div>
```

**Design should show:**
- Left: 28px circle with icon, 2px vertical connector below
- Right: Title (13px bold), description (11px regular), timestamp (10px bold)
- 14px gap between icon and content
- 32px bottom padding per item
- Color variants: primary, success, error, pending (from colorMap)

[VERIFIED: OrderDetails.tsx lines 361-409]

### Bin Gauge Color Logic (Threshold Mapping)

```typescript
// Color selection based on fill percentage (design should show 3 variants)
const getBinColor = (fillPercentage: number): string => {
  if (fillPercentage >= 30) return 'var(--success)';    // Green: normal
  if (fillPercentage >= 15) return 'var(--warning)';    // Yellow: low
  return 'var(--error)';                                 // Red: critical
};
```

**Design should show 3 bin gauge variants:**
1. 75% fill → green (#48bb78) — "Normal" state
2. 22% fill → yellow (#975a16) — "Low" state
3. 8% fill → red (#e53e3e) — "Critical" state

Each with percentage text inside gauge, location + feed type label below.

[VERIFIED: globals.css lines 19-28 for token values]
[DECISION: D-10, D-12 from CONTEXT.md]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static design handoff (PNG/PDF) | Live .pen files in git | Project start (pre-Phase 1) | Designs version-controlled alongside code, no export step, direct reference during implementation [VERIFIED: 4 existing .pen files in designs/] |
| Hardcoded hex colors | CSS custom properties (design tokens) | Project start (globals.css created) | Centralized theming, semantic color names, easy theme changes [VERIFIED: globals.css defines 40+ tokens] |
| Generic icon libraries | lucide-react standard | Project start (package.json) | Consistent icon style, tree-shakeable, TypeScript types [VERIFIED: package.json line 14 shows lucide-react 0.577.0] |
| Manual spacing eyeballing | 4px-based spacing scale | Phase 9 (UI-SPEC created) | Mathematical consistency, easier responsive scaling [VERIFIED: UI-SPEC.md lines 30-46] |
| 10/11/12/14px type scale | 10/12/16/20px simplified scale | Phase 9 (UI-SPEC revised) | Clearer hierarchy, minimum 2px jumps between sizes [VERIFIED: UI-SPEC.md lines 50-60] |

**Deprecated/outdated:**
- Separate design tool handoff (Figma exports): Project uses in-repo .pen files exclusively
- Custom FilterPill color configs per component: STATUS_PILL_CONFIG pattern now standard for all filter interfaces [VERIFIED: OrdersTable.tsx lines 12-43]
- Arbitrary component sizing: All components now reference spacing scale and design tokens

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Sketch is macOS-only and proprietary | Standard Stack - Alternatives | Low: doesn't affect Pencil.dev choice, informational only |
| A2 | Adobe XD discontinued in 2023 | Standard Stack - Alternatives | Low: historical fact, doesn't affect current design work |
| A3 | Penpot has high switching costs | Standard Stack - Alternatives | Low: project already committed to Pencil.dev |

**All other claims verified via:** existing .pen files, package.json, globals.css, OrdersTable.tsx, OrderDetails.tsx, Header.tsx, UI-SPEC.md, Pencil.dev documentation.

## Open Questions

None. All design decisions locked in CONTEXT.md, all patterns established in existing components, all specifications defined in UI-SPEC.md.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Pencil.dev (IDE extension or desktop app) | Design file creation | Unknown (external tool) | 2.8+ | Manual JSON editing (not recommended) |
| Text editor (VSCode/any) | .pen file editing | ✓ | — | — |
| Git | Version control for .pen files | ✓ | — | — |

**Missing dependencies with no fallback:**
- None critical: .pen files are JSON, can be edited in any text editor if Pencil.dev unavailable

**Missing dependencies with fallback:**
- Pencil.dev IDE extension: Can use Pencil.dev desktop application or manual JSON editing (fallback viable but inefficient)

**Note:** Phase 10 has no runtime dependencies (no code execution, no build step). Availability check focuses on design tooling only.

## Security Domain

**Skipped:** Phase 10 is design-only with no code execution, data processing, or user input handling. Security requirements apply to implementation phases (12-15), not design artifact creation.

Design files (.pen) are JSON text files in version control — standard git security practices apply (code review, signed commits if required by project).

## Sources

### Primary (HIGH confidence)

- [Pencil.dev Documentation - .pen Format](https://docs.pencil.dev/for-developers/the-pen-format) - Complete JSON structure specification
- [Pencil.dev Documentation - .pen Files](https://docs.pencil.dev/core-concepts/pen-files) - Version control best practices
- Existing .pen files: designs/order-dashboard.pen, designs/mill-production.pen — Version 2.8 structure examples [VERIFIED]
- OrdersTable.tsx — Table row pattern, search box, filter pills [VERIFIED: lines 1-430]
- OrderDetails.tsx — Timeline pattern, header layout, stat cards [VERIFIED: lines 1-411]
- Header.tsx — Search box styling reference [VERIFIED: lines 1-142]
- globals.css — Design token definitions [VERIFIED: lines 1-128]
- UI-SPEC.md — Complete design contract for Phase 10 [VERIFIED: lines 1-250]
- CONTEXT.md — All user decisions (D-01 through D-16) [VERIFIED: lines 1-109]
- REQUIREMENTS.md — Phase requirements DSGN-01, DSGN-02, DSGN-03 [VERIFIED: lines 10-14]
- package.json — lucide-react version 0.577.0 [VERIFIED: line 14]

### Secondary (MEDIUM confidence)

- [UIKits - How To Use Gauge Elements in UI Design](https://www.uinkits.com/blog-post/how-to-use-gauge-elements-in-ui-design) - Gauge visualization best practices
- [UX Patterns - Timeline Pattern](https://uxpatterns.dev/patterns/data-display/timeline) - Timeline design patterns
- [Pencil Project Official Site](https://pencil.evolus.vn/) - Open-source prototyping tool (different from Pencil.dev)

### Tertiary (LOW confidence)

None — all design claims verified against project files or official Pencil.dev documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified via existing .pen files, package.json, project structure
- Architecture: HIGH - Verified via OrdersTable, OrderDetails, Header source code and UI-SPEC
- Pitfalls: MEDIUM-HIGH - Derived from Pencil.dev documentation and UI design best practices; pit-specific to this project verified via CONTEXT.md decisions

**Research date:** 2026-05-01
**Valid until:** 60 days (design tools and patterns stable; .pen format reserves right to introduce breaking changes but project uses 2.8 which is established)

**Phase-specific notes:**
- This is a design-only phase — no code written, no tests, no runtime behavior
- Success measured by design file completeness and approval, not functionality
- Implementation phases (12-15) will consume these designs to build actual components
- Validation Architecture section skipped: `nyquist_validation: false` in .planning/config.json
