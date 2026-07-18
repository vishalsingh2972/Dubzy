import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  dubbingJobsQueryKey,
  type SourceVideo,
} from './use-dubbing-jobs'

const deleteSourceVideo = async (sourceId: string) => {
  await api.delete(`/dubbing/sources/${sourceId}`)
  return sourceId
}

export const useDeleteSourceVideo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['delete-source-video'],
    mutationFn: deleteSourceVideo,
    onSuccess: (sourceId) => {
      queryClient.setQueryData<SourceVideo[]>(dubbingJobsQueryKey, (sources) =>
        sources?.filter((source) => source.id !== sourceId),
      )
      return queryClient.invalidateQueries({ queryKey: dubbingJobsQueryKey })
    },
  })
}
