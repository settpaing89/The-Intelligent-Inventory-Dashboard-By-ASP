import type { VehicleFilters } from '../lib/inventoryLogic'

interface FilterPanelProps {
  makes: string[]
  models: string[]
  filters: VehicleFilters
  onChange: (filters: VehicleFilters) => void
  onReset: () => void
}

function parseOptionalNumber(rawValue: string): number | undefined {
  if (rawValue.trim() === '') {
    return undefined
  }
  const parsed = Number(rawValue)
  return Number.isNaN(parsed) ? undefined : parsed
}

function FilterPanel({
  makes,
  models,
  filters,
  onChange,
  onReset,
}: FilterPanelProps) {
  const sortedMakes = [...makes].sort((a, b) => a.localeCompare(b))
  const sortedModels = [...models].sort((a, b) => a.localeCompare(b))

  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col text-sm">
        Make
        <select
          value={filters.make ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              make: event.target.value === '' ? undefined : event.target.value,
            })
          }
        >
          <option value="">All</option>
          {sortedMakes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-sm">
        Model
        <select
          value={filters.model ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              model: event.target.value === '' ? undefined : event.target.value,
            })
          }
        >
          <option value="">All</option>
          {sortedModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-sm">
        Min days in inventory
        <input
          type="number"
          value={filters.minDays ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              minDays: parseOptionalNumber(event.target.value),
            })
          }
        />
      </label>

      <label className="flex flex-col text-sm">
        Max days in inventory
        <input
          type="number"
          value={filters.maxDays ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              maxDays: parseOptionalNumber(event.target.value),
            })
          }
        />
      </label>

      <button type="button" onClick={onReset}>
        Reset filters
      </button>
    </div>
  )
}

export default FilterPanel
