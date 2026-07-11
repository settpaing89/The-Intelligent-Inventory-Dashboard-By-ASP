import { useMemo, useRef, useState } from 'react'
import { useVehicles } from './hooks/useVehicles'
import {
  AGING_STOCK_THRESHOLD_DAYS,
  filterVehicles,
  type VehicleFilters,
} from './lib/inventoryLogic'
import { logger } from './lib/logger'
import type { Vehicle } from './types/vehicle'
import ActionLogDrawer from './components/ActionLogDrawer'
import AgingStockSummary from './components/AgingStockSummary'
import DashboardStats from './components/DashboardStats'
import FilterPanel from './components/FilterPanel'
import InventoryInsights from './components/InventoryInsights'
import VehicleTable from './components/VehicleTable'

function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-40 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-40 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-40 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="h-10 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    </div>
  )
}

function App() {
  const { data, isLoading, isError, error, isFetching, refetch } = useVehicles()
  const [filters, setFilters] = useState<VehicleFilters>({})
  const [activeActionVehicle, setActiveActionVehicle] =
    useState<Vehicle | null>(null)
  const actionTriggerRef = useRef<HTMLElement | null>(null)

  function updateFilters(
    next: VehicleFilters | ((current: VehicleFilters) => VehicleFilters),
  ) {
    setFilters((current) => {
      const resolved = typeof next === 'function' ? next(current) : next
      logger.info('filters_changed', { filters: resolved })
      return resolved
    })
  }

  function openActionDrawer(vehicle: Vehicle) {
    actionTriggerRef.current = document.activeElement as HTMLElement | null
    setActiveActionVehicle(vehicle)
  }

  function closeActionDrawer() {
    setActiveActionVehicle(null)
    actionTriggerRef.current?.focus()
    actionTriggerRef.current = null
  }

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

  const years = useMemo(() => {
    if (!data) return []
    return [...new Set(data.map((vehicle) => vehicle.year))].sort(
      (a, b) => a - b,
    )
  }, [data])

  const filteredVehicles = useMemo(() => {
    if (!data) return []
    return filterVehicles(data, filters)
  }, [data, filters])

  return (
    <>
      <h1 className="text-3xl font-bold">Dealership Inventory Dashboard</h1>
      {isLoading && (
        <>
          <p className="sr-only">Loading vehicles…</p>
          <DashboardSkeleton />
        </>
      )}
      {isError && (
        <div className="rounded-lg border-2 border-red-400 bg-red-50 p-4">
          <p className="font-semibold text-red-800">
            Failed to load vehicles: {error.message}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}
      {data && (
        <>
          {isFetching && !isLoading && (
            <p className="text-sm text-gray-500">Syncing…</p>
          )}
          <DashboardStats vehicles={data} />
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
            <AgingStockSummary
              vehicles={data}
              onViewAging={() =>
                updateFilters((current) => ({
                  ...current,
                  minDays: AGING_STOCK_THRESHOLD_DAYS + 1,
                }))
              }
            />
            <InventoryInsights vehicles={data} />
            <FilterPanel
              makes={makes}
              models={models}
              years={years}
              filters={filters}
              onChange={updateFilters}
              onReset={() => updateFilters({})}
            />
          </div>
          <VehicleTable
            vehicles={filteredVehicles}
            onLogAction={openActionDrawer}
          />
        </>
      )}
      <ActionLogDrawer
        vehicle={activeActionVehicle}
        onClose={closeActionDrawer}
      />
    </>
  )
}

export default App
