import { render, screen } from "@testing-library/react";
import Textarea from "./Textarea";

describe("Textarea", () => {
  it("renders with vertical resize only", () => {
    render(<Textarea placeholder="Enter text" />);
    const textarea = screen.getByPlaceholderText("Enter text");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveClass("resize-y");
  });

  it("has min-height of 100px", () => {
    render(<Textarea placeholder="Enter text" />);
    const textarea = screen.getByPlaceholderText("Enter text");
    expect(textarea).toHaveClass("min-h-[100px]");
  });

  it("shows error border when error prop provided", () => {
    render(<Textarea placeholder="Enter text" error="This field is required" />);
    const textarea = screen.getByPlaceholderText("Enter text");
    expect(textarea).toHaveClass("border-[var(--error)]");
  });

  it("has aria-invalid=true when error prop provided", () => {
    render(<Textarea placeholder="Enter text" error="This field is required" />);
    const textarea = screen.getByPlaceholderText("Enter text");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
  });

  it("renders label when label prop provided", () => {
    render(<Textarea label="Description" placeholder="Enter description" />);
    const label = screen.getByText("Description");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("LABEL");
  });

  it("renders error message when error prop provided", () => {
    render(<Textarea placeholder="Enter text" error="This field is required" />);
    const errorMessage = screen.getByText("This field is required");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute("role", "alert");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Textarea placeholder="Enter text" disabled />);
    const textarea = screen.getByPlaceholderText("Enter text");
    expect(textarea).toBeDisabled();
  });
});
