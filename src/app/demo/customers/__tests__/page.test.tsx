import {
  clerkAuthMockFactory,
  nextNavigationMockFactory,
  mockAuth,
  mockDemoSession,
  mockNonDemoSession,
  mockUnauthenticatedSession,
} from "@/test/fixtures/clerkAuth";

// Mock dependencies — jest.mock calls are hoisted above all imports (Pattern C
// from src/lib/auth.test.ts). The 28-01 factory imports above are hoisted
// alongside, so the references inside the factory arrows resolve correctly.
jest.mock("@clerk/nextjs/server", () => clerkAuthMockFactory());
jest.mock("next/navigation", () => nextNavigationMockFactory());

import { render, screen } from "@testing-library/react";
import CustomersPage from "../page";

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

jest.mock("@/services/customers", () => ({
  getCustomers: jest.fn(),
}));

jest.mock("@/services/notifications", () => ({
  getNotifications: jest.fn().mockResolvedValue([]),
}));

// Mock sortCustomersByRecentActivity as a pass-through. Sort now runs server-side
// in the RSC; we assert it was called once with the fetched customers, but the
// page tests don't need to re-validate the sort algorithm (that's the
// customerSort.test.ts contract).
jest.mock("@/utils/customerSort", () => ({
  sortCustomersByRecentActivity: jest.fn((customers) => customers),
}));

// Import mocks after jest.mock
import { getCustomers } from "@/services/customers";
import { sortCustomersByRecentActivity } from "@/utils/customerSort";
import { CustomerWithStats } from "@/types/customer";

const mockCustomers: CustomerWithStats[] = [
  {
    id: "CUST-001",
    name: "Greenfield Farms",
    location: "Springfield, IL",
    contactName: "John Green",
    contactPhone: "(217) 555-0101",
    contactEmail: "jgreen@greenfieldfarms.com",
    deliveryPreferences: "Mon/Wed/Fri, 6-8 AM",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2026-03-11"),
    stats: {
      totalOrders: 5,
      activeOrders: 2,
      completedOrders: 3,
      hasChanges: false,
      binAlertLevel: "none",
      activeBins: 2,
    },
  },
  {
    id: "CUST-002",
    name: "Valley Ranch",
    location: "Chicago, IL",
    contactName: "Jane Valley",
    contactPhone: "(312) 555-0102",
    contactEmail: "jvalley@valleyranch.com",
    deliveryPreferences: "Tue/Thu, 9-11 AM",
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2026-04-05"),
    stats: {
      totalOrders: 10,
      activeOrders: 3,
      completedOrders: 7,
      hasChanges: true,
      binAlertLevel: "low",
      activeBins: 3,
    },
  },
];

