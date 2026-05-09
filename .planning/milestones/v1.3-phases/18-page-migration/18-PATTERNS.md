# Phase 18: Page Migration - Pattern Map

**Mapped:** 2026-05-07
**Files analyzed:** 13 files to create/modify
**Analogs found:** 13 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/settings/page.tsx` | page | request-response | `src/components/ui/Select.tsx` | role-match |
| `src/app/mill-production/page.tsx` | page | CRUD | `src/components/ui/Card.tsx` | role-match |
| `src/app/orders/page.tsx` | page | CRUD | `src/components/ui/Card.tsx` | role-match |
| `src/app/customers/page.tsx` | page | CRUD | `src/components/ui/Card.tsx` | role-match |
| `src/components/OrdersTable.tsx` | component | CRUD | `src/components/ui/StatusBadge.tsx` | exact |
| `src/components/OrderDetails.tsx` | component | request-response | `src/components/ui/Card.tsx` | role-match |
| `src/components/KPICard.tsx` | component | display | `src/components/ui/Card.tsx` | exact |
| `src/components/Header.tsx` | component | request-response | `src/components/ui/Input.tsx` | role-match |
| `src/components/Sidebar.tsx` | component | navigation | `src/components/ui/Button.tsx` | role-match |
| `src/components/FilterPill.tsx` → `src/components/ui/FilterPill.tsx` | component | filter | `src/components/ui/StatusBadge.tsx` | exact |
| `src/components/BinGauge.tsx` → `src/components/ui/Gauge.tsx` | component | display | `src/components/ui/StatusBadge.tsx` | role-match |
| `src/components/ActivityTimeline.tsx` → `src/components/ui/Timeline.tsx` | component | display | `src/components/ui/Card.tsx` | role-match |
| Hardcoded Value Mapping Table | reference | — | `src/app/globals.css` | token-source |

## Pattern Assignments

### `src/app/settings/page.tsx` (page, request-response)

**Analog:** `src/components/ui/Select.tsx` + `src/components/ui/Button.tsx`

**Current state:** Uses native HTML inputs and hardcoded border colors

**Imports pattern** (from Select.tsx lines 1-3):
```typescript
import { cn } from "@/lib/utils";
import { ChevronDown, AlertCircle } from "lucide-react";
import { useId } from "react";
```

**Design system component usage** (from Select.tsx lines 12-55):
```typescript
// Replace native <select> with design system Select
import Select from "@/components/ui/Select";

// OLD: Native select with hardcoded styles
<select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</select>

// NEW: Design system Select component
<Select
  label="Theme"
  options={[
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
  ]}
  value={formState.theme}
  onChange={(e) => updateTheme(e.target.value as 'light' | 'dark')}
/>
```

**Button pattern** (from Button.tsx lines 40-62):
```typescript
import Button from "@/components/ui/Button";

// OLD: Native button with hardcoded styles
<button className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50">
  Save Preferences
</button>

// NEW: Design system Button component
<Button
  variant="primary"
  disabled={!hasChanges}
  onClick={handleSave}
>
  Save Preferences
</Button>
```

**Token replacement for remaining elements** (lines 53, 59-99):
```typescript
// Replace hardcoded bg-bg-page (already uses token - keep as is)
<div className="flex h-screen bg-bg-page">

// Native checkboxes: Replace hardcoded h-4 w-4 with tokens if needed
// Note: Checkbox styling may remain as-is since no Checkbox component exists yet
```

---

### `src/app/mill-production/page.tsx` (page, CRUD)

**Analog:** `src/components/ui/Card.tsx`

**Current state:** Uses custom ProductionCard with hardcoded border radius and shadow, inline styles for colors

**Card compound pattern** (from Card.tsx lines 25-44):
```typescript
import Card from "@/components/ui/Card";

// OLD: Custom div with hardcoded styles (lines 81-101)
<div className="relative overflow-hidden rounded-r-xl bg-white shadow-card">
  <div
    className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
    style={{ backgroundColor: borderColor }}
  />
  <div className="py-2.5 pl-5 pr-4">
    {/* content */}
  </div>
</div>

// NEW: Card component with border accent via custom className
<Card className="relative overflow-hidden">
  <div
    className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius-md)]"
    style={{ backgroundColor: borderColor }}
  />
  <Card.Content className="py-2.5 pl-5 pr-4">
    {/* content */}
  </Card.Content>
</Card>
```

**Token usage for inline styles** (lines 78-100):
```typescript
// Keep inline style for dynamic border color (uses token variables already)
// Line 84: style={{ backgroundColor: borderColor }} where borderColor = STATE_COLORS[order.state].border
// STATE_COLORS already uses tokens (lines 26-40) - no change needed

