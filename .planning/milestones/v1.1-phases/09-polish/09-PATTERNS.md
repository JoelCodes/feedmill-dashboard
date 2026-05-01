# Phase 9: Polish - Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 2 new/modified files
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/globals.css` | config | — | `src/app/globals.css` (self) | exact |
| `src/app/mill-production/page.tsx` | page component | request-response + client state | `src/components/ui/StatusBadge.tsx` | role-match |

## Pattern Assignments

### `src/app/globals.css` (config, design tokens)

**Analog:** `src/app/globals.css` (existing token definitions)

**Current structure** (lines 1-53):
```css
@import "tailwindcss";

:root {
  /* Primary Colors */
  --primary: #4fd1c5;
  --primary-dark: #38b2ac;

  /* Background Colors */
  --bg-page: #f8f9fa;
  --bg-card: #ffffff;
  --bg-sidebar: #ffffff;

  /* Text Colors */
  --text-primary: #2d3748;
  --text-secondary: #a0aec0;
  --text-white: #ffffff;

  /* Status Colors */
  --success: #48bb78;
  --success-dark: #2f855a;
  --success-light: #c6f6d5;

  --warning: #975a16;
  --warning-light: #fefcbf;

  --error: #e53e3e;
  --error-dark: #c53030;
  --error-light: #fed7d7;

  --info: #2b6cb0;
  --info-light: #bee3f8;

  --purple: #9333ea;
  --purple-dark: #7e22ce;
  --purple-light: #f3e8ff;

  /* Pending Colors */
  --pending: #cbd5e0;
  --pending-light: #edf2f7;

  /* Borders & Dividers */
  --divider: #e2e8f0;

  /* Shadows */
  --shadow-sm: 0 3.5px 5px rgba(0, 0, 0, 0.02);
  --shadow-card: 0 3.5px 5px rgba(0, 0, 0, 0.03);

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 15px;
}
```

**@theme inline mapping pattern** (lines 55-78):
```css
@theme inline {
  --color-primary: var(--primary);
  --color-primary-dark: var(--primary-dark);
  --color-bg-page: var(--bg-page);
  --color-bg-card: var(--bg-card);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-success: var(--success);
  --color-success-dark: var(--success-dark);
  --color-success-light: var(--success-light);
  --color-warning: var(--warning);
  --color-warning-light: var(--warning-light);
  --color-error: var(--error);
  --color-error-dark: var(--error-dark);
  --color-error-light: var(--error-light);
  --color-info: var(--info);
  --color-info-light: var(--info-light);
  --color-purple: var(--purple);
  --color-purple-dark: var(--purple-dark);
  --color-purple-light: var(--purple-light);
  --color-pending: var(--pending);
  --color-pending-light: var(--pending-light);
  --color-divider: var(--divider);
}
```

**New tokens to add:**

Per decisions D-01 through D-06, add these tokens to the `:root` block after existing status colors:

```css
:root {
  /* ... existing tokens ... */

  /* NEW: Status-specific color tokens (D-01, D-02, D-03) */
  --status-completed-border: #38a169;
  --status-completed-header: #276749;
  --status-completed-bg-22: #2f855a38;  /* 22% opacity via hex alpha */

  --status-mixing-border: #d69e2e;
  --status-mixing-header: #975a16;
  --status-mixing-bg-22: #975a1638;

  --status-blocked-border: #e53e3e;
  --status-blocked-header: #c53030;
  --status-blocked-bg-22: #c5303038;

  --status-pending-border: #a0aec0;
  --status-pending-header: #4a5568;
  --status-pending-bg-22: #71809638;

  /* NEW: Typography tokens (D-05, D-06) */
  --text-11: 0.6875rem;  /* 11px */
  --text-15: 0.9375rem;  /* 15px */

  /* NEW: Text color tokens (D-10, D-11) */
  --text-muted: #718096;
  --text-medium: #4a5568;
}
```

Add these mappings to the `@theme inline` block:

```css
@theme inline {
  /* ... existing mappings ... */

  /* NEW: Status color utilities */
  --color-status-completed-border: var(--status-completed-border);
  --color-status-completed-header: var(--status-completed-header);
  --color-status-mixing-border: var(--status-mixing-border);
  --color-status-mixing-header: var(--status-mixing-header);
  --color-status-blocked-border: var(--status-blocked-border);
  --color-status-blocked-header: var(--status-blocked-header);
  --color-status-pending-border: var(--status-pending-border);
  --color-status-pending-header: var(--status-pending-header);

  /* NEW: Typography utilities */
  --text-card-label: var(--text-11);
  --text-card-title: var(--text-15);

  /* NEW: Text color utilities */
  --color-text-muted: var(--text-muted);
  --color-text-medium: var(--text-medium);
}
```

---

### `src/app/mill-production/page.tsx` (page component, request-response + client state)

**Analogs:**
- `src/components/ui/StatusBadge.tsx` (status color config pattern)
- `src/components/FilterPill.tsx` (color prop usage)
- `src/components/KPICard.tsx` (shadow-card usage)

#### Pattern 1: Status Color Config with CSS Variables

**Analog:** `src/components/ui/StatusBadge.tsx` (lines 11-47)

StatusBadge shows the pattern of using CSS variables in arbitrary value syntax for colors:

```typescript
export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  "Producing": {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
    countBg: "bg-[#975a1622]",  // Hardcoded hex with opacity
    label: "Producing"
  },
  "Complete": {
    bg: "bg-[var(--success-light)]",
    text: "text-[var(--success-dark)]",
    dot: "bg-[var(--success-dark)]",
    countBg: "bg-[#2f855a22]",  // Hardcoded hex with opacity
    label: "Complete"
  }
};
```

**Apply to:** `STATE_COLORS` object (lines 21-29)

**Current code:**
```typescript
const STATE_COLORS: Record<
  ProductionState,
  { border: string; header: string }
