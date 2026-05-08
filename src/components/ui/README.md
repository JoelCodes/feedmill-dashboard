# CGM Dashboard Design System

This document provides guidelines for using the design system tokens and components.

## Design Tokens

Design tokens are CSS custom properties defined in `src/app/globals.css`. Always use these tokens - hardcoded values are blocked by ESLint.

### Color Tokens

#### Primary Colors

| Token | Purpose | Example |
|-------|---------|---------|
| `--primary` | Primary brand color for buttons, links | `bg-[var(--primary)]` |
| `--primary-dark` | Darker primary for emphasis | `bg-[var(--primary-dark)]` |
| `--primary-hover` | Primary hover state | `hover:bg-[var(--primary-hover)]` |
| `--primary-active` | Primary active/pressed state | `active:bg-[var(--primary-active)]` |
| `--primary-disabled` | Disabled primary elements | `disabled:bg-[var(--primary-disabled)]` |

#### Background Colors

| Token | Purpose | Example |
|-------|---------|---------|
| `--bg-page` | Page/app background | `bg-[var(--bg-page)]` |
| `--bg-card` | Card/panel backgrounds | `bg-[var(--bg-card)]` |
| `--bg-sidebar` | Sidebar background | `bg-[var(--bg-sidebar)]` |

#### Text Colors

| Token | Purpose | Example |
|-------|---------|---------|
| `--text-primary` | Primary text, headings | `text-[var(--text-primary)]` |
| `--text-secondary` | Secondary/muted text | `text-[var(--text-secondary)]` |
| `--text-muted` | Muted captions | `text-[var(--text-muted)]` |
| `--text-medium` | Medium emphasis text | `text-[var(--text-medium)]` |
| `--text-white` | Text on dark backgrounds | `text-[var(--text-white)]` |

#### Success Colors

| Token | Purpose | Example |
|-------|---------|---------|
| `--success` | Success states | `bg-[var(--success)]` |
| `--success-dark` | Darker success for emphasis | `bg-[var(--success-dark)]` |
| `--success-light` | Success backgrounds | `bg-[var(--success-light)]` |
| `--success-hover` | Success hover state | `hover:bg-[var(--success-hover)]` |
| `--success-active` | Success active state | `active:bg-[var(--success-active)]` |
| `--success-disabled` | Disabled success elements | `disabled:bg-[var(--success-disabled)]` |

#### Warning Colors

| Token | Purpose | Example |
|-------|---------|---------|
| `--warning` | Warning states | `bg-[var(--warning)]` |
| `--warning-light` | Warning backgrounds | `bg-[var(--warning-light)]` |
| `--warning-hover` | Warning hover state | `hover:bg-[var(--warning-hover)]` |
| `--warning-active` | Warning active state | `active:bg-[var(--warning-active)]` |
| `--warning-disabled` | Disabled warning elements | `disabled:bg-[var(--warning-disabled)]` |

#### Error Colors

| Token | Purpose | Example |
|-------|---------|---------|
| `--error` | Error states | `bg-[var(--error)]` |
| `--error-dark` | Darker error for emphasis | `bg-[var(--error-dark)]` |
| `--error-light` | Error backgrounds | `bg-[var(--error-light)]` |
| `--error-hover` | Error hover state | `hover:bg-[var(--error-hover)]` |
| `--error-active` | Error active state | `active:bg-[var(--error-active)]` |
| `--error-disabled` | Disabled error elements | `disabled:bg-[var(--error-disabled)]` |

#### Info Colors

| Token | Purpose | Example |
|-------|---------|---------|
| `--info` | Informational states | `bg-[var(--info)]` |
| `--info-light` | Info backgrounds | `bg-[var(--info-light)]` |
| `--info-hover` | Info hover state | `hover:bg-[var(--info-hover)]` |
| `--info-active` | Info active state | `active:bg-[var(--info-active)]` |
| `--info-disabled` | Disabled info elements | `disabled:bg-[var(--info-disabled)]` |

#### Purple/Accent Colors

