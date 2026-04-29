# Phase 7: Data Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 07-data-infrastructure
**Areas discussed:** Data fields, Data volume, Mill line mapping, State distribution

---

## Data Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Expand to match | Add Line Code, Farm Location Code, Salesperson ID, Texture Type to ProductionOrder type. Gives realistic feel, supports future features. | |
| Keep simple | Current fields are sufficient for filter pills feature. Add more fields when we need them. | |
| Hybrid | Add Texture Type and Line Code only — visible on cards. Farm Location and Salesperson stay out. | ✓ |

**User's choice:** Hybrid
**Notes:** Keep data model focused on what's visible in the UI. Additional fields can be added when needed.

---

## Data Volume

| Option | Description | Selected |
|--------|-------------|----------|
| 15-20 orders | Enough for realistic filtering demos. Each mill line gets 5-7 orders. Current 12 is close but could use a few more. | |
| 30+ orders | Match scale of daily delivery files (50+ lines). More realistic but may clutter the UI during demos. | ✓ |
| Keep current 12 | Current dataset is fine. Add more later if needed. | |

**User's choice:** 30+ orders
**Notes:** Match realistic scale from daily delivery files. UI will handle it with filtering.

---

## Mill Line Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Poultry→CGM, Dairy+Hog→Excel | CGM processes poultry feeds. Excel processes dairy and hog feeds. Premix handles specialty/pre-start formulas across all categories. | |
| Keep as-is | Current arbitrary assignment is fine for mock data. Real mapping comes with real integration. | ✓ |
| You decide | Claude picks a realistic distribution based on the example data. | |

**User's choice:** Keep arbitrary assignment
**Notes:** Since this is a demo, arbitrary mill assignment is sufficient. No need to match real-world CGM/EFI processing rules.

---

## State Distribution

| Option | Description | Selected |
|--------|-------------|----------|
| Production-weighted | Most orders are Completed (40-50%), followed by Pending (25-30%), then Mixing (15-20%), fewest Blocked (5-10%). Reflects realistic production flow. | ✓ |
| Even distribution | Equal split ~25% each. Good for testing filter pills — each filter shows similar counts. | |
| You decide | Claude picks a distribution that makes the demo look good. | |

**User's choice:** Production-weighted
**Notes:** Realistic production flow: most orders complete, some pending, fewer actively mixing, rare blocks.

---

## Claude's Discretion

- Realistic customer names from example data
- Realistic product names from example data
- Delivery times spread throughout business hours
- Weight values in realistic ranges (3,000 - 18,000 lbs)
- Line codes matching format from example data (numeric)

## Deferred Ideas

None — discussion stayed within phase scope