// Line 119: Inline style for header color
// OLD: style={{ color: headerColor }}
// NEW: Keep inline style (uses token variable from STATE_COLORS)
```

**FilterPill import update** (line 12):
```typescript
// OLD: import FilterPill from "@/components/FilterPill";
// NEW: import FilterPill from "@/components/ui/FilterPill";
```

**Skeleton pattern** (lines 182-190):
```typescript
// Replace hardcoded gray-200 with token
// OLD: bg-gray-200
// NEW: bg-[var(--bg-page)] or create --skeleton-bg token
```

---

### `src/app/orders/page.tsx` (page, CRUD)

**Analog:** `src/components/ui/Card.tsx`

**Current state:** Wrapper page with minimal hardcoded styles - only rounded-[15px] in Suspense fallback

**Token replacement** (line 36):
```typescript
// OLD: rounded-[15px]
// NEW: rounded-[var(--radius-xl)]

<Suspense fallback={<div className="flex-1 animate-pulse rounded-[var(--radius-xl)] bg-gray-100" />}>
```

**Background token** (line 36):
```typescript
// OLD: bg-gray-100
// NEW: bg-[var(--bg-page)]
```

---

### `src/app/customers/page.tsx` (page, CRUD)

**Analog:** `src/components/ui/Card.tsx` + `src/components/ui/Input.tsx`

**Current state:** Uses hardcoded border radius [15px], hardcoded shadow, hardcoded border colors

**Card wrapper** (lines 78-161):
```typescript
import Card from "@/components/ui/Card";

// OLD: Custom card div (line 78)
<div className="flex flex-1 flex-col rounded-[15px] bg-white p-5 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">

// NEW: Card component
<Card className="flex flex-1 flex-col">
  <Card.Content className="p-5">
    {/* existing content */}
  </Card.Content>
</Card>
```

**Input pattern** (lines 89-96):
```typescript
import Input from "@/components/ui/Input";

// Option 1: Use Input component wrapper
<Input
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search customers by name..."
  className="pl-10"
/>

// Option 2: Keep native input with token-based borders
<input
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search customers by name..."
  className="border-[var(--divider)] focus:border-[var(--primary)] focus:ring-[var(--primary)] w-full rounded-lg border py-2 pr-3 pl-10 text-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none"
/>
```

**Token replacements** (lines 88-94):
```typescript
// Line 88: Search icon color
// OLD: text-gray-400
// NEW: text-[var(--text-secondary)]

// Line 94: Border and focus colors
// OLD: border-divider focus:border-primary focus:ring-primary (already using tokens via Tailwind config)
// Verify Tailwind config maps these or use explicit var(--) syntax

// Line 94: Placeholder color
// OLD: placeholder:text-gray-400
// NEW: placeholder:text-[var(--text-secondary)]
```

**Hover state** (line 110):
```typescript
// OLD: hover:bg-gray-50
// NEW: hover:bg-[var(--bg-page)]
```

**Inline style colors** (lines 125, 129, 145, 152):
```typescript
// Lines 125, 129: Package icon and count color
// Already uses: style={{ color: 'var(--primary)' }} - KEEP AS IS

// Lines 145, 152: AlertTriangle colors
// Already uses: style={{ color: 'var(--warning)' }} and style={{ color: 'var(--error)' }}
// KEEP AS IS
```

**Skeleton** (lines 19, 23):
```typescript
// OLD: bg-gray-200
// NEW: bg-[var(--bg-page)]
```

---

### `src/components/OrdersTable.tsx` (component, CRUD)

**Analog:** `src/components/ui/StatusBadge.tsx`

**Current state:** Has hardcoded hex values in STATUS_PILL_CONFIG (line 23: #f59e0b22, etc.)

**Token usage pattern from StatusBadge** (StatusBadge.tsx lines 11-47):
```typescript
// Apply same token pattern to STATUS_PILL_CONFIG

// OLD (lines 12-43):
const STATUS_PILL_CONFIG: Record<OrderStatus, FilterPillColorConfig> = {
  "Pending": {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-600",
    countBg: "bg-gray-200",
  },
  "Producing": {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
    countBg: "bg-[#f59e0b22]",  // ❌ HARDCODED HEX
  },
  // ... more with hardcoded hex
};

