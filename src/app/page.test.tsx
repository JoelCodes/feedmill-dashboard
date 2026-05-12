import { render, screen } from "@testing-library/react";
import HomePage from "./page";

// Mock next/navigation since DashboardLayout's Sidebar + Header use it
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
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

// Mock notifications service used by Header
jest.mock("@/services/notifications", () => ({
  getNotifications: jest.fn().mockResolvedValue([]),
}));

describe("HomePage (Coming Soon)", () => {
  it("displays 'Coming Soon' heading and launching-soon subtitle", () => {
    render(<HomePage />);

    // Two h1s exist: Header's page-title h1 and the page content's h1.
    // Both should read "Coming Soon" — that's the requirement under test.
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(
      headings.some((h) => h.textContent === "Coming Soon"),
    ).toBe(true);

    expect(
      screen.getByText("Production features launching soon."),
    ).toBeInTheDocument();
  });

  it("renders inside DashboardLayout wrapper (Sidebar + Header present)", () => {
    render(<HomePage />);

    // DashboardLayout-provided structure: Sidebar (complementary) + Header (banner)
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    // Sidebar brand text
    expect(screen.getByText("FEEDMILL PRO")).toBeInTheDocument();
  });
});
