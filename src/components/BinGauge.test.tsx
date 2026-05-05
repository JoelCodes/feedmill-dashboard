import { render, screen } from '@testing-library/react';
import { BinGauge } from './BinGauge';

describe('BinGauge', () => {
  // Test 1: Fill bar height based on fillPercentage
  it('renders fill bar with correct height based on fillPercentage', () => {
    render(
      <BinGauge
        fillPercentage={75}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    const fillBar = screen.getByTestId('fill-bar');
    // 75% of 66px max height = 49.5px
    expect(fillBar).toHaveStyle({ height: '49.5px' });
  });

  // Test 2: Green fill color when fillPercentage > 25
  it('renders green fill color when fillPercentage > 25', () => {
    render(
      <BinGauge
        fillPercentage={50}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    const fillBar = screen.getByTestId('fill-bar');
    expect(fillBar).toHaveClass('bg-[var(--success)]');
  });

  // Test 3: Yellow fill color when fillPercentage is between 10 and 25
  it('renders yellow fill color when fillPercentage is between 10 and 25', () => {
    render(
      <BinGauge
        fillPercentage={20}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    const fillBar = screen.getByTestId('fill-bar');
    expect(fillBar).toHaveClass('bg-[var(--warning)]');
  });

  // Test 4: Red fill color when fillPercentage < 10
  it('renders red fill color when fillPercentage < 10', () => {
    render(
      <BinGauge
        fillPercentage={5}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    const fillBar = screen.getByTestId('fill-bar');
    expect(fillBar).toHaveClass('bg-[var(--error)]');
  });

  // Test 5: Displays percentage text inside gauge
  it('displays percentage text inside gauge', () => {
    render(
      <BinGauge
        fillPercentage={75}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  // Test 6: Percentage text is white when fillPercentage >= 25
  it('percentage text is white when fillPercentage >= 25', () => {
    render(
      <BinGauge
        fillPercentage={50}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    const percentageText = screen.getByText('50%');
    expect(percentageText).toHaveClass('text-white');
  });

  // Test 7: Percentage text is dark when fillPercentage < 25
  it('percentage text is dark when fillPercentage < 25', () => {
    render(
      <BinGauge
        fillPercentage={20}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    const percentageText = screen.getByText('20%');
    expect(percentageText).toHaveClass('text-[#2d3748]');
  });

  // Test 8: Displays locationCode below gauge
  it('displays locationCode below gauge', () => {
    render(
      <BinGauge
        fillPercentage={50}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    expect(screen.getByText('BIN 4A')).toBeInTheDocument();
  });

  // Test 9: Displays feedType below locationCode
  it('displays feedType below locationCode', () => {
    render(
      <BinGauge
        fillPercentage={50}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    expect(screen.getByText('Pellet Feed')).toBeInTheDocument();
  });

  // Test 10: Applies correct dimensions from UI-SPEC
  it('applies correct dimensions from UI-SPEC (40x70 gauge, 36px fill width)', () => {
    render(
      <BinGauge
        fillPercentage={50}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    const container = screen.getByTestId('bin-gauge');
    expect(container).toHaveClass('w-[60px]');

    const gauge = screen.getByTestId('gauge-container');
    expect(gauge).toHaveClass('w-[40px]');
    expect(gauge).toHaveClass('h-[70px]');

    const fillBar = screen.getByTestId('fill-bar');
    expect(fillBar).toHaveClass('w-[36px]');
  });

  // Test 11: Boundary test - fillPercentage at exactly 25 (should be yellow)
  it('renders yellow fill color when fillPercentage is exactly 25', () => {
    render(
      <BinGauge
        fillPercentage={25}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    const fillBar = screen.getByTestId('fill-bar');
    expect(fillBar).toHaveClass('bg-[var(--warning)]');
  });

  // Test 12: Boundary test - fillPercentage at exactly 10 (should be yellow)
  it('renders yellow fill color when fillPercentage is exactly 10', () => {
    render(
      <BinGauge
        fillPercentage={10}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    const fillBar = screen.getByTestId('fill-bar');
    expect(fillBar).toHaveClass('bg-[var(--warning)]');
  });

  // Test 13: Clamps percentage to 0-100 range (threat mitigation T-15-02)
  it('clamps fillPercentage to 0 when negative', () => {
    render(
      <BinGauge
        fillPercentage={-10}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    const fillBar = screen.getByTestId('fill-bar');
    expect(fillBar).toHaveStyle({ height: '0px' });
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  // Test 14: Clamps percentage to 100 when over (threat mitigation T-15-02)
  it('clamps fillPercentage to 100 when over 100', () => {
    render(
      <BinGauge
        fillPercentage={150}
        locationCode="BIN 4A"
        feedType="Pellet Feed"
      />
    );

    const fillBar = screen.getByTestId('fill-bar');
    // 100% of 66px = 66px
    expect(fillBar).toHaveStyle({ height: '66px' });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