// NEW: Replace all hardcoded values with tokens
const STATUS_PILL_CONFIG: Record<OrderStatus, FilterPillColorConfig> = {
  "Pending": {
    bg: "bg-[var(--pending-light)]",
    text: "text-[var(--text-secondary)]",
    dot: "bg-[var(--pending)]",
    countBg: "bg-[var(--status-pending-bg-22)]",
  },
  "Producing": {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
    countBg: "bg-[var(--status-mixing-bg-22)]",
  },
  "Ready": {
    bg: "bg-[var(--info-light)]",
    text: "text-[var(--info)]",
    dot: "bg-[var(--info)]",
    countBg: "bg-[color-mix(in_srgb,var(--info)_13%,transparent)]",
  },
  "In Transit": {
    bg: "bg-[var(--purple-light)]",
    text: "text-[var(--purple)]",
    dot: "bg-[var(--purple)]",
    countBg: "bg-[color-mix(in_srgb,var(--purple)_13%,transparent)]",
  },
  "Complete": {
    bg: "bg-[var(--success-light)]",
    text: "text-[var(--success-dark)]",
    dot: "bg-[var(--success-dark)]",
    countBg: "bg-[var(--status-completed-bg-22)]",
  },
};
```

**Card wrapper** (line 250):
```typescript
// OLD: rounded-[15px] ... shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]
// NEW: Use Card component or replace with tokens

import Card from "@/components/ui/Card";

<Card className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
  <Card.Content className="p-5.25">
    {/* existing content */}
  </Card.Content>
</Card>
```

**Other token replacements** (lines 258, 268, 274, 362, 372):
```typescript
// Line 258: CheckCircle icon
// OLD: text-success (Tailwind utility - verify config or use explicit token)
// NEW: text-[var(--success)]

// Line 268, 274: Search input border
// OLD: border-divider focus:border-primary focus:ring-primary
// Verify Tailwind config or use: border-[var(--divider)] focus:border-[var(--primary)]

// Line 268: placeholder color
// OLD: text-gray-400
// NEW: text-[var(--text-secondary)]

// Line 362: Package icon
// OLD: text-gray-300
// NEW: text-[var(--text-secondary)]

// Line 372: Link color
// OLD: text-primary (verify Tailwind config)
// NEW: text-[var(--primary)]

// Line 386: Selected row background
// OLD: bg-primary/10
// NEW: bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]

// Line 387: Hover state
// OLD: hover:bg-gray-50
// NEW: hover:bg-[var(--bg-page)]

// Line 390: Icon background
// OLD: bg-primary
// NEW: bg-[var(--primary)]

// Line 397: Red dot
// OLD: bg-error (verify Tailwind config)
// NEW: bg-[var(--error)]
```

**FilterPill import update** (line 6):
```typescript
// OLD: import FilterPill from "@/components/FilterPill";
// NEW: import FilterPill from "@/components/ui/FilterPill";
```

---

### `src/components/OrderDetails.tsx` (component, request-response)

**Analog:** `src/components/ui/Card.tsx`

**Current state:** Uses hardcoded rounded-[15px], shadow, inline styles for colors

**Card wrapper** (lines 229, 256):
```typescript
import Card from "@/components/ui/Card";

// OLD (line 229, 256):
<div className="flex w-120 flex-col gap-4 rounded-[15px] bg-white p-5.25 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">

// NEW:
<Card className="flex w-120 flex-col gap-4">
  <Card.Content className="p-5.25">
    {/* existing content */}
  </Card.Content>
</Card>
```

**StatCard refactor** (lines 325-358):
```typescript
// StatCard uses bg-bg-page which is already a token - KEEP AS IS
// No changes needed for StatCard - already uses tokens
```

**TimelineItem color tokens** (lines 26-47, 378-391):
```typescript
// colorMap already uses token classes (bg-primary, bg-success, etc.)
// Verify these map to CSS variables or replace with explicit var(--) syntax

const colorMap = {
  primary: {
    bg: "bg-[var(--primary)]",
    bar: "bg-[var(--primary)]",
    text: "text-[var(--primary)]",
  },
  success: {
    bg: "bg-[var(--success)]",
    bar: "bg-[var(--success)]",
    text: "text-[var(--success)]",
  },
  error: {
    bg: "bg-[var(--error)]",
    bar: "bg-[var(--error)]",
    text: "text-[var(--error)]",
  },
  pending: {
    bg: "bg-white border-2 border-[var(--pending)]",
    bar: "bg-[var(--pending)]",
    text: "text-[var(--text-secondary)]",
  },
};
```

**PendingBadge token** (line 188):
```typescript
// OLD: bg-pending-light (verify Tailwind config)
// NEW: bg-[var(--pending-light)]
```

---

### `src/components/KPICard.tsx` (component, display)

**Analog:** `src/components/ui/Card.tsx`

**Current state:** Custom div with hardcoded rounded-[15px], p-[18px_21px], shadow

**Card compound refactor** (lines 60-73):
```typescript
import Card from "@/components/ui/Card";

