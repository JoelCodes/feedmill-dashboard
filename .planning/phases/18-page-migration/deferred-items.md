# Deferred Items - Phase 18

## Out-of-Scope Discoveries

### Typography Token Migration (from 18-02)
- **Date:** 2025-05-07
- **Component:** FilterPill, StatusBadge
- **Issue:** Hardcoded pixel font sizes (`text-[10px]`, `text-[11px]`) flagged by eslint custom/no-hardcoded-values rule
- **Existing tokens:** `--text-11: 0.6875rem` exists in globals.css
- **Status:** Pre-existing pattern in design system, not introduced by 18-02
- **Recommendation:** Consider adding typography token migration plan for Phase 19
