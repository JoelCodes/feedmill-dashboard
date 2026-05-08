import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwindcss from "eslint-plugin-tailwindcss";
import noHardcodedValues from "./eslint-rules/no-hardcoded-values.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // jsx-a11y recommended rules (plugin already registered by eslint-config-next)
  {
    rules: {
      // Upgrade Next.js defaults from warn to error, add missing recommended rules
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-activedescendant-has-tabindex": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/autocomplete-valid": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/iframe-has-title": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/media-has-caption": "error",
      "jsx-a11y/mouse-events-have-key-events": "error",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-autofocus": "error",
      "jsx-a11y/no-distracting-elements": "error",
      "jsx-a11y/no-interactive-element-to-noninteractive-role": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",
      "jsx-a11y/no-noninteractive-tabindex": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/scope": "error",
      "jsx-a11y/tabindex-no-positive": "error",
    },
  },
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
  {
    plugins: {
      custom: {
        rules: {
          "no-hardcoded-values": noHardcodedValues,
        },
      },
    },
    rules: {
      // Per D-08: Error severity blocks builds
      "custom/no-hardcoded-values": "error",
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
