import { useMemo, useRef, useState } from 'react'
import { useVehicles } from './hooks/useVehicles'
import {
  AGING_STOCK_THRESHOLD_DAYS,
  filterVehicles,
  paginateVehicles,
  VEHICLE_TABLE_PAGE_SIZE,
  type VehicleFilters,
} from './lib/inventoryLogic'
import { logger } from './lib/logger'
import type { Vehicle } from './types/vehicle'
import ActionLogDrawer from './components/ActionLogDrawer'
import AddVehicleDrawer from './components/AddVehicleDrawer'
import AgingStockSummary from './components/AgingStockSummary'
import DashboardStats from './components/DashboardStats'
import FilterPanel from './components/FilterPanel'
import InventoryInsights from './components/InventoryInsights'
import PaginationControls from './components/PaginationControls'
import VehicleTable from './components/VehicleTable'

function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-md">
      <div className="h-16 animate-pulse rounded-md bg-surface-container-high" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="h-14 animate-pulse rounded-md bg-surface-container-high" />
        <div className="h-14 animate-pulse rounded-md bg-surface-container-high" />
        <div className="h-14 animate-pulse rounded-md bg-surface-container-high" />
        <div className="h-14 animate-pulse rounded-md bg-surface-container-high" />
      </div>
      <div className="h-14 animate-pulse rounded-md bg-surface-container-high" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_390px]">
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="h-10 animate-pulse rounded bg-surface-container-high"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-md bg-surface-container-high" />
      </div>
    </div>
  )
}

function App() {
  const { data, isLoading, isError, error, isFetching, refetch } = useVehicles()
  const [filters, setFilters] = useState<VehicleFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [activeActionVehicle, setActiveActionVehicle] =
    useState<Vehicle | null>(null)
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
  const actionTriggerRef = useRef<HTMLElement | null>(null)

  function closeAddVehicleDrawer(wasCreated?: boolean) {
    setIsAddVehicleOpen(false)
    if (wasCreated) {
      setCurrentPage(1)
    }
  }

  function updateFilters(
    next: VehicleFilters | ((current: VehicleFilters) => VehicleFilters),
  ) {
    setFilters((current) => {
      const resolved = typeof next === 'function' ? next(current) : next
      logger.info('filters_changed', { filters: resolved })
      return resolved
    })
    setCurrentPage(1)
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

  const {
    items: paginatedVehicles,
    currentPage: clampedPage,
    totalPages,
  } = useMemo(
    () =>
      paginateVehicles(filteredVehicles, currentPage, VEHICLE_TABLE_PAGE_SIZE),
    [filteredVehicles, currentPage],
  )

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="mx-auto max-w-7xl space-y-md p-margin">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">
            Dealership Inventory Dashboard
          </h1>
          {data && (
            <button
              type="button"
              onClick={() => setIsAddVehicleOpen(true)}
              className="rounded bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
            >
              Add Vehicle
            </button>
          )}
        </div>
        {isLoading && (
          <>
            <p className="sr-only">Loading vehicles…</p>
            <DashboardSkeleton />
          </>
        )}
        {isError && (
          <div className="rounded-md border border-error bg-error-container p-lg shadow-elevation-low">
            <p className="font-semibold text-on-error-container">
              Failed to load vehicles: {error.message}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded bg-error px-4 py-2 text-sm font-semibold text-on-error hover:opacity-90"
            >
              Retry
            </button>
          </div>
        )}
        {data && (
          <>
            {isFetching && !isLoading && (
              <p className="text-sm text-on-surface-variant">Syncing…</p>
            )}
            <AgingStockSummary
              vehicles={data}
              onViewAging={() =>
                updateFilters((current) => ({
                  ...current,
                  minDays: AGING_STOCK_THRESHOLD_DAYS + 1,
                }))
              }
            />
            <DashboardStats vehicles={data} />
            <FilterPanel
              makes={makes}
              models={models}
              years={years}
              filters={filters}
              onChange={updateFilters}
              onReset={() => updateFilters({})}
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_390px]">
              <div className="space-y-3">
                <VehicleTable
                  vehicles={paginatedVehicles}
                  onLogAction={openActionDrawer}
                />
                <PaginationControls
                  currentPage={clampedPage}
                  totalPages={totalPages}
                  totalItems={filteredVehicles.length}
                  onPageChange={setCurrentPage}
                />
              </div>
              <InventoryInsights vehicles={data} />
            </div>
          </>
        )}
        <ActionLogDrawer
          vehicle={activeActionVehicle}
          onClose={closeActionDrawer}
        />
        <AddVehicleDrawer
          isOpen={isAddVehicleOpen}
          onClose={closeAddVehicleDrawer}
        />
      </div>
    </div>
  )
}

export default App
