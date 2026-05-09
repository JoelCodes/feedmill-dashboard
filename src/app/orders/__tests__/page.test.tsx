import { render, screen, waitFor } from "@testing-library/react";
import OrdersPage from "../page";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => "/orders"),
}));

jest.mock("@/services/orders", () => ({
  getOrders: jest.fn(),
}));

// Import mocks after jest.mock
import { getOrders } from "@/services/orders";
import { Order } from "@/types/order";

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    documentNumber: "12345",
    customer: "Test Farm",
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
    jest.clearAllMocks();
    (getOrders as jest.Mock).mockResolvedValue(mockOrders);
  });

  describe("Suspense skeleton uses design tokens", () => {
    it("skeleton does not use hardcoded rounded-[15px]", () => {
      // Make getOrders hang to force loading state
      (getOrders as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { container } = render(<OrdersPage />);

      // Check for hardcoded rounded-[15px] pattern
      const hardcodedRadius = container.querySelectorAll('.rounded-\\[15px\\]');
      expect(hardcodedRadius.length).toBe(0);
    });

    it("skeleton does not use hardcoded bg-gray-100", () => {
      // Make getOrders hang to force loading state
      (getOrders as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { container } = render(<OrdersPage />);

      // Check for hardcoded bg-gray-100
      const hardcodedBg = container.querySelectorAll('.bg-gray-100');
      expect(hardcodedBg.length).toBe(0);
    });

    it("skeleton uses token-based rounded-[var(--radius-xl)]", () => {
      // Make getOrders hang to force loading state
      (getOrders as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { container } = render(<OrdersPage />);

      // Verify token-based radius is used
      const tokenRadius = container.querySelectorAll('.rounded-\\[var\\(--radius-xl\\)\\]');
      expect(tokenRadius.length).toBeGreaterThan(0);
    });

    it("skeleton uses token-based bg-[var(--divider)]", () => {
      // Make getOrders hang to force loading state
      (getOrders as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { container } = render(<OrdersPage />);

      // Verify token-based bg is used
      const tokenBg = container.querySelectorAll('.bg-\\[var\\(--divider\\)\\]');
      expect(tokenBg.length).toBeGreaterThan(0);
    });
  });

  describe("Page renders correctly", () => {
    it("renders orders page with sidebar and header", async () => {
      render(<OrdersPage />);

      await waitFor(() => {
        // Header should be present
        expect(screen.getByRole("main")).toBeInTheDocument();
      });
    });
  });
});
