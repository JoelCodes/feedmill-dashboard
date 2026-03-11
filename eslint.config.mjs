import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwindcss from "eslint-plugin-tailwindcss";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      tailwindcss,
    },
    rules: {
      // Only enable rules that work without config resolution
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-contradicting-classname": "error",
      // Disable rules that require Tailwind config
      "tailwindcss/no-custom-classname": "off",
    },
    settings: {
      tailwindcss: {
        // Skip config validation for Tailwind v4
        skipClassAttribute: false,
        callees: ["classnames", "clsx", "ctl", "cn"],
        config: null, // Disable config loading
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