describe("CustomersPage - MIG-02 Design System Migration (RSC harness)", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockDemoSession();
    jest.clearAllMocks();
    (getCustomers as jest.Mock).mockResolvedValue(mockCustomers);
  });

  // ---------------------------------------------------------------------------
  // Redirect-branch coverage (D-05 inner guard).
  // Mirrors src/app/demo/customers/[id]/page.test.tsx pattern.
  // ---------------------------------------------------------------------------

  describe("requireRole('demo') guard", () => {
    it("redirects to /sign-in when userId is missing (unauthenticated)", async () => {
      mockUnauthenticatedSession();

      await expect(CustomersPage()).rejects.toMatchObject({ url: "/sign-in" });
    });

    it("redirects to / when role is user (non-demo)", async () => {
      mockNonDemoSession("user");

      await expect(CustomersPage()).rejects.toMatchObject({ url: "/" });
    });

    it("redirects to / when role is admin (any non-demo role)", async () => {
      mockNonDemoSession("admin");

      await expect(CustomersPage()).rejects.toMatchObject({ url: "/" });
    });
  });

  // ---------------------------------------------------------------------------
  // RSC data-flow contract: the page fetches once, sorts server-side, and
  // hands data to <CustomersList>. These assertions migrated here from the
  // (now-deleted) sibling customers/page.test.tsx during CR-01 dedup.
  // ---------------------------------------------------------------------------

  describe("RSC data-flow contract", () => {
    it("calls sortCustomersByRecentActivity exactly once with the fetched customers", async () => {
      await CustomersPage();

      expect(sortCustomersByRecentActivity).toHaveBeenCalledTimes(1);
      expect(sortCustomersByRecentActivity).toHaveBeenCalledWith(mockCustomers);
    });

    it("renders the visible status indicators handed off to CustomersList", async () => {
      const element = await CustomersPage();
      render(element);

      // Verify the rendered DOM still surfaces status indicators (i.e., that the
      // RSC successfully passed data to CustomersList — not a re-test of the
      // indicator logic, which lives in CustomersList.test.tsx).
      const greenfieldRow = screen.getByText("Greenfield Farms").closest("[data-customer-id]");
      expect(greenfieldRow?.querySelector('[data-testid="status-orders"]')).toBeInTheDocument();

      const valleyRow = screen.getByText("Valley Ranch").closest("[data-customer-id]");
      expect(valleyRow?.querySelector('[data-testid="status-bin-low"]')).toBeInTheDocument();
      expect(valleyRow?.querySelector('[data-testid="status-changes"]')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Design-system token coverage. The rendered DOM (after `await CustomersPage()`)
  // includes the CustomersList client child JSX, so design-token assertions
  // continue to work against the same selectors used pre-Phase-28 — only the
  // setup harness changed.
  //
  // NOTE: skeleton-related and error-state assertions are intentionally
  // removed — Phase 28 dropped both branches (data is pre-resolved server-side;
  // the mock service does not throw at the page layer).
  // ---------------------------------------------------------------------------

  describe("Card component wrapper", () => {
    it("renders Card component for customer list container", async () => {
      const element = await CustomersPage();
      render(element);

      expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();

      // Multiple "Customers" elements exist (sidebar, header, page title).
      const customersElements = screen.getAllByText("Customers");
      expect(customersElements.length).toBeGreaterThan(0);
    });

    it("does not use hardcoded rounded-[15px]", async () => {
      const element = await CustomersPage();
      const { container } = render(element);

      expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();

      const hardcodedRadius = container.querySelectorAll(".rounded-\\[15px\\]");
      expect(hardcodedRadius.length).toBe(0);
    });

    it("does not use hardcoded shadow-[0_3.5px_5px_rgba...]", async () => {
      const element = await CustomersPage();
      const { container } = render(element);

      expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();

      const allElements = container.querySelectorAll("*");
      let hasHardcodedShadow = false;

      allElements.forEach((el) => {
        if (el.className && typeof el.className === "string") {
          if (el.className.includes("shadow-[0_3.5px_5px_rgba")) {
            hasHardcodedShadow = true;
          }
        }
      });

      expect(hasHardcodedShadow).toBe(false);
    });
  });

  describe("No hardcoded gray-* classes", () => {
    it("does not use hardcoded bg-gray-200", async () => {
      const element = await CustomersPage();
      const { container } = render(element);

      expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();

      const hardcodedBg = container.querySelectorAll(".bg-gray-200");
      expect(hardcodedBg.length).toBe(0);
    });

    it("does not use hardcoded text-gray-300", async () => {
      const element = await CustomersPage();
      const { container } = render(element);

      expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();

      const hardcodedText = container.querySelectorAll(".text-gray-300");
      expect(hardcodedText.length).toBe(0);
    });

    it("does not use hardcoded text-gray-400", async () => {
      const element = await CustomersPage();
      const { container } = render(element);

      expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();

      const hardcodedText = container.querySelectorAll(".text-gray-400");
      expect(hardcodedText.length).toBe(0);
    });

    it("does not use hardcoded hover:bg-gray-50", async () => {
      const element = await CustomersPage();
      const { container } = render(element);

      expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();

      const hardcodedHover = container.querySelectorAll(".hover\\:bg-gray-50");
      expect(hardcodedHover.length).toBe(0);
    });
  });

  describe("Design tokens usage", () => {
    it("uses text-[var(--text-secondary)] for secondary text", async () => {
      const element = await CustomersPage();
      const { container } = render(element);

      expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();

      const tokenText = container.querySelectorAll('.text-\\[var\\(--text-secondary\\)\\]');
      expect(tokenText.length).toBeGreaterThan(0);
    });

    it("uses hover:bg-[var(--bg-page)] for row hover", async () => {
      const element = await CustomersPage();
      const { container } = render(element);

      expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();

      const tokenHover = container.querySelectorAll('.hover\\:bg-\\[var\\(--bg-page\\)\\]');
      expect(tokenHover.length).toBeGreaterThan(0);
    });

    it("uses border-[var(--divider)] for input border", async () => {
      const element = await CustomersPage();
      const { container } = render(element);

      expect(screen.getByPlaceholderText("Search customers by name...")).toBeInTheDocument();

      const tokenBorder = container.querySelectorAll('.border-\\[var\\(--divider\\)\\]');
      expect(tokenBorder.length).toBeGreaterThan(0);
    });

    it("uses focus:border-[var(--primary)] for input focus", async () => {
      const element = await CustomersPage();
      const { container } = render(element);

      expect(screen.getByPlaceholderText("Search customers by name...")).toBeInTheDocument();

      const tokenFocus = container.querySelectorAll('.focus\\:border-\\[var\\(--primary\\)\\]');
      expect(tokenFocus.length).toBeGreaterThan(0);
    });
  });

  describe("Empty state uses design tokens", () => {
    it("empty state icon uses text-[var(--text-secondary)]", async () => {
      (getCustomers as jest.Mock).mockResolvedValue([]);

      const element = await CustomersPage();
      const { container } = render(element);

      // Multiple elements say "No customers found" (aria-live + visible EmptyState).
      const noCustomersElements = screen.getAllByText("No customers found");
      expect(noCustomersElements.length).toBeGreaterThan(0);

      const tokenText = container.querySelectorAll('.text-\\[var\\(--text-secondary\\)\\]');
      expect(tokenText.length).toBeGreaterThan(0);
    });
  });

  describe("Status indicators use design tokens", () => {
    it("hasChanges dot uses bg-error token", async () => {
      const element = await CustomersPage();
      const { container } = render(element);

      expect(screen.getByText("Valley Ranch")).toBeInTheDocument();

      // bg-error is a utility class, not a var() token.
      const errorDot = container.querySelectorAll(".bg-error");
      expect(errorDot.length).toBeGreaterThan(0);
    });
  });
});
