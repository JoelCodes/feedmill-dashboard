---
phase: 260512-kfy
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/types/clerk.d.ts
  - src/lib/auth.ts
  - src/lib/auth.test.ts
  - src/middleware.ts
  - src/middleware.test.ts
  - src/test/fixtures/clerkAuth.ts
  - src/test/fixtures/clerkAuth.test.ts
  - docs/security-patterns.md
  - docs/clerk-setup.md
autonomous: false
requirements:
  - REFACTOR-ROLES-01
tags:
  - auth
  - clerk
  - refactor
  - roles
must_haves:
  truths:
    - "`CustomJwtSessionClaims.metadata.roles` is `Role[]` (not `role: Role`); the `role` property is gone from the type."
    - "`requireRole('demo')` resolves when `sessionClaims.metadata.roles.includes('demo')` and redirects to `/` when it does not."
    - "`requireRole` still redirects to `/sign-in` when `userId` is null (unauth branch unchanged)."
    - "Middleware redirects `/demo/*` to `/` for any session whose `metadata.roles` array does not include `'demo'`."
    - "All unit tests (`auth.test.ts`, `middleware.test.ts`, `clerkAuth.test.ts`) pass after the refactor; no test still asserts the old `metadata.role` singular shape."
    - "`docs/clerk-setup.md` documents the new JWT template body `{\"metadata\": {\"roles\": \"{{user.public_metadata.roles}}\"}}` and a `publicMetadata` shape of `{\"roles\": [\"demo\"]}`."
    - "`docs/security-patterns.md` references `sessionClaims.metadata.roles` (array) anywhere it previously read `sessionClaims.metadata.role` (singular)."
    - "After the manual Clerk Dashboard cutover, signing in as the demo test user reaches `/demo/orders` without a redirect; signing in as the norole user is redirected from `/demo/orders` to `/`."
  artifacts:
    - path: "src/types/clerk.d.ts"
      provides: "CustomJwtSessionClaims.metadata.roles: Role[]"
      contains: "roles?: Role[]"
    - path: "src/lib/auth.ts"
      provides: "requireRole that reads sessionClaims.metadata.roles array"
      contains: "metadata?.roles"
    - path: "src/middleware.ts"
      provides: "Demo route gate against roles array"
      contains: "metadata?.roles"
    - path: "docs/clerk-setup.md"
      provides: "JWT template + publicMetadata runbook for plural roles"
      contains: "\"roles\""
    - path: "docs/security-patterns.md"
      provides: "Canonical guard docs updated to plural roles"
      contains: "metadata.roles"
  key_links:
    - from: "src/middleware.ts"
      to: "src/types/clerk.d.ts"
      via: "sessionClaims.metadata.roles (CustomJwtSessionClaims declaration)"
      pattern: "metadata\\?\\.roles"
    - from: "src/lib/auth.ts"
      to: "src/types/clerk.d.ts"
      via: "sessionClaims.metadata.roles (CustomJwtSessionClaims declaration)"
      pattern: "metadata\\?\\.roles"
    - from: "src/test/fixtures/clerkAuth.ts"
      to: "src/lib/auth.ts"
      via: "mockDemoSession/mockNonDemoSession seed sessionClaims.metadata.roles array"
      pattern: "roles:\\s*\\["
    - from: "Clerk JWT template (Dashboard)"
      to: "src/middleware.ts + src/lib/auth.ts"
      via: "publicMetadata.roles → sessionClaims.metadata.roles claim shape"
      pattern: "\"metadata\":\\s*\\{\\s*\"roles\""
---

<objective>
Refactor the single-string `role` field on a Clerk user to a plural `roles` string array, so a user can hold multiple roles simultaneously (e.g. `["demo", "mill_operator"]`). The `Role` union type itself is unchanged — only the field shape on `CustomJwtSessionClaims.metadata` and on Clerk `publicMetadata` flips from `Role` to `Role[]`. All membership checks use `Array.prototype.includes()`.

Purpose: Unblock v2.0 Mill Production MVP work where a single user (a mill supervisor) needs to hold both `demo` (for the legacy `/demo/*` namespace) and a forthcoming mill-production role at the same time. The current single-string design forces a binary choice the moment v2.0 introduces a second production role.

