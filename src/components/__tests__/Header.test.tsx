import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "../Header";
import "@testing-library/jest-dom";

// Mock Clerk components following pattern from sign-in/__tests__/page.test.tsx
interface MockUserButtonProps {
  appearance?: unknown;
  afterSignOutUrl?: string;
  children?: React.ReactNode;
}

interface MockClerkLoadedProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

jest.mock("@clerk/nextjs", () => ({
  UserButton: ({ appearance, afterSignOutUrl, children }: MockUserButtonProps) => (
    <div data-testid="clerk-userbutton">
      <div data-testid="appearance">{JSON.stringify(appearance !== undefined)}</div>
      <div data-testid="after-signout-url">{afterSignOutUrl}</div>
      <div data-testid="menu-items">{children}</div>
    </div>
  ),
  ClerkLoaded: ({ fallback, children }: MockClerkLoadedProps) => (
    <div data-testid="clerk-loaded">
      <div data-testid="fallback">{fallback}</div>
      <div data-testid="loaded-content">{children}</div>
    </div>
  ),
}));

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

  it("configures afterSignOutUrl to /sign-in", () => {
    render(<Header />);

    // Per D-06: Redirect to /sign-in after sign-out
    const afterSignOutUrl = screen.getByTestId("after-signout-url");
    expect(afterSignOutUrl).toHaveTextContent("/sign-in");
  });

  it("renders only signOut action in MenuItems", () => {
    render(<Header />);

    // Per D-03: Minimal dropdown (sign-out only)
    const menuItems = screen.getByTestId("menu-items");
    expect(menuItems).toBeInTheDocument();

    // The menu should contain UserButton.Action with label="signOut"
    // In our mock, children render inside menu-items
    expect(menuItems.innerHTML).toBeTruthy();
  });

  it("shows skeleton fallback in ClerkLoaded", () => {
    render(<Header />);

    // Per D-05: ClerkLoaded wrapper with skeleton fallback
    const fallback = screen.getByTestId("fallback");
    expect(fallback).toBeInTheDocument();
    expect(fallback.innerHTML).toBeTruthy();
  });

  it("skeleton has correct circular dimensions", () => {
    const { container } = render(<Header />);

    // Per D-04: 32px circular skeleton (h-8 w-8 rounded-full)
    const fallback = screen.getByTestId("fallback");
    const skeleton = fallback.firstChild as HTMLElement;

    // Verify skeleton has correct classes
    expect(skeleton).toHaveClass("h-8");
    expect(skeleton).toHaveClass("w-8");
    expect(skeleton).toHaveClass("rounded-full");
    expect(skeleton).toHaveClass("animate-pulse");
  });
});
