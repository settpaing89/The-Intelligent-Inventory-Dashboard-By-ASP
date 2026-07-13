import type { ActionStatus, Vehicle } from '../types/vehicle'

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

export function getRecommendedAction(
  daysInInventory: number,
): ActionStatus | null {
  const severity = getAgingSeverity(daysInInventory)
  if (severity === 'critical') {
    return 'Price Reduction Planned'
  }
  if (severity === 'aging') {
    return 'Marketing Push'
  }
  return null
}

export interface MakeSeverityBreakdown {
  make: string
  none: number
  aging: number
  critical: number
  total: number
}

export function getSeverityBreakdownByMake(
  vehicles: Vehicle[],
  asOfDate: Date = new Date(),
): MakeSeverityBreakdown[] {
  const byMake = new Map<string, MakeSeverityBreakdown>()
  for (const vehicle of vehicles) {
    const severity = getAgingSeverity(
      getDaysInInventory(vehicle.intakeDate, asOfDate),
    )
    let entry = byMake.get(vehicle.make)
    if (!entry) {
      entry = { make: vehicle.make, none: 0, aging: 0, critical: 0, total: 0 }
      byMake.set(vehicle.make, entry)
    }
    entry[severity] += 1
    entry.total += 1
  }
  return [...byMake.values()].sort((a, b) => {
    const badA = a.aging + a.critical
    const badB = b.aging + b.critical
    if (badB !== badA) {
      return badB - badA
    }
    if (b.total !== a.total) {
      return b.total - a.total
    }
    return a.make.localeCompare(b.make)
  })
}

export const DAYS_IN_INVENTORY_BUCKETS = [
  { label: '0-30', min: 0, max: 30 },
  { label: '31-60', min: 31, max: 60 },
  { label: '61-90', min: 61, max: 90 },
  { label: '91-120', min: 91, max: 120 },
  { label: '121-150', min: 121, max: 150 },
  { label: '151+', min: 151, max: Infinity },
] as const

export interface DaysDistributionBucket {
  label: string
  count: number
}

export function getDaysInInventoryDistribution(
  vehicles: Vehicle[],
  asOfDate: Date = new Date(),
): DaysDistributionBucket[] {
  const counts = DAYS_IN_INVENTORY_BUCKETS.map(() => 0)
  for (const vehicle of vehicles) {
    const days = getDaysInInventory(vehicle.intakeDate, asOfDate)
    const bucketIndex = DAYS_IN_INVENTORY_BUCKETS.findIndex(
      (bucket) => days >= bucket.min && days <= bucket.max,
    )
    // A negative days value (future intake date) doesn't fall within any
    // bucket's [min, max] since every min is >= 0 — default it into the
    // first bucket ("0-30") rather than dropping it or throwing.
    counts[bucketIndex === -1 ? 0 : bucketIndex] += 1
  }
  return DAYS_IN_INVENTORY_BUCKETS.map((bucket, i) => ({
    label: bucket.label,
    count: counts[i],
  }))
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

export interface NewVehicleInput {
  make: string
  model: string
  year: number
  trim: string
  color: string
  price: number
  mileage: number
  vin: string
  intakeDate: string
}

export interface ValidationResult {
  valid: boolean
  errors: Partial<Record<keyof NewVehicleInput, string>>
}

const VIN_LENGTH = 17
const MIN_VEHICLE_YEAR = 1980

function parseISODate(
  dateStr: string,
): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  // Date.UTC normalizes out-of-range components (e.g. month 13, day 32,
  // Feb 30) forward into a *different* valid date rather than rejecting
  // them — round-tripping through it and comparing components back is what
  // actually catches those as invalid.
  const asDate = new Date(Date.UTC(year, month - 1, day))
  if (
    asDate.getUTCFullYear() !== year ||
    asDate.getUTCMonth() !== month - 1 ||
    asDate.getUTCDate() !== day
  ) {
    return null
  }
  return { year, month, day }
}

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

export function validateNewVehicle(
  input: NewVehicleInput,
  existingVehicles: Vehicle[],
  asOfDate: Date = new Date(),
): ValidationResult {
  const errors: ValidationResult['errors'] = {}

  if (isBlank(input.make)) {
    errors.make = 'Make is required'
  }
  if (isBlank(input.model)) {
    errors.model = 'Model is required'
  }
  if (isBlank(input.trim)) {
    errors.trim = 'Trim is required'
  }
  if (isBlank(input.color)) {
    errors.color = 'Color is required'
  }

  const maxYear = asOfDate.getUTCFullYear() + 1
  if (
    !Number.isInteger(input.year) ||
    input.year < MIN_VEHICLE_YEAR ||
    input.year > maxYear
  ) {
    errors.year = `Year must be a whole number between ${MIN_VEHICLE_YEAR} and ${maxYear}`
  }

  if (
    typeof input.price !== 'number' ||
    !Number.isFinite(input.price) ||
    input.price <= 0
  ) {
    errors.price = 'Price must be greater than 0'
  }

  if (!Number.isInteger(input.mileage) || input.mileage < 0) {
    errors.mileage = 'Mileage must be a whole number greater than or equal to 0'
  }

  const vin = input.vin.trim().toUpperCase()
  if (vin.length !== VIN_LENGTH) {
    errors.vin = `VIN must be exactly ${VIN_LENGTH} characters`
  } else if (!/^[A-Z0-9]+$/.test(vin)) {
    errors.vin = 'VIN must contain only letters and numbers'
  } else if (/[IOQ]/.test(vin)) {
    errors.vin = 'VIN must not contain the letters I, O, or Q'
  } else if (existingVehicles.some((v) => v.vin.trim().toUpperCase() === vin)) {
    errors.vin = 'VIN must be unique — this VIN already exists'
  }

  const parsedIntake = parseISODate(input.intakeDate)
  if (!parsedIntake) {
    errors.intakeDate = 'Intake date must be a valid date (YYYY-MM-DD)'
  } else {
    const intakeUTC = Date.UTC(
      parsedIntake.year,
      parsedIntake.month - 1,
      parsedIntake.day,
    )
    const asOfUTC = Date.UTC(
      asOfDate.getUTCFullYear(),
      asOfDate.getUTCMonth(),
      asOfDate.getUTCDate(),
    )
    if (intakeUTC > asOfUTC) {
      errors.intakeDate = 'Intake date cannot be in the future'
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export const VEHICLE_TABLE_PAGE_SIZE = 15

export function paginateVehicles(
  vehicles: Vehicle[],
  page: number,
  pageSize: number,
): { items: Vehicle[]; currentPage: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(vehicles.length / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const start = (currentPage - 1) * pageSize
  const items = vehicles.slice(start, start + pageSize)
  return { items, currentPage, totalPages }
}
