import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  ACTION_STATUS_OPTIONS,
  type ActionStatus,
  type Vehicle,
} from '../types/vehicle'
import { useUpdateVehicleAction } from '../hooks/useVehicles'
import { logger } from '../lib/logger'
import { getDaysInInventory, getRecommendedAction } from '../lib/inventoryLogic'

const INPUT_CLASS =
  'rounded border border-input-border bg-white px-3 py-2 text-sm text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/10'

interface ActionLogDrawerProps {
  vehicle: Vehicle | null
  onClose: () => void
}

function ActionLogDrawer({ vehicle, onClose }: ActionLogDrawerProps) {
  if (!vehicle) {
    return null
  }

  // Keying on vehicle.id remounts the form below whenever a different
  // vehicle is opened, giving fresh local state (and a fresh mutation,
  // so no stale error from a previous vehicle carries over) without an
  // effect that has to distinguish "same vehicle, data refetched" from
  // "different vehicle" by hand.
  return (
    <ActionLogDrawerForm key={vehicle.id} vehicle={vehicle} onClose={onClose} />
  )
}

interface ActionLogDrawerFormProps {
  vehicle: Vehicle
  onClose: () => void
}

function ActionLogDrawerForm({ vehicle, onClose }: ActionLogDrawerFormProps) {
  const daysInInventory = getDaysInInventory(vehicle.intakeDate)
  const recommendedAction = getRecommendedAction(daysInInventory)
  const isRecommendation = vehicle.actionStatus === null

  const [selectedStatus, setSelectedStatus] = useState<ActionStatus | ''>(
    vehicle.actionStatus ?? recommendedAction ?? '',
  )
  const [noteText, setNoteText] = useState(vehicle.actionNote ?? '')
  const { mutate, isPending, isError, error } = useUpdateVehicleAction()
  const statusSelectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    statusSelectRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (selectedStatus === '') {
      return
    }
    logger.info('action_update_attempt', {
      vehicleId: vehicle.id,
      actionStatus: selectedStatus,
    })
    mutate(
      {
        id: vehicle.id,
        actionStatus: selectedStatus,
        actionNote: noteText === '' ? null : noteText,
      },
      { onSuccess: () => onClose() },
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute right-0 top-0 flex h-full w-full flex-col overflow-y-auto bg-white p-lg shadow-elevation-high transition-transform duration-300 ease-out sm:w-[28rem]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-on-surface">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
            <p className="text-sm text-on-surface-variant">{vehicle.trim}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-on-surface-variant hover:text-on-surface"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col text-sm text-on-surface-variant">
            Status
            <select
              ref={statusSelectRef}
              required
              value={selectedStatus}
              disabled={isPending}
              onChange={(event) =>
                setSelectedStatus(event.target.value as ActionStatus | '')
              }
              className={INPUT_CLASS}
            >
              <option value="" disabled>
                Select a status
              </option>
              {ACTION_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {isRecommendation && recommendedAction !== null && (
            <p className="-mt-3 text-xs text-on-surface-variant">
              Suggested based on {daysInInventory} days in inventory — you can
              change this.
            </p>
          )}

          <label className="flex flex-col text-sm text-on-surface-variant">
            Note (optional)
            <textarea
              value={noteText}
              maxLength={500}
              disabled={isPending}
              onChange={(event) => setNoteText(event.target.value)}
              rows={4}
              className={INPUT_CLASS}
            />
          </label>

          {isError && (
            <p role="alert" className="text-sm text-error">
              {error instanceof Error ? error.message : 'Failed to save.'}
            </p>
          )}

          <button
            type="submit"
            disabled={selectedStatus === '' || isPending}
            className="mt-2 rounded bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}

export default ActionLogDrawer
