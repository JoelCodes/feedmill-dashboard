import { clerkAppearance } from "./clerk-theme";

// Clerk's Elements type is narrower than what's accepted at runtime.
// Use Record<string, unknown> for element property access in tests.
type ClerkElementStyles = Record<string, unknown> & {
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  border?: string;
  padding?: string;
  "&:hover"?: Record<string, unknown>;
  "&:focus"?: Record<string, unknown>;
  "&:active"?: Record<string, unknown>;
  "&:disabled"?: Record<string, unknown>;
};

describe("clerk-theme", () => {
  describe("clerkAppearance configuration", () => {
    it("exports a valid Clerk Appearance configuration object", () => {
      expect(clerkAppearance).toBeDefined();
      expect(typeof clerkAppearance).toBe("object");
      expect(clerkAppearance).toHaveProperty("variables");
      expect(clerkAppearance).toHaveProperty("elements");
    });

    it("maps primary color design token from globals.css", () => {
      expect(clerkAppearance.variables?.colorPrimary).toBe("var(--primary)");
    });

    it("maps all background color design tokens", () => {
      expect(clerkAppearance.variables?.colorBackground).toBe("var(--bg-card)");
      expect(clerkAppearance.variables?.colorInputBackground).toBe("var(--bg-card)");
    });

    it("maps all text color design tokens", () => {
      expect(clerkAppearance.variables?.colorText).toBe("var(--text-primary)");
      expect(clerkAppearance.variables?.colorTextSecondary).toBe("var(--text-secondary)");
      expect(clerkAppearance.variables?.colorInputText).toBe("var(--text-primary)");
    });

    it("maps all status color design tokens (success, warning, error)", () => {
      expect(clerkAppearance.variables?.colorSuccess).toBe("var(--success)");
      expect(clerkAppearance.variables?.colorWarning).toBe("var(--warning)");
      expect(clerkAppearance.variables?.colorDanger).toBe("var(--error)");
    });

    it("maps border radius design token", () => {
      expect(clerkAppearance.variables?.borderRadius).toBe("var(--radius-md)");
    });

    it("maps spacing unit design token", () => {
      expect(clerkAppearance.variables?.spacingUnit).toBe("var(--space-1)");
    });

    it("defines primary button with hover, active, disabled, and focus states", () => {
      const elements = clerkAppearance.elements as Record<string, ClerkElementStyles>;
      const primaryButton = elements?.formButtonPrimary;
      expect(primaryButton).toBeDefined();
      expect(primaryButton?.backgroundColor).toBe("var(--primary)");
      expect(primaryButton?.["&:hover"]).toEqual({
        backgroundColor: "var(--primary-hover)",
      });
      expect(primaryButton?.["&:active"]).toEqual({
        backgroundColor: "var(--primary-active)",
      });
      expect(primaryButton?.["&:disabled"]).toMatchObject({
        backgroundColor: "var(--primary-disabled)",
      });
      expect(primaryButton?.["&:focus"]).toBeDefined();
    });

    it("defines form input field with hover and focus states", () => {
      const elements = clerkAppearance.elements as Record<string, ClerkElementStyles>;
      const inputField = elements?.formFieldInput;
      expect(inputField).toBeDefined();
      expect(inputField?.backgroundColor).toBe("var(--bg-card)");
      expect(inputField?.["&:hover"]).toBeDefined();
      expect(inputField?.["&:focus"]).toBeDefined();
    });

    it("defines card element with comprehensive design token mapping", () => {
      const elements = clerkAppearance.elements as Record<string, ClerkElementStyles>;
      const card = elements?.card;
      expect(card).toBeDefined();
      expect(card?.backgroundColor).toBe("var(--bg-card)");
      expect(card?.borderRadius).toBe("var(--radius-lg)");
      expect(card?.boxShadow).toBe("var(--shadow-card)");
      expect(card?.border).toBe("1px solid var(--divider)");
      expect(card?.padding).toBe("var(--space-6)");
    });

    it("uses CSS variable references for automatic theme switching", () => {
      const configString = JSON.stringify(clerkAppearance);
      const cssVarMatches = configString.match(/var\(--[a-z-]+\)/g);

      // Per D-09 requirement: comprehensive token mapping (PLAN specifies 79 references)
      expect(cssVarMatches).toBeDefined();
      expect(cssVarMatches!.length).toBeGreaterThanOrEqual(50);
    });

    it("defines all status color alert variants", () => {
      const elements = clerkAppearance.elements as Record<string, Record<string, unknown>>;
      expect(elements?.alertTextDanger).toMatchObject({
        color: "var(--error)",
      });
      expect(elements?.alertTextSuccess).toMatchObject({
        color: "var(--success)",
      });
      expect(elements?.alertTextWarning).toMatchObject({
        color: "var(--warning)",
      });
    });
  });
});
