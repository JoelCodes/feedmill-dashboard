# Phase 20: Clerk Foundation Setup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 20-clerk-foundation-setup
**Areas discussed:** Sign-in page layout, URL structure, Redirect behavior, Theme integration

---

## Sign-in Page Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Centered card | SignIn component centered on page with branded background. Clean, standard pattern that matches Clerk defaults. | ✓ |
| Split layout | Left side: branding/hero image. Right side: sign-in form. More visual impact but requires custom styling. | |
| Minimal fullscreen | Just the sign-in form on a plain background. Maximum simplicity, no distractions. | |

**User's choice:** Centered card (Recommended)
**Notes:** Standard approach selected for consistency with Clerk defaults.

---

### Branding

| Option | Description | Selected |
|--------|-------------|----------|
| Logo + app name above form | Show CGM Dashboard branding above the sign-in card. Reinforces context. | ✓ |
| Just the form | Let Clerk handle all visuals. Minimalist approach, less to maintain. | |
| You decide | Claude picks based on what works best with the existing design system. | |

**User's choice:** Logo + app name above form
**Notes:** User wants branding visible on auth pages.

---

### Background

| Option | Description | Selected |
|--------|-------------|----------|
| Theme-aware solid color | Use semantic background token (bg-surface or similar). Matches rest of app. | ✓ |
| Subtle gradient or pattern | Adds visual interest but requires new styling not in current token system. | |
| You decide | Claude picks what integrates cleanest with existing tokens. | |

**User's choice:** Theme-aware solid color
**Notes:** Consistent with existing design system approach.

---

## URL Structure

### Sign-in URL

| Option | Description | Selected |
|--------|-------------|----------|
| /sign-in | Clerk's default. Catch-all route handles password reset, verification flows automatically. | ✓ |
| /login | More traditional naming. Requires custom NEXT_PUBLIC_CLERK_SIGN_IN_URL env var. | |
| /auth/sign-in | Grouped under /auth namespace. Keeps auth routes separate but deeper path. | |

**User's choice:** /sign-in (Recommended)
**Notes:** Standard Clerk pattern selected.

---

### Sign-up

| Option | Description | Selected |
|--------|-------------|----------|
| Separate /sign-up page | Clean separation, standard Clerk pattern, easier to link directly to sign-up. | |
| Tab within sign-in page | Single auth page with tab switching. Clerk supports this via routing='path' prop. | |

**User's choice:** "No sign in for this phase"
**Notes:** User explicitly deferred sign-up to a future phase. Phase 20 is sign-in only.

---

### Confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, sign-in only | Phase 20 delivers sign-in. Users must have accounts created some other way initially. | ✓ |
| Actually include sign-up | Keep sign-up in Phase 20 scope as originally planned. | |

**User's choice:** Yes, sign-in only
**Notes:** Confirmed: sign-up deferred. Users created via Clerk dashboard initially.

---

## Redirect Behavior

### Post sign-in

| Option | Description | Selected |
|--------|-------------|----------|
| Back to requested page | If user was redirected from /customers, return there. Clerk handles this via returnBackUrl. | ✓ |
| Always /orders | Consistent landing page regardless of where they came from. Simple but less flexible. | |
| You decide | Claude picks the most sensible default. | |

**User's choice:** Back to requested page (Recommended)
**Notes:** Standard UX pattern for better user flow.

---

### Default landing

| Option | Description | Selected |
|--------|-------------|----------|
| /orders (main dashboard) | Send to orders table since that's the primary view. | |
| / (root) | Go to root, let Next.js handle from there. | ✓ |
| You decide | Claude picks based on app structure. | |

**User's choice:** / (root)
**Notes:** Let Next.js routing handle the default landing.

---

## Theme Integration

### Theme approach

| Option | Description | Selected |
|--------|-------------|----------|
| Clerk's appearance prop | Use Clerk's built-in theming API with your existing color tokens. Works with next-themes. | ✓ |
| CSS variables override | Override Clerk's internal CSS vars to match your tokens. More control but more fragile. | |
| You decide | Claude picks the approach that integrates cleanest. | |

**User's choice:** Clerk's appearance prop (Recommended)
**Notes:** Official API preferred over CSS hacks.

---

### Styling depth

| Option | Description | Selected |
|--------|-------------|----------|
| Match design tokens | Pass your semantic colors, fonts, border-radius to appearance prop. Consistent with rest of app. | ✓ |
| Clerk defaults | Use Clerk's built-in styling. Faster to implement, visually distinct from dashboard. | |

**User's choice:** Match design tokens
**Notes:** Full consistency with existing component library.

---

### Customization level

| Option | Description | Selected |
|--------|-------------|----------|
| Basic integration (colors + dark mode) | Map your primary color and background tokens. Get theme switching working. Polish later. | |
| Full customization | Map all tokens: typography, spacing, shadows, border-radius. Clerk matches your component library exactly. | ✓ |

**User's choice:** Full customization
**Notes:** User wants complete visual consistency, not just basic theming.

---

### Config location

| Option | Description | Selected |
|--------|-------------|----------|
| Shared config file | Create src/lib/clerk-theme.ts that exports appearance config. Reusable across SignIn, UserButton. | ✓ |
| Inline in ClerkProvider | Define appearance directly in layout.tsx. Simpler but harder to maintain. | |
| You decide | Claude picks based on code organization patterns. | |

**User's choice:** Shared config file (Recommended)
**Notes:** Consistent with existing code organization patterns.

---

### Variable approach

| Option | Description | Selected |
|--------|-------------|----------|
| CSS variable references | Use var(--color-primary) in appearance config. Auto-updates when theme changes. | ✓ |
| Hardcoded from tokens | Copy token values into config. More explicit but needs manual sync if tokens change. | |

**User's choice:** CSS variable references
**Notes:** Dynamic theming via CSS variables for automatic light/dark switching.

---

## Claude's Discretion

None — all areas received explicit user decisions.

## Deferred Ideas

- **Sign-up page**: User explicitly deferred to future phase. Phase 20 is sign-in only.
- **UserButton in header**: Covered by Phase 23 (User Experience Integration)
