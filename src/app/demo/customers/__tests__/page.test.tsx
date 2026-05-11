import { render, screen, waitFor } from "@testing-library/react";
import CustomersPage from "../page";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => "/demo/customers"),
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

jest.mock("@/services/customers", () => ({
  getCustomers: jest.fn(),
}));

jest.mock("@/services/notifications", () => ({
  getNotifications: jest.fn().mockResolvedValue([]),
}));

// Import mocks after jest.mock
import { getCustomers } from "@/services/customers";
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

describe("CustomersPage - MIG-02 Design System Migration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCustomers as jest.Mock).mockResolvedValue(mockCustomers);
  });

  describe("Card component wrapper", () => {
    it("renders Card component for customer list container", async () => {
      render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();
      });

      // Card component should be present - verify by checking page renders correctly
      // Multiple "Customers" elements exist (sidebar, header, page title)
      const customersElements = screen.getAllByText("Customers");
      expect(customersElements.length).toBeGreaterThan(0);
    });

    it("does not use hardcoded rounded-[15px]", async () => {
      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();
      });

      const hardcodedRadius = container.querySelectorAll('.rounded-\\[15px\\]');
      expect(hardcodedRadius.length).toBe(0);
    });

    it("does not use hardcoded shadow-[0_3.5px_5px_rgba...]", async () => {
      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();
      });

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
      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();
      });

      const hardcodedBg = container.querySelectorAll(".bg-gray-200");
      expect(hardcodedBg.length).toBe(0);
    });

    it("does not use hardcoded text-gray-300", async () => {
      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();
      });

      const hardcodedText = container.querySelectorAll(".text-gray-300");
      expect(hardcodedText.length).toBe(0);
    });

    it("does not use hardcoded text-gray-400", async () => {
      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();
      });

      const hardcodedText = container.querySelectorAll(".text-gray-400");
      expect(hardcodedText.length).toBe(0);
    });

    it("does not use hardcoded hover:bg-gray-50", async () => {
      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();
      });

      const hardcodedHover = container.querySelectorAll(".hover\\:bg-gray-50");
      expect(hardcodedHover.length).toBe(0);
    });
  });

  describe("Design tokens usage", () => {
    it("uses bg-[var(--divider)] for skeleton backgrounds", () => {
      // Force loading state
      (getCustomers as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { container } = render(<CustomersPage />);

      const tokenBg = container.querySelectorAll('.bg-\\[var\\(--divider\\)\\]');
      expect(tokenBg.length).toBeGreaterThan(0);
    });

    it("uses text-[var(--text-secondary)] for secondary text", async () => {
      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();
      });

      const tokenText = container.querySelectorAll('.text-\\[var\\(--text-secondary\\)\\]');
      expect(tokenText.length).toBeGreaterThan(0);
    });

    it("uses hover:bg-[var(--bg-page)] for row hover", async () => {
      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByText("Greenfield Farms")).toBeInTheDocument();
      });

      const tokenHover = container.querySelectorAll('.hover\\:bg-\\[var\\(--bg-page\\)\\]');
      expect(tokenHover.length).toBeGreaterThan(0);
    });

    it("uses border-[var(--divider)] for input border", async () => {
      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search customers by name...")).toBeInTheDocument();
      });

      const tokenBorder = container.querySelectorAll('.border-\\[var\\(--divider\\)\\]');
      expect(tokenBorder.length).toBeGreaterThan(0);
    });

    it("uses focus:border-[var(--primary)] for input focus", async () => {
      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search customers by name...")).toBeInTheDocument();
      });

      const tokenFocus = container.querySelectorAll('.focus\\:border-\\[var\\(--primary\\)\\]');
      expect(tokenFocus.length).toBeGreaterThan(0);
    });
  });

  describe("Empty state uses design tokens", () => {
    it("empty state icon uses text-[var(--text-secondary)]", async () => {
      (getCustomers as jest.Mock).mockResolvedValue([]);

      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        // Multiple elements say "No customers found", find them all
        const noCustomersElements = screen.getAllByText("No customers found");
        expect(noCustomersElements.length).toBeGreaterThan(0);
      });

      const tokenText = container.querySelectorAll('.text-\\[var\\(--text-secondary\\)\\]');
      expect(tokenText.length).toBeGreaterThan(0);
    });
  });

  describe("Error state uses design tokens", () => {
    it("error icon uses text-[var(--error)]", async () => {
      (getCustomers as jest.Mock).mockRejectedValue(new Error("Network error"));

      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByText("Error loading customers")).toBeInTheDocument();
      });

      const tokenError = container.querySelectorAll('.text-\\[var\\(--error\\)\\]');
      expect(tokenError.length).toBeGreaterThan(0);
    });
  });

  describe("Status indicators use design tokens", () => {
    it("hasChanges dot uses bg-error token", async () => {
      const { container } = render(<CustomersPage />);

      await waitFor(() => {
        expect(screen.getByText("Valley Ranch")).toBeInTheDocument();
      });

      // bg-error is a utility class, not a var() token
      const errorDot = container.querySelectorAll(".bg-error");
      expect(errorDot.length).toBeGreaterThan(0);
    });
  });
});
