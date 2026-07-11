import { Fragment, useState } from 'react'
import type { Vehicle } from '../types/vehicle'
import {
  getAgingSeverity,
  getDaysInInventory,
  type AgingSeverity,
} from '../lib/inventoryLogic'
import {
  SEVERITY_BADGE_CLASS,
  SEVERITY_ROW_TINT_CLASS,
} from '../lib/severityColors'

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

function AgingBadge({ severity }: { severity: AgingSeverity }) {
  if (severity === 'none') {
    return null
  }
  const label = severity === 'critical' ? 'Critical' : 'Aging'
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${SEVERITY_BADGE_CLASS[severity]}`}
    >
      {label}
    </span>
  )
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
    return <p>No vehicles match your filters</p>
  }

  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th scope="col">Make</th>
            <th scope="col">Model</th>
            <th scope="col">Year</th>
            <th scope="col">Trim</th>
            <th scope="col">Days in Inventory</th>
            <th scope="col">Price</th>
            <th scope="col">Status</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => {
            const isExpanded = expandedIds.has(vehicle.id)
            const days = getDaysInInventory(vehicle.intakeDate)
            const severity = getAgingSeverity(days)
            const detailRowId = `vehicle-details-${vehicle.id}`
            return (
              <Fragment key={vehicle.id}>
                <tr className={SEVERITY_ROW_TINT_CLASS[severity]}>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(vehicle.id)}
                      aria-expanded={isExpanded}
                      aria-controls={detailRowId}
                      className="flex items-center gap-1 text-left"
                    >
                      <span aria-hidden="true">{isExpanded ? '▾' : '▸'}</span>
                      {vehicle.make}
                    </button>
                  </td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.year}</td>
                  <td>{vehicle.trim}</td>
                  <td>{days}</td>
                  <td>{vehicle.price}</td>
                  <td>
                    <AgingBadge severity={severity} />
                  </td>
                  <td>
                    {severity === 'none' ? (
                      '—'
                    ) : (
                      <div className="flex items-center gap-2">
                        {vehicle.actionStatus ? (
                          <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-800">
                            {vehicle.actionStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Not yet reviewed
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onLogAction(vehicle)}
                          className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
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
                    className={SEVERITY_ROW_TINT_CLASS[severity]}
                  >
                    <td colSpan={8}>
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
