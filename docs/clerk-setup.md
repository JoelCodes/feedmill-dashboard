# Clerk Dashboard Setup — Phase 27

This runbook reproduces the manual Clerk Dashboard configuration required for Phase 27 (role-based access control + E2E tests). All steps target a Clerk **development** instance (`pk_test_*` / `sk_test_*` keys); production instances reject `@clerk/testing` testing tokens, so the configuration here is only valid against a dev instance.

**Phase 31 extension (2026-05-12):** This runbook is extended for the new `mill_operator` edit role (CONTEXT.md D-12 / D-13 / D-14). Step 2 adds a new `e2e-mill-operator+clerk_test` test user; Step 3 updates the existing `e2e-demo` user to a dual-role `["demo", "mill_operator"]` assignment (the canonical multi-role coverage path); Step 4 reiterates the sign-out/sign-in propagation reminder for the demo-user metadata change (RESEARCH Pitfall 6); Step 5 adds the two new `E2E_MILL_OPERATOR_USER_{EMAIL,PASSWORD}` keys; Verification adds two new steps for the mill-operator user and the updated dual-role demo user. The Phase 27 JWT template, admin user, norole user, and existing verification steps are unchanged.

## Prerequisites

- Clerk dev-instance keys present in `.env.local` — see `.env.example` for the exact key names (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…`, `CLERK_SECRET_KEY=sk_test_…`).
- Dashboard admin access to the same Clerk instance whose keys are in `.env.local`.
- Acknowledgement that JWT template changes do NOT propagate to live sessions until users sign out and back in (per phase decision D-07). Plan accordingly if there are active dev sessions in the browser before you start.

## Step 1: Configure the JWT Template

1. Open the Clerk Dashboard for the dev instance.
2. Navigate to `Sessions → Customize session token`.
3. Edit the session token template. Replace the body with the exact JSON below:

```json
{"metadata": {"roles": "{{user.public_metadata.roles}}"}}
```

4. Save the template.

**Note:** Do NOT use the whole-object form `{"metadata": "{{user.public_metadata}}"}`. That shape (a) can exceed Clerk's 1.2 KB custom-claim ceiling for accounts that accrue arbitrary `publicMetadata` fields, and (b) does not match the `CustomJwtSessionClaims.metadata.roles` declaration in `src/types/clerk.d.ts`. The single-field template above selects only the `roles` array and keeps the token small.

### Migration note (one-time)

Any user with an existing `publicMetadata.role` string (singular) must have it manually replaced with `publicMetadata.roles: [<old value>]` in the Dashboard, AND the JWT template body must be replaced (as in step 3 above) before users sign back in. Only one test user exists in the dev Dashboard, so this is a single Dashboard edit. See Task 3 of `.planning/quick/260512-kfy-refactor-user-role-to-roles/260512-kfy-PLAN.md` for the operator execution checkpoint and exact step-by-step instructions.

## Step 2: Create Test Users

In the Clerk Dashboard, navigate to `Users → Add user`. Create the four users below. The `+clerk_test` mailbox suffix is Clerk's documented safe-mailbox marker — verification emails are not delivered to real inboxes when this suffix is present, which keeps dev/test cycles from leaking to real recipients.

| Email | Password | publicMetadata.roles |
|-------|----------|----------------------|
| `e2e-demo+clerk_test@example.com` | (set during creation, store in `.env.local` as `E2E_DEMO_USER_PASSWORD`) | `["demo", "mill_operator"]` |
| `e2e-norole+clerk_test@example.com` | (set during creation, store in `.env.local` as `E2E_NOROLE_USER_PASSWORD`) | _(not set)_ |
| `e2e-admin+clerk_test@example.com` | (set during creation, store in `.env.local` as `E2E_ADMIN_USER_PASSWORD`) | `["admin"]` |
| `e2e-mill-operator+clerk_test@example.com` | (set during creation, store in `.env.local` as `E2E_MILL_OPERATOR_USER_PASSWORD`) | `["mill_operator"]` |

**Note:** The `e2e-norole` row deliberately has no role assigned. This user proves the redirect-to-root behavior — an authenticated user with no `publicMetadata.roles` who tries `/demo/*` must be redirected to `/`.

**Phase 31 note (D-12 / D-13):** The `e2e-demo` row now carries BOTH `"demo"` AND `"mill_operator"` per D-13 — this is the canonical multi-role coverage path that verifies `Array.prototype.includes` membership semantics for users with more than one role. The new `e2e-mill-operator+clerk_test@example.com` user (D-12) is the mill-operator-only fixture used by the `auth-mill-operator` Playwright project (D-14) and the `e2e/mill-operator-smoke.spec.ts` smoke spec. Store the new user's email under `E2E_MILL_OPERATOR_USER_EMAIL` and password under `E2E_MILL_OPERATOR_USER_PASSWORD` in `.env.local` (full set of keys in Step 5).

## Step 3: Assign publicMetadata.roles

For each user that needs a role (demo, admin, mill-operator), follow the same procedure:

1. `Users → click the user → Metadata → Edit publicMetadata`.
2. Replace the metadata JSON with the exact shape below.
3. Save.

For the demo user — the demo user gets BOTH `demo` AND `mill_operator` roles per Phase 31 D-13. This is the canonical multi-role coverage path:

```json
{"roles": ["demo", "mill_operator"]}
```

For the admin user, use:

```json
{"roles": ["admin"]}
```

For the new mill-operator-only user (Phase 31 D-12) — this fixture exercises a user whose roles array contains only `mill_operator` (no demo access), used by the `auth-mill-operator` Playwright project (D-14):

```json
{"roles": ["mill_operator"]}
```

**Note:** Leave the `e2e-norole+clerk_test@example.com` user with no `publicMetadata.roles` set. Do not write `{"roles": null}` or `{"roles": []}` — leave the field absent entirely.

## Step 4: Sign-Out/Sign-In Propagation

Any user with an active session at the moment the template (Step 1) or role assignment (Step 3) changes will keep using the old session token until they sign out and sign back in. There is no programmatic session revocation in this phase.

After completing Steps 1–3, sign out of any active Clerk dev session in the browser and sign back in to refresh the cookie. Then verify (via Step 6 / Verification) that the new claim is present.

**Phase 31 reminder (RESEARCH Pitfall 6, tied to D-13):** Because Step 3 updates the EXISTING `e2e-demo` user's `publicMetadata` (from `["demo"]` to `["demo", "mill_operator"]`), any active dev session for that user must sign out and sign back in to refresh the JWT — otherwise `checkRole('mill_operator')` returns false against a stale token and the user sees `Read-only mode` on `/` instead of `Edit mode`. The warning sign is the decoded `__session` cookie at jwt.io still showing `metadata.roles: ["demo"]` after editing publicMetadata to the dual-role form. Sign out, sign back in, decode again, and confirm the new dual-role claim is present before running any E2E verification.

## Step 5: Populate .env.local

Copy the eight `E2E_*` keys from `.env.example` into `.env.local` and fill in the password values you set in Step 2. The expected keys are:

```bash
E2E_DEMO_USER_EMAIL=e2e-demo+clerk_test@example.com
E2E_DEMO_USER_PASSWORD=<the password you set for the demo user>
E2E_NOROLE_USER_EMAIL=e2e-norole+clerk_test@example.com
E2E_NOROLE_USER_PASSWORD=<the password you set for the norole user>
E2E_ADMIN_USER_EMAIL=e2e-admin+clerk_test@example.com
E2E_ADMIN_USER_PASSWORD=<the password you set for the admin user>
E2E_MILL_OPERATOR_USER_EMAIL=e2e-mill-operator+clerk_test@example.com
E2E_MILL_OPERATOR_USER_PASSWORD=<the password you set for the mill_operator user>
```

`.env.local` is gitignored and must not be committed. Only `.env.example` (with empty password placeholders) is committed.

## Verification

Run this short manual smoke check before Plan 05 (E2E) runs:

1. Sign in as `e2e-demo+clerk_test@example.com` and navigate to `/demo/orders`. Expect the page to render.
2. Sign in as `e2e-norole+clerk_test@example.com` and navigate to `/demo/orders`. Expect a redirect to `/`.
3. Open browser devtools, copy the `__session` cookie value, and decode it at jwt.io. Confirm the payload contains `"metadata": {"roles": ["demo", "mill_operator"]}` for the demo user (post-D-13) and `"metadata": {"roles": ["admin"]}` for the admin user. The norole user's decoded token should have `metadata` absent or `metadata.roles` absent.
4. **Phase 31 — mill-operator-only user (D-12):** Sign in as `e2e-mill-operator+clerk_test@example.com`, navigate to `/`. Expect the page to render with the `Edit mode (mill_operator)` indicator (the `<MillReadOnlyStub>` mode <p> carries `data-mode="edit"`). Decode the `__session` cookie at jwt.io and confirm `"metadata": {"roles": ["mill_operator"]}` is present.
5. **Phase 31 — dual-role demo user (D-13):** Sign in as the updated `e2e-demo+clerk_test@example.com` (after dual-role assignment per Step 3), navigate to `/`. Expect the `Edit mode (mill_operator)` indicator because the demo user now has BOTH `demo` and `mill_operator`. Decode the JWT and confirm `"metadata": {"roles": ["demo", "mill_operator"]}` is present — this is the canonical multi-role coverage path per D-13. If the decoded token still shows the old single-role `["demo"]`, re-read Step 4's Phase 31 reminder and complete the sign-out/sign-in propagation step.

If any of these checks fail, return to Step 1 and confirm the JWT template is exactly as shown, then sign out and sign back in.

## Order of Operations Warning

The critical sequence is:

1. JWT template (Step 1) — MUST be saved first.
2. Role assignment (Step 3) — only meaningful after Step 1 is live.
3. Sign-out/sign-in (Step 4) — MUST follow role assignment.

Deviating from this order leaves the user's session cookie stuck with a stale or missing `metadata.roles` claim, which presents as "demo user is redirected to /" or "decoded JWT has no metadata field". Cross-reference the Phase 27 RESEARCH document Pitfall 2 if you hit this symptom.
