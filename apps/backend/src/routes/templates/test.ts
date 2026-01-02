import { Hono } from 'hono'
import type { Context } from 'hono'
import { prisma } from '../../utils/database.js'
import { getWhatsAppClientAsync } from '../../utils/whatsapp.js'

const app = new Hono()

// POST /api/v1/templates/:id/send-test - Send test message
app.post('/:id/send-test', async (c: Context) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { to } = body

    // Validate test number
    if (!to || !to.startsWith('+62')) {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'Valid Indonesian test number required (e.g., +628xxxxxxx)'
        }
      }, 400)
    }

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

    // Check if template is approved
    if (template.status !== 'APPROVED') {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'Only approved templates can be sent as test messages'
        }
      }, 400)
    }

    // Get WhatsApp client and send test message
    try {
      const whatsapp = await getWhatsAppClientAsync()
      
      // Use the test number from Meta App Review dashboard
      const testPhoneNumberId = process.env.META_PHONE_NUMBER_ID || '902563782933278'
      const wabaId = template.user.wabaId || process.env.META_WABA_ID || '1550105869459821'

      console.log('🧪 Sending test message to:', to)
      console.log('📱 Using Phone Number ID:', testPhoneNumberId)
      console.log('🏢 Using WABA ID:', wabaId)
      
      const result = await whatsapp.sendMessage({
        phoneNumberId: testPhoneNumberId,
        to: to,
        type: 'template',
        template: {
          name: template.templateName,
          language: {
            code: template.language
          }
        }
      })

      console.log('✅ Test message sent successfully:', result)

      return c.json({
        success: true,
        data: {
          message: 'Test message sent successfully',
          to: to,
          templateName: template.templateName
        },
        meta: {
          message_id: result.id,
          test_info: {
            phone_number_id: testPhoneNumberId,
            waba_id: wabaId,
            sent_at: new Date().toISOString()
          }
        }
      })
    } catch (metaError: any) {
      console.error('❌ Meta API error:', metaError)
      console.error('📋 Meta response:', metaError.response?.data)
      
      return c.json({
        error: {
          code: 'MetaAPIError',
          message: metaError.response?.data?.error?.message || 'Failed to send test message',
          details: metaError.response?.data
        }
      }, 400)
    }
  } catch (error) {
    console.error('Send test message error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to send test message'
      }
    }, 500)
  }
})

export default app
