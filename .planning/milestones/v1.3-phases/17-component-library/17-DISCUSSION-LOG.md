# Phase 17: Component Library - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** 17-component-library
**Areas discussed:** Component location, Button styling, Card composition, Form validation UI

---

## Component Location

| Option | Description | Selected |
|--------|-------------|----------|
| src/components/ui/ (Recommended) | StatusBadge is already here. Add Button, Input, Card alongside. Keeps all UI primitives together. | ✓ |
| src/components/design-system/ | Dedicated folder signals these are the "blessed" reusable components. More explicit separation. | |
| You decide | Claude picks based on codebase conventions | |

**User's choice:** src/components/ui/ (Recommended)
**Notes:** Keeps consistency with existing StatusBadge location.

---

## Button Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Match existing primary (Recommended) | Primary = --primary (teal), Secondary = --bg-card + border, Ghost = transparent, Destructive = --error | ✓ |
| Neutral primary | Primary = dark gray/black, Secondary = outline, Ghost = transparent — more understated palette | |
| You decide | Claude picks based on existing token palette | |

**User's choice:** Match existing primary (Recommended)
**Notes:** Leverages existing teal primary color throughout the app.

---

## Card Composition

| Option | Description | Selected |
|--------|-------------|----------|
| Dot notation (Recommended) | Card.Header, Card.Content, Card.Footer — single import, intuitive nesting. Common shadcn/Radix pattern. | ✓ |
| Separate imports | CardHeader, CardContent, CardFooter as separate exports — more explicit, tree-shakeable | |
| You decide | Claude picks based on what works best with CVA | |

**User's choice:** Dot notation (Recommended)
**Notes:** Follows common React compound component pattern.

---

## Form Validation UI

| Option | Description | Selected |
|--------|-------------|----------|
| Border + icon (Recommended) | Red border on error state PLUS small error icon (exclamation) inside the input. Clear visual signal. | ✓ |
| Border only | Red border on error state, no icon. Simpler, relies on error text below for details. | |
| Border + shake | Red border plus subtle shake animation on validation fail. More attention-grabbing. | |
| You decide | Claude picks based on accessibility best practices | |

**User's choice:** Border + icon (Recommended)
**Notes:** Provides clear visual affordance for screen readers and sighted users.

### Focus on Invalid Input (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep red border + focus ring | Error state stays visible. Focus ring appears on top of red border. User always knows it's still invalid. | ✓ |
| Normal focus ring only | Focus takes over, hides error state temporarily. Less visual clutter while editing. | |
| You decide | Claude picks based on what's clearest for users | |

**User's choice:** Keep red border + focus ring
**Notes:** Ensures user always sees validation state, even while editing.

---

## Claude's Discretion

None — user provided explicit choices for all areas.

## Deferred Ideas

None — discussion stayed within phase scope.
