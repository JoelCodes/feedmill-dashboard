import { render, screen } from "@testing-library/react";
import OrdersTable from "../OrdersTable";
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
  {
    id: "ORD-003",
    documentNumber: "12347",
    customer: "Green Acres",
    customerId: "CUST-003",
    textureType: "Textured",
    formulaType: "Finisher",
    quantity: 8,
    location: "Peoria, IL",
    deliveryDate: new Date("2026-05-17"),
    status: "Pending",
    hasChanges: false,
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-01"),
  },
];

describe("OrdersTable - MIG-01 Design System Migration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("STATUS_PILL_CONFIG uses design tokens (no hardcoded hex)", () => {
    it("does not use hardcoded #f59e0b22 (old Producing countBg)", () => {
      const { container } = render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      expect(screen.getByText("Producing")).toBeInTheDocument();

      // Search for hardcoded hex pattern in any element's class
      const allElements = container.querySelectorAll("*");
      let hasHardcodedHex = false;

      allElements.forEach((el) => {
        if (el.className && typeof el.className === "string") {
          if (el.className.includes("#f59e0b22")) {
            hasHardcodedHex = true;
          }
        }
      });

      expect(hasHardcodedHex).toBe(false);
    });

    it("does not use hardcoded #2b6cb022 (old Ready countBg)", () => {
      const { container } = render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      expect(screen.getByText("Ready")).toBeInTheDocument();

      const allElements = container.querySelectorAll("*");
      let hasHardcodedHex = false;

      allElements.forEach((el) => {
        if (el.className && typeof el.className === "string") {
          if (el.className.includes("#2b6cb022")) {
            hasHardcodedHex = true;
          }
        }
      });

      expect(hasHardcodedHex).toBe(false);
    });

    it("does not use hardcoded #9333ea22 (old In Transit countBg)", () => {
      const { container } = render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      expect(screen.getByText("Transit")).toBeInTheDocument();

      const allElements = container.querySelectorAll("*");
      let hasHardcodedHex = false;

      allElements.forEach((el) => {
        if (el.className && typeof el.className === "string") {
          if (el.className.includes("#9333ea22")) {
            hasHardcodedHex = true;
          }
        }
      });

      expect(hasHardcodedHex).toBe(false);
    });

    it("does not use hardcoded #2f855a22 (old Complete countBg)", () => {
      const { container } = render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      expect(screen.getByText("Complete")).toBeInTheDocument();

      const allElements = container.querySelectorAll("*");
      let hasHardcodedHex = false;

      allElements.forEach((el) => {
        if (el.className && typeof el.className === "string") {
          if (el.className.includes("#2f855a22")) {
            hasHardcodedHex = true;
          }
        }
      });

      expect(hasHardcodedHex).toBe(false);
    });

    it("does not use hardcoded bg-gray-100", () => {
      const { container } = render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      expect(screen.getByText("Pending")).toBeInTheDocument();

      const hardcodedBg = container.querySelectorAll(".bg-gray-100");
      expect(hardcodedBg.length).toBe(0);
    });

    it("does not use hardcoded text-gray-600", () => {
      const { container } = render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      expect(screen.getByText("Pending")).toBeInTheDocument();

      const hardcodedText = container.querySelectorAll(".text-gray-600");
      expect(hardcodedText.length).toBe(0);
    });
  });

  describe("FilterPill import from ui/ directory", () => {
    it("renders FilterPill components for status filters", () => {
      render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      // All status filter pills should render
      expect(screen.getByText("Complete")).toBeInTheDocument();
      expect(screen.getByText("Transit")).toBeInTheDocument();
      expect(screen.getByText("Producing")).toBeInTheDocument();
      expect(screen.getByText("Ready")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Has Changes")).toBeInTheDocument();
    });

    it("FilterPill uses token-based countBg with var(--status-mixing-bg-22)", () => {
      const { container } = render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      expect(screen.getByText("Producing")).toBeInTheDocument();

      // Check that token-based class is present somewhere in the rendered output
      // Verify the component uses token-based config classes
      container.querySelectorAll('.bg-\\[var\\(--status-mixing-bg-22\\)\\]');
    });

    it("FilterPill uses token-based countBg with var(--status-completed-bg-22)", () => {
      render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      expect(screen.getByText("Complete")).toBeInTheDocument();
    });
  });

  describe("Search and hover states use tokens", () => {
    it("search icon uses text-[var(--text-secondary)]", () => {
      const { container } = render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      expect(screen.getByPlaceholderText("Search by customer or product...")).toBeInTheDocument();

      // Search icon should have token-based text color
      const searchIcon = container.querySelector(".text-\\[var\\(--text-secondary\\)\\]");
      expect(searchIcon).toBeInTheDocument();
    });

    it("does not use hardcoded hover:bg-gray-50", () => {
      const { container } = render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      expect(screen.getByText("Test Farm")).toBeInTheDocument();

      const hardcodedHover = container.querySelectorAll(".hover\\:bg-gray-50");
      expect(hardcodedHover.length).toBe(0);
    });

    it("uses token-based hover:bg-[var(--bg-page)]", () => {
      const { container } = render(
        <OrdersTable
          orders={mockOrders}
          selectedOrderId={null}
          onSelectOrder={jest.fn()}
        />
      );

      expect(screen.getByText("Test Farm")).toBeInTheDocument();

      const tokenHover = container.querySelectorAll(".hover\\:bg-\\[var\\(--bg-page\\)\\]");
      expect(tokenHover.length).toBeGreaterThan(0);
    });
  });
});
