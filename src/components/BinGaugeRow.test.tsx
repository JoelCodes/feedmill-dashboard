import { render, screen } from '@testing-library/react';
import { BinGaugeRow } from './BinGaugeRow';
import { Bin } from '@/types/bin';

// Mock bin data for tests
const createMockBin = (overrides: Partial<Bin> = {}): Bin => ({
  id: '1',
  customerId: 'cust-1',
  locationCode: 'BIN 4A',
  feedType: 'Pellet Feed',
  capacityTons: 100,
  currentFillTons: 75,
  fillPercentage: 75,
  alertLevel: 'none',
  lastUpdated: new Date('2026-01-15'),
  ...overrides,
});

describe('BinGaugeRow', () => {
  // Test 1: Renders nothing when bins array is empty (D-01)
  it('renders nothing when bins array is empty', () => {
    const { container } = render(<BinGaugeRow bins={[]} />);
    expect(container.firstChild).toBeNull();
  });

  // Test 2: Renders BinGauge for each bin in array
  it('renders BinGauge for each bin in array', () => {
    const bins: Bin[] = [
      createMockBin({ id: '1', locationCode: 'BIN 1A' }),
      createMockBin({ id: '2', locationCode: 'BIN 2B' }),
      createMockBin({ id: '3', locationCode: 'BIN 3C' }),
    ];

    render(<BinGaugeRow bins={bins} />);

    expect(screen.getByText('BIN 1A')).toBeInTheDocument();
    expect(screen.getByText('BIN 2B')).toBeInTheDocument();
    expect(screen.getByText('BIN 3C')).toBeInTheDocument();
  });

  // Test 3: Renders bins in horizontal flex row with gap-6 (24px)
  it('renders bins in horizontal flex row with gap-6', () => {
    const bins: Bin[] = [
      createMockBin({ id: '1' }),
      createMockBin({ id: '2' }),
    ];

    render(<BinGaugeRow bins={bins} />);

    const row = screen.getByTestId('bin-gauge-row');
    expect(row).toHaveClass('flex');
    expect(row).toHaveClass('flex-row');
    expect(row).toHaveClass('gap-6');
  });

  // Test 4: Renders with flex-end alignment (bottom-aligned)
  it('renders with flex-end alignment (bottom-aligned)', () => {
    const bins: Bin[] = [
      createMockBin({ id: '1' }),
    ];

    render(<BinGaugeRow bins={bins} />);

    const row = screen.getByTestId('bin-gauge-row');
    expect(row).toHaveClass('items-end');
  });
});