| Token | Purpose | Example |
|-------|---------|---------|
| `--purple` | Accent color | `bg-[var(--purple)]` |
| `--purple-dark` | Darker purple for emphasis | `bg-[var(--purple-dark)]` |
| `--purple-light` | Purple backgrounds | `bg-[var(--purple-light)]` |

#### Pending/Neutral Colors

| Token | Purpose | Example |
|-------|---------|---------|
| `--pending` | Pending/neutral states | `bg-[var(--pending)]` |
| `--pending-light` | Pending backgrounds | `bg-[var(--pending-light)]` |

### Status-Specific Tokens

These tokens are used for order status styling with consistent border, header, and background colors.

#### Completed Status

| Token | Purpose | Example |
|-------|---------|---------|
| `--status-completed-border` | Completed status border | `border-[var(--status-completed-border)]` |
| `--status-completed-header` | Completed status header text | `text-[var(--status-completed-header)]` |
| `--status-completed-bg-22` | Completed status background (22% opacity) | `bg-[var(--status-completed-bg-22)]` |

#### Mixing Status

| Token | Purpose | Example |
|-------|---------|---------|
| `--status-mixing-border` | Mixing status border | `border-[var(--status-mixing-border)]` |
| `--status-mixing-header` | Mixing status header text | `text-[var(--status-mixing-header)]` |
| `--status-mixing-bg-22` | Mixing status background (22% opacity) | `bg-[var(--status-mixing-bg-22)]` |

#### Blocked Status

| Token | Purpose | Example |
|-------|---------|---------|
| `--status-blocked-border` | Blocked status border | `border-[var(--status-blocked-border)]` |
| `--status-blocked-header` | Blocked status header text | `text-[var(--status-blocked-header)]` |
| `--status-blocked-bg-22` | Blocked status background (22% opacity) | `bg-[var(--status-blocked-bg-22)]` |

#### Pending Status

| Token | Purpose | Example |
|-------|---------|---------|
| `--status-pending-border` | Pending status border | `border-[var(--status-pending-border)]` |
| `--status-pending-header` | Pending status header text | `text-[var(--status-pending-header)]` |
| `--status-pending-bg-22` | Pending status background (22% opacity) | `bg-[var(--status-pending-bg-22)]` |

### Border & Shadow Tokens

| Token | Purpose | Example |
|-------|---------|---------|
| `--divider` | Borders, dividers | `border-[var(--divider)]` |
| `--shadow-sm` | Subtle shadows | `shadow-[var(--shadow-sm)]` |
| `--shadow-card` | Card shadows | `shadow-[var(--shadow-card)]` |

### Border Radius Tokens

| Token | Value | Example |
|-------|-------|---------|
| `--radius-sm` | 6px | `rounded-[var(--radius-sm)]` |
| `--radius-md` | 8px | `rounded-[var(--radius-md)]` |
| `--radius-lg` | 12px | `rounded-[var(--radius-lg)]` |
| `--radius-xl` | 15px | `rounded-[var(--radius-xl)]` |

### Spacing Tokens

| Token | Value | Example |
|-------|-------|---------|
| `--space-1` | 4px (0.25rem) | `p-[var(--space-1)]` |
| `--space-2` | 8px (0.5rem) | `gap-[var(--space-2)]` |
| `--space-3` | 12px (0.75rem) | `m-[var(--space-3)]` |
| `--space-4` | 16px (1rem) | `p-[var(--space-4)]` |
| `--space-5` | 24px (1.5rem) | `gap-[var(--space-5)]` |
| `--space-6` | 32px (2rem) | `p-[var(--space-6)]` |
| `--space-8` | 48px (3rem) | `gap-[var(--space-8)]` |
| `--space-10` | 64px (4rem) | `p-[var(--space-10)]` |
| `--space-12` | 96px (6rem) | `m-[var(--space-12)]` |

### Typography Tokens

| Token | Value | Example |
|-------|-------|---------|
| `--fs-10` | 10px (0.625rem) | `text-[length:var(--fs-10)]` |
| `--fs-11` | 11px (0.6875rem) | `text-[length:var(--fs-11)]` |
| `--fs-13` | 13px (0.8125rem) | `text-[length:var(--fs-13)]` |
| `--fs-15` | 15px (0.9375rem) | `text-[length:var(--fs-15)]` |
| `--fs-22` | 22px (1.375rem) | `text-[length:var(--fs-22)]` |

