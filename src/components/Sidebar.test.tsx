import { render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";

// Mock next/navigation
const mockUsePathname = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("Sidebar", () => {
  describe("demo context", () => {
    it("renders demo navigation when pathname starts with /demo", () => {
      mockUsePathname.mockReturnValue("/demo/orders");

      render(<Sidebar />);

      // Should show demo-specific navigation links
      const ordersLink = screen.getByRole("link", { name: /orders/i });
      expect(ordersLink).toBeInTheDocument();
      expect(ordersLink).toHaveAttribute("href", "/demo/orders");

      const customersLink = screen.getByRole("link", { name: /customers/i });
      expect(customersLink).toBeInTheDocument();
      expect(customersLink).toHaveAttribute("href", "/demo/customers");

      const productionLink = screen.getByRole("link", { name: /mill production/i });
      expect(productionLink).toBeInTheDocument();
      expect(productionLink).toHaveAttribute("href", "/demo/mill-production");
    });

    it("renders DEMO section label on demo routes", () => {
      mockUsePathname.mockReturnValue("/demo/orders");

      render(<Sidebar />);

      expect(screen.getByText("DEMO")).toBeInTheDocument();
    });

    it("renders Settings link in demo context", () => {
      mockUsePathname.mockReturnValue("/demo/orders");

      render(<Sidebar />);

      const settingsLink = screen.getByRole("link", { name: /settings/i });
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveAttribute("href", "/settings");
    });
  });

  describe("production context", () => {
    it("renders production navigation when pathname is root", () => {
      mockUsePathname.mockReturnValue("/");

      render(<Sidebar />);

      // Should show "Coming Soon" placeholder
      const comingSoonLink = screen.getByRole("link", { name: /coming soon/i });
      expect(comingSoonLink).toBeInTheDocument();
      expect(comingSoonLink).toHaveAttribute("href", "/");

      // Should NOT show demo navigation
      expect(screen.queryByRole("link", { name: /orders/i })).not.toBeInTheDocument();
    });

    it("renders PRODUCTION section label on non-demo routes", () => {
      mockUsePathname.mockReturnValue("/");

      render(<Sidebar />);

      expect(screen.getByText("PRODUCTION")).toBeInTheDocument();
    });

    it("renders Settings link in production context", () => {
      mockUsePathname.mockReturnValue("/");

      render(<Sidebar />);

      const settingsLink = screen.getByRole("link", { name: /settings/i });
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveAttribute("href", "/settings");
    });
  });

  it("renders logo and branding", () => {
    mockUsePathname.mockReturnValue("/");

    render(<Sidebar />);

    expect(screen.getByText("FEEDMILL PRO")).toBeInTheDocument();
  });
});
