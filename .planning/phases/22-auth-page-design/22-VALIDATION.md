# Phase 22: Auth Page Design - Validation Strategy

**Phase:** 22-auth-page-design
**Created:** 2026-05-10

## Validation Overview

This is a **design-only phase** that produces visual specifications in `.pen` files. All validation is manual — no automated test framework applies to design artifacts.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Not applicable (design phase) |
| Config file | N/A |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| N/A | Design file structure valid | manual | `node -e "JSON.parse(fs.readFileSync('designs/page-layout.pen'))"` | N/A |
| N/A | Token references match globals.css | manual | `grep -oE '\$[a-z-]+' designs/page-layout.pen` | N/A |
| N/A | Components named correctly | manual | `grep -E 'HeaderUserArea|UserDropdown' designs/page-layout.pen` | N/A |

## Validation Criteria

### Automated Checks (JSON validation)

```bash
# Verify JSON is valid
node -e "const fs=require('fs');JSON.parse(fs.readFileSync('designs/page-layout.pen'))"

# Verify required components exist
grep -c '"HeaderUserArea/Default"' designs/page-layout.pen  # expect >= 1
grep -c '"HeaderUserArea/Hover"' designs/page-layout.pen    # expect >= 1
grep -c '"HeaderUserArea/DropdownOpen"' designs/page-layout.pen  # expect >= 1
grep -c '"UserDropdownMenu"' designs/page-layout.pen        # expect >= 1

# Verify token usage (no hardcoded colors in new components)
grep -c '"\$[a-z-]+"' designs/page-layout.pen  # expect >= 10

# Verify theme support
grep -c '"themes"' designs/page-layout.pen     # expect 1
grep -c '"variables"' designs/page-layout.pen  # expect 1
```

### Manual Checks (Pencil.dev visual inspection)

All visual validation requires human review in Pencil.dev app:

1. **Light Mode Artboard**
   - [ ] Avatar is 32px circle with primary color
   - [ ] Avatar displays initials in white text
   - [ ] User name displays at 13px, 500 weight
   - [ ] Hover state shows subtle background change
   - [ ] Dropdown menu has proper shadow
   - [ ] Sign Out button is visible and styled

2. **Dark Mode Artboard**
   - [ ] Background colors adapt to dark theme
   - [ ] Text colors adapt to light-on-dark
   - [ ] All states render correctly
   - [ ] Contrast ratios appear sufficient

## Sampling Rate

- **Per task commit:** JSON validity check (automated)
- **Per wave merge:** Visual inspection in Pencil.dev
- **Phase gate:** All manual checklist items verified by human

## Wave 0 Gaps

Not applicable — no test infrastructure needed for design phase.
