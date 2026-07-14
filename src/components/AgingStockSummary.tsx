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
      <div className="flex items-center gap-3 rounded-md border border-card-border bg-secondary p-sm shadow-elevation-low">
        <svg
          aria-hidden="true"
          className="h-8 w-8 shrink-0 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
        <p className="text-base font-semibold leading-tight text-white">
          No aging stock right now — all {total} vehicles are within{' '}
          {AGING_STOCK_THRESHOLD_DAYS} days.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-card-border bg-linear-to-r from-tertiary-fixed to-tertiary-fixed-dim p-sm shadow-elevation-low">
      <svg
        aria-hidden="true"
        className="h-8 w-8 shrink-0 text-on-surface"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold leading-tight text-on-surface">
          {agingStockTotal} of {total} vehicles are aging stock
        </p>
        <p className="text-sm leading-tight text-on-surface">
          {agingCount} aging, {criticalCount} critical
        </p>
      </div>
      <button
        type="button"
        onClick={onViewAging}
        className="shrink-0 rounded bg-on-tertiary-container px-4 py-2 text-sm font-semibold text-on-surface hover:opacity-90"
      >
        View Aging Stock
      </button>
    </div>
  )
}

export default AgingStockSummary
