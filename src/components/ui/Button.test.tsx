import { render, screen } from "@testing-library/react";
import Button from "./Button";

describe("Button", () => {
  // Test 1: Button renders with primary variant classes by default
  it("renders with primary variant classes by default", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveClass("bg-[var(--primary)]");
  });

  // Test 2: Button renders with secondary variant classes
  it("renders with secondary variant classes", () => {
    render(<Button variant="secondary">Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveClass("bg-[var(--bg-card)]");
    expect(button).toHaveClass("border-[var(--divider)]");
  });

  // Test 3: Button renders with ghost variant classes
  it("renders with ghost variant classes", () => {
    render(<Button variant="ghost">Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveClass("bg-transparent");
  });

  // Test 4: Button renders with destructive variant classes
  it("renders with destructive variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toHaveClass("bg-[var(--error)]");
  });

  // Test 5: Button renders with sm size
  it("renders with sm size", () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole("button", { name: /small/i });
    expect(button).toHaveClass("h-8");
    expect(button).toHaveClass("px-3");
    expect(button).toHaveClass("text-sm");
  });

  // Test 6: Button renders with md size
  it("renders with md size", () => {
    render(<Button size="md">Medium</Button>);
    const button = screen.getByRole("button", { name: /medium/i });
    expect(button).toHaveClass("h-10");
    expect(button).toHaveClass("px-4");
    expect(button).toHaveClass("text-base");
  });

  // Test 7: Button renders with lg size
  it("renders with lg size", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button", { name: /large/i });
    expect(button).toHaveClass("h-12");
    expect(button).toHaveClass("px-6");
    expect(button).toHaveClass("text-lg");
  });

  // Test 8: Button is disabled when disabled prop is true
  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  // Test 9: Button shows loading state with aria-busy="true" and is disabled
  it("shows loading state with aria-busy and is disabled", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button", { name: /loading/i });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
  });

  // Test 10: Button renders icon when provided
  it("renders icon when provided", () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(<Button icon={<TestIcon />}>With Icon</Button>);
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  // Test 11: Button allows className override via cn() merge
  it("allows className override via cn() merge", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button", { name: /custom/i });
    expect(button).toHaveClass("custom-class");
    // Should still have base classes
    expect(button).toHaveClass("bg-[var(--primary)]");
  });
});