// OLD: Custom div (line 61)
<div className="flex flex-1 items-center justify-between rounded-[15px] bg-white p-[18px_21px] shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
  <div className="flex flex-col gap-0.5">
    <span className="text-text-secondary text-xs font-bold">{label}</span>
    <div className="flex items-end gap-1.5">
      <span className="text-text-primary text-lg font-bold">{value}</span>
      <span className={`text-sm font-bold ${changeColor}`}>{change}</span>
    </div>
  </div>
  <div className="bg-primary flex h-11.25 w-11.25 items-center justify-center rounded-xl shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
    <Icon className="h-5.5 w-5.5 text-white" />
  </div>
</div>

// NEW: Card component
<Card className="flex-1">
  <Card.Content className="flex items-center justify-between p-[var(--space-4)]">
    <div className="flex flex-col gap-0.5">
      <span className="text-[var(--text-secondary)] text-xs font-bold">{label}</span>
      <div className="flex items-end gap-1.5">
        <span className="text-[var(--text-primary)] text-lg font-bold">{value}</span>
        <span className={`text-sm font-bold ${changeColor}`}>{change}</span>
      </div>
    </div>
    <div className="bg-[var(--primary)] flex h-11.25 w-11.25 items-center justify-center rounded-xl shadow-[var(--shadow-card)]">
      <Icon className="h-5.5 w-5.5 text-white" />
    </div>
  </Card.Content>
</Card>
```

**Token usage for colors** (lines 53-58):
```typescript
// changeColor already uses token classes (text-success, text-error)
// Verify Tailwind config or replace:
const changeColor =
  changeType === "positive"
    ? "text-[var(--success)]"
    : changeType === "negative"
    ? "text-[var(--error)]"
    : "text-[var(--text-secondary)]";
```

---

### `src/components/Header.tsx` (component, request-response)

**Analog:** `src/components/ui/Input.tsx`

**Current state:** Custom search input with hardcoded shadow, native input styling

**Input component usage** (lines 95-104):
```typescript
import Input from "@/components/ui/Input";

// Option 1: Use Input component with custom styling
<div className="flex items-center gap-2 bg-[var(--bg-card)] rounded-lg px-3 py-2 shadow-[var(--shadow-card)]">
  <Search className="text-[var(--text-secondary)] h-4 w-4" />
  <Input
    type="text"
    placeholder="Type here..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-32 bg-transparent text-xs border-0 focus:ring-0 p-0"
  />
</div>

// Option 2: Keep custom input with tokens
<div className="flex items-center gap-2 rounded-lg bg-[var(--bg-card)] px-3 py-2 shadow-[var(--shadow-card)]">
  <Search className="text-[var(--text-secondary)] h-4 w-4" />
  <input
    type="text"
    placeholder="Type here..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="placeholder:text-[var(--text-secondary)] w-32 bg-transparent text-xs outline-none"
  />
</div>
```

**Token replacements** (lines 95-102):
```typescript
// Line 95: shadow
// OLD: shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]
// NEW: shadow-[var(--shadow-card)]

// Line 96: icon color (already uses token class)
// Verify: text-text-secondary maps to var(--text-secondary) or use explicit var(--)

// Line 102: placeholder color (already uses token class)
// Verify or use: placeholder:text-[var(--text-secondary)]
```

**Button colors** (lines 109, 119):
```typescript
// Lines 109, 119: hover state
// OLD: hover:bg-white/50
// NEW: hover:bg-[var(--bg-card)]/50 or hover:opacity-90

// Line 112, 123: icon colors (already use token classes)
// Verify text-text-secondary mapping
```

**Badge token** (line 125):
```typescript
// OLD: bg-error (verify Tailwind config)
// NEW: bg-[var(--error)]
```

---

### `src/components/Sidebar.tsx` (component, navigation)

**Analog:** `src/components/ui/Button.tsx`

**Current state:** Already uses tokens via var(--primary), var(--text-primary), var(--divider)

**Token usage verification** (lines 38-124):
```typescript
// Line 41: bg-[var(--primary)] ✅ GOOD
// Line 42-43: text-[var(--text-primary)] ✅ GOOD
// Line 48: bg-[var(--divider)] ✅ GOOD
// Line 51: text-[var(--text-secondary)] ✅ GOOD
// Line 66: bg-[var(--divider)] ✅ GOOD
// Line 69: text-[var(--text-secondary)] ✅ GOOD
// Line 100-103: rounded-[15px] - replace with var(--radius-xl)
// Line 102: shadow-[0_3.5px_5px_rgba(0,0,0,0.03)] - replace with var(--shadow-card)
// Line 107-108: shadow, rounded-xl - replace with tokens
// Line 108: bg-[var(--primary)] ✅ GOOD
// Line 112: text-[--primary] ❌ TYPO - should be var(--primary)
// Line 117: text-[var(--text-primary)] ✅ GOOD
// Line 117: text-[var(--text-secondary)] ✅ GOOD
```

**Token replacements needed** (lines 100-112):
```typescript
// Line 100: rounded-[15px]
// NEW: rounded-[var(--radius-xl)]

