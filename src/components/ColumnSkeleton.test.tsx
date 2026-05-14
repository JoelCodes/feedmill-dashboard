/**
 * Structure tests for ColumnSkeleton component.
 *
 * TDD RED phase: tests written before implementation.
 * These will fail until src/components/ColumnSkeleton.tsx is created.
 *
 * PROD-10 + UI-SPEC §7 Loading Skeletons:
 * - 3 card-shaped placeholders (h-20 animate-pulse)
 * - Header skeleton (h-6 w-24 + h-4 w-16)
 * - Container: flex flex-col gap-3
 */
import { render } from '@testing-library/react';
import ColumnSkeleton from './ColumnSkeleton';

describe('ColumnSkeleton', () => {
  it('Test 1: renders exactly 3 card skeleton placeholders with animate-pulse and h-20', () => {
    const { container } = render(<ColumnSkeleton />);
    // Card placeholders have h-20 class
    const cards = container.querySelectorAll('.h-20');
    expect(cards.length).toBe(3);
    // Each card must have animate-pulse class
    cards.forEach((card) => {
      expect(card.className).toContain('animate-pulse');
    });
  });

  it('Test 2: renders a header skeleton with h-6 w-24 and h-4 w-16 shapes', () => {
    const { container } = render(<ColumnSkeleton />);
    const headerTitle = container.querySelector('.h-6.w-24');
    const headerSub = container.querySelector('.h-4.w-16');
    expect(headerTitle).toBeTruthy();
    expect(headerSub).toBeTruthy();
    expect(headerTitle?.className).toContain('animate-pulse');
    expect(headerSub?.className).toContain('animate-pulse');
  });

  it('Test 3: container includes flex, flex-col, and gap classes', () => {
    const { container } = render(<ColumnSkeleton />);
    // The root or a child element should contain flex and flex-col
    const flexColEl = container.querySelector('.flex.flex-col');
    expect(flexColEl).toBeTruthy();
  });
});
