# Phase 20: Clerk Foundation Setup - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Install Clerk SDK and configure a functional sign-in page. This phase establishes the authentication foundation — middleware, ClerkProvider, and a themed sign-in page — that all subsequent auth phases depend on.

**Scope adjustment:** Sign-up is deferred to a later phase. Phase 20 delivers sign-in only. Users must have accounts created via Clerk dashboard or future sign-up phase.

</domain>

<decisions>
## Implementation Decisions

### Sign-in Page Layout
- **D-01:** Centered card layout on sign-in page. SignIn component centered on page with branded background. Matches Clerk defaults and standard auth patterns.
- **D-02:** Show CGM Dashboard branding above the sign-in form — logo and app name reinforce context.
- **D-03:** Theme-aware solid color background using semantic tokens (e.g., `bg-surface`). No gradients or patterns — matches existing app styling.

### URL Structure
- **D-04:** Sign-in page at `/sign-in` using Clerk's default catch-all route `[[...sign-in]]`. Handles password reset, verification flows automatically.
- **D-05:** No sign-up page in Phase 20. Sign-up deferred to future phase. Users created via Clerk dashboard initially.

### Redirect Behavior
- **D-06:** After sign-in, redirect back to originally requested page via Clerk's `returnBackUrl`. If user navigated directly to `/sign-in`, redirect to `/` (root).
- **D-07:** Default post-auth landing page is `/` (root), letting Next.js routing handle from there.

### Theme Integration
- **D-08:** Use Clerk's `appearance` prop API for theme integration with existing next-themes dark/light system.
- **D-09:** Full customization of Clerk appearance — map all design tokens: colors, typography, spacing, shadows, border-radius. SignIn component matches existing component library styling.
- **D-10:** Create shared config file at `src/lib/clerk-theme.ts` exporting appearance configuration. Reusable across SignIn, UserButton, and future Clerk components.
- **D-11:** Use CSS variable references in appearance config (e.g., `var(--color-primary)`). Auto-updates when theme changes, no manual sync needed.

### Claude's Discretion
None — all areas received explicit user decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Clerk Integration
- `.planning/research/SUMMARY.md` — Clerk integration research with critical pitfalls, middleware patterns, async auth() requirements, CVE-2025-29927 mitigation

### Requirements
- `.planning/REQUIREMENTS.md` — AUTH-01 (sign-in), AUTH-03 (session persistence), PROT-03 (sign-in accessible without auth)

### Design System
- `src/app/globals.css` — Semantic tokens (colors, spacing, typography) that Clerk appearance must reference
- `src/lib/utils.ts` — cn() helper and existing utility patterns

### Architecture
- `src/app/layout.tsx` — Root layout where ClerkProvider wraps ThemeProvider

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/layout.tsx`: Root layout with ThemeProvider — ClerkProvider wraps this
- `src/app/globals.css`: Semantic tokens with CSS variables for colors, spacing, typography — Clerk appearance config references these
- `src/lib/utils.ts`: cn() helper using clsx + tailwind-merge — consistent with CVA patterns
- Lucide icons: Wheat icon used in sidebar branding — reuse for sign-in page branding

### Established Patterns
- **next-themes for dark mode**: Already handles SSR flash prevention, system preference sync. Clerk must integrate, not replace.
- **CVA for component variants**: Clerk components don't use CVA but appearance config follows similar variant thinking
- **Semantic tokens (two-tier)**: Primitives in :root, semantics reference via var(). Clerk appearance uses same pattern.

### Integration Points
- `src/app/layout.tsx`: Add ClerkProvider wrapper around existing ThemeProvider
- `src/middleware.ts`: NEW file at project root for clerkMiddleware()
- `src/app/sign-in/[[...sign-in]]/page.tsx`: NEW catch-all route for sign-in flows
- `.env.local`: NEW file for NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY

</code_context>

<specifics>
## Specific Ideas

- Logo + app name "CGM Dashboard" displayed above sign-in card, consistent with sidebar branding
- Full design token mapping in Clerk appearance: primary colors, background surfaces, text colors, font family, border-radius, shadows
- CSS variable references (not hardcoded values) so theme switching just works

</specifics>

<deferred>
## Deferred Ideas

- **Sign-up page**: User explicitly deferred to future phase. Phase 20 is sign-in only.
- **UserButton in header**: Covered by Phase 23 (User Experience Integration)
- **Password reset customization**: Clerk defaults handle this, polish if needed later
- **Email templates**: Default Clerk emails functional for MVP

</deferred>

---

*Phase: 20-Clerk Foundation Setup*
*Context gathered: 2026-05-09*