// Line 102: shadow-[0_3.5px_5px_rgba(0,0,0,0.03)]
// NEW: shadow-[var(--shadow-card)]

// Line 107: shadow-[0_3.5px_5px_rgba(0,0,0,0.03)]
// NEW: shadow-[var(--shadow-card)]

// Line 107: rounded-xl (12px)
// NEW: rounded-[var(--radius-lg)]

// Line 112: text-[--primary] ❌ BUG FIX
// NEW: text-[var(--primary)]
```

---

### `src/components/FilterPill.tsx` → `src/components/ui/FilterPill.tsx` (component, filter)

**Analog:** `src/components/ui/StatusBadge.tsx`

**Current state:** Already well-structured with color config pattern, needs extraction to ui/

**Extraction pattern** (from StatusBadge.tsx structure):
```typescript
// MOVE FILE: src/components/FilterPill.tsx → src/components/ui/FilterPill.tsx
// MOVE TEST: src/components/FilterPill.test.tsx → src/components/ui/FilterPill.test.tsx (if exists)

// Update imports in consuming files:
// - src/app/mill-production/page.tsx (line 12)
// - src/components/OrdersTable.tsx (line 6)

// OLD import:
import FilterPill from "@/components/FilterPill";

// NEW import:
import FilterPill from "@/components/ui/FilterPill";
```

**Token verification** (lines 31-36):
```typescript
// Component already uses token pattern correctly
// Line 31: bg-primary ✅
// Line 32: text-white ✅
// Line 33: bg-white/20 ✅
// Line 35-36: dotColor fallback handling ✅

// Verify all consuming code passes tokens (not hardcoded values) in color prop
```

**Add token usage test** (following StatusBadge.test.tsx pattern lines 40-65):
```typescript
// Create src/components/ui/FilterPill.test.tsx
describe("FilterPill token verification", () => {
  it("uses var(--) syntax when color config provided", () => {
    const config = {
      bg: "bg-[var(--success-light)]",
      text: "text-[var(--success)]",
      dot: "bg-[var(--success)]",
      countBg: "bg-[var(--status-completed-bg-22)]",
    };

    const { container } = render(
      <FilterPill label="Test" count={5} color={config} isActive={false} onClick={() => {}} />
    );

    // Verify token usage patterns
    const html = container.innerHTML;
    expect(html).toContain("var(--");
  });

  it("contains no hardcoded hex values in rendered output", () => {
    const { container } = render(
      <FilterPill label="Test" count={5} isActive={true} onClick={() => {}} />
    );
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });
});
```

---

### `src/components/BinGauge.tsx` → `src/components/ui/Gauge.tsx` (component, display)

**Analog:** `src/components/ui/StatusBadge.tsx`

**Current state:** Uses var(--success), var(--warning), var(--error) but has hardcoded #2d3748 and #a0aec0

**Token replacements** (lines 32, 64, 81-82):
```typescript
// Line 32: hardcoded text color
// OLD: return 'text-[#2d3748]';
// NEW: return 'text-[var(--text-primary)]';

// Line 64: hardcoded border color
// OLD: border-2 border-[#e2e8f0]
// NEW: border-2 border-[var(--divider)]

// Line 81: hardcoded label color
// OLD: text-[#2d3748]
// NEW: text-[var(--text-primary)]

// Line 82: hardcoded label color
// OLD: text-[#a0aec0]
// NEW: text-[var(--text-secondary)]
```

**Arbitrary value review** (lines 59, 62, 69, 74):
```typescript
// Line 59: w-[60px] - specific component width, no token exists - KEEP
// Line 62: w-[40px] h-[70px] - specific gauge dimensions - KEEP
// Line 69: w-[36px] - calculated from container width - KEEP
// Line 74: text-xs - standard Tailwind class - KEEP
```

**Extraction and rename**:
```typescript
// MOVE FILE: src/components/BinGauge.tsx → src/components/ui/Gauge.tsx
// RENAME component: BinGauge → Gauge
// MOVE TEST: If exists

// Update imports:
// Search for: import.*BinGauge
// Replace with: import Gauge from "@/components/ui/Gauge";
```

**Generic API design** (make gauge reusable beyond bins):
```typescript
// Consider renaming props for broader use:
interface GaugeProps {
  fillPercentage: number;
  label: string;          // was: locationCode
  sublabel?: string;      // was: feedType
  variant?: 'vertical' | 'horizontal';  // future: support horizontal gauges
}

