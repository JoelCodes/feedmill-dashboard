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
    ["/", "Coming Soon"],
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
});
