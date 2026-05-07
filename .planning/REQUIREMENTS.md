# Requirements: CGM Dashboard

**Defined:** 2026-05-07
**Core Value:** Operations staff can see and manage feed orders in real-time, from pending through delivery.

## v1.3 Requirements

Requirements for Design Hardening milestone. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: Semantic token system defines colors, typography, spacing, and shadows using two-tier naming (primitives → semantic)
- [ ] **FOUND-02**: Light/dark theme infrastructure uses next-themes with ThemeProvider and CSS variable overrides
- [ ] **FOUND-03**: CVA and utility setup provides class-variance-authority, tailwind-merge, and cn() helper function
- [ ] **FOUND-04**: ESLint rules block hardcoded color and spacing values to enforce token usage

### Components

- [ ] **COMP-01**: Button component has CVA variants (primary/secondary/ghost/destructive) and sizes (sm/md/lg)
- [ ] **COMP-02**: Input components (text, number, select, textarea) include validation states and accessibility attributes
- [ ] **COMP-03**: Card/Panel component uses compound pattern (Card.Header, Card.Content, Card.Footer)
- [ ] **COMP-04**: Theme toggle UI component allows switching between light and dark modes
- [ ] **COMP-05**: Badge component refactors existing StatusBadge to use design system primitives

### Migration

- [ ] **MIG-01**: Orders page fully migrated to design system (OrdersTable, StatusBadge, FilterPill, cards)
- [ ] **MIG-02**: Customers page fully migrated to design system (list, detail header, timeline, bin gauges)
- [ ] **MIG-03**: Mill Production page fully migrated to design system (production cards, filter pills, columns)
- [ ] **MIG-04**: Settings page fully migrated to design system with theme toggle integration
- [ ] **MIG-05**: All hardcoded color and spacing values eliminated from migrated pages

### Documentation

- [ ] **DOC-01**: Token usage documentation provides guidelines for using design tokens correctly
- [ ] **DOC-02**: Component guidelines document usage examples, variant options, and do/don't patterns
- [ ] **DOC-03**: Accessibility audit verifies WCAG 2.1 AA compliance for all components

### Design Files

- [ ] **DES-01**: Component library .pen file created as single source of truth for reusable components
- [ ] **DES-02**: Existing .pen files consolidated and organized with clear hierarchy
- [ ] **DES-03**: Token sync process established between Pencil.dev and CSS design tokens

## Future Requirements

Deferred to v1.4+. Tracked but not in current roadmap.

### Advanced Components

- **ADV-01**: Table component extracted as reusable primitive from OrdersTable
- **ADV-02**: Timeline component extracted as reusable primitive from ActivityTimeline
- **ADV-03**: Radix UI primitives added for Dialog, Tooltip, DropdownMenu as needed

### Tooling

- **TOOL-01**: Storybook integration for component documentation and testing
- **TOOL-02**: Visual regression testing setup for design system components

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Big-bang rewrite | High risk of failure; using incremental Strangler Fig pattern instead |
| Over-abstracted god components | Research warns against 50+ prop components; using composition |
| @apply directive usage | Anti-pattern per Tailwind docs; React components for reuse |
| Framework-specific tokens | CSS-first tokens are portable |
| Complex form components | DatePicker, DataTable deferred until specific feature needs |
| shadcn/ui CLI integration | Overkill for this stage; using same underlying tools directly |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | TBD | Pending |
| FOUND-02 | TBD | Pending |
| FOUND-03 | TBD | Pending |
| FOUND-04 | TBD | Pending |
| COMP-01 | TBD | Pending |
| COMP-02 | TBD | Pending |
| COMP-03 | TBD | Pending |
| COMP-04 | TBD | Pending |
| COMP-05 | TBD | Pending |
| MIG-01 | TBD | Pending |
| MIG-02 | TBD | Pending |
| MIG-03 | TBD | Pending |
| MIG-04 | TBD | Pending |
| MIG-05 | TBD | Pending |
| DOC-01 | TBD | Pending |
| DOC-02 | TBD | Pending |
| DOC-03 | TBD | Pending |
| DES-01 | TBD | Pending |
| DES-02 | TBD | Pending |
| DES-03 | TBD | Pending |

**Coverage:**
- v1.3 requirements: 20 total
- Mapped to phases: 0
- Unmapped: 20 (pending roadmap creation)

---
*Requirements defined: 2026-05-07*
*Last updated: 2026-05-07 after initial definition*