Output: Updated type, server utility, middleware, test fixtures, and runbook docs. The Clerk Dashboard JWT template and the single existing test user's `publicMetadata` must be migrated manually (a checkpoint task captures this).

Scope boundaries: No backward compatibility shim. The cutover is hard: the type stops accepting `role`, the runtime stops reading `role`, the Dashboard claim shape changes in lockstep. Only one real test user exists, so this is safe. No new `Roles` alias / wrapper class — the field type is simply `Role[]`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

@src/types/clerk.d.ts
@src/lib/auth.ts
@src/lib/auth.test.ts
@src/middleware.ts
@src/test/fixtures/clerkAuth.ts
@docs/clerk-setup.md
@docs/security-patterns.md

<interfaces>
<!-- Key types and current shapes the executor needs. Extracted from codebase. -->
<!-- Executor must update these in lockstep — no codebase exploration needed. -->

Current shape in `src/types/clerk.d.ts`:
```typescript
export type Role = 'demo' | 'admin' | 'user';

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Role;
    };
  }
}
```

Target shape (only the field flips; `Role` union is unchanged):
```typescript
export type Role = 'demo' | 'admin' | 'user';

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      roles?: Role[];
    };
  }
}
```

Current `requireRole` decision in `src/lib/auth.ts` (line 46):
```typescript
if (sessionClaims?.metadata?.role !== role) {
  redirect('/');
}
```

Target:
```typescript
if (!sessionClaims?.metadata?.roles?.includes(role)) {
  redirect('/');
}
```

Current middleware demo gate in `src/middleware.ts` (line 35):
```typescript
if (sessionClaims?.metadata?.role !== 'demo') {
  const url = new URL('/', request.url);
  return NextResponse.redirect(url);
}
```

Target:
```typescript
if (!sessionClaims?.metadata?.roles?.includes('demo')) {
  const url = new URL('/', request.url);
  return NextResponse.redirect(url);
}
```

Test fixture seed shape in `src/test/fixtures/clerkAuth.ts` flips from
`sessionClaims: { metadata: { role: 'demo' } }` to
`sessionClaims: { metadata: { roles: ['demo'] } }` in `mockDemoSession`,
`mockNonDemoSession`, and the corresponding assertions in
`src/test/fixtures/clerkAuth.test.ts`.

Clerk JWT template body flips from
`{"metadata": {"role": "{{user.public_metadata.role}}"}}` to
`{"metadata": {"roles": "{{user.public_metadata.roles}}"}}`.

Clerk `publicMetadata` per user flips from
`{"role": "demo"}` to `{"roles": ["demo"]}`.
</interfaces>

