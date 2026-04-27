---
status: complete
---

# Quick Task 260427-mwc: Update pages to match .pen design files

## Summary

Updated the mill-production page to use the shared page layout (Sidebar + Header) matching the design specification in mill-production.pen and page-layout.pen.

## Changes Made

1. **src/app/mill-production/page.tsx**
   - Added Sidebar and Header component imports
   - Wrapped content in shared layout structure (Sidebar + main content area)
   - Passed `activeItem="production-lines"` to Sidebar for correct nav highlighting
   - Passed `title="Mill Production"` to Header for correct breadcrumb/title

2. **src/components/Header.tsx**
   - Added `title` prop with default value "Dashboard"
   - Updated breadcrumb and title to use the prop value

3. **src/components/Sidebar.tsx**
   - Changed nav items to use `id` instead of static `active` flag
   - Added `activeItem` prop with default value "dashboard"
   - Navigation highlighting now driven by prop comparison

## Verification

- Build passes: `npm run build` successful
- Layout matches page-layout.pen specification
- Production cards match mill-production.pen specification (order number, customer, weight • product, delivery time)

## Commit

e17777f - feat(mill-production): use shared page layout matching design spec