### Icon Size Tokens

| Token | Value | Example |
|-------|-------|---------|
| `--icon-sm` | 14px | `w-[var(--icon-sm)] h-[var(--icon-sm)]` |
| `--icon-md` | 16px | `w-[var(--icon-md)] h-[var(--icon-md)]` |
| `--icon-lg` | 20px | `w-[var(--icon-lg)] h-[var(--icon-lg)]` |
| `--icon-dot` | 28px | `w-[var(--icon-dot)] h-[var(--icon-dot)]` |
| `--icon-container` | 36px | `w-[var(--icon-container)]` |

### Component-Specific Tokens

#### Timeline Tokens

| Token | Value | Example |
|-------|-------|---------|
| `--timeline-connector` | 2px | `w-[var(--timeline-connector)]` |
| `--timeline-gap` | 14px (0.875rem) | `gap-[var(--timeline-gap)]` |
| `--timeline-min-height` | 40px (2.5rem) | `min-h-[var(--timeline-min-height)]` |

#### Card Tokens

| Token | Value | Example |
|-------|-------|---------|
| `--card-padding-lg` | 21px (1.3125rem) | `p-[var(--card-padding-lg)]` |
| `--card-header-gap` | 22px (1.375rem) | `gap-[var(--card-header-gap)]` |

#### Sidebar Tokens

| Token | Value | Example |
|-------|-------|---------|
| `--sidebar-width` | 280px (17.5rem) | `w-[var(--sidebar-width)]` |
| `--nav-icon-size` | 30px (1.875rem) | `w-[var(--nav-icon-size)]` |

#### Gauge Tokens

| Token | Value | Example |
|-------|-------|---------|
| `--gauge-width` | 60px (3.75rem) | `w-[var(--gauge-width)]` |
| `--gauge-container-w` | 40px (2.5rem) | `w-[var(--gauge-container-w)]` |
| `--gauge-container-h` | 70px (4.375rem) | `h-[var(--gauge-container-h)]` |
| `--gauge-fill-width` | 36px (2.25rem) | `w-[var(--gauge-fill-width)]` |
| `--gauge-fill-inset` | 2px | `inset-[var(--gauge-fill-inset)]` |
| `--gauge-fill-radius` | 6px | `rounded-[var(--gauge-fill-radius)]` |

#### Table Tokens

| Token | Value | Example |
|-------|-------|---------|
| `--table-col-sm` | 80px (5rem) | `w-[var(--table-col-sm)]` |
| `--table-col-md` | 100px (6.25rem) | `w-[var(--table-col-md)]` |
| `--table-col-lg` | 150px (9.375rem) | `w-[var(--table-col-lg)]` |

### Tailwind Theme Aliases

The `@theme inline` block in globals.css exposes tokens as Tailwind theme utilities for direct class usage.

#### Color Utilities