<!-- Discrepancy note for the executor:
     The original task description references `src/lib/server/role.ts`, a
     `checkRole` utility, and an "8-case Jest suite". The actual code on disk is:
       - `src/lib/auth.ts` (no `checkRole` is exported — `requireRole` only)
       - `src/lib/auth.test.ts` with **3 test cases** (unauth, wrong role, match)
     `docs/security-patterns.md` §3 references a hypothetical `checkRole`;
     **do not introduce it in this plan** — only update its documented signature
     so it reads `sessionClaims.metadata.roles` IF a future executor adds it.
     The 8-case Jest mention in the orchestrator brief was inaccurate; honor the
     actual 3 cases in `src/lib/auth.test.ts` and ALSO update the parallel
     fixture-shape tests in `src/test/fixtures/clerkAuth.test.ts` and the
     string-grep tests in `src/middleware.test.ts`. -->
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Flip CustomJwtSessionClaims and runtime guards from `role` to `roles` array</name>
  <files>src/types/clerk.d.ts, src/lib/auth.ts, src/lib/auth.test.ts, src/middleware.ts, src/middleware.test.ts, src/test/fixtures/clerkAuth.ts, src/test/fixtures/clerkAuth.test.ts</files>
  <behavior>
    - `auth.test.ts` case 1 (unauth): `mockAuth` resolves `{ userId: null, sessionClaims: null }` → `requireRole('demo')` rejects with `{ url: '/sign-in' }`. UNCHANGED behavior; verify still passes after refactor.
    - `auth.test.ts` case 2 (wrong role): `sessionClaims: { metadata: { roles: ['user'] } }` → `requireRole('demo')` rejects with `{ url: '/' }`.
    - `auth.test.ts` case 3 (match): `sessionClaims: { metadata: { roles: ['demo'] } }` → `requireRole('demo')` resolves `undefined`.
    - NEW `auth.test.ts` case 4 (multi-role match): `sessionClaims: { metadata: { roles: ['demo', 'admin'] } }` → `requireRole('demo')` resolves `undefined` AND `requireRole('admin')` resolves `undefined`. Documents the multi-role contract that motivates the refactor.
    - NEW `auth.test.ts` case 5 (missing roles field): `sessionClaims: { metadata: {} }` → `requireRole('demo')` rejects with `{ url: '/' }`. Covers the optional-chain branch.
    - `clerkAuth.test.ts`: any existing assertions that read `metadata.role` flip to `metadata.roles` and assert array containment via `toContain('demo')` (or `toEqual(['demo'])` where the test pins the exact shape).
    - `middleware.test.ts` "checks role for demo routes via sessionClaims": the string-grep assertions `expect(middlewareContent).toContain("metadata")` and `expect(middlewareContent).toContain("role")` already pass against `metadata?.roles` (since `roles` contains the substring `role`). Add `expect(middlewareContent).toContain("roles")` and `expect(middlewareContent).toContain("includes('demo')")` to make the new plural shape load-bearing.
  </behavior>
  <action>
    Update the type and both runtime guards in lockstep so the codebase never compiles with a mismatched shape. Per the constraints, this is a clean cutover — no `role` accessor remains anywhere in `src/`. Per D-04 (Phase 28), the role check stays in-session (no Clerk Backend API call); the only change is the field shape.

    Step 1 — Type (`src/types/clerk.d.ts`): Rename the optional field `role?: Role` to `roles?: Role[]` inside the `CustomJwtSessionClaims.metadata` interface. Leave the `Role` union (`'demo' | 'admin' | 'user'`) and the file-level JSDoc untouched. Do NOT introduce a `Roles` alias; the field type is the inline `Role[]`.

    Step 2 — `src/lib/auth.ts`:
      - Replace `sessionClaims?.metadata?.role !== role` (line ~46) with `!sessionClaims?.metadata?.roles?.includes(role)`. Use `Array.prototype.includes`, not `Set` (per constraint: simple, no Set at this scale).
      - Update the JSDoc on `requireRole`: the file header comment (line ~5) currently reads "via `auth().sessionClaims?.metadata?.role`" — change `role` to `roles`. The branch-list JSDoc (line ~22) currently reads "`sessionClaims.metadata.role !== role` → `redirect('/')`" — change to "`!sessionClaims.metadata.roles?.includes(role)` → `redirect('/')`".
      - Do NOT add a `checkRole` export. `docs/security-patterns.md` §3 references one, but no implementation exists in the codebase today (pre-existing doc drift); leaving the doc drift in place is outside this refactor's scope EXCEPT for the field-shape rename handled in Task 2.

    Step 3 — `src/lib/auth.test.ts`:
      - Update cases 2 and 3 to use `roles: ['user']` and `roles: ['demo']` respectively.
      - Add case 4 (multi-role match) and case 5 (missing roles field) per the `<behavior>` block. Final file has 5 `it(...)` blocks inside the existing `describe('requireRole', ...)`.

    Step 4 — `src/middleware.ts`:
      - Replace `sessionClaims?.metadata?.role !== 'demo'` (line ~35) with `!sessionClaims?.metadata?.roles?.includes('demo')`. Keep the literal `'demo'` (not `role` — middleware hardcodes the demo gate per ACCESS-01).

    Step 5 — `src/middleware.test.ts`:
      - In the "checks role for demo routes via sessionClaims" test (line ~140), append two assertions: `expect(middlewareContent).toContain("roles")` and `expect(middlewareContent).toContain("includes('demo')")`. Leave existing assertions (`toContain("sessionClaims")`, `toContain("metadata")`, `toContain("role")`, the negative `not.toContain("clerkClient")`, the `'/demo(.*)'` narrowness guard) untouched — they all remain valid against the new shape.
      - Update the inline comment at line ~147 from "Read role from sessionClaims.metadata.role" to "Read roles from sessionClaims.metadata.roles".

    Step 6 — `src/test/fixtures/clerkAuth.ts`:
      - `mockDemoSession` (line ~167-172): change `metadata: { role: 'demo' }` to `metadata: { roles: ['demo'] }`.
      - `mockNonDemoSession` (line ~179-184): change `metadata: { role }` to `metadata: { roles: [role] }`.
      - Update the JSDoc on `mockNonDemoSession` so the example session shape and the surrounding prose use `roles` (array) wording, not `role` (singular).

    Step 7 — `src/test/fixtures/clerkAuth.test.ts`:
      - Any assertion that reads `metadata: { role: ... }` (lines ~43, ~51, ~59 per the earlier grep) must flip to `metadata: { roles: [...] }`. If a test pins the exact session shape via `toEqual`, mirror the new array form; if a test asserts containment (e.g. it just wants to know "demo session contains demo role"), prefer `expect(claims.metadata.roles).toContain('demo')` over deep equality so the test stays robust to future role additions.

    Cross-cutting constraints:
      - No `Set` — use `.includes()` everywhere.
      - No `role` accessor remains anywhere under `src/` after this task. The plural `roles` is the only field. Verify with: `grep -rn "metadata\\.role\\b" src/` (the `\\b` excludes `metadata.roles`) — expected zero hits.
      - Type union `Role` is NOT renamed; it stays `Role`. Only the field type flips from `Role` to `Role[]`.
      - All three test suites (auth.test.ts, middleware.test.ts, clerkAuth.test.ts) must be green at the end of the task. The executor commits atomically with the implementation; no partial green states.
  </action>
  <verify>
    <automated>npm test -- --testPathPattern="(auth\.test|middleware\.test|clerkAuth\.test)" --runInBand && npx tsc --noEmit && test $(grep -rn "metadata\.role[^s]" src/ | grep -v "^[^:]*\.test\.ts" | grep -cv '^#') -eq 0</automated>
  </verify>
  <done>The three target test suites pass, `tsc --noEmit` reports zero errors, and `grep -rn "metadata\.role[^s]" src/` returns zero non-test, non-comment hits (i.e. the singular field is gone from runtime code; the only allowed references would be in a JSDoc historical note or a deleted test the executor missed — there should be none).</done>
