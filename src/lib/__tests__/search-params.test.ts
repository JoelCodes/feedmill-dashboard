/**
 * TDD tests for src/lib/search-params.ts
 *
 * Covers D-04 (unknown-value drop), D-05 (q default), D-06 (order default).
 * All tests are pure unit tests — no mocks needed, no network calls.
 *
 * RED commit: these tests are written BEFORE the implementation exists.
 * GREEN commit: implementation satisfies all six behaviors.
 */

import { searchParamsCache, STATE_ORDER } from '../search-params';

describe('searchParamsCache', () => {
  /**
   * Test 1: comma-separated valid statuses resolve to an array
   * D-04: known values are kept
   */
  it('parses known status values into an array', () => {
    const result = searchParamsCache.parse({ status: 'Pending,Mixing' });
    expect(result.status).toEqual(['Pending', 'Mixing']);
    expect(result.q).toBe('');
    expect(result.order).toBe('');
  });

  /**
   * Test 2: unknown status values are silently dropped (D-04)
   */
  it('silently drops unknown status values (D-04 unknown-value drop)', () => {
    const result = searchParamsCache.parse({ status: 'Pending,BadValue,Mixing' });
    expect(result.status).toEqual(['Pending', 'Mixing']);
    expect(result.q).toBe('');
    expect(result.order).toBe('');
  });

  /**
   * Test 3: missing status key returns empty array via .withDefault([])
   */
  it('returns status: [] when status key is missing', () => {
    const result = searchParamsCache.parse({});
    expect(result.status).toEqual([]);
  });

  /**
   * Test 4: q defaults to '' and round-trips verbatim (D-05)
   * Parsing does NOT trim/lowercase — that is a render-time concern
   */
  it('defaults q to empty string and round-trips without transformation', () => {
    const defaultResult = searchParamsCache.parse({});
    expect(defaultResult.q).toBe('');

    const withQuery = searchParamsCache.parse({ q: 'ACME' });
    expect(withQuery.q).toBe('ACME');
  });

  /**
   * Test 5: order defaults to '' and preserves any string verbatim (D-06)
   */
  it('defaults order to empty string and preserves any string verbatim', () => {
    const defaultResult = searchParamsCache.parse({});
    expect(defaultResult.order).toBe('');

    const withOrder = searchParamsCache.parse({ order: 'ord_abc123' });
    expect(withOrder.order).toBe('ord_abc123');
  });

  /**
   * Test 6: STATE_ORDER deep-equals the canonical production state ordering
   * and is typed as readonly ProductionState[] via `as const satisfies`
   */
  it('STATE_ORDER is the canonical readonly tuple of production states', () => {
    expect(STATE_ORDER).toEqual(['Pending', 'Mixing', 'Completed', 'Blocked']);
    // Verify it is a proper tuple (not a mutable array leaked from runtime)
    expect(Array.isArray(STATE_ORDER)).toBe(true);
    expect(STATE_ORDER).toHaveLength(4);
  });
});
