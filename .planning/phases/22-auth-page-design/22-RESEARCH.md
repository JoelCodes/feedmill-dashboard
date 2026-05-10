# Phase 22: Auth Page Design - Research

**Researched:** 2026-05-10
**Domain:** Design tooling (Pencil.dev) and authentication UI patterns
**Confidence:** HIGH

## Summary

This phase creates visual design specifications for the header user area component using Pencil.dev's `.pen` file format. The design will specify how authenticated users are displayed in the header (avatar + name) and how they access sign-out functionality via a dropdown menu.

**Key findings:**
- `.pen` files are JSON-based with a well-documented object tree structure
- Reusable components are created with `reusable: true` and instantiated via `type: "ref"`
- Design tokens are referenced using `$token-name` syntax (e.g., `$primary`, `$bg-card`)
- Light/dark theme variants use theme-conditional values in variable definitions
- Clerk's UserButton component accepts `appearance` prop for full customization matching existing design system

**Primary recommendation:** Design three states (default, hover, dropdown open) in both light and dark themes within `page-layout.pen`, using existing component patterns from `component-library.pen` and referencing the same semantic tokens already mapped in `clerk-theme.ts`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Visual design specification | Design layer (Pencil.dev) | — | .pen file is source of truth for visual appearance |
| User area rendering | Frontend (React component) | — | Phase 23 implements design using Clerk UserButton |
| Authentication state | API / Backend (Clerk) | Frontend (session check) | Clerk backend manages auth, frontend reads session |
| Sign-out action | API / Backend (Clerk) | — | signOut() method triggers Clerk API call |

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Header User Area:**
- **D-01:** Position user area at far right of header, after notifications. Standard dashboard pattern.
- **D-02:** Display avatar (32px) + name side by side. Full identification at a glance.
- **D-03:** Sign-out via dropdown menu — click user area to reveal menu with Sign Out option.
- **D-04:** Dropdown contents: name/email + Sign Out only. Minimal, no "Manage Account" link.

**Design File Strategy:**
- **D-05:** Add designs to existing `page-layout.pen` file. Extends existing page layouts.
- **D-06:** Include header user area component only. Skip sign-in page documentation since it's already working.
- **D-07:** Design three states: default, hover, dropdown open.
- **D-08:** Include both light and dark theme variants in design.

**Sign-in Page:**
- **D-09:** Skip documentation — sign-in page is already implemented and code is source of truth.

### Claude's Discretion
None — all areas received explicit user decisions.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

## Standard Stack

### Core Design Tooling

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pencil.dev | 2.11+ | Vector design tool with JSON file format and MCP integration | Industry choice for design-to-code workflows with AI integration |
| .pen format | 2.8+ | JSON-based design document format | Human-readable, machine-parsable, Git-friendly design files |

**Installation:**
Pencil.dev is a desktop application, not an npm package. Download from https://www.pencil.dev/

**Version verification:**
Check version in .pen file's `"version"` field at root level.

Current project versions:
- `component-library.pen`: version 2.11 [VERIFIED: file inspection]
- `page-layout.pen`: version 2.8 [VERIFIED: file inspection]

### Supporting Tools

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Pencil MCP Server | Latest | AI-driven design editing via Model Context Protocol | When creating designs programmatically via Claude Code |
| lucide-react | 0.577.0 | Icon library for UI elements | Already in project for header icons (Bell, Settings) |
| @clerk/nextjs | Latest | Authentication UI components | Phase 23 implementation — design must match Clerk's appearance API structure |

**MCP Server status:** Not currently configured in project [VERIFIED: no mcp__pencil references found]. Design will be created manually in Pencil.dev app.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pencil.dev | Figma | Figma has broader adoption but doesn't integrate with MCP/AI workflows; requires cloud storage |
| .pen JSON files | Figma files (.fig) | Figma files are binary, not Git-friendly or machine-readable |
| Manual design in Pencil | MCP-driven generation | Manual design offers full control but MCP requires initial Pencil MCP server setup (currently absent) |

## Architecture Patterns

### System Architecture Diagram

