import { Hono } from 'hono'
import type { Context } from 'hono'
import { prisma } from '../../utils/database.js'
import { auditLog } from '../../utils/auditLog.js'
import { getWhatsAppClientAsync } from '../../utils/whatsapp.js'

const app = new Hono()

// POST /api/v1/templates/:id/submit - Submit template to Meta for approval
app.post('/:id/submit', async (c: Context) => {
  try {
    const id = c.req.param('id')

    const template = await prisma.messageTemplate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            wabaId: true
          }
        }
      }
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

    // Check if WABA is configured
    if (!template.user.wabaId) {
      return c.json({
        error: {
          code: 'ConfigurationError',
          message: 'WABA not configured for this user'
        }
      }, 400)
    }

    // Build template components for Meta API
    const components: any[] = []

    // Header component
    if (template.headerType && template.headerContent) {
      components.push({
        type: 'HEADER',
        format: template.headerType,
        text: template.headerType === 'TEXT' ? template.headerContent : undefined,
        example: template.headerType !== 'TEXT' ? {
          header_handle: [template.headerContent]
        } : undefined
      })
    }

    // Body component
    components.push({
      type: 'BODY',
      text: template.content,
      example: template.variables && Array.isArray(template.variables) && template.variables.length > 0 ? {
        body_text: [template.variables]
      } : undefined
    })

    // Footer component
    if (template.footerContent) {
      components.push({
        type: 'FOOTER',
        text: template.footerContent
      })
    }

    // Buttons component
    if (template.buttons && Array.isArray(template.buttons) && template.buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: template.buttons
      })
    }

    // Submit to Meta using WABA ID
    try {
      const whatsapp = await getWhatsAppClientAsync()
      const wabaId = template.user.wabaId
      
      const result = await whatsapp.createTemplate({
        wabaId: wabaId,
        name: template.templateName,
        category: template.category,
        language: template.language,
        components
      })

      // Update template with Meta ID
      const updatedTemplate = await prisma.messageTemplate.update({
        where: { id },
        data: {
          metaTemplateId: result.id,
          status: 'PENDING',
          submittedAt: new Date()
        }
      })

      // Audit log
      await auditLog(
        'TEMPLATE_SUBMITTED',
        'MessageTemplate',
        id,
        {
          metaTemplateId: result.id,
          submittedBy: c.user?.id
        },
        c.user?.id
      )

      return c.json({
        success: true,
        data: updatedTemplate,
        meta: result
      })
    } catch (metaError: any) {
      console.error('Meta API error:', metaError)
      console.error('Meta response data:', JSON.stringify(metaError.response?.data, null, 2))
      
      // Update template status to rejected if Meta returns error
      await prisma.messageTemplate.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: metaError.response?.data?.error?.message || 'Submission failed'
        }
      })

      return c.json({
        error: {
          code: 'MetaAPIError',
          message: metaError.response?.data?.error?.message || 'Failed to submit template to Meta',
          details: metaError.response?.data
        }
      }, 400)
    }
  } catch (error) {
    console.error('Submit template error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to submit template'
      }
    }, 500)
  }
})

export default app
