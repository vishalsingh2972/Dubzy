import { afterEach, describe, expect, it, vi } from 'vitest'
import { deleteObjectsFromR2, r2Client } from '../../src/lib/r2.js'

describe('R2 object deletion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fails when R2 reports a partial bulk-deletion error', async () => {
    vi.spyOn(r2Client, 'send').mockResolvedValue({
      Deleted: [{ Key: 'videos/source.mp4' }],
      Errors: [{ Key: 'audio/version.mp3', Code: 'InternalError' }],
    } as never)

    await expect(
      deleteObjectsFromR2(['videos/source.mp4', 'audio/version.mp3']),
    ).rejects.toThrow('Failed to delete 1 object from R2')
  })
})