> = {
  Completed: { border: "#38a169", header: "#276749" },
  Mixing: { border: "#d69e2e", header: "#975a16" },
  Blocked: { border: "#e53e3e", header: "#c53030" },
  Pending: { border: "#a0aec0", header: "#4a5568" },
};
```

**Replace with:**
```typescript
const STATE_COLORS: Record<
  ProductionState,
  { border: string; header: string }
> = {
  Completed: {
    border: "var(--status-completed-border)",
    header: "var(--status-completed-header)",
  },
  Mixing: {
    border: "var(--status-mixing-border)",
    header: "var(--status-mixing-header)",
  },
  Blocked: {
    border: "var(--status-blocked-border)",
    header: "var(--status-blocked-header)",
  },
  Pending: {
    border: "var(--status-pending-border)",
    header: "var(--status-pending-header)",
  },
};
```

---

#### Pattern 2: Filter Pill countBg with CSS Variable Arbitrary Values

**Analog:** `src/components/ui/StatusBadge.tsx` (lines 23, 44)

StatusBadge uses hardcoded hex with opacity in countBg — same pattern to replace:

```typescript
countBg: "bg-[#975a1622]",  // BEFORE
countBg: "bg-[var(--status-mixing-bg-22)]",  // AFTER
```

**Apply to:** `PRODUCTION_STATE_PILL_CONFIG` object (lines 31-56)

**Current code:**
```typescript
const PRODUCTION_STATE_PILL_CONFIG: Record<ProductionState, FilterPillColorConfig> = {
  Completed: {
    bg: "bg-success-light",
    text: "text-success-dark",
    dot: "bg-success",
    countBg: "bg-[#2f855a22]",  // HARDCODED
  },
  Mixing: {
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
    countBg: "bg-[#975a1622]",  // HARDCODED
  },
  Blocked: {
    bg: "bg-error-light",
    text: "text-error-dark",
    dot: "bg-error",
    countBg: "bg-[#c5303022]",  // HARDCODED
  },
  Pending: {
    bg: "bg-pending-light",
    text: "text-[#718096]",  // HARDCODED TEXT COLOR
    dot: "bg-pending",
    countBg: "bg-[#71809622]",  // HARDCODED
  },
};
```

**Replace with:**
```typescript
const PRODUCTION_STATE_PILL_CONFIG: Record<ProductionState, FilterPillColorConfig> = {
  Completed: {
    bg: "bg-success-light",
    text: "text-success-dark",
    dot: "bg-success",
    countBg: "bg-[var(--status-completed-bg-22)]",
  },
  Mixing: {
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
    countBg: "bg-[var(--status-mixing-bg-22)]",
  },
  Blocked: {
    bg: "bg-error-light",
    text: "text-error-dark",
    dot: "bg-error",
    countBg: "bg-[var(--status-blocked-bg-22)]",
  },
  Pending: {
    bg: "bg-pending-light",
    text: "text-muted",  // Use new token instead of hardcoded
    dot: "bg-pending",
    countBg: "bg-[var(--status-pending-bg-22)]",
  },
};
```

---

#### Pattern 3: Shadow Token Usage

**Analog:** `src/components/KPICard.tsx` (line 61)

KPICard uses inline shadow value matching our --shadow-sm token:

```tsx
<div className="... shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
```

For ProductionCard, replace inline boxShadow with shadow-card class.

**Apply to:** `ProductionCard` component (lines 65-94)

**Current code:**
```tsx
function ProductionCard({ order }: { order: ProductionOrder }) {
  const borderColor = STATE_COLORS[order.state].border;

  return (
    <div
      className="relative overflow-hidden rounded-r-xl bg-white"
      style={{
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",  // INLINE STYLE
      }}
    >
      {/* ... */}
    </div>
  );
}
```

**Replace with:**
```tsx
function ProductionCard({ order }: { order: ProductionOrder }) {
  const borderColor = STATE_COLORS[order.state].border;

  return (
    <div className="relative overflow-hidden rounded-r-xl bg-white shadow-card">
      {/* ... */}
    </div>
  );
}
```

**Note:** Current inline shadow is `0 2px 8px rgba(0,0,0,0.05)`, existing token is `0 3.5px 5px rgba(0,0,0,0.03)`. Using existing token for consistency (per D-07).

---

#### Pattern 4: Typography Token Classes

**Analog:** `src/components/FilterPill.tsx` (line 51)

FilterPill uses hardcoded text size with arbitrary value:

```tsx
<span className={`text-[11px] font-bold ${textClass}`}>{label}</span>
```

**Apply to:** `ProductionCard` component text elements (lines 80, 83, 86, 89)

**Current code:**
```tsx
<div className="py-2.5 pl-5 pr-4">
  <p className="text-[11px] font-semibold text-[#718096]">
    {order.orderNumber}
  </p>
  <p className="mt-1 text-[15px] font-bold text-[#2d3748]">
    {order.customer}
  </p>
  <p className="mt-2 text-sm font-medium text-[#4a5568]">
    {order.weightLbs.toLocaleString()} lbs &bull; {order.product}
  </p>
  <p className="mt-1.5 text-xs font-medium text-[#718096]">
    Delivery: {order.deliveryTime}
  </p>
