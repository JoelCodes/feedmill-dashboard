/* eslint-disable @typescript-eslint/no-require-imports */
const { RuleTester } = require("eslint");
const rule = require("./no-hardcoded-values");

// Use ESLint 9 flat config compatible RuleTester
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run("no-hardcoded-values", rule, {
  valid: [
    // Standard Tailwind classes
    {
      code: '<div className="p-4 m-2 text-white" />',
    },
    // Design token usage
    {
      code: '<div className="bg-[var(--primary)] p-[var(--space-4)]" />',
    },
    // Template literal with tokens
    {
      code: "<div className={`bg-[var(--primary)] ${active ? 'opacity-100' : 'opacity-50'}`} />",
    },
    // Non-className attributes should be ignored
    {
      code: '<input style={{ color: "#ff0000" }} />',
    },
    {
      code: '<div data-color="#ff0000" />',
    },
    // Tailwind color utilities (not arbitrary)
    {
      code: '<div className="text-red-500 bg-blue-200" />',
    },
  ],

  invalid: [
    // Hex color in static className
    {
      code: '<div className="bg-[#4fd1c5]" />',
      errors: [{ messageId: "hexColor" }],
    },
    // Hex color short form
    {
      code: '<div className="text-[#fff]" />',
      errors: [{ messageId: "hexColor" }],
    },
    // Multiple hex colors
    {
      code: '<div className="bg-[#4fd1c5] text-[#ffffff]" />',
      errors: [{ messageId: "hexColor" }, { messageId: "hexColor" }],
    },
    // Hex in template literal
    {
      code: "<div className={`bg-[#abc123] hover:opacity-50`} />",
      errors: [{ messageId: "hexColor" }],
    },
    // Pixel value in arbitrary syntax
    {
      code: '<div className="w-[24px]" />',
      errors: [{ messageId: "pxValue" }],
    },
    // Multiple px values
    {
      code: '<div className="w-[100px] h-[50px]" />',
      errors: [{ messageId: "pxValue" }, { messageId: "pxValue" }],
    },
    // Mix of hex and px violations
    {
      code: '<div className="bg-[#ff0000] p-[16px]" />',
      errors: [{ messageId: "hexColor" }, { messageId: "pxValue" }],
    },
  ],
});

console.log("All tests passed!");
