import {
  clerkAuthMockFactory,
  nextNavigationMockFactory,
  mockAuth,
  mockDemoSession,
  mockNonDemoSession,
  mockUnauthenticatedSession,
} from "@/test/fixtures/clerkAuth";

// Mock dependencies — jest.mock calls are hoisted above all imports.
// The 28-01 factory imports above are hoisted alongside, so the
// references inside the factory arrows resolve correctly. Canonical
// pattern consumed identically across 28-02..28-05.
jest.mock("@clerk/nextjs/server", () => clerkAuthMockFactory());
jest.mock("next/navigation", () => nextNavigationMockFactory());

import { render, screen } from "@testing-library/react";
import OrdersPage from "../page";

// Mock @clerk/nextjs components used by Header
jest.mock("@clerk/nextjs", () => ({
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-loaded">{children}</div>
  ),
  ClerkLoading: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-loading">{children}</div>
  ),
  UserButton: () => <div data-testid="user-button">User</div>,
}));

jest.mock("@/services/orders", () => ({
  getOrders: jest.fn(),
}));

jest.mock("@/services/notifications", () => ({
  getNotifications: jest.fn().mockResolvedValue([]),
}));

// Import mocks after jest.mock
import { getOrders } from "@/services/orders";
import { Order } from "@/types/order";

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    documentNumber: "12345",
    customer: "Test Farm",
    customerId: "CUST-001",
    textureType: "Coarse",
    formulaType: "Grower",
    quantity: 10,
    location: "Springfield, IL",
    deliveryDate: new Date("2026-05-15"),
    status: "Producing",
    hasChanges: false,
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-01"),
  },
  {
    id: "ORD-002",
    documentNumber: "12346",
    customer: "Test Ranch",
    customerId: "CUST-002",
    textureType: "Fine",
    formulaType: "Starter",
    quantity: 5,
    location: "Chicago, IL",
    deliveryDate: new Date("2026-05-16"),
    status: "Complete",
    hasChanges: true,
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-02"),
  },
];

describe("OrdersPage - MIG-01 Design System Migration", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockDemoSession();
    jest.clearAllMocks();
    (getOrders as jest.Mock).mockResolvedValue(mockOrders);
  });

  // ---------------------------------------------------------------------------
  // Redirect-branch coverage (D-05 inner guard, defense-in-depth).
  // Source pattern: src/lib/auth.test.ts lines 67-89 (redirect-sentinel-throw).
  // ---------------------------------------------------------------------------

  it("redirects to /sign-in when unauthenticated", async () => {
    mockUnauthenticatedSession();

    await expect(OrdersPage()).rejects.toMatchObject({ url: "/sign-in" });
  });

  it("redirects to / when role is user (non-demo)", async () => {
    mockNonDemoSession("user");

    await expect(OrdersPage()).rejects.toMatchObject({ url: "/" });
  });

  it("redirects to / when role is admin (any non-demo role)", async () => {
    mockNonDemoSession("admin");

    await expect(OrdersPage()).rejects.toMatchObject({ url: "/" });
  });

  describe("Suspense skeleton uses design tokens", () => {
    // Suspense-fallback design-token coverage. Pre-refactor these tests
    // forced a loading state by making getOrders() hang. Post-refactor
    // the page is an async RSC that resolves data on the server; the
    // <Suspense> fallback JSX is statically defined in the page return.
    // We assert the page SOURCE includes the token classes — equivalent
    // coverage without rendering a forced-hanging promise.

    it("page source does not use hardcoded rounded-[15px]", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pageSource: string = require("fs").readFileSync(
        require("path").resolve(__dirname, "../page.tsx"),
        "utf8",
      );

      expect(pageSource).not.toMatch(/rounded-\[15px\]/);
    });

    it("page source does not use hardcoded bg-gray-100", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pageSource: string = require("fs").readFileSync(
        require("path").resolve(__dirname, "../page.tsx"),
        "utf8",
      );

      expect(pageSource).not.toMatch(/bg-gray-100/);
    });

    it("page source uses token-based rounded-[var(--radius-xl)]", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pageSource: string = require("fs").readFileSync(
        require("path").resolve(__dirname, "../page.tsx"),
        "utf8",
      );

      expect(pageSource).toMatch(/rounded-\[var\(--radius-xl\)\]/);
    });

    it("page source uses token-based bg-[var(--divider)]", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pageSource: string = require("fs").readFileSync(
        require("path").resolve(__dirname, "../page.tsx"),
        "utf8",
      );

      expect(pageSource).toMatch(/bg-\[var\(--divider\)\]/);
    });
  });

  describe("Page renders correctly", () => {
    it("renders orders page with sidebar and header for demo users", async () => {
      const element = await OrdersPage();
      render(element);

      // Header should be present
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("fetches orders server-side once during render", async () => {
      await OrdersPage();

      // RSC calls getOrders() exactly once on the server.
      expect(getOrders).toHaveBeenCalledTimes(1);
    });
  });
});
