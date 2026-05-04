---
quick_id: 260504-kan
description: Add Orders tab view to customer detail design
date: 2026-05-04
status: complete
---

# Quick Task: Add Orders Tab View

## Objective

Add a second frame to the customer-detail.pen design file showing the "Orders" tab selected (vs the existing Activity Timeline tab view).

## Tasks

### Task 1: Add Orders Tab View Frame

**Action:** Add new top-level frame to customer-detail.pen

**Details:**
- Position at x: 1960 (next to existing frame)
- Duplicate header section (customer info, stats, bins)
- Modify tab bar: Orders tab active (teal + border), Activity Timeline inactive (gray)
- Replace timeline content with orders table

**Table Columns:**
- ORDER # (order number)
- PRODUCT (feed type)
- QUANTITY (tons)
- DELIVERY (date)
- STATUS (badge)

**Sample Data:** 5 orders with mix of statuses (In Production, Ready, Complete)

## Files Modified

| File | Action |
|------|--------|
| designs/customer-detail.pen | Add new frame with Orders tab view |
