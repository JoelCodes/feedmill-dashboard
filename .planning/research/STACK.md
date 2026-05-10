# Stack Research

**Domain:** Authentication for Next.js 15 App Router with Clerk
**Researched:** 2026-05-09
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @clerk/nextjs | ^7.3.3 | Authentication library for Next.js | Official Clerk SDK for Next.js 15+ with App Router support, provides middleware, server components helpers (auth(), currentUser()), prebuilt UI components (SignIn, SignUp, UserButton), and seamless integration with Next.js server/client architecture |
| Next.js | 16.1.6 (existing) | Web framework | Already in use, compatible with @clerk/nextjs 7.3.3 (requires >=15.2.3) |
| React | 19.2.3 (existing) | UI library | Already in use, compatible with @clerk/nextjs 7.3.3 |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @clerk/ui/themes | Included in @clerk/nextjs | Pre-built theme presets (dark, neobrutalism, etc.) | OPTIONAL - Only if customizing Clerk component appearance beyond default theme; not needed if using default styling |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Clerk Dashboard | API key management, authentication settings | Required for obtaining publishable key and secret key; configure email/password authentication strategy |
| .env.local | Environment variable storage | CRITICAL - Store NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY; never commit to git |

## Installation

```bash
# Core (ONLY package needed)
npm install @clerk/nextjs
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Clerk | NextAuth.js (Auth.js) | When you need OAuth-only (Google, GitHub) without user management UI, or want full control over database schema and session storage |
| Clerk | Supabase Auth | When already using Supabase for database and want unified backend; trade-off: less polished UI components |
| Clerk | Custom auth (JWT + bcrypt) | NEVER for production - significant security risks, maintenance burden, and feature gaps (password reset, email verification, session management) |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @clerk/clerk-react | Wrong package for Next.js | @clerk/nextjs (Next.js-specific with middleware and server helpers) |
| Custom sign-in forms (Clerk Elements) for MVP | Unnecessary complexity, more code to maintain | Prebuilt <SignIn /> and <SignUp /> components (faster, less code, automatically styled) |
| @clerk/types | Already included in @clerk/nextjs | No separate installation needed - types are bundled |
| Hardcoded API keys in code | Security vulnerability, leaked in git | Environment variables (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY) |

## Stack Patterns by Variant

**For Email + Password Authentication (v1.4 requirement):**
- Use Clerk Dashboard to enable Email authentication strategy
- Use Password authentication strategy (enabled by default)
- Use prebuilt `<SignIn />` and `<SignUp />` components (no custom forms needed)
- Redirects handled automatically by Clerk middleware

**For Dark Mode Integration (existing next-themes):**
- Use appearance prop with dark theme: `<ClerkProvider appearance={{ theme: dark }}>`
- Import from `@clerk/ui/themes`
- Alternatively, set CSS `color-scheme` property to let Clerk auto-detect system preference
- RECOMMENDED: Use CSS approach for consistency with existing next-themes implementation

**For Protected Routes (all pages):**
- Use `clerkMiddleware()` with `auth.protect()` in middleware.ts
- Define public routes with `createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])`
- Invert matcher: protect all except public routes
- No per-page protection needed (middleware handles everything)

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @clerk/nextjs@7.3.3 | Next.js 15.2.8 - 16.1.x | Current project uses Next.js 16.1.6 ✓ |
| @clerk/nextjs@7.3.3 | React 18.x or 19.x | Current project uses React 19.2.3 ✓ |
| @clerk/nextjs@7.3.3 | Node.js >= 20.9.0 | Core 3 minimum requirement |

## Integration Points with Existing Stack

### No Conflicts
- **next-themes**: Clerk appearance prop works alongside; use CSS color-scheme approach for seamless integration
- **Tailwind CSS 4**: Clerk components use their own CSS, no Tailwind conflicts; can customize via appearance.elements
- **TypeScript**: Full type support included in @clerk/nextjs, no additional @types packages needed
- **CVA/component library**: Clerk components are self-contained, won't interfere with custom Button/Input components

### Middleware Considerations
- **New file required**: Create `middleware.ts` in project root (Next.js App Router pattern)
- **Matcher config**: Use recommended matcher pattern to avoid running on static files (_next, images, fonts)
- **Execution order**: Clerk middleware runs before route handlers and server components

### Environment Variables
```env
# .env.local (NEVER commit)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Production (.env.production or hosting provider)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
```

## Production Deployment Checklist

1. **Update API keys to production instances** (pk_live_ and sk_live_)
2. **Set environment variables in hosting provider** (Vercel/AWS/etc.)
3. **Never use NEXT_PUBLIC_ prefix for CLERK_SECRET_KEY** (server-only)
4. **Redeploy after changing environment variables**
5. **Configure allowed domains in Clerk Dashboard** (production URLs)

## Sources

- Context7: /clerk/clerk-docs — Installation, middleware, App Router patterns, environment variables (HIGH confidence)
- npm: @clerk/nextjs@7.3.3 — Latest stable version, peer dependencies verified (HIGH confidence)
- [Clerk Environment Variables](https://clerk.com/docs/deployments/clerk-environment-variables) — Environment variable requirements (HIGH confidence)
- [Clerk Production Deployment](https://clerk.com/docs/guides/development/deployment/production) — Production deployment checklist (HIGH confidence)
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) — Production best practices (MEDIUM confidence, via WebSearch)

---
*Stack research for: Clerk authentication in Next.js 15 App Router*
*Researched: 2026-05-09*
