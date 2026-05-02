# Phase 10: Design - Pattern Map

**Mapped:** 2026-05-01
**Files analyzed:** 2 (design files to create)
**Analogs found:** 2 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `designs/customers.pen` | design | static | `designs/order-dashboard.pen` | exact |
| `designs/customer-detail.pen` | design | static | `designs/order-dashboard.pen` | exact |

## Pattern Assignments

### `designs/customers.pen` (design, static)

**Analog:** `designs/order-dashboard.pen`

**File structure pattern** (lines 1-14):
```json
{
  "version": "2.8",
  "children": [
    {
      "type": "frame",
      "id": "unique-id",
      "x": 0,
      "y": 0,
      "name": "Customer List View",
      "clip": true,
      "width": 1920,
      "height": 1200,
      "fill": "#f8f9faff",
      "children": [
        // Sidebar and Main Content frames
      ]
    }
  ]
}
```

**Search box pattern** (order-dashboard.pen lines 549-592):
```json
{
  "type": "frame",
  "id": "zfTsg",
  "name": "Search",
  "clip": true,
  "width": 200,
  "height": 40,
  "fill": "#ffffffff",
  "cornerRadius": 15,
  "stroke": {
    "align": "inside",
    "thickness": 0.5,
    "fill": "#e2e8f0ff"
  },
  "gap": 8,
  "padding": [0, 12],
  "alignItems": "center",
  "children": [
    {
      "type": "icon_font",
      "id": "bVGMx",
      "name": "searchIcon",
      "width": 14,
      "height": 14,
      "iconFontName": "search",
      "iconFontFamily": "lucide",
      "fill": "#a0aec0ff"
    },
    {
      "type": "text",
      "id": "sMgSr",
      "name": "searchText",
      "fill": "#a0aec0ff",
      "content": "Search customers by name...",
      "lineHeight": 1.5,
      "fontFamily": "Helvetica",
      "fontSize": 12,
      "fontWeight": "normal"
    }
  ]
}
```

**Table structure pattern** (order-dashboard.pen lines 1487-1607):
```json
{
  "type": "frame",
  "id": "WOtJj",
  "name": "Table",
  "width": "fill_container",
  "layout": "vertical",
  "children": [
    {
      "type": "frame",
      "id": "wANgq",
      "name": "Table Header",
      "width": "fill_container",
      "padding": [10, 0],
      "children": [
        {
          "type": "frame",
          "id": "xAaBN",
          "name": "thName",
          "width": "fill_container",
          "children": [
            {
              "type": "text",
              "id": "yRVz7",
              "name": "thNameText",
              "fill": "#a0aec0ff",
              "content": "CUSTOMER NAME",
              "lineHeight": 1.5,
              "fontFamily": "Helvetica",
              "fontSize": 10,
              "fontWeight": "700"
            }
          ]
        },
        {
          "type": "frame",
          "id": "aNug5",
          "name": "thStatus",
          "width": "fill_container",
          "children": [
            {
              "type": "text",
              "id": "cfAHk",
              "name": "thStatusText",
              "fill": "#a0aec0ff",
              "content": "STATUS",
              "lineHeight": 1.5,
              "fontFamily": "Helvetica",
              "fontSize": 10,
              "fontWeight": "700"
            }
          ]
        }
      ]
    },
    {
      "type": "rectangle",
      "id": "tOHzV",
      "name": "Header Line",
      "fill": "#e2e8f0ff",
      "width": "fill_container",
      "height": 1
    }
  ]
}
```

**Table row pattern** (order-dashboard.pen lines 1608-1664):
```json
{
  "type": "frame",
  "id": "SVXUs",
  "name": "Row 1",
  "width": "fill_container",
  "padding": [12, 0],
  "children": [
    {
      "type": "frame",
      "id": "yyP2C",
      "name": "r1c1",
      "width": "fill_container",
      "gap": 8,
      "alignItems": "center",
      "children": [
        {
          "type": "text",
          "id": "cqK8z",
          "name": "r1c1text",
          "fill": "#2d3748ff",
          "content": "Riverside Poultry Farm",
          "lineHeight": 1.5,
          "fontFamily": "Helvetica",
          "fontSize": 12,
          "fontWeight": "700"
        }
      ]
    },
    {
      "type": "frame",
      "name": "StatusIndicators",
      "gap": 8,
      "alignItems": "center",
      "children": [
        {
          "type": "icon_font",
          "name": "ordersIcon",
          "width": 14,
          "height": 14,
          "iconFontName": "package",
          "iconFontFamily": "lucide",
          "fill": "#4fd1c5ff"
        },
        {
          "type": "ellipse",
          "name": "changesDot",
          "fill": "#e53e3eff",
          "width": 8,
          "height": 8
        },
        {
          "type": "icon_font",
          "name": "binAlertIcon",
          "width": 14,
          "height": 14,
          "iconFontName": "alert-triangle",
          "iconFontFamily": "lucide",
          "fill": "#975a16ff"
        }
      ]
    }
  ]
}
```

