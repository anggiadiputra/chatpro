/**
 * Broadcast Routes
 * 
 * API endpoints for broadcast message sending:
 * - POST /send - Create and start broadcast job
 * - GET /jobs - Get broadcast jobs list
 * - GET /jobs/:id - Get broadcast job detail
 * - POST /jobs/:id/cancel - Cancel broadcast job
 * 
 * Base Path: /api/v1/broadcast
 * 
 * Requirements: 1.1, 6.1, 6.2
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'
import { prisma } from '../../utils/database.js'
import { bulkTemplateSendService, BULK_SEND_ERROR_CODES, type CsvRow } from '../../services/bulk-template-send-service.js'
import { getEffectiveUserId, getActingAgentId } from '../../middleware/resolveContext.js'
import { resolveContext } from '../../middleware/resolveContext.js'
import { auditLog } from '../../utils/auditLog.js'
import { logger } from '../../utils/logger.js'

const app = new Hono()

// Apply context resolution middleware to all routes
app.use('*', resolveContext)

/**
 * Validation schemas
 */
const createBroadcastSchema = z.object({
  templateName: z.string().min(1, 'Template name is required'),
  languageCode: z.string().min(1, 'Language code is required'),
  variableValues: z.record(z.string(), z.string()).optional().default({}),
  recipientSource: z.enum(['customers', 'csv']),
  customerIds: z.array(z.string()).optional(),
  phoneNumbers: z.array(z.string()).optional(),
  messageDelayMs: z.number().min(0).max(30000).optional().default(1000), // 0-30 seconds, default 1s
}).refine(
  (data) => {
    if (data.recipientSource === 'customers') {
      return data.customerIds && data.customerIds.length > 0
    }
    if (data.recipientSource === 'csv') {
      return data.phoneNumbers && data.phoneNumbers.length > 0
    }
    return false
  },
  {
    message: 'customerIds required for customers source, phoneNumbers required for csv source'
  }
)

/**
 * Parse pagination parameters from query string
 */
function parsePagination(query: Record<string, string | undefined>): { page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1)
  const limit = Math.min(Math.max(1, parseInt(query.limit || '20', 10) || 20), 100)
  return { page, limit }
}


/**
 * POST /api/v1/broadcast/send
 * Create and start a broadcast job
 * 
 * Body:
 * - templateName: string (required) - WhatsApp template name
 * - languageCode: string (required) - Template language code
 * - variableValues: Record<string, string> (optional) - Variable values for all recipients
 * - recipientSource: 'customers' | 'csv' (required) - Source of recipients
 * - customerIds: string[] (required if recipientSource='customers') - Customer IDs
 * - phoneNumbers: string[] (required if recipientSource='csv') - Phone numbers
 * 
 * Returns: Created broadcast job
 * 
 * Requirements: 1.1, 6.1
 */
app.post('/send', async (c: Context) => {
  try {
    const userId = getEffectiveUserId(c)
    const actingAgentId = getActingAgentId(c)
    
    if (!userId) {
      return c.json({
        error: {
          code: 'Unauthorized',
          message: 'Authentication required'
        }
      }, 401)
    }

    // Parse and validate request body
    const body = await c.req.json()
    const validation = createBroadcastSchema.safeParse(body)

    if (!validation.success) {
      return c.json({
        error: {
          code: 'ValidationError',
          message: validation.error.issues[0]?.message || 'Invalid request data',
          details: validation.error.issues
        }
      }, 400)
    }

    const { templateName, languageCode, variableValues, recipientSource, customerIds, phoneNumbers } = validation.data

    // Verify user has WABA connected
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phoneNumberId: true,
        wabaConnectionStatus: true
      }
    })

    if (!user?.phoneNumberId) {
      return c.json({
        error: {
          code: 'ConfigurationError',
          message: 'WhatsApp Business Account not connected'
        }
      }, 400)
    }

    if (user.wabaConnectionStatus === 'disconnected') {
      return c.json({
        error: {
          code: 'ConnectionError',
          message: 'WhatsApp Business Account is disconnected'
        }
      }, 403)
    }

    // Verify template exists and is approved
    const template = await prisma.messageTemplate.findFirst({
      where: {
        userId,
        templateName,
        language: languageCode,
        status: 'APPROVED'
      }
    })

    if (!template) {
      return c.json({
        error: {
          code: 'NotFound',
          message: 'Template not found or not approved'
        }
      }, 404)
    }

    // Build CSV data based on recipient source
    let csvData: CsvRow[] = []

    if (recipientSource === 'customers' && customerIds) {
      // Get customers and extract phone numbers
      const customers = await prisma.customer.findMany({
        where: {
          id: { in: customerIds },
          userId,
          consentStatus: true,
          blacklisted: false
        },
        select: {
          id: true,
          phoneNumber: true
        }
      })

      if (customers.length === 0) {
        return c.json({
          error: {
            code: 'ValidationError',
            message: 'No eligible customers found'
          }
        }, 400)
      }

      csvData = customers.map(customer => ({
        phoneNumber: customer.phoneNumber,
        ...variableValues
      }))
    } else if (recipientSource === 'csv' && phoneNumbers) {
      // Validate phone numbers
      const validPhones = phoneNumbers.filter(phone => {
        const cleaned = phone.replace(/[\s-]/g, '')
        return /^\+?[1-9]\d{1,14}$/.test(cleaned)
      })

      if (validPhones.length === 0) {
        return c.json({
          error: {
            code: 'ValidationError',
            message: 'No valid phone numbers provided'
          }
        }, 400)
      }

      csvData = validPhones.map(phone => ({
        phoneNumber: phone,
        ...variableValues
      }))
    }

    // Create bulk send job
    const job = await bulkTemplateSendService.createBulkSend(userId, {
      templateName,
      languageCode,
      csvData,
      messageDelayMs: validation.data.messageDelayMs
    })

    // Audit log
    await auditLog(
      'BROADCAST_CREATED',
      'BulkTemplateSend',
      job.id,
      {
        templateName,
        languageCode,
        recipientSource,
        totalRecipients: job.totalRecipients,
        createdBy: (c as any).user?.id,
        actingAgentId
      },
      (c as any).user?.id
    )

    logger.info('Broadcast job created via API', {
      jobId: job.id,
      userId,
      templateName,
      recipientSource,
      totalRecipients: job.totalRecipients
    })

    // Start processing in background (non-blocking)
    const delayMs = job.messageDelayMs || validation.data.messageDelayMs || 1000
    bulkTemplateSendService.processBulkSend(job.id, userId, delayMs).catch(err => {
      logger.error('Broadcast processing failed', {
        jobId: job.id,
        error: err.message
      })
    })

    return c.json({
      success: true,
      data: job
    }, 201)
  } catch (error: any) {
    logger.error('Create broadcast error', { error: error.message })
    
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to create broadcast job'
      }
    }, 500)
  }
})


