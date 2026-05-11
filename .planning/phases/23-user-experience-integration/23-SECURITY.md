---
phase: 23
slug: user-experience-integration
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-10
---

# Phase 23 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Clerk SDK to Dashboard | Auth state flows from Clerk servers; dashboard trusts Clerk session validation | User identity, session tokens |
| UserButton to Clerk API | Sign-out action calls Clerk API to invalidate session server-side | Session invalidation request |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-23-01 | Spoofing | UserButton display | mitigate | Clerk validates session server-side via ClerkProvider; no client-side user data storage | closed |
| T-23-02 | Tampering | Sign-out redirect | accept | afterSignOutUrl is client-side preference; middleware `auth.protect()` protects routes regardless of redirect target | closed |
| T-23-03 | Information Disclosure | User name/email | accept | User's own data displayed to authenticated user; no sensitive data exposure | closed |
| T-23-04 | Denial of Service | ClerkLoaded wrapper | mitigate | ClerkLoading with UserButtonSkeleton fallback ensures UI usable if Clerk SDK slow to initialize | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-23-01 | T-23-02 | Sign-out redirect URL is a UX preference, not a security control. Route protection is enforced by Clerk middleware regardless of redirect destination. | Plan author | 2026-05-10 |
| AR-23-02 | T-23-03 | Displaying user's own name/email to themselves is expected behavior; no sensitive data of other users exposed. | Plan author | 2026-05-10 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-10 | 4 | 4 | 0 | gsd-secure-phase |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-10
