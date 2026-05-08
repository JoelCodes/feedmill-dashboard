# Phase 19: Documentation & Accessibility - Pattern Map

**Mapped:** 2026-05-08
**Files analyzed:** 13 files (1 new, 12 modified)
**Analogs found:** 12 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/ui/README.md` | documentation | static | `/Users/joel/Desktop/Projects/cgm-dashboard/README.md` | role-match |
| `src/components/ui/Button.test.tsx` | test | unit | `src/components/ui/Button.test.tsx` | exact (extend existing) |
| `src/components/ui/Card.test.tsx` | test | unit | `src/components/ui/Card.test.tsx` | exact (extend existing) |
| `src/components/ui/Input.test.tsx` | test | unit | `src/components/ui/Input.test.tsx` | exact (extend existing) |
| `src/components/ui/Select.test.tsx` | test | unit | `src/components/ui/Select.test.tsx` | exact (extend existing) |
| `src/components/ui/Textarea.test.tsx` | test | unit | `src/components/ui/Textarea.test.tsx` | exact (extend existing) |
| `src/components/ui/StatusBadge.test.tsx` | test | unit | `src/components/ui/StatusBadge.test.tsx` | exact (extend existing) |
| `src/components/ui/FilterPill.test.tsx` | test | unit | `src/components/ui/FilterPill.test.tsx` | exact (extend existing) |
| `src/components/ui/Gauge.test.tsx` | test | unit | `src/components/ui/Gauge.test.tsx` | exact (extend existing) |
| `src/components/ui/Timeline.test.tsx` | test | unit | `src/components/ui/Timeline.test.tsx` | exact (extend existing) |
| `src/components/ui/ThemeToggle.test.tsx` | test | unit | `src/components/ui/ThemeToggle.test.tsx` | exact (extend existing) |
| `jest.setup.ts` | config | test-setup | `jest.setup.ts` | exact (extend existing) |
| `eslint.config.mjs` | config | build-time | `eslint.config.mjs` | exact (extend existing) |

## Pattern Assignments

### `src/components/ui/README.md` (documentation, static)

**Analog:** `/Users/joel/Desktop/Projects/cgm-dashboard/README.md`

**Markdown structure pattern** (lines 1-37):
```markdown
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
```

**Documentation conventions:**
- Use standard Markdown with code blocks
- Provide runnable examples in code fences
- H2 (##) for major sections
- Code blocks use language identifiers (bash, tsx, etc.)
- Links use inline format: `[text](url)`

**Token documentation source:** `src/app/globals.css` (lines 6-143)
- Extract ~100+ tokens from :root block
- Group by category: Primary Colors, Background Colors, Text Colors, Status Colors, Borders & Dividers, Shadows, Border Radius, Spacing Scale, Typography, Icon sizes, Component-specific
- Each token: name, purpose, example usage

**Component documentation reference:**
- Button: `src/components/ui/Button.tsx` (lines 1-63) for API
- Input: `src/components/ui/Input.tsx` (lines 1-73) for props interface pattern
- Card: Component with compound pattern (Card.Header, Card.Content, Card.Footer)

---

### `src/components/ui/Button.test.tsx` (test, unit)

**Analog:** `src/components/ui/Button.test.tsx`

**Existing test structure** (lines 1-92):
```typescript
import { render, screen } from "@testing-library/react";
import Button from "./Button";

describe("Button", () => {
  // Test 1: Button renders with primary variant classes by default
  it("renders with primary variant classes by default", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveClass("bg-[var(--primary)]");
  });

  // Test 9: Button shows loading state with aria-busy="true" and is disabled
  it("shows loading state with aria-busy and is disabled", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button", { name: /loading/i });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
  });
});
```

**Pattern to add - jest-axe accessibility test:**
```typescript
import { axe } from "jest-axe";

