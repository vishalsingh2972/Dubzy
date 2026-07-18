import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { env } from '@/lib/env'

export type DubbingJob = {
  id: string
  sourceId: string | null
  audioKey: string | null
  dubbedAudioKey: string | null
  dubbedVideoKey: string | null
  targetLanguage: string
  transcriptionLanguage: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  dubbedVideoUrl: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export type SourceVideo = {
  id: string
  originalFilename: string | null
  displayTitle: string
  sourceLanguage: string
  videoUrl: string | null
  videoKey: string | null
  createdAt: string
  updatedAt: string
  versions: DubbingJob[]
}

type DubbingJobsResponse = {
  success: boolean
  data: SourceVideo[]
}

const fetchDubbingJobs = async () => {
  const { data } = await api.get<DubbingJobsResponse>('/dubbing')
  return data.data
}

export const dubbingJobsQueryKey = ['dubbing-jobs'] as const

const dubbingJobsQueryOptions = () =>
  queryOptions({
    queryKey: dubbingJobsQueryKey,
    queryFn: fetchDubbingJobs,
  })

export const getDubbingJobDownloadUrl = (jobId: string) =>
  `${env.apiUrl}/dubbing/${jobId}/download`

export const useDubbingJobs = () =>
  useQuery({
    ...dubbingJobsQueryOptions(),
    refetchInterval: (query) =>
      query.state.data?.some((source) =>
        source.versions.some(
          (version) => version.status === 'pending' || version.status === 'processing',
        ),
      )
        ? 3000
        : false,
  })
