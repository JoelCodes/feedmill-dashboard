import type { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/Card';

/**
 * KpiCard — generic KPI card primitive built on the existing Card component.
 *
 * D-08: Replaces the demo-era KPICard.tsx. No business logic, no number formatting.
 * Callers (e.g., KpiStrip) provide pre-formatted strings for every field.
 *
 * UI-SPEC: px-5/py-5 (20px) padding, --fs-22 bold value, --fs-11 bold label,
 * optional 44px (h-11/w-11) primary-colored icon container on the right.
 *
 * Accessibility: role="region" aria-label={label} — UI-SPEC § Accessibility.
 *
 * No 'use client' directive — KpiCard is RSC-friendly (no hooks, no events).
 * Safe to render server-side; Plan 35-07 will mount inside a client parent.
 */

export interface KpiCardProps {
  label: string;
  value: string;       // pre-formatted (e.g., "18,400 lbs", "58% Pellet")
  unit?: string;       // inline after value in smaller size
  subValue?: string;   // secondary line below value
  footnote?: string;   // small muted text at bottom — used for KPI-05 D-12 footnote
  icon?: LucideIcon;
}

export default function KpiCard({ label, value, unit, subValue, footnote, icon: Icon }: KpiCardProps) {
  return (
    <Card variant="default" role="region" aria-label={label}>
      <div className="flex items-start justify-between gap-4 px-5 py-5">
        <div className="flex flex-col gap-1">
          <p className="text-[var(--fs-11)] font-bold text-[var(--text-muted)]">{label}</p>
          <p className="flex items-baseline gap-1">
            <span className="text-[var(--fs-22)] font-bold text-[var(--text-primary)]">{value}</span>
            {unit && <span className="text-sm text-[var(--text-muted)]">{unit}</span>}
          </p>
          {subValue && <p className="text-sm text-[var(--text-muted)]">{subValue}</p>}
          {footnote && <p className="text-[var(--fs-11)] text-[var(--text-muted)] mt-1">{footnote}</p>}
        </div>
        {Icon && (
          <div className="h-11 w-11 rounded-xl bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
    </Card>
  );
}
