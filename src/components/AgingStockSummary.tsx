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
      <div className="rounded-md border border-card-border bg-secondary p-sm shadow-elevation-low">
        <p className="text-xl font-semibold text-white">
          No aging stock right now — all {total} vehicles are within{' '}
          {AGING_STOCK_THRESHOLD_DAYS} days.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-card-border bg-tertiary-container p-sm shadow-elevation-low">
      <p className="text-xl font-semibold text-white">
        {agingStockTotal} of {total} vehicles are aging stock — {agingCount}{' '}
        aging, {criticalCount} critical
      </p>
      <button
        type="button"
        onClick={onViewAging}
        className="mt-2 rounded bg-white px-4 py-2 text-sm font-semibold text-tertiary-container hover:bg-surface-container"
      >
        View aging stock
      </button>
    </div>
  )
}

export default AgingStockSummary
