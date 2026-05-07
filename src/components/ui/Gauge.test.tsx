import { render, screen } from '@testing-library/react';
import { Gauge, BinGauge } from './Gauge';

describe('Gauge', () => {
  // Existing behavior tests (adapted from BinGauge.test.tsx)
  it('renders with label and sublabel', () => {
    render(<Gauge fillPercentage={50} label="A1" sublabel="Corn" />);
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('Corn')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders without sublabel', () => {
    render(<Gauge fillPercentage={75} label="B2" />);
    expect(screen.getByText('B2')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('clamps percentage to 0-100 range', () => {
    const { rerender } = render(<Gauge fillPercentage={150} label="A1" />);
    expect(screen.getByText('100%')).toBeInTheDocument();

    rerender(<Gauge fillPercentage={-50} label="A1" />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('applies success color for fill > 25%', () => {
    const { container } = render(<Gauge fillPercentage={30} label="A1" />);
    const fillBar = container.querySelector('[data-testid="fill-bar"]');
    expect(fillBar?.className).toContain('var(--success)');
  });

  it('applies warning color for fill 10-25%', () => {
    const { container } = render(<Gauge fillPercentage={15} label="A1" />);
    const fillBar = container.querySelector('[data-testid="fill-bar"]');
    expect(fillBar?.className).toContain('var(--warning)');
  });

  it('applies error color for fill < 10%', () => {
    const { container } = render(<Gauge fillPercentage={5} label="A1" />);
    const fillBar = container.querySelector('[data-testid="fill-bar"]');
    expect(fillBar?.className).toContain('var(--error)');
  });

  it('applies correct fill bar height', () => {
    render(<Gauge fillPercentage={50} label="A1" />);
    const fillBar = screen.getByTestId('fill-bar');
    // 50% of 66px = 33px
    expect(fillBar).toHaveStyle({ height: '33px' });
  });

  it('applies correct dimensions from UI-SPEC', () => {
    render(<Gauge fillPercentage={50} label="A1" />);

    const container = screen.getByTestId('gauge');
    expect(container).toHaveClass('w-[60px]');

    const gaugeContainer = screen.getByTestId('gauge-container');
    expect(gaugeContainer).toHaveClass('w-[40px]');
    expect(gaugeContainer).toHaveClass('h-[70px]');

    const fillBar = screen.getByTestId('fill-bar');
    expect(fillBar).toHaveClass('w-[36px]');
  });

  // TOKEN USAGE TESTS
  describe('token verification', () => {
    it('uses CSS variables for threshold colors', () => {
      const { container } = render(<Gauge fillPercentage={30} label="A1" sublabel="Corn" />);
      const html = container.innerHTML;

      // Should use token-based classes
      expect(html).toContain('var(--');
    });

    it('uses token for border color', () => {
      render(<Gauge fillPercentage={50} label="A1" />);
      const gaugeContainer = screen.getByTestId('gauge-container');
      expect(gaugeContainer?.className).toContain('border-[var(--divider)]');
    });

    it('uses token for label text colors', () => {
      const { container } = render(<Gauge fillPercentage={50} label="A1" sublabel="Corn" />);
      const html = container.innerHTML;

      expect(html).toContain('var(--text-primary)');
      expect(html).toContain('var(--text-secondary)');
    });

    it('uses token for low-fill percentage text color', () => {
      const { container } = render(<Gauge fillPercentage={10} label="A1" />);
      const html = container.innerHTML;

      // Low fill should use text-primary token, not hardcoded hex
      expect(html).toContain('var(--text-primary)');
    });

    it('contains no hardcoded hex colors', () => {
      const { container } = render(<Gauge fillPercentage={50} label="A1" sublabel="Corn" />);
      const html = container.innerHTML;

      // Should NOT contain hardcoded hex colors
      expect(html).not.toMatch(/#[0-9a-fA-F]{6}/);
    });
  });

  // Backwards compatibility
  describe('BinGauge alias', () => {
    it('exports BinGauge as alias for Gauge', () => {
      expect(BinGauge).toBe(Gauge);
    });
  });
});
