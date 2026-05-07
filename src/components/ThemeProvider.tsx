"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/**
 * Theme provider wrapper for dark mode support.
 *
 * Uses next-themes to:
 * - Detect system preference
 * - Persist theme to localStorage
 * - Prevent flash of unstyled content
 * - Apply .dark class to html element
 *
 * Three theme options per D-04: "light", "dark", "system"
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="cgm-dashboard-theme"
      themes={["light", "dark", "system"]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
