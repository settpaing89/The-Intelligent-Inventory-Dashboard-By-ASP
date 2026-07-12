import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  type AgingSeverity,
} from '../lib/inventoryLogic'
import { SEVERITY_STYLES } from '../lib/severityStyles'

interface InventoryInsightsProps {
  vehicles: Vehicle[]
}

const SEVERITY_ORDER: AgingSeverity[] = ['none', 'aging', 'critical']
const MAKE_BAR_COLOR = '#1e3a5f' // primary-container, matches the Primary button color

function InventoryInsights({ vehicles }: InventoryInsightsProps) {
  if (vehicles.length === 0) {
    return (
      <div className="rounded-md border border-card-border bg-white p-lg shadow-elevation-low">
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

  const makeCounts = new Map<string, number>()
  for (const vehicle of vehicles) {
    makeCounts.set(vehicle.make, (makeCounts.get(vehicle.make) ?? 0) + 1)
  }
  const makeData = [...makeCounts.entries()]
    .map(([make, count]) => ({ make, count }))
    .sort((a, b) => b.count - a.count)

  const makeSummaryText = makeData
    .map((entry) => `${entry.make}: ${entry.count}`)
    .join(', ')

  return (
    <div className="rounded-md border border-card-border bg-white p-lg shadow-elevation-low">
      <h2 className="pb-lg text-xl font-semibold text-on-surface">
        Inventory Insights
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0">
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

        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Vehicles by Make
          </h3>
          <p className="sr-only">
            Vehicle count by make, highest first: {makeSummaryText}.
          </p>
          <div aria-hidden="true" className="h-64 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={makeData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="make" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill={MAKE_BAR_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryInsights
