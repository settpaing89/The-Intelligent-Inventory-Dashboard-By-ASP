import { useState, type FormEvent } from 'react'
import {
  ACTION_STATUS_OPTIONS,
  type ActionStatus,
  type Vehicle,
} from '../types/vehicle'
import { useUpdateVehicleAction } from '../hooks/useVehicles'

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
  const [selectedStatus, setSelectedStatus] = useState<ActionStatus | ''>(
    vehicle.actionStatus ?? '',
  )
  const [noteText, setNoteText] = useState(vehicle.actionNote ?? '')
  const { mutate, isPending, isError, error } = useUpdateVehicleAction()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (selectedStatus === '') {
      return
    }
    mutate(
      {
        id: vehicle.id,
        actionStatus: selectedStatus,
        actionNote: noteText === '' ? null : noteText,
      },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-xl transition-transform duration-300 ease-out">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
            <p className="text-sm text-gray-500">{vehicle.trim}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col text-sm">
            Status
            <select
              required
              value={selectedStatus}
              disabled={isPending}
              onChange={(event) =>
                setSelectedStatus(event.target.value as ActionStatus | '')
              }
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

          <label className="flex flex-col text-sm">
            Note (optional)
            <textarea
              value={noteText}
              maxLength={500}
              disabled={isPending}
              onChange={(event) => setNoteText(event.target.value)}
              rows={4}
            />
          </label>

          {isError && (
            <p role="alert" className="text-sm text-red-600">
              {error instanceof Error ? error.message : 'Failed to save.'}
            </p>
          )}

          <button
            type="submit"
            disabled={selectedStatus === '' || isPending}
            className="mt-2 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ActionLogDrawer
