import { formatDwell } from '@/lib/format-dwell';

describe('formatDwell', () => {
  // ── Sub-hour bucket (< 3600 seconds → "{N}m") ──────────────────────────────

  it('Test 1: 0 seconds returns "0m"', () => {
    expect(formatDwell(0)).toBe('0m');
  });

  it('Test 2: 59 seconds returns "0m" — under one minute floors to 0m (no seconds shown)', () => {
    expect(formatDwell(59)).toBe('0m');
  });

  it('Test 3: 60 seconds returns "1m"', () => {
    expect(formatDwell(60)).toBe('1m');
  });

  it('Test 4: 2520 seconds returns "42m" (UI-SPEC sample: 42 * 60 = 2520)', () => {
    expect(formatDwell(2520)).toBe('42m');
  });

  it('Test 5: 3599 seconds returns "59m" — last second before 1h boundary', () => {
    expect(formatDwell(3599)).toBe('59m');
  });

  // ── Hour bucket (3600 ≤ s < 86400 → "{N}h {M}m") ──────────────────────────

  it('Test 6: 3600 seconds returns "1h 0m" — first second crossing 1h boundary', () => {
    expect(formatDwell(3600)).toBe('1h 0m');
  });

  it('Test 7: 8040 seconds returns "2h 14m" (UI-SPEC sample: 2*3600 + 14*60 = 8040)', () => {
    expect(formatDwell(8040)).toBe('2h 14m');
  });

  it('Test 8: 86399 seconds returns "23h 59m" — last second before 1d boundary', () => {
    expect(formatDwell(86399)).toBe('23h 59m');
  });

  // ── Day bucket (≥ 86400 → "{N}d {M}h") ────────────────────────────────────

  it('Test 9: 86400 seconds returns "1d 0h" — first second crossing 1d boundary', () => {
    expect(formatDwell(86400)).toBe('1d 0h');
  });

  it('Test 10: 97200 seconds returns "1d 3h" (UI-SPEC sample: 86400 + 3*3600 = 97200)', () => {
    expect(formatDwell(97200)).toBe('1d 3h');
  });

  it('Test 11: 7*86400 + 5*3600 seconds returns "7d 5h" — week-long block uses days+hours (no week unit per UI-SPEC)', () => {
    expect(formatDwell(7 * 86400 + 5 * 3600)).toBe('7d 5h');
  });
});
