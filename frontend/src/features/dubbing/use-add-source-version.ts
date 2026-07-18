import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { addSourceVersionSchema, type AddSourceVersionFormData } from './dubbing-schema'
import { dubbingJobsQueryKey } from './use-dubbing-jobs'

const addSourceVersion = async ({ sourceId, targetLanguage }: AddSourceVersionFormData & { sourceId: string }) => {
  const { data } = await api.post(`/dubbing/sources/${sourceId}/versions`, {
    targetLanguage,
  })
  return data
}

export const useAddSourceVersion = () => {
  const queryClient = useQueryClient()
  const form = useForm<AddSourceVersionFormData>({
    resolver: zodResolver(addSourceVersionSchema),
    defaultValues: { targetLanguage: '' },
  })
  const mutation = useMutation({
    mutationFn: addSourceVersion,
    onSuccess: () => form.reset(),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: dubbingJobsQueryKey }),
  })

  return { form, mutation }
}
