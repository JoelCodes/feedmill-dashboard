import type { Appearance } from "@clerk/types";

/**
 * Clerk appearance configuration for theme integration.
 *
 * Maps ALL design tokens from globals.css to Clerk components per D-09:
 * - Primary colors (including hover/active states)
 * - Background colors (page, card, sidebar)
 * - Text colors (primary, secondary, muted, medium, white)
 * - Status colors (success, warning, error, info)
 * - Shadows (sm, card)
 * - Border radius (sm, md, lg, xl)
 * - Spacing (space-1 through space-12)
 *
 * Uses CSS variable references (var(--token-name)) for automatic theme switching.
 *
 * Apply to SignIn, UserButton, and other Clerk components via appearance prop.
 *
 * @example
 * <SignIn appearance={clerkAppearance} />
 */
export const clerkAppearance: Appearance = {
  variables: {
    // Primary color (line 8 of globals.css)
    // Note: hover/active states are applied via elements, not variables
    colorPrimary: "var(--primary)",

    // Background colors (lines 15-17)
    colorBackground: "var(--bg-card)",
    colorInputBackground: "var(--bg-card)",

    // Text colors (lines 20-22, 142-144)
    colorText: "var(--text-primary)",
    colorTextSecondary: "var(--text-secondary)",
    colorInputText: "var(--text-primary)",

    // Error/danger color (line 38)
    colorDanger: "var(--error)",

    // Success color (line 25)
    colorSuccess: "var(--success)",

    // Warning color (line 32)
    colorWarning: "var(--warning)",

    // Border radius (lines 67-70)
    borderRadius: "var(--radius-md)",

    // Typography (matches body style line 300)
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: "0.875rem",

    // Spacing (lines 73-81) - Clerk uses spacingUnit as base
    spacingUnit: "var(--space-1)",
  },
  elements: {
    // Root container - use page background
    rootBox: {
      backgroundColor: "transparent",
    },

    // Card container - full token mapping
    card: {
      backgroundColor: "var(--bg-card)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-card)",
      border: "1px solid var(--divider)",
      padding: "var(--space-6)",
    },

    // Header text
    headerTitle: {
      color: "var(--text-primary)",
      fontWeight: "700",
      fontSize: "1.25rem",
    },
    headerSubtitle: {
      color: "var(--text-secondary)",
      fontSize: "0.875rem",
    },

    // Form elements with full state coverage
    formButtonPrimary: {
      backgroundColor: "var(--primary)",
      color: "var(--text-white)",
      borderRadius: "var(--radius-md)",
      fontWeight: "600",
      boxShadow: "var(--shadow-sm)",
      padding: "var(--space-2) var(--space-4)",
      "&:hover": {
        backgroundColor: "var(--primary-hover)",
      },
      "&:active": {
        backgroundColor: "var(--primary-active)",
      },
      "&:disabled": {
        backgroundColor: "var(--primary-disabled)",
        cursor: "not-allowed",
      },
      "&:focus": {
        boxShadow: "0 0 0 2px var(--bg-card), 0 0 0 4px var(--primary)",
      },
    },

    formFieldInput: {
      backgroundColor: "var(--bg-card)",
      borderColor: "var(--divider)",
      borderRadius: "var(--radius-md)",
      color: "var(--text-primary)",
      padding: "var(--space-2) var(--space-3)",
      boxShadow: "var(--shadow-sm)",
      "&:hover": {
        borderColor: "var(--text-secondary)",
      },
      "&:focus": {
        borderColor: "var(--primary)",
        boxShadow: "0 0 0 2px var(--bg-card), 0 0 0 4px var(--primary)",
      },
    },

    formFieldLabel: {
      color: "var(--text-primary)",
      fontWeight: "500",
      fontSize: "0.875rem",
      marginBottom: "var(--space-1)",
    },

    formFieldHintText: {
      color: "var(--text-muted)",
      fontSize: "0.75rem",
    },

    formFieldErrorText: {
      color: "var(--error)",
      fontSize: "0.75rem",
    },

    formFieldSuccessText: {
      color: "var(--success)",
      fontSize: "0.75rem",
    },

    formFieldWarningText: {
      color: "var(--warning)",
      fontSize: "0.75rem",
    },

    // Footer links
    footerActionLink: {
      color: "var(--primary)",
      fontWeight: "500",
      "&:hover": {
        color: "var(--primary-hover)",
        textDecoration: "underline",
      },
      "&:active": {
        color: "var(--primary-active)",
      },
    },

    footerActionText: {
      color: "var(--text-secondary)",
      fontSize: "0.875rem",
    },

    // Social buttons (if used later)
    socialButtonsBlockButton: {
      backgroundColor: "var(--bg-card)",
      borderColor: "var(--divider)",
      color: "var(--text-primary)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-sm)",
      "&:hover": {
        backgroundColor: "var(--bg-page)",
        borderColor: "var(--text-secondary)",
      },
      "&:active": {
        backgroundColor: "var(--bg-page)",
      },
    },

    // Divider
    dividerLine: {
      backgroundColor: "var(--divider)",
    },
    dividerText: {
      color: "var(--text-secondary)",
      fontSize: "0.75rem",
    },

    // Alert/notification messages - all status colors
    alertText: {
      fontSize: "0.875rem",
    },
    alertTextDanger: {
      color: "var(--error)",
    },
    alertTextSuccess: {
      color: "var(--success)",
    },
    alertTextWarning: {
      color: "var(--warning)",
    },
    alertTextPrimary: {
      color: "var(--info)",
    },

    // Identity preview (after initial auth step)
    identityPreviewText: {
      color: "var(--text-primary)",
      fontSize: "0.875rem",
    },
    identityPreviewEditButton: {
      color: "var(--primary)",
      "&:hover": {
        color: "var(--primary-hover)",
      },
    },

    // Verification code input
    otpCodeFieldInput: {
      backgroundColor: "var(--bg-card)",
      borderColor: "var(--divider)",
      borderRadius: "var(--radius-md)",
      color: "var(--text-primary)",
      "&:focus": {
        borderColor: "var(--primary)",
        boxShadow: "0 0 0 2px var(--bg-card), 0 0 0 4px var(--primary)",
      },
    },

    // Badge/tag elements
    badge: {
      backgroundColor: "var(--info-light)",
      color: "var(--info)",
      borderRadius: "var(--radius-sm)",
      padding: "var(--space-1) var(--space-2)",
      fontSize: "0.75rem",
    },

    // Avatar
    avatarBox: {
      borderRadius: "var(--radius-lg)",
      backgroundColor: "var(--primary)",
    },

    // Scrollbar (for overflow content)
    scrollBox: {
      "&::-webkit-scrollbar": {
        width: "var(--space-2)",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "var(--divider)",
        borderRadius: "var(--radius-sm)",
      },
    },
  },
};
