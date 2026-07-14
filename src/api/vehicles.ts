import type { NewVehicleInput } from '../lib/inventoryLogic'
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
  return response.json()
}

export async function updateVehicleAction(
  id: string,
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
  return response.json()
}

export async function createVehicle(input: NewVehicleInput): Promise<Vehicle> {
  // json-server's create() unconditionally overwrites `id` with its own
  // randomId() regardless of what's sent in the POST body (confirmed by
  // reading node_modules/json-server/lib/service.js directly) -- there is
  // no way to make it respect a client-supplied id. The resulting id is a
  // random string (e.g. "0eSnkshRMpo"), not numeric-parseable, which is
  // exactly why Vehicle.id is a plain string throughout this app rather
  // than something coerced with Number(...).
  const response = await fetch(`${API_BASE_URL}/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      actionStatus: null,
      actionNote: null,
      actionUpdatedAt: null,
    }),
  })
  if (!response.ok) {
    throw new Error(
      `Failed to create vehicle: ${response.status} ${response.statusText}`,
    )
  }
  return response.json()
}

export async function deleteVehicle(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(
      `Failed to delete vehicle ${id}: ${response.status} ${response.statusText}`,
    )
  }
}