export function Gauge({ fillPercentage, label, sublabel }: GaugeProps) {
  // existing implementation with renamed props
}
```

**Add token usage test**:
```typescript
// Create src/components/ui/Gauge.test.tsx
describe("Gauge token verification", () => {
  it("uses var(--) syntax for threshold colors", () => {
    const { container } = render(<Gauge fillPercentage={30} label="A1" sublabel="Corn" />);
    const html = container.innerHTML;
    expect(html).toContain("var(--");
  });

  it("contains no hardcoded hex colors", () => {
    const { container } = render(<Gauge fillPercentage={30} label="A1" sublabel="Corn" />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });
});
```

---

### `src/components/ActivityTimeline.tsx` → `src/components/ui/Timeline.tsx` (component, display)

**Analog:** `src/components/ui/Card.tsx`

**Current state:** Uses token classes (bg-primary, bg-success, etc.) and hardcoded rounded-[15px], shadow

**Card wrapper tokens** (lines 144, 156):
```typescript
import Card from "@/components/ui/Card";

// OLD (line 144, 156):
<div className="bg-white rounded-[15px] shadow-[0_3.5px_5px_rgba(0,0,0,0.05)] p-6">
<div className="bg-white rounded-[15px] shadow-[0_3.5px_5px_rgba(0,0,0,0.05)] p-[20px_24px]">

// NEW:
<Card className="p-6">
  {/* content */}
</Card>

<Card className="p-[20px_24px]">
  {/* content */}
</Card>
```

**Color token verification** (lines 25-37):
```typescript
// Verify token classes map to CSS variables or use explicit var(--)
function getEventColor(type: ActivityEventType): { dot: string; connector: string; text: string } {
  switch (type) {
    case 'delivered':
    case 'delivery_completed':
      return {
        dot: 'bg-[var(--success)]',
        connector: 'bg-[var(--success)]',
        text: 'text-[var(--success)]'
      };
    case 'bin_alert_low':
      return {
        dot: 'bg-[var(--warning)]',
        connector: 'bg-[var(--warning)]',
        text: 'text-[var(--warning)]'
      };
    case 'bin_alert_critical':
      return {
        dot: 'bg-[var(--error)]',
        connector: 'bg-[var(--error)]',
        text: 'text-[var(--error)]'
      };
    default: // order events
      return {
        dot: 'bg-[var(--primary)]',
        connector: 'bg-[var(--primary)]',
        text: 'text-[var(--primary)]'
      };
  }
}
```

**Other token replacements** (lines 103, 115):
```typescript
// Line 103: hardcoded background
// OLD: bg-[#f8f9fa]
// NEW: bg-[var(--bg-page)]

// Line 103: hardcoded border radius
// OLD: rounded-[8px]
// NEW: rounded-[var(--radius-md)]

// Line 115: Link color (already uses text-primary - verify mapping)
```

**Extraction and rename**:
```typescript
// MOVE FILE: src/components/ActivityTimeline.tsx → src/components/ui/Timeline.tsx
// RENAME: ActivityTimeline → Timeline
// MOVE TEST: If exists

// Update imports:
// Search for: import.*ActivityTimeline
// Replace with: import Timeline from "@/components/ui/Timeline";
```

**Generic API design**:
```typescript
// Already generic - accepts events array with flexible event types
// Keep existing API

export interface TimelineEvent {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  timestamp: Date;
  type: string;  // generic type instead of ActivityEventType
  metadata?: Record<string, any>;  // optional metadata for expansion
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  // existing implementation
}
```

**Add token usage test**:
```typescript
// Create src/components/ui/Timeline.test.tsx
describe("Timeline token verification", () => {
  it("uses var(--) syntax for event colors", () => {
    const events = [{ id: '1', type: 'delivered', title: 'Test', description: 'Test', timestamp: new Date() }];
    const { container } = render(<Timeline events={events} />);
    const html = container.innerHTML;
    expect(html).toContain("var(--");
  });

  it("contains no hardcoded hex colors", () => {
    const events = [{ id: '1', type: 'order_placed', title: 'Test', description: 'Test', timestamp: new Date() }];
    const { container } = render(<Timeline events={events} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });
});
```

---

## Shared Patterns

### Authentication
**Source:** Not applicable for this phase
**Apply to:** N/A — No auth changes in page migration

### Error Handling
**Source:** `src/components/ui/Input.tsx` (lines 36-69)
**Apply to:** Settings page form inputs (if adding validation)

```typescript
// Error state pattern from Input component
<Input
  label="Display Density"
  error={validationError}
  value={formState.density}
  onChange={(e) => updateDensity(e.target.value)}
/>

// Error display with icon
{error && (
  <AlertCircle
    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--error)]"
    aria-hidden="true"
  />
)}
```

### Card Pattern (Compound Components)
**Source:** `src/components/ui/Card.tsx`
**Apply to:** All page wrappers, KPICard, OrderDetails, ActivityTimeline

```typescript
import Card from "@/components/ui/Card";

