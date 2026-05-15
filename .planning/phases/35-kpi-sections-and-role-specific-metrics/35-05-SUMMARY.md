---
phase: 35
plan: "05"
subsystem: components/presentational
tags: [components, kpi-strip, kpi-card, tz-bootstrap, deletion, tdd, presentational]
dependency_graph:
  requires:
    - "Plan 35-04: KpiStripData type from src/db/queries/kpis.ts"
    - "src/components/ui/Card.tsx — Card primitive base"
  provides:
    - "KpiCard: generic KPI card primitive (label/value/unit/subValue/footnote/icon)"
    - "KpiStrip: horizontal 6-card flex-row strip with Intl formatting + overflow-x-auto"
    - "KpiStripSkeleton: 6 animate-pulse placeholders for Suspense fallback"
    - "TzBootstrap: client component that writes tz cookie on mount for D-02"
  affects:
    - "Plan 35-07: mounts KpiStrip in ProductionDashboard.tsx + TzBootstrap in layout.tsx"
tech_stack:
  added: []
  patterns:
    - "RSC-friendly server component (no 'use client') for KpiCard"
    - "'use client' KpiStrip for lucide-react icon imports and future UX flexibility"
    - "Intl.NumberFormat('en-US') thousands formatting in KpiStrip (not KpiCard — dumb-component contract)"
    - "formulaMixDisplay() pure helper: dominant-bucket sort desc, em-dash null state"
    - "useEffect(fn, []) once-on-mount cookie write for TzBootstrap"
    - "encodeURIComponent() defense-in-depth for IANA timezone cookie value"
    - "KpiStripSkeleton follows ColumnSkeleton animate-pulse pattern (Phase 34)"
key_files:
  created:
    - src/components/KpiCard.tsx
    - src/components/KpiCard.test.tsx
    - src/components/KpiStrip.tsx
    - src/components/KpiStrip.test.tsx
    - src/components/TzBootstrap.tsx
  deleted:
    - src/components/KPICard.tsx
decisions:
  - "Null KPI-05 percentages render as em dash '—' (all three pcts null — D-12 NULLIF case); UI-SPEC does not specify this state; em dash is the standard no-data treatment used elsewhere in the dashboard"
  - "KpiCard is RSC-friendly (no 'use client') — dumb-component contract; callers provide pre-formatted strings"
  - "'use client' on KpiStrip chosen for lucide-react icons and future scroll-snap/hover UX without refactor"
  - "fmtLbs() and formulaMixDisplay() are pure module-scope helpers — not exported (internal formatting concern of KpiStrip)"
  - "KPICard.tsx pre-delete grep confirmed zero external importers before deletion"
metrics:
  duration: "5m"
  completed: "2026-05-15"
  tasks_completed: 3
  files_created: 5
  files_modified: 0
  files_deleted: 1
requirements: [KPI-01, KPI-02, KPI-04, KPI-05]
---

# Phase 35 Plan 05: KpiCard + KpiStrip + TzBootstrap Presentational Components Summary

**One-liner:** TDD-built KpiCard primitive (RSC-friendly, dumb-component contract) + KpiStrip (client, 6-card flex-row with Intl formatting + dominant-bucket KPI-05) + TzBootstrap (cookie-write side effect on mount) + D-08 deletion of demo-era KPICard.tsx.

---

## What Was Built

### `src/components/KpiCard.tsx` (NEW)

Exports: `default KpiCard`, `interface KpiCardProps`

Generic KPI card primitive built on the existing `Card` component. RSC-friendly — no hooks, no events, no `'use client'` directive.

Prop shape:
```typescript
interface KpiCardProps {
  label: string;
  value: string;       // pre-formatted (e.g., "18,400 lbs", "58% Pellet")
  unit?: string;       // inline after value in smaller size
  subValue?: string;   // secondary line below value
  footnote?: string;   // small muted text at bottom — KPI-05 D-12 surface
  icon?: LucideIcon;
}
```

Visual structure per UI-SPEC:
- Outer: `Card variant="default"` with `role="region" aria-label={label}`
- Inner padding: `px-5 py-5` (20px — matches ProductionCard.tsx pl-5 prior art)
- Label: `text-[var(--fs-11)] font-bold text-[var(--text-muted)]`
- Value: `text-[var(--fs-22)] font-bold text-[var(--text-primary)]`
- Icon container (when `icon` prop present): `h-11 w-11 rounded-xl bg-[var(--primary)]` with `Icon className="h-5 w-5 text-white"`

**Dumb-component contract locked:** No number formatting, no business logic. Callers (KpiStrip) provide pre-formatted strings.

### `src/components/KpiStrip.tsx` (NEW)

Exports: `default KpiStrip`, `KpiStripSkeleton`

Horizontal strip composing 6 KpiCard instances per UI-SPEC zone 1 (D-07). Marked `'use client'` for lucide-react icon imports and future scroll-snap/hover UX without refactor.

Cards rendered (left to right):
1. "Completed Today" — `fmtLbs(completedTodayLbs)` + Wheat icon
2. "Premix Today" — `fmtLbs(premixLbs)`, no icon
3. "Excel Today" — `fmtLbs(excelLbs)`, no icon
4. "CGM Today" — `fmtLbs(cgmLbs)`, no icon
5. "Pending Backlog" — `${pendingCount} orders` value + `${N} lbs total` subValue + ClipboardList icon
6. "Formula Mix" — dominant-bucket value + remaining-two subValue + D-12 footnote + Activity icon

**Pure helpers at module scope:**
- `fmtLbs(raw: string): string` — `Intl.NumberFormat('en-US').format(parseFloat(raw || '0')) + ' lbs'`. Defensive `|| '0'` handles edge cases.
- `formulaMixDisplay(p: KpiStripData): { value, subValue, footnote }` — sorts [Pellet/Mash/Crumble] desc; dominant = value; remaining two = subValue joined by ` · `; D-12 footnote when `uncategorizedCount > 0`.

**KpiStripSkeleton:** 6 `h-[88px] w-[140px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--divider)]` placeholders in `flex flex-row gap-4`, matching the ColumnSkeleton pattern from Phase 34.

### `src/components/TzBootstrap.tsx` (NEW)

Exports: `default TzBootstrap`

Side-effect-only client component (renders `null`) that writes the operator's IANA timezone to a `tz` cookie on first mount (D-02).

```typescript
useEffect(() => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    const encoded = encodeURIComponent(tz);
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `tz=${encoded}; path=/; max-age=86400; SameSite=Lax${secure}`;
  } catch {
    // Older runtimes: fall back silently — server uses DEFAULT_TIMEZONE.
  }
}, []);
```

Cookie spec: `path=/`, `max-age=86400` (24h), `SameSite=Lax`, `Secure` on HTTPS.

T-35-05-01 mitigations:
- `encodeURIComponent()` prevents semicolons/quotes in IANA strings from breaking the cookie header
- Server-side `sanitizeIanaTimezone()` (Plan 35-04) validates against `Intl.supportedValuesOf('timeZone')` allowlist

First-render behavior: until component mounts, `tz` cookie is absent and the server falls back to `'America/Chicago'`. On the next polling tick (30s cadence), KPIs re-render against the operator's actual timezone. This is documented — not a UAT surprise.

Plan 35-07 mounts this inside `src/app/layout.tsx` adjacent to `{children}`.

### `src/components/KPICard.tsx` (DELETED — D-08)

Pre-delete verification: `grep -rn 'KPICard' src/` returned only the file itself (zero external importers). Deletion committed as `chore(35-05): D-08 — delete demo-era KPICard.tsx`.

The new file is `src/components/KpiCard.tsx` (camelCase 'pi').

---

## TDD Gate Compliance

### Task 1: KpiCard

| Gate | Commit | Result |
|------|--------|--------|
| RED | `d1dd870` — `test(35-05): RED — KpiCard rendering smoke tests + accessibility wrapper` | 6/7 tests failed (macOS case-insensitive FS resolved KPICard.tsx; component mismatch caused failures) |
| Delete KPICard.tsx | `6fc5054` — `chore(35-05): D-08 — delete demo-era KPICard.tsx` | File removed, 0 external importers |
| GREEN | `ef45003` — `feat(35-05): GREEN — KpiCard primitive on Card with px-5/py-5 padding and accent icon container` | 7 tests pass |
| REFACTOR | Skipped — implementation is already minimal per plan | — |

