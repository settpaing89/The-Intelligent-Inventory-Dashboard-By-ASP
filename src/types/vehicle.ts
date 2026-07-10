export const ACTION_STATUS_OPTIONS = [
  "Price Reduction Planned",
  "Marketing Push",
  "Transfer to Another Location",
  "Send to Auction",
  "Manager Reviewing",
  "No Action Needed",
] as const;

export type ActionStatus = typeof ACTION_STATUS_OPTIONS[number];

export interface Vehicle {
  id: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  color: string;
  price: number;
  mileage: number;
  intakeDate: string;
  actionStatus: ActionStatus | null;
  actionNote: string | null;
  actionUpdatedAt: string | null;
}
