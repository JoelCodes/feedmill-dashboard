import { render, screen, waitFor } from "@testing-library/react";
import OrderDetails from "../OrderDetails";

// Mock dependencies
jest.mock("@/services/orders", () => ({
  getOrderById: jest.fn(),
}));

// Import mocks after jest.mock
import { getOrderById } from "@/services/orders";
import { Order } from "@/types/order";

const mockOrder: Order = {
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
};

describe("OrderDetails - MIG-01 Design System Migration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getOrderById as jest.Mock).mockResolvedValue(mockOrder);
  });

  describe("Card component usage", () => {
    it("renders Card component from ui/ (no standalone rounded-[15px])", async () => {
      const { container } = render(<OrderDetails orderId="ORD-001" />);

      await waitFor(() => {
        expect(screen.getByText(/12345/)).toBeInTheDocument();
      });

      // Card component handles rounded corners - no hardcoded rounded-[15px]
      const hardcodedRadius = container.querySelectorAll('.rounded-\\[15px\\]');
      expect(hardcodedRadius.length).toBe(0);
    });

    it("renders Card component from ui/ (no standalone shadow-[0_3.5px_5px_rgba...])", async () => {
      const { container } = render(<OrderDetails orderId="ORD-001" />);

      await waitFor(() => {
        expect(screen.getByText(/12345/)).toBeInTheDocument();
      });

      // Card component handles shadows - no hardcoded shadow pattern
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

  describe("colorMap uses design tokens", () => {
    it("uses var(--primary) for primary color in timeline", async () => {
      const { container } = render(<OrderDetails orderId="ORD-001" />);

      await waitFor(() => {
        expect(screen.getByText("Order Placed")).toBeInTheDocument();
      });

      // Check for token-based primary color
      const tokenPrimary = container.querySelectorAll('.bg-\\[var\\(--primary\\)\\]');
      expect(tokenPrimary.length).toBeGreaterThan(0);
    });

    it("uses var(--text-secondary) for pending text color", async () => {
      const { container } = render(<OrderDetails orderId="ORD-001" />);

      await waitFor(() => {
        expect(screen.getByText("Order Placed")).toBeInTheDocument();
      });

      // Check for token-based text color - used throughout component
      const tokenText = container.querySelectorAll('.text-\\[var\\(--text-secondary\\)\\]');
      expect(tokenText.length).toBeGreaterThan(0);
    });

    it("uses var(--pending-light) for PendingBadge background", async () => {
      const { container } = render(<OrderDetails orderId="ORD-001" />);

      // Wait for order details to load
      await waitFor(() => {
        expect(screen.getByText("Timeline")).toBeInTheDocument();
      });

      // Check for token-based pending light background (may or may not be present depending on order status)
      // With status "Producing", there will be pending events in timeline
      const tokenBg = container.querySelectorAll('.bg-\\[var\\(--pending-light\\)\\]');
      expect(tokenBg.length).toBeGreaterThan(0);
    });
  });

  describe("StatCard uses design tokens", () => {
    it("uses var(--bg-page) for StatCard background", async () => {
      const { container } = render(<OrderDetails orderId="ORD-001" />);

      await waitFor(() => {
        expect(screen.getByText("Quantity")).toBeInTheDocument();
      });

      // StatCard should use token-based background
      const tokenBg = container.querySelectorAll('.bg-\\[var\\(--bg-page\\)\\]');
      expect(tokenBg.length).toBeGreaterThan(0);
    });

    it("uses var(--text-primary) for StatCard values", async () => {
      const { container } = render(<OrderDetails orderId="ORD-001" />);

      await waitFor(() => {
        expect(screen.getByText("10")).toBeInTheDocument();
      });

      // StatCard values should use token-based text color
      const tokenText = container.querySelectorAll('.text-\\[var\\(--text-primary\\)\\]');
      expect(tokenText.length).toBeGreaterThan(0);
    });
  });

  describe("Empty state uses design tokens", () => {
    it("shows placeholder when no order selected", () => {
      const { container } = render(<OrderDetails orderId={null} />);

      expect(screen.getByText("Select an order to view details")).toBeInTheDocument();

      // Placeholder should use token-based text color
      const tokenText = container.querySelectorAll('.text-\\[var\\(--text-secondary\\)\\]');
      expect(tokenText.length).toBeGreaterThan(0);
    });
  });
});
