import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
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

describe("Textarea - Accessibility", () => {
  it("has no accessibility violations with label", async () => {
    const { container } = render(
      <Textarea label="Description" placeholder="Enter description" />
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no violations in error state", async () => {
    const { container } = render(
      <Textarea
        label="Description"
        placeholder="Enter description"
        error="Description is required"
      />
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no violations when disabled", async () => {
    const { container } = render(
      <Textarea label="Description" placeholder="Enter description" disabled />
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
