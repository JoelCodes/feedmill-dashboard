import React from "react";
import { render, screen } from "@testing-library/react";
import SignInPage from "../[[...sign-in]]/page";
import "@testing-library/jest-dom";

// Mock Clerk components
interface MockSignInProps {
  appearance?: unknown;
  routing?: string;
  path?: string;
  signUpUrl?: string;
  fallbackRedirectUrl?: string;
}

jest.mock("@clerk/nextjs", () => ({
  SignIn: ({ appearance, routing, path, signUpUrl, fallbackRedirectUrl }: MockSignInProps) => (
    <div data-testid="clerk-signin">
      <div data-testid="appearance">{JSON.stringify(appearance !== undefined)}</div>
      <div data-testid="routing">{routing}</div>
      <div data-testid="path">{path}</div>
      <div data-testid="signup-url">{signUpUrl}</div>
      <div data-testid="fallback-redirect">{fallbackRedirectUrl}</div>
    </div>
  ),
}));

// Mock clerk-theme
jest.mock("@/lib/clerk-theme", () => ({
  clerkAppearance: { variables: { colorPrimary: "var(--primary)" } },
}));

describe("SignInPage", () => {
  it("renders sign-in page with CGM Dashboard branding", () => {
    render(<SignInPage />);

    // Verify branding text is present
    expect(screen.getByText("CGM DASHBOARD")).toBeInTheDocument();
  });

  it("displays logo square with primary color background", () => {
    const { container } = render(<SignInPage />);

    // Find the logo div by class pattern
    const logo = container.querySelector(".bg-\\[var\\(--primary\\)\\]");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass("h-8", "w-8", "rounded-lg");
  });

  it("renders Clerk SignIn component with themed appearance", () => {
    render(<SignInPage />);

    const signInComponent = screen.getByTestId("clerk-signin");
    expect(signInComponent).toBeInTheDocument();

    // Verify appearance prop is passed
    expect(screen.getByTestId("appearance")).toHaveTextContent("true");
  });

  it("configures SignIn with correct routing props", () => {
    render(<SignInPage />);

    expect(screen.getByTestId("routing")).toHaveTextContent("path");
    expect(screen.getByTestId("path")).toHaveTextContent("/sign-in");
  });

  it("configures SignIn with fallback redirect to root", () => {
    render(<SignInPage />);

    // Per D-06, D-07: direct navigation should redirect to /
    expect(screen.getByTestId("fallback-redirect")).toHaveTextContent("/");
  });

  it("configures SignIn with sign-up URL for future sign-up page", () => {
    render(<SignInPage />);

    // Per D-05: sign-up page is deferred but link is preserved
    expect(screen.getByTestId("signup-url")).toHaveTextContent("/sign-up");
  });

  it("uses theme-aware page background", () => {
    const { container } = render(<SignInPage />);

    const pageContainer = container.querySelector(".bg-\\[var\\(--bg-page\\)\\]");
    expect(pageContainer).toBeInTheDocument();
  });

  it("centers content vertically and horizontally", () => {
    const { container } = render(<SignInPage />);

    const pageContainer = container.querySelector(".flex.min-h-screen");
    expect(pageContainer).toBeInTheDocument();
    expect(pageContainer).toHaveClass("items-center", "justify-center");
  });

  it("positions branding above SignIn component", () => {
    render(<SignInPage />);

    const branding = screen.getByText("CGM DASHBOARD").parentElement;
    const signIn = screen.getByTestId("clerk-signin");

    // Both should be children of the same container
    expect(branding?.parentElement).toBe(signIn.parentElement);

    // Branding should have margin-bottom to separate from SignIn
    expect(branding).toHaveClass("mb-8");
  });
});
