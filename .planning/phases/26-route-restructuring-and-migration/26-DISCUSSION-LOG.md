# Phase 26: Route Restructuring and Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 26-Route Restructuring and Migration
**Areas discussed:** Redirect behavior, Sidebar navigation, Coming Soon content, Settings visibility

---

## Redirect Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| 308 permanent redirect | Old URLs redirect to /demo/* equivalents. Preserves bookmarks, SEO, and existing links. | |
| No redirect (404) | Old URLs simply don't exist. Cleaner break, forces users to update bookmarks. | ✓ |
| Let Claude decide | Claude picks based on standard practices for route migrations. | |

**User's choice:** No redirect (404)
**Notes:** Clean break preferred over maintaining backward compatibility.

---

## Sidebar Navigation

### Context Detection

| Option | Description | Selected |
|--------|-------------|----------|
| Route-based detection | Sidebar uses usePathname() to detect context and renders different navItems arrays. Single component, no props needed. | ✓ |
| Context prop from parent | DashboardLayout passes context prop to Sidebar. More explicit, but requires parent awareness. | |
| Let Claude decide | Claude picks based on existing patterns in the codebase (currently uses usePathname for active state). | |

**User's choice:** Route-based detection
**Notes:** Consistent with existing usePathname() pattern already in Sidebar.tsx.

### Production Context Display

| Option | Description | Selected |
|--------|-------------|----------|
| Empty/hidden | No navigation items shown in production context — just logo and Settings | |
| Coming Soon link only | Single disabled link labeled 'Coming Soon' as placeholder for future features | ✓ |
| Same as demo links | Show same nav items but pointing to root paths (would 404 until features are built) | |

**User's choice:** Coming Soon link only
**Notes:** Provides visual indication that features are planned without functional dead ends.

---

## Coming Soon Content

### Page Content

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal placeholder | Simple message: 'Coming Soon' heading with brief subtext. Clean and professional. | ✓ |
| Feature preview teaser | Lists planned features or shows preview screenshots. Builds anticipation. | |
| Auth-aware message | Different content for logged-in users (personalized) vs unauthenticated (sign-in prompt). More complex. | |

**User's choice:** Minimal placeholder
**Notes:** Simple and professional approach preferred.

### Layout Usage

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, full layout | DashboardLayout wraps the Coming Soon content. Consistent experience, shows navigation structure. | ✓ |
| Minimal layout | Just the message centered on page, no sidebar/header. Simpler, but less context. | |

**User's choice:** Yes, full layout
**Notes:** Maintains consistent navigation experience across all authenticated pages.

---

## Settings Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Both contexts | Settings link always visible in sidebar. Consistent, users can always access settings. | ✓ |
| Production only | Settings visible only in production context. Demo area is self-contained for demo users. | |
| Let Claude decide | Claude picks based on UX best practices for settings access. | |

**User's choice:** Both contexts
**Notes:** Users should always have access to settings regardless of which context they're viewing.

---

## Claude's Discretion

None — all areas were explicitly decided by the user.

## Deferred Ideas

None — discussion stayed within phase scope.
