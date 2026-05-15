/**
 * Tests for sanitizeIanaTimezone and DEFAULT_TIMEZONE.
 *
 * Security canary: Test 8 validates that the SQL-injection probe string
 * ("America/Chicago'; DROP TABLE production_orders; --") is rejected by
 * the Intl.supportedValuesOf allowlist and falls back to DEFAULT_TIMEZONE.
 *
 * This test file is the RED gate for the Pitfall 2 mitigation (IANA timezone
 * string injection via cookie) in Plan 35-04.
 */

import { sanitizeIanaTimezone, DEFAULT_TIMEZONE } from '@/lib/timezone';

describe('DEFAULT_TIMEZONE', () => {
  it('Test 12: DEFAULT_TIMEZONE is exactly "America/Chicago"', () => {
    expect(DEFAULT_TIMEZONE).toBe('America/Chicago');
  });
});

describe('sanitizeIanaTimezone', () => {
  it('Test 1 (valid IANA): returns "America/New_York" unchanged', () => {
    expect(sanitizeIanaTimezone('America/New_York')).toBe('America/New_York');
  });

  it("Test 2 (mill's TZ): returns \"America/Chicago\" unchanged", () => {
    expect(sanitizeIanaTimezone('America/Chicago')).toBe('America/Chicago');
  });

  it('Test 3 (Pacific): returns "America/Los_Angeles" unchanged', () => {
    expect(sanitizeIanaTimezone('America/Los_Angeles')).toBe('America/Los_Angeles');
  });

  it('Test 4 (UTC): returns "UTC" unchanged — valid IANA per Intl.supportedValuesOf', () => {
    expect(sanitizeIanaTimezone('UTC')).toBe('UTC');
  });

  it('Test 5 (null): returns DEFAULT_TIMEZONE ("America/Chicago") for null input', () => {
    expect(sanitizeIanaTimezone(null)).toBe('America/Chicago');
  });

  it('Test 6 (undefined): returns "America/Chicago" for undefined input', () => {
    expect(sanitizeIanaTimezone(undefined)).toBe('America/Chicago');
  });

  it('Test 7 (empty string): returns "America/Chicago" for empty string input', () => {
    expect(sanitizeIanaTimezone('')).toBe('America/Chicago');
  });

  it(
    'Test 8 (SQL-injection probe): rejects "America/Chicago\'; DROP TABLE production_orders; --" and falls back to DEFAULT_TIMEZONE',
    () => {
      // SECURITY CANARY: this is the exact injection string from RESEARCH.md Pitfall 2.
      // If this test ever starts returning the raw injection string instead of the fallback,
      // the security gate has been bypassed.
      const injectionProbe = "America/Chicago'; DROP TABLE production_orders; --";
      expect(sanitizeIanaTimezone(injectionProbe)).toBe('America/Chicago');
    }
  );

  it('Test 9 (case mismatch): rejects "america/chicago" (lowercase — not in Intl allowlist) and falls back to DEFAULT_TIMEZONE', () => {
    // IANA names are case-sensitive in Intl.supportedValuesOf('timeZone').
    // "america/chicago" is NOT in the allowlist — the secure default is to fall back.
    expect(sanitizeIanaTimezone('america/chicago')).toBe('America/Chicago');
  });

  it('Test 10 (whitespace probe): rejects " America/Chicago " (with spaces) and falls back to DEFAULT_TIMEZONE', () => {
    // The trimmed-with-space string is not a member of the allowlist, so it falls back.
    // Whitespace is NOT trimmed — better to fall back than to attempt normalization
    // which would mask injection attempts.
    expect(sanitizeIanaTimezone(' America/Chicago ')).toBe('America/Chicago');
  });

  it('Test 11 (random garbage): rejects "not-a-timezone" and falls back to DEFAULT_TIMEZONE', () => {
    expect(sanitizeIanaTimezone('not-a-timezone')).toBe('America/Chicago');
  });
});
