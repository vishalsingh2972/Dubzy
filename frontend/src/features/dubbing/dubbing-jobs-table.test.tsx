// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SnackbarContext } from '@/app/providers/snackbar-context'
import { api } from '@/lib/api'
import { DubbingJobsTable } from './dubbing-jobs-table'
import { dubbingJobsQueryKey, type SourceVideo } from './use-dubbing-jobs'

vi.mock('@/lib/api', () => ({
  api: { delete: vi.fn(), get: vi.fn(), post: vi.fn() },
}))

afterEach(cleanup)

const source: SourceVideo = {
  id: '17b74ec6-7086-459c-8f0d-d39d6c3c4acd',
  originalFilename: 'launch.mp4',
  displayTitle: 'Product launch',
  sourceLanguage: 'en-IN',
  videoUrl: null,
  videoKey: 'videos/launch.mp4',
  createdAt: '2026-05-18T10:00:00.000Z',
  updatedAt: '2026-05-18T10:00:00.000Z',
  versions: [
    { id: 'completed', sourceId: '17b74ec6-7086-459c-8f0d-d39d6c3c4acd', audioKey: null, dubbedAudioKey: null, dubbedVideoKey: 'dubbed/hi.mp4', targetLanguage: 'hi-IN', transcriptionLanguage: null, status: 'completed', dubbedVideoUrl: null, errorMessage: null, createdAt: '2026-05-18T10:00:00.000Z', updatedAt: '2026-05-18T10:00:00.000Z' },
    { id: 'failed', sourceId: '17b74ec6-7086-459c-8f0d-d39d6c3c4acd', audioKey: null, dubbedAudioKey: null, dubbedVideoKey: null, targetLanguage: 'ta-IN', transcriptionLanguage: null, status: 'failed', dubbedVideoUrl: null, errorMessage: 'Provider unavailable', createdAt: '2026-05-18T10:00:00.000Z', updatedAt: '2026-05-18T10:00:00.000Z' },
  ],
}

const renderTable = (sources: SourceVideo[]) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  client.setQueryData(dubbingJobsQueryKey, sources)
  const showSnackbar = vi.fn()
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>
      <SnackbarContext value={{ showSnackbar }}>{children}</SnackbarContext>
    </QueryClientProvider>
  )
  return { client, showSnackbar, ...render(<DubbingJobsTable />, { wrapper: Wrapper }) }
}

describe('adding another source language version', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [source] } })
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } })
    vi.mocked(api.delete).mockResolvedValue({ data: undefined })
  })

  it('shows locked source details, unavailable languages, and submits JSON before refreshing', async () => {
    const user = userEvent.setup()
    renderTable([source])

    await user.click(screen.getByRole('button', { name: 'Dub in another language' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Product launch')
    expect(screen.getByLabelText('Source language')).toHaveValue('English')
    expect(screen.getByRole('option', { name: 'Hindi — already added' })).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Tamil — retry separately' })).toBeDisabled()

    await user.selectOptions(screen.getByLabelText('Target language'), 'bn-IN')
    await user.click(screen.getByRole('button', { name: 'Start dubbing' }))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      `/dubbing/sources/${source.id}/versions`,
      { targetLanguage: 'bn-IN' },
    ))
    await waitFor(() => expect(api.get).toHaveBeenCalled())
  })

  it('disables the source action and explains the active-version constraint', () => {
    renderTable([{ ...source, versions: [{ ...source.versions[0], status: 'processing' }] }])
    expect(screen.getByRole('button', { name: 'Dub in another language' })).toBeDisabled()
    expect(screen.getByRole('button', { name: `Delete ${source.displayTitle} and all language versions` })).toBeDisabled()
    expect(screen.getByText('Wait for the active language version to finish before adding another or deleting this source.')).toBeVisible()
  })

  it('keeps recoverable error feedback visible and refreshes the workspace', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('conflict'))
    const user = userEvent.setup()
    renderTable([source])
    await user.click(screen.getByRole('button', { name: 'Dub in another language' }))
    await user.selectOptions(screen.getByLabelText('Target language'), 'bn-IN')
    await user.click(screen.getByRole('button', { name: 'Start dubbing' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The language version was not started')
    await waitFor(() => expect(api.get).toHaveBeenCalled())
  })
})

describe('deleting a source video', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [source] } })
    vi.mocked(api.delete).mockResolvedValue({ data: undefined })
  })

  it('places an accessible trash action beside the add-language action without toggling the row', async () => {
    const user = userEvent.setup()
    renderTable([source])
    const addButton = screen.getByRole('button', { name: 'Dub in another language' })
    const deleteButton = screen.getByRole('button', { name: `Delete ${source.displayTitle} and all language versions` })
    const details = deleteButton.closest('details')

    expect(deleteButton.parentElement?.children[0]).toBe(addButton)
    expect(deleteButton.parentElement?.children[1]).toBe(deleteButton)
    expect(details).not.toHaveAttribute('open')
    await user.click(deleteButton)
    expect(details).not.toHaveAttribute('open')
    expect(screen.getByRole('dialog')).toHaveTextContent('original upload')
    expect(screen.getByRole('dialog')).toHaveTextContent('every language version')
    expect(screen.getByRole('dialog')).toHaveTextContent('generated audio and video files')
  })

  it('cancels without invoking the endpoint', async () => {
    const user = userEvent.setup()
    renderTable([source])
    await user.click(screen.getByRole('button', { name: `Delete ${source.displayTitle} and all language versions` }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(api.delete).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deletes through the source endpoint, removes the row, refreshes, and reports success', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { success: true, data: [source] } })
      .mockResolvedValue({ data: { success: true, data: [] } })
    const user = userEvent.setup()
    const { showSnackbar } = renderTable([source])
    await user.click(screen.getByRole('button', { name: `Delete ${source.displayTitle} and all language versions` }))
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith(`/dubbing/sources/${source.id}`))
    await waitFor(() => expect(screen.queryByText(source.displayTitle)).not.toBeInTheDocument())
    await waitFor(() => expect(api.get).toHaveBeenCalled())
    expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }))
  })

  it('keeps the dialog open and all dialog controls disabled while deletion is pending', async () => {
    let resolveDelete: (() => void) | undefined
    vi.mocked(api.delete).mockImplementation(() => new Promise((resolve) => {
      resolveDelete = () => resolve({ data: undefined })
    }))
    const user = userEvent.setup()
    renderTable([source])
    await user.click(screen.getByRole('button', { name: `Delete ${source.displayTitle} and all language versions` }))
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }))

    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
    expect(screen.getByRole('dialog')).toBeVisible()

    resolveDelete?.()
  })

  it('retains the source and shows actionable dialog and snackbar feedback after failure', async () => {
    vi.mocked(api.delete).mockRejectedValue(new Error('storage unavailable'))
    const user = userEvent.setup()
    const { showSnackbar } = renderTable([source])
    await user.click(screen.getByRole('button', { name: `Delete ${source.displayTitle} and all language versions` }))
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('source is still in your workspace')
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.getAllByText(source.displayTitle).length).toBeGreaterThan(0)
    expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }))
  })
})
