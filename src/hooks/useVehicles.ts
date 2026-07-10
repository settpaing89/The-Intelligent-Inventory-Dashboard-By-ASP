import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getVehicles, updateVehicleAction } from '../api/vehicles'
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
      id: number
      actionStatus: ActionStatus
      actionNote?: string | null
    }) => updateVehicleAction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}
