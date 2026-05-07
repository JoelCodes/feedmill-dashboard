/**
 * ESLint rule to enforce design token usage in className strings.
 *
 * Per D-07: Blocks hardcoded hex colors (#xxx, #xxxxxx) and px values in className.
 * Per D-08: Error severity blocks builds.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hardcoded hex colors and px values in className - use design tokens instead",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      hexColor:
        "Hardcoded hex color '{{value}}' detected in className. Use a design token instead: bg-[var(--color-name)] or text-[var(--color-name)]",
      pxValue:
        "Hardcoded px value '{{value}}' detected in className. Use a spacing token instead: p-[var(--space-N)] or w-[var(--space-N)]",
    },
    schema: [], // no options
  },

  create(context) {
    /**
     * Check a string value for hardcoded patterns.
     * @param {string} value - The className string to check
     * @param {import('eslint').Rule.Node} node - The AST node for reporting
     */
    function checkForViolations(value, node) {
      if (typeof value !== "string") return;

      // Match hex colors: #fff, #ffffff, bg-[#abc123]
      // Captures the full hex pattern including brackets if present
      const hexPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
      let hexMatch;
      while ((hexMatch = hexPattern.exec(value)) !== null) {
        context.report({
          node,
          messageId: "hexColor",
          data: { value: hexMatch[0] },
        });
      }

      // Match px values in arbitrary value syntax: [123px], [24px]
      // Only matches inside square brackets (Tailwind arbitrary values)
      const pxPattern = /\[(\d+)px\]/g;
      let pxMatch;
      while ((pxMatch = pxPattern.exec(value)) !== null) {
        context.report({
          node,
          messageId: "pxValue",
          data: { value: pxMatch[0] },
        });
      }
    }

    /**
     * Extract string value from JSX attribute value.
     * Handles: string literals, template literals, expressions.
     * @param {import('eslint').Rule.Node} attrValue
     * @returns {string|null}
     */
    function getStringValue(attrValue) {
      if (!attrValue) return null;

      // String literal: className="foo bar"
      if (attrValue.type === "Literal" && typeof attrValue.value === "string") {
        return attrValue.value;
      }

      // JSX expression container: className={...}
      if (attrValue.type === "JSXExpressionContainer") {
        const expr = attrValue.expression;

        // String literal in expression: className={"foo bar"}
        if (expr.type === "Literal" && typeof expr.value === "string") {
          return expr.value;
        }

        // Template literal: className={`foo ${bar}`}
        if (expr.type === "TemplateLiteral") {
          // Check each quasi (static part) of the template
          return expr.quasis.map((q) => q.value.raw).join("");
        }
      }

      return null;
    }

    return {
      JSXAttribute(node) {
        // Only check className attribute
        if (node.name.name !== "className") return;

        const stringValue = getStringValue(node.value);
        if (stringValue) {
          checkForViolations(stringValue, node);
        }
      },
    };
  },
};
