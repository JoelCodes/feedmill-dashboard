import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Input from "./Input";

describe("Input", () => {
  it("renders with default styling", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("border-[var(--divider)]");
  });

  it("shows error border when error prop provided", () => {
    render(<Input placeholder="Enter text" error="This field is required" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toHaveClass("border-[var(--error)]");
  });

  it("shows AlertCircle icon when error prop provided", () => {
    render(<Input placeholder="Enter text" error="This field is required" />);
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("text-[var(--error)]");
  });

  it("has aria-invalid=true when error prop provided", () => {
    render(<Input placeholder="Enter text" error="This field is required" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("has aria-describedby linking to error message", () => {
    render(<Input placeholder="Enter text" error="This field is required" />);
    const input = screen.getByPlaceholderText("Enter text");
    const ariaDescribedBy = input.getAttribute("aria-describedby");
    expect(ariaDescribedBy).toBeTruthy();
    const errorElement = document.getElementById(ariaDescribedBy!);
    expect(errorElement).toHaveTextContent("This field is required");
  });

  it("renders label when label prop provided", () => {
    render(<Input label="Email" placeholder="Enter email" />);
    const label = screen.getByText("Email");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("LABEL");
  });

  it("renders helper text when helperText prop provided", () => {
    render(<Input helperText="Enter a valid email address" placeholder="Email" />);
    const helperText = screen.getByText("Enter a valid email address");
    expect(helperText).toBeInTheDocument();
  });

  it("error message replaces helper text when both provided", () => {
    render(
      <Input
        helperText="Enter a valid email address"
        error="This field is required"
        placeholder="Email"
      />
    );
    expect(screen.getByText("This field is required")).toBeInTheDocument();
    expect(screen.queryByText("Enter a valid email address")).not.toBeInTheDocument();
  });

  it("shows focus ring on focus", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    await user.click(input);
    expect(input).toHaveClass("focus:ring-2");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Input placeholder="Enter text" disabled />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeDisabled();
    expect(input).toHaveClass("disabled:bg-[var(--bg-page)]");
  });
});