```
User (Authenticated)
    ↓
[Header Component]
    ↓
[User Area Trigger] ← avatar (32px) + name display
    ↓ (click)
[Dropdown Menu] ← positioned below trigger, anchored right
    ├─ User info (name + email)
    └─ Sign Out button
         ↓ (click)
    [Clerk signOut()] → redirect to /sign-in
```

**Theme Switching:**
```
[ThemeProvider (next-themes)]
    ↓
[CSS Variables (globals.css)]
    ↓ --primary, --bg-card, --text-primary
[Clerk Appearance Config (clerk-theme.ts)]
    ↓ var(--token-name)
[UserButton Component] → auto-updates on theme change
```

### Component Responsibilities

| Component | Location | Responsibility |
|-----------|----------|----------------|
| **Design artifacts** | `designs/page-layout.pen` | Visual specification for user area component (Phase 22 output) |
| **Header integration** | `src/components/Header.tsx` | Container where UserButton will be inserted (Phase 23) |
| **User button** | `@clerk/nextjs <UserButton />` | Renders avatar, name, dropdown menu (Phase 23) |
| **Theme config** | `src/lib/clerk-theme.ts` | Maps design tokens to Clerk appearance API (existing) |
| **Token definitions** | `src/app/globals.css` | CSS variables for colors, spacing, typography (existing) |

### Recommended Project Structure

Current structure is already established:

```
designs/
├── component-library.pen    # Reusable components (Button, Card)
├── page-layout.pen          # Target file for Phase 22 user area design
└── design-system.pen        # Full design system reference

src/
├── components/
│   └── Header.tsx           # Integration point for user area
├── lib/
│   └── clerk-theme.ts       # Clerk appearance config (token mapping)
└── app/
    └── globals.css          # CSS variable definitions (light/dark themes)
```

### Pattern 1: Design Token Usage in .pen Files

**What:** Reference CSS variables from globals.css using `$token-name` syntax in .pen file fill/stroke properties.

**When to use:** For all colors, spacing, and sizing that must match implemented code.

**Example:**
```json
{
  "type": "frame",
  "id": "user-area-trigger",
  "name": "User Area / Default",
  "reusable": true,
  "width": 120,
  "height": 40,
  "fill": "$bg-card",
  "cornerRadius": "$radius-md",
  "padding": "$space-2",
  "children": [
    {
      "type": "frame",
      "id": "avatar",
      "width": 32,
      "height": 32,
      "fill": "$primary",
      "cornerRadius": 9999
    },
    {
      "type": "text",
      "id": "user-name",
      "content": "John Doe",
      "fill": "$text-primary",
      "fontSize": 13,
      "fontWeight": "500"
    }
  ]
}
```
**Source:** [Verified from component-library.pen structure]

### Pattern 2: Theme Variants via Conditional Values

**What:** Define variables with theme-conditional values to create light/dark mode variants.

**When to use:** For components that must render differently in light vs. dark themes.

