import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { readdir, unlink } from 'fs/promises'
import path from 'path'
import mediaRoutes from '../../routes/media.js'

const uploadsDir = path.join(process.cwd(), 'uploads')
let existingFiles = new Set<string>()

async function listUploads(): Promise<string[]> {
  try {
    return await readdir(uploadsDir)
  } catch {
    return []
  }
}

describe('media upload security', () => {
  beforeEach(async () => {
    existingFiles = new Set(await listUploads())
  })

  afterEach(async () => {
    for (const file of await listUploads()) {
      if (!existingFiles.has(file)) await unlink(path.join(uploadsDir, file))
    }
  })

  it('rejects active content disguised with an allowed MIME type', async () => {
    const app = new Hono()
    app.use('*', async (c, next) => {
      c.user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUSINESS_OWNER',
        twoFactorEnabled: false,
        isActive: true,
        businessOwnerId: null,
      }
      await next()
    })
    app.route('/media', mediaRoutes)

    const form = new FormData()
    form.set('file', new File(['<script>document.body.dataset.pwned="true"</script>'], 'payload.html', {
      type: 'image/jpeg',
    }))

    const response = await app.request('/media/upload', {
      method: 'POST',
      body: form,
    })

    expect(response.status).toBe(400)
  })
})
