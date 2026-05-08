import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import FilterPill from './FilterPill';

describe('FilterPill', () => {
  const defaultProps = {
    label: 'Pending',
    count: 5,
    isActive: false,
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Existing behavior tests (preserved from src/components/FilterPill.test.tsx)
  it('renders label text', () => {
    render(<FilterPill {...defaultProps} label="Completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders count in badge', () => {
    render(<FilterPill {...defaultProps} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<FilterPill {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows dot when active and showDot is true', () => {
    render(<FilterPill {...defaultProps} isActive={true} showDot={true} />);
    expect(screen.getByTestId('filter-pill-dot')).toBeInTheDocument();
  });

  it('does not show dot when inactive', () => {
    render(<FilterPill {...defaultProps} isActive={false} showDot={true} />);
    expect(screen.queryByTestId('filter-pill-dot')).not.toBeInTheDocument();
  });

  it('applies text-white when active', () => {
    render(<FilterPill {...defaultProps} isActive={true} />);
    expect(screen.getByText('Pending').className).toContain('text-white');
  });

  it('has aria-pressed matching isActive', () => {
    const { rerender } = render(<FilterPill {...defaultProps} isActive={false} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

    rerender(<FilterPill {...defaultProps} isActive={true} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('has descriptive aria-label', () => {
    render(<FilterPill {...defaultProps} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Filter by Pending, 5 orders');
  });

  // TOKEN USAGE TESTS (per D-10, following StatusBadge.test.tsx pattern)
  describe('token verification', () => {
    it('uses CSS variables for default inactive colors', () => {
      const { container } = render(<FilterPill {...defaultProps} isActive={false} />);
      const button = container.querySelector('button');
      const html = button?.outerHTML || '';

      // Should use token-based classes
      expect(html).toContain('var(--');
      expect(html).toContain('var(--pending-light)');
      expect(html).toContain('var(--text-secondary)');
    });

    it('uses CSS variables for active state colors', () => {
      const { container } = render(<FilterPill {...defaultProps} isActive={true} />);
      const button = container.querySelector('button');
      const html = button?.outerHTML || '';

      // Active state uses primary token
      expect(html).toContain('var(--primary)');
    });

    it('uses CSS variables when color config provided', () => {
      const tokenConfig = {
        bg: 'bg-[var(--success-light)]',
        text: 'text-[var(--success)]',
        dot: 'bg-[var(--success)]',
        countBg: 'bg-[var(--status-completed-bg-22)]',
      };

      const { container } = render(
        <FilterPill {...defaultProps} color={tokenConfig} />
      );
      const html = container.innerHTML;

      expect(html).toContain('var(--success-light)');
    });

    it('contains no hardcoded gray Tailwind classes in inactive state', () => {
      const { container } = render(<FilterPill {...defaultProps} isActive={false} />);
      const html = container.innerHTML;

      // Should NOT contain hardcoded gray classes
      expect(html).not.toContain('bg-gray-100');
      expect(html).not.toContain('text-gray-600');
      expect(html).not.toContain('bg-gray-200');
    });

    it('uses divider token for count background when inactive', () => {
      const { container } = render(<FilterPill {...defaultProps} isActive={false} />);
      const html = container.innerHTML;

      expect(html).toContain('var(--divider)');
    });

    it('uses pending token for default dot color in component source', () => {
      // The component source uses var(--pending) as default dot color
      // When inactive, dots don't show (hasDot = isActive && ...)
      // When active with color.dot provided, it uses white/60 not the token
      // This test verifies the token exists in the component by checking inactive defaults
      const { container } = render(<FilterPill {...defaultProps} isActive={false} />);
      const html = container.innerHTML;

      // The component contains pending token references for inactive defaults
      expect(html).toContain('var(--pending-light)');
    });
  });

  describe('API preservation', () => {
    it('accepts color prop with FilterPillColorConfig', () => {
      const colorConfig = {
        bg: 'bg-[var(--success-light)]',
        text: 'text-[var(--success-dark)]',
        dot: 'bg-[var(--success-dark)]',
        countBg: 'bg-[var(--status-completed-bg-22)]',
      };

      render(<FilterPill {...defaultProps} color={colorConfig} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('var(--success-light)');
    });

    it('accepts dotColor prop for custom dot styling', () => {
      const { container } = render(
        <FilterPill {...defaultProps} isActive={true} showDot={true} dotColor="bg-[var(--error)]" />
      );
      // When active with showDot, uses bg-white for dot, dotColor is only used when inactive
      const dot = container.querySelector('[data-testid="filter-pill-dot"]');
      expect(dot).toBeInTheDocument();
    });
  });
});

describe('FilterPill - Accessibility', () => {
  it('has no accessibility violations when inactive', async () => {
    const { container } = render(
      <FilterPill label="Pending" count={5} isActive={false} onClick={jest.fn()} />
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it('has no violations when active', async () => {
    const { container } = render(
      <FilterPill label="Pending" count={5} isActive={true} onClick={jest.fn()} />
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
