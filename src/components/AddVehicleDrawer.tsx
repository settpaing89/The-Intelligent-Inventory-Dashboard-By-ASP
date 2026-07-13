import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useCreateVehicle, useVehicles } from '../hooks/useVehicles'
import { logger } from '../lib/logger'
import {
  validateNewVehicle,
  type NewVehicleInput,
  type ValidationResult,
} from '../lib/inventoryLogic'

const INPUT_CLASS =
  'rounded border border-input-border bg-white px-3 py-2 text-sm text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/10'

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

interface AddVehicleDrawerProps {
  isOpen: boolean
  // Called on every close path (backdrop, X, Escape, successful save).
  // `wasCreated` is true only when the close follows a successful save, so
  // the caller can distinguish "the manager cancelled" from "a vehicle was
  // actually added" without a second prop.
  onClose: (wasCreated?: boolean) => void
}

function AddVehicleDrawer({ isOpen, onClose }: AddVehicleDrawerProps) {
  if (!isOpen) {
    return null
  }

  // No per-entity key needed here (unlike ActionLogDrawer's key={vehicle.id})
  // — returning null above and mounting this fresh each time isOpen flips
  // false -> true already guarantees a brand-new instance with blank state.
  return <AddVehicleDrawerForm onClose={onClose} />
}

interface AddVehicleDrawerFormProps {
  onClose: (wasCreated?: boolean) => void
}

function AddVehicleDrawerForm({ onClose }: AddVehicleDrawerFormProps) {
  const { data: vehicles } = useVehicles()
  const { mutate, isPending, isError, error } = useCreateVehicle()
  const firstFieldRef = useRef<HTMLInputElement>(null)

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [trimLevel, setTrimLevel] = useState('')
  const [color, setColor] = useState('')
  const [price, setPrice] = useState('')
  const [mileage, setMileage] = useState('')
  const [vin, setVin] = useState('')
  const [intakeDate, setIntakeDate] = useState(todayISODate())
  const [errors, setErrors] = useState<ValidationResult['errors']>({})

  useEffect(() => {
    firstFieldRef.current?.focus()
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

    const input: NewVehicleInput = {
      make: make.trim(),
      model: model.trim(),
      year: Number(year),
      trim: trimLevel.trim(),
      color: color.trim(),
      price: Number(price),
      mileage: Number(mileage),
      vin: vin.trim().toUpperCase(),
      intakeDate,
    }

    const result = validateNewVehicle(input, vehicles ?? [], new Date())
    setErrors(result.errors)
    if (!result.valid) {
      return
    }

    logger.info('vehicle_create_attempt', {
      vin: input.vin,
      make: input.make,
      model: input.model,
    })
    mutate(input, { onSuccess: () => onClose(true) })
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose()}
        aria-hidden="true"
      />
      <div className="absolute right-0 top-0 flex h-full w-full flex-col overflow-y-auto bg-white p-lg shadow-elevation-high transition-transform duration-300 ease-out sm:w-[28rem]">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold text-on-surface">Add Vehicle</h2>
          <button
            type="button"
            onClick={() => onClose()}
            aria-label="Close"
            className="text-xl leading-none text-on-surface-variant hover:text-on-surface"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col text-sm text-on-surface-variant">
            Make
            <input
              ref={firstFieldRef}
              type="text"
              value={make}
              disabled={isPending}
              onChange={(event) => setMake(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          {errors.make && (
            <p className="-mt-3 text-xs text-error">{errors.make}</p>
          )}

          <label className="flex flex-col text-sm text-on-surface-variant">
            Model
            <input
              type="text"
              value={model}
              disabled={isPending}
              onChange={(event) => setModel(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          {errors.model && (
            <p className="-mt-3 text-xs text-error">{errors.model}</p>
          )}

          <label className="flex flex-col text-sm text-on-surface-variant">
            Year
            <input
              type="number"
              value={year}
              disabled={isPending}
              onChange={(event) => setYear(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          {errors.year && (
            <p className="-mt-3 text-xs text-error">{errors.year}</p>
          )}

          <label className="flex flex-col text-sm text-on-surface-variant">
            Trim
            <input
              type="text"
              value={trimLevel}
              disabled={isPending}
              onChange={(event) => setTrimLevel(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          {errors.trim && (
            <p className="-mt-3 text-xs text-error">{errors.trim}</p>
          )}

          <label className="flex flex-col text-sm text-on-surface-variant">
            Color
            <input
              type="text"
              value={color}
              disabled={isPending}
              onChange={(event) => setColor(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          {errors.color && (
            <p className="-mt-3 text-xs text-error">{errors.color}</p>
          )}

          <label className="flex flex-col text-sm text-on-surface-variant">
            Price
            <input
              type="number"
              value={price}
              disabled={isPending}
              onChange={(event) => setPrice(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          {errors.price && (
            <p className="-mt-3 text-xs text-error">{errors.price}</p>
          )}

          <label className="flex flex-col text-sm text-on-surface-variant">
            Mileage
            <input
              type="number"
              value={mileage}
              disabled={isPending}
              onChange={(event) => setMileage(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          {errors.mileage && (
            <p className="-mt-3 text-xs text-error">{errors.mileage}</p>
          )}

          <label className="flex flex-col text-sm text-on-surface-variant">
            VIN
            <input
              type="text"
              value={vin}
              disabled={isPending}
              onChange={(event) => setVin(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          {errors.vin && (
            <p className="-mt-3 text-xs text-error">{errors.vin}</p>
          )}

          <label className="flex flex-col text-sm text-on-surface-variant">
            Intake Date
            <input
              type="date"
              value={intakeDate}
              disabled={isPending}
              onChange={(event) => setIntakeDate(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          {errors.intakeDate && (
            <p className="-mt-3 text-xs text-error">{errors.intakeDate}</p>
          )}

          {isError && (
            <p role="alert" className="text-sm text-error">
              {error instanceof Error ? error.message : 'Failed to save.'}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save Vehicle'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}

export default AddVehicleDrawer
