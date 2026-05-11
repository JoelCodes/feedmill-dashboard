import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

/**
 * Routes that are publicly accessible without authentication.
 * All other routes are protected by default.
 */
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

/**
 * Routes that require demo role (ACCESS-01).
 * Users without demo role are redirected to root.
 */
const isDemoRoute = createRouteMatcher(['/demo(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Demo route protection per ACCESS-01
  // Users without demo role are redirected to root (D-01: 307 status)
  // No logging per D-02
  if (isDemoRoute(request)) {
    const { sessionClaims } = await auth();
    if (sessionClaims?.metadata?.role !== 'demo') {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }
});

/**
 * Middleware matcher configuration.
 * Uses broad matcher to ensure middleware runs on all routes.
 * Excludes static files and Next.js internals.
 */
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
