---
phase: 22
plan: 01
subsystem: design
tags: [auth, ui-design, header, user-area, clerk]
dependency_graph:
  requires: [component-library.pen design system]
  provides: [header user area component designs]
  affects: [Phase 23 implementation]
tech_stack:
  added: []
  patterns: [theme variants, reusable components, token references]
key_files:
  created: []
  modified:
    - designs/page-layout.pen
decisions: []
metrics:
  duration: 2min
  completed: 2026-05-10
---

# Phase 22 Plan 01: Header User Area Design - Summary

**One-liner:** Created header user area component designs with avatar, name display, hover state, and dropdown menu in both light and dark themes using semantic token system.

## Objective

Design the header user area component in Pencil.dev's page-layout.pen file for Phase 23 implementation using Clerk's UserButton component.

## What Was Built

**Design file updated:** `designs/page-layout.pen`

### Components Created

1. **HeaderUserArea/Default** - Reusable component
   - 32px circular avatar with primary color background
   - "JD" initials placeholder in white
   - "John Doe" name display at 13px weight 500
   - 8px gap between avatar and name
   - Card background with 8px border radius
   - Horizontal layout with center alignment

2. **HeaderUserArea/Hover** - State variant
   - Reference to Default component with fill override
   - Background changed to $bg-page for subtle hover effect

3. **UserDropdownMenu** - Reusable dropdown component
   - 200px width with 12px border radius
   - Shadow effect (0, 4, 12, #00000026)
   - User info section: name + email stacked vertically
   - Divider line between sections
   - Sign Out button (40px height, 16px padding)
   - All text uses semantic tokens

4. **HeaderUserArea/DropdownOpen** - Composite state
   - Shows trigger at top right
   - Dropdown positioned 8px below trigger
   - Complete interaction state for design reference

### Documentation Artboards

**Light Mode Artboard** (x: 0, y: 1300)
- Shows all three states side by side
- Light theme token values applied
- Labels for each state

**Dark Mode Artboard** (x: 900, y: 1300)
- Shows all three states side by side
- Dark theme token values applied
- Demonstrates theme switching behavior

### Design System Integration

**Version upgrade:** 2.8 → 2.11 (theme support)

**Themes added:**
- Light mode
- Dark mode

**Variables added (13 tokens):**
- bg-card: #ffffff (light) / #2d3748 (dark)
- bg-page: #f8f9fa (light) / #1a202c (dark)
- divider: #e2e8f0 (light) / #4a5568 (dark)
- primary: #4fd1c5 (light) / #63b3ed (dark)
- primary-hover: #45b8ad (light) / #7ab8ef (dark)
- text-primary: #2d3748 (light) / #e2e8f0 (dark)
- text-secondary: #a0aec0 (both modes)
- text-white: #ffffff (static)
- radius-md: 8px
- radius-lg: 12px
- space-1: 4px
- space-2: 8px
- space-4: 16px

## Deviations from Plan

**Auto-approved checkpoint:** Task 2 (human-verify checkpoint) was auto-approved due to active auto_advance mode. Design meets all specifications:
- Avatar is 32px circle with primary background
- Name displays at 13px weight 500
- Hover state shows bg-page background
- Dropdown has name/email stacked + Sign Out
- Light and dark themes both implemented
- All components use token references

## Decisions Made

None - plan executed exactly as specified.

## Verification

**Automated verification passed:**
- ✓ version: 2.11
- ✓ themes: {"mode":["light","dark"]}
- ✓ variables count: 13
- ✓ HeaderUserArea/Default component exists
- ✓ HeaderUserArea/Hover component exists
- ✓ HeaderUserArea/DropdownOpen component exists
- ✓ UserDropdownMenu component exists
- ✓ "Sign Out" text present
- ✓ 3 reusable components created
- ✓ JSON is valid (Node.js parse successful)

**Visual verification:** Auto-approved in auto mode. Design ready for Phase 23 implementation.

## Known Stubs

None - this is a design-only phase. No code stubs.

## Threat Flags

None - design file contains only visual specifications, no security-relevant surface introduced.

## Self-Check: PASSED

**Files created/modified verification:**
- ✓ designs/page-layout.pen exists and contains all required components

**Commit verification:**
- ✓ Commit 44c01b9 exists: "feat(22-01): add header user area components to page-layout.pen"

## Next Steps

Phase 23 will implement these designs using Clerk's UserButton component with appearance customization matching the token system.

**Implementation notes for Phase 23:**
- Use Clerk's `<UserButton />` component
- Apply appearance prop with token mapping from `clerk-theme.ts` pattern
- Position after notifications bell in Header.tsx
- Dropdown menu behavior handled by Clerk
- Theme switching automatic via CSS variables
