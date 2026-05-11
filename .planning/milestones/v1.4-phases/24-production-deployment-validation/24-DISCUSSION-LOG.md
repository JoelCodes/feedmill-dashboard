# Phase 24: Production Deployment Validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 24-production-deployment-validation
**Areas discussed:** Deployment target, Environment setup, Domain verification, Validation scope

---

## Deployment Target

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel (Recommended) | Native Next.js support, automatic env var management per environment, built-in preview deployments | ✓ |
| Railway/Render | Container-based hosting, manual env var configuration, simpler pricing | |
| Self-hosted | Your own infrastructure (VPS, K8s), full control but more setup | |

**User's choice:** Vercel (Recommended)
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Already deployed | Project exists in Vercel, need to add production Clerk keys | ✓ |
| New deployment | Need to create Vercel project and configure everything fresh | |

**User's choice:** Already deployed
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, previews use dev keys | Preview deployments have pk_test_/sk_test_ configured, production will use pk_live_/sk_live_ | |
| No keys configured yet | Vercel project exists but no Clerk env vars set up for any environment | ✓ |
| Not sure | Need to check Vercel dashboard to see current env var setup | |

**User's choice:** No keys configured yet
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Personal account | Hobby/Pro tier under your own account | ✓ |
| Team account | Organization with potentially multiple members who need access | |

**User's choice:** Personal account
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Default Vercel subdomain | Using auto-generated *.vercel.app URL | ✓ |
| Custom domain set | Already have a custom domain like app.example.com configured | |

**User's choice:** Default Vercel subdomain
**Notes:** None

---

## Environment Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Same Clerk app, both key types | One Clerk application with both dev (pk_test_) and production (pk_live_) keys — simpler, shared user pool | ✓ |
| Separate Clerk apps | Different Clerk applications for dev vs production — isolated user pools, more setup | |

**User's choice:** Same Clerk app, both key types
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Production: live keys only | Production uses pk_live_/sk_live_, preview and dev use pk_test_/sk_test_ (best practice) | ✓ |
| All environments: dev keys | Use test keys everywhere for now, switch to live keys later (simpler but delays prod validation) | |

**User's choice:** Production: live keys only
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, have them | Live keys are already generated in Clerk dashboard, ready to configure | ✓ |
| No, need to generate | Haven't created production instance yet, need steps to generate live keys | |

**User's choice:** Yes, have them
**Notes:** None

---

## Domain Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel subdomain only | Associate *.vercel.app domain with Clerk production instance (sufficient for now) | ✓ |
| Custom domain later | Start with Vercel subdomain, add custom domain in a future phase when acquired | |

**User's choice:** Vercel subdomain only
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Use Clerk-hosted pages | Let Clerk redirect to clerk.accounts.dev URLs for sign-in (simpler, no domain verification needed) | |
| Self-hosted sign-in pages | Use /sign-in on your domain — requires adding Vercel domain to Clerk's allowed origins | ✓ |

**User's choice:** Self-hosted sign-in pages
**Notes:** None

---

## Validation Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Manual smoke test | Manually sign in on production URL, verify header shows user, sign out works | |
| Automated E2E on prod | Run Playwright tests against production URL with a test account | |
| Both manual and automated | Manual first, then set up automated smoke tests for ongoing monitoring | ✓ |

**User's choice:** Both manual and automated
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Create dedicated test user | Create a specific test@example.com user in Clerk for automated tests | ✓ |
| Use existing user | Use your own account for prod tests (simpler, but mixes test/real data) | |

**User's choice:** Create dedicated test user
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| On-demand only | Run manually when validating deploys — simpler, no CI setup needed | |
| CI on deploy | Run after each production deploy — catches regressions automatically | ✓ |

**User's choice:** CI on deploy
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions (Recommended) | Native integration with GitHub, free minutes, Vercel webhook triggers available | ✓ |
| Vercel Checks | Use Vercel's built-in checks integration — tighter coupling with deploys | |

**User's choice:** GitHub Actions (Recommended)
**Notes:** None

---

## Claude's Discretion

None — all decisions received explicit user input.

## Deferred Ideas

None — discussion stayed within phase scope.
