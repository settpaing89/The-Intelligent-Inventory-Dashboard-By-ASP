import type { AgingSeverity } from './inventoryLogic'

// Shared across the severity badge (VehicleTable), row tint (VehicleTable),
// and the aging-severity chart (InventoryInsights) so they can never drift
// out of visual sync with each other.
//
// amber-500/amber-600 with white text were checked against WCAG AA
// (4.5:1 for normal text) and fail (~2.1:1 and ~3.2:1 respectively) —
// amber-700 passes at ~5.0:1, so that's used for both the "Aging" badge
// and the "View aging stock" button instead.

export const SEVERITY_BADGE_CLASS: Record<
  Exclude<AgingSeverity, 'none'>,
  string
> = {
  aging: 'bg-amber-700',
  critical: 'bg-red-600',
}

export const SEVERITY_ROW_TINT_CLASS: Record<AgingSeverity, string> = {
  none: '',
  aging: 'bg-amber-50',
  critical: 'bg-red-100',
}

export const SEVERITY_CHART_COLOR: Record<AgingSeverity, string> = {
  none: '#16a34a', // green-600
  aging: '#b45309', // amber-700, matches SEVERITY_BADGE_CLASS.aging
  critical: '#dc2626', // red-600, matches SEVERITY_BADGE_CLASS.critical
}

export const SEVERITY_LABEL: Record<AgingSeverity, string> = {
  none: 'Not Aging',
  aging: 'Aging',
  critical: 'Critical',
}
