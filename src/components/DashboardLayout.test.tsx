import { render, screen } from "@testing-library/react";
import DashboardLayout from "./DashboardLayout";

// Mock next/navigation since Sidebar and Header use usePathname
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

// Mock services used by Header
jest.mock("@/services/notifications", () => ({
  getNotifications: jest.fn().mockResolvedValue([]),
}));

describe("DashboardLayout", () => {
  it("renders children", () => {
    render(
      <DashboardLayout>
        <div data-testid="child">Test content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders Sidebar component", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Sidebar renders an aside element with the logo text
    expect(screen.getByText("FEEDMILL PRO")).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });

  it("renders Header component", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Header renders a header element with page title and search
    expect(screen.getByRole("banner")).toBeInTheDocument();
    // Use heading role to find the page title in Header
    // Note: "/" now shows "Coming Soon" after route restructuring (Phase 26)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Coming Soon");
  });

  it("has correct layout structure", () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Outer div has flex and h-screen classes
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass("flex");
    expect(outerDiv).toHaveClass("h-screen");
  });
});
