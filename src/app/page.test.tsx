/**
 * Unit tests for the Phase 31 async RSC homepage (`src/app/page.tsx`).
 *
 * Replaces the prior placeholder tests entirely. The rewritten
 * HomePage is an async server component that:
 *   1. Calls `await auth()` and `redirect('/sign-in')` when there is no userId.
 *   2. Otherwise calls `await checkRole('mill_operator')` and renders
 *      `<MillReadOnlyStub canEdit={canEdit} />` inside `<DashboardLayout>`.
 *
 * The four behavior branches under test correspond to CONTEXT.md D-01..D-03
 * and D-13 (multi-role coverage):
 *   - Test 1: unauthenticated → redirect('/sign-in')
 *   - Test 2: authenticated, no mill_operator → data-mode="read-only"
 *   - Test 3: authenticated, mill_operator → data-mode="edit"
 *   - Test 4: authenticated, ['demo','mill_operator'] dual-role → data-mode="edit"
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
  mockDualRoleSession,
} from "@/test/fixtures/clerkAuth";

beforeEach(() => {
  mockAuth.mockReset();
});

describe("HomePage (Phase 31 async RSC)", () => {
  it("redirects to /sign-in when unauthenticated", async () => {
    mockUnauthenticatedSession();

    // The nextNavigationMockFactory's redirect implementation throws an
    // Error decorated with `{ url }`, mirroring real Next.js NEXT_REDIRECT
    // semantics so HomePage cannot continue past the redirect call.
    await expect(HomePage()).rejects.toMatchObject({ url: "/sign-in" });
  });

  it("renders with data-mode='read-only' when authenticated without mill_operator role", async () => {
    mockNonDemoSession("user");

    const element = await HomePage();
    render(element);

    const modeIndicator = screen.getByTestId("mill-mode");
    expect(modeIndicator).toHaveAttribute("data-mode", "read-only");
    expect(modeIndicator).toHaveTextContent("Read-only mode");
  });

  it("renders with data-mode='edit' when authenticated with mill_operator role", async () => {
    mockMillOperatorSession();

    const element = await HomePage();
    render(element);

    const modeIndicator = screen.getByTestId("mill-mode");
    expect(modeIndicator).toHaveAttribute("data-mode", "edit");
    expect(modeIndicator).toHaveTextContent("Edit mode (mill_operator)");
  });

  // D-13: canonical multi-role coverage. A user with both 'demo' and
  // 'mill_operator' must see edit affordances — proves
  // `Array.prototype.includes('mill_operator')` semantics hold for users
  // who carry more than one role.
  it("renders with data-mode='edit' when authenticated with dual roles ['demo','mill_operator']", async () => {
    mockDualRoleSession();

    const element = await HomePage();
    render(element);

    const modeIndicator = screen.getByTestId("mill-mode");
    expect(modeIndicator).toHaveAttribute("data-mode", "edit");
    expect(modeIndicator).toHaveTextContent("Edit mode (mill_operator)");
  });
});
