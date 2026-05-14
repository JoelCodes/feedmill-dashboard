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

      // Phase 34: "Coming Soon" is replaced with Dashboard + Import (D-24)
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute("href", "/");

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

/**
 * Task 2 TDD RED tests: Production nav update (D-24, Pitfall 5)
 * Tests 5-7 assert the new production nav items render correctly.
 */
describe("Sidebar - Production nav update (Task 2 TDD)", () => {
  // Test 5: production branch shows Dashboard + Import links
  it("shows Dashboard and Import links in production context (D-24)", () => {
    mockUsePathname.mockReturnValue("/");

    render(<Sidebar />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/");

    const importLink = screen.getByRole("link", { name: /import/i });
    expect(importLink).toBeInTheDocument();
    expect(importLink).toHaveAttribute("href", "/import");
  });

  // Test 6: no "Coming Soon" text in production branch
  it("does not show 'Coming Soon' in production context", () => {
    mockUsePathname.mockReturnValue("/");

    render(<Sidebar />);

    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  // Test 7 (Pitfall 5 regression): with pathname /import, Dashboard does NOT get active style
  it("Dashboard link is NOT active when pathname is /import (exact-match guard, Pitfall 5)", () => {
    mockUsePathname.mockReturnValue("/import");

    render(<Sidebar />);

    // Both links should be present
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    const importLink = screen.getByRole("link", { name: /import/i });

    // Dashboard (href="/") must NOT have active shadow (exact match only)
    // Import (href="/import") should have active shadow
    expect(dashboardLink).not.toHaveClass("shadow-[var(--shadow-card)]");
    // At least the import link should have active styling
    expect(importLink).toHaveClass("shadow-[var(--shadow-card)]");
  });
});
