# Feature Research

**Domain:** Clerk Authentication for Next.js Dashboard
**Researched:** 2026-05-09
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Email + Password Sign-Up | Standard authentication method, baseline expectation | LOW | Clerk provides `useSignUp()` hook with built-in email verification flow |
| Email + Password Sign-In | Standard authentication method, baseline expectation | LOW | Clerk provides `useSignIn()` hook with password strategy |
| Email Verification | Security best practice, prevents fake accounts | LOW | Automatically handled by Clerk via `sendEmailCode()` and `verifyEmailCode()` |
| Password Reset / Forgot Password | Users forget passwords regularly | LOW | Built-in flow: `sendResetPasswordEmailCode()` → `verifyCode()` → `resetPassword()` |
| Sign Out | Users need to end their session | LOW | Simple `signOut()` method with optional redirect URL |
| Route Protection (Middleware) | Protect dashboard pages from unauthenticated access | LOW | `clerkMiddleware()` with `auth.protect()` auto-redirects to sign-in |
| User Display in Header | Users need to see who's logged in | LOW | `<UserButton />` component shows avatar, name, sign-out option |
| Session Management | Maintain authentication state across pages | LOW | Automatic with Next.js Server Components via `auth()` helper |
| Prebuilt UI Components | Don't rebuild sign-in/sign-up forms from scratch | LOW | `<SignIn />`, `<SignUp />`, `<UserButton />` components included |
| Dark/Light Theme Support | Modern expectation for dashboard apps | LOW | Clerk components support `appearance.theme` prop with built-in themes |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-Factor Authentication (MFA) | Enhanced security, compliance requirement for some industries | MEDIUM | SMS codes, TOTP (authenticator apps), email codes, backup codes all supported |
| Social OAuth (Google, Microsoft, GitHub) | Faster sign-up, reduces password fatigue | MEDIUM | 20+ providers supported including Google, Microsoft, GitHub, Facebook, LinkedIn |
| Passwordless (Magic Links) | Better UX, no password to remember/reset | LOW | Email magic links supported via `signInWithEmailLink()` |
| Session Token for API Auth | Enables authenticated requests to backend APIs | LOW | `getToken()` returns JWT for Authorization header |
| User Profile Management | Self-service account management reduces support burden | LOW | `<UserProfile />` component handles password change, email update, delete account |
| Custom JWT Templates | Add custom claims for RBAC/permissions | MEDIUM | Define custom fields in Clerk Dashboard, access via token claims |
| Webhooks for Data Sync | Keep user data in sync with your database | MEDIUM | Events: `user.created`, `user.updated`, `user.deleted`, `session.created` |
| Organizations/Teams | Multi-tenant B2B apps where users belong to teams | HIGH | Full RBAC with roles, permissions, invitations, member management |
| Appearance Customization | Match auth UI to existing dashboard design | LOW | `appearance` prop accepts theme variables, custom CSS, element overrides |
| Compromised Password Detection | Prevent use of leaked passwords (security) | LOW | Automatic check during sign-in, falls back to email code if detected |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Custom Auth UI from Scratch | Full design control, unique branding | Reinventing the wheel, security vulnerabilities, maintenance burden, email delivery issues | Use Clerk's prebuilt components with `appearance` customization — supports theme variables, custom CSS, and element-level styling |
| SMS-Only 2FA | "Everyone knows SMS" | NIST deprecated due to SIM swap attacks, SMS delivery unreliable internationally, carrier costs | Offer TOTP (authenticator apps) as primary MFA, SMS as optional fallback |
| Storing Passwords Yourself | "We want full control" | Massive security liability, compliance nightmare (GDPR, SOC 2), credential leak risk | Let Clerk handle password storage — they're SOC 2 Type II certified |
| Username-Only Login (No Email) | "Simpler sign-up" | No password reset mechanism, no way to contact user, account recovery impossible | Require email as identifier — username can be optional display name |
| Infinite Session Duration | "Don't make users re-login" | Security risk (stolen device = permanent access), compliance violation, stale permissions | Use Clerk's auto-refresh tokens (60s default) with reasonable session expiry |
| Account Enumeration in Login Errors | "Tell users if email exists" | Security vulnerability — attackers can discover valid accounts | Show generic error "Invalid email or password" for both cases |
| Rolling Your Own OAuth | "We only need Google login, how hard can it be?" | OAuth spec complexity, token refresh logic, security edge cases, ongoing maintenance | Use Clerk's OAuth — handles token refresh, security, 20+ providers out-of-box |

