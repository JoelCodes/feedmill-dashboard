# Mill Production Dashboard Research Index

**Milestone:** v1.1 — Status filter pills, design polish, data-driven mock service
**Date:** 2026-04-28
**Status:** RESEARCH COMPLETE

This index guides you through the v1.1 research and helps you find what you need.

---

## Quick Links

### For Project Managers / Stakeholders
**Read this first:**
- **[MILL_PRODUCTION_SUMMARY.md](#mill_production_summarymd)** — 2-page executive summary with timeline, risks, and confidence levels

### For Designers (Creating .pen File)
**Read this:**
- **[MILL_PRODUCTION_FEATURES.md](#mill_production_featuresmd)** — Detailed feature specs, mock data, interaction patterns (section: "Interaction Patterns by Feature")
- **[PRODUCTION_DASHBOARD_PATTERNS.md](#production_dashboard_patternsmd)** — Expected behavior patterns, what users expect (section: "Expected Behavior Patterns")

### For Engineers (Building Phase 2)
**Read this:**
- **[MILL_PRODUCTION_FEATURES.md](#mill_production_featuresmd)** — Complexity assessment, implementation roadmap, dependencies
- **[PRODUCTION_DASHBOARD_PATTERNS.md](#production_dashboard_patternsmd)** — Common pitfalls, testing strategy, accessibility requirements
- **[MILL_PRODUCTION_SUMMARY.md](#mill_production_summarymd)** — Design decisions needed before coding (section: "Confidence Assessment")

### For QA / Testing
**Read this:**
- **[PRODUCTION_DASHBOARD_PATTERNS.md](#production_dashboard_patternsmd)** — Testing strategy, test cases, pitfalls to verify against

---

## Document Descriptions

### MILL_PRODUCTION_SUMMARY.md
**Purpose:** High-level overview for decision-makers and roadmap planning
**Length:** ~330 lines
**Key sections:**
- Executive summary (why we're confident)
- Key findings (stack, architecture, features, pitfalls)
- Implications for roadmap (phasing and ordering)
- Estimated timeline (1.5-2 weeks, design critical path)
- Success criteria (v1.1 complete checklist)

**When to read:**
- Milestone planning
- Timeline estimation
- Risk assessment
- Design approval prioritization

---

### MILL_PRODUCTION_FEATURES.md
**Purpose:** Comprehensive feature landscape with complexity notes and dependencies
**Length:** ~518 lines
**Key sections:**
- Table stakes (what users expect, ~12 features)
- Differentiators (nice-to-haves, ~8 features)
- Anti-features (what NOT to build, ~6 items)
- Feature dependencies (DAG of requirements)
- Complexity assessment (low/med/high with LOC estimates)
- Mock data service requirements
- Interaction patterns (design specs per feature)
- Success criteria (checklist for v1.1)
- Comparison to OrdersTable (why component reuse is safe)

**When to read:**
- Creating .pen design file
- Estimating implementation effort
- Understanding what's in scope vs deferred
- Phase planning

---

### PRODUCTION_DASHBOARD_PATTERNS.md
**Purpose:** Behavioral patterns and pitfalls from manufacturing domain
**Length:** ~682 lines
**Key sections:**
- Expected behavior patterns (6 major patterns)
- Common pitfalls (7 detailed pitfalls + prevention)
- Testing strategy (unit tests + integration tests)
- Accessibility requirements
- Performance considerations

**When to read:**
- Before building implementation
- During code review
- When designing tests
- Accessibility audit

**Pitfalls covered:**
1. Count calculus (counting wrong data)
2. Stale state (filter not clearing)
3. Filter logic order (applying filters wrong)
4. Miscounting with multiple filters
5. Visual feedback (user doesn't see active filter)
6. Component reuse failures (FilterPill copied wrong)
7. Card movement (orders jump between sections)

---

## Research Findings Summary

### Technology Stack
- **Reuse:** FilterPill component from OrdersTable.tsx (proven)
- **State management:** `Set<ProductionState>` toggles (same as OrdersTable)
- **Filtering:** Simple filter-before-grouping pattern (no complex derivations)
- **Counts:** useMemo from unfiltered data (established pattern)
- **Mock service:** Current data adequate, no schema changes needed

### Key Decision Points

| Decision | Options | Recommendation | Blocker? |
|----------|---------|-----------------|----------|
| Badge count visibility when filters active | Show all counts (A) OR hide non-selected (B) | Option A (helps operators navigate) | YES, design should clarify |
| Empty state messaging | "No orders match filters" where? | Center of layout, replace 3-column view | NO, but design should spec |
| FilterPill component | Reuse from OrdersTable, or extract to shared? | Reuse first, extract if search adds complexity (v1.2) | NO, either approach works |
| Clear filters interaction | Explicit button, or just click pill again? | Explicit "Clear" button (faster, clearer) | NO, but UX should confirm |

### Confidence Levels

| Area | Level | Reasoning |
|------|-------|-----------|
| **Feature definition** | HIGH | Proven patterns from manufacturing dashboards (SAP, Odoo, Asana) |
| **Component reuse** | HIGH | FilterPill component exists and works in OrdersTable |
| **Implementation effort** | HIGH | 2-3 hours estimated (copy + adapt, not building from scratch) |
| **Design process** | MEDIUM | Design approval critical path; design itself straightforward |
| **Mock data** | HIGH | Current distribution supports filtering tests |
| **Future extensibility** | MEDIUM | Search (v1.2) and mill filters (v1.3) add naturally to current pattern |

---

## Timeline & Critical Path

```
Week 1:
├─ Days 1-3: Design filter pills in .pen
│  └─ CRITICAL: Design approval needed before code starts
│  └─ Decision: Count visibility when filters active (option A vs B?)
├─ Days 4-5: Code implementation (2-3 hours)
│
Week 2:
├─ Days 1-3: Polish to match .pen design (2-3 hours)
├─ Days 4-5: Test & fixes (2-3 hours)
└─ Ready to ship v1.1
```

**Critical path:** Design approval (design team owns this)
**Blockers:** Count visibility decision (design + product)
**Quick win:** Code phase is fast (reuse = speed)

---

## Features In Scope for v1.1

### Table Stakes (Must Have)
- [ ] Real-time production state visibility (exists)
- [ ] Filter by production state (NEW)
- [ ] Progress tracking per mill line (exists)
- [ ] Visual state distinction (exists)
- [ ] Filter counts on state pills (NEW)
- [ ] Clear/reset filters (NEW)
- [ ] Loading state (exists)

### Deferred to v1.2+
- Search filter (planned)
- Mill line filter toggle (future)
- Multi-filter state aggregation (future)
- Keyboard navigation (future)
- Production velocity trending (future)

### Explicitly Out of Scope
- Drag-drop reordering
- Inline card editing
- Complex query builders
- Real-time push updates
- Custom filter saves

---

## Questions That Still Need Answers

These are design/product decisions, not engineering blockers:

1. **Badge count visibility:** When "Blocked" filter selected, do other state counts show 0, or show available counts?
   - **Answer needed by:** Design phase (week 1, day 2)
   - **Impacts:** Count calculation logic + visual complexity
   - **Recommendation:** Show all counts (helps operators)

2. **Empty state message:** What message when all orders filtered out?
   - **Answer needed by:** Design phase (week 1, day 3)
   - **Impacts:** Placeholder content
   - **Recommendation:** "No orders match your filters. Clear filters to see all."

3. **Clear filters interaction:** Button or click pill to deselect?
   - **Answer needed by:** Design phase (week 1, day 3)
   - **Impacts:** UI layout + interaction model
   - **Recommendation:** Explicit "Clear Filters" button (faster, clearer)

4. **Color scheme:** What colors for active vs inactive state pills?
   - **Answer needed by:** Design phase (week 1, day 1)
   - **Impacts:** .pen file (colors from design system)
   - **Assumption:** Use primary color (active) vs gray (inactive), like OrdersTable

---

## How to Use This Research for Roadmap

### Phase Planning
1. **Verify design decision points** (count visibility, empty state messaging)
2. **Schedule design review** (owns critical path)
3. **Plan build phase** (2-3 hours, after design approval)
4. **Plan polish phase** (2-3 hours, match .pen)
5. **Plan testing** (verify pitfalls don't occur)

### Risk Assessment
- **Design delay:** Biggest risk (critical path)
- **Technical risk:** Very low (established pattern, component reuse)
- **Scope creep:** Defer search to v1.2 (keep v1.1 focused)

### Effort Estimate
- **Design:** 3-5 days (design team owns)
- **Code:** 2-3 hours (engineering)
- **Polish:** 2-3 hours (engineering + design review)
- **Testing:** 2-3 hours (QA)
- **Total:** 1.5-2 weeks (design review critical path)

---

## What's Ready to Go

✓ **Analysis complete:** Feature landscape, pitfalls, patterns all documented
✓ **Design brief ready:** MILL_PRODUCTION_FEATURES.md has all design specs
✓ **Testing strategy ready:** PRODUCTION_DASHBOARD_PATTERNS.md has test cases
✓ **Implementation plan ready:** Architecture clear, dependencies identified
✓ **Mock data verified:** Current data supports filtering tests

## What Needs Decision

⚠ **Design decisions:** Count visibility, empty state messaging
⚠ **Design approval:** .pen file sign-off needed before build
⚠ **Color scheme:** Which primary color for active state?

---

## Next Steps

1. **Share with design team** — Use MILL_PRODUCTION_FEATURES.md section "Interaction Patterns by Feature" as design brief
2. **Share with product** — Use MILL_PRODUCTION_SUMMARY.md for timeline and scope confirmation
3. **Share with engineering** — Use PRODUCTION_DASHBOARD_PATTERNS.md for pitfalls and testing strategy
4. **Get design approval** — .pen file with filter pill spec + count logic clarification
5. **Begin Phase 2** — Code implementation, use MILL_PRODUCTION_FEATURES.md complexity assessment

---

## File Structure in .planning/research/

```
.planning/research/
├── FEATURES.md                              (v1.0 — OrdersTable reference)
├── MILL_PRODUCTION_FEATURES.md              (v1.1 — detailed feature specs)
├── MILL_PRODUCTION_SUMMARY.md               (v1.1 — executive summary)
├── PRODUCTION_DASHBOARD_PATTERNS.md         (v1.1 — behavioral patterns & pitfalls)
└── MILL_PRODUCTION_RESEARCH_INDEX.md        (v1.1 — this file, navigation)
```

---

## Contact & Questions

If questions arise during design or implementation:

1. **"What should badge counts show?"** → See MILL_PRODUCTION_SUMMARY.md "Edge Cases", PRODUCTION_DASHBOARD_PATTERNS.md "Pitfall 4"
2. **"How do I implement FilterPill?"** → See OrdersTable.tsx (lines 396-432), MILL_PRODUCTION_FEATURES.md "Complexity Assessment"
3. **"What tests do I need?"** → See PRODUCTION_DASHBOARD_PATTERNS.md "Testing Strategy"
4. **"What pitfalls should I watch for?"** → See PRODUCTION_DASHBOARD_PATTERNS.md "Common Pitfalls"
5. **"Is feature X in scope?"** → See MILL_PRODUCTION_FEATURES.md "Feature Dependencies" or MILL_PRODUCTION_SUMMARY.md "Implications for Roadmap"

---

## Final Confidence Statement

**Overall Confidence: HIGH**

This research covers an established pattern (filter pills + kanban grouping) using proven component reuse. No architectural unknowns. Main risks are design decisions and approval timeline (not technical risk).

We can ship v1.1 in 1.5-2 weeks if design approval is prioritized.

---

*Research completed: 2026-04-28*
*Researched by: Claude Code (Phase 6 Research)*
*For: v1.1 Milestone roadmap and implementation planning*