describe("Button - Accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container, {
      rules: {
        // Disable page-level rules for component testing
        region: { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no violations in loading state", async () => {
    const { container } = render(<Button loading>Loading</Button>);
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
```

**Key conventions:**
- Import `axe` from "jest-axe" (jest-axe matcher already extended in jest.setup.ts)
- Use `const { container }` from render for axe testing
- Always disable `region` rule for isolated component tests
- Test default state + edge states (loading, disabled, error)
- Use async/await pattern with axe
- Group accessibility tests in separate describe block

---

### `src/components/ui/Card.test.tsx` (test, unit)

**Analog:** `src/components/ui/Card.test.tsx`

**Existing test structure** (lines 1-102):
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import Card from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Test content</Card>);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("is clickable when onClick provided", () => {
    const handleClick = jest.fn();
    const { container } = render(<Card onClick={handleClick}>Clickable card</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass("cursor-pointer");
    expect(card).toHaveClass("hover:opacity-95");

    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("clickable Card has role='button' and tabIndex={0}", () => {
    const handleClick = jest.fn();
    const { container } = render(<Card onClick={handleClick}>Clickable card</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveAttribute("role", "button");
    expect(card).toHaveAttribute("tabIndex", "0");
  });
});
```

**Pattern to add - accessibility tests for Card states:**
```typescript
import { axe } from "jest-axe";

describe("Card - Accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<Card>Test content</Card>);
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no violations when clickable", async () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Card onClick={handleClick}>Clickable card</Card>
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no violations with compound pattern", async () => {
    const { container } = render(
      <Card>
        <Card.Header>Header</Card.Header>
        <Card.Content>Content</Card.Content>
        <Card.Footer>Footer</Card.Footer>
      </Card>
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
```

---

### `src/components/ui/Input.test.tsx` (test, unit)

**Analog:** `src/components/ui/Input.test.tsx`

**Existing test structure** (lines 1-81):
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Input from "./Input";

describe("Input", () => {
  it("renders with default styling", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("border-[var(--divider)]");
  });

  it("has aria-invalid=true when error prop provided", () => {
    render(<Input placeholder="Enter text" error="This field is required" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("has aria-describedby linking to error message", () => {
    render(<Input placeholder="Enter text" error="This field is required" />);
    const input = screen.getByPlaceholderText("Enter text");
    const ariaDescribedBy = input.getAttribute("aria-describedby");
    expect(ariaDescribedBy).toBeTruthy();
    const errorElement = document.getElementById(ariaDescribedBy!);
    expect(errorElement).toHaveTextContent("This field is required");
  });

  it("renders label when label prop provided", () => {
    render(<Input label="Email" placeholder="Enter email" />);
    const label = screen.getByText("Email");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("LABEL");
  });
});
```

**Pattern to add - accessibility tests for Input with label association:**
```typescript
import { axe } from "jest-axe";

describe("Input - Accessibility", () => {
  it("has no accessibility violations with label", async () => {
    const { container } = render(
      <Input label="Email Address" placeholder="Enter email" />
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no violations in error state", async () => {
    const { container } = render(
      <Input
        label="Email Address"
        placeholder="Enter email"
        error="Invalid email format"
      />
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no violations when disabled", async () => {
    const { container } = render(
      <Input label="Email Address" placeholder="Enter email" disabled />
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
```

**Important accessibility considerations:**
- Input component already uses `htmlFor` linking label to input via `useId()`
- Already implements `aria-invalid`, `aria-describedby`, `aria-required`
- Error messages use `role="alert"` and `aria-live="polite"`
- These existing patterns should be documented in README.md accessibility section

---

### `jest.setup.ts` (config, test-setup)

**Analog:** `jest.setup.ts`

**Current setup** (lines 1-2):
```typescript
import '@testing-library/jest-dom'
```

**Pattern to add - jest-axe matcher extension:**
```typescript
import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'

// Extend Jest expect with jest-axe matchers
expect.extend(toHaveNoViolations)
```

**Rationale:**
- Single global setup ensures `toHaveNoViolations` matcher available in all test files
- Follows jest-axe recommended setup pattern
- Minimal addition (2 lines) to existing setup file

---

### `eslint.config.mjs` (config, build-time)

**Analog:** `eslint.config.mjs`

**Current config structure** (lines 1-53):
```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwindcss from "eslint-plugin-tailwindcss";
import noHardcodedValues from "./eslint-rules/no-hardcoded-values.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      tailwindcss,
    },
    rules: {
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-contradicting-classname": "error",
    },
    settings: {
      tailwindcss: {
        skipClassAttribute: false,
        callees: ["classnames", "clsx", "ctl", "cn"],
        config: null,
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
      "custom/no-hardcoded-values": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

**Pattern to add - jsx-a11y plugin configuration:**
```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwindcss from "eslint-plugin-tailwindcss";
import jsxA11y from "eslint-plugin-jsx-a11y";  // NEW
import noHardcodedValues from "./eslint-rules/no-hardcoded-values.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  jsxA11y.flatConfigs.recommended,  // NEW: Add recommended a11y rules
  {
    plugins: {
      tailwindcss,
    },
    rules: {
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-contradicting-classname": "error",
    },
    settings: {
      tailwindcss: {
        skipClassAttribute: false,
        callees: ["classnames", "clsx", "ctl", "cn"],
        config: null,
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
      "custom/no-hardcoded-values": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

**Key changes:**
1. Add `import jsxA11y from "eslint-plugin-jsx-a11y"` at top
2. Add `jsxA11y.flatConfigs.recommended` to config array (after nextTs, before custom plugins)
3. Uses flat config format (ESLint 9.x standard)

---

## Shared Patterns

### Accessibility Testing Setup
**Source:** jest-axe library + project test conventions
**Apply to:** All 10 component test files

**Setup in jest.setup.ts:**
```typescript
import { toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)
```

**Test pattern for all components:**
```typescript
import { axe } from "jest-axe";

describe("[ComponentName] - Accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<Component>Content</Component>);
    const results = await axe(container, {
      rules: {
        region: { enabled: false },  // Disable page-level rules
      },
    });
    expect(results).toHaveNoViolations();
  });

  // Add tests for each significant state: loading, error, disabled, etc.
});
```

**Rules:**
- Always use async/await with axe
- Always disable `region` rule for isolated component tests
- Group accessibility tests in separate describe block
- Test default state + all interactive/error states
- Use `const { container }` from render() for axe input

### Token Documentation Structure
**Source:** `src/app/globals.css` (lines 6-143)
**Apply to:** README.md token reference table

**Extraction pattern:**
1. Group tokens by CSS comment sections (Primary Colors, Background Colors, etc.)
2. Each token row: `| Token Name | Purpose | Example Usage |`
3. Example usage format: `bg-[var(--token-name)]` or `text-[var(--token-name)]`
4. For spacing: include pixel value from comment
5. For typography: use `text-[length:var(--fs-XX)]` format

**Token categories from globals.css:**
- Primary Colors (lines 7-12): --primary, --primary-dark, --primary-hover, --primary-active, --primary-disabled
- Background Colors (lines 14-17): --bg-page, --bg-card, --bg-sidebar
- Text Colors (lines 19-22): --text-primary, --text-secondary, --text-white
- Status Colors (lines 24-58): success, warning, error, info, purple variants
- Borders & Dividers (line 60): --divider
- Shadows (lines 63-64): --shadow-sm, --shadow-card
- Border Radius (lines 67-70): --radius-sm through --radius-xl
- Spacing Scale (lines 73-81): --space-1 through --space-12 with pixel values
- Typography (lines 101-105): --fs-10 through --fs-22 with pixel values
- Component-specific (lines 107-141): icon sizes, timeline, gauge, table, card tokens

### Component Documentation Structure
**Source:** Research patterns + component implementation files
**Apply to:** Each component section in README.md

**Template structure:**
```markdown
## [ComponentName]

[1-2 sentence description]

### API

```tsx
interface ComponentProps {
  // List all props with types
}
```

### Variants

- **`variant="option1"`** (default): [when to use]
- **`variant="option2"`**: [when to use]

### Usage

```tsx
import ComponentName from '@/components/ui/ComponentName';

// Basic usage
<ComponentName>Content</ComponentName>

// With props
<ComponentName variant="option" size="lg">Content</ComponentName>
```

### Do

- ✓ [Correct usage pattern 1]
- ✓ [Correct usage pattern 2]

### Don't

- ✗ [Anti-pattern with explanation]
- ✗ [Anti-pattern with explanation]

### Accessibility

- [Keyboard interaction]
- [Screen reader announcements]
- [ARIA attributes used]
- [Required props for accessibility]

**WCAG Compliance:** [Pass/fail status with relevant criteria]
```

**Reference implementations:**
- Button (CVA variants): `src/components/ui/Button.tsx` (lines 6-31)
- Input (label association): `src/components/ui/Input.tsx` (lines 18-46)
- Card (compound pattern): Card.Header, Card.Content, Card.Footer

### ESLint Flat Config Pattern
**Source:** `eslint.config.mjs`
**Apply to:** Adding jsx-a11y plugin

**Import pattern:**
```javascript
import pluginName from "eslint-plugin-name";
```

**Configuration insertion:**
```javascript
const eslintConfig = defineConfig([
  ...existingPresets,
  pluginName.flatConfigs.recommended,  // Insert here, before custom plugins
  {
    // custom plugin configs
  },
]);
```

**Order matters:**
1. Framework presets (nextVitals, nextTs)
2. Third-party plugins with flat configs (jsx-a11y)
3. Custom plugin configurations (tailwindcss, custom rules)
4. Global ignores

## No Analog Found

None - all files have clear analogs or are extensions of existing files.

## Metadata

**Analog search scope:**
- src/components/ui/*.test.tsx (10 test files)
- Project root configs (jest.setup.ts, eslint.config.mjs)
- Documentation files (README.md)
- Token source (src/app/globals.css)

**Files scanned:** 15 files
**Pattern extraction date:** 2026-05-08

**Key findings:**
1. **Test pattern consistency:** All 10 existing test files follow same structure (render + screen + expect pattern), making jest-axe integration straightforward
2. **Strong accessibility foundation:** Input component already implements full ARIA pattern (aria-invalid, aria-describedby, aria-required, role="alert")
3. **Token structure:** globals.css has ~100+ tokens organized in clear categories with inline comments
4. **ESLint flat config:** Project already uses ESLint 9.x flat config, making jsx-a11y integration clean
5. **Documentation gap:** No existing component README - root README.md provides structure analog but is framework-focused, not component-focused
