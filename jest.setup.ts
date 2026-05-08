import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'

// Extend Jest expect with jest-axe matchers for accessibility testing
expect.extend(toHaveNoViolations)