| Token | Maps To | Usage |
|-------|---------|-------|
| `--color-primary` | `--primary` | `bg-primary`, `text-primary` |
| `--color-primary-dark` | `--primary-dark` | `bg-primary-dark` |
| `--color-primary-hover` | `--primary-hover` | `hover:bg-primary-hover` |
| `--color-primary-active` | `--primary-active` | `active:bg-primary-active` |
| `--color-primary-disabled` | `--primary-disabled` | `disabled:bg-primary-disabled` |
| `--color-bg-page` | `--bg-page` | `bg-bg-page` |
| `--color-bg-card` | `--bg-card` | `bg-bg-card` |
| `--color-text-primary` | `--text-primary` | `text-text-primary` |
| `--color-text-secondary` | `--text-secondary` | `text-text-secondary` |
| `--color-text-muted` | `--text-muted` | `text-text-muted` |
| `--color-text-medium` | `--text-medium` | `text-text-medium` |
| `--color-success` | `--success` | `bg-success`, `text-success` |
| `--color-success-dark` | `--success-dark` | `bg-success-dark` |
| `--color-success-light` | `--success-light` | `bg-success-light` |
| `--color-success-hover` | `--success-hover` | `hover:bg-success-hover` |
| `--color-success-active` | `--success-active` | `active:bg-success-active` |
| `--color-success-disabled` | `--success-disabled` | `disabled:bg-success-disabled` |
| `--color-warning` | `--warning` | `bg-warning`, `text-warning` |
| `--color-warning-light` | `--warning-light` | `bg-warning-light` |
| `--color-warning-hover` | `--warning-hover` | `hover:bg-warning-hover` |
| `--color-warning-active` | `--warning-active` | `active:bg-warning-active` |
| `--color-warning-disabled` | `--warning-disabled` | `disabled:bg-warning-disabled` |
| `--color-error` | `--error` | `bg-error`, `text-error` |
| `--color-error-dark` | `--error-dark` | `bg-error-dark` |
| `--color-error-light` | `--error-light` | `bg-error-light` |
| `--color-error-hover` | `--error-hover` | `hover:bg-error-hover` |
| `--color-error-active` | `--error-active` | `active:bg-error-active` |
| `--color-error-disabled` | `--error-disabled` | `disabled:bg-error-disabled` |
| `--color-info` | `--info` | `bg-info`, `text-info` |
| `--color-info-light` | `--info-light` | `bg-info-light` |
| `--color-info-hover` | `--info-hover` | `hover:bg-info-hover` |
| `--color-info-active` | `--info-active` | `active:bg-info-active` |
| `--color-info-disabled` | `--info-disabled` | `disabled:bg-info-disabled` |
| `--color-purple` | `--purple` | `bg-purple`, `text-purple` |
| `--color-purple-dark` | `--purple-dark` | `bg-purple-dark` |
| `--color-purple-light` | `--purple-light` | `bg-purple-light` |
| `--color-pending` | `--pending` | `bg-pending` |
| `--color-pending-light` | `--pending-light` | `bg-pending-light` |
| `--color-divider` | `--divider` | `border-divider` |

#### Status Color Utilities

| Token | Maps To | Usage |
|-------|---------|-------|
| `--color-status-completed-border` | `--status-completed-border` | `border-status-completed-border` |
| `--color-status-completed-header` | `--status-completed-header` | `text-status-completed-header` |
| `--color-status-mixing-border` | `--status-mixing-border` | `border-status-mixing-border` |
| `--color-status-mixing-header` | `--status-mixing-header` | `text-status-mixing-header` |
| `--color-status-blocked-border` | `--status-blocked-border` | `border-status-blocked-border` |
| `--color-status-blocked-header` | `--status-blocked-header` | `text-status-blocked-header` |
| `--color-status-pending-border` | `--status-pending-border` | `border-status-pending-border` |
| `--color-status-pending-header` | `--status-pending-header` | `text-status-pending-header` |

#### Typography Utilities

| Token | Maps To | Usage |
|-------|---------|-------|
| `--font-card-label` | `--fs-11` | Card label text size |
| `--font-card-title` | `--fs-15` | Card title text size |

#### Spacing Utilities

| Token | Maps To | Usage |
|-------|---------|-------|
| `--spacing-xs` | `--space-1` | `p-spacing-xs`, `gap-spacing-xs` |
| `--spacing-sm` | `--space-2` | `p-spacing-sm`, `gap-spacing-sm` |
| `--spacing-md` | `--space-4` | `p-spacing-md`, `gap-spacing-md` |
| `--spacing-lg` | `--space-6` | `p-spacing-lg`, `gap-spacing-lg` |
| `--spacing-xl` | `--space-8` | `p-spacing-xl`, `gap-spacing-xl` |

### Theme Support

All tokens automatically adapt to light/dark theme via the `.dark` selector in globals.css. No manual theme switching needed in component code - just use the tokens.