</div>
```

**Replace with:**
```tsx
<div className="py-2.5 pl-5 pr-4">
  <p className="text-card-label font-semibold text-muted">
    {order.orderNumber}
  </p>
  <p className="mt-1 text-card-title font-bold text-primary">
    {order.customer}
  </p>
  <p className="mt-2 text-sm font-medium text-medium">
    {order.weightLbs.toLocaleString()} lbs &bull; {order.product}
  </p>
  <p className="mt-1.5 text-xs font-medium text-muted">
    Delivery: {order.deliveryTime}
  </p>
</div>
```

**Token mapping:**
- `text-[11px]` → `text-card-label` (new --text-11 token)
- `text-[15px]` → `text-card-title` (new --text-15 token)
- `text-[#718096]` → `text-muted` (new --text-muted token)
- `text-[#2d3748]` → `text-primary` (existing --text-primary token)
- `text-[#4a5568]` → `text-medium` (new --text-medium token)

---

#### Pattern 5: StateSection Header Color

**Apply to:** `StateSection` component header (line 112)

**Current code:**
```tsx
<span className="text-xl font-bold" style={{ color: headerColor }}>
  {state}
</span>
```

**Replace with:** Keep inline style (headerColor is dynamic CSS variable)

```tsx
<span className="text-xl font-bold" style={{ color: headerColor }}>
  {state}
</span>
```

**Rationale:** `headerColor` comes from `STATE_COLORS[state].header` which is now a CSS variable string like `"var(--status-completed-header)"`. Inline style is appropriate here since the value is dynamic per state.

---

#### Pattern 6: MillColumn Text Colors

**Apply to:** `MillColumn` component (lines 151-153)

**Current code:**
```tsx
<div>
  <h2 className="text-2xl font-bold text-[#2d3748]">{millLine}</h2>
  <p className="mt-1 text-base font-semibold text-[#718096]">
    {formatWeight(completedWeight)} / {formatWeight(totalWeight)} lbs
  </p>
</div>
```

**Replace with:**
```tsx
<div>
  <h2 className="text-2xl font-bold text-primary">{millLine}</h2>
  <p className="mt-1 text-base font-semibold text-muted">
    {formatWeight(completedWeight)} / {formatWeight(totalWeight)} lbs
  </p>
</div>
```

---

#### Pattern 7: StateSection Weight Text Color

**Apply to:** `StateSection` component (line 115)

**Current code:**
```tsx
<span className="text-base font-medium text-[#718096]">
  {formatWeight(totalWeight)}
</span>
```

**Replace with:**
```tsx
<span className="text-base font-medium text-muted">
  {formatWeight(totalWeight)}
</span>
```

---

## Shared Patterns

### CSS Custom Properties in :root

**Source:** `src/app/globals.css`
**Apply to:** All new design tokens

**Pattern:**
1. Define raw value in `:root` block with semantic name
2. Map to Tailwind utility in `@theme inline` block using `var(--token-name)`
3. Use `inline` variant when mapping variable to variable (required for CSS variable resolution)

**Example:**
```css
:root {
  --status-completed-border: #38a169;  /* Raw value */
}

@theme inline {
  --color-status-completed-border: var(--status-completed-border);  /* Map to utility */
}
```

**Usage in components:**
```tsx
// Option 1: Tailwind utility (preferred when available)
<div className="border-status-completed-border" />

// Option 2: Arbitrary value with CSS variable (when utility doesn't exist)
<div className="bg-[var(--status-completed-bg-22)]" />

// Option 3: Inline style (for dynamic values from JavaScript)
<div style={{ backgroundColor: borderColor }} />
```

---

### Hex Alpha Channel for Opacity

**Source:** `src/components/ui/StatusBadge.tsx` (lines 23, 30, 37, 44)
**Apply to:** All countBg tokens with 22% opacity

**Pattern:**
- 22% opacity = 0.22 × 255 ≈ 56 decimal = 0x38 hex
- Append hex alpha channel to base color: `#rrggbbaa`

**Examples:**
- `#2f855a` + 22% opacity = `#2f855a38`
- `#975a16` + 22% opacity = `#975a1638`
- `#c53030` + 22% opacity = `#c5303038`
- `#718096` + 22% opacity = `#71809638`

---

### Semantic Typography Token Naming

**Source:** RESEARCH.md recommendations, Claude's discretion (D-05)
**Apply to:** Custom text size tokens

**Pattern:**
- Use semantic names describing usage context over technical pixel values
- `text-card-label` > `text-11` (clearer intent)
- `text-card-title` > `text-15` (clearer intent)

**Rationale:** Future maintainers understand "card label" better than "11px" when deciding which token to use for new text elements.

---

## No Analog Found

None — all patterns have existing analogs in the codebase.

---

## Metadata

**Analog search scope:**
- `src/app/**/*.tsx`
- `src/app/globals.css`
- `src/components/**/*.tsx`

**Files scanned:** 19
**Pattern extraction date:** 2026-04-29

**Key pattern sources:**
- Design token structure: `src/app/globals.css` (existing @theme inline pattern)
- Status config pattern: `src/components/ui/StatusBadge.tsx` (CSS variable usage in color configs)
- Shadow token usage: `src/components/KPICard.tsx` (shadow-card class)
- Typography arbitrary values: `src/components/FilterPill.tsx` (text-[11px] pattern)

**Coverage:**
- 15 hardcoded color instances → CSS variables
- 3 custom text sizes → typography tokens
- 1 inline shadow → shadow-card token
- 6 text color instances → text color tokens