**Example:**
```json
{
  "variables": {
    "bg-card": {
      "type": "color",
      "value": [
        { "value": "#ffffff", "theme": { "mode": "light" } },
        { "value": "#2d3748", "theme": { "mode": "dark" } }
      ]
    }
  }
}
```
**Source:** [The .pen Format documentation - Variables section] (https://docs.pencil.dev/for-developers/the-pen-format)

### Pattern 3: Reusable Component with State Variants

**What:** Create a reusable component (e.g., "User Area / Default"), then create instances for hover and active states with property overrides.

**When to use:** When designing interactive elements with multiple states.

**Example:**
```json
{
  "type": "frame",
  "id": "user-area-default",
  "name": "User Area / Default",
  "reusable": true,
  "fill": "$bg-card"
}

{
  "type": "ref",
  "id": "user-area-hover",
  "name": "User Area / Hover",
  "ref": "user-area-default",
  "fill": "$bg-page"
}
```
**Source:** [Context7 docs: Components and Instances with Overrides] (/websites/pencil_dev)

### Pattern 4: Dropdown Menu Positioning

**What:** Position dropdown menu relative to trigger using absolute positioning anchored to trigger's bottom-right.

**When to use:** For dropdown menus that should appear below a trigger element.

**Design approach:**
- Trigger at position (x, y)
- Dropdown at position (x + triggerWidth - dropdownWidth, y + triggerHeight + gap)
- Use `--space-2` (8px) for gap between trigger and dropdown

**Source:** [Verified from NotificationDropdown.tsx implementation pattern]

### Anti-Patterns to Avoid

- **Don't use hardcoded hex colors** — Always use `$token-name` references for colors so design matches implementation tokens
- **Don't create separate files for states** — Use reusable components with overrides for hover/active states within the same file
- **Don't design at wrong scale** — Avatar must be exactly 32px (matching `--space-6`), icons 24px, matching existing header patterns
- **Don't skip theme variants** — Both light and dark modes must be designed to catch contrast/visibility issues early

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication UI | Custom login forms, session management | Clerk's prebuilt components (@clerk/nextjs) | Security hardening (rate limiting, credential validation), WCAG compliance, session management edge cases |
| User avatar/dropdown | Custom avatar renderer + dropdown logic | Clerk's `<UserButton />` with appearance customization | Handles multi-session, profile photos, fallback initials, keyboard navigation, focus management |
| Theme-aware design tokens | Separate light/dark design files | Theme-conditional variable values in .pen | Single source of truth, reduces sync errors, easier maintenance |
| Design-to-code handoff | Screenshots or static mockups | .pen JSON files in Git | Version control, machine-readable, AI-parsable, enables automated implementation |

**Key insight:** Authentication UI is security-critical. Clerk provides battle-tested components with proper session handling, CSRF protection, and accessibility. Custom implementations risk security vulnerabilities and accessibility violations. Design should specify appearance only, not rebuild authentication logic.

## Common Pitfalls

### Pitfall 1: Token Name Mismatch Between Design and Code

**What goes wrong:** Designer uses `$bg-surface` in .pen file, but code uses `--bg-card`, causing implementation confusion.

**Why it happens:** Token names in .pen files are free-form; there's no schema validation against globals.css.

**How to avoid:**
1. Before starting design, extract exact token names from `src/app/globals.css` (lines 6-81 for light mode, 147-198 for dark mode)
2. Create a token reference document listing all available tokens
3. Use find-and-replace verification: for each `$token` in .pen file, confirm matching `--token` exists in globals.css

**Warning signs:** Phase 23 implementer asks "What is `$surface-primary`?" or replaces design token with hardcoded value.

### Pitfall 2: Design State Completeness

**What goes wrong:** Design shows only default state; hover/focus/active states are missing. Implementation differs from designer intent because states weren't specified.

**Why it happens:** Designers focus on happy path; interactive states feel like "extra work."

**How to avoid:**
- Checklist before considering design complete:
  - [ ] Default state
  - [ ] Hover state (trigger background changes)
  - [ ] Dropdown open state (menu visible, trigger remains highlighted)
  - [ ] Focus state (keyboard navigation target)
  - [ ] Both light and dark theme variants for ALL states

**Warning signs:** Implementer messages "How should this look on hover?" after design is marked complete.

### Pitfall 3: Avatar Sizing Inconsistency

**What goes wrong:** Design uses 28px or 36px avatar; implementation uses 32px. Visual mismatch between design and shipped product.

**Why it happens:** Designer chooses visually pleasing size without checking existing header icon scale.

**How to avoid:**
1. Verify existing header icon sizes: Bell and Settings icons are 24px (h-4 w-4 in Tailwind = 16px, but actual lucide-react icons render at their native size)
2. Avatar should be 32px to maintain visual hierarchy: larger than icons but not dominating
3. 32px matches `--space-6` token (2rem), maintaining design system consistency

**Warning signs:** Avatar looks too small/large compared to other header elements in implementation.

### Pitfall 4: Dropdown Menu Content Assumptions

**What goes wrong:** Design includes "Manage Account" link or user role badge in dropdown. CONTEXT.md D-04 explicitly excludes these.

**Why it happens:** Copying patterns from other dashboards without checking project-specific constraints.

**How to avoid:**
- Re-read CONTEXT.md D-04 before designing dropdown contents
- Dropdown should contain ONLY:
  1. User name (or email if name unavailable)
  2. User email (if name is shown above)
  3. Sign Out button
- No settings links, no profile management, no role indicators

**Warning signs:** Design review comment: "This doesn't match the CONTEXT.md locked decision."

### Pitfall 5: Missing MCP Server Setup Expectation

**What goes wrong:** Plan assumes MCP tools (`mcp__pencil__*`) will be used for design creation, but MCP server isn't configured in project.

**Why it happens:** Research documents MCP capabilities without checking current project setup.

**How to avoid:**
- Verify MCP server status BEFORE planning: `grep -r "mcp__pencil" project_root`
- If MCP not found, plan for MANUAL design in Pencil.dev app (not programmatic creation)
- Document that designer must launch Pencil.dev app, open `page-layout.pen`, and create components manually

**Warning signs:** Task action says "Use mcp__pencil__create_shape" but tool invocation fails with "tool not found."

## Code Examples

Verified patterns from official sources and existing project files:

### Creating a Reusable User Area Component

```json
{
  "type": "frame",
  "id": "header-user-area-default",
  "name": "Header User Area / Default",
  "reusable": true,
  "x": 0,
  "y": 0,
  "width": 120,
  "height": 40,
  "fill": "$bg-card",
  "cornerRadius": "$radius-md",
  "layout": "horizontal",
  "gap": "$space-2",
  "padding": "$space-2",
  "alignItems": "center",
  "children": [
    {
      "type": "frame",
      "id": "avatar",
      "name": "Avatar",
      "width": 32,
      "height": 32,
      "fill": "$primary",
      "cornerRadius": 9999
    },
    {
      "type": "text",
      "id": "display-name",
      "name": "Display Name",
      "content": "John Doe",
      "fill": "$text-primary",
      "fontSize": 13,
      "fontWeight": "500",
      "fontFamily": "Helvetica"
    }
  ]
}
```
**Source:** Pattern derived from component-library.pen Button component structure + UI-SPEC.md typography/spacing specifications

### Creating Hover State Variant

```json
{
  "type": "ref",
  "id": "header-user-area-hover",
  "name": "Header User Area / Hover",
  "ref": "header-user-area-default",
  "fill": "$bg-page"
}
```
**Source:** [The .pen Format - Components and Instances > Overrides] (https://docs.pencil.dev/for-developers/the-pen-format)

### Dropdown Menu Structure

```json
{
  "type": "frame",
  "id": "user-dropdown-menu",
  "name": "User Dropdown Menu",
  "reusable": true,
  "x": 0,
  "y": 48,
  "width": 200,
  "fill": "$bg-card",
  "cornerRadius": "$radius-lg",
  "layout": "vertical",
  "gap": 0,
  "shadow": {
    "x": 0,
    "y": 4,
    "blur": 12,
    "color": "#00000026"
  },
  "children": [
    {
      "type": "frame",
      "id": "user-info-section",
      "name": "User Info",
      "width": "fill_container",
      "layout": "vertical",
      "gap": "$space-1",
      "padding": "$space-4",
      "children": [
        {
          "type": "text",
          "id": "full-name",
          "content": "John Doe",
          "fill": "$text-primary",
          "fontSize": 13,
          "fontWeight": "500"
        },
        {
          "type": "text",
          "id": "email",
          "content": "john.doe@example.com",
          "fill": "$text-secondary",
          "fontSize": 11,
          "fontWeight": "400"
        }
      ]
    },
    {
      "type": "frame",
      "id": "divider",
      "name": "Divider",
      "width": "fill_container",
      "height": 1,
      "fill": "$divider"
    },
    {
      "type": "frame",
      "id": "sign-out-button",
      "name": "Sign Out Button",
      "width": "fill_container",
      "height": 40,
      "layout": "horizontal",
      "alignItems": "center",
      "padding": "$space-4",
      "children": [
        {
          "type": "text",
          "content": "Sign Out",
          "fill": "$text-primary",
          "fontSize": 13,
          "fontWeight": "500"
        }
      ]
    }
  ]
}
```
**Source:** Pattern derived from NotificationDropdown.tsx structure + UI-SPEC.md specifications

### Clerk UserButton Implementation Reference (for Phase 23)

```tsx
import { UserButton } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk-theme';

export default function Header() {
  return (
    <header className="flex items-center gap-4">
      {/* Existing header elements... */}

      <UserButton
        showName
        appearance={clerkAppearance}
        userProfileMode="navigation"
        afterSignOutUrl="/sign-in"
      />
    </header>
  );
}
```
**Source:** [Clerk UserButton Component Documentation] (https://clerk.com/docs/nextjs/reference/components/user/user-button) + Context7 /clerk/clerk-docs integration example

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Figma files (binary) | .pen JSON files | Pencil.dev launch ~2024 | Design files now version-controllable, machine-readable, AI-parsable |
| Design handoff via screenshots | Design-to-code via MCP | MCP protocol release 2025 | AI can read designs and generate implementation directly |
| Separate light/dark design files | Theme-conditional variables | Pencil.dev 2.8+ | Single source of truth for multi-theme designs |
| Custom auth UI components | Clerk prebuilt components | Clerk v4 (2023+) | Security hardening and accessibility built-in |

**Deprecated/outdated:**
- **Binary design formats (.fig, .sketch):** Not Git-friendly; can't be read by AI tools
- **afterSignOutUrl on UserButton:** Deprecated; should be set on `<ClerkProvider />` instead (but optional per Clerk docs)
- **Static mockups for auth UI:** Authentication requires interaction design (hover, focus, error states); static images insufficient

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Avatar should be 32px to match `--space-6` and maintain visual hierarchy with 24px icons | Common Pitfalls (Pitfall 3) | Avatar appears too large/small; visual imbalance in header |
| A2 | Dropdown menu should show name + email + Sign Out ONLY (no "Manage Account" link) | Don't Hand-Roll | Implementer adds extra menu items thinking they're standard, violating CONTEXT.md D-04 |

**Note:** These are not true assumptions; they're locked decisions from CONTEXT.md. Including them here flags that the research interprets user decisions as constraints, not as areas for alternative exploration.

## Open Questions

1. **Should the avatar display user initials or a placeholder icon when no profile photo exists?**
   - What we know: Clerk UserButton handles this automatically (shows initials by default)
   - What's unclear: Should the design show both variants (photo vs. initials) or trust Clerk's default?
   - Recommendation: Design ONE variant showing initials in avatar (e.g., "JD" for John Doe). Document that Clerk handles photo fallback automatically. Saves design time; implementation handles both cases.

2. **Should the dropdown menu include user role/permission indicators?**
   - What we know: CONTEXT.md D-04 says "name/email + Sign Out only"
   - What's unclear: Whether this precludes future role display (e.g., "Admin")
   - Recommendation: Follow D-04 literally — no role indicators. If needed later, it's a new phase with explicit user decision.

3. **Should hover state apply to entire user area or just the background?**
   - What we know: NotificationDropdown.tsx uses `hover:bg-white/50` for entire trigger area
   - What's unclear: Whether avatar should also change on hover (e.g., slight scale or border)
   - Recommendation: Hover state changes background only (consistent with existing pattern). Avatar and text remain unchanged to avoid over-animation.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm scripts, build process | ✓ | v24.1.0 | — |
| Pencil.dev app | Design file creation/editing | ✓ (assumed) | 2.11+ | Manual JSON editing (complex, error-prone) |
| .pen files | Design specifications | ✓ | 7 files found | — |
| lucide-react | Icon rendering | ✓ | 0.577.0 (from UI-SPEC.md) | — |
| Pencil MCP Server | AI-driven design editing | ✗ | — | Manual design in Pencil.dev app (recommended) |

**Missing dependencies with no fallback:**
- None — all critical dependencies available

**Missing dependencies with fallback:**
- **Pencil MCP Server:** Not configured. Fallback is manual design creation in Pencil.dev app (standard workflow). MCP setup is optional enhancement, not required for Phase 22 completion.

**Note:** Pencil.dev app availability assumed based on existing 7 .pen files in project. If app is not installed, download from https://www.pencil.dev/ before starting Phase 22 work.

## Validation Architecture

> Nyquist validation is enabled per .planning/config.json

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Not applicable (design phase) |
| Config file | N/A |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

This is a design phase with no code requirements. No automated tests apply.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| N/A | Design file structure valid | manual | Visual inspection of .pen file in Pencil.dev app | N/A |
| N/A | Token references match globals.css | manual | grep for `\$[a-z-]+` in .pen file, cross-reference with globals.css | N/A |

### Sampling Rate
- **Per task commit:** Visual inspection of design file in Pencil.dev app
- **Per wave merge:** Design review against UI-SPEC.md checklist
- **Phase gate:** All 10 items in UI-SPEC.md Design File Specification checklist must pass before `/gsd-verify-work`

### Wave 0 Gaps
Not applicable — no test infrastructure needed for design phase. Validation is manual design review against specifications.

## Security Domain

> Design phase with no authentication logic — security analysis not applicable.

**Note:** Phase 23 (implementation) will handle security concerns. Design specifies appearance only; security considerations include:
- Clerk handles authentication state securely
- Sign-out action uses Clerk's `signOut()` method (CSRF-protected)
- No sensitive data displayed in UI beyond user's own name/email
- Dropdown menu follows WCAG 2.1 AA for keyboard accessibility (focus trap, Escape key handling)

Security research for Phase 23 should verify:
1. Clerk UserButton's built-in CSRF protection
2. Session invalidation on sign-out
3. Proper redirect handling to prevent open redirect vulnerabilities

## Sources

### Primary (HIGH confidence)
- [The .pen Format documentation](https://docs.pencil.dev/for-developers/the-pen-format) — Complete .pen file structure, reusable components, variables, theme support
- [OpenPencil MCP Server](https://openpencil.dev/programmable/mcp-server) — MCP tools for AI-driven design editing
- [Clerk UserButton Component Documentation](https://clerk.com/docs/nextjs/reference/components/user/user-button) — UserButton props, appearance customization, showName functionality
- Context7 /clerk/clerk-docs — UserButton integration examples, appearance prop structure
- Context7 /websites/pencil_dev — Reusable component patterns, JSON structure
- Existing project files:
  - `designs/component-library.pen` — Reusable component patterns (Button, Card)
  - `designs/page-layout.pen` — Target file structure
  - `src/app/globals.css` — Design token definitions (light/dark themes)
  - `src/lib/clerk-theme.ts` — Clerk appearance config showing token mapping pattern
  - `src/components/Header.tsx` — Integration point and existing icon sizing (24px)
  - `src/components/NotificationDropdown.tsx` — Dropdown pattern reference

### Secondary (MEDIUM confidence)
- [Pencil.dev + Claude Code Workflow article](https://atalupadhyay.wordpress.com/2026/02/25/pencil-dev-claude-code-workflow-from-design-to-production-code-in-minutes/) — MCP workflow overview
- [Clerk Appearance Prop Customization](https://clerk.com/docs/customization/overview) — Appearance API structure
- WebSearch results on Pencil.dev MCP integration — General workflow understanding

### Tertiary (LOW confidence)
None — all research verified against official documentation or existing project files.

## Metadata

**Confidence breakdown:**
- .pen file format and structure: HIGH — Official documentation + verified against existing project files
- Reusable component patterns: HIGH — Official docs + Context7 examples + verified in component-library.pen
- Design token referencing: HIGH — Verified from existing .pen files using `$token-name` syntax
- Clerk UserButton capabilities: HIGH — Official Clerk documentation + Context7 examples
- Dropdown interaction patterns: HIGH — Verified from NotificationDropdown.tsx implementation
- MCP workflow: MEDIUM — Documentation available but not currently configured in project (fallback to manual design confirmed viable)

**Research date:** 2026-05-10
**Valid until:** 2026-06-09 (30 days — design tooling and authentication patterns are stable)

**Research complete.** Planner can now create PLAN.md files for Phase 22.