Dark mode overrides include adjusted colors for better contrast:
- Primary shifts to a cooler blue (#63b3ed)
- Backgrounds use dark surfaces (#1a202c, #2d3748)
- Text colors lighten for readability
- Status colors are slightly desaturated
- Shadows increase in opacity for visibility

---

## Components

### Button

Clickable button with variants for different actions and visual hierarchy.

#### API

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}
```

#### Variants

- **`primary`** (default): Primary actions, highest emphasis. Uses `--primary` background with white text.
- **`secondary`**: Secondary actions, outlined style with primary border and text.
- **`ghost`**: Tertiary actions, transparent background with minimal visual weight.
- **`destructive`**: Dangerous actions like delete. Uses `--error` background with white text.

#### Sizes

- **`sm`**: Height 32px (h-8), smaller text, reduced padding
- **`md`** (default): Height 40px (h-10), standard text
- **`lg`**: Height 48px (h-12), larger text, increased padding

#### Usage

```tsx
import Button from '@/components/ui/Button';

// Primary button (default)
<Button>Save Changes</Button>

// With variant and size
<Button variant="secondary" size="lg">Cancel</Button>

// With icon
<Button variant="destructive" icon={<Trash />}>Delete</Button>

// Loading state
<Button loading>Processing...</Button>

// Disabled
<Button disabled>Unavailable</Button>
```

#### Do

- Use `primary` for the main action in a section
- Use `destructive` for irreversible actions with confirmation
- Provide meaningful text - avoid generic "Click here"
- Use the `icon` prop for icon placement (ensures proper spacing)

#### Don't

- Use multiple `primary` buttons in the same context (reduces hierarchy)
- Use `ghost` for critical actions (low visual prominence)
- Manually add loading spinners - use the `loading` prop

#### Accessibility

- Keyboard accessible with Enter/Space
- Loading state sets `aria-busy="true"` and disables interaction
- Disabled state sets `aria-disabled` for screen readers
- Icon-only buttons need `aria-label`: `<Button icon={<X />} aria-label="Close dialog" />`
- Focus ring visible on keyboard navigation using `focus-visible:ring-2`

**WCAG Compliance:** Passes axe-core automated checks. Verified for keyboard accessibility and screen reader announcements.

---

### Card

Container component with optional header, content, and footer using compound pattern.

#### API

```tsx
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
  children: React.ReactNode;
}

// Compound components
Card.Header: ({ children, className }) => JSX.Element
Card.Content: ({ children, className }) => JSX.Element
Card.Footer: ({ children, className }) => JSX.Element
```

#### Variants

- **`default`**: Border style using `--divider` color
- **`elevated`**: Shadow style (`shadow-[0_4px_12px_rgba(0,0,0,0.08)]`) without border

#### Usage

```tsx
import Card from '@/components/ui/Card';

// Basic card
<Card>
  <p>Card content goes here</p>
</Card>

// With compound pattern
<Card>
  <Card.Header>Settings</Card.Header>
  <Card.Content>
    <p>Configure your preferences</p>
  </Card.Content>
  <Card.Footer>
    <Button variant="ghost">Cancel</Button>
    <Button>Save</Button>
  </Card.Footer>
</Card>

// Elevated variant
<Card variant="elevated">
  <Card.Content>Elevated card with shadow</Card.Content>
</Card>

// Clickable card
<Card onClick={() => navigate('/details')}>
  <Card.Content>Click to view details</Card.Content>
</Card>
```

#### Do

- Use compound pattern (Header/Content/Footer) for structured layouts
- Use `elevated` variant for cards that need visual separation from page
- Add `onClick` for navigational cards
- Pass additional className to compound components for custom spacing

#### Don't

- Nest Card inside Card (creates visual confusion)
- Use Card for simple inline content (use plain div with tokens)
- Mix Header/Content/Footer from different Card instances

#### Accessibility

- Clickable cards automatically get `role="button"` and `tabIndex={0}`
- Focus ring visible on keyboard navigation for clickable cards
- Non-clickable cards are static containers (no interactive role)
- Header renders as `<h3>` for proper heading hierarchy

**WCAG Compliance:** Passes axe-core automated checks.

---

### Input

Text input field with label, helper text, and error states.

#### API

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}
```

#### Usage

