import { render, screen } from "@testing-library/react";
import Header from "./Header";

// Mock next/navigation — Header uses usePathname + useRouter
const mockUsePathname = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
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

// Mock notifications service
jest.mock("@/services/notifications", () => ({
  getNotifications: jest.fn().mockResolvedValue([]),
}));

describe("Header getPageTitle", () => {
  const cases: Array<[string, string]> = [
    ["/demo/orders", "Orders"],
    ["/demo/customers", "Customers"],
    ["/demo/customers/CUST-001", "Customers"],
    ["/demo/mill-production", "Mill Production"],
    ["/settings", "Settings"],
    ["/some/unknown/path", "Dashboard"],
  ];

  it.each(cases)("shows %s as title %s", (path, expected) => {
    mockUsePathname.mockReturnValue(path);

    render(<Header />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      expected,
    );
  });

  /**
   * Task 2 TDD RED tests: Header production title updates (Tests 8-11)
   */
  // Test 8: '/' → 'Dashboard' (was 'Coming Soon')
  it("shows 'Dashboard' title for '/' route (Task 2 TDD)", () => {
    mockUsePathname.mockReturnValue("/");

    render(<Header />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dashboard");
  });

  // Test 9: '/import' → 'Import'
  it("shows 'Import' title for '/import' route", () => {
    mockUsePathname.mockReturnValue("/import");

    render(<Header />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Import");
  });

  // Test 10: '/import?foo=bar' — usePathname returns '/import' (no query in pathname)
  it("shows 'Import' title for '/import' even with query in actual URL", () => {
    // next/navigation's usePathname returns pathname without query
    mockUsePathname.mockReturnValue("/import");

    render(<Header />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Import");
  });

  // Test 11 (regression): existing '/demo/orders' returns 'Orders'
  it("still shows 'Orders' for '/demo/orders' (regression)", () => {
    mockUsePathname.mockReturnValue("/demo/orders");

    render(<Header />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Orders");
  });
});