</task>

<task type="auto">
  <name>Task 2: Update Clerk + security pattern runbooks to plural roles shape</name>
  <files>docs/clerk-setup.md, docs/security-patterns.md</files>
  <action>
    These two docs are the only durable artefacts a future operator or executor will read when onboarding new role-gated pages or recreating the Clerk dev instance. They must reflect the new shape end-to-end.

    Step 1 — `docs/clerk-setup.md`:
      - §"Step 1: Configure the JWT Template": replace the body
          `{"metadata": {"role": "{{user.public_metadata.role}}"}}`
        with
          `{"metadata": {"roles": "{{user.public_metadata.roles}}"}}`.
        Update the surrounding "Note" paragraph so the reference to `CustomJwtSessionClaims.metadata.role` becomes `CustomJwtSessionClaims.metadata.roles` and the phrase "selects only the `role` value" becomes "selects only the `roles` array".
      - §"Step 2: Create Test Users": rename the table header column `publicMetadata.role` to `publicMetadata.roles`. Update each row's value: `demo` → `["demo"]`, `(not set)` → `(not set)` (unchanged), `admin` → `["admin"]`. Update the trailing Note: "an authenticated user with no `publicMetadata.role`" → "an authenticated user with no `publicMetadata.roles`".
      - §"Step 3: Assign publicMetadata.role": rename heading to `## Step 3: Assign publicMetadata.roles`. Replace the JSON examples `{"role": "demo"}` and `{"role": "admin"}` with `{"roles": ["demo"]}` and `{"roles": ["admin"]}`. Update the trailing Note: "Leave the `e2e-norole+clerk_test@example.com` user with no `publicMetadata.roles` set. Do not write `{"roles": null}` or `{"roles": []}` — leave the field absent entirely." (The "do not write empty array" guidance is the plural analogue of "do not write null"; preserve absent-vs-empty semantics so the norole user keeps acting as the no-roles negative test fixture.)
      - §"Verification" step 3: update the decoded-JWT expectations to `"metadata": {"roles": ["demo"]}` and `"metadata": {"roles": ["admin"]}`. The norole expectation ("`metadata` absent or `metadata.role` absent") becomes "`metadata` absent or `metadata.roles` absent".
      - §"Order of Operations Warning": the symptom description "decoded JWT has no metadata field" stays accurate. Replace the symptom "stale or missing `metadata.role` claim" with "stale or missing `metadata.roles` claim".
      - Add a new section at the end of §"Step 1" titled "Migration note (one-time)" that documents the cutover: any user with an existing `publicMetadata.role` string must have it manually replaced with `publicMetadata.roles: [<old value>]` in the Dashboard, AND the JWT template body must be replaced before users sign back in. Per the constraint, only one test user exists in the dev Dashboard, so this is a single Dashboard edit. Cross-link to Task 3 in this PLAN as the operator's execution checkpoint.

    Step 2 — `docs/security-patterns.md`:
      - §3 table row for `requireRole`: change "Both `requireRole` and `checkRole` read role state from `sessionClaims.metadata.role` via `auth()` from `@clerk/nextjs/server`" to "Both `requireRole` and `checkRole` read role state from `sessionClaims.metadata.roles` (a `Role[]` array) via `auth()` from `@clerk/nextjs/server`, using `Array.prototype.includes` for membership checks". This sentence currently lives in the paragraph immediately below the table.
      - §6 onboarding checklist step 3: no functional change to `await requireRole('demo')` invocation shape, but if any prose mentions "checks `metadata.role`" replace with "checks `metadata.roles.includes(...)`".
      - §1 audit table: do NOT touch the historical row entries (they are a point-in-time Phase 28 snapshot). Do, however, append a short paragraph BELOW the existing "Note: This table is a point-in-time snapshot..." note that records the post-refactor shape change: "**Post-refactor (260512-kfy):** `CustomJwtSessionClaims.metadata.role: Role` was renamed to `CustomJwtSessionClaims.metadata.roles: Role[]`. All `requireRole` and middleware checks use `metadata.roles.includes(...)`. The audit rows above still describe the correct guard pattern; only the underlying claim shape changed."
      - Anywhere else in the doc that the literal string `metadata.role` appears (not `metadata.roles`), update to `metadata.roles`. Run `grep -n "metadata\\.role[^s]" docs/security-patterns.md` after editing — expected zero hits.

    Cross-cutting:
      - Both files are Markdown only — no code paths affected. The constraint that "JWT template change is a manual Clerk Dashboard step" is honored: the runbook tells the operator WHAT to type into the Dashboard, not how to script it.
      - Do not introduce a `checkRole` implementation. The references in §3 / §6 to a `checkRole` helper remain as forward-looking documentation for a future phase; the rename of the field name inside that documentation is the only edit.
  </action>
  <verify>
    <automated>test $(grep -v '^#' docs/clerk-setup.md docs/security-patterns.md | grep -cE 'metadata\.role[^s]') -eq 0 && grep -q 'metadata\.roles' docs/clerk-setup.md && grep -q 'metadata\.roles' docs/security-patterns.md && grep -q '"roles"' docs/clerk-setup.md && grep -q 'publicMetadata.roles' docs/clerk-setup.md</automated>
  </verify>
  <done>Both docs read `metadata.roles` (plural) throughout; zero remaining occurrences of `metadata.role` followed by a non-`s` character (comments excluded); the JWT template body example, the `publicMetadata` JSON examples, and the §"Step 2" table all show the array shape; the Migration note in clerk-setup.md cross-references Task 3 of this plan; security-patterns.md §1 has the post-refactor paragraph appended.</done>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 3: Clerk Dashboard manual cutover — JWT template + publicMetadata</name>
  <files>(none — Clerk Dashboard UI only)</files>
  <action>The operator must edit the Clerk dev instance Dashboard in two places: (1) the session JWT template body, and (2) the existing test user's `publicMetadata` field. See `<how-to-verify>` below for the exact step-by-step. Claude cannot perform either edit via CLI or API — Clerk's session-token template and per-user `publicMetadata` are Dashboard-only operations for dev instances, and `@clerk/testing` tokens are scoped narrowly enough that no programmatic migration path exists here. Resume on the signal in `<resume-signal>` after the in-browser smoke check confirms the new claim shape is live.</action>
  <verify>
    <automated>MISSING — manual verification only. After the operator types the resume-signal, the executor re-runs Task 1's automated verify command against the running app to confirm code/Dashboard parity, but the Dashboard edit itself has no automated check by design.</automated>
  </verify>
  <done>Operator confirms (via resume-signal) that the decoded `__session` cookie payload for the demo user shows `"metadata": {"roles": ["demo"]}`, the demo user reaches `/demo/orders` without redirect, and the norole user is redirected from `/demo/orders` to `/`.</done>
  <what-built>Tasks 1 and 2 have updated the type, runtime guards, tests, and runbooks to the plural `roles: Role[]` shape. The Clerk **dev instance** Dashboard is still on the old singular `role` shape — both the JWT custom template body and the test user's `publicMetadata`. Until you migrate the Dashboard, any signed-in session's `sessionClaims.metadata.roles` will be `undefined`, and `/demo/*` will redirect every user (including the demo user) to `/`.</what-built>
  <how-to-verify>
    This is one of the rare cases where Claude literally cannot complete the work via CLI/API — Clerk's session-token template and a user's `publicMetadata` are edited in the Clerk Dashboard UI, and `@clerk/testing`'s tokens are scoped to a dev instance so there is no production-grade automated migration path.

    Follow `docs/clerk-setup.md` end-to-end, but operating on the **already-existing** dev instance (do not create new users). Concretely:

    1. Open the Clerk Dashboard for the dev instance whose `pk_test_*` / `sk_test_*` keys live in `.env.local`.
    2. `Sessions → Customize session token`. Replace the template body with exactly:
       ```json
       {"metadata": {"roles": "{{user.public_metadata.roles}}"}}
       ```
       Save.
    3. `Users` → click the existing demo test user (`e2e-demo+clerk_test@example.com`) → `Metadata` → `Edit publicMetadata`. Replace `{"role": "demo"}` with:
       ```json
       {"roles": ["demo"]}
       ```
       Save.
    4. If the admin test user (`e2e-admin+clerk_test@example.com`) exists in this dev instance, repeat step 3 for them, replacing `{"role": "admin"}` with `{"roles": ["admin"]}`.
    5. Leave the norole user (`e2e-norole+clerk_test@example.com`) untouched — they continue to have no `publicMetadata.roles` field set (do not write `{"roles": []}` or `{"roles": null}`; leave the field absent).
    6. Sign out of any active dev-instance Clerk session in your browser. The session cookie carries the OLD claim shape until you sign back in.
    7. Sign back in as the demo user. Navigate to `/demo/orders` and confirm the page renders (no redirect to `/`).
    8. Open browser devtools, copy the `__session` cookie, decode it at `jwt.io`, and confirm the payload includes `"metadata": {"roles": ["demo"]}`. If you see `"metadata": {"role": "demo"}` (singular), step 2 didn't save — return to step 2.
    9. Sign out, sign in as the norole user, navigate to `/demo/orders`, confirm redirect to `/`.

    Once all of the above pass, the Dashboard and the code are in sync.
  </how-to-verify>
  <resume-signal>Type "dashboard migrated" (and optionally paste the decoded JWT payload showing `metadata.roles: ["demo"]`), or describe the failure mode if any of steps 7–9 didn't behave as expected.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Clerk Dashboard → JWT session token | Custom-template-string interpolation from `user.public_metadata.roles` into the signed session cookie. Untrusted to the extent that a misconfigured template can shadow legitimate role claims, but the template is operator-controlled, not user-controlled. |