// Simple card
<Card>
  <Card.Content>
    {/* content */}
  </Card.Content>
</Card>

// Card with header and footer
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Content>
    {/* content */}
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>

// Clickable card
<Card onClick={handleClick}>
  <Card.Content>
    {/* content */}
  </Card.Content>
</Card>
```

### Token Usage in className
**Source:** `src/components/ui/StatusBadge.tsx`, `src/components/ui/Button.tsx`
**Apply to:** All components with hardcoded colors or spacing

```typescript
// Color tokens
bg-[var(--primary)]
text-[var(--text-primary)]
border-[var(--divider)]

// Interactive state tokens
hover:bg-[var(--primary-hover)]
active:bg-[var(--primary-active)]
disabled:bg-[var(--primary-disabled)]

// Spacing tokens
p-[var(--space-4)]
gap-[var(--space-2)]
rounded-[var(--radius-xl)]

// Shadow tokens
shadow-[var(--shadow-card)]
shadow-[var(--shadow-sm)]
```

### Inline Style Token Usage
**Source:** `src/app/mill-production/page.tsx` (lines 84, 119)
**Apply to:** Dynamic colors that can't be in className

```typescript
// When color is dynamic from variable
style={{ backgroundColor: borderColor }}  // where borderColor = var(--primary)
style={{ color: headerColor }}            // where headerColor = var(--success)

