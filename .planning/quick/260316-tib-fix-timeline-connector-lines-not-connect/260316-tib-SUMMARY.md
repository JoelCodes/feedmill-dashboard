# Quick Task 260316-tib: Fix Timeline Connector Lines

## Summary

Fixed timeline connector lines not connecting well to icons on the Order Details screen in the .pen design file.

## Problem

The timeline in the Order Details card had separate "connector" frames between timeline items. These connector frames created visual gaps because the lines didn't extend into the step rows, making the timeline appear disconnected.

## Solution

Deleted the 3 separate connector frames:
- `Y3QnU` (conn1) - between Step 1 and Step 2 in Completed Timeline
- `73dk2` (Connector 4) - between Step 3 and Step 4 in Future Steps
- `ymX9M` (Connector 5) - between Step 4 and Step 5 in Future Steps

Each step's left column already contained a vertical line rectangle using `fill_container` height, which naturally extends to connect with the next item. The separate connector frames were redundant and caused visual gaps.

## Files Changed

- `designs/cgm-dashboard.pen` - Deleted 3 connector frame nodes

## Verification

Screenshots confirmed:
- Completed Timeline: Line from Step 1 connects directly to Step 2
- Future Steps: Lines connect Quality Check → Delivery → Delivery Received
- No visual gaps between timeline items and their connectors
