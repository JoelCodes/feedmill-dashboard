'use client';

import { useEffect } from 'react';

/**
 * TzBootstrap — side-effect-only client component that writes the operator's
 * IANA timezone to a `tz` cookie on first mount.
 *
 * D-02: The dashboard KPI queries need the operator's browser timezone to
 * compute "today" correctly. This component reads
 * `Intl.DateTimeFormat().resolvedOptions().timeZone` and writes it to a
 * non-HttpOnly cookie so the RSC page can read it via `cookies().get('tz')`.
 *
 * Cookie spec:
 *  - Name: `tz`
 *  - Value: encodeURIComponent(IANA timezone) — guards against semicolons/quotes
 *    in IANA strings containing '/' (T-35-05-01 defense-in-depth)
 *  - path=/  — scopes to the whole app
 *  - max-age=86400 — 24h; refreshes on every page load
 *  - SameSite=Lax — matches the dashboard's auth cookie posture
 *  - Secure — set automatically over HTTPS in production
 *
 * First-render behavior: until this component runs, the `tz` cookie is absent
 * and the server falls back to 'America/Chicago'. On the first polling tick
 * after mount, KPIs re-render against the operator's actual timezone.
 *
 * Renders: null — this component exists only for its side effect.
 *
 * Plan 35-07 mounts this inside `src/app/layout.tsx` adjacent to {children}.
 * No unit test — VALIDATION.md explicitly marks TzBootstrap as low-value to
 * unit-test (JSDOM cookie API + Intl mock are heavy for a one-line side effect).
 * Integration validation via Plan 35-07 manual UAT: load /, open DevTools,
 * confirm `tz` cookie value matches `Intl.DateTimeFormat().resolvedOptions().timeZone`.
 */
export default function TzBootstrap(): null {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      const encoded = encodeURIComponent(tz);
      // Non-HttpOnly (intentional — the client wrote it; the value is not sensitive).
      // path=/ scopes to the whole app. max-age=86400 (24h) — refreshes daily.
      // SameSite=Lax matches the dashboard's auth cookie posture.
      // Secure flag set in production over HTTPS.
      const secure =
        typeof window !== 'undefined' && window.location.protocol === 'https:'
          ? '; Secure'
          : '';
      document.cookie = `tz=${encoded}; path=/; max-age=86400; SameSite=Lax${secure}`;
    } catch {
      // Older runtimes / restricted environments: silently fall back.
      // The server will use DEFAULT_TIMEZONE ('America/Chicago').
    }
  }, []);

  return null;
}
