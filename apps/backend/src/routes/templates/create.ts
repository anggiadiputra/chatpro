import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'
import { prisma } from '../../utils/database.js'
import { auditLog } from '../../utils/auditLog.js'
import { templateCacheService } from '../../services/template-cache-service.js'
import { teamService } from '../../services/team-service.js'

const app = new Hono()

const createTemplateSchema = z.object({
  userId: z.string().optional(), // Made optional - will use session user if not provided
  templateName: z.string().min(1).max(512),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  language: z.string().default('en'),
  content: z.string().min(1),
  headerType: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
  headerContent: z.string().optional(),
  footerContent: z.string().max(60).optional(),
  buttons: z.array(z.any()).optional(),
  variables: z.array(z.string()).optional()
})

// POST /api/v1/templates - Create template
app.post('/', async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({
        error: {
          code: 'Unauthorized',
          message: 'Authentication required'
        }
      }, 401)
    }

    const body = await c.req.json()
    const data = createTemplateSchema.parse(body)

    // Resolve effective userId - for Agents, use their Business Owner's ID
    let userId = data.userId || c.user.id

    if (c.user.role === 'AGENT') {
      const businessOwnerId = await teamService.getBusinessOwnerIdForAgent(c.user.id)
      if (businessOwnerId) {
        userId = businessOwnerId
      }
    }

    // Check user access - must be own data, agent of owner, or admin
    const isOwnData = c.user.id === userId
    const isAgentOfOwner = c.user.role === 'AGENT' && await teamService.getBusinessOwnerIdForAgent(c.user.id) === userId
    if (c.user.role !== 'ADMIN' && !isOwnData && !isAgentOfOwner) {
      return c.json({
        error: {
          code: 'Forbidden',
          message: 'Access denied'
        }
      }, 403)
    }

    // Validate template content - must have some actual text, not just variables
    const contentWithoutVariables = data.content.replace(/\{\{\d+\}\}/g, '').trim()
    if (!contentWithoutVariables) {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'Template must contain some text content, not just variables'
        }
      }, 400)
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.wabaId) {
      return c.json({
        error: {
          code: 'NotFound',
          message: 'User or WABA not found'
        }
      }, 404)
    }

    // Check if template already exists
    const existingTemplate = await prisma.messageTemplate.findFirst({
      where: {
        userId: userId,
        templateName: data.templateName,
        language: data.language
      }
    })

    if (existingTemplate) {
      return c.json({
        error: {
          code: 'Conflict',
          message: `Template "${data.templateName}" (${data.language}) already exists. Please use a different name or update the existing template.`,
          details: {
            existingTemplateId: existingTemplate.id,
            existingStatus: existingTemplate.status
          }
        }
      }, 409)
    }

    // Create template in database
    const template = await prisma.messageTemplate.create({
      data: {
        userId: userId,
        templateName: data.templateName,
        category: data.category,
        language: data.language,
        content: data.content,
        headerType: data.headerType,
        headerContent: data.headerContent,
        footerContent: data.footerContent,
        buttons: data.buttons || [],
        variables: data.variables || []
      }
    })

    // Audit log
    await auditLog(
      'TEMPLATE_CREATED',
      'MessageTemplate',
      template.id,
      {
        templateName: data.templateName,
        category: data.category,
        userId: userId,
        createdBy: c.user?.id
      },
      c.user?.id
    )

    // Invalidate template list cache
    await templateCacheService.invalidateTemplateList(userId)

    return c.json({
      success: true,
      data: template
    }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'Invalid input data',
          details: error.issues
        }
      }, 400)
    }

    // Handle unique constraint errors
    if (error.code === 'P2002') {
      return c.json({
        error: {
          code: 'Conflict',
          message: 'A template with this name and language already exists. Please choose a different name.',
          details: {
            constraint: error.meta?.target
          }
        }
      }, 409)
    }

    console.error('Create template error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to create template'
      }
    }, 500)
  }
})

export default app
