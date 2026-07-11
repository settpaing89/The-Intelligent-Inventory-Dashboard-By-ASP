import { describe, expect, it } from 'vitest'
import {
  AGING_STOCK_THRESHOLD_DAYS,
  filterVehicles,
  getAgingSeverity,
  getAgingVehicles,
  getDaysInInventory,
  isAgingStock,
} from './inventoryLogic'
import type { Vehicle } from '../types/vehicle'

const ASOF = new Date('2026-07-10T12:00:00Z')

function makeVehicle(overrides: Partial<Vehicle> & { id: number }): Vehicle {
  return {
    vin: `VIN${overrides.id}`.padEnd(17, '0'),
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    trim: 'LE',
    color: 'White',
    price: 25000,
    mileage: 10000,
    intakeDate: '2026-07-10',
    actionStatus: null,
    actionNote: null,
    actionUpdatedAt: null,
    ...overrides,
  }
}

// Fixture — day counts relative to ASOF (2026-07-10T12:00:00Z, UTC calendar date 2026-07-10)
// were computed with a throwaway script, not by hand:
//   2026-05-26 -> 45 days
//   2026-04-11 -> 90 days (exactly at threshold, not aging)
//   2026-04-10 -> 91 days (aging)
//   2026-01-15 -> 176 days (aging)
//   2025-12-11 -> 211 days (aging)
//   2026-08-01 -> -22 days (future intake)
const fixture: Vehicle[] = [
  makeVehicle({
    id: 1,
    make: 'Toyota',
    model: 'Camry',
    intakeDate: '2026-05-26',
  }),
  makeVehicle({
    id: 2,
    make: 'Toyota',
    model: 'Corolla',
    intakeDate: '2026-04-11',
  }),
  makeVehicle({
    id: 3,
    make: 'Honda',
    model: 'Civic',
    intakeDate: '2026-04-10',
  }),
  makeVehicle({
    id: 4,
    make: 'Toyota',
    model: 'Camry',
    intakeDate: '2026-01-15',
  }),
  makeVehicle({
    id: 5,
    make: 'Ford',
    model: 'F-150',
    intakeDate: '2025-12-11',
  }),
  makeVehicle({
    id: 6,
    make: 'Honda',
    model: 'Civic',
    intakeDate: '2026-08-01',
  }),
]

describe('getDaysInInventory', () => {
  it('returns 0 when intakeDate equals asOfDate', () => {
    expect(getDaysInInventory('2026-07-10', ASOF)).toBe(0)
  })

  it('returns 45 for an intakeDate 45 days before asOfDate', () => {
    expect(getDaysInInventory('2026-05-26', ASOF)).toBe(45)
  })

  it('returns 90 for an intakeDate exactly 90 days before asOfDate', () => {
    expect(getDaysInInventory('2026-04-11', ASOF)).toBe(90)
  })

  it('returns 91 for an intakeDate exactly 91 days before asOfDate', () => {
    expect(getDaysInInventory('2026-04-10', ASOF)).toBe(91)
  })

  it('returns a negative number for a future intakeDate', () => {
    expect(getDaysInInventory('2026-08-01', ASOF)).toBe(-22)
  })
})

describe('isAgingStock', () => {
  it('returns false for 89', () => {
    expect(isAgingStock(89)).toBe(false)
  })

  it('returns false for 90 (at threshold, not over)', () => {
    expect(isAgingStock(AGING_STOCK_THRESHOLD_DAYS)).toBe(false)
  })

  it('returns true for 91', () => {
    expect(isAgingStock(91)).toBe(true)
  })

  it('returns true for 200', () => {
    expect(isAgingStock(200)).toBe(true)
  })

  it('returns false for 0', () => {
    expect(isAgingStock(0)).toBe(false)
  })

  it('returns false for -5', () => {
    expect(isAgingStock(-5)).toBe(false)
  })
})

describe('getAgingSeverity', () => {
  it('returns "none" for 89', () => {
    expect(getAgingSeverity(89)).toBe('none')
  })

  it('returns "none" for 90 (at threshold, not over)', () => {
    expect(getAgingSeverity(90)).toBe('none')
  })

  it('returns "aging" for 91', () => {
    expect(getAgingSeverity(91)).toBe('aging')
  })

  it('returns "aging" for 150 (at critical threshold, not over)', () => {
    expect(getAgingSeverity(150)).toBe('aging')
  })

  it('returns "critical" for 151', () => {
    expect(getAgingSeverity(151)).toBe('critical')
  })

  it('returns "critical" for 300', () => {
    expect(getAgingSeverity(300)).toBe('critical')
  })

  it('returns "none" for -5', () => {
    expect(getAgingSeverity(-5)).toBe('none')
  })
})

describe('filterVehicles', () => {
  it('returns all vehicles unchanged when no filters are given', () => {
    const result = filterVehicles(fixture, {}, ASOF)
    expect(result).toEqual(fixture)
  })

  it('filters by make only, case-insensitively', () => {
    const result = filterVehicles(fixture, { make: 'toyota' }, ASOF)
    expect(result.map((v) => v.id)).toEqual([1, 2, 4])
  })

  it('filters by make and model together', () => {
    const result = filterVehicles(
      fixture,
      { make: 'Toyota', model: 'Camry' },
      ASOF,
    )
    expect(result.map((v) => v.id)).toEqual([1, 4])
  })

  it('filters by minDays only', () => {
    const result = filterVehicles(fixture, { minDays: 90 }, ASOF)
    expect(result.map((v) => v.id)).toEqual([2, 3, 4, 5])
  })

  it('filters by maxDays only', () => {
    const result = filterVehicles(fixture, { maxDays: 90 }, ASOF)
    expect(result.map((v) => v.id)).toEqual([1, 2, 6])
  })

  it('filters by minDays and maxDays together (inclusive range)', () => {
    const result = filterVehicles(fixture, { minDays: 45, maxDays: 91 }, ASOF)
    expect(result.map((v) => v.id)).toEqual([1, 2, 3])
  })

  it('treats an empty-string make the same as no filter', () => {
    const result = filterVehicles(fixture, { make: '' }, ASOF)
    expect(result).toEqual(fixture)
  })

  it('returns an empty array when minDays is greater than maxDays', () => {
    const result = filterVehicles(fixture, { minDays: 100, maxDays: 10 }, ASOF)
    expect(result).toEqual([])
  })

  it('returns an empty array when the filter combination matches nothing', () => {
    const result = filterVehicles(
      fixture,
      { make: 'Toyota', model: 'F-150' },
      ASOF,
    )
    expect(result).toEqual([])
  })

  it('does not mutate the input array or its elements', () => {
    const original = fixture.map((v) => ({ ...v }))
    filterVehicles(fixture, { make: 'Toyota', minDays: 0 }, ASOF)
    expect(fixture).toEqual(original)
  })
})

describe('getAgingVehicles', () => {
  it('returns only vehicles whose computed days exceed 90', () => {
    const result = getAgingVehicles(fixture, ASOF)
    expect(result.map((v) => v.id)).toEqual([3, 4, 5])
  })

  it('returns an empty array when none qualify', () => {
    const notAging = fixture.filter((v) => v.id === 1 || v.id === 2)
    expect(getAgingVehicles(notAging, ASOF)).toEqual([])
  })

  it('does not mutate the input array or its elements', () => {
    const original = fixture.map((v) => ({ ...v }))
    getAgingVehicles(fixture, ASOF)
    expect(fixture).toEqual(original)
  })
})
