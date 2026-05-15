/**
 * RTL smoke tests for KpiCard — the generic KPI primitive.
 *
 * TDD RED phase: tests written before implementation.
 *
 * Tests lock the dumb-component contract:
 *  - Renders label + value as pre-formatted strings
 *  - Optional subValue, footnote, icon slots behave as expected
 *  - Accessibility: role="region" aria-label={label}
 *  - No business logic: caller provides pre-formatted strings unchanged
 */
import { render, screen } from '@testing-library/react';
import { Wheat } from 'lucide-react';

import KpiCard from '@/components/KpiCard';

describe('KpiCard', () => {
  it('Test 1: renders label and value', () => {
    render(<KpiCard label="Completed Today" value="18,400 lbs" />);
    expect(screen.getByText('Completed Today')).toBeInTheDocument();
    expect(screen.getByText('18,400 lbs')).toBeInTheDocument();
  });

  it('Test 2: with subValue renders it below value', () => {
    render(
      <KpiCard label="Completed Today" value="18,400 lbs" subValue="47,200 lbs total" />
    );
    expect(screen.getByText('47,200 lbs total')).toBeInTheDocument();
  });

  it('Test 3: with footnote renders it at bottom of card', () => {
    render(
      <KpiCard
        label="Formula Mix"
        value="58% Pellet"
        footnote="Excludes 3 uncategorized orders"
      />
    );
    expect(screen.getByText('Excludes 3 uncategorized orders')).toBeInTheDocument();
  });

  it('Test 4: with icon renders icon container and icon SVG', () => {
    const { container } = render(
      <KpiCard label="Completed Today" value="18,400 lbs" icon={Wheat} />
    );
    // Icon container: h-11 w-11 rounded-xl bg-[var(--primary)]
    const iconContainer = container.querySelector('.h-11.w-11.rounded-xl');
    expect(iconContainer).toBeTruthy();
    // Icon SVG inside the container
    const svg = iconContainer?.querySelector('svg');
    expect(svg).toBeTruthy();
    // Icon has correct classes
    expect(svg?.classList.contains('h-5') && svg?.classList.contains('w-5')).toBe(true);
  });

  it('Test 5: without icon prop no icon container renders', () => {
    const { container } = render(
      <KpiCard label="Premix Today" value="6,000 lbs" />
    );
    const iconContainer = container.querySelector('.h-11.w-11.rounded-xl');
    expect(iconContainer).toBeNull();
  });

  it('Test 6 (accessibility): wrapper has role="region" and aria-label matching label prop', () => {
    render(<KpiCard label="Completed Today" value="18,400 lbs" />);
    const region = screen.getByRole('region', { name: 'Completed Today' });
    expect(region).toBeInTheDocument();
  });

  it('Test 7 (no business logic): passes literal value string unchanged', () => {
    render(<KpiCard label="Test Card" value="not a real number" />);
    expect(screen.getByText('not a real number')).toBeInTheDocument();
  });
});
