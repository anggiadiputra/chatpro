import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'
import { prisma } from '../../utils/database.js'
import { auditLog } from '../../utils/auditLog.js'
import { templateCacheService } from '../../services/template-cache-service.js'

const app = new Hono()

const updateTemplateSchema = z.object({
  content: z.string().min(1).optional(),
  headerContent: z.string().optional(),
  footerContent: z.string().max(60).optional(),
  buttons: z.array(z.any()).optional()
})

// PATCH /api/v1/templates/:id - Update template
app.patch('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const data = updateTemplateSchema.parse(body)

    const template = await prisma.messageTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return c.json({
        error: {
          code: 'NotFound',
          message: 'Template not found'
        }
      }, 404)
    }

    // Check access
    if (c.user?.role !== 'ADMIN' && c.user?.id !== template.userId) {
      return c.json({
        error: {
          code: 'Forbidden',
          message: 'Access denied'
        }
      }, 403)
    }

    // Can only update templates that are not approved
    if (template.status === 'APPROVED') {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'Cannot update approved templates. Create a new version instead.'
        }
      }, 400)
    }

    const updatedTemplate = await prisma.messageTemplate.update({
      where: { id },
      data
    })

    // Audit log
    await auditLog(
      'TEMPLATE_UPDATED',
      'MessageTemplate',
      id,
      {
        updates: data,
        updatedBy: c.user?.id
      },
      c.user?.id
    )

    // Invalidate template list cache
    await templateCacheService.invalidateTemplateList(template.userId)

    return c.json({
      success: true,
      data: updatedTemplate
    })
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

    console.error('Update template error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to update template'
      }
    }, 500)
  }
})

export default app