## Feature Dependencies

```
Route Protection
    └──requires──> ClerkProvider Setup
                       └──requires──> API Keys Configured

Email + Password Sign-In
    └──requires──> Sign-Up Flow (users must register first)
                       └──requires──> Email Verification

Password Reset
    └──requires──> Email Verification System

MFA (TOTP/SMS)
    └──requires──> Email + Password Auth (can't enable MFA without primary auth)

Organizations/Teams
    └──requires──> User Authentication
                       └──enhances──> Route Protection (can protect by role/permission)

Webhooks
    └──enhances──> Database Sync (optional, but needed to store user data locally)

Social OAuth
    └──conflicts──> Password Requirements (users signing in via Google don't have passwords)

Custom JWT Templates
    └──requires──> API Token Strategy (used when calling backend APIs)
```

### Dependency Notes

- **Route Protection requires ClerkProvider:** Middleware and `auth()` helpers won't work without ClerkProvider wrapping the app
- **Sign-In requires Sign-Up first:** New users can't sign in until they've completed registration
- **Email Verification required for Password Reset:** Can't send reset code without verified email
- **MFA enhances Email + Password Auth:** MFA is a second factor, requires primary authentication method
- **Organizations enhance Route Protection:** Can protect routes by role (`org:admin`) or permission
- **Social OAuth conflicts with Password Requirements:** Google/Microsoft users don't have passwords — handle this edge case in password change UI
- **Webhooks enhance Database Sync:** If you need user data in your DB (e.g., for foreign keys in orders table), use webhooks to sync `user.created` events

## MVP Definition

### Launch With (v1.4)

Minimum viable authentication — what's needed to protect the dashboard.

- [x] **ClerkProvider Setup** — Wrap app in `<ClerkProvider>`, configure API keys
- [x] **Route Protection (Middleware)** — Protect all dashboard pages, redirect to sign-in if unauthenticated
- [x] **Email + Password Sign-Up** — Users can create accounts with email verification
- [x] **Email + Password Sign-In** — Returning users can sign in with credentials
- [x] **Sign Out** — Users can end their session
- [x] **User Display in Header** — Show logged-in user's name/avatar with `<UserButton />`
- [x] **Prebuilt UI Components** — Use Clerk's `<SignIn />` and `<SignUp />` for forms
- [x] **Password Reset Flow** — Forgot password with email verification code

**Rationale:** These features establish basic authentication security. Without them, the dashboard is completely open. This set is the minimum to answer "Is this user allowed to see this data?"

### Add After Validation (v1.5+)

Features to add once core authentication is working.

- [ ] **MFA (TOTP/Email Codes)** — After launch, if customers request enhanced security or compliance requires it
- [ ] **Social OAuth (Google/Microsoft)** — If user feedback shows friction with email sign-up, add 1-click social login
- [ ] **User Profile Management** — Allow users to change password, update email without admin help (reduces support burden)
- [ ] **Appearance Customization** — Match auth UI to dashboard design tokens (colors, fonts, spacing)
- [ ] **Session Token for API Auth** — If adding backend API routes that need authentication
- [ ] **Webhooks for User Sync** — If storing user data in database (e.g., `users` table for foreign keys)

**Trigger conditions:**
- MFA: Customer request or compliance requirement (SOC 2, HIPAA)
- Social OAuth: User feedback citing sign-up friction
- User Profile: Support tickets about password/email changes
- Appearance: Visual design review shows auth UI doesn't match dashboard
- Session Token: Backend API routes requiring authenticated requests
- Webhooks: Need to associate users with orders/customers in database

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Organizations/Teams** — If building multi-tenant B2B (multiple mills, each with their own users)
- [ ] **Custom JWT Templates** — If implementing granular RBAC (roles: admin, operator, viewer)
- [ ] **Advanced MFA (WebAuthn/Passkeys)** — Emerging standard, not yet widely adopted
- [ ] **Passwordless Magic Links** — Replaces passwords entirely, requires user education
- [ ] **Custom Email Templates** — Rebrand verification emails, requires design and copy work
- [ ] **Rate Limiting Customization** — Default limits sufficient for most apps, only tune under load

