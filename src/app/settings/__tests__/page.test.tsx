import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "../page";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => "/settings"),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("SettingsPage - MIG-04 Design System Migration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe("Design system component usage", () => {
    it("renders ThemeToggle component from design system", () => {
      render(<SettingsPage />);

      // ThemeToggle should be present (verify by checking theme section)
      expect(screen.getByText("Theme")).toBeInTheDocument();

      // ThemeToggle renders buttons for theme switching
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("renders Select component for Display Density", () => {
      render(<SettingsPage />);

      expect(screen.getByText("Display Density")).toBeInTheDocument();

      // Select component should render as a native select element
      const select = screen.getByLabelText("Display Density");
      expect(select).toBeInTheDocument();
      expect(select.tagName).toBe("SELECT");
    });

    it("renders Button component for Save Preferences", () => {
      render(<SettingsPage />);

      const saveButton = screen.getByText("Save Preferences");
      expect(saveButton).toBeInTheDocument();
      expect(saveButton.tagName).toBe("BUTTON");
    });

    it("Select component has Comfortable and Compact options", () => {
      render(<SettingsPage />);

      const select = screen.getByLabelText("Display Density") as HTMLSelectElement;
      const options = Array.from(select.options).map(opt => opt.value);

      expect(options).toContain("comfortable");
      expect(options).toContain("compact");
    });
  });

  describe("No hardcoded styling", () => {
    it("does not use hardcoded border-gray-300 class", () => {
      const { container } = render(<SettingsPage />);

      const hardcodedBorder = container.querySelectorAll(".border-gray-300");
      expect(hardcodedBorder.length).toBe(0);
    });

    it("does not use native select styling (bg-white px-3 py-2)", () => {
      const { container } = render(<SettingsPage />);

      // Check that we're not using the old native select pattern
      const selects = container.querySelectorAll("select");
      selects.forEach(select => {
        const classes = select.className;
        // The old pattern had "bg-white px-3 py-2" - should not exist
        const hasOldPattern = classes.includes("bg-white") &&
                             classes.includes("px-3") &&
                             classes.includes("py-2");
        expect(hasOldPattern).toBe(false);
      });
    });

    it("uses design tokens for checkbox accent color", () => {
      const { container } = render(<SettingsPage />);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        expect(checkbox.className).toMatch(/accent-\[var\(--primary\)\]/);
      });
    });
  });

  describe("Form state management", () => {
    it("Save button is disabled when no changes made", () => {
      render(<SettingsPage />);

      const saveButton = screen.getByText("Save Preferences");
      expect(saveButton).toBeDisabled();
    });

    it("Save button enables when density is changed", async () => {
      render(<SettingsPage />);

      const saveButton = screen.getByText("Save Preferences");
      expect(saveButton).toBeDisabled();

      const select = screen.getByLabelText("Display Density") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "compact" } });

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });

    it("Save button enables when notification setting is changed", async () => {
      render(<SettingsPage />);

      const saveButton = screen.getByText("Save Preferences");
      expect(saveButton).toBeDisabled();

      const checkbox = screen.getByLabelText("Order Status Updates") as HTMLInputElement;
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe("Notification preferences", () => {
    it("renders all three notification checkboxes", () => {
      render(<SettingsPage />);

      expect(screen.getByText("Order Status Updates")).toBeInTheDocument();
      expect(screen.getByText("Alerts")).toBeInTheDocument();
      expect(screen.getByText("System Messages")).toBeInTheDocument();
    });

    it("notification checkboxes are interactive", () => {
      render(<SettingsPage />);

      const orderStatusCheckbox = screen.getByLabelText("Order Status Updates") as HTMLInputElement;
      const alertsCheckbox = screen.getByLabelText("Alerts") as HTMLInputElement;
      const systemCheckbox = screen.getByLabelText("System Messages") as HTMLInputElement;

      // Default state (all enabled from defaultPreferences)
      expect(orderStatusCheckbox.checked).toBe(true);
      expect(alertsCheckbox.checked).toBe(true);
      expect(systemCheckbox.checked).toBe(true);

      // Toggle one checkbox
      fireEvent.click(orderStatusCheckbox);
      expect(orderStatusCheckbox.checked).toBe(false);
    });
  });

  describe("Theme toggle integration", () => {
    it("renders theme toggle component in Display Settings section", () => {
      render(<SettingsPage />);

      // Both "Theme" label and ThemeToggle component should be present
      const displaySettings = screen.getByText("Display Settings").closest("section");
      const themeLabel = screen.getByText("Theme");

      expect(displaySettings).toContainElement(themeLabel);
    });

    it("does not render old theme select dropdown", () => {
      const { container } = render(<SettingsPage />);

      // Should not have a select with Light/Dark options
      const selects = container.querySelectorAll("select");
      selects.forEach(select => {
        const options = Array.from(select.options).map(opt => opt.value);
        // Should not have 'light' and 'dark' values (that's the old theme select)
        const hasThemeOptions = options.includes("light") && options.includes("dark");
        expect(hasThemeOptions).toBe(false);
      });
    });
  });
});
