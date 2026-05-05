# Phase 15: Bin Visualization - UI Design Contract

**Created:** 2026-05-05
**Status:** Approved
**Design Source:** designs/customer-detail.pen (lines 495-810)

## Overview

Vertical tank gauge components displaying bin fill levels with threshold-based coloring. Integrated into customer detail page within the contact info section.

## Components

### BinGauge

Single bin visualization showing fill level as a vertical tank.

**Dimensions:**
- Container: 60×auto (vertical flex)
- Gauge: 40×70px with 8px border-radius
- Border: 2px solid #e2e8f0

**Fill Bar:**
- Position: Anchored to bottom, grows upward
- Width: 36px (2px inset from edges)
- Height: Calculated from fillPercentage (0-100%)
- Corner radius: 0 0 6 6 (bottom corners only)

**Colors (threshold-based):**
- Normal (>25%): #48bb78 (green/success)
- Low (10-25%): #f59e0b (yellow/warning)
- Critical (<10%): #e53e3e (red/error)

**Percentage Text:**
- Position: Centered inside gauge
- Font: 12px bold
- Color: #ffffff when fill is high, #2d3748 when fill is low (contrast)

**Labels (below gauge):**
- Location code: 10px bold #2d3748
- Feed type: 10px normal #a0aec0
- Gap between gauge and labels: 8px

### BinGaugeRow

Horizontal row of BinGauge components.

**Layout:**
- Direction: horizontal (flex row)
- Gap: 24px between gauges
- Alignment: flex-end (bottom-aligned)
- Width: fill container

**Empty State:**
- Hide entire section when customer has no bins (D-01 from CONTEXT.md)

## Integration

**Location:** Customer detail page, within contact info card after divider
**Data:** `getBinsByCustomerId(customerId)` from `src/services/bins.ts`
**Types:** `Bin` from `src/types/bin.ts`

## Interaction

- Static display (no interactivity in Phase 15)
- Future phases may add hover tooltips or click actions

## Accessibility

- Color not sole indicator: percentage text always visible
- Semantic HTML: Use appropriate ARIA labels for fill levels

---

*UI-SPEC approved: 2026-05-05*
*Design source: designs/customer-detail.pen*
