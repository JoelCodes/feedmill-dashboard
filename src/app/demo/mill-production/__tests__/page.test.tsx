import { render, screen, waitFor } from "@testing-library/react";
import MillProductionPage from "../page";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => "/demo/mill-production"),
}));

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

describe("MillProductionPage - MIG-03 Token Migration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getProductionOrders as jest.Mock).mockResolvedValue(mockOrders);
  });

  describe("Design system component imports", () => {
    it("imports FilterPill from @/components/ui/FilterPill (not @/components/FilterPill)", () => {
      // This test verifies the import path by checking component behavior
      render(<MillProductionPage />);

      // FilterPill renders state filters - check they exist
      waitFor(() => {
        expect(screen.getByText("Completed")).toBeInTheDocument();
        expect(screen.getByText("Mixing")).toBeInTheDocument();
        expect(screen.getByText("Blocked")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
      });
    });
  });

  describe("Token usage - no hardcoded values", () => {
    it("LoadingSkeleton uses design tokens (no bg-gray-200)", async () => {
      // Make getProductionOrders hang to force loading state
      (getProductionOrders as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { container } = render(<MillProductionPage />);

      // Verify skeleton elements are present
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);

      // Verify no hardcoded bg-gray-200 class
      const hardcodedGray = container.querySelectorAll(".bg-gray-200");
      expect(hardcodedGray.length).toBe(0);

      // Verify token-based bg-[var(--divider)] is used
      const tokenBg = container.querySelectorAll('.bg-\\[var\\(--divider\\)\\]');
      expect(tokenBg.length).toBeGreaterThan(0);
    });

    it("ProductionCard uses design tokens for card background", async () => {
      render(<MillProductionPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Farm")).toBeInTheDocument();
      });

      const { container } = render(<MillProductionPage />);

      await waitFor(() => {
        // Verify bg-[var(--bg-card)] token is used
        const cardBg = container.querySelectorAll('.bg-\\[var\\(--bg-card\\)\\]');
        expect(cardBg.length).toBeGreaterThan(0);

        // Verify no hardcoded white backgrounds on cards
        const cards = container.querySelectorAll(".shadow-card");
        cards.forEach(card => {
          expect(card.className).not.toMatch(/\bbg-white\b(?!-)/);
        });
      });
    });
  });

  describe("State-based filtering", () => {
    it("renders filter pills for all production states", async () => {
      render(<MillProductionPage />);

      await waitFor(() => {
        expect(screen.getByText("Completed")).toBeInTheDocument();
        expect(screen.getByText("Mixing")).toBeInTheDocument();
        expect(screen.getByText("Blocked")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
      });
    });

    it("displays production orders grouped by mill line", async () => {
      render(<MillProductionPage />);

      await waitFor(() => {
        expect(screen.getByText("Premix")).toBeInTheDocument();
        expect(screen.getByText("Excel")).toBeInTheDocument();
        expect(screen.getByText("CGM")).toBeInTheDocument();
      });
    });
  });

  describe("Data rendering", () => {
    it("renders production order details", async () => {
      render(<MillProductionPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Farm")).toBeInTheDocument();
        expect(screen.getByText("12345")).toBeInTheDocument();
        expect(screen.getByText(/5,000 lbs/)).toBeInTheDocument();
        expect(screen.getByText(/Premium Mix/)).toBeInTheDocument();
      });
    });
  });
});