### Task 2: KpiStrip

| Gate | Commit | Result |
|------|--------|--------|
| RED | `020de2f` — `test(35-05): RED — KpiStrip composition + Intl number formatting + KPI-05 dominant-bucket selection + KpiStripSkeleton` | All 10 tests failed (module not found) |
| GREEN | `91c443f` — `feat(35-05): GREEN — KpiStrip + KpiStripSkeleton with Intl number formatting + dominant-bucket Formula Mix` | 10 tests pass |
| REFACTOR | Skipped — implementation complete on first GREEN pass | — |

### Task 3: TzBootstrap

TDD exempt per VALIDATION.md — cookie-write side effect; low-value to unit-test.

### TDD Gate Sequence: PASSED

RED commits (`test(35-05):` prefix) exist BEFORE GREEN commits (`feat(35-05):` prefix).

---

## Test Counts

| Suite | Tests | Status |
|-------|-------|--------|
| `src/components/KpiCard.test.tsx` | 7 | All pass |
| `src/components/KpiStrip.test.tsx` | 10 | All pass |
| `src/components/TzBootstrap.test.*` | 0 (intentional — VALIDATION.md) | N/A |
| **Total** | **17** | **All pass** |

---

## Verification Results

| Check | Result |
|-------|--------|
| `npm test -- --testPathPatterns="components/(KpiCard|KpiStrip)\.test"` | 17/17 pass |
| `npx tsc --noEmit` (new files) | 0 errors in KpiCard, KpiStrip, TzBootstrap |
| `grep -rn 'KPICard' src/ \| grep -v "components/KpiCard"` | 0 matches (D-08 verified) |
| `ls src/components/KPICard.tsx` | File does not exist (macOS CI uses git state — git confirms deleted) |
| `grep -c "^'use client'" src/components/TzBootstrap.tsx` | 1 |
| `grep -c "^'use client'" src/components/KpiStrip.tsx` | 1 |
| `grep -c "^'use client'" src/components/KpiCard.tsx` | 0 (RSC-friendly) |
| D-13 — no new npm dependencies | Verified — zero new packages |

---

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### UI-SPEC Clarification (documented choice, not a bug)

**1. KPI-05 null-percentage empty state renders em dash "—"**
- **Context:** Test 7 in KpiStrip — when `pelletPct: null, mashPct: null, crumblePct: null` (no categorized completions today — D-12 NULLIF case), the UI-SPEC does not specify explicit copy.
- **Choice:** Value displays `"—"` (em dash); `subValue` and `footnote` are both undefined (not rendered).
- **Rationale:** Em dash is the standard "no data" treatment used elsewhere in the dashboard. The footnote is also omitted since there are no categorized completions to have an uncategorized count against.
- **Plan note:** PLAN.md § Test 7 explicitly documents this choice: "falling back to em dash is the standard 'no data' treatment used elsewhere in the dashboard."
- **Impact:** None — this is a UI-SPEC clarification, not a plan deviation. Documented here as required by output spec.

---

## Known Stubs

None — all three components are complete, typed, and ready for downstream consumption.

- `KpiCard` is a pure presentational primitive; no wiring needed.
- `KpiStrip` receives `KpiStripData` directly and renders all 6 cards; Plan 35-07 wires the data source.
- `TzBootstrap` writes the cookie on mount; Plan 35-07 mounts it in `src/app/layout.tsx`.

---

## Threat Flags

No new security-relevant surface beyond what the threat model (PLAN.md § threat_model) already covers:

- T-35-05-01 (IANA cookie tampering): mitigated via `encodeURIComponent()` in TzBootstrap + server-side `sanitizeIanaTimezone()` allowlist (Plan 35-04).
- T-35-05-02 (non-HttpOnly cookie): accepted — IANA timezone is not sensitive data.
- T-35-05-03 (KpiCard/KpiStrip in non-authenticated context): accepted — page-level auth gate in `src/app/page.tsx` (Phase 31 D-02) covers all renders.
- T-35-05-04 (KPICard.tsx deletion audit): accepted — git commit chain provides audit trail.
- T-35-05-05 (TzBootstrap re-mount DoS): accepted — one `Intl.DateTimeFormat()` call + one `document.cookie =` write per mount.

## Self-Check: PASSED