/**
 * GET /api/v1/broadcast/jobs
 * Get broadcast jobs list with pagination
 * 
 * Query:
 * - page: number (optional, default: 1) - Page number
 * - limit: number (optional, default: 20) - Items per page
 * - status: string (optional) - Filter by status (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
 * 
 * Returns: Paginated list of broadcast jobs
 * 
 * Requirements: 6.1, 6.2
 */
app.get('/jobs', async (c: Context) => {
  try {
    const userId = getEffectiveUserId(c)
    
    if (!userId) {
      return c.json({
        error: {
          code: 'Unauthorized',
          message: 'Authentication required'
        }
      }, 401)
    }

    const { page, limit } = parsePagination(c.req.query())
    const status = c.req.query('status')

    // Build where clause
    const where: any = { userId }
    if (status) {
      where.status = status
    }

    const [jobs, total] = await Promise.all([
      prisma.bulkTemplateSend.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          templateName: true,
          status: true,
          totalRecipients: true,
          successCount: true,
          failedCount: true,
          createdAt: true,
          updatedAt: true,
          completedAt: true
        }
      }),
      prisma.bulkTemplateSend.count({ where })
    ])

    return c.json({
      success: true,
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    logger.error('Get broadcast jobs error', { error: error.message })
    
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to get broadcast jobs'
      }
    }, 500)
  }
})

/**
 * GET /api/v1/broadcast/jobs/:id
 * Get broadcast job detail
 * 
 * Params:
 * - id: string (required) - Broadcast job ID
 * 
 * Returns: Broadcast job with status and results
 * 
 * Requirements: 6.1, 6.2
 */
app.get('/jobs/:id', async (c: Context) => {
  try {
    const userId = getEffectiveUserId(c)
    
    if (!userId) {
      return c.json({
        error: {
          code: 'Unauthorized',
          message: 'Authentication required'
        }
      }, 401)
    }

    const jobId = c.req.param('id')

    if (!jobId) {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'Job ID is required'
        }
      }, 400)
    }

    const job = await bulkTemplateSendService.getBulkSendStatus(jobId, userId)

    return c.json({
      success: true,
      data: job
    })
  } catch (error: any) {
    if (error.message === BULK_SEND_ERROR_CODES.JOB_NOT_FOUND) {
      return c.json({
        error: {
          code: 'NotFound',
          message: 'Broadcast job not found'
        }
      }, 404)
    }

    logger.error('Get broadcast job detail error', { error: error.message })
    
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to get broadcast job detail'
      }
    }, 500)
  }
})

/**
 * POST /api/v1/broadcast/jobs/:id/cancel
 * Cancel a broadcast job
 * 
 * Params:
 * - id: string (required) - Broadcast job ID
 * 
 * Returns: Success status
 * 
 * Requirements: 6.2
 */
app.post('/jobs/:id/cancel', async (c: Context) => {
  try {
    const userId = getEffectiveUserId(c)
    const actingAgentId = getActingAgentId(c)
    
    if (!userId) {
      return c.json({
        error: {
          code: 'Unauthorized',
          message: 'Authentication required'
        }
      }, 401)
    }

    const jobId = c.req.param('id')

    if (!jobId) {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'Job ID is required'
        }
      }, 400)
    }

    await bulkTemplateSendService.cancelBulkSend(jobId, userId)

    // Audit log
    await auditLog(
      'BROADCAST_CANCELLED',
      'BulkTemplateSend',
      jobId,
      {
        cancelledBy: (c as any).user?.id,
        actingAgentId
      },
      (c as any).user?.id
    )

    logger.info('Broadcast job cancelled via API', {
      jobId,
      userId
    })

    return c.json({
      success: true,
      message: 'Broadcast job cancelled'
    })
  } catch (error: any) {
    if (error.message === BULK_SEND_ERROR_CODES.JOB_NOT_FOUND) {
      return c.json({
        error: {
          code: 'NotFound',
          message: 'Broadcast job not found'
        }
      }, 404)
    }

    if (error.message === BULK_SEND_ERROR_CODES.JOB_CANNOT_CANCEL) {
      return c.json({
        error: {
          code: 'InvalidOperation',
          message: 'Cannot cancel job with current status. Only PENDING or PROCESSING jobs can be cancelled.'
        }
      }, 400)
    }

    logger.error('Cancel broadcast error', { error: error.message })
    
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to cancel broadcast job'
      }
    }, 500)
  }
})

export default app
