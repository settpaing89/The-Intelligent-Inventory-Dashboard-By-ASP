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
import { SEVERITY_CHART_COLOR, SEVERITY_LABEL } from '../lib/severityColors'

interface InventoryInsightsProps {
  vehicles: Vehicle[]
}

const SEVERITY_ORDER: AgingSeverity[] = ['none', 'aging', 'critical']
const MAKE_BAR_COLOR = '#2563eb' // blue-600

function InventoryInsights({ vehicles }: InventoryInsightsProps) {
  if (vehicles.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-lg font-semibold">Inventory Insights</h2>
        <p className="mt-2 text-gray-600">
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
    name: SEVERITY_LABEL[severity],
    value: severityCounts[severity],
    color: SEVERITY_CHART_COLOR[severity],
  })).filter((entry) => entry.value > 0)

  const severitySummaryText = SEVERITY_ORDER.map(
    (severity) =>
      `${severityCounts[severity]} ${SEVERITY_LABEL[severity].toLowerCase()}`,
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Inventory Insights</h2>
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-gray-700">
            Aging Severity Breakdown
          </h3>
          <p className="sr-only">
            Aging severity breakdown for {vehicles.length} vehicles total:{' '}
            {severitySummaryText}.
          </p>
          <div aria-hidden="true" className="h-64">
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

        <div>
          <h3 className="text-sm font-medium text-gray-700">
            Vehicles by Make
          </h3>
          <p className="sr-only">
            Vehicle count by make, highest first: {makeSummaryText}.
          </p>
          <div aria-hidden="true" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={makeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="make"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} />
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
