import type { ActionStatus, Vehicle } from '../types/vehicle'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export async function getVehicles(): Promise<Vehicle[]> {
  const response = await fetch(`${API_BASE_URL}/vehicles`)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch vehicles: ${response.status} ${response.statusText}`,
    )
  }
  const data: Vehicle[] = await response.json()
  // json-server serves `id` as a string even when db.json stores it as a
  // number, silently violating the Vehicle type's `id: number` contract.
  // Coerce here so every other caller can trust the type as declared.
  return data.map((vehicle) => ({ ...vehicle, id: Number(vehicle.id) }))
}

export async function updateVehicleAction(
  id: number,
  payload: { actionStatus: ActionStatus; actionNote?: string | null },
): Promise<Vehicle> {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionStatus: payload.actionStatus,
      ...(payload.actionNote !== undefined
        ? { actionNote: payload.actionNote }
        : {}),
      actionUpdatedAt: new Date().toISOString(),
    }),
  })
  if (!response.ok) {
    throw new Error(
      `Failed to update vehicle ${id}: ${response.status} ${response.statusText}`,
    )
  }
  const updated: Vehicle = await response.json()
  return { ...updated, id: Number(updated.id) }
}
