import { Hono } from 'hono'
import type { Context } from 'hono'
import { requireRole } from '../middleware/auth.js'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { validateFileType, MAX_FILE_SIZE } from '../utils/validation.js'
import { getWhatsAppClientAsync } from '../utils/whatsapp.js'

const app = new Hono()

// POST /api/v1/media/upload - Upload media to local storage and return public URL
app.post('/upload', requireRole(['ADMIN', 'BUSINESS_OWNER', 'AGENT']), async (c: Context) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return c.json({ error: { code: 'BadRequest', message: 'No file provided' } }, 400)
    }

    // Check file size (max 16MB for WhatsApp)
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: { code: 'BadRequest', message: 'File too large. Maximum size is 16MB' } }, 400)
    }

    // Validate file type
    const mimeType = file.type
    let fileCategory: 'image' | 'document' | 'video' | 'audio' | null = null
    
    if (validateFileType(mimeType, 'image')) {
      fileCategory = 'image'
    } else if (validateFileType(mimeType, 'document')) {
      fileCategory = 'document'
    } else if (validateFileType(mimeType, 'video')) {
      fileCategory = 'video'
    } else if (validateFileType(mimeType, 'audio')) {
      fileCategory = 'audio'
    }

    if (!fileCategory) {
      return c.json({ 
        error: { 
          code: 'BadRequest', 
          message: 'Invalid file type. Allowed: images (JPEG, PNG, WebP), documents (PDF, DOC, DOCX), videos (MP4, 3GP), audio (OGG, MP3, AMR)' 
        } 
      }, 400)
    }

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const ext = path.extname(file.name)
    const filename = `${timestamp}-${randomStr}${ext}`
    const filePath = path.join(uploadsDir, filename)

    // Convert File to Buffer and save locally
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(filePath, buffer)

    // Generate public URL (using Cloudflare Tunnel URL)
    const baseUrl = process.env.PUBLIC_URL || 'https://api.kirim.chat'
    const publicUrl = `${baseUrl}/uploads/${filename}`

    // Check if upload target is WhatsApp
    let whatsappMediaId = null
    const target = formData.get('target')
    
    if (target === 'whatsapp') {
      const phoneNumberId = formData.get('phoneNumberId') as string
      if (phoneNumberId) {
        try {
          // Upload to WhatsApp
          const whatsapp = await getWhatsAppClientAsync()
          const result = await whatsapp.uploadMedia(
            phoneNumberId,
            buffer,
            file.type,
            file.name
          )
          whatsappMediaId = result.id
        } catch (error) {
          console.error('Failed to upload to WhatsApp:', error)
          // Continue execution - we still have the local file
        }
      }
    }

    return c.json({
      success: true,
      data: {
        id: whatsappMediaId,
        url: publicUrl,
        mimeType: file.type,
        filename: file.name,
        size: file.size
      }
    })
  } catch (error: any) {
    console.error('Media upload error:', error)
    return c.json({ 
      error: { 
        code: 'UploadError', 
        message: error.message || 'Failed to upload media'
      } 
    }, 500)
  }
})

// GET /api/v1/media/:mediaId - Get media URL
app.get('/:mediaId', requireRole(['ADMIN', 'BUSINESS_OWNER', 'AGENT']), async (c: Context) => {
  try {
    const mediaId = c.req.param('mediaId')

    const whatsapp = await getWhatsAppClientAsync()
    const result = await whatsapp.getMediaUrl(mediaId)

    return c.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Get media URL error:', error)
    return c.json({ 
      error: { 
        code: 'MediaError', 
        message: error.response?.data?.error?.message || error.message || 'Failed to get media URL'
      } 
    }, 500)
  }
})

// GET /api/v1/media/proxy/:mediaId - Proxy endpoint to fetch and stream media from WhatsApp
// This is a fallback for media that failed to download during webhook processing
// Requirements: 6.5, 6.6
app.get('/proxy/:mediaId', requireRole(['ADMIN', 'BUSINESS_OWNER', 'AGENT']), async (c: Context) => {
  const mediaId = c.req.param('mediaId')
  
  try {
    if (!mediaId) {
      return c.json({ 
        error: { code: 'BadRequest', message: 'Media ID is required' } 
      }, 400)
    }

    const whatsapp = await getWhatsAppClientAsync()

    // 1. Get media URL from WhatsApp (valid for 5 minutes)
    const mediaInfo = await whatsapp.getMediaUrl(mediaId)
    
    if (!mediaInfo.url) {
      return c.json({ 
        error: { code: 'MediaNotFound', message: 'Media URL not available' } 
      }, 404)
    }

    // 2. Download media from WhatsApp
    const mediaBuffer = await whatsapp.downloadMedia(mediaInfo.url)

    // 3. Stream to client with correct content-type
    return new Response(mediaBuffer, {
      headers: {
        'Content-Type': mediaInfo.mime_type || 'application/octet-stream',
        'Content-Length': mediaBuffer.byteLength?.toString() || mediaBuffer.length?.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour on client
        'Content-Disposition': `inline; filename="${mediaId}.${getExtensionFromMimeType(mediaInfo.mime_type)}"`,
      },
    })
  } catch (error: any) {
    // Extract meaningful error info without logging entire axios error object
    const errorMessage = error.response?.data?.error?.message || error.message
    const errorCode = error.response?.data?.error?.code
    const httpStatus = error.response?.status
    
    console.error('Media proxy error:', {
      mediaId,
      httpStatus,
      errorCode,
      errorMessage
    })
    
    // Handle specific WhatsApp API errors
    if (httpStatus === 404) {
      return c.json({ 
        error: { code: 'MediaNotFound', message: 'Media not found or expired' } 
      }, 404)
    }
    
    // Handle 400 errors - typically means media expired or wrong access token
    if (httpStatus === 400) {
      return c.json({ 
        error: { 
          code: 'MediaExpired', 
          message: 'Media has expired or is no longer accessible. WhatsApp media is only available for a limited time after being received.' 
        } 
      }, 410) // 410 Gone - resource no longer available
    }
    
    return c.json({ 
      error: { 
        code: 'ProxyError', 
        message: errorMessage || 'Failed to proxy media'
      } 
    }, 500)
  }
})

// Helper function to get file extension from mime type
function getExtensionFromMimeType(mimeType: string | undefined): string {
  if (!mimeType) return 'bin'
  
  const mimeToExt: Record<string, string> = {
    // Images
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    // Videos
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    // Audio
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/amr': 'amr',
    'audio/aac': 'aac',
    // Documents
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  }
  
  return mimeToExt[mimeType] || 'bin'
}

export default app
