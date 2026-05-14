/**
 * Unit tests for the Phase 34 transitional homepage (`src/app/page.tsx`).
 *
 * The homepage is now a clean transitional stub pending ProductionDashboard wiring
 * in plan 07. The Phase 31 placeholder stub has been deleted and replaced.
 *
 * Test behaviors:
 *   - Test 1: unauthenticated → redirect('/sign-in')
 *   - Test 2: authenticated → renders "Dashboard placeholder" text
 *   - Test 3: auth is preserved (auth gate still runs)
 *
 * TODO: This test is rewritten in 34-07-PLAN.md to assert ProductionDashboard rendering.
 *
 * Uses the canonical clerkAuth fixture consumer pattern from
 * `src/test/fixtures/clerkAuth.test.ts:22-23` — factories passed to
 * `jest.mock` and the per-test session helpers seed `mockAuth.mockResolvedValue`.
 */
import {
  clerkAuthMockFactory,
  nextNavigationMockFactory,
} from "@/test/fixtures/clerkAuth";

jest.mock("@clerk/nextjs/server", () => clerkAuthMockFactory());
jest.mock("next/navigation", () => nextNavigationMockFactory());

// DashboardLayout's Header pulls notifications; keep it inert.
jest.mock("@/services/notifications", () => ({
  getNotifications: jest.fn().mockResolvedValue([]),
}));

// DashboardLayout's Header uses Clerk UI components; stub them so the render
// path doesn't require a real ClerkProvider in the test.
jest.mock("@clerk/nextjs", () => ({
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-loaded">{children}</div>
  ),
  ClerkLoading: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-loading">{children}</div>
  ),
  UserButton: () => <div data-testid="user-button">User</div>,
}));

import { render, screen } from "@testing-library/react";
import HomePage from "./page";
import {
  mockAuth,
  mockUnauthenticatedSession,
  mockNonDemoSession,
  mockMillOperatorSession,
} from "@/test/fixtures/clerkAuth";

beforeEach(() => {
  mockAuth.mockReset();
});

describe("HomePage (Phase 34 transitional stub)", () => {
  it("redirects to /sign-in when unauthenticated", async () => {
    mockUnauthenticatedSession();

    // The nextNavigationMockFactory's redirect implementation throws an
    // Error decorated with `{ url }`, mirroring real Next.js NEXT_REDIRECT
    // semantics so HomePage cannot continue past the redirect call.
    await expect(HomePage()).rejects.toMatchObject({ url: "/sign-in" });
  });

  it("renders Dashboard placeholder text when authenticated", async () => {
    mockNonDemoSession("user");

    const element = await HomePage();
    render(element);

    expect(screen.getByText(/Dashboard placeholder/i)).toBeInTheDocument();
  });

  it("renders Dashboard placeholder for mill_operator users", async () => {
    mockMillOperatorSession();

    const element = await HomePage();
    render(element);

    expect(screen.getByText(/Dashboard placeholder/i)).toBeInTheDocument();
  });
});
