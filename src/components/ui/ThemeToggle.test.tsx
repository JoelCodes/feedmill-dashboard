import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "next-themes";

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe("ThemeToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders three options (Light, Dark, System)", () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: jest.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
      resolvedTheme: "light",
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);

    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("calls setTheme('light') when Light option clicked", () => {
    const mockSetTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
      resolvedTheme: "dark",
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);

    const lightButton = screen.getByText("Light").closest("button");
    fireEvent.click(lightButton!);

    expect(mockSetTheme).toHaveBeenCalledWith("light");
    expect(mockSetTheme).toHaveBeenCalledTimes(1);
  });

  it("calls setTheme('dark') when Dark option clicked", () => {
    const mockSetTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
      resolvedTheme: "light",
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);

    const darkButton = screen.getByText("Dark").closest("button");
    fireEvent.click(darkButton!);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
    expect(mockSetTheme).toHaveBeenCalledTimes(1);
  });

  it("calls setTheme('system') when System option clicked", () => {
    const mockSetTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
      resolvedTheme: "light",
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);

    const systemButton = screen.getByText("System").closest("button");
    fireEvent.click(systemButton!);

    expect(mockSetTheme).toHaveBeenCalledWith("system");
    expect(mockSetTheme).toHaveBeenCalledTimes(1);
  });

  it("active option has aria-checked='true'", () => {
    mockUseTheme.mockReturnValue({
      theme: "dark",
      setTheme: jest.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
      resolvedTheme: "dark",
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);

    const lightButton = screen.getByText("Light").closest("button");
    const darkButton = screen.getByText("Dark").closest("button");
    const systemButton = screen.getByText("System").closest("button");

    expect(lightButton).toHaveAttribute("aria-checked", "false");
    expect(darkButton).toHaveAttribute("aria-checked", "true");
    expect(systemButton).toHaveAttribute("aria-checked", "false");
  });

  it("container has role='radiogroup' with aria-label", () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: jest.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
      resolvedTheme: "light",
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);

    const container = screen.getByRole("radiogroup");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-label", "Theme selection");
  });

  it("each option has role='radio'", () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: jest.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
      resolvedTheme: "light",
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);

    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons).toHaveLength(3);
  });
});

describe("ThemeToggle - Accessibility", () => {
  it("has no accessibility violations", async () => {
    (useTheme as jest.MockedFunction<typeof useTheme>).mockReturnValue({
      theme: "light",
      setTheme: jest.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
      resolvedTheme: "light",
      forcedTheme: undefined,
    });

    const { container } = render(<ThemeToggle />);
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
