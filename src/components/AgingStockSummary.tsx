import type { Vehicle } from '../types/vehicle'
import {
  AGING_STOCK_THRESHOLD_DAYS,
  getAgingSeverity,
  getDaysInInventory,
} from '../lib/inventoryLogic'

interface AgingStockSummaryProps {
  vehicles: Vehicle[]
  onViewAging: () => void
}

function AgingStockSummary({ vehicles, onViewAging }: AgingStockSummaryProps) {
  let agingCount = 0
  let criticalCount = 0

  for (const vehicle of vehicles) {
    const severity = getAgingSeverity(getDaysInInventory(vehicle.intakeDate))
    if (severity === 'aging') {
      agingCount += 1
    } else if (severity === 'critical') {
      criticalCount += 1
    }
  }

  const agingStockTotal = agingCount + criticalCount
  const total = vehicles.length

  if (agingStockTotal === 0) {
    return (
      <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
        <p className="text-lg font-semibold text-green-800">
          No aging stock right now — all {total} vehicles are within{' '}
          {AGING_STOCK_THRESHOLD_DAYS} days.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
      <p className="text-lg font-semibold text-amber-900">
        {agingStockTotal} of {total} vehicles are aging stock — {agingCount}{' '}
        aging, {criticalCount} critical
      </p>
      <button
        type="button"
        onClick={onViewAging}
        className="mt-3 rounded bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700"
      >
        View aging stock
      </button>
    </div>
  )
}

export default AgingStockSummary
