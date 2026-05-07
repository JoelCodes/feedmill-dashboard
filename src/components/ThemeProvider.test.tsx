import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider";

// Mock next-themes since it requires browser APIs
jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-theme-provider">{children}</div>
  ),
}));

describe("ThemeProvider", () => {
  it("renders children", () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("wraps children in theme provider", () => {
    render(
      <ThemeProvider>
        <span>Content</span>
      </ThemeProvider>
    );

    expect(screen.getByTestId("mock-theme-provider")).toBeInTheDocument();
  });
});
