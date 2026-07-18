import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type AdminUser = {
  id: string
  name: string
  email: string
  createdAt: string
  approvalStatus: 'pending' | 'approved'
  approvedAt: string | null
}

type AdminUsersResponse = {
  success: boolean
  data: AdminUser[]
}

const fetchAdminUsers = async (status: 'pending' | 'approved') => {
  const { data } = await api.get<AdminUsersResponse>('/admin/users', {
    params: { status },
  })
  return data.data
}

const adminUsersQueryKey = (status: 'pending' | 'approved') =>
  ['admin-users', status] as const

const adminUsersQueryOptions = (status: 'pending' | 'approved') =>
  queryOptions({
    queryKey: adminUsersQueryKey(status),
    queryFn: () => fetchAdminUsers(status),
    retry: false,
  })

export const useAdminUsers = (status: 'pending' | 'approved', enabled = true) =>
  useQuery({
    ...adminUsersQueryOptions(status),
    enabled,
  })

export const useApproveAdminUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/admin/users/${userId}/approve`)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminUsersQueryKey('pending') }),
        queryClient.invalidateQueries({ queryKey: adminUsersQueryKey('approved') }),
      ])
    },
  })
}
