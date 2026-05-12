import {
  clerkAuthMockFactory,
  nextNavigationMockFactory,
  mockAuth,
  mockDemoSession,
  mockNonDemoSession,
  mockUnauthenticatedSession,
} from "@/test/fixtures/clerkAuth";

// jest.mock calls are hoisted above all imports (Pattern C from
// src/lib/auth.test.ts). The 28-01 factory imports above are hoisted
// alongside, so the references inside the factory arrows resolve correctly.
jest.mock("@clerk/nextjs/server", () => clerkAuthMockFactory());
jest.mock("next/navigation", () => nextNavigationMockFactory());

import { render, screen } from "@testing-library/react";
import MillProductionPage from "../page";

// Mock @clerk/nextjs components used by Header (Header renders inside
// DashboardLayout — DashboardLayout is a client child of the RSC page).
jest.mock("@clerk/nextjs", () => ({
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-loaded">{children}</div>
  ),
  ClerkLoading: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-loading">{children}</div>
  ),
  UserButton: () => <div data-testid="user-button">User</div>,
}));

jest.mock("@/services/millProduction", () => ({
  getProductionOrders: jest.fn(),
}));

jest.mock("@/services/notifications", () => ({
  getNotifications: jest.fn().mockResolvedValue([]),
}));

// Import mocks after jest.mock
import { getProductionOrders } from "@/services/millProduction";
import { ProductionOrder } from "@/types/millProduction";

const mockOrders: ProductionOrder[] = [
  {
    id: "ORD-001",
    orderNumber: "12345",
    customer: "Test Farm",
    product: "Premium Mix",
    weightLbs: 5000,
    deliveryTime: "10:00 AM",
    state: "Mixing",
    millLine: "Premix",
  },
  {
    id: "ORD-002",
    orderNumber: "12346",
    customer: "Test Ranch",
    product: "Standard Mix",
    weightLbs: 3000,
    deliveryTime: "11:00 AM",
    state: "Completed",
    millLine: "Excel",
  },
];

describe("MillProductionPage (async RSC)", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockDemoSession();
    jest.clearAllMocks();
    (getProductionOrders as jest.Mock).mockResolvedValue(mockOrders);
  });

  // ---------------------------------------------------------------------------
  // Redirect-branch coverage (28-05 D-05 inner guard, defense-in-depth).
  // Source pattern: src/lib/auth.test.ts redirect-sentinel-throw idiom
  // (mirrors 28-02 customers/[id]/page.test.tsx).
  // ---------------------------------------------------------------------------

  it("redirects to /sign-in when userId is missing (unauthenticated)", async () => {
    mockUnauthenticatedSession();

    await expect(MillProductionPage()).rejects.toMatchObject({ url: "/sign-in" });
  });

  it("redirects to / when role is user (non-demo)", async () => {
    mockNonDemoSession("user");

    await expect(MillProductionPage()).rejects.toMatchObject({ url: "/" });
  });

  it("redirects to / when role is admin (any non-demo role)", async () => {
    mockNonDemoSession("admin");

    await expect(MillProductionPage()).rejects.toMatchObject({ url: "/" });
  });

  // ---------------------------------------------------------------------------
  // Green-path render coverage (async-RSC invocation pattern).
  // ---------------------------------------------------------------------------

  it("renders filter pills for all production states", async () => {
    const element = await MillProductionPage();
    render(element);

    expect(screen.getByRole("button", { name: /Filter by Completed/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filter by Mixing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filter by Blocked/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filter by Pending/i })).toBeInTheDocument();
  });

  it("displays production orders grouped by mill line", async () => {
    const element = await MillProductionPage();
    render(element);

    expect(screen.getByRole("heading", { name: "Premix" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Excel" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CGM" })).toBeInTheDocument();
  });

  it("renders production order details", async () => {
    const element = await MillProductionPage();
    render(element);

    expect(screen.getByText("Test Farm")).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText(/5,000 lbs/)).toBeInTheDocument();
    expect(screen.getByText(/Premium Mix/)).toBeInTheDocument();
  });

  it("fetches production orders on the server (single call)", async () => {
    await MillProductionPage();

    expect(getProductionOrders).toHaveBeenCalledTimes(1);
  });
});
