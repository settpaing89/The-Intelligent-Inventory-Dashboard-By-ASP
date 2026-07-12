import type { AgingSeverity } from './inventoryLogic'

// Single source of truth for severity badge styling, shared by VehicleTable
// (the status badge column) and InventoryInsights (the donut chart segment
// colors), per DESIGN.md's "Badges (Status Tags)" spec:
//   - Healthy/New: Teal (#0D9488) background, white text
//   - Aging: Amber (#D97706) background, "high-contrast dark amber text"
//   - Critical: Red (#DC2626) background, white text
//
// DESIGN.md doesn't give an exact hex for "dark amber text" on the Aging
// badge. Rather than invent a new color, `tertiary` (#3b1c00) is reused —
// it's the frontmatter token DESIGN.md's own "Colors" section names as the
// one "used exclusively for 'Aging' stock warnings," and it clears WCAG AA
// (~4.9:1) against the #D97706 background — checked, not assumed, per the
// same rigor applied to the Stage 8 badge-contrast fixes.
export interface SeverityStyle {
  label: string
  badgeBgClass: string
  badgeTextClass: string
  chartColor: string
}

export const SEVERITY_STYLES: Record<AgingSeverity, SeverityStyle> = {
  none: {
    label: 'Healthy',
    badgeBgClass: 'bg-badge-healthy',
    badgeTextClass: 'text-white',
    chartColor: '#0D9488',
  },
  aging: {
    label: 'Aging',
    badgeBgClass: 'bg-badge-aging',
    badgeTextClass: 'text-tertiary',
    chartColor: '#D97706',
  },
  critical: {
    label: 'Critical',
    badgeBgClass: 'bg-badge-critical',
    badgeTextClass: 'text-white',
    chartColor: '#DC2626',
  },
}
