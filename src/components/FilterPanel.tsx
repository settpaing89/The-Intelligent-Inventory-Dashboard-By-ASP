import type { VehicleFilters } from '../lib/inventoryLogic'

const MAX_DAYS_SLIDER_LIMIT = 200

const INPUT_CLASS =
  'rounded border border-input-border bg-white px-3 py-2 text-sm text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/10'

interface FilterPanelProps {
  makes: string[]
  models: string[]
  years: number[]
  filters: VehicleFilters
  onChange: (filters: VehicleFilters) => void
  onReset: () => void
}

function FilterPanel({
  makes,
  models,
  years,
  filters,
  onChange,
  onReset,
}: FilterPanelProps) {
  const sortedMakes = [...makes].sort((a, b) => a.localeCompare(b))
  const sortedModels = [...models].sort((a, b) => a.localeCompare(b))
  const sortedYears = [...years].sort((a, b) => a - b)

  const minDaysValue = filters.minDays ?? 0
  const maxDaysValue = filters.maxDays ?? MAX_DAYS_SLIDER_LIMIT

  return (
    <div className="rounded-md border border-card-border bg-white p-sm shadow-elevation-low">
      <h2 className="pb-sm text-xl font-semibold text-on-surface">Filters</h2>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col text-sm text-on-surface-variant">
          Make
          <select
            value={filters.make ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                make:
                  event.target.value === '' ? undefined : event.target.value,
              })
            }
            className={INPUT_CLASS}
          >
            <option value="">All</option>
            {sortedMakes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm text-on-surface-variant">
          Model
          <select
            value={filters.model ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                model:
                  event.target.value === '' ? undefined : event.target.value,
              })
            }
            className={INPUT_CLASS}
          >
            <option value="">All</option>
            {sortedModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm text-on-surface-variant">
          Year
          <select
            value={filters.year !== undefined ? String(filters.year) : ''}
            onChange={(event) =>
              onChange({
                ...filters,
                year:
                  event.target.value === ''
                    ? undefined
                    : Number(event.target.value),
              })
            }
            className={INPUT_CLASS}
          >
            <option value="">All</option>
            {sortedYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm text-on-surface-variant">
          VIN
          <input
            type="text"
            value={filters.vin ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                vin: event.target.value === '' ? undefined : event.target.value,
              })
            }
            className={INPUT_CLASS}
          />
        </label>

        <div className="flex flex-col text-sm text-on-surface-variant">
          <span>
            Days in Inventory: {minDaysValue}–
            {filters.maxDays === undefined
              ? `${MAX_DAYS_SLIDER_LIMIT}+`
              : maxDaysValue}
          </span>
          <div className="relative h-6 w-48">
            <input
              type="range"
              min={0}
              max={MAX_DAYS_SLIDER_LIMIT}
              value={minDaysValue}
              onChange={(event) => {
                const rawMin = Number(event.target.value)
                const clampedMin = Math.min(rawMin, maxDaysValue)
                onChange({
                  ...filters,
                  minDays: clampedMin === 0 ? undefined : clampedMin,
                })
              }}
              className="pointer-events-none absolute w-full accent-primary-container [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
            />
            <input
              type="range"
              min={0}
              max={MAX_DAYS_SLIDER_LIMIT}
              value={maxDaysValue}
              onChange={(event) => {
                const rawMax = Number(event.target.value)
                const clampedMax = Math.max(rawMax, minDaysValue)
                onChange({
                  ...filters,
                  maxDays:
                    clampedMax >= MAX_DAYS_SLIDER_LIMIT
                      ? undefined
                      : clampedMax,
                })
              }}
              className="pointer-events-none absolute w-full accent-primary-container [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded border border-primary-container px-4 py-2 text-sm font-semibold text-primary-container hover:bg-surface-container"
        >
          Reset filters
        </button>
      </div>
    </div>
  )
}

export default FilterPanel
