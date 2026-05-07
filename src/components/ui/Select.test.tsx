import { render, screen } from "@testing-library/react";
import Select from "./Select";

describe("Select", () => {
  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
  ];

  it("renders options from options prop", () => {
    render(<Select options={options} />);
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("shows ChevronDown icon", () => {
    render(<Select options={options} />);
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("shows error border when error prop provided", () => {
    render(<Select options={options} error="This field is required" />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveClass("border-[var(--error)]");
  });

  it("has aria-invalid=true when error prop provided", () => {
    render(<Select options={options} error="This field is required" />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveAttribute("aria-invalid", "true");
  });

  it("renders label when label prop provided", () => {
    render(<Select label="Category" options={options} />);
    const label = screen.getByText("Category");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("LABEL");
  });

  it("renders error message when error prop provided", () => {
    render(<Select options={options} error="This field is required" />);
    const errorMessage = screen.getByText("This field is required");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute("role", "alert");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Select options={options} disabled />);
    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();
  });
});
