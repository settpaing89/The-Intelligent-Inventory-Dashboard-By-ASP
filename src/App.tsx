import { useMemo, useState } from 'react'
import { useVehicles } from './hooks/useVehicles'
import {
  AGING_STOCK_THRESHOLD_DAYS,
  filterVehicles,
  type VehicleFilters,
} from './lib/inventoryLogic'
import type { Vehicle } from './types/vehicle'
import ActionLogDrawer from './components/ActionLogDrawer'
import AgingStockSummary from './components/AgingStockSummary'
import FilterPanel from './components/FilterPanel'
import VehicleTable from './components/VehicleTable'

function App() {
  const { data, isLoading, isError, error } = useVehicles()
  const [filters, setFilters] = useState<VehicleFilters>({})
  const [activeActionVehicle, setActiveActionVehicle] =
    useState<Vehicle | null>(null)

  const makes = useMemo(() => {
    if (!data) return []
    return [...new Set(data.map((vehicle) => vehicle.make))].sort((a, b) =>
      a.localeCompare(b),
    )
  }, [data])

  const models = useMemo(() => {
    if (!data) return []
    return [...new Set(data.map((vehicle) => vehicle.model))].sort((a, b) =>
      a.localeCompare(b),
    )
  }, [data])

  const filteredVehicles = useMemo(() => {
    if (!data) return []
    return filterVehicles(data, filters)
  }, [data, filters])

  return (
    <>
      <h1 className="text-3xl font-bold">Dealership Inventory Dashboard</h1>
      {isLoading && <p>Loading vehicles…</p>}
      {isError && <p>Error: {error.message}</p>}
      {data && (
        <>
          <AgingStockSummary
            vehicles={data}
            onViewAging={() =>
              setFilters((current) => ({
                ...current,
                minDays: AGING_STOCK_THRESHOLD_DAYS + 1,
              }))
            }
          />
          <FilterPanel
            makes={makes}
            models={models}
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters({})}
          />
          <VehicleTable
            vehicles={filteredVehicles}
            onLogAction={(vehicle) => setActiveActionVehicle(vehicle)}
          />
        </>
      )}
      <ActionLogDrawer
        vehicle={activeActionVehicle}
        onClose={() => setActiveActionVehicle(null)}
      />
    </>
  )
}

export default App
