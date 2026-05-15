/**
 * IANA timezone sanitization helper.
 *
 * No React, no Next.js, no database — this file is intentionally free of
 * browser/server APIs so it can be imported from both RSC and client contexts.
 * No server or client directive — pure helper, safe in any module context.
 *
 * Security: Pitfall 2 mitigation (RESEARCH.md § "Pitfall 2: IANA Timezone
 * String Injection via Cookie"). The `tz` cookie value is operator-controlled.
 * A malicious actor could inject arbitrary text into the cookie, and if that
 * value were composed directly into a Drizzle sql`... AT TIME ZONE ${tz}` call,
 * it would reach the Postgres wire protocol. This function is the ONLY barrier
 * between the cookie value and SQL composition — every KPI query that accepts
 * a `tz` parameter MUST call sanitizeIanaTimezone before any sql`` interpolation.
 *
 * D-02 fallback: When the cookie is absent (first render before <TzBootstrap />
 * runs) or contains an invalid value, the fallback is 'America/Chicago' — the
 * mill's physical location. KPIs render against the fallback timezone; on the
 * next polling tick after the cookie is set, KPIs re-render against the
 * operator's actual timezone.
 *
 * Implementation note: Intl.supportedValuesOf('timeZone') is called inside the
 * function body, not cached at module scope. Node's V8 implementation lazy-loads
 * the ICU data — first-call cost is tolerable and module-load caching introduces
 * test-isolation surprises in Jest worker reuse (RESEARCH.md Assumption A2).
 *
 * No regex pre-filtering is applied. The Intl allowlist IS the validation
 * surface — a regex would either be redundant or wrong (IANA names contain
 * '/', '_', digits). Regex normalization would mask injection attempts.
 */

/** Fallback timezone when the operator's IANA cookie is absent or invalid (D-02). */
export const DEFAULT_TIMEZONE = 'America/Chicago' as const;

/**
 * Validates a raw timezone string from an operator-controlled cookie against the
 * Intl.supportedValuesOf('timeZone') allowlist (Pitfall 2 mitigation).
 *
 * Returns the input unchanged if it is a valid IANA timezone name.
 * Returns DEFAULT_TIMEZONE ('America/Chicago') for null, undefined, empty string,
 * whitespace-padded values, case-mismatched values, or SQL-injection probe strings.
 *
 * @param raw - The raw string from cookies().get('tz')?.value, or null/undefined.
 * @returns A valid IANA timezone string (always non-null, non-empty).
 */
export function sanitizeIanaTimezone(raw: string | null | undefined): string {
  if (raw === null || raw === undefined || raw === '') return DEFAULT_TIMEZONE;
  const allowlist = Intl.supportedValuesOf('timeZone');
  return allowlist.includes(raw) ? raw : DEFAULT_TIMEZONE;
}
