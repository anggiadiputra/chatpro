import { z } from 'zod'

// Phone number validation (E.164 format)
export const phoneNumberSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Must be in E.164 format')

// Email validation
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email too long')

// Message schemas
export const sendMessageSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  phoneNumber: phoneNumberSchema.optional(),
  customerId: z.string().optional(),
  type: z.enum(['text', 'template', 'image', 'document', 'audio', 'video']),
  text: z.object({
    body: z.string().min(1).max(4096, 'Message too long (max 4096 characters)'),
    preview_url: z.boolean().optional()
  }).optional(),
  template: z.object({
    name: z.string().min(1).max(512),
    language: z.object({
      code: z.string().regex(/^[a-z]{2}_[A-Z]{2}$/, 'Invalid language code')
    }),
    components: z.array(z.any()).optional()
  }).optional(),
  image: z.object({
    link: z.string().url().optional(),
    id: z.string().optional(),
    caption: z.string().max(1024).optional()
  }).optional(),
  document: z.object({
    link: z.string().url().optional(),
    id: z.string().optional(),
    caption: z.string().max(1024).optional(),
    filename: z.string().max(255).optional()
  }).optional()
}).refine(
  data => data.phoneNumber || data.customerId,
  { message: 'Either phoneNumber or customerId must be provided' }
)

// Template schemas
export const createTemplateSchema = z.object({
  userId: z.string().min(1),
  templateName: z.string()
    .min(1, 'Template name required')
    .max(512, 'Template name too long')
    .regex(/^[a-z0-9_]+$/, 'Template name must be lowercase alphanumeric with underscores only'),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  language: z.string().regex(/^[a-z]{2}_[A-Z]{2}$/, 'Invalid language code'),
  components: z.array(z.object({
    type: z.string(),
    format: z.string().optional(),
    text: z.string().optional(),
    buttons: z.array(z.any()).optional(),
    example: z.any().optional()
  })).min(1, 'At least one component required')
})

// Customer schemas
export const createCustomerSchema = z.object({
  userId: z.string().min(1),
  phoneNumber: phoneNumberSchema,
  name: z.string().max(255).optional(),
  email: emailSchema.optional(),
  consentStatus: z.boolean().default(false),
  isBlacklisted: z.boolean().default(false)
})

export const updateCustomerSchema = z.object({
  name: z.string().max(255).optional(),
  email: emailSchema.optional(),
  consentStatus: z.boolean().optional(),
  isBlacklisted: z.boolean().optional()
})

// Business Account schemas
export const createBusinessAccountSchema = z.object({
  name: z.string().min(1).max(255),
  wabaId: z.string().min(1),
  phoneNumberId: z.string().min(1),
  country: z.string().length(2).optional(),
  currency: z.string().length(3).optional()
})

// Media upload validation
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/3gpp']
export const ALLOWED_AUDIO_TYPES = ['audio/ogg', 'audio/mpeg', 'audio/amr']

export const MAX_FILE_SIZE = 16 * 1024 * 1024 // 16MB

const SAFE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'video/mp4': '.mp4',
  'video/3gpp': '.3gp',
  'audio/ogg': '.ogg',
  'audio/mpeg': '.mp3',
  'audio/amr': '.amr',
}

export function getSafeExtension(mimeType: string): string | null {
  return SAFE_EXTENSIONS[mimeType] || null
}

export function hasValidMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false

  switch (mimeType) {
    case 'image/jpeg':
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    case 'image/png':
      return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    case 'image/webp':
      return buffer.subarray(0, 4).toString('ascii') === 'RIFF'
        && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    case 'application/pdf':
      return buffer.subarray(0, 5).toString('ascii') === '%PDF-'
    case 'application/msword':
      return buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return buffer[0] === 0x50 && buffer[1] === 0x4b
    case 'video/mp4':
    case 'video/3gpp':
      return buffer.subarray(4, 8).toString('ascii') === 'ftyp'
    case 'audio/ogg':
      return buffer.subarray(0, 4).toString('ascii') === 'OggS'
    case 'audio/mpeg':
      return buffer.subarray(0, 3).toString('ascii') === 'ID3'
        || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
    case 'audio/amr':
      return buffer.subarray(0, 6).toString('ascii') === '#!AMR\n'
    default:
      return false
  }
}

export function validateFileType(mimeType: string, type: 'image' | 'document' | 'video' | 'audio'): boolean {
  switch (type) {
    case 'image':
      return ALLOWED_IMAGE_TYPES.includes(mimeType)
    case 'document':
      return ALLOWED_DOCUMENT_TYPES.includes(mimeType)
    case 'video':
      return ALLOWED_VIDEO_TYPES.includes(mimeType)
    case 'audio':
      return ALLOWED_AUDIO_TYPES.includes(mimeType)
    default:
      return false
  }
}

// Validation middleware helper
export function validate<T>(schema: z.ZodSchema<T>) {
  return async (data: unknown): Promise<{ success: true; data: T } | { success: false; error: string }> => {
    try {
      const validated = await schema.parseAsync(data)
      return { success: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`).join(', ')
        return { success: false, error: messages }
      }
      return { success: false, error: 'Validation failed' }
    }
  }
}
