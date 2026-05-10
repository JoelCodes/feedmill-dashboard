# Phase 21: Route Protection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 21-route-protection
**Areas discussed:** Root path handling, Verification approach

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Root path handling | Should / be protected, or redirect to /orders (the main dashboard)? | ✓ |
| Verification approach | Manual testing vs automated tests for route protection | ✓ |
| Skip discussion | Middleware is configured — go straight to planning verification tasks | |

**User's choice:** Root path handling, Verification approach
**Notes:** User wanted to discuss both areas before planning.

---

## Root Path Handling

### Post-sign-in landing page

| Option | Description | Selected |
|--------|-------------|----------|
| / (root page) (Recommended) | Keep current behavior — root page is the dashboard home | ✓ |
| /orders | Default to Orders since it's the primary workflow | |
| You decide | Claude picks based on existing navigation patterns | |

**User's choice:** / (root page) (Recommended)
**Notes:** None

### Root path behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as dashboard home (Recommended) | Current src/app/page.tsx stays as the landing page after sign-in | ✓ |
| Redirect to /orders | Root redirects to orders page — simpler mental model | |

**User's choice:** Keep as dashboard home (Recommended)
**Notes:** None

---

## Verification Approach

### Verification method

| Option | Description | Selected |
|--------|-------------|----------|
| Automated tests (Recommended) | Write tests that verify unauthenticated requests get redirected | ✓ |
| Manual curl testing | Document curl commands to test each route, run them manually | |
| Both | Automated tests plus documented manual verification steps | |

**User's choice:** Automated tests (Recommended)
**Notes:** None

### Test type

| Option | Description | Selected |
|--------|-------------|----------|
| E2E tests with Playwright (Recommended) | Full browser tests verifying redirect behavior — closest to real user experience | ✓ |
| Integration tests with Jest | Test middleware logic in isolation using mocked Clerk — faster but less realistic | |
| You decide | Claude picks based on existing test infrastructure | |

**User's choice:** E2E tests with Playwright (Recommended)
**Notes:** None

### Test scope

| Option | Description | Selected |
|--------|-------------|----------|
| Unauthenticated only (Recommended) | Verify redirects work — keep Phase 21 focused on protection | ✓ |
| Both authenticated and unauthenticated | Also verify signed-in users can access protected pages | |
| You decide | Claude picks based on phase success criteria | |

**User's choice:** Unauthenticated only (Recommended)
**Notes:** Focused on verifying unauthenticated redirects work.

### Route coverage

| Option | Description | Selected |
|--------|-------------|----------|
| All dashboard routes (Recommended) | /orders, /customers, /customers/[id], /mill-production, /settings, /inventory, /shipments, / | |
| Only success criteria routes | /orders, /customers, /mill-production, /settings (from roadmap) | ✓ |
| You decide | Claude picks based on middleware matcher | |

**User's choice:** Only success criteria routes
**Notes:** Test only the routes specified in Phase 21 success criteria from ROADMAP.md.

### Return URL verification

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, include return URL test | Verify user lands on originally requested page after sign-in | ✓ |
| No, skip for now | Focus on redirect-to-sign-in — return URL is Clerk's default behavior | |

**User's choice:** Yes, include return URL test
**Notes:** Full flow: unauthenticated → redirect to sign-in → after sign-in, return to originally requested page.

---

## Claude's Discretion

None — all areas received explicit user decisions.

## Deferred Ideas

None — discussion stayed within phase scope.
