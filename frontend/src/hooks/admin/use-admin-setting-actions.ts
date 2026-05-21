import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminQueryKeys } from './admin-query-keys'
import { adminSettingsService } from '@/services/admin-settings-service'
import { CreateSettingDTO, UpdateSettingDTO } from '@/types/admin/admin-setting-dto'

export const useCreateAdminSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateSettingDTO) => adminSettingsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.settings.all })
      toast.success('Setting created')
    },
  })
}

export const useUpdateAdminSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateSettingDTO) => adminSettingsService.update(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.settings.all })
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.settings.bannedKeywords })
      toast.success('Setting updated')
    },
  })
}

export const useDeleteAdminSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminSettingsService.delete([id]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.settings.all })
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.settings.bannedKeywords })
      toast.success('Setting deleted')
    },
  })
}