| Browser cookie → Edge middleware | The `__session` cookie crosses into our trust zone at `clerkMiddleware`; Clerk verifies the signature before `sessionClaims` is populated. |
| Middleware → Server Component (`requireRole`) | Defense-in-depth: a second read of the same verified `sessionClaims` at the page-entry layer. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-260512-kfy-01 | Tampering | `src/middleware.ts` demo gate | mitigate | `roles.includes('demo')` reads from Clerk-signature-verified `sessionClaims` only; never from request body, query string, or header. Same trust posture as the pre-refactor `metadata.role` check (Phase 25 ACCESS-01). |
| T-260512-kfy-02 | Elevation of Privilege | `Array.prototype.includes` semantics for role checks | mitigate | Test case 4 in `auth.test.ts` (multi-role match) is the contract test that proves `roles: ['demo', 'admin']` grants both `'demo'` AND `'admin'`. Negative test case 5 (missing roles field) proves `metadata: {}` correctly fails the check (no implicit grant). |
| T-260512-kfy-03 | Information Disclosure | JWT custom-claim size | mitigate | `roles` is a `Role[]` over a 3-element union; max realistic array length is 3, well under Clerk's 1.2 KB custom-claim ceiling. The single-field template body (per docs/clerk-setup.md §1 Note) keeps total token size bounded. |
| T-260512-kfy-04 | Repudiation | Manual Dashboard migration | accept | Task 3 is a one-time operator-executed Dashboard edit. Auditability comes from git history of `docs/clerk-setup.md` (which the operator follows verbatim) plus the `jwt.io` decoded-payload check in Step 8 of the runbook. No automated audit log is in scope. |
| T-260512-kfy-05 | Denial of Service | Stale-cookie window during cutover | accept | After the Dashboard JWT template change, any browser holding a pre-cutover cookie sees `metadata.roles === undefined` and is redirected to `/`. Per the constraint that backward compatibility is NOT required and only one real test user exists, this is a tolerable seconds-long window resolved by sign-out/sign-in. The runbook step 6 makes this explicit. |
</threat_model>