// Token variables should be defined with var(--) prefix
const STATE_COLORS: Record<string, { border: string }> = {
  Completed: { border: "var(--status-completed-border)" },
  // ...
};
```

### CVA Variant Pattern
**Source:** `src/components/ui/Button.tsx` (lines 6-31)
**Apply to:** Components with multiple style variants

```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const componentVariants = cva(
  "base-classes-with-tokens",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-[var(--text-white)]",
        secondary: "bg-[var(--bg-card)] text-[var(--text-primary)]",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface ComponentProps extends VariantProps<typeof componentVariants> {
  // props
}

function Component({ variant, size, className, ...props }: ComponentProps) {
  return (
    <div className={cn(componentVariants({ variant, size }), className)} {...props}>
      {/* content */}
    </div>
  );
}
```

---

## Hardcoded Value → Token Mapping Table

**Source:** `src/app/globals.css` (lines 3-100)

### Color Mappings

| Hardcoded Value | Token | Usage Context |
|-----------------|-------|---------------|
| `#4fd1c5` | `var(--primary)` | Primary brand color |
| `#38b2ac` | `var(--primary-dark)` | Primary dark variant |
| `#45b8ad` | `var(--primary-hover)` | Primary hover state |
| `#3a9d94` | `var(--primary-active)` | Primary active state |
| `#f8f9fa` | `var(--bg-page)` | Page background |
| `#ffffff` | `var(--bg-card)` | Card background |
| `white` | `var(--bg-card)` | White backgrounds |
| `#2d3748` | `var(--text-primary)` | Primary text color |
| `#a0aec0` | `var(--text-secondary)` | Secondary text, placeholders |
| `#48bb78` | `var(--success)` | Success states |
| `#2f855a` | `var(--success-dark)` | Success dark variant |
| `#c6f6d5` | `var(--success-light)` | Success light backgrounds |
| `#f59e0b` | `var(--warning)` | Warning states |
| `#fefcbf` | `var(--warning-light)` | Warning light backgrounds |
| `#e53e3e` | `var(--error)` | Error states |
| `#c53030` | `var(--error-dark)` | Error dark variant |
| `#fed7d7` | `var(--error-light)` | Error light backgrounds |
| `#2b6cb0` | `var(--info)` | Info states |
| `#bee3f8` | `var(--info-light)` | Info light backgrounds |
| `#9333ea` | `var(--purple)` | Purple accent |
| `#f3e8ff` | `var(--purple-light)` | Purple light backgrounds |
| `#cbd5e0` | `var(--pending)` | Pending states |
| `#edf2f7` | `var(--pending-light)` | Pending light backgrounds |
| `#e2e8f0` | `var(--divider)` | Borders, dividers |
| `gray-100` | `var(--bg-page)` | Gray backgrounds |
| `gray-200` | `var(--bg-page)` | Skeleton/loading states |
| `gray-300` | `var(--text-secondary)` | Muted icons |
| `gray-400` | `var(--text-secondary)` | Placeholders |
| `gray-50` | `var(--bg-page)` | Hover backgrounds |
| `gray-600` | `var(--text-primary)` | Dark text |

### Semi-transparent Color Mappings

| Hardcoded Value | Token | Usage Context |
|-----------------|-------|---------------|
| `#f59e0b22` | `var(--status-mixing-bg-22)` | 22% opacity warning background |
| `#2b6cb022` | `color-mix(in_srgb,var(--info)_13%,transparent)` | 13% opacity info background |
| `#9333ea22` | `color-mix(in_srgb,var(--purple)_13%,transparent)` | 13% opacity purple background |
| `#2f855a22` | `var(--status-completed-bg-22)` | 22% opacity success background |
| `#2f855a38` | `var(--status-completed-bg-22)` | Alternative 22% opacity success |
| `#c5303038` | `var(--status-blocked-bg-22)` | 22% opacity error background |
| `#71809638` | `var(--status-pending-bg-22)` | 22% opacity pending background |
| `rgba(0,0,0,0.02)` | `var(--shadow-sm)` | Light shadow |
| `rgba(0,0,0,0.03)` | `var(--shadow-card)` | Card shadow |
| `rgba(0,0,0,0.05)` | `var(--shadow-card)` | Alternative card shadow |
| `bg-primary/10` | `color-mix(in_srgb,var(--primary)_10%,transparent)` | 10% opacity primary |
| `bg-primary/20` | `color-mix(in_srgb,var(--primary)_20%,transparent)` | 20% opacity primary |
| `bg-white/20` | `rgba(255,255,255,0.2)` | 20% white overlay |
| `bg-white/50` | `rgba(255,255,255,0.5)` | 50% white overlay |

### Spacing Mappings

| Hardcoded Value | Token | Exact Value | Usage Context |
|-----------------|-------|-------------|---------------|
| `[15px]` | `var(--radius-xl)` | 15px | Border radius for cards |
| `[18px]` | `var(--space-4)` + adjust | 16px → 18px | Padding (round up to 24px or document exception) |
| `[21px]` | `var(--space-5)` | 24px | Padding (round up from 21px) |
| `[8px]` | `var(--radius-md)` | 8px | Border radius |
| `[12px]` | `var(--radius-lg)` | 12px | Border radius |
| `[6px]` | `var(--radius-sm)` | 6px | Border radius |
| `[60px]` | No token | 60px | Component-specific width (document exception) |
| `[40px]` | No token | 40px | Component-specific dimension (document exception) |
| `[70px]` | No token | 70px | Component-specific dimension (document exception) |
| `[36px]` | No token | 36px | Calculated dimension (document exception) |
| `[28px]` | No token | 28px | Icon size (document exception) |
| `[14px]` | No token | 14px | Icon size (document exception) |

### Shadow Mappings

| Hardcoded Value | Token | Usage Context |
|-----------------|-------|---------------|
| `shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]` | `shadow-[var(--shadow-sm)]` | Light shadow |
| `shadow-[0_3.5px_5px_rgba(0,0,0,0.03)]` | `shadow-[var(--shadow-card)]` | Card shadow |
| `shadow-[0_3.5px_5px_rgba(0,0,0,0.05)]` | `shadow-[var(--shadow-card)]` | Alternative card shadow |

### Rounding Rules

When migrating px values to tokens:
1. **Exact match:** Use token if value matches exactly
2. **Within 2px and < half-gap:** Use closest token
3. **Otherwise:** Round UP to larger token
4. **Exception:** Document if value is component-specific (icon sizes, calculated dimensions)

Examples:
- `18px` → `var(--space-5)` (24px) — 6px gap to 16px, closer to 24px
- `21px` → `var(--space-5)` (24px) — round up
- `60px` → No token exists — document as component-specific gauge width

---

## No Analog Found

All files have analogs or token sources.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | — | — | All files classified with appropriate analogs |

---

## Metadata

**Analog search scope:**
- `src/components/ui/` (design system components)
- `src/app/` (page patterns)
- `src/app/globals.css` (token definitions)

**Files scanned:** 20+ files (pages, components, design system components, CSS)

**Pattern extraction date:** 2026-05-07

**Key insights:**
1. Design system components (Button, Card, Input, Select, StatusBadge) already use tokens correctly — excellent reference patterns
2. Most pages/components already use SOME tokens (via Tailwind classes or var(--) syntax) — partial migration state
3. Primary issues: hardcoded hex in semi-transparent colors (#f59e0b22), hardcoded border-radius [15px], hardcoded shadows
4. Sidebar has a typo: `text-[--primary]` missing `var()` wrapper (line 112)
5. FilterPill, BinGauge, ActivityTimeline are already well-structured for extraction to ui/
6. Card compound pattern is the main refactoring pattern for KPICard and page wrappers

**ESLint will catch:** Hardcoded hex colors, [Npx] patterns in className
**ESLint will NOT catch:** Inline styles, Tailwind utility classes (bg-gray-100), missing var() wrapper
**Token tests will catch:** Runtime verification that var(--) is actually used
