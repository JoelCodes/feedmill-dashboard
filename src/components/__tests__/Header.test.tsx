import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "../Header";
import "@testing-library/jest-dom";

// Mock Clerk components following pattern from sign-in/__tests__/page.test.tsx
jest.mock("@clerk/nextjs", () => {
  // Create UserButton mock with sub-components inside factory function
  const MockUserButton = ({ appearance, children }: {
    appearance?: unknown;
    children?: React.ReactNode;
  }) => (
    <div data-testid="clerk-userbutton">
      <div data-testid="appearance">{JSON.stringify(appearance !== undefined)}</div>
      <div data-testid="menu-items">{children}</div>
    </div>
  );

  // Add sub-components to UserButton mock
  MockUserButton.MenuItems = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="userbutton-menu-items">{children}</div>
  );

  MockUserButton.Action = ({ label }: { label?: string }) => (
    <div data-testid="userbutton-action" data-label={label}>
      {label}
    </div>
  );

  return {
    UserButton: MockUserButton,
    ClerkLoading: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="clerk-loading">
        <div data-testid="loading-content">{children}</div>
      </div>
    ),
    ClerkLoaded: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="clerk-loaded">
        <div data-testid="loaded-content">{children}</div>
      </div>
    ),
  };
});

// Mock clerk-theme
jest.mock("@/lib/clerk-theme", () => ({
  clerkAppearance: { variables: { colorPrimary: "var(--primary)" } },
}));

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  usePathname: () => "/orders",
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock notifications service
jest.mock("@/services/notifications", () => ({
  getNotifications: () => Promise.resolve([]),
}));

// Mock custom hooks
jest.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

jest.mock("@/hooks/useLocalStorage", () => ({
  useLocalStorage: () => [[], jest.fn()],
}));

describe("Header - UserButton Integration", () => {
  it("renders UserButton wrapped in ClerkLoaded", () => {
    render(<Header />);

    // Verify ClerkLoaded wrapper is present
    const clerkLoaded = screen.getByTestId("clerk-loaded");
    expect(clerkLoaded).toBeInTheDocument();

    // Verify UserButton is inside ClerkLoaded
    const loadedContent = screen.getByTestId("loaded-content");
    const userButton = screen.getByTestId("clerk-userbutton");
    expect(loadedContent).toContainElement(userButton);
  });

  it("passes clerkAppearance to UserButton", () => {
    render(<Header />);

    // Verify appearance prop is passed (truthy check)
    const appearanceElement = screen.getByTestId("appearance");
    expect(appearanceElement).toHaveTextContent("true");
  });

  it("renders MenuItems with signOut action", () => {
    render(<Header />);

    // Per D-03: Minimal dropdown (sign-out only)
    const menuItems = screen.getByTestId("menu-items");
    expect(menuItems).toBeInTheDocument();

    // The menu should contain UserButton.MenuItems with signOut action
    const userButtonMenuItems = screen.getByTestId("userbutton-menu-items");
    expect(userButtonMenuItems).toBeInTheDocument();
  });

  it("renders signOut action with correct label", () => {
    render(<Header />);

    // Per D-03 and D-06: Sign out action is rendered
    const signOutAction = screen.getByTestId("userbutton-action");
    expect(signOutAction).toBeInTheDocument();
    expect(signOutAction).toHaveAttribute("data-label", "signOut");
  });

  it("shows skeleton in ClerkLoading wrapper", () => {
    render(<Header />);

    // Per D-05: ClerkLoading wrapper with skeleton content
    const clerkLoading = screen.getByTestId("clerk-loading");
    expect(clerkLoading).toBeInTheDocument();

    const loadingContent = screen.getByTestId("loading-content");
    expect(loadingContent.innerHTML).toBeTruthy();
  });

  it("skeleton has correct circular dimensions", () => {
    render(<Header />);

    // Per D-04: 32px circular skeleton (h-8 w-8 rounded-full)
    const loadingContent = screen.getByTestId("loading-content");
    const skeleton = loadingContent.firstChild as HTMLElement;

    // Verify skeleton has correct classes
    expect(skeleton).toHaveClass("h-8");
    expect(skeleton).toHaveClass("w-8");
    expect(skeleton).toHaveClass("rounded-full");
    expect(skeleton).toHaveClass("animate-pulse");
  });

  it("renders 'Dashboard' title when pathname is the legacy /orders (dead branch removed)", () => {
    render(<Header />);

    // After D-11 dead branch deletion, /orders falls through to the default 'Dashboard' return.
    // This test fails (RED) while the legacy startsWith('/orders') branch still exists in Header.tsx.
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });
});
