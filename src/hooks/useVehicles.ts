import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicleAction,
} from '../api/vehicles'
import type { ActionStatus } from '../types/vehicle'

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  })
}

export function useUpdateVehicleAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      actionStatus: ActionStatus
      actionNote?: string | null
    }) => updateVehicleAction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}
