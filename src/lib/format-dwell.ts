/**
 * Dwell-time duration formatting helper.
 *
 * No React, no Next.js, no database — this file is intentionally free of
 * browser/server APIs so it can be imported from both RSC and client contexts.
 *
 * D-03: Dwell time = NOW() - MAX(changed_at) for the most-recent Block event
 * in order_events. SQL produces an interval; the query extracts epoch seconds
 * via EXTRACT(EPOCH FROM ...) before passing the number to this helper.
 *
 * Input unit: epoch SECONDS (not milliseconds — comes from EXTRACT(EPOCH FROM
 * interval) in SQL, not from JS Date.getTime()).
 *
 * Format (UI-SPEC Copywriting Contract):
 *   < 3600s  → "{N}m"       (e.g., "42m")  — minutes only; sub-minute truncated
 *   < 86400s → "{N}h {M}m"  (e.g., "2h 14m") — hours and minutes
 *   ≥ 86400s → "{N}d {M}h"  (e.g., "1d 3h")  — days and hours (no week unit)
 *
 * IMPORTANT: Uses Math.floor (integer truncation), NOT Math.round. The
 * UI-SPEC sample "2h 14m" for 2h 14m 30s confirms truncation semantics.
 * Using Math.round would produce "2h 15m" for that input — incorrect.
 *
 * Caller contract: epochSeconds is a non-negative finite number from SQL.
 * Null/undefined inputs are a TypeScript error site — resolve at the call site.
 */

/**
 * Formats a dwell duration (epoch seconds from EXTRACT(EPOCH FROM interval))
 * into the UI-SPEC display string.
 *
 * @param epochSeconds - Non-negative integer seconds from Postgres EXTRACT(EPOCH ...).
 * @returns Formatted duration string per the UI-SPEC three-bucket format.
 */
export function formatDwell(epochSeconds: number): string {
  if (epochSeconds < 3600) {
    return `${Math.floor(epochSeconds / 60)}m`;
  }
  if (epochSeconds < 86400) {
    const h = Math.floor(epochSeconds / 3600);
    const m = Math.floor((epochSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(epochSeconds / 86400);
  const h = Math.floor((epochSeconds % 86400) / 3600);
  return `${d}d ${h}h`;
}
