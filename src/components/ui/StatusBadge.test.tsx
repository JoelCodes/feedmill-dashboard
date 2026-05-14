import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import StatusBadge, { STATUS_CONFIG } from "./StatusBadge";
import { OrderStatus } from "@/types/order";
import type { ProductionState } from "@/db/schema/orders";

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
      Object.values(STATUS_CONFIG).forEach((config) => {
        expect(config.bg).toMatch(/var\(--/);
        expect(config.text).toMatch(/var\(--/);
        expect(config.dot).toMatch(/var\(--/);
        expect(config.countBg).toMatch(/var\(--/);
      });
    });

    it("contains no hardcoded hex values", () => {
      Object.values(STATUS_CONFIG).forEach((config) => {
        expect(config.bg).not.toMatch(/#[0-9a-fA-F]/);
        expect(config.text).not.toMatch(/#[0-9a-fA-F]/);
        expect(config.dot).not.toMatch(/#[0-9a-fA-F]/);
        expect(config.countBg).not.toMatch(/#[0-9a-fA-F]/);
      });
    });

    it("contains no hardcoded Tailwind gray classes", () => {
      Object.values(STATUS_CONFIG).forEach((config) => {
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

/**
 * Task 2 TDD RED tests: ProductionState support in StatusBadge
 * Tests 1-4 assert the new ProductionState badges render correctly.
 * Test 4 is a regression test for existing OrderStatus values.
 */
describe("StatusBadge - ProductionState support (Task 2 TDD)", () => {
  // Test 1: Mixing renders correctly
  it("renders Mixing status without throwing and shows label text", () => {
    render(<StatusBadge status={"Mixing" as ProductionState} />);
    const badge = screen.getByText("Mixing").closest("div");
    expect(badge).toBeInTheDocument();
  });

  // Test 2: Blocked renders the blocked variant
  it("renders Blocked status with error/blocked CSS token", () => {
    const { container } = render(<StatusBadge status={"Blocked" as ProductionState} />);
    // The badge should reference error/blocked design tokens
    const badge = container.querySelector("div");
    const classNames = badge?.className ?? "";
    expect(
      classNames.includes("bg-[var(--error-light)]") ||
      classNames.includes("error") ||
      classNames.includes("blocked")
    ).toBe(true);
  });

  // Test 3: Pending and Completed both render their literal label text
  it("renders Pending and Completed ProductionState labels", () => {
    const { unmount } = render(<StatusBadge status={"Pending" as ProductionState} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    unmount();

    render(<StatusBadge status={"Completed" as ProductionState} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  // Test 4 (regression): existing OrderStatus cases still render
  it("still renders all OrderStatus cases correctly (regression)", () => {
    const orderStatuses: OrderStatus[] = ["Producing", "Ready", "In Transit", "Complete", "Pending"];
    orderStatuses.forEach((status) => {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(STATUS_CONFIG[status].label)).toBeInTheDocument();
      unmount();
    });
  });
});

describe("StatusBadge - Accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<StatusBadge status="Pending" />);
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no violations for each status variant", async () => {
    const statuses: OrderStatus[] = ["Pending", "Producing", "Ready", "In Transit", "Complete"];
    for (const status of statuses) {
      const { container } = render(<StatusBadge status={status} />);
      const results = await axe(container, {
        rules: { region: { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    }
  });
});
