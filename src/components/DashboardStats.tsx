import type { Vehicle } from '../types/vehicle'
import {
  getAgingVehicles,
  getAverageDaysInInventory,
  getTotalInventoryValue,
} from '../lib/inventoryLogic'

interface DashboardStatsProps {
  vehicles: Vehicle[]
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function DashboardStats({ vehicles }: DashboardStatsProps) {
  const total = vehicles.length
  const agingCount = getAgingVehicles(vehicles).length
  const agingPercentage =
    total === 0 ? 0 : Math.round((agingCount / total) * 100)
  const avgDays = Math.round(getAverageDaysInInventory(vehicles))
  const totalValue = getTotalInventoryValue(vehicles)

  return (
    <div className="rounded-md border border-card-border bg-white p-lg shadow-elevation-low">
      <h2 className="pb-lg text-xl font-semibold text-on-surface">
        Inventory Overview
      </h2>
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Total Vehicles
          </p>
          <p className="text-2xl font-semibold text-on-surface">{total}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Aging Stock
          </p>
          <p className="text-2xl font-semibold text-on-surface">
            {agingCount} ({agingPercentage}%)
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Avg Days in Inventory
          </p>
          <p className="text-2xl font-semibold text-on-surface">{avgDays}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Total Value
          </p>
          <p className="text-2xl font-semibold text-on-surface">
            {currencyFormatter.format(totalValue)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardStats
