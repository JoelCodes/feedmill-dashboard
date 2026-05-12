import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MillProductionUI from "../MillProductionUI";
import { ProductionOrder } from "@/types/millProduction";

// Distribute orders across all four states and all three mill lines so the
// state-count assertions are meaningful and column-rendering can be observed.
const mockOrders: ProductionOrder[] = [
  // Premix
  {
    id: "P1",
    orderNumber: "P-001",
    customer: "Premix Mixing Co",
    product: "Premix Grower",
    weightLbs: 5000,
    deliveryTime: "6:00 AM",
    state: "Mixing",
    millLine: "Premix",
  },
  {
    id: "P2",
    orderNumber: "P-002",
    customer: "Premix Completed Co",
    product: "Premix Layer",
    weightLbs: 6000,
    deliveryTime: "7:00 AM",
    state: "Completed",
    millLine: "Premix",
  },
  {
    id: "P3",
    orderNumber: "P-003",
    customer: "Premix Pending Co",
    product: "Premix Starter",
    weightLbs: 3000,
    deliveryTime: "8:00 AM",
    state: "Pending",
    millLine: "Premix",
  },
  // Excel
  {
    id: "E1",
    orderNumber: "E-001",
    customer: "Excel Mixing Co",
    product: "Excel Mash",
    weightLbs: 4000,
    deliveryTime: "9:00 AM",
    state: "Mixing",
    millLine: "Excel",
  },
  {
    id: "E2",
    orderNumber: "E-002",
    customer: "Excel Blocked Co",
    product: "Excel Pellet",
    weightLbs: 5000,
    deliveryTime: "10:00 AM",
    state: "Blocked",
    millLine: "Excel",
  },
  // CGM
  {
    id: "C1",
    orderNumber: "C-001",
    customer: "CGM Completed Co",
    product: "CGM Broiler Grower",
    weightLbs: 12000,
    deliveryTime: "11:00 AM",
    state: "Completed",
    millLine: "CGM",
  },
  {
    id: "C2",
    orderNumber: "C-002",
    customer: "CGM Pending Co",
    product: "CGM Starter",
    weightLbs: 9000,
    deliveryTime: "12:00 PM",
    state: "Pending",
    millLine: "CGM",
  },
];

describe("MillProductionUI", () => {
  it("renders the three mill column headings when given a non-empty orders fixture", () => {
    render(<MillProductionUI orders={mockOrders} />);

    expect(screen.getByRole("heading", { name: "Premix" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Excel" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CGM" })).toBeInTheDocument();
  });

  it("renders filter pill state counts that match the fixture", () => {
    render(<MillProductionUI orders={mockOrders} />);

    // Counts in fixture: Mixing=2, Completed=2, Blocked=1, Pending=2
    const mixingPill = screen.getByRole("button", { name: /Filter by Mixing/i });
    const completedPill = screen.getByRole("button", { name: /Filter by Completed/i });
    const blockedPill = screen.getByRole("button", { name: /Filter by Blocked/i });
    const pendingPill = screen.getByRole("button", { name: /Filter by Pending/i });

    expect(mixingPill).toHaveTextContent("2");
    expect(completedPill).toHaveTextContent("2");
    expect(blockedPill).toHaveTextContent("1");
    expect(pendingPill).toHaveTextContent("2");
  });

  it("clicking a filter pill toggles its active state and filters the rendered orders", async () => {
    const user = userEvent.setup();
    render(<MillProductionUI orders={mockOrders} />);

    // Before filter: Mixing customer and a non-Mixing customer both render.
    expect(screen.getByText("Premix Mixing Co")).toBeInTheDocument();
    expect(screen.getByText("Premix Completed Co")).toBeInTheDocument();

    // Click the Mixing filter pill.
    const mixingPill = screen.getByRole("button", { name: /Filter by Mixing/i });
    await user.click(mixingPill);

    // Aria-pressed flips, non-Mixing orders disappear.
    expect(mixingPill).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Premix Mixing Co")).toBeInTheDocument();
    expect(screen.getByText("Excel Mixing Co")).toBeInTheDocument();
    expect(screen.queryByText("Premix Completed Co")).not.toBeInTheDocument();
    expect(screen.queryByText("Premix Pending Co")).not.toBeInTheDocument();
    expect(screen.queryByText("Excel Blocked Co")).not.toBeInTheDocument();
  });

  it("renders the filter strip but no ProductionCards when orders is empty", () => {
    const { container } = render(<MillProductionUI orders={[]} />);

    // Filter pills still render (one per state).
    expect(screen.getByRole("button", { name: /Filter by Mixing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filter by Completed/i })).toBeInTheDocument();

    // No production cards (cards have the shadow-card class).
    const cards = container.querySelectorAll(".shadow-card");
    expect(cards.length).toBe(0);

    // Counts on every pill are zero.
    expect(screen.getByRole("button", { name: /Filter by Mixing/i })).toHaveTextContent("0");
    expect(screen.getByRole("button", { name: /Filter by Completed/i })).toHaveTextContent("0");

    // LoadingSkeleton must NOT appear — it was dropped in the refactor.
    expect(container.querySelectorAll(".animate-pulse").length).toBe(0);
  });

  it("filter-pill clicks are cumulative and toggling the same pill twice clears it", async () => {
    const user = userEvent.setup();
    render(<MillProductionUI orders={mockOrders} />);

    const mixingPill = screen.getByRole("button", { name: /Filter by Mixing/i });
    const completedPill = screen.getByRole("button", { name: /Filter by Completed/i });

    // Click Mixing — only Mixing-state orders show.
    await user.click(mixingPill);
    expect(screen.queryByText("Premix Completed Co")).not.toBeInTheDocument();

    // Click Completed — now Mixing AND Completed orders show (cumulative).
    await user.click(completedPill);
    expect(mixingPill).toHaveAttribute("aria-pressed", "true");
    expect(completedPill).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Premix Mixing Co")).toBeInTheDocument();
    expect(screen.getByText("Premix Completed Co")).toBeInTheDocument();
    expect(screen.queryByText("Premix Pending Co")).not.toBeInTheDocument();

    // Click Mixing again — toggles off; only Completed remains.
    await user.click(mixingPill);
    expect(mixingPill).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Premix Mixing Co")).not.toBeInTheDocument();
    expect(screen.getByText("Premix Completed Co")).toBeInTheDocument();
  });

  it("ProductionCard border uses design tokens (var(--status-*-border)), not hardcoded grays", () => {
    const { container } = render(<MillProductionUI orders={mockOrders} />);

    // The Completed-state ProductionCard's vertical border swatch must use a
    // design-token background colour (e.g. `var(--status-completed-border)`),
    // proving the STATE_COLORS map carried over verbatim from the original
    // page. There should be no hardcoded `bg-gray-200` anywhere in the output.
    const tokenBordered = Array.from(container.querySelectorAll("div"))
      .filter((el) => {
        const bg = (el as HTMLElement).style.backgroundColor;
        return typeof bg === "string" && bg.includes("var(--status-");
      });
    expect(tokenBordered.length).toBeGreaterThan(0);

    expect(container.querySelectorAll(".bg-gray-200").length).toBe(0);
  });
});
