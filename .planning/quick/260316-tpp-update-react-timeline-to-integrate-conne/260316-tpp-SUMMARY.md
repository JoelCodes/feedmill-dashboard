# Quick Task 260316-tpp: Update React Timeline

## Summary

Updated the React timeline component to match the design change where connector lines are integrated into each timeline item rather than being separate components.

## Changes

### TimelineItem Component
- Added `showConnector` prop to control whether a connector line appears below the item
- Added connector line div with `flex-1` to fill remaining vertical space
- Added `items-stretch` to parent flex container so left column stretches to content height
- Added `shrink-0` to icon circle to prevent compression
- Added `pb-8` padding to content column for spacing when connector is shown

### Timeline Rendering
- Removed wrapping `<div>` elements around each TimelineItem
- Changed from rendering `<TimelineConnector>` between items to passing `showConnector` prop
- Simplified pending badge divider section (removed extra connector)

### Removed
- `TimelineConnector` component (no longer needed)

## Files Changed

- `src/components/OrderDetails.tsx`

## Verification

- Lint: Passed (warnings only for Tailwind class order)
- Build: Compiled successfully