**Why defer:**
- Organizations: Major feature, only needed if going multi-tenant
- Custom JWT: Complexity overkill until RBAC requirements are validated
- WebAuthn: Cutting edge, browser support still maturing
- Passwordless: Paradigm shift, requires user behavior change
- Email Templates: Nice-to-have, default Clerk emails functional
- Rate Limiting: Premature optimization, defaults handle normal traffic

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Route Protection | HIGH (security baseline) | LOW (middleware config) | P1 |
| Email + Password Sign-In/Up | HIGH (table stakes) | LOW (prebuilt components) | P1 |
| Sign Out | HIGH (users need to logout) | LOW (single function call) | P1 |
| User Display in Header | HIGH (show who's logged in) | LOW (drop-in component) | P1 |
| Password Reset | HIGH (users forget passwords) | LOW (built-in flow) | P1 |
| Email Verification | HIGH (security, prevents spam) | LOW (automatic with sign-up) | P1 |
| Session Management | HIGH (maintain auth state) | LOW (automatic with Next.js) | P1 |
| User Profile Management | MEDIUM (self-service UX) | LOW (prebuilt component) | P2 |
| Appearance Customization | MEDIUM (visual consistency) | LOW (CSS props) | P2 |
| MFA (TOTP/SMS) | MEDIUM (enhanced security) | MEDIUM (setup + UX flows) | P2 |
| Social OAuth (Google/Microsoft) | MEDIUM (UX convenience) | MEDIUM (provider config) | P2 |
| Session Token for API Auth | MEDIUM (enables API calls) | LOW (getToken() helper) | P2 |
| Webhooks for User Sync | MEDIUM (database integration) | MEDIUM (endpoint + verification) | P2 |
| Organizations/Teams | LOW (future multi-tenant) | HIGH (major feature) | P3 |
| Custom JWT Templates | LOW (advanced RBAC) | MEDIUM (config + testing) | P3 |
| Passwordless Magic Links | LOW (niche preference) | LOW (alternative sign-in strategy) | P3 |
| Advanced MFA (WebAuthn) | LOW (emerging standard) | HIGH (browser compat + UX) | P3 |
| Custom Email Templates | LOW (branding polish) | MEDIUM (design + copywriting) | P3 |

**Priority key:**
- P1: Must have for launch (v1.4) — security baseline, table stakes
- P2: Should have, add when possible (v1.5+) — UX improvements, common requests
- P3: Nice to have, future consideration (v2+) — advanced features, edge cases

## Integration Patterns

### Next.js 15 App Router Integration

Clerk is purpose-built for Next.js with first-class App Router support:

| Integration Point | How It Works | Complexity |
|------------------|--------------|------------|
| Server Components | `auth()` helper returns `{ userId, sessionId }` for server-side auth checks | LOW |
| Client Components | `useAuth()`, `useUser()` hooks provide reactive auth state | LOW |
| Middleware | `clerkMiddleware()` protects routes at the edge before page render | LOW |
| API Routes | `auth()` in route handlers authenticates API requests | LOW |
| Layouts | `<ClerkProvider>` wraps app in root layout, provides context | LOW |

**Code Example (Minimal Setup):**

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}

// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)']
}

// app/page.tsx (Server Component)
import { auth } from '@clerk/nextjs/server'

export default async function Home() {
  const { userId } = await auth()
  return <div>Welcome, user {userId}</div>
}

// components/Header.tsx (Client Component)
'use client'
import { UserButton, SignInButton, Show } from '@clerk/nextjs'

