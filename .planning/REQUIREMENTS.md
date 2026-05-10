# Requirements: CGM Dashboard

**Defined:** 2026-05-09
**Core Value:** Operations staff can see and manage feed orders in real-time, from pending through delivery.

## v1.4 Requirements

Requirements for authentication layer. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can sign in with email and password
- [ ] **AUTH-02**: User can sign out from any page
- [x] **AUTH-03**: User session persists across browser refresh

### Route Protection

- [ ] **PROT-01**: Unauthenticated users are redirected to sign-in page
- [ ] **PROT-02**: All dashboard pages require authentication (orders, customers, mill production, settings)
- [x] **PROT-03**: Sign-in page is accessible without authentication

### User Experience

- [ ] **UX-01**: Header displays signed-in user's name or email
- [ ] **UX-02**: Header includes sign-out action
- [ ] **UX-03**: Auth UI respects current theme (light/dark)

## Future Requirements

Deferred to v1.5+. Tracked but not in current roadmap.

### Authentication Expansion

- **AUTH-04**: User can sign up with email and password
- **AUTH-05**: User receives email verification after signup
- **AUTH-06**: User can reset password via email link

### Advanced Auth

- **ADV-01**: Social login (Google, Microsoft)
- **ADV-02**: Multi-factor authentication (MFA)
- **ADV-03**: User profile management (change password, update email)

### Organizations

- **ORG-01**: Support for multiple organizations (mills)
- **ORG-02**: Role-based access control (admin, operator, viewer)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Custom auth UI | Prebuilt Clerk components reduce complexity and security risk |
| Passwordless magic links | Paradigm shift requiring user education |
| WebAuthn/Passkeys | Emerging standard, browser support maturing |
| User data sync to database | No user-specific data needed yet; Clerk stores all user info |
| Custom email templates | Default Clerk emails functional for MVP |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 20 | Complete |
| AUTH-02 | Phase 23 | Pending |
| AUTH-03 | Phase 20 | Complete |
| PROT-01 | Phase 21 | Pending |
| PROT-02 | Phase 21 | Pending |
| PROT-03 | Phase 20 | Complete |
| UX-01 | Phase 23 | Pending |
| UX-02 | Phase 23 | Pending |
| UX-03 | Phase 23 | Pending |

**Coverage:**
- v1.4 requirements: 9 total
- Mapped to phases: 9/9 (100%)
- Unmapped: 0

**Phase breakdown:**
- Phase 20 (Clerk Foundation Setup): AUTH-01, AUTH-03, PROT-03 (3 requirements)
- Phase 21 (Route Protection): PROT-01, PROT-02 (2 requirements)
- Phase 22 (Auth Page Design): 0 requirements (design phase)
- Phase 23 (User Experience Integration): UX-01, UX-02, UX-03, AUTH-02 (4 requirements)
- Phase 24 (Production Deployment Validation): 0 requirements (validation phase)

---
*Requirements defined: 2026-05-09*
*Last updated: 2026-05-09 after roadmap creation*
