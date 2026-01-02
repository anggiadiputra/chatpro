import { prisma } from '../../utils/database.js'
import { webhookService, WebhookEventType } from '../../services/webhook-service.js'

export async function handleMessageStatus(
  status: any,
  user: any
): Promise<void> {
  try {
    if (!user) {
      console.error('❌ User not found for status update')
      return
    }

    console.log('📊 Processing message status:', {
      messageId: status.id,
      status: status.status,
      userId: user.id
    })

    // Find the message first to get customer info for webhook
    const message = await prisma.message.findFirst({
      where: {
        wamId: status.id,
        userId: user.id
      },
      include: {
        customer: {
          select: {
            id: true,
            phoneNumber: true,
          }
        }
      }
    })

    // Update message status
    await prisma.message.updateMany({
      where: { 
        wamId: status.id,
        userId: user.id
      },
      data: {
        status: status.status.toUpperCase(),
        timestamp: new Date(parseInt(status.timestamp) * 1000)
      }
    })

    console.log('✅ Message status updated:', status.id, '→', status.status)

    // Emit webhook event for status updates (Requirement 3.1, 8.1, 8.2, 8.4)
    if (message && message.customer) {
      const statusLower = status.status.toLowerCase()
      let eventType: WebhookEventType | null = null

      if (statusLower === 'delivered') {
        eventType = 'message.delivered'
      } else if (statusLower === 'read') {
        eventType = 'message.read'
      } else if (statusLower === 'failed') {
        eventType = 'message.failed'
      }

      if (eventType) {
        webhookService.emitEvent(
          user.id,
          eventType,
          'whatsapp',
          {
            message_id: message.id,
            customer_id: message.customer.id,
            customer_phone: message.customer.phoneNumber,
            direction: message.direction.toLowerCase() as 'inbound' | 'outbound',
            message_type: message.messageType.toLowerCase(),
            content: message.content || undefined,
            media_url: message.mediaUrl || undefined,
          }
        ).catch(err => console.error(`Failed to emit ${eventType} webhook:`, err))
      }
    }
  } catch (error) {
    console.error('❌ Error handling message status:', error)
    throw error
  }
}
