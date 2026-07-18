import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import {
  AUTO_SOURCE_LANGUAGE,
  dubbingSchema,
  type DubbingFormData,
} from './dubbing-schema'
import { dubbingJobsQueryKey } from './use-dubbing-jobs'

type DubbingSubmission = DubbingFormData & { videoFile: File }

type UploadRequestResponse = {
  success: boolean
  data: {
    videoKey: string
    uploadUrl: string
    uploadHeaders: Record<string, string>
  }
}

const submitDubbing = async ({ videoFile, ...values }: DubbingSubmission) => {
  const { data: uploadRequest } = await api.post<UploadRequestResponse>(
    '/dubbing/uploads',
    {
      originalFilename: videoFile.name,
      contentType: videoFile.type,
    },
  )
  const uploadResponse = await fetch(uploadRequest.data.uploadUrl, {
    method: 'PUT',
    headers: uploadRequest.data.uploadHeaders,
    body: videoFile,
  })
  if (!uploadResponse.ok) {
    throw new Error('Video upload failed')
  }

  const { data } = await api.post('/dubbing', {
    ...values,
    originalFilename: videoFile.name,
    videoKey: uploadRequest.data.videoKey,
  })
  return data
}

export const useDubbingForm = () => {
  const queryClient = useQueryClient()
  const form = useForm<DubbingFormData>({
    resolver: zodResolver(dubbingSchema),
    defaultValues: {
      sourceLanguage: AUTO_SOURCE_LANGUAGE,
      targetLanguage: '',
    },
  })

  const mutation = useMutation({
    mutationFn: submitDubbing,
    onSuccess: () => {
      form.reset()
      void queryClient.invalidateQueries({ queryKey: dubbingJobsQueryKey })
    },
  })

  return {
    form,
    mutation,
  }
}
