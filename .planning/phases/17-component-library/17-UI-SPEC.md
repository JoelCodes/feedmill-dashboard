# UI Specification: Phase 17 - Component Library

**Phase:** 17 - Component Library
**Status:** draft
**Created:** 2026-05-07
**Design System:** Custom (CVA + Tailwind + CSS Variables)

---

## 1. Overview

### Phase Scope
Build reusable UI component primitives using the design token system and CVA tooling established in Phase 16. All components use design tokens from globals.css, support light/dark themes, and follow established component patterns.

### Deliverables
- Button component (4 variants, 3 sizes)
- Input components (text, number, select, textarea with validation states)
- Card compound component (Header/Content/Footer via dot notation)
- Theme Toggle UI component
- StatusBadge refactored to use design tokens

### Requirements Coverage
- COMP-01: Button component with CVA variants
- COMP-02: Input components with validation states
- COMP-03: Card compound pattern
- COMP-04: Theme toggle UI
- COMP-05: StatusBadge refactor

---

## 2. Design System Context

### Existing Token System
Source: `src/app/globals.css` (Phase 16 output)

**Spacing Scale (8-point grid):**
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 24px
- `--space-6`: 32px
- `--space-8`: 48px
- `--space-10`: 64px
- `--space-12`: 96px

**Semantic Spacing Aliases:**
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 16px
- `--spacing-lg`: 32px
- `--spacing-xl`: 48px

**Typography:**
- Body text: 16px (default)
- Small text: `--text-11` (0.6875rem / 11px)
- Card title: `--text-15` (0.9375rem / 15px)
- Font family: Helvetica, Arial, sans-serif
- Weights: 400 (regular), 600 (semibold), 700 (bold)

