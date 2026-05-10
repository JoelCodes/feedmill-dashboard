# Phase 22: Auth Page Design - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 22-auth-page-design
**Areas discussed:** Header user area, Design file strategy, Sign-in page documentation

---

## Header User Area

### Position

| Option | Description | Selected |
|--------|-------------|----------|
| Far right (Recommended) | After notifications, rightmost element. Standard pattern — matches most dashboards | ✓ |
| Before notifications | User info, then bell icon. Puts user first, notifications secondary | |
| Replace settings link | Merge user and settings into dropdown. Cleaner but changes existing pattern | |

**User's choice:** Far right (Recommended)
**Notes:** None

### Display

| Option | Description | Selected |
|--------|-------------|----------|
| Avatar + name | Shows user avatar image and name side by side. Full identification at a glance | ✓ |
| Avatar only | Just the circular avatar. Minimalist, click to see dropdown with name/email | |
| Name + avatar | Name first, then avatar. Emphasizes text over image | |

**User's choice:** Avatar + name
**Notes:** None

### Sign-out

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown menu (Recommended) | Click user area → dropdown with Sign Out option. Matches Clerk's UserButton default | ✓ |
| Visible button always | Dedicated 'Sign Out' button visible in header. More obvious but takes space | |
| Inside settings only | Sign out moved to settings page. Cleaner header, less discoverable | |

**User's choice:** Dropdown menu (Recommended)
**Notes:** None

### Avatar Size

| Option | Description | Selected |
|--------|-------------|----------|
| 32px (Recommended) | Matches header icon sizes. Consistent with settings/notifications icons | ✓ |
| 24px | Smaller, more subtle. Same as notification bell icon | |
| 40px | Larger, more prominent. Makes user area stand out | |

**User's choice:** 32px (Recommended)
**Notes:** None

### Menu Items

| Option | Description | Selected |
|--------|-------------|----------|
| Name/email + Sign Out | Minimal — just show who's signed in and way to sign out | ✓ |
| Name/email + Manage Account + Sign Out | Adds 'Manage Account' link to Clerk's user profile page | |
| Full Clerk UserButton | Use Clerk's default dropdown with all options (profile, security, sign out) | |

**User's choice:** Name/email + Sign Out
**Notes:** None

---

## Design File Strategy

### File Location

| Option | Description | Selected |
|--------|-------------|----------|
| Add to component-library.pen (Recommended) | Extends existing design system file. UserButton becomes part of component library | |
| New auth.pen file | Separate file for auth-specific designs. Clean separation but another file to maintain | |
| New page-designs.pen | File for full page layouts (sign-in, future pages). Different from components | |

**User's choice:** page-layout.pen (free text response)
**Notes:** User chose existing page-layout.pen file instead of suggested options

### Contents

| Option | Description | Selected |
|--------|-------------|----------|
| Full designs | Header user area states + sign-in page layout with all variants | |
| Header user area only | Just the component being added. Sign-in already works, skip documenting it | ✓ |
| Annotated specs | Designs plus detailed specs (sizes, tokens, spacing values) | |

**User's choice:** Header user area only
**Notes:** None

### States

| Option | Description | Selected |
|--------|-------------|----------|
| Default + hover + dropdown open | Three key states: resting, hover, and when menu is showing | ✓ |
| All interaction states | Default, hover, active, focus, dropdown open. Full coverage | |
| Default + dropdown only | Just static and menu open. Simpler, let CSS handle hover | |

**User's choice:** Default + hover + dropdown open
**Notes:** None

### Themes

| Option | Description | Selected |
|--------|-------------|----------|
| Both themes (Recommended) | Design shows both light and dark. Matches design system pattern | ✓ |
| Light only, tokens handle dark | One design, rely on semantic tokens to adapt. Faster | |
| You decide | Let Claude choose based on design system patterns | |

**User's choice:** Both themes (Recommended)
**Notes:** None

---

## Sign-in Page Documentation

| Option | Description | Selected |
|--------|-------------|----------|
| Skip documentation | Already working and themed. No design file needed — code is source of truth | ✓ |
| Minimal reference | Add simple sign-in frame to page-layout.pen for completeness | |
| Full design spec | Document sign-in page layout, states, error handling in design file | |

**User's choice:** Skip documentation
**Notes:** Sign-in page is already implemented in Phase 20

---

## Claude's Discretion

None — all areas received explicit user decisions.

## Deferred Ideas

None — discussion stayed within phase scope.
