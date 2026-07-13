import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Vehicle } from '../types/vehicle'
import {
  getAgingSeverity,
  getDaysInInventory,
  getDaysInInventoryDistribution,
  getSeverityBreakdownByMake,
  type AgingSeverity,
} from '../lib/inventoryLogic'
import { SEVERITY_STYLES } from '../lib/severityStyles'

interface InventoryInsightsProps {
  vehicles: Vehicle[]
}

const SEVERITY_ORDER: AgingSeverity[] = ['none', 'aging', 'critical']

// Which severity band a days-in-inventory bucket's color should borrow from.
const BUCKET_SEVERITY: Record<string, AgingSeverity> = {
  '0-30': 'none',
  '31-60': 'none',
  '61-90': 'none',
  '91-120': 'aging',
  '121-150': 'aging',
  '151+': 'critical',
}

// Text color per severity for the heatmap table cells, independently
// contrast-checked against that severity's badge background (not reused
// from severityStyles.ts's badgeTextClass, since that pairing is
// `text-white` for "none" — measured ~3.74:1 against #0D9488, a known WCAG
// AA failure documented in SYSTEM_DESIGN.md's Stage 10 entry). Verified via
// the WCAG relative-luminance formula:
//   none/healthy (#0D9488) + on-surface (#0b1c30): ~4.59:1 (passes; white fails at ~3.74:1)
//   aging (#D97706) + tertiary (#3b1c00): ~4.88:1 (passes; matches existing badge convention)
//   critical (#DC2626) + white: ~4.83:1 (passes; matches existing badge convention)
const HEATMAP_TEXT_CLASS: Record<AgingSeverity, string> = {
  none: 'text-on-surface',
  aging: 'text-tertiary',
  critical: 'text-white',
}

// Zero-count cells use a muted neutral instead of a severity color — table-header
// is the same light neutral already used for VehicleTable's header/detail rows,
// paired with on-surface-variant (~8.5:1, comfortably clears WCAG AA).
const HEATMAP_ZERO_CLASS = 'bg-table-header text-on-surface-variant'

function heatmapCellClass(count: number, severity: AgingSeverity): string {
  if (count === 0) {
    return HEATMAP_ZERO_CLASS
  }
  return `${SEVERITY_STYLES[severity].badgeBgClass} ${HEATMAP_TEXT_CLASS[severity]}`
}

function InventoryInsights({ vehicles }: InventoryInsightsProps) {
  if (vehicles.length === 0) {
    return (
      <div className="rounded-md border border-card-border bg-white p-sm shadow-elevation-low">
        <h2 className="text-xl font-semibold text-on-surface">
          Inventory Insights
        </h2>
        <p className="mt-2 text-on-surface-variant">
          No vehicles in inventory to chart yet.
        </p>
      </div>
    )
  }

  const severityCounts: Record<AgingSeverity, number> = {
    none: 0,
    aging: 0,
    critical: 0,
  }
  for (const vehicle of vehicles) {
    severityCounts[getAgingSeverity(getDaysInInventory(vehicle.intakeDate))] +=
      1
  }
  const severityData = SEVERITY_ORDER.map((severity) => ({
    severity,
    name: SEVERITY_STYLES[severity].label,
    value: severityCounts[severity],
    color: SEVERITY_STYLES[severity].chartColor,
  })).filter((entry) => entry.value > 0)

  const severitySummaryText = SEVERITY_ORDER.map(
    (severity) =>
      `${severityCounts[severity]} ${SEVERITY_STYLES[severity].label.toLowerCase()}`,
  ).join(', ')

  // Already sorted worst-first (aging + critical desc, then total desc, then
  // alphabetically) by the function itself — not re-sorted here.
  const makeSeverityData = getSeverityBreakdownByMake(vehicles)

  const distributionData = getDaysInInventoryDistribution(vehicles)

  const distributionSummaryText = distributionData
    .map((bucket) => `${bucket.label} days: ${bucket.count}`)
    .join(', ')

  return (
    <div className="rounded-md border border-card-border bg-white p-sm shadow-elevation-low">
      <h2 className="pb-sm text-xl font-semibold text-on-surface">
        Inventory Insights
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Aging Severity Breakdown
          </h3>
          <p className="sr-only">
            Aging severity breakdown for {vehicles.length} vehicles total:{' '}
            {severitySummaryText}.
          </p>
          <div aria-hidden="true" className="h-64 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={severityData.length > 1 ? 2 : 0}
                  label={({ value }) => value}
                >
                  {severityData.map((entry) => (
                    <Cell key={entry.severity} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Severity by Make
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border border-card-border px-2 py-1 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                  >
                    Make
                  </th>
                  <th
                    scope="col"
                    className="border border-card-border px-2 py-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                  >
                    Healthy
                  </th>
                  <th
                    scope="col"
                    className="border border-card-border px-2 py-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                  >
                    Aging
                  </th>
                  <th
                    scope="col"
                    className="border border-card-border px-1 py-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                  >
                    Crit
                  </th>
                </tr>
              </thead>
              <tbody>
                {makeSeverityData.map((entry) => (
                  <tr key={entry.make}>
                    <th
                      scope="row"
                      className="border border-card-border px-2 py-1 text-left text-sm font-medium text-on-surface"
                    >
                      {entry.make}
                    </th>
                    <td
                      className={`border border-card-border px-2 py-1 text-center text-sm font-semibold ${heatmapCellClass(entry.none, 'none')}`}
                    >
                      {entry.none}
                    </td>
                    <td
                      className={`border border-card-border px-2 py-1 text-center text-sm font-semibold ${heatmapCellClass(entry.aging, 'aging')}`}
                    >
                      {entry.aging}
                    </td>
                    <td
                      className={`border border-card-border px-1 py-1 text-center text-sm font-semibold ${heatmapCellClass(entry.critical, 'critical')}`}
                    >
                      {entry.critical}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Days in Inventory Distribution
          </h3>
          <p className="sr-only">
            Vehicle count by days-in-inventory range: {distributionSummaryText}.
          </p>
          <div aria-hidden="true" className="h-64 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" interval={0} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count">
                  {distributionData.map((entry) => (
                    <Cell
                      key={entry.label}
                      fill={
                        SEVERITY_STYLES[BUCKET_SEVERITY[entry.label]].chartColor
                      }
                    />
                  ))}
                  <LabelList dataKey="count" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryInsights
