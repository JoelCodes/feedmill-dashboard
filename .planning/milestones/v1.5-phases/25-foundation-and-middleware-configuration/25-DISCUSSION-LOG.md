# Phase 25: Foundation and Middleware Configuration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 25-foundation-and-middleware-configuration
**Areas discussed:** Middleware behavior, DashboardLayout scope, Type organization

---

## Middleware Behavior

### Role Check Failure

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to root | Simple redirect to / — the Coming Soon page. Standard 307 redirect, no message. | ✓ |
| Redirect with flash message | Redirect to / with query param like ?access=denied. Homepage can show a toast explaining restricted access. | |
| You decide | Let Claude pick the most appropriate approach based on patterns in the codebase. | |

**User's choice:** Redirect to root (Recommended)
**Notes:** None

### Logging

| Option | Description | Selected |
|--------|-------------|----------|
| No logging | Keep middleware simple. Role mismatches are expected behavior, not errors. | ✓ |
| Console.log in dev only | Log to console when NODE_ENV=development. Silent in production. | |
| You decide | Let Claude pick based on project conventions. | |

**User's choice:** No logging (Recommended)
**Notes:** None

---

## DashboardLayout Scope

### Layout Contents

| Option | Description | Selected |
|--------|-------------|----------|
| Full layout | Header + Sidebar + main content wrapper. All dashboard pages look consistent, individual pages just provide content. | ✓ |
| Structural skeleton only | Just the grid structure (sidebar slot, main slot). Pages import and position Header/Sidebar themselves. | |
| You decide | Let Claude pick based on existing page patterns. | |

**User's choice:** Full layout (Recommended)
**Notes:** None

### Navigation Props

| Option | Description | Selected |
|--------|-------------|----------|
| Route-based auto-detection | Sidebar reads pathname and shows appropriate nav. No props needed — consistent with existing active-state detection pattern. | ✓ |
| Explicit navItems prop | Pages pass navItems array to control what appears. More explicit but adds prop drilling. | |
| You decide | Let Claude pick based on Phase 26 (NAV-01) requirements. | |

**User's choice:** Route-based auto-detection (Recommended)
**Notes:** Aligns with existing usePathname() pattern in Sidebar.

---

## Type Organization

### Type Location

| Option | Description | Selected |
|--------|-------------|----------|
| types/clerk.d.ts | Dedicated declaration file extending @clerk/nextjs types. Clerk's documented pattern for custom session claims. | ✓ |
| src/lib/auth/types.ts | Regular TypeScript file in lib/auth directory. Import where needed. | |
| global.d.ts at root | Extend global declarations. Automatically available everywhere. | |
| You decide | Let Claude pick based on Clerk docs and project conventions. | |

**User's choice:** types/clerk.d.ts (Recommended)
**Notes:** None

### Role Type

| Option | Description | Selected |
|--------|-------------|----------|
| String union | type Role = 'demo' | 'admin' | 'user' — simple, no runtime overhead, works well with Clerk's string-based metadata. | ✓ |
| Enum | enum Role { Demo = 'demo', Admin = 'admin' } — provides namespacing but adds complexity. | |
| You decide | Let Claude pick based on project conventions. | |

**User's choice:** String union (Recommended)
**Notes:** None

---

## Claude's Discretion

None — all areas were explicitly decided.

## Deferred Ideas

None — discussion stayed within phase scope.