```tsx
import Input from '@/components/ui/Input';

// Basic input
<Input placeholder="Enter text" />

// With label
<Input label="Email Address" placeholder="you@example.com" />

// With helper text
<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>

// With error
<Input
  label="Email"
  value={email}
  error="Invalid email format"
/>

// Disabled
<Input label="Username" value="readonly" disabled />

// Required
<Input label="Full Name" required />
```

#### Do

- Always provide a `label` for accessibility (associates label with input via `htmlFor`/`id`)
- Use `error` prop for validation messages (not inline text)
- Use `helperText` for supplementary information before user interaction
- Set appropriate `type` attribute (email, password, tel, etc.)

#### Don't

- Use placeholder as a substitute for label (disappears on input)
- Manually add error styling - use the `error` prop
- Display both `error` and `helperText` simultaneously (error takes precedence)

#### Accessibility

- Label automatically linked to input via auto-generated `id`
- Error state sets `aria-invalid="true"`
- Error message linked via `aria-describedby`
- Required fields get `aria-required="true"` when `required` prop is set
- Error messages use `role="alert"` with `aria-live="polite"` for screen reader announcements
- Error icon is decorative (`aria-hidden="true"`)

**WCAG Compliance:** Passes axe-core automated checks. Full ARIA implementation for form accessibility.

---

### Select

Dropdown select field with label, helper text, error states, and options array.

#### API

```tsx
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}
```

#### Usage

```tsx
import Select from '@/components/ui/Select';

// Basic select
<Select
  label="Country"
  options={[
    { value: '', label: 'Select a country...' },
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
  ]}
/>

// With error
<Select
  label="Status"
  error="Please select a status"
  options={[
    { value: '', label: 'Select...' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]}
/>

// Disabled
<Select
  label="Region"
  disabled
  options={[{ value: 'na', label: 'North America' }]}
/>
```

#### Do

- Always include an empty/placeholder option for optional selects
- Use `label` prop for accessibility
- Provide meaningful option labels

#### Don't

- Use Select for more than 10-15 options (consider autocomplete instead)
- Manually style options - browser controls these
- Omit the `options` prop (required)

#### Accessibility

- Label linked to select via `htmlFor`/`id`
- Error state sets `aria-invalid="true"`
- Error message linked via `aria-describedby`
- Required fields get `aria-required="true"`
- Custom chevron icon is decorative (`aria-hidden="true"`)

**WCAG Compliance:** Passes axe-core automated checks.

---

### Textarea

Multi-line text input with label, helper text, and error states.

#### API

```tsx
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}
```

#### Usage

```tsx
import Textarea from '@/components/ui/Textarea';

// Basic textarea
<Textarea placeholder="Enter description..." />

// With label and rows
<Textarea
  label="Description"
  placeholder="Enter description..."
  rows={4}
/>

// With helper text
<Textarea
  label="Notes"
  helperText="Maximum 500 characters"
/>

// With error
<Textarea
  label="Comments"
  error="Comments are required"
/>

// Disabled
<Textarea label="System Notes" disabled value="Read-only content" />
```

#### Do

- Set appropriate `rows` for expected content length
- Use `helperText` for character limits or formatting hints
- Use `label` prop for accessibility

#### Don't

- Use Textarea for single-line input - use Input instead
- Manually resize via CSS - component supports `resize-y` by default

#### Accessibility

- Same ARIA pattern as Input component
- Label linked via auto-generated `id`
- Error states announced via `role="alert"` and `aria-live="polite"`
- Minimum height ensures comfortable text entry (100px)

**WCAG Compliance:** Passes axe-core automated checks.

---

### StatusBadge

Visual indicator for order status with color-coded variants.

#### API

```tsx
import { OrderStatus } from '@/types/order';

interface StatusBadgeProps {
  status: OrderStatus;
  // OrderStatus = 'Pending' | 'Producing' | 'Ready' | 'In Transit' | 'Complete'
}
```

#### Usage

```tsx
import StatusBadge from '@/components/ui/StatusBadge';

<StatusBadge status="Pending" />
<StatusBadge status="Producing" />
<StatusBadge status="Ready" />
<StatusBadge status="In Transit" />
<StatusBadge status="Complete" />
```

#### Status Colors

