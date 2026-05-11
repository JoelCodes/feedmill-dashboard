// Mock Clerk imports before importing middleware
jest.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (fn: () => void) => fn,
  createRouteMatcher: () => () => false,
}));

// Mock next/server to avoid Request global requirement in test environment
jest.mock("next/server", () => ({
  NextResponse: {
    redirect: jest.fn(),
  },
}));

import { config } from "./middleware";

// Note: We cannot directly test the middleware function behavior without a full Next.js runtime
// and Clerk backend. This test verifies the middleware configuration structure and exports.

describe("middleware", () => {
  describe("middleware configuration", () => {
    it("exports a config object with matcher array", () => {
      expect(config).toBeDefined();
      expect(config).toHaveProperty("matcher");
      expect(Array.isArray(config.matcher)).toBe(true);
    });

    it("defines broad matcher pattern to catch all routes", () => {
      // Per PLAN: "Broad matcher pattern ensures middleware catches all routes"
      expect(config.matcher.length).toBeGreaterThan(0);

      // First matcher should exclude static files and Next.js internals
      const mainMatcher = config.matcher[0];
      expect(typeof mainMatcher).toBe("string");

      // Should contain negative lookahead for _next
      expect(mainMatcher).toContain("(?!");
      expect(mainMatcher).toContain("_next");
    });

    it("includes API routes matcher", () => {
      // Per PLAN: "Always run for API routes"
      const apiMatcher = config.matcher.find((m: string) => m.includes("api"));
      expect(apiMatcher).toBeDefined();
      expect(apiMatcher).toContain("api");
    });

    it("excludes static file extensions from middleware", () => {
      const mainMatcher = config.matcher[0];

      // Should exclude common static file extensions
      // Note: Some extensions may use regex patterns (e.g., jpe?g for jpg/jpeg)
      const staticExtensions = ["css", "png", "svg", "ico"];
      staticExtensions.forEach((ext) => {
        expect(mainMatcher).toContain(ext);
      });

      // Verify jpg/jpeg pattern
      expect(mainMatcher).toContain("jpe?g");
    });
  });

  describe("public route configuration", () => {
    // We can verify the middleware file structure by reading it
    it("defines /sign-in as a public route", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const middlewarePath = path.join(__dirname, "middleware.ts");
      const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

      // Per PROT-03 requirement: /sign-in must be publicly accessible
      expect(middlewareContent).toContain('"/sign-in');
      expect(middlewareContent).toContain("isPublicRoute");
      expect(middlewareContent).toContain("createRouteMatcher");
    });

    it("uses catch-all matcher for sign-in routes", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const middlewarePath = path.join(__dirname, "middleware.ts");
      const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

      // Per D-04: Catch-all route for password reset, verification flows
      expect(middlewareContent).toContain('"/sign-in(.*)"');
    });

    it("uses async auth.protect() pattern", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const middlewarePath = path.join(__dirname, "middleware.ts");
      const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

      // Per PLAN: "Async auth.protect() pattern (Clerk v6+ requirement)"
      expect(middlewareContent).toContain("await auth.protect()");
      expect(middlewareContent).toContain("async");
    });

    it("protects non-public routes by default", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const middlewarePath = path.join(__dirname, "middleware.ts");
      const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

      // Middleware should check if route is NOT public, then protect
      expect(middlewareContent).toContain("!isPublicRoute");
      expect(middlewareContent).toContain("auth.protect()");
    });

    it("exports clerkMiddleware as default export", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const middlewarePath = path.join(__dirname, "middleware.ts");
      const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

      expect(middlewareContent).toContain("export default clerkMiddleware");
      expect(middlewareContent).toContain('from "@clerk/nextjs/server"');
    });
  });

  describe("demo route protection", () => {
    // Tests verify middleware SOURCE CODE contains correct patterns for ACCESS-01
    // Using fs/promises file read pattern (same as existing public route tests)

    it("defines /demo/* as a protected route", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const middlewarePath = path.join(__dirname, "middleware.ts");
      const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

      // Per ACCESS-01: Demo routes require role-based protection
      expect(middlewareContent).toContain("isDemoRoute");
      expect(middlewareContent).toContain('/demo(.*)');
    });

    it("checks role for demo routes", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const middlewarePath = path.join(__dirname, "middleware.ts");
      const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

      // Per ACCESS-01: Check sessionClaims.metadata.role
      expect(middlewareContent).toContain("sessionClaims");
      expect(middlewareContent).toContain("metadata");
      expect(middlewareContent).toContain("role");
    });

    it("redirects to root when role check fails", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const middlewarePath = path.join(__dirname, "middleware.ts");
      const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

      // Per D-01: Redirect to / with 307 status
      expect(middlewareContent).toContain("new URL('/', request.url)");
      expect(middlewareContent).toContain("NextResponse.redirect");
    });

    it("imports NextResponse from next/server", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const middlewarePath = path.join(__dirname, "middleware.ts");
      const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

      // NextResponse required for redirect
      expect(middlewareContent).toContain("NextResponse");
      expect(middlewareContent).toContain("from 'next/server'");
    });
  });
});