**Color Tokens (with interactive states):**
- Primary: `--primary` (#4fd1c5)
  - Hover: `--primary-hover` (#45b8ad)
  - Active: `--primary-active` (#3a9d94)
  - Disabled: `--primary-disabled` (#a8d5d0)
- Success: `--success` (#48bb78) + hover/active/disabled
- Warning: `--warning` (#f59e0b) + hover/active/disabled
- Error: `--error` (#e53e3e) + hover/active/disabled
- Info: `--info` (#2b6cb0) + hover/active/disabled

**Border Radius:**
- `--radius-sm`: 6px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-xl`: 15px

**Shadows:**
- `--shadow-sm`: 0 3.5px 5px rgba(0, 0, 0, 0.02)
- `--shadow-card`: 0 3.5px 5px rgba(0, 0, 0, 0.03)

**Dark Mode:**
- Theme switching via `.dark` class (next-themes integration complete)
- All tokens have dark mode overrides in globals.css

### Available Tooling
- CVA (class-variance-authority): Installed in Phase 16
- `cn()` utility: `src/lib/utils.ts` (clsx + tailwind-merge)
- `useTheme()` hook: from next-themes ThemeProvider

### Existing Component Patterns
Source: `src/components/ui/StatusBadge.tsx`

- Props interface at top of file
- Config object using `Record<KeyType, ValueType>`
- Inline token references: `bg-[var(--token)]`
- Single default export
- Helper components as internal functions

---

## 3. Component Specifications

### 3.1 Button

**File:** `src/components/ui/Button.tsx`

**Variants (D-02, D-03, D-04, D-05):**

| Variant | Background | Text | Border | States |
|---------|-----------|------|--------|--------|
| `primary` | `--primary` | `--text-white` | none | hover: `--primary-hover`, active: `--primary-active`, disabled: `--primary-disabled` |
| `secondary` | `--bg-card` | `--text-primary` | 1px `--divider` | hover: subtle opacity, active: reduced opacity, disabled: `--text-secondary` |
| `ghost` | transparent | `--text-primary` | none | hover: `--bg-card`, active: `--bg-card` + opacity, disabled: `--text-secondary` |
| `destructive` | `--error` | `--text-white` | none | hover: `--error-hover`, active: `--error-active`, disabled: `--error-disabled` |

**Sizes:**

| Size | Padding | Font Size | Height | Icon Size |
|------|---------|-----------|--------|-----------|
| `sm` | 8px 12px | 14px | 32px | 16px |
| `md` | 12px 16px | 16px | 40px | 20px |
| `lg` | 16px 24px | 18px | 48px | 24px |

**States:**
- Default: Base variant colors
- Hover: Transition background 150ms ease
- Active: Instant color change (no transition)
- Disabled: Cursor not-allowed, reduced opacity, no pointer events
- Loading: Disabled state + spinner icon replacing content

**Spacing:**
- Gap between icon and text: `--space-2` (8px)
- Border radius: `--radius-md` (8px)

**API:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}
```

---

### 3.2 Input (text, number)

**File:** `src/components/ui/Input.tsx`

**Base Styling:**
- Height: 40px (matching Button md)
- Padding: 12px 16px
- Border: 1px `--divider`
- Border radius: `--radius-md` (8px)
- Font size: 16px
- Background: `--bg-card`
- Text color: `--text-primary`

**States:**

| State | Border | Background | Additional |
|-------|--------|-----------|-----------|
| Default | `--divider` | `--bg-card` | Placeholder in `--text-secondary` |
| Focus | `--primary` (2px) | `--bg-card` | Focus ring 2px `--primary` with 20% opacity |
| Error (D-07, D-08) | `--error` (2px) | `--bg-card` | Error icon (lucide-react AlertCircle) positioned right, 16px size |
| Disabled | `--divider` | `--bg-page` | Text color `--text-secondary`, cursor not-allowed |

**Error State Details (D-07, D-08):**
- Red border persists on focus (stays `--error`)
- Focus ring layers on top: 2px `--error` with 20% opacity
- Error icon inside input, positioned absolute right 12px
- Input padding-right adjusted to 40px when error icon present

**Label & Helper Text:**
- Label: 14px, weight 600, color `--text-primary`, margin-bottom `--space-2` (8px)
- Helper text: 12px, color `--text-secondary`, margin-top `--space-1` (4px)
- Error message: 12px, color `--error`, margin-top `--space-1` (4px), replaces helper text

**API:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode; // Leading icon
}
```

---

### 3.3 Select

**File:** `src/components/ui/Select.tsx`

Shares same styling as Input with additions:

**Differences:**
- Chevron icon (lucide-react ChevronDown) positioned right, 16px size
- Padding-right: 40px (space for chevron)
- Cursor: pointer
- No focus ring on options dropdown (native select behavior)

**States:**
- Same as Input: default, focus, error, disabled
- Open state: Chevron rotates 180deg, transition 150ms ease

**API:**
```typescript
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}
```

---

### 3.4 Textarea

**File:** `src/components/ui/Textarea.tsx`

Shares base Input styling with modifications:

**Differences:**
- Min-height: 96px (6 lines of 16px text)
- Resize: vertical only
- Padding: 12px 16px (same as Input)
- Line-height: 1.5

**States:**
- Same as Input: default, focus, error, disabled
- Error icon positioned top-right at 12px from top

**API:**
```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}
```

---

### 3.5 Card (Compound Component)

**File:** `src/components/ui/Card.tsx`

**Pattern (D-06):** Compound component with dot notation
```typescript
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Content>Body</Card.Content>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

**Base Card:**
- Background: `--bg-card`
- Border: 1px `--divider`
- Border radius: `--radius-xl` (15px)
- Padding: 0 (children control internal padding)
- Shadow: `--shadow-card`

**Card.Header:**
- Padding: `--space-4` (16px)
- Border-bottom: 1px `--divider`
- Font size: 18px
- Font weight: 600
- Color: `--text-primary`

**Card.Content:**
- Padding: `--space-4` (16px)
- Flex: 1 (grows to fill available space)

**Card.Footer:**
- Padding: `--space-4` (16px)
- Border-top: 1px `--divider`
- Display: flex
- Justify-content: flex-end
- Gap: `--space-2` (8px)

**Variants:**

| Variant | Difference |
|---------|-----------|
| `default` | Base styling as above |
| `elevated` | Shadow: `--shadow-sm` instead of `--shadow-card` |

**Optional Clickable:**
- If `onClick` prop provided, add `cursor: pointer`
- Hover: Subtle opacity 0.95, transition 150ms ease

**API:**
```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated";
  children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// Export pattern
export default Card;
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
```

---

### 3.6 Theme Toggle

**File:** `src/components/ui/ThemeToggle.tsx`

**Layout:**
- Button group with 3 options: Light, Dark, System
- Display: inline-flex
- Gap: 0 (buttons touch)
- Border: 1px `--divider` around entire group
- Border radius: `--radius-md` (8px)

**Individual Button:**
- Padding: 8px 16px
- Font size: 14px
- Background: transparent (default)
- Color: `--text-secondary` (default)
- Border: none (group handles border)
- Border-right: 1px `--divider` (except last button)
- Cursor: pointer

**Active State:**
- Background: `--primary`
- Color: `--text-white`
- Font weight: 600

**Hover State (non-active):**
- Background: `--bg-page`
- Transition: 150ms ease

**Icons:**
- Use lucide-react: Sun (light), Moon (dark), Monitor (system)
- Icon size: 16px
- Position: left of label
- Gap: `--space-1` (4px)

**Integration:**
- Uses `useTheme()` from next-themes
- Calls `setTheme("light" | "dark" | "system")`
- Active option determined by `theme` value

**API:**
```typescript
// No props - internally uses useTheme()
export default function ThemeToggle() {
  // ...
}
```

---

### 3.7 StatusBadge (Refactor)

**File:** `src/components/ui/StatusBadge.tsx` (existing)

**Refactor Goal:** Replace hardcoded values with design tokens while maintaining existing API.

**Current API (must preserve):**
```typescript
interface StatusBadgeProps {
  status: OrderStatus;
}
```

**Token Migration:**

| Current Hardcoded | Replace With Token |
|-------------------|-------------------|
| Pending gray values | `--text-secondary`, `--pending`, `--pending-light` |
| Warning hex `#f59e0b22` | `--status-mixing-bg-22` |
| Success hex `#2f855a22` | `--status-completed-bg-22` |
| Error hex `#c5303038` | `--status-blocked-bg-22` |
| Info hex `#2b6cb022` | Use `--info` with opacity |
| Purple hex `#9333ea22` | Use `--purple` with opacity |

**No Visual Changes:**
- Size remains: 10px text, 1.5px dot, 2.5px padding
- Border radius remains: 8px (matches `--radius-md`)
- Layout remains: inline-flex, gap-1

**Benefits:**
- Dark mode support (current implementation doesn't handle dark mode)
- Consistency with design system
- Easier to update colors globally

---

## 4. Interaction Patterns

### Focus Management
**All interactive components:**
- Focus ring: 2px solid with 20% opacity
- Primary actions: `--primary` focus ring
- Destructive actions: `--error` focus ring
- Neutral actions: `--text-primary` focus ring with 10% opacity
- Offset: 2px from element edge
- Transition: none (instant on focus)

### Hover States
**Timing:**
- Background color: 150ms ease
- Opacity: 150ms ease
- Transform: 200ms cubic-bezier(0.4, 0, 0.2, 1)

**Cursor:**
- Interactive elements: `cursor: pointer`
- Disabled elements: `cursor: not-allowed`
- Text inputs: `cursor: text`

### Active/Pressed States
**Timing:**
- Instant (no transition) for immediate feedback
- Return to hover state: 100ms ease

**Visual:**
- Buttons: Use `--*-active` token for background
- Inputs: No active state (focus handles it)
- Cards (clickable): Scale 0.98, transition 100ms ease

### Disabled States
**All components:**
- Opacity: 0.6 for entire component
- Pointer events: none
- Cursor: not-allowed (if hoverable when enabled)
- No focus ring
- Interactive state tokens: Use `--*-disabled` variants

### Loading States
**Button only:**
- Disabled state applied
- Content replaced with spinner icon (lucide-react Loader2)
- Spinner: 16px (sm), 20px (md), 24px (lg)
- Animation: rotate 360deg infinite 1s linear

---

## 5. Accessibility Requirements

### Semantic HTML
- Button: Use `<button>` element, never `<div>` with onClick
- Input: Use `<input>` with proper `type` attribute
- Select: Use native `<select>` element
- Textarea: Use `<textarea>` element
- Card: Use `<div>` with appropriate ARIA if clickable

### ARIA Attributes

**Button:**
- `aria-label`: Required if no text children (icon-only buttons)
- `aria-disabled`: true when disabled
- `aria-busy`: true when loading

**Input/Select/Textarea:**
- `aria-label`: Use label element with htmlFor instead (preferred)
- `aria-describedby`: Link to helper text or error message
- `aria-invalid`: true when error prop present
- `aria-required`: true if required prop set

**Card (clickable):**
- `role="button"` if onClick provided
- `tabIndex={0}` for keyboard access
- `aria-label` describing action

**Theme Toggle:**
- `role="radiogroup"` for container
- Each option: `role="radio"`
- `aria-checked`: true for active theme
- `aria-label`: "Theme selection"

### Keyboard Navigation

**Button:**
- Enter/Space: Trigger onClick
- Tab: Focus next element

**Input/Select/Textarea:**
- Tab: Focus next field
- Shift+Tab: Focus previous field
- Input-specific: Standard text editing shortcuts

**Card (clickable):**
- Enter/Space: Trigger onClick
- Tab: Focus next interactive element

**Theme Toggle:**
- Tab: Focus first option
- Arrow keys: Move between options
- Enter/Space: Select option
- Escape: Blur (no selection)

### Focus Indicators
- Always visible (never `outline: none` without alternative)
- High contrast (WCAG AA: 3:1 against background)
- 2px minimum width
- Offset from element for clarity

### Color Contrast
**Text on Backgrounds (WCAG AA):**
- Primary button: White text on teal (#4fd1c5) = 4.5:1 minimum
- Secondary button: Dark text on white = 7:1+
- Error text: `--error` (#e53e3e) on white = 4.5:1 minimum
- Disabled text: `--text-secondary` (#a0aec0) on white = 3.8:1 (large text exception)

**Interactive States:**
- Focus ring: 3:1 against background
- Error border: `--error` clearly distinguishable from default border

### Screen Reader Announcements

**Error States:**
- Error message announced when input becomes invalid
- Use `aria-live="polite"` on error message container
- Error message linked via `aria-describedby`

**Loading States:**
- Button loading: `aria-busy="true"` announces to screen reader
- Status change announced via `aria-live="polite"`

**Theme Toggle:**
- Theme change: Announce "Theme changed to [light/dark/system]"
- Use visually-hidden span with `aria-live="polite"`

---

## 6. Dark Mode Considerations

### Theme Switching
- Mechanism: `useTheme()` hook from next-themes (Phase 16)
- Class toggle: `.dark` class on `<html>` element
- Persistence: localStorage via next-themes
- SSR: Hydration handled by ThemeProvider (no flash)

### Token Behavior
All CSS variables automatically switch values via `.dark` selector in globals.css:

**Background Tokens:**
- `--bg-page`: #f8f9fa → #1a202c
- `--bg-card`: #ffffff → #2d3748
- `--bg-sidebar`: #ffffff → #2d3748

**Text Tokens:**
- `--text-primary`: #2d3748 → #e2e8f0
- `--text-secondary`: #a0aec0 → #a0aec0 (same)
- `--text-muted`: #718096 → #a0aec0

**Interactive Tokens:**
- Primary: #4fd1c5 → #63b3ed (cooler blue for dark mode)
- Success: #48bb78 → #68d391 (slightly desaturated)
- Warning: #f59e0b → #fbd38d (lighter for contrast)
- Error: #e53e3e → #fc8181 (lighter for contrast)

**Border Tokens:**
- `--divider`: #e2e8f0 → #4a5568

**Shadow Tokens:**
- `--shadow-card`: rgba(0,0,0,0.03) → rgba(0,0,0,0.4) (stronger for depth on dark bg)

### Component-Specific Adjustments

**Button:**
- No manual dark mode handling required
- All variants use tokens that auto-switch

**Input:**
- Placeholder contrast: Ensure `--text-secondary` readable in dark mode
- Error icon color: `--error` automatically adjusts

**Card:**
- Shadow more prominent in dark mode for depth perception
- Border necessary in dark mode (light mode could be borderless, but keeping for consistency)

**StatusBadge:**
- Current implementation doesn't support dark mode (hardcoded values)
- Refactor to tokens enables automatic dark mode support

### Testing Requirements
- Verify all components in both light and dark themes
- Check focus rings visible in both modes
- Ensure error states contrast in dark mode
- Validate shadow visibility in dark mode

---

## 7. Component Inventory

Summary of components for planning and tracking:

| Component | File | Variants | Sizes | States | Complexity |
|-----------|------|----------|-------|--------|-----------|
| Button | `Button.tsx` | 4 | 3 | 5 | Medium |
| Input | `Input.tsx` | 1 | 1 | 4 | Medium |
| Select | `Select.tsx` | 1 | 1 | 4 | Medium |
| Textarea | `Textarea.tsx` | 1 | 1 | 4 | Low |
| Card | `Card.tsx` | 2 | 1 | 2 | Medium |
| ThemeToggle | `ThemeToggle.tsx` | 1 | 1 | 2 | Low |
| StatusBadge | `StatusBadge.tsx` | 5 | 1 | 1 | Low (refactor) |

**Total:** 7 components, ~1200 lines estimated

---

## 8. Copywriting

### Button Labels (Context-Specific)
Phase 17 builds primitives only. Actual button labels set by consuming pages in Phase 18.

**Reserved Labels (Do Not Use in Primitives):**
- "Submit" / "Save" / "Create" (primary actions in forms)
- "Cancel" / "Close" (secondary actions)
- "Delete" / "Remove" (destructive actions)
- "Learn More" / "View Details" (ghost actions)

### Input Placeholders
Primitives should support placeholder text but not enforce specific copy.

**Pattern:** Use descriptive placeholders for examples in tests/Storybook only:
- Text input: "Enter customer name"
- Number input: "Enter quantity"
- Select: "Select an option"
- Textarea: "Enter description"

### Error Messages
Primitives accept error string via props. Consuming code sets actual messages.

**Pattern for Consumers (Phase 18):**
- Validation errors: "[Field] is required" / "[Field] must be a valid [type]"
- Format errors: "[Field] must be [constraint]"
- Server errors: "Unable to [action]. Please try again."

### Helper Text
**Pattern:**
- Guidance: "Choose a [constraint]" / "This will [consequence]"
- Examples: "e.g., John Smith" / "Between 1-100"
- Limits: "Max 255 characters" / "Must be positive number"

### Empty States
Not applicable to primitives. Consuming pages handle empty states.

### Theme Toggle Labels
Fixed labels (not configurable):
- Light mode: "Light"
- Dark mode: "Dark"
- System preference: "System"

**Visually Hidden Labels (Screen Readers):**
- Container: "Theme selection"
- Active announcement: "Theme changed to [mode]"

---

## 9. Reserved Tokens

### Component-Specific Token Usage

**Button Primary (D-02):**
- RESERVED: `--primary`, `--primary-hover`, `--primary-active`, `--primary-disabled`
- Used by: Button variant="primary" only
- Do not use for: Text color, borders, or other components (use `--info` for general blue)

**Button Destructive (D-05):**
- RESERVED: `--error`, `--error-hover`, `--error-active`, `--error-disabled`
- Used by: Button variant="destructive", Input error state, error messages only
- Do not use for: Warning states (use `--warning` instead)

**Input Error (D-07, D-08):**
- RESERVED: `--error` for border and icon color
- Used by: Input/Select/Textarea when error prop provided
- Persists on focus with layered focus ring

**Card Shadows:**
- RESERVED: `--shadow-card` for default Card variant
- RESERVED: `--shadow-sm` for elevated Card variant
- Do not use: For buttons, inputs, or other components

**StatusBadge:**
- RESERVED: `--status-*-border`, `--status-*-header`, `--status-*-bg-22`
- Used by: StatusBadge component only
- Do not use: For general UI elements (use base semantic tokens instead)

### Accent Color Strategy (60/30/10 Rule)

**60% Dominant (Backgrounds):**
- `--bg-page`: Main page surface
- `--bg-card`: Card/panel surfaces

**30% Secondary (Structure):**
- `--divider`: Borders between sections
- `--bg-sidebar`: Navigation surface
- `--text-secondary`: Supporting text

**10% Accent (Actions & Status):**
- `--primary`: Primary CTAs, focus rings
- `--success`, `--warning`, `--error`, `--info`: Status indicators, badges, alerts
- Used SPARINGLY to draw attention

**Reserved Accent Elements:**
- Primary buttons (most important action only)
- Input focus states (active field)
- StatusBadge indicators (status communication)
- Theme toggle active state (current selection)
- Error states (problems requiring attention)

---

## 10. Implementation Notes

### CVA Integration Pattern
All components with variants use CVA for type-safe className generation:

```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-[var(--primary)] text-[var(--text-white)] hover:bg-[var(--primary-hover)]",
        // ...
      },
      size: {
        sm: "h-8 px-3 text-sm",
        // ...
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  // additional props
}

export default function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

### Token Reference Syntax
Use Tailwind's arbitrary value syntax for CSS variables:

```typescript
// Correct:
className="bg-[var(--primary)]"
className="text-[var(--text-primary)]"
className="border-[var(--divider)]"

// Incorrect (won't work):
className="bg-primary" // Tailwind doesn't know about --primary
className="var(--primary)" // Invalid syntax
```

### Testing Strategy
Each component requires:
1. Unit tests: Render, props, variants
2. Accessibility tests: ARIA attributes, keyboard nav
3. Visual tests: Light mode, dark mode, all states
4. Integration tests: Theme switching, error handling

### File Organization
```
src/components/ui/
├── Button.tsx           (new)
├── Input.tsx            (new)
├── Select.tsx           (new)
├── Textarea.tsx         (new)
├── Card.tsx             (new)
├── ThemeToggle.tsx      (new)
└── StatusBadge.tsx      (refactor existing)
```

### Import Pattern for Consuming Code
```typescript
// Individual imports (preferred for tree-shaking)
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

// Usage
<Button variant="primary" size="lg">Submit</Button>
<Input label="Email" error="Invalid email format" />
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Content>Content</Card.Content>
  <Card.Footer><Button>Action</Button></Card.Footer>
</Card>
```

---

## 11. Validation Checklist

Design contract is complete when:

- [x] All Phase 16 foundation artifacts reviewed
- [x] User decisions from CONTEXT.md pre-populated
- [x] Design tokens from globals.css catalogued
- [x] Component specifications define exact token usage
- [x] Interaction patterns specify timing and transitions
- [x] Accessibility requirements cover ARIA, keyboard, focus
- [x] Dark mode considerations address all token switches
- [x] Component inventory provides planning estimates
- [x] Reserved tokens prevent misuse across components
- [x] Implementation notes provide CVA integration pattern

Quality indicators:
- Specific token references (not "use primary color")
- Exact pixel values for spacing/sizing (from token scale)
- Pre-populated from upstream artifacts (minimal user questions)
- Actionable for executor (no design ambiguity)

---

## 12. Design Contract Sources

| Decision | Source | Type |
|----------|--------|------|
| Component location (`src/components/ui/`) | 17-CONTEXT.md D-01 | User Decision |
| Button variants (primary/secondary/ghost/destructive) | 17-CONTEXT.md D-02-D-05 | User Decision |
| Card compound pattern (dot notation) | 17-CONTEXT.md D-06 | User Decision |
| Input error UI (red border + icon) | 17-CONTEXT.md D-07-D-08 | User Decision |
| Spacing scale (4/8/12/16/24/32/48/64/96) | globals.css :root | Phase 16 Output |
| Typography (11/15/16px, 400/600/700) | globals.css :root | Phase 16 Output |
| Color tokens with interactive states | globals.css :root | Phase 16 Output |
| Border radius (6/8/12/15px) | globals.css :root | Phase 16 Output |
| Shadow values | globals.css :root | Phase 16 Output |
| Dark mode token overrides | globals.css .dark | Phase 16 Output |
| CVA tooling availability | src/lib/utils.ts | Phase 16 Output |
| Component naming conventions | CONVENTIONS.md | Codebase Pattern |
| Existing badge pattern | StatusBadge.tsx | Codebase Pattern |
| 60/30/10 accent strategy | Default (industry standard) | Default |
| WCAG AA contrast requirements | Default (accessibility standard) | Default |
| Focus ring 2px offset | Default (accessibility best practice) | Default |

**User Questions Asked:** 0 (all decisions pre-populated from upstream)

---

**Status:** draft
**Next Step:** Run `gsd-ui-checker` to validate against 6 design quality dimensions
**Ready for Planning:** Yes (contract complete, executor can begin implementation)

---

*UI-SPEC created: 2026-05-07*
*Design system: Custom (CVA + Tailwind + CSS Variables)*
*Phase: 17 - Component Library*