**Alert dot pattern** (order-dashboard.pen lines 1662-1668):
```json
{
  "type": "ellipse",
  "id": "HzhAa",
  "name": "Alert Dot",
  "fill": "#e53e3eff",
  "width": 8,
  "height": 8
}
```

---

### `designs/customer-detail.pen` (design, static)

**Analog:** `designs/order-dashboard.pen`

**Page layout with sidebar pattern** (page-layout.pen lines 1-620):
```json
{
  "version": "2.8",
  "children": [
    {
      "type": "frame",
      "id": "page-layout",
      "x": 0,
      "y": 0,
      "name": "Customer Detail Page",
      "clip": true,
      "width": 1920,
      "height": 1200,
      "fill": "#f8f9faff",
      "children": [
        {
          "type": "frame",
          "name": "Sidebar",
          "width": 280,
          "height": "fill_container",
          "fill": "#ffffffff",
          "layout": "vertical",
          "gap": 8,
          "padding": 24,
          "children": []
        },
        {
          "type": "frame",
          "name": "Main Content",
          "width": "fill_container",
          "height": "fill_container",
          "layout": "vertical",
          "gap": 24,
          "padding": [24, 32],
          "children": []
        }
      ]
    }
  ]
}
```

**Header pattern** (page-layout.pen lines 471-616):
```json
{
  "type": "frame",
  "id": "ksWVD",
  "name": "Header",
  "width": "fill_container",
  "justifyContent": "space_between",
  "alignItems": "center",
  "children": [
    {
      "type": "frame",
      "name": "Header Left",
      "layout": "vertical",
      "gap": 2,
      "children": [
        {
          "type": "text",
          "name": "headerTitle",
          "fill": "#2d3748ff",
          "content": "Customer Name",
          "lineHeight": 1.4,
          "fontFamily": "Helvetica",
          "fontSize": 20,
          "fontWeight": "700"
        }
      ]
    }
  ]
}
```

**Timeline item pattern** (order-dashboard.pen lines 3367-3453):
```json
{
  "type": "frame",
  "id": "9he4x",
  "name": "step1",
  "width": "fill_container",
  "gap": 14,
  "children": [
    {
      "type": "frame",
      "id": "149KA",
      "name": "leftCol1",
      "width": 36,
      "height": "fill_container",
      "layout": "vertical",
      "alignItems": "center",
      "children": [
        {
          "type": "ellipse",
          "id": "rLURk",
          "name": "dot1",
          "fill": "#4fd1c5",
          "width": 28,
          "height": 28
        },
        {
          "type": "icon_font",
          "id": "z8YWf",
          "name": "icon1",
          "width": 14,
          "height": 14,
          "iconFontName": "file-text",
          "iconFontFamily": "lucide",
          "fill": "#ffffff"
        },
        {
          "type": "rectangle",
          "id": "Y5UWC",
          "name": "stepLine1",
          "fill": "#4fd1c5",
          "width": 2,
          "height": "fill_container"
        }
      ]
    },
    {
      "type": "frame",
      "id": "ZE6eT",
      "name": "rightCol1",
      "width": "fill_container",
      "layout": "vertical",
      "gap": 2,
      "children": [
        {
          "type": "text",
          "id": "uDy8H",
          "name": "t1title",
          "fill": "#2d3748",
          "content": "Order Placed",
          "fontFamily": "Helvetica",
          "fontSize": 13,
          "fontWeight": "bold"
        },
        {
          "type": "text",
          "id": "0N3Og",
          "name": "t1desc",
          "fill": "#a0aec0",
          "textGrowth": "fixed-width",
          "width": "fill_container",
          "content": "Order received from customer for feed delivery.",
          "fontFamily": "Helvetica",
          "fontSize": 11,
          "fontWeight": "normal"
        },
        {
          "type": "text",
          "id": "3ocVM",
          "name": "t1date",
          "fill": "#4fd1c5",
          "content": "Mar 16, 2026 · 10:30 AM",
          "fontFamily": "Helvetica",
          "fontSize": 10,
          "fontWeight": "bold"
        }
      ]
    }
  ]
}
```

