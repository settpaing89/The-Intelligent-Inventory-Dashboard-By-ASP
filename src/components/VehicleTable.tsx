import { Fragment, useState } from 'react'
import type { Vehicle } from '../types/vehicle'
import {
  getAgingSeverity,
  getDaysInInventory,
  type AgingSeverity,
} from '../lib/inventoryLogic'

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

const ROW_TINT_CLASS: Record<AgingSeverity, string> = {
  none: '',
  aging: 'bg-amber-50',
  critical: 'bg-red-100',
}

function AgingBadge({ severity }: { severity: AgingSeverity }) {
  if (severity === 'critical') {
    return (
      <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
        Critical
      </span>
    )
  }
  if (severity === 'aging') {
    return (
      <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
        Aging
      </span>
    )
  }
  return null
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
    <table>
      <thead>
        <tr>
          <th>Make</th>
          <th>Model</th>
          <th>Year</th>
          <th>Trim</th>
          <th>Days in Inventory</th>
          <th>Price</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => {
          const isExpanded = expandedIds.has(vehicle.id)
          const days = getDaysInInventory(vehicle.intakeDate)
          const severity = getAgingSeverity(days)
          return (
            <Fragment key={vehicle.id}>
              <tr
                onClick={() => toggleExpanded(vehicle.id)}
                className={ROW_TINT_CLASS[severity]}
                style={{ cursor: 'pointer' }}
              >
                <td>{vehicle.make}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.year}</td>
                <td>{vehicle.trim}</td>
                <td>{days}</td>
                <td>{vehicle.price}</td>
                <td>
                  <AgingBadge severity={severity} />
                </td>
                <td onClick={(event) => event.stopPropagation()}>
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
                        {vehicle.actionStatus ? 'Update Action' : 'Log Action'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
              {isExpanded && (
                <tr className={ROW_TINT_CLASS[severity]}>
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
  )
}

export default VehicleTable
