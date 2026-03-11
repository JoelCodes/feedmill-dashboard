# Testing Patterns

**Analysis Date:** 2026-03-11

## Test Framework

**Runner:**
- Not detected - No test framework configured
- No Jest, Vitest, or other testing framework in dependencies
- No test configuration files found (jest.config.js, vitest.config.ts, etc.)

**Assertion Library:**
- Not applicable - no testing framework installed

**Run Commands:**
```bash
npm run lint              # Run ESLint linting (only code quality tool)
npm run dev              # Run development server
npm run build            # Build production bundle
```

## Test File Organization

**Location:**
- No test files found in codebase
- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files in `/src` directory
- Standard pattern would be co-located: `ComponentName.tsx` alongside `ComponentName.test.tsx`

**Naming:**
- Convention (not yet used): `[ComponentName].test.tsx` for component tests
- Convention (not yet used): `[functionName].test.ts` for utility tests

**Structure:**
- No test directories established
- Future structure should follow Next.js convention: tests alongside components
- Could also use `__tests__` directory if preferred

## Test Structure

**Suite Organization:**
No tests currently exist. Recommended pattern when implementing:

```typescript
// Example pattern to follow:
describe('ComponentName', () => {
  describe('with required props', () => {
    it('should render without crashing', () => {
      // test code
    });
  });

  describe('with optional props', () => {
    it('should render with variant', () => {
      // test code
    });
  });
});
```

**Patterns (to be established):**
- Setup: Use React Testing Library's `render()` for component tests
- Teardown: Testing library automatically cleans up after each test
- Assertion: Use matcher library assertions for element presence/content/styling

## Mocking

**Framework:** Not applicable - no testing framework installed

**Patterns (to establish):**
- Mock lucide-react icons: `jest.mock('lucide-react')`
- Mock child components when testing in isolation
- Mock Next.js router and navigation when needed

**What to Mock:**
- External icon library (lucide-react) in unit tests
- Next.js specific features (routing, metadata) in integration tests
- API calls (when implemented)

**What NOT to Mock:**
- CSS class utilities (test actual styling if needed)
- Internal component helpers (test as part of parent)
- Type definitions

## Fixtures and Factories

**Test Data:**
No test fixtures currently exist. Recommended pattern:

```typescript
// Suggested location: src/__fixtures__/orders.ts
export const mockOrder: Order = {
  id: "ORD-2847",
  destination: "Greenfield Farms, TX",
  product: "Layer Mash",
  tons: "24.5",
  status: "shipped",
  hasAlert: true,
};

export const mockOrders: Order[] = [
  mockOrder,
  // additional test data
];
```

**Location:**
- Recommended: `src/__fixtures__/` directory for test data
- Alternative: `src/__mocks__/` for mocked modules
- Consider: Factory functions for generating test data with variations

## Coverage

**Requirements:** Not enforced

**View Coverage:**
```bash
# Command (to be configured when testing framework is added):
npm test -- --coverage
```

**Current Status:**
- No coverage configuration present
- No automated coverage thresholds enforced
- Recommendation: Configure when tests are added

## Test Types

**Unit Tests:**
- Should test: Individual components in isolation
- Scope: Props, state changes, conditional rendering
- Example target: `KPICard` component with different prop combinations
- Recommended framework: React Testing Library

**Integration Tests:**
- Should test: Components working together (e.g., `OrdersTable` with `FilterPill`)
- Scope: Data flow between components, event handling
- Example: Testing filter selection updates displayed orders
- Recommended framework: React Testing Library

**E2E Tests:**
- Framework: Not currently configured
- Recommendation: Add Playwright or Cypress for full dashboard workflows
- Example: Complete order lifecycle from display to detail view

## Common Patterns to Establish

**Async Testing:**
```typescript
// Pattern to use when testing async behavior:
it('should handle async data loading', async () => {
  render(<Component />);
  const element = await screen.findByText('loaded data');
  expect(element).toBeInTheDocument();
});
```

**Error Testing:**
```typescript
// Pattern to use when testing error states:
it('should display error message on failed request', () => {
  // Mock error condition
  render(<Component />);
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

**Component Rendering:**
```typescript
// Pattern to follow for component tests:
describe('KPICard', () => {
  it('renders with required props', () => {
    render(
      <KPICard
        label="Test"
        value="100"
        change="+10%"
        changeType="positive"
        icon={MockIcon}
      />
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Testing Best Practices to Follow

**Do:**
- Test user-visible behavior, not implementation details
- Use semantic queries: `getByRole()`, `getByLabelText()`, `getByText()`
- Test accessibility alongside functionality
- Group related tests with `describe()`
- Use descriptive test names: `should render with error state when...`

**Don't:**
- Test Tailwind class application directly
- Over-mock internal components
- Create generic/reusable test utilities that hide behavior
- Test styling details (test DOM structure instead)

## Setup Required

**To add testing:**

1. Install testing framework:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
# or: npm install --save-dev vitest @testing-library/react @testing-library/jsdom
```

2. Create configuration:
```typescript
// jest.config.ts or vitest.config.ts
// Reference Next.js documentation for proper setup
```

3. Update package.json scripts:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

4. Create first test file:
```typescript
// src/components/__tests__/KPICard.test.tsx
// Use established patterns above
```

---

*Testing analysis: 2026-03-11*