**Vertical gauge pattern** (new component - structure based on .pen conventions):
```json
{
  "type": "frame",
  "name": "Bin Gauge",
  "width": 60,
  "height": 140,
  "layout": "vertical",
  "gap": 8,
  "alignItems": "center",
  "children": [
    {
      "type": "frame",
      "name": "Gauge Container",
      "width": 40,
      "height": 100,
      "cornerRadius": 8,
      "stroke": {
        "align": "inside",
        "thickness": 2,
        "fill": "#e2e8f0ff"
      },
      "layout": "none",
      "children": [
        {
          "type": "rectangle",
          "name": "Fill Bar",
          "x": 2,
          "y": 25,
          "width": 36,
          "height": 73,
          "fill": "#48bb78ff",
          "cornerRadius": [0, 0, 6, 6]
        },
        {
          "type": "text",
          "name": "Percentage",
          "x": 8,
          "y": 40,
          "fill": "#ffffffff",
          "content": "75%",
          "fontFamily": "Helvetica",
          "fontSize": 12,
          "fontWeight": "700"
        }
      ]
    },
    {
      "type": "text",
      "name": "Location Label",
      "fill": "#2d3748ff",
      "content": "Bin A",
      "fontFamily": "Helvetica",
      "fontSize": 10,
      "fontWeight": "700"
    },
    {
      "type": "text",
      "name": "Feed Type",
      "fill": "#a0aec0ff",
      "content": "Starter",
      "fontFamily": "Helvetica",
      "fontSize": 10,
      "fontWeight": "normal"
    }
  ]
}
```

**Bin gauge row pattern** (compact horizontal layout):
```json
{
  "type": "frame",
  "name": "BinGaugeRow",
  "width": "fill_container",
  "gap": 24,
  "justifyContent": "flex_start",
  "alignItems": "flex_end",
  "children": [
    // Multiple Bin Gauge frames side by side
  ]
}
```

---

## Shared Patterns

### Icon Usage
**Source:** `designs/order-dashboard.pen` lines 117-127
**Apply to:** All .pen design files
```json
{
  "type": "icon_font",
  "id": "RzPtN",
  "name": "iconName",
  "width": 15,
  "height": 15,
  "iconFontName": "layout-dashboard",
  "iconFontFamily": "lucide",
  "fill": "#ffffffff"
}
```

Icons to use (from lucide, per D-14):
- `search` - Search box
- `package` - Order count indicator
- `alert-triangle` - Bin alert
- `clock` - Timeline dates
- `map-pin` - Customer location
- `phone` - Customer phone
- `mail` - Customer email
- `chevron-down` - Expand/collapse

### Color Tokens
**Source:** `10-UI-SPEC.md` lines 65-88
**Apply to:** All fill properties

| Semantic Name | Hex Value | Usage |
|---------------|-----------|-------|
| background | #f8f9faff | Page background |
| card | #ffffffff | Cards, sidebar |
| primary | #4fd1c5ff | Accent, active states |
| text-primary | #2d3748ff | Main text |
| text-secondary | #a0aec0ff | Labels, placeholders |
| border | #e2e8f0ff | Dividers, strokes |
| success | #48bb78ff | Bin normal state (>30%) |
| warning | #975a16ff | Bin low state (15-30%) |
| error | #e53e3eff | Bin critical state (<15%), changes dot |

### Typography Scale
**Source:** `10-UI-SPEC.md` lines 50-62
**Apply to:** All text nodes

| Role | fontSize | fontWeight | lineHeight |
|------|----------|------------|------------|
| Small/Label | 10 | 700 | 1.2 |
| Body | 12 | normal | 1.5 |
| Heading | 16 | 700 | 1.2 |
| Display | 20 | 700 | 1.2 |

### Spacing Scale
**Source:** `10-UI-SPEC.md` lines 30-46
**Apply to:** All gap, padding properties

| Token | Value |
|-------|-------|
| xs | 4 |
| sm | 8 |
| md | 16 |
| lg | 24 |
| xl | 32 |

### Shadow Pattern
**Source:** `designs/page-layout.pen` lines 88-97
**Apply to:** Cards, elevated elements
```json
{
  "effect": {
    "type": "shadow",
    "shadowType": "outer",
    "color": "#00000008",
    "offset": {
      "x": 0,
      "y": 3.5
    },
    "blur": 5
  }
}
```

### Divider Pattern
**Source:** `designs/page-layout.pen` lines 64-70
**Apply to:** Section separators
```json
{
  "type": "rectangle",
  "name": "Divider",
  "fill": "#e2e8f0ff",
  "width": "fill_container",
  "height": 1
}
```

---

## No Analog Found

None. All design patterns have close analogs in existing .pen files.

---

## Metadata

**Analog search scope:** `designs/` directory
**Files scanned:** 4 (.pen files)
**Pattern extraction date:** 2026-05-01

**Key patterns identified:**
1. All .pen files use version 2.8 JSON format
2. Page layouts follow Sidebar (280px) + Main Content structure
3. Tables use vertical layout with header row + divider + data rows
4. Icons use `icon_font` type with `iconFontFamily: "lucide"`
5. Timeline uses left column (icon + connector) + right column (content) structure
6. Search boxes have 40px height, 15px cornerRadius, 8px gap between icon and text
7. Status indicators stack icons horizontally with 8px gap
