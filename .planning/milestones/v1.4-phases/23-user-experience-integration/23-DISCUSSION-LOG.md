# Phase 23: User Experience Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 23-user-experience-integration
**Areas discussed:** UserButton integration, Loading state, Hydration handling, Sign-out behavior

---

## UserButton Integration

### Implementation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Clerk UserButton (Recommended) | Use Clerk's prebuilt component with appearance customization. Handles avatar, dropdown, sign-out automatically. Consistent with existing SignIn approach. | ✓ |
| Custom implementation | Build own component using useUser() hook. Full control but must handle dropdown, avatar, sign-out manually. | |
| You decide | Claude picks based on codebase patterns and Phase 22 design decisions. | |

**User's choice:** Clerk UserButton (Recommended)
**Notes:** Aligns with Phase 20's SignIn approach and reuses existing clerk-theme.ts config.

### Placement

| Option | Description | Selected |
|--------|-------------|----------|
| After notifications (Recommended) | Far right position per Phase 22 design. Current order: search \| settings \| bell \| USER. Most common dashboard pattern. | ✓ |
| Replace settings icon | User dropdown includes settings link. Fewer icons, but settings moves inside user menu. | |
| Before notifications | Order: search \| settings \| USER \| bell. User more prominent, notifications at far right. | |

**User's choice:** After notifications (Recommended)
**Notes:** Maintains Phase 22 design. Header becomes: search | settings | bell | USER.

### Dropdown Customization

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal - Sign Out only (Recommended) | Per Phase 22 D-04: name/email display + Sign Out. Hide 'Manage Account' and other Clerk default menu items. | ✓ |
| Include Manage Account | Show name/email + Manage Account + Sign Out. Lets users access Clerk's profile UI. | |
| Full Clerk defaults | Keep all Clerk default menu items. Less work, but cluttered. | |

**User's choice:** Minimal - Sign Out only (Recommended)
**Notes:** Per Phase 22 decision D-04. Will hide extra menu items via userButtonMenuItems appearance config.

---

## Loading State

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton placeholder (Recommended) | Show 32px circular skeleton where avatar would be. Matches existing loading patterns (OrdersTable uses skeletons). Prevents layout shift. | ✓ |
| Nothing / invisible | Hide user area until loaded. Simpler but causes layout shift when it appears. | |
| Static placeholder | Show generic user icon until real data loads. No layout shift, less visual feedback. | |

**User's choice:** Skeleton placeholder (Recommended)
**Notes:** Consistent with existing loading patterns and prevents layout shift.

---

## Hydration Handling

| Option | Description | Selected |
|--------|-------------|----------|
| ClerkLoaded + skeleton (Recommended) | Use Clerk's <ClerkLoaded> to conditionally render. Show skeleton while loading, then real content. Reliable server/client match. | ✓ |
| Suspense boundary | Wrap auth-dependent UI in React Suspense with skeleton fallback. More React-native approach. | |
| CSS visibility approach | Render both states, toggle visibility based on isLoaded. Faster paint but more DOM elements. | |

**User's choice:** ClerkLoaded + skeleton (Recommended)
**Notes:** Reliable hydration, shows skeleton while Clerk initializes, then real UserButton.

---

## Sign-out Behavior

### Redirect Destination

| Option | Description | Selected |
|--------|-------------|----------|
| Sign-in page (Recommended) | Redirect to /sign-in after sign-out. Clear pattern — user must sign in to access anything. Consistent with middleware protection. | ✓ |
| Current page | Stay on same URL, middleware redirects to sign-in. Brief flash before redirect. | |
| Home page | Go to / after sign-out, then middleware redirects. Extra redirect step. | |

**User's choice:** Sign-in page (Recommended)
**Notes:** Direct to sign-in page, clean flow, no extra redirects.

### Confirmation Dialog

| Option | Description | Selected |
|--------|-------------|----------|
| No confirmation (Recommended) | Click Sign Out, immediately sign out. Simple, fast. Session is restored easily by signing back in. | ✓ |
| Simple confirmation | "Are you sure?" dialog before sign-out. Extra step but prevents accidental sign-outs. | |
| You decide | Claude picks based on industry patterns. | |

**User's choice:** No confirmation (Recommended)
**Notes:** Simple and fast — immediate sign-out on click.

---

## Claude's Discretion

None — all areas received explicit user decisions.

## Deferred Ideas

None — discussion stayed within phase scope.
