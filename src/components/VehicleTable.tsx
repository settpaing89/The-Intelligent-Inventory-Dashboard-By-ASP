import { Fragment, useState } from 'react'
import type { Vehicle } from '../types/vehicle'
import { getAgingSeverity, getDaysInInventory } from '../lib/inventoryLogic'
import { SEVERITY_STYLES } from '../lib/severityStyles'

interface VehicleTableProps {
  vehicles: Vehicle[]
  onLogAction: (vehicle: Vehicle) => void
}

function formatIntakeDate(intakeDate: string): string {
  return new Date(intakeDate).toLocaleDateString(undefined, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function VehicleTable({ vehicles, onLogAction }: VehicleTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  function toggleExpanded(id: number) {
    setExpandedIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (vehicles.length === 0) {
    return (
      <p className="text-on-surface-variant">No vehicles match your filters</p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-card-border">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-table-header">
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Make
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Model
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Year
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Trim
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Days in Inventory
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Price
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => {
            const isExpanded = expandedIds.has(vehicle.id)
            const days = getDaysInInventory(vehicle.intakeDate)
            const severity = getAgingSeverity(days)
            const style = SEVERITY_STYLES[severity]
            const detailRowId = `vehicle-details-${vehicle.id}`
            return (
              <Fragment key={vehicle.id}>
                <tr className="border-b border-card-border hover:bg-table-hover">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(vehicle.id)}
                      aria-expanded={isExpanded}
                      aria-controls={detailRowId}
                      className="flex items-center gap-1 text-left text-sm text-on-surface"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 items-center justify-center"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`h-5 w-5 transition-transform duration-150 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        >
                          <path d="M7 5l6 5-6 5" />
                        </svg>
                      </span>
                      {vehicle.make}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface">
                    {vehicle.model}
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface">
                    {vehicle.year}
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface">
                    {vehicle.trim}
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface">{days}</td>
                  <td className="px-4 py-3 text-sm text-on-surface">
                    {vehicle.price}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-badge px-2 py-0.5 text-[11px] font-medium ${style.badgeBgClass} ${style.badgeTextClass}`}
                    >
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {severity === 'none' ? (
                      <span className="text-sm text-on-surface-variant">—</span>
                    ) : (
                      <div className="grid grid-cols-[minmax(140px,1fr)_auto] items-center gap-2">
                        {vehicle.actionStatus ? (
                          <span className="rounded bg-surface-container px-2 py-0.5 text-xs font-medium text-on-surface">
                            {vehicle.actionStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant">
                            Not yet reviewed
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onLogAction(vehicle)}
                          className="rounded bg-primary-container px-2 py-1 text-xs font-semibold text-white hover:bg-primary"
                        >
                          {vehicle.actionStatus
                            ? 'Update Action'
                            : 'Log Action'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr
                    id={detailRowId}
                    className="border-b border-card-border bg-table-header"
                  >
                    <td
                      colSpan={8}
                      className="px-4 py-3 text-sm text-on-surface-variant"
                    >
                      <div>VIN: {vehicle.vin}</div>
                      <div>Color: {vehicle.color}</div>
                      <div>Mileage: {vehicle.mileage}</div>
                      <div>
                        Intake Date: {formatIntakeDate(vehicle.intakeDate)}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default VehicleTable
