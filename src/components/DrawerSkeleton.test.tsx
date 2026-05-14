/**
 * Structure tests for DrawerSkeleton component.
 *
 * TDD RED phase: tests written before implementation.
 * These will fail until src/components/DrawerSkeleton.tsx is created.
 *
 * PROD-10 + UI-SPEC §7 Loading Skeletons + D-23:
 * - 480px width container
 * - >= 6 field-row animate-pulse placeholders
 * - >= 3 timeline-row animate-pulse placeholders
 * - Purely presentational (no useState, no onClick)
 */
import { render } from '@testing-library/react';
import DrawerSkeleton from './DrawerSkeleton';

describe('DrawerSkeleton', () => {
  it('Test 4: container has w-[480px] class (480px width)', () => {
    const { container } = render(<DrawerSkeleton />);
    const root = container.firstElementChild;
    expect(root?.className).toContain('w-[480px]');
  });

  it('Test 5: renders at least 6 animate-pulse field-row placeholders (label + value pairs)', () => {
    const { container } = render(<DrawerSkeleton />);
    // Field rows: pairs of skeleton lines. Count animate-pulse elements that serve as field rows.
    // Field rows appear as divs with h-3 (label) and h-4 (value) inside a flex-col container.
    const labelRows = container.querySelectorAll('.h-3.animate-pulse');
    expect(labelRows.length).toBeGreaterThanOrEqual(6);
  });

  it('Test 6: renders at least 3 animate-pulse timeline-row placeholders', () => {
    const { container } = render(<DrawerSkeleton />);
    // Timeline rows have a rounded-full dot indicator
    const timelineDots = container.querySelectorAll('.rounded-full.animate-pulse');
    expect(timelineDots.length).toBeGreaterThanOrEqual(3);
  });

  it('Test 7: component is purely presentational (no useState or onClick in source)', () => {
    // Source assertion — component must not contain useState or onClick
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(__dirname, 'DrawerSkeleton.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toMatch(/useState|onClick/);
  });
});
