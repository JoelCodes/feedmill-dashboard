---
id: 260504-kgl
type: quick
status: in-progress
started: 2026-05-04T21:43:55Z
---

# Quick Task: Orders Tab Enhancement for Customer Detail Design

## Goal
Make the Orders tab on the customer detail design page look closer to the dashboard orders view by adding:
1. Search bar for filtering orders
2. Status filter pills matching dashboard style
3. Row selection highlighting
4. Timeline panel for selected order (matching OrderDetails component)

## Reference Components
- Dashboard orders table: `src/components/OrdersTable.tsx`
- Order timeline panel: `src/components/OrderDetails.tsx`
- Target design file: `designs/customer-detail.pen`

## Tasks

### 1. Add Search Bar to Orders Section
Add a search bar above the table header matching the dashboard style:
- Search icon on left
- Placeholder text "Search orders..."
- Same styling as OrdersTable search

### 2. Add Status Filter Pills
Add filter pills below search bar matching OrdersTable:
- In Production, Ready, Complete status pills
- Same pill styling pattern from dashboard

### 3. Add Row Selection
Update order rows to show selection state:
- First row selected by default (highlighted with primary/10 background)
- Cursor pointer on hover

### 4. Add Timeline Panel
Add a timeline details panel to the right of the orders table:
- Fixed width panel (like OrderDetails at w-120)
- Shows selected order details header
- Timeline events matching OrderDetails styling

## Design Coordinates
- Orders Tab frame starts at x: 1960
- Orders Section current children: table header, divider, 5 rows
- Need to restructure into: search → filters → horizontal layout (table | timeline)