| Status | Background | Text | Label |
|--------|------------|------|-------|
| Pending | `--pending-light` | `--text-secondary` | "Pending" |
| Producing | `--warning-light` | `--warning` | "Producing" |
| Ready | `--info-light` | `--info` | "Ready" |
| In Transit | `--purple-light` | `--purple` | "Transit" |
| Complete | `--success-light` | `--success-dark` | "Complete" |

#### Do

- Use status values that match the OrderStatus type
- Place badges consistently (e.g., always in same table column)
- Let the component handle color mapping

#### Don't

- Create custom status values - use the OrderStatus type
- Override badge colors via className (breaks semantic meaning)

#### Accessibility

- Status text is visible and readable
- Color is not the only indicator (text label accompanies color)
- Uses semantic color combinations for sufficient contrast

**WCAG Compliance:** Passes axe-core automated checks. Uses text + color combination for status indication.

---

### FilterPill

Toggleable filter button for filtering lists with count indicator.

#### API

```tsx
interface FilterPillColorConfig {
  bg: string;
  text: string;
  dot?: string;
  countBg?: string;
}

interface FilterPillProps {
  label: string;
  count: number;
  color?: FilterPillColorConfig;
  isActive: boolean;
  onClick: () => void;
  showDot?: boolean;
  dotColor?: string;
}
```

#### Usage

```tsx
import FilterPill from '@/components/ui/FilterPill';

// Basic usage with state
const [activeFilters, setActiveFilters] = useState<string[]>([]);

<FilterPill
  label="Pending"
  count={12}
  isActive={activeFilters.includes('pending')}
  onClick={() => toggleFilter('pending')}
/>

// With custom color config
<FilterPill
  label="Warning"
  count={3}
  isActive={false}
  color={{
    bg: 'bg-[var(--warning-light)]',
    text: 'text-[var(--warning)]',
    dot: 'bg-[var(--warning)]',
    countBg: 'bg-[var(--warning-light)]',
  }}
  onClick={() => {}}
/>

// With status dot
<FilterPill
  label="Active"
  count={5}
  isActive={true}
  showDot={true}
  onClick={() => {}}
/>
```

#### Do

- Show count when relevant (helps users understand filter impact)
- Allow multiple filters to be active simultaneously
- Use consistent color schemes across related filter groups

#### Don't

- Use FilterPill for navigation - use links or tabs instead
- Omit the count (provides useful context)
- Use without isActive state management

#### Accessibility

- Renders as `<button>` with `aria-pressed` state
- Keyboard accessible (Enter/Space to toggle)
- Includes `aria-label` with count: "Filter by {label}, {count} orders"
- Active state visually distinct with primary color background

**WCAG Compliance:** Passes axe-core automated checks.

---

### Gauge

Vertical gauge component showing fill level with threshold-based colors.

#### API

```tsx
interface GaugeProps {
  /** Fill percentage (0-100) */
  fillPercentage: number;
  /** Primary label below gauge */
  label: string;
  /** Secondary label below primary label */
  sublabel?: string;
}
```

#### Threshold Colors

| Percentage | Color | Meaning |
|------------|-------|---------|
| > 25% | `--success` (green) | Normal level |
| 10-25% | `--warning` (yellow) | Low level |
| < 10% | `--error` (red) | Critical level |

#### Usage

```tsx
import { Gauge } from '@/components/ui/Gauge';

// Normal level
<Gauge
  fillPercentage={75}
  label="Bin A-1"
  sublabel="Layer Feed"
/>

// Warning level
<Gauge
  fillPercentage={20}
  label="Bin B-2"
  sublabel="Starter"
/>

// Critical level
<Gauge
  fillPercentage={8}
  label="Bin C-3"
/>

// Values are clamped to 0-100
<Gauge fillPercentage={150} label="Overflow" />  // Renders as 100%
<Gauge fillPercentage={-10} label="Underflow" /> // Renders as 0%
```

#### Do

- Use appropriate labels that identify the bin/container
- Include sublabel for additional context (feed type, product)
- Let the component determine threshold colors automatically

#### Don't

