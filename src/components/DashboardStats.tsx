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
    <div className="flex flex-wrap gap-6">
      <div>
        <p>Total Vehicles</p>
        <p>{total}</p>
      </div>
      <div>
        <p>Aging Stock</p>
        <p>
          {agingCount} ({agingPercentage}%)
        </p>
      </div>
      <div>
        <p>Avg Days in Inventory</p>
        <p>{avgDays}</p>
      </div>
      <div>
        <p>Total Value</p>
        <p>{currencyFormatter.format(totalValue)}</p>
      </div>
    </div>
  )
}

export default DashboardStats
