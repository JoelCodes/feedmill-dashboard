import { render, screen } from "@testing-library/react";
import StatusBadge, { STATUS_CONFIG } from "./StatusBadge";
import { OrderStatus } from "@/types/order";

describe("StatusBadge", () => {
  describe("Token usage for each status", () => {
    it("renders Pending status with design tokens (not hardcoded gray)", () => {
      render(<StatusBadge status="Pending" />);
      const badge = screen.getByText("Pending").closest("div");
      expect(badge).toHaveClass("bg-[var(--pending-light)]");
      expect(badge?.textContent).toContain("Pending");
    });

    it("renders Producing status with design tokens", () => {
      render(<StatusBadge status="Producing" />);
      const badge = screen.getByText("Producing").closest("div");
      expect(badge).toHaveClass("bg-[var(--warning-light)]");
    });

    it("renders Ready status with design tokens", () => {
      render(<StatusBadge status="Ready" />);
      const badge = screen.getByText("Ready").closest("div");
      expect(badge).toHaveClass("bg-[var(--info-light)]");
    });

    it('renders "In Transit" status with design tokens', () => {
      render(<StatusBadge status="In Transit" />);
      const badge = screen.getByText("Transit").closest("div");
      expect(badge).toHaveClass("bg-[var(--purple-light)]");
    });

    it("renders Complete status with design tokens", () => {
      render(<StatusBadge status="Complete" />);
      const badge = screen.getByText("Complete").closest("div");
      expect(badge).toHaveClass("bg-[var(--success-light)]");
    });
  });

  describe("STATUS_CONFIG token verification", () => {
    it("uses var(--) syntax for all color values", () => {
      Object.entries(STATUS_CONFIG).forEach(([status, config]) => {
        expect(config.bg).toMatch(/var\(--/);
        expect(config.text).toMatch(/var\(--/);
        expect(config.dot).toMatch(/var\(--/);
        expect(config.countBg).toMatch(/var\(--/);
      });
    });

    it("contains no hardcoded hex values", () => {
      Object.entries(STATUS_CONFIG).forEach(([status, config]) => {
        expect(config.bg).not.toMatch(/#[0-9a-fA-F]/);
        expect(config.text).not.toMatch(/#[0-9a-fA-F]/);
        expect(config.dot).not.toMatch(/#[0-9a-fA-F]/);
        expect(config.countBg).not.toMatch(/#[0-9a-fA-F]/);
      });
    });

    it("contains no hardcoded Tailwind gray classes", () => {
      Object.entries(STATUS_CONFIG).forEach(([status, config]) => {
        expect(config.bg).not.toMatch(/bg-gray-/);
        expect(config.text).not.toMatch(/text-gray-/);
        expect(config.dot).not.toMatch(/bg-gray-/);
        expect(config.countBg).not.toMatch(/bg-gray-/);
      });
    });
  });

  describe("API preservation", () => {
    it("accepts status prop of type OrderStatus", () => {
      const statuses: OrderStatus[] = [
        "Pending",
        "Producing",
        "Ready",
        "In Transit",
        "Complete",
      ];

      statuses.forEach((status) => {
        const { unmount } = render(<StatusBadge status={status} />);
        expect(screen.getByText(STATUS_CONFIG[status].label)).toBeInTheDocument();
        unmount();
      });
    });

    it("exports STATUS_CONFIG with all OrderStatus keys", () => {
      const expectedKeys: OrderStatus[] = [
        "Pending",
        "Producing",
        "Ready",
        "In Transit",
        "Complete",
      ];

      expectedKeys.forEach((key) => {
        expect(STATUS_CONFIG[key]).toBeDefined();
        expect(STATUS_CONFIG[key]).toHaveProperty("bg");
        expect(STATUS_CONFIG[key]).toHaveProperty("text");
        expect(STATUS_CONFIG[key]).toHaveProperty("dot");
        expect(STATUS_CONFIG[key]).toHaveProperty("countBg");
        expect(STATUS_CONFIG[key]).toHaveProperty("label");
      });
    });
  });
});
