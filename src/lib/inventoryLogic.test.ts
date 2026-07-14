import { describe, expect, it } from 'vitest'
import {
  AGING_STOCK_THRESHOLD_DAYS,
  filterVehicles,
  getAgingSeverity,
  getAgingVehicles,
  getAverageDaysInInventory,
  getDaysInInventory,
  getDaysInInventoryDistribution,
  getRecommendedAction,
  getSeverityBreakdownByMake,
  getTotalInventoryValue,
  isAgingStock,
  paginateVehicles,
  validateNewVehicle,
  type NewVehicleInput,
} from './inventoryLogic'
import type { Vehicle } from '../types/vehicle'

const ASOF = new Date('2026-07-10T12:00:00Z')

// Vehicle.id is a string (json-server's actual id shape — see
// SYSTEM_DESIGN.md's Revision Log for why), but every call site in this
// file passes a plain number for readability/brevity; stringify it here so
// callers don't all need updating individually.
function makeVehicle(
  overrides: Partial<Omit<Vehicle, 'id'>> & { id: number },
): Vehicle {
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
    id: String(overrides.id),
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
    year: 2024,
    intakeDate: '2026-05-26',
  }),
  makeVehicle({
    id: 2,
    make: 'Toyota',
    model: 'Corolla',
    year: 2023,
    intakeDate: '2026-04-11',
  }),
  makeVehicle({
    id: 3,
    make: 'Honda',
    model: 'Civic',
    year: 2024,
    intakeDate: '2026-04-10',
  }),
  makeVehicle({
    id: 4,
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    intakeDate: '2026-01-15',
  }),
  makeVehicle({
    id: 5,
    make: 'Ford',
    model: 'F-150',
    year: 2024,
    intakeDate: '2025-12-11',
  }),
  makeVehicle({
    id: 6,
    make: 'Honda',
    model: 'Civic',
    year: 2021,
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

describe('getRecommendedAction', () => {
  it('returns null for 90 (at threshold, not aging)', () => {
    expect(getRecommendedAction(90)).toBeNull()
  })

  it('returns "Marketing Push" for 91', () => {
    expect(getRecommendedAction(91)).toBe('Marketing Push')
  })

  it('returns "Marketing Push" for 150 (at critical threshold, not over)', () => {
    expect(getRecommendedAction(150)).toBe('Marketing Push')
  })

  it('returns "Price Reduction Planned" for 151', () => {
    expect(getRecommendedAction(151)).toBe('Price Reduction Planned')
  })

  it('returns null for 0', () => {
    expect(getRecommendedAction(0)).toBeNull()
  })

  it('returns null for a negative value', () => {
    expect(getRecommendedAction(-5)).toBeNull()
  })
})

describe('filterVehicles', () => {
  it('returns all vehicles unchanged when no filters are given', () => {
    const result = filterVehicles(fixture, {}, ASOF)
    expect(result).toEqual(fixture)
  })

  it('filters by make only, case-insensitively', () => {
    const result = filterVehicles(fixture, { make: 'toyota' }, ASOF)
    expect(result.map((v) => v.id)).toEqual(['1', '2', '4'])
  })

  it('filters by make and model together', () => {
    const result = filterVehicles(
      fixture,
      { make: 'Toyota', model: 'Camry' },
      ASOF,
    )
    expect(result.map((v) => v.id)).toEqual(['1', '4'])
  })

  it('filters by minDays only', () => {
    const result = filterVehicles(fixture, { minDays: 90 }, ASOF)
    expect(result.map((v) => v.id)).toEqual(['2', '3', '4', '5'])
  })

  it('filters by maxDays only', () => {
    const result = filterVehicles(fixture, { maxDays: 90 }, ASOF)
    expect(result.map((v) => v.id)).toEqual(['1', '2', '6'])
  })

  it('filters by minDays and maxDays together (inclusive range)', () => {
    const result = filterVehicles(fixture, { minDays: 45, maxDays: 91 }, ASOF)
    expect(result.map((v) => v.id)).toEqual(['1', '2', '3'])
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

  it('filters by year, exact match', () => {
    const result = filterVehicles(fixture, { year: 2024 }, ASOF)
    expect(result.map((v) => v.id)).toEqual(['1', '3', '5'])
  })

  it('filters by year combined with make', () => {
    const result = filterVehicles(fixture, { year: 2024, make: 'Toyota' }, ASOF)
    expect(result.map((v) => v.id)).toEqual(['1'])
  })

  it('treats an undefined year the same as no filter', () => {
    const result = filterVehicles(fixture, { year: undefined }, ASOF)
    expect(result).toEqual(fixture)
  })

  it('filters by vin, case-insensitive substring match', () => {
    const result = filterVehicles(fixture, { vin: 'vin3' }, ASOF)
    expect(result.map((v) => v.id)).toEqual(['3'])
  })

  it('treats an empty-string vin the same as no filter', () => {
    const result = filterVehicles(fixture, { vin: '' }, ASOF)
    expect(result).toEqual(fixture)
  })

  it('treats an undefined vin the same as no filter', () => {
    const result = filterVehicles(fixture, { vin: undefined }, ASOF)
    expect(result).toEqual(fixture)
  })

  it('returns an empty array when the vin filter matches nothing', () => {
    const result = filterVehicles(fixture, { vin: 'ZZZ-NO-MATCH' }, ASOF)
    expect(result).toEqual([])
  })
})

describe('getAgingVehicles', () => {
  it('returns only vehicles whose computed days exceed 90', () => {
    const result = getAgingVehicles(fixture, ASOF)
    expect(result.map((v) => v.id)).toEqual(['3', '4', '5'])
  })

  it('returns an empty array when none qualify', () => {
    const notAging = fixture.filter((v) => v.id === '1' || v.id === '2')
    expect(getAgingVehicles(notAging, ASOF)).toEqual([])
  })

  it('does not mutate the input array or its elements', () => {
    const original = fixture.map((v) => ({ ...v }))
    getAgingVehicles(fixture, ASOF)
    expect(fixture).toEqual(original)
  })
})

describe('getAverageDaysInInventory', () => {
  it('returns 0 for an empty array', () => {
    expect(getAverageDaysInInventory([], ASOF)).toBe(0)
  })

  it("returns that vehicle's day count for a single vehicle", () => {
    const single = [makeVehicle({ id: 1, intakeDate: '2026-05-26' })] // 45 days
    expect(getAverageDaysInInventory(single, ASOF)).toBe(45)
  })

  it('returns the arithmetic mean across multiple vehicles', () => {
    const vehicles = [
      makeVehicle({ id: 1, intakeDate: '2026-05-26' }), // 45 days
      makeVehicle({ id: 2, intakeDate: '2026-04-11' }), // 90 days
    ]
    expect(getAverageDaysInInventory(vehicles, ASOF)).toBe(67.5)
  })
})

describe('getTotalInventoryValue', () => {
  it('returns 0 for an empty array', () => {
    expect(getTotalInventoryValue([])).toBe(0)
  })

  it('returns the sum of price across multiple vehicles', () => {
    const vehicles = [
      makeVehicle({ id: 1, price: 10000 }),
      makeVehicle({ id: 2, price: 20000 }),
      makeVehicle({ id: 3, price: 30000 }),
    ]
    expect(getTotalInventoryValue(vehicles)).toBe(60000)
  })
})

describe('paginateVehicles', () => {
  function makeVehicles(count: number): Vehicle[] {
    return Array.from({ length: count }, (_, i) => makeVehicle({ id: i + 1 }))
  }

  it('returns totalPages 1, items [], currentPage 1 for an empty array', () => {
    const result = paginateVehicles([], 1, 15)
    expect(result).toEqual({ items: [], currentPage: 1, totalPages: 1 })
  })

  it('splits an exact multiple of pageSize into full pages', () => {
    const vehicles = makeVehicles(30)

    const page1 = paginateVehicles(vehicles, 1, 15)
    expect(page1.totalPages).toBe(2)
    expect(page1.currentPage).toBe(1)
    expect(page1.items).toHaveLength(15)
    expect(page1.items.map((v) => v.id)).toEqual(
      vehicles.slice(0, 15).map((v) => v.id),
    )

    const page2 = paginateVehicles(vehicles, 2, 15)
    expect(page2.totalPages).toBe(2)
    expect(page2.currentPage).toBe(2)
    expect(page2.items).toHaveLength(15)
    expect(page2.items.map((v) => v.id)).toEqual(
      vehicles.slice(15, 30).map((v) => v.id),
    )
  })

  it('gives the last page the remainder for a non-multiple of pageSize', () => {
    const vehicles = makeVehicles(26)

    const page1 = paginateVehicles(vehicles, 1, 15)
    expect(page1.totalPages).toBe(2)
    expect(page1.items).toHaveLength(15)

    const page2 = paginateVehicles(vehicles, 2, 15)
    expect(page2.totalPages).toBe(2)
    expect(page2.items).toHaveLength(11)
  })

  it('clamps a page number above totalPages down to the last valid page', () => {
    const vehicles = makeVehicles(26)
    const result = paginateVehicles(vehicles, 99, 15)
    expect(result.currentPage).toBe(2)
    expect(result.items).toHaveLength(11)
  })

  it('clamps a page number below 1 up to 1', () => {
    const vehicles = makeVehicles(26)

    const zero = paginateVehicles(vehicles, 0, 15)
    expect(zero.currentPage).toBe(1)
    expect(zero.items).toHaveLength(15)

    const negative = paginateVehicles(vehicles, -5, 15)
    expect(negative.currentPage).toBe(1)
    expect(negative.items).toHaveLength(15)
  })

  it('does not mutate the input array or its elements', () => {
    const vehicles = makeVehicles(20)
    const original = vehicles.map((v) => ({ ...v }))
    paginateVehicles(vehicles, 1, 15)
    expect(vehicles).toEqual(original)
  })
})

describe('getSeverityBreakdownByMake', () => {
  // Day counts relative to ASOF (2026-07-10) computed with a throwaway
  // script, same convention as the top-of-file fixture comment:
  //   2026-06-10 -> 30 days (none)      2026-06-30 -> 10 days (none)
  //   2025-12-22 -> 200 days (critical) 2026-06-20 -> 20 days (none)
  //   2026-04-01 -> 100 days (aging)    2026-06-15 -> 25 days (none)
  //   2026-04-06 -> 95 days (aging)     2026-01-31 -> 160 days (critical)
  const breakdownFixture: Vehicle[] = [
    makeVehicle({ id: 1, make: 'Toyota', intakeDate: '2026-06-10' }), // none
    makeVehicle({ id: 2, make: 'Toyota', intakeDate: '2025-12-22' }), // critical
    makeVehicle({ id: 3, make: 'Honda', intakeDate: '2026-04-01' }), // aging
    makeVehicle({ id: 4, make: 'Ford', intakeDate: '2026-06-30' }), // none
    makeVehicle({ id: 5, make: 'Ford', intakeDate: '2026-06-20' }), // none
    makeVehicle({ id: 6, make: 'Ford', intakeDate: '2026-06-15' }), // none
    makeVehicle({ id: 7, make: 'BMW', intakeDate: '2026-04-06' }), // aging
    makeVehicle({ id: 8, make: 'BMW', intakeDate: '2026-01-31' }), // critical
  ]

  it('computes correct per-make none/aging/critical/total counts', () => {
    const result = getSeverityBreakdownByMake(breakdownFixture, ASOF)
    const byMake = Object.fromEntries(result.map((r) => [r.make, r]))

    expect(byMake.Toyota).toEqual({
      make: 'Toyota',
      none: 1,
      aging: 0,
      critical: 1,
      total: 2,
    })
    expect(byMake.Honda).toEqual({
      make: 'Honda',
      none: 0,
      aging: 1,
      critical: 0,
      total: 1,
    })
    expect(byMake.Ford).toEqual({
      make: 'Ford',
      none: 3,
      aging: 0,
      critical: 0,
      total: 3,
    })
    expect(byMake.BMW).toEqual({
      make: 'BMW',
      none: 0,
      aging: 1,
      critical: 1,
      total: 2,
    })
  })

  it('sorts descending by (aging + critical), ties broken by total then alphabetically', () => {
    const result = getSeverityBreakdownByMake(breakdownFixture, ASOF)
    // BMW: bad=2 total=2 | Toyota: bad=1 total=2 | Honda: bad=1 total=1 | Ford: bad=0 total=3
    expect(result.map((r) => r.make)).toEqual([
      'BMW',
      'Toyota',
      'Honda',
      'Ford',
    ])
  })

  it('includes a make with zero aging/critical vehicles rather than omitting it', () => {
    const result = getSeverityBreakdownByMake(breakdownFixture, ASOF)
    const ford = result.find((r) => r.make === 'Ford')
    expect(ford).toBeDefined()
    expect(ford?.aging).toBe(0)
    expect(ford?.critical).toBe(0)
  })

  it('does not mutate the input array or its elements', () => {
    const original = breakdownFixture.map((v) => ({ ...v }))
    getSeverityBreakdownByMake(breakdownFixture, ASOF)
    expect(breakdownFixture).toEqual(original)
  })
})

describe('getDaysInInventoryDistribution', () => {
  // Day counts relative to ASOF (2026-07-10), one vehicle per boundary,
  // computed with a throwaway script:
  //   2026-06-10 -> 30   2026-05-11 -> 60   2026-04-11 -> 90   2026-03-12 -> 120   2026-02-10 -> 150
  //   2026-06-09 -> 31   2026-05-10 -> 61   2026-04-10 -> 91   2026-03-11 -> 121   2026-02-09 -> 151
  const boundaryFixture: Vehicle[] = [
    makeVehicle({ id: 1, intakeDate: '2026-06-10' }), // 30
    makeVehicle({ id: 2, intakeDate: '2026-06-09' }), // 31
    makeVehicle({ id: 3, intakeDate: '2026-05-11' }), // 60
    makeVehicle({ id: 4, intakeDate: '2026-05-10' }), // 61
    makeVehicle({ id: 5, intakeDate: '2026-04-11' }), // 90
    makeVehicle({ id: 6, intakeDate: '2026-04-10' }), // 91
    makeVehicle({ id: 7, intakeDate: '2026-03-12' }), // 120
    makeVehicle({ id: 8, intakeDate: '2026-03-11' }), // 121
    makeVehicle({ id: 9, intakeDate: '2026-02-10' }), // 150
    makeVehicle({ id: 10, intakeDate: '2026-02-09' }), // 151
  ]

  it('places each boundary day count in the correct bucket', () => {
    const result = getDaysInInventoryDistribution(boundaryFixture, ASOF)
    const byLabel = Object.fromEntries(result.map((r) => [r.label, r.count]))

    expect(byLabel['0-30']).toBe(1) // 30
    expect(byLabel['31-60']).toBe(2) // 31, 60
    expect(byLabel['61-90']).toBe(2) // 61, 90
    expect(byLabel['91-120']).toBe(2) // 91, 120
    expect(byLabel['121-150']).toBe(2) // 121, 150
    expect(byLabel['151+']).toBe(1) // 151
  })

  it('returns buckets in the fixed defined order regardless of counts', () => {
    const result = getDaysInInventoryDistribution(boundaryFixture, ASOF)
    expect(result.map((r) => r.label)).toEqual([
      '0-30',
      '31-60',
      '61-90',
      '91-120',
      '121-150',
      '151+',
    ])
  })

  it('defaults a negative-days (future intake) vehicle into the "0-30" bucket', () => {
    const futureVehicle = makeVehicle({ id: 1, intakeDate: '2026-07-20' }) // -10 days
    const result = getDaysInInventoryDistribution([futureVehicle], ASOF)
    const byLabel = Object.fromEntries(result.map((r) => [r.label, r.count]))
    expect(byLabel['0-30']).toBe(1)
    expect(result.reduce((sum, b) => sum + b.count, 0)).toBe(1)
  })

  it('total count across all buckets equals the number of vehicles', () => {
    const result = getDaysInInventoryDistribution(boundaryFixture, ASOF)
    const total = result.reduce((sum, b) => sum + b.count, 0)
    expect(total).toBe(boundaryFixture.length)
  })
})

describe('validateNewVehicle', () => {
  // ASOF is 2026-07-10T12:00:00Z, so its UTC year is 2026 -> max valid year
  // is 2027, and "today" for future-date checks is the UTC calendar date
  // 2026-07-10.
  function makeValidInput(
    overrides: Partial<NewVehicleInput> = {},
  ): NewVehicleInput {
    return {
      make: 'Honda',
      model: 'Accord',
      year: 2024,
      trim: 'EX',
      color: 'Black',
      price: 28000,
      mileage: 5000,
      vin: '1HGCM82633A123456',
      intakeDate: '2026-07-01',
      ...overrides,
    }
  }

  const existingVehicles: Vehicle[] = [
    makeVehicle({ id: 1, vin: '2T1BURHE0JC123456' }),
  ]

  it('reports valid: true and no errors for a fully valid input', () => {
    const result = validateNewVehicle(makeValidInput(), existingVehicles, ASOF)
    expect(result).toEqual({ valid: true, errors: {} })
  })

  it('rejects a missing make', () => {
    const result = validateNewVehicle(
      makeValidInput({ make: '   ' }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.make).toBeTruthy()
  })

  it('rejects a missing model', () => {
    const result = validateNewVehicle(
      makeValidInput({ model: '' }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.model).toBeTruthy()
  })

  it('rejects a missing trim', () => {
    const result = validateNewVehicle(
      makeValidInput({ trim: '' }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.trim).toBeTruthy()
  })

  it('rejects a missing color', () => {
    const result = validateNewVehicle(
      makeValidInput({ color: '' }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.color).toBeTruthy()
  })

  it('rejects a year before 1980', () => {
    const result = validateNewVehicle(
      makeValidInput({ year: 1979 }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.year).toBeTruthy()
  })

  it('accepts the boundary year 1980', () => {
    const result = validateNewVehicle(
      makeValidInput({ year: 1980 }),
      existingVehicles,
      ASOF,
    )
    expect(result.errors.year).toBeUndefined()
  })

  it('rejects a year more than one year in the future', () => {
    const result = validateNewVehicle(
      makeValidInput({ year: 2028 }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.year).toBeTruthy()
  })

  it('accepts the boundary year (asOfDate year + 1)', () => {
    const result = validateNewVehicle(
      makeValidInput({ year: 2027 }),
      existingVehicles,
      ASOF,
    )
    expect(result.errors.year).toBeUndefined()
  })

  it('rejects a zero price', () => {
    const result = validateNewVehicle(
      makeValidInput({ price: 0 }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.price).toBeTruthy()
  })

  it('rejects a negative price', () => {
    const result = validateNewVehicle(
      makeValidInput({ price: -500 }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.price).toBeTruthy()
  })

  it('rejects a negative mileage', () => {
    const result = validateNewVehicle(
      makeValidInput({ mileage: -1 }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.mileage).toBeTruthy()
  })

  it('accepts a mileage of exactly 0', () => {
    const result = validateNewVehicle(
      makeValidInput({ mileage: 0 }),
      existingVehicles,
      ASOF,
    )
    expect(result.errors.mileage).toBeUndefined()
  })

  it('rejects a VIN with the wrong length', () => {
    const result = validateNewVehicle(
      makeValidInput({ vin: '1HGCM8263' }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.vin).toBeTruthy()
  })

  it('rejects a VIN containing I, O, or Q', () => {
    const withI = validateNewVehicle(
      makeValidInput({ vin: '1HGCM8263IA123456' }),
      existingVehicles,
      ASOF,
    )
    expect(withI.errors.vin).toBeTruthy()

    const withO = validateNewVehicle(
      makeValidInput({ vin: '1HGCM8263OA123456' }),
      existingVehicles,
      ASOF,
    )
    expect(withO.errors.vin).toBeTruthy()

    const withQ = validateNewVehicle(
      makeValidInput({ vin: '1HGCM8263QA123456' }),
      existingVehicles,
      ASOF,
    )
    expect(withQ.errors.vin).toBeTruthy()
  })

  it('rejects a VIN with non-alphanumeric characters', () => {
    const result = validateNewVehicle(
      makeValidInput({ vin: '1HGCM8263-A12345' }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.vin).toBeTruthy()
  })

  it('rejects a VIN duplicating an existing vehicle, case-insensitively', () => {
    const result = validateNewVehicle(
      makeValidInput({ vin: '2t1burhe0jc123456' }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.vin).toBeTruthy()
  })

  it('rejects a future intakeDate', () => {
    const result = validateNewVehicle(
      makeValidInput({ intakeDate: '2026-07-11' }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.intakeDate).toBeTruthy()
  })

  it('accepts an intakeDate equal to asOfDate', () => {
    const result = validateNewVehicle(
      makeValidInput({ intakeDate: '2026-07-10' }),
      existingVehicles,
      ASOF,
    )
    expect(result.errors.intakeDate).toBeUndefined()
  })

  it('rejects a malformed intakeDate string', () => {
    const notADate = validateNewVehicle(
      makeValidInput({ intakeDate: 'not-a-date' }),
      existingVehicles,
      ASOF,
    )
    expect(notADate.valid).toBe(false)
    expect(notADate.errors.intakeDate).toBeTruthy()

    const impossibleDate = validateNewVehicle(
      makeValidInput({ intakeDate: '2026-13-45' }),
      existingVehicles,
      ASOF,
    )
    expect(impossibleDate.valid).toBe(false)
    expect(impossibleDate.errors.intakeDate).toBeTruthy()
  })

  it('reports every violated rule at once, not just the first', () => {
    const result = validateNewVehicle(
      makeValidInput({
        make: '',
        year: 1900,
        price: -1,
        mileage: -5,
        vin: 'TOOSHORT',
        intakeDate: '2099-01-01',
      }),
      existingVehicles,
      ASOF,
    )
    expect(result.valid).toBe(false)
    expect(Object.keys(result.errors).sort()).toEqual(
      ['intakeDate', 'make', 'mileage', 'price', 'vin', 'year'].sort(),
    )
  })
})