<verification>
End-of-plan checks the executor runs before marking the plan complete:

1. `npm test -- --runInBand` → all suites green.
2. `npx tsc --noEmit` → zero errors. The `CustomJwtSessionClaims` type narrows correctly through `roles?: Role[]`.
3. `grep -rn "metadata\.role[^s]" src/` → zero hits. Singular field name is fully retired from runtime code.
4. `grep -rn "metadata\.roles" src/` → at least 4 hits (auth.ts, middleware.ts, clerkAuth.ts, plus tests).
5. `grep -n "metadata\.role[^s]" docs/clerk-setup.md docs/security-patterns.md` → zero hits outside comments. Both runbooks are fully plural.
6. After Task 3 checkpoint resumes: re-run step 7–9 of the runbook (demo user reaches `/demo/orders`, norole user redirects) as a manual smoke test from the developer's browser.

Optional but recommended:
- `npx playwright test --project=demo-user --project=norole-user` — confirms the E2E asymmetric route-protection suite still passes against the new Dashboard claim shape. If Playwright storage state was captured against the old `metadata.role` claim, delete `playwright/.clerk/*.json` so global.setup.ts re-signs each role and captures fresh cookies carrying `metadata.roles`.
</verification>

<success_criteria>
- `CustomJwtSessionClaims.metadata` field is `roles?: Role[]`; the singular `role` is removed.
- `requireRole` and the middleware demo gate both use `.includes(...)` membership against the `roles` array.
- `auth.test.ts` is 5 cases (the existing 3 plus the new multi-role-match and missing-roles-field cases) and is green.
- `middleware.test.ts` and `clerkAuth.test.ts` are green with assertions updated to the plural shape.
- `docs/clerk-setup.md` and `docs/security-patterns.md` reference `metadata.roles` / `publicMetadata.roles` throughout; the JWT template body and `publicMetadata` JSON examples reflect the array form.
- `npx tsc --noEmit` returns zero errors.
- After the manual Clerk Dashboard cutover (Task 3), the decoded `__session` cookie payload for the demo user shows `"metadata": {"roles": ["demo"]}`; demo user reaches `/demo/orders` without redirect; norole user is redirected from `/demo/orders` to `/`.
- No `Roles` alias / wrapper class / `Set`-based membership check is introduced.
- `Role` union type is unchanged.
- All Tasks 1 & 2 changes commit atomically per-task; tests pass after each commit.
</success_criteria>

<output>
After completion, create `.planning/quick/260512-kfy-refactor-user-role-to-roles/260512-kfy-01-SUMMARY.md` summarizing:
- Files changed (the 9 listed in `files_modified`).
- The before/after of `CustomJwtSessionClaims.metadata`.
- The 2 new test cases added to `auth.test.ts` and what they cover.
- A line documenting that the manual Clerk Dashboard cutover (Task 3) was performed and a paste of the decoded `__session` payload showing `"metadata": {"roles": ["demo"]}` (proof of cutover).
- Any drift discovered against the orchestrator's original brief (notably: the actual file is `src/lib/auth.ts` not `src/lib/server/role.ts`; the actual test count was 3 not 8; no `checkRole` exists in code today).
</output>
