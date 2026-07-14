export const ACTION_STATUS_OPTIONS = [
  'Price Reduction Planned',
  'Marketing Push',
  'Transfer to Another Location',
  'Send to Auction',
  'Manager Reviewing',
  'No Action Needed',
] as const

export type ActionStatus = (typeof ACTION_STATUS_OPTIONS)[number]

export interface Vehicle {
  // json-server assigns ids as opaque strings -- the seed data's ids
  // happen to look numeric ("1", "2", ...), but ids assigned to vehicles
  // created via POST are random strings (e.g. "0eSnkshRMpo") and are NOT
  // numeric-parseable. Treat id as an opaque identifier everywhere, never
  // as a number -- see SYSTEM_DESIGN.md's Revision Log for the bug this
  // fixes.
  id: string
  vin: string
  make: string
  model: string
  year: number
  trim: string
  color: string
  price: number
  mileage: number
  intakeDate: string
  actionStatus: ActionStatus | null
  actionNote: string | null
  actionUpdatedAt: string | null
}