export function Header() {
  return (
    <header>
      <Show when="signed-out">
        <SignInButton />
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </header>
  )
}
```

### Existing Dashboard Integration Points

Based on PROJECT.md, the CGM Dashboard has these existing features:

| Existing Feature | Auth Integration | Notes |
|-----------------|------------------|-------|
| Orders Table | Filter by user's mill/permissions | Could add `userId` to order data via webhooks, filter by org membership |
| Customer List | Filter by user's assigned customers | Could add `userId` to customer records, implement RBAC |
| Settings Page | Per-user preferences | Could store theme/density in Clerk user metadata instead of localStorage |
| Header | User display + sign-out | Replace mock user with `<UserButton showName />` component |
| Navigation | Public vs authenticated routes | Use middleware to protect `/orders`, `/customers`, `/settings`, allow `/sign-in` |

**Migration strategy:**
1. Add ClerkProvider to root layout
2. Add middleware to protect all routes except `/sign-in`, `/sign-up`
3. Replace header mock user with `<UserButton />`
4. Create `/sign-in` and `/sign-up` routes with Clerk components
5. Test: unauthenticated users redirected to sign-in
6. Test: signed-in users can access dashboard

## Competitive Comparison

| Feature | Clerk | Auth0 | NextAuth.js |
|---------|-------|-------|-------------|
| Prebuilt React Components | ✅ `<SignIn />`, `<UserButton />` | ⚠️ SDK, not components | ❌ DIY forms |
| Next.js 15 App Router Support | ✅ Native, first-class | ⚠️ Works, not optimized | ✅ Native |
| Email + Password Auth | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| Social OAuth Providers | ✅ 20+ providers | ✅ 30+ providers | ✅ 40+ providers |
| MFA (TOTP/SMS/Email) | ✅ All methods | ✅ All methods + biometrics | ❌ Custom implementation |
| Organizations/Teams | ✅ Native RBAC | ✅ Advanced RBAC | ❌ Custom implementation |
| Webhooks | ✅ User events | ✅ Extensive events | ❌ Not applicable |
| Pricing (10K MAU) | $25/mo | $240/mo (15x more) | Free (self-hosted costs) |
| Setup Time | 5-10 minutes | 30-60 minutes | 60-120 minutes |
| Customization | Theme + CSS | Full control | Full control |
| Session Management | Auto-refresh (60s) | Custom config | Custom config |
| Compliance | SOC 2 Type II | SOC 2, HIPAA, ISO 27001 | Self-managed |

**Verdict for CGM Dashboard (v1.4):**
- **Choose Clerk** — Best fit for Next.js 15, prebuilt components match "Design → Infrastructure → Build" approach, fast setup aligns with milestone velocity
- **Not Auth0** — Overkill for single-tenant dashboard, 15x more expensive, enterprise features not needed
- **Not NextAuth.js** — Requires building UI from scratch, defeats purpose of using prebuilt components, more maintenance burden

*Sources:*
- [Clerk vs Auth0 for Next.js](https://clerk.com/articles/clerk-vs-auth0-for-nextjs)
- [Full-Stack Authentication Comparison](https://www.c-sharpcorner.com/article/full-stack-authentication-clerk-vs-auth0-vs-nextauth-compared/)
- [Next.js Authentication Showdown 2025](https://medium.com/@sagarsangwan/next-js-authentication-showdown-nextauth-free-databases-vs-clerk-vs-auth0-in-2025-e40b3e8b0c45)

## Production Considerations

### Rate Limits

Clerk enforces rate limits to prevent abuse:

| Endpoint | Limit (Development) | Limit (Production) | Scope |
|----------|-------------------|-------------------|-------|
| Backend API (general) | 100 req/10s | 1000 req/10s | Per Secret Key |
| Frontend Sign-In Create | 5 req/10s | 5 req/10s | Per IP address |
| Frontend Sign-In Attempt | 3 req/10s | 3 req/10s | Per IP address |
| Frontend Sign-Up Create | 5 req/10s | 5 req/10s | Per IP address |
| Invitations (single) | 100 req/hour | 100 req/hour | Per instance |
| Organization Invitations | 250 req/hour | 250 req/hour | Per org |

**Implications for CGM Dashboard:**
- Normal login traffic won't hit limits (5 sign-ins per 10s = 1800/hour)
- Backend API calls for user lookup in routes covered by 1000/10s limit
- If adding organization invitations (future), batch endpoint limited to 50/hour

*Source: [Clerk System Limits](https://github.com/clerk/clerk-docs/blob/main/docs/guides/how-clerk-works/system-limits.mdx)*

### Environment Management

Clerk uses separate Development and Production instances:

| Instance Type | Purpose | Rate Limits | Security |
|--------------|---------|-------------|----------|
| Development | Local/staging testing | 100 req/10s | Relaxed (localhost allowed) |
| Production | Live app | 1000 req/10s | Strict (must associate production domain) |

**Common deployment mistake:** Forgetting to change API keys from development to production keys. Use environment variables:

```bash
# .env.local (development)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# .env.production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
```

*Source: [Deploying to Production](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/deployment/production.mdx)*

### Security Best Practices

Based on industry research and Clerk documentation:

| Practice | Why | How (Clerk) |
|----------|-----|-------------|
| Email Verification Required | Prevents fake accounts, spam | Automatic in Clerk sign-up flow |
| Password Minimum 12 Characters | Balances security and usability (NIST guidance) | Configure in Clerk Dashboard → User & Authentication → Email, Phone, Username → Password settings |
| No Password Reuse Across Sites | One breach compromises all accounts | Educate users, consider password manager integration |
| Compromised Password Detection | Prevent leaked passwords from breaches | Automatic in Clerk, falls back to email code |
| MFA for Admin/Sensitive Actions | Defense against credential theft | Enable MFA strategies in Dashboard |
| Generic Login Error Messages | Prevent account enumeration | Clerk returns generic "Invalid credentials" |
| Session Auto-Refresh | Balance security and UX | Clerk refreshes JWT every 60s automatically |
| No Credentials in Logs | Prevent leak via log aggregation | Clerk handles auth, never log passwords/tokens in app code |
| HTTPS Only in Production | Prevent MITM attacks on credentials | Clerk enforces HTTPS for production domains |

*Sources:*
- [Google Cloud Account Authentication Best Practices](https://cloud.google.com/blog/products/identity-security/account-authentication-and-password-management-best-practices)
- [Password Reset Best Practices (Authgear)](https://www.authgear.com/post/authentication-security-password-reset-best-practices-and-more/)
- [Password Management Best Practices (LoginRadius)](https://www.loginradius.com/blog/identity/password-management-best-practices)

## Sources

### High Confidence (Context7 + Official Docs)
- [Clerk Documentation (Context7)](https://context7.com/clerk/clerk-docs/llms.txt) — Primary source for all Clerk features
- [Clerk Email/Password Authentication Flow](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/custom-flows/authentication/email-password.mdx)
- [Clerk Next.js Middleware Reference](https://github.com/clerk/clerk-docs/blob/main/docs/reference/nextjs/clerk-middleware.mdx)
- [Clerk useAuth() Hook Documentation](https://github.com/clerk/clerk-docs/blob/main/docs/_partials/hooks/use-auth.mdx)
- [Clerk Multi-Factor Authentication Guide](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/custom-flows/authentication/multi-factor-authentication.mdx)
- [Clerk Organizations Overview](https://github.com/clerk/clerk-docs/blob/main/docs/guides/organizations/overview.mdx)
- [Clerk Webhooks Sync Guide](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/webhooks/syncing.mdx)
- [Clerk System Limits](https://github.com/clerk/clerk-docs/blob/main/docs/guides/how-clerk-works/system-limits.mdx)
- [Clerk Production Deployment](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/deployment/production.mdx)

### Medium Confidence (Web Search with Multiple Sources)
- [Clerk vs Auth0 for Next.js](https://clerk.com/articles/clerk-vs-auth0-for-nextjs)
- [Full-Stack Authentication: Clerk vs Auth0 vs NextAuth Compared](https://www.c-sharpcorner.com/article/full-stack-authentication-clerk-vs-auth0-vs-nextauth-compared/)
- [Next.js Authentication Showdown 2025](https://medium.com/@sagarsangwan/next-js-authentication-showdown-nextauth-free-databases-vs-clerk-vs-auth0-in-2025-e40b3e8b0c45)
- [Account Authentication Best Practices (Google Cloud)](https://cloud.google.com/blog/products/identity-security/account-authentication-and-password-management-best-practices)
- [Password Reset Best Practices (Authgear)](https://www.authgear.com/post/authentication-security-password-reset-best-practices-and-more/)
- [Password Management Best Practices (LoginRadius)](https://www.loginradius.com/blog/identity/password-management-best-practices)

---
*Feature research for: Clerk Authentication for Next.js Dashboard*
*Researched: 2026-05-09*