- Override threshold colors - they're semantically meaningful
- Use for non-percentage values (convert to 0-100 first)
- Display multiple gauges without consistent spacing

#### Accessibility

- Visual representation uses color AND fill level for redundancy
- Text labels provide accessible identification
- Percentage displayed inside gauge for immediate readability
- Color is not sole indicator of status (fill height provides redundant information)

**WCAG Compliance:** Passes axe-core automated checks. Color is not sole indicator of status.

---

### Timeline

Chronological event display with expand/collapse functionality.

#### API

```tsx
import { ActivityEventType } from '@/types/activity';

interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  // ActivityEventType = 'order_placed' | 'production_started' | 'ready' |
  //                     'out_for_delivery' | 'delivered' | 'delivery_completed' |
  //                     'bin_alert_low' | 'bin_alert_critical'
  title: string;
  description: string;
  timestamp: Date;
  // Optional order-specific fields
  orderId?: string;
  orderQuantity?: number;
  orderProduct?: string;
  orderStatus?: string;
}

interface TimelineProps {
  events: ActivityEvent[];
}
```

#### Event Colors

| Event Type | Color | Icon |
|------------|-------|------|
| order_placed | `--primary` | FileText |
| production_started | `--primary` | Factory |
| ready | `--primary` | CheckCircle |
| out_for_delivery | `--primary` | Truck |
| delivered | `--success` | CheckCircle |
| delivery_completed | `--success` | Truck |
| bin_alert_low | `--warning` | AlertTriangle |
| bin_alert_critical | `--error` | AlertTriangle |

#### Usage

```tsx
import { Timeline } from '@/components/ui/Timeline';

const events = [
  {
    id: '1',
    type: 'order_placed',
    title: 'Order #1234 placed',
    description: '50 tons Layer Feed',
    timestamp: new Date('2024-01-15T10:30:00'),
    orderId: '1234',
    orderQuantity: 50,
    orderProduct: 'Layer Feed',
    orderStatus: 'Pending',
  },
  {
    id: '2',
    type: 'delivery_completed',
    title: 'Delivery completed',
    description: 'Order #1233 delivered to Farm A',
    timestamp: new Date('2024-01-16T08:00:00'),
  },
];

<Timeline events={events} />

// Empty state handled automatically
<Timeline events={[]} />
```

#### Do

- Sort events chronologically before passing (newest first or oldest first consistently)
- Include orderId for order events to enable expand/collapse detail view
- Use descriptive titles and descriptions

#### Don't

- Display more than ~50 events without pagination (performance)
- Mix event types inappropriately
- Pass unsorted event arrays

#### Accessibility

- Events are focusable buttons for keyboard navigation
- Expand/collapse state announced via `aria-expanded`
- Keyboard support: Enter/Space to toggle expansion
- Focus ring visible on keyboard navigation
- Event icons are decorative (content conveyed via text)

**WCAG Compliance:** Passes axe-core automated checks.

---

### ThemeToggle

Three-way toggle for switching between light, dark, and system themes.

#### API

```tsx
// No props - uses next-themes internally
function ThemeToggle(): JSX.Element
```

#### Usage

```tsx
import ThemeToggle from '@/components/ui/ThemeToggle';

// In header or settings area
<ThemeToggle />
```

#### Options

| Option | Icon | Description |
|--------|------|-------------|
| Light | Sun | Forces light mode |
| Dark | Moon | Forces dark mode |
| System | Monitor | Follows OS preference |

#### Do

- Place consistently in header or settings area
- Ensure it's reachable via keyboard navigation
- Use as the single source of theme control

#### Don't

- Create custom theme switching logic - use this component
- Hide or disable based on theme (always show all options)
- Use multiple ThemeToggle instances on the same page

#### Accessibility

- Uses `role="radiogroup"` with `aria-label="Theme selection"`
- Each option is a button with `role="radio"` and `aria-checked`
- Keyboard accessible (Tab to focus, Enter/Space to select)
- Active option visually distinct with primary background
- Icons paired with text labels for clarity

**WCAG Compliance:** Passes axe-core automated checks. Keyboard accessible toggle with proper radio group semantics.
