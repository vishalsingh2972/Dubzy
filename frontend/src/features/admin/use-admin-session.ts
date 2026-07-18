import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type AdminSession = {
  email: string
  expiresAt: string
}

type AdminSessionResponse = {
  success: boolean
  data: AdminSession
}

const fetchAdminSession = async () => {
  const { data } = await api.get<AdminSessionResponse>('/admin/session')
  return data.data
}

const adminSessionQueryKey = ['admin-session'] as const

const adminSessionQueryOptions = () =>
  queryOptions({
    queryKey: adminSessionQueryKey,
    queryFn: fetchAdminSession,
    retry: false,
  })

export const useAdminSession = () =>
  useQuery(adminSessionQueryOptions())

export const useAdminLoginMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      await api.post('/admin/login', {
        email,
        password,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminSessionQueryKey })
    },
  })
}

export const useAdminLogoutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post('/admin/logout')
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.removeQueries({ queryKey: adminSessionQueryKey }),
        queryClient.removeQueries({ queryKey: ['admin-users'] }),
      ])
    },
  })
}
