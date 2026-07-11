import type { Vehicle } from '../types/vehicle'

export const AGING_STOCK_THRESHOLD_DAYS = 90

const MS_PER_DAY = 24 * 60 * 60 * 1000

function toUTCMidnight(intakeDate: string): number {
  const [year, month, day] = intakeDate.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export function getDaysInInventory(
  intakeDate: string,
  asOfDate: Date = new Date(),
): number {
  const intakeUTC = toUTCMidnight(intakeDate)
  const asOfUTC = Date.UTC(
    asOfDate.getUTCFullYear(),
    asOfDate.getUTCMonth(),
    asOfDate.getUTCDate(),
  )
  return Math.round((asOfUTC - intakeUTC) / MS_PER_DAY)
}

export function isAgingStock(daysInInventory: number): boolean {
  return daysInInventory > AGING_STOCK_THRESHOLD_DAYS
}

export const CRITICAL_STOCK_THRESHOLD_DAYS = 150

export type AgingSeverity = 'none' | 'aging' | 'critical'

export function getAgingSeverity(daysInInventory: number): AgingSeverity {
  if (daysInInventory > CRITICAL_STOCK_THRESHOLD_DAYS) {
    return 'critical'
  }
  if (isAgingStock(daysInInventory)) {
    return 'aging'
  }
  return 'none'
}

export interface VehicleFilters {
  make?: string
  model?: string
  minDays?: number
  maxDays?: number
  year?: number
  vin?: string
}

export function filterVehicles(
  vehicles: Vehicle[],
  filters: VehicleFilters,
  asOfDate: Date = new Date(),
): Vehicle[] {
  return vehicles.filter((vehicle) => {
    if (
      filters.make &&
      vehicle.make.toLowerCase() !== filters.make.toLowerCase()
    ) {
      return false
    }
    if (
      filters.model &&
      vehicle.model.toLowerCase() !== filters.model.toLowerCase()
    ) {
      return false
    }
    if (filters.year !== undefined && vehicle.year !== filters.year) {
      return false
    }
    if (
      filters.vin &&
      !vehicle.vin.toLowerCase().includes(filters.vin.toLowerCase())
    ) {
      return false
    }

    const days = getDaysInInventory(vehicle.intakeDate, asOfDate)
    if (filters.minDays !== undefined && days < filters.minDays) {
      return false
    }
    if (filters.maxDays !== undefined && days > filters.maxDays) {
      return false
    }

    return true
  })
}

export function getAgingVehicles(
  vehicles: Vehicle[],
  asOfDate: Date = new Date(),
): Vehicle[] {
  return vehicles.filter((vehicle) =>
    isAgingStock(getDaysInInventory(vehicle.intakeDate, asOfDate)),
  )
}

export function getAverageDaysInInventory(
  vehicles: Vehicle[],
  asOfDate: Date = new Date(),
): number {
  if (vehicles.length === 0) {
    return 0
  }
  const total = vehicles.reduce(
    (sum, vehicle) => sum + getDaysInInventory(vehicle.intakeDate, asOfDate),
    0,
  )
  return total / vehicles.length
}

export function getTotalInventoryValue(vehicles: Vehicle[]): number {
  return vehicles.reduce((sum, vehicle) => sum + vehicle.price, 0)
}
