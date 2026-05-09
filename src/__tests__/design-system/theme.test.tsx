import { render } from "@testing-library/react";
import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider } from "@/components/ThemeProvider";

/**
 * ThemeProvider configuration validation tests.
 *
 * Verifies that ThemeProvider configures next-themes correctly for:
 * - Flash prevention mechanism
 * - Theme persistence via localStorage
 * - System preference detection
 * - Class-based theme switching
 */

// Capture the actual props passed to next-themes ThemeProvider
let capturedProps: ThemeProviderProps | null = null;

jest.mock("next-themes", () => ({
  ThemeProvider: (props: ThemeProviderProps) => {
    capturedProps = props;
    return <div data-testid="mock-theme-provider">{props.children}</div>;
  },
}));

describe("ThemeProvider Configuration", () => {
  beforeEach(() => {
    capturedProps = null;
  });

  it("configures attribute as class for Tailwind CSS 4 compatibility", () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    expect(capturedProps).toBeTruthy();
    expect(capturedProps.attribute).toBe("class");
  });

  it("sets defaultTheme to system to respect OS preference", () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    expect(capturedProps.defaultTheme).toBe("system");
  });

  it("enables system theme detection", () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    expect(capturedProps.enableSystem).toBe(true);
  });

  it("configures project-specific localStorage key for theme persistence", () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    expect(capturedProps.storageKey).toBe("cgm-dashboard-theme");
  });

  it("restricts themes to light, dark, and system only", () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    expect(capturedProps.themes).toEqual(["light", "dark", "system"]);
  });

  it("allows theme transitions for smooth UX", () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    expect(capturedProps.disableTransitionOnChange).toBe(false);
  });

  it("passes children through to next-themes provider", () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Child content</div>
      </ThemeProvider>
    );

    expect(getByText("Child content")).toBeInTheDocument();
  });

  it("allows prop overrides via spread operator", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <div>Test</div>
      </ThemeProvider>
    );

    // Props can be overridden - spread operator is after static config
    expect(capturedProps.defaultTheme).toBe("dark");
  });
});
