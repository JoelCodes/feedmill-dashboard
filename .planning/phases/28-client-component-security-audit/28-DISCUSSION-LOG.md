# Phase 28: Client Component Security Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 28-Client Component Security Audit
**Areas discussed:** Audit depth & refactor scope, Defense-in-depth on demo pages, Sensitivity classification, Guidelines deliverable, `<Protect>` usage

---

## Audit Depth & Refactor Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Inventory + document only | Audit report only. No code changes. | |
| Inventory + targeted guards | Add `await requireRole('demo')` to /demo/* pages; mock data fetch stays client-side. | |
| Full refactor to server-fetch pattern | Convert /demo/* pages to async Server Components that call `requireRole`, fetch data, and pass as props to client children. | ✓ |
| Inventory + guards + sample `<Protect>` | Targeted guards + one demonstrative `<Protect>` use in Header.tsx. | |

**User's choice:** Full refactor to server-fetch pattern
**Notes:** Establishes the canonical pattern now while data is still mock — future real-data work follows the same shape with zero re-plumbing.

---

## Defense-in-Depth Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Keep middleware + add page guards | Both layers retained; settings stays unguarded. | ✓ |
| Page guards only, simplify middleware | Remove demo-role check from middleware; page-level is the single point. | |
| Belt-and-suspenders + settings guard | Keep middleware, add page guards, plus an `await auth()` re-verify on /settings. | |
| Page guards + middleware retained AS-IS | Don't touch middleware (Phase 25 already verified). | |

**User's choice:** Keep middleware + add page guards
**Notes:** Middleware enforces at the edge; page-level `requireRole` is the inner layer. Settings remains accessible to all authenticated users per Phase 25/26 decisions.

---

## Sensitivity Classification

| Option | Description | Selected |
|--------|-------------|----------|
| Mock = sensitive (treat as canonical) | Refactor commits the codebase to server-fetch for ALL /demo/* data, mock or real. | ✓ |
| Mock = sensitive but with exit ramp | Same refactor, but doc leaves an opening for non-sensitive client fetches later. | |
| Scope to /demo/* only, leave room for /settings | Two patterns coexist with documented criteria. | |

**User's choice:** Mock = sensitive (canonical pattern)
**Notes:** Settings localStorage is documented in CONTEXT.md as an explicit "browser-state, not data-fetching" exception — not a competing pattern.

---

## Guidelines Deliverable

| Option | Description | Selected |
|--------|-------------|----------|
| New `docs/security-patterns.md` | Single dedicated doc; audit findings table embedded at top; guidelines below. | ✓ |
| Extend `docs/clerk-setup.md` | Append to existing Clerk doc; findings in `.planning/phases/28-.../28-AUDIT.md`. | |
| Split: docs + 28-AUDIT.md | Two artifacts — forward-looking guidelines in docs/, point-in-time audit in .planning/. | |
| JSDoc + README section | Inline JSDoc + short README section, no separate doc. | |

**User's choice:** New `docs/security-patterns.md`
**Notes:** Findings table + forward-looking guidelines live together so future readers see both at once. No separate `28-AUDIT.md` artifact.

---

## `<Protect>` Component Usage

| Option | Description | Selected |
|--------|-------------|----------|
| Doc-only — no live `<Protect>` | Cover the pattern in security-patterns.md with code snippets. No live usage yet. | ✓ |
| One demonstrative use in Header | Add a `<Protect role="demo">` cue in Header.tsx with an inline comment. | |
| Defer `<Protect>` use to when needed | Doc explains the pattern; first live use deferred to a real role-conditional UI need. | |

**User's choice:** Doc-only — no live `<Protect>`
**Notes:** Aligns with deferring speculative usage. First live `<Protect>` lands when a real role-conditional UI need arises (e.g., admin-only feature in a later milestone).

---

## Claude's Discretion

- Exact split between "modify existing client component to accept data prop" vs "introduce thin client wrapper" — left to planning, with a heuristic noted in CONTEXT.md.
- Loading-state handling during server-fetch transition (`loading.tsx` vs `<Suspense>`) — planning-level concern.

## Deferred Ideas

- Live `<Protect>` usage — pattern documented, first adoption deferred to a future phase with a real UI need.
- Removing middleware role check — user chose defense-in-depth; revisit only if page-guard coverage becomes consistently complete in a later milestone.
- Granular sensitivity tiers (public vs sensitive data) — current mock data treated uniformly as sensitive; reopen if/when truly public data appears.
- Programmatic audit (CI lint rule flagging `'use client'` files that import data services) — tooling phase, not a security phase.
