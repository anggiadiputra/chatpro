import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../../utils/database.js'
import { getWhatsAppClientAsync } from '../../utils/whatsapp.js'
import { getEffectiveUserId } from '../../middleware/resolveContext.js'
import { eventEmitter } from '../../websocket/index.js'

const app = new Hono()

const markAsReadSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
})

/**
 * POST /messages/read
 * Mark all unread messages from a customer as read
 * This is called when user opens a chat in the inbox
 */
app.post('/', async (c) => {
  try {
    const userId = getEffectiveUserId(c)
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const validation = markAsReadSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      }, 400)
    }

    const { customerId } = validation.data

    // Get user's phone number ID for WhatsApp API
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        phoneNumberId: true,
        wabaConnectionStatus: true,
        wabaAccessToken: true
      }
    })

    if (!user?.phoneNumberId) {
      return c.json({ error: 'WhatsApp not connected' }, 400)
    }

    // Get unread inbound messages from this customer
    const unreadMessages = await prisma.message.findMany({
      where: {
        userId,
        customerId,
        direction: 'INBOUND',
        status: { in: ['DELIVERED', 'SENT'] } // Not yet read
      },
      orderBy: { timestamp: 'desc' },
      take: 10 // Limit to last 10 messages to avoid rate limiting
    })

    if (unreadMessages.length === 0) {
      return c.json({ 
        success: true, 
        message: 'No unread messages',
        markedCount: 0,
        unreadCount: 0
      })
    }

    // Only send mark as read to WhatsApp if connected
    if (user.wabaConnectionStatus === 'connected' && user.wabaAccessToken) {
      try {
        const whatsapp = await getWhatsAppClientAsync()
        
        // Mark the most recent message as read (WhatsApp marks all prior as read too)
        const latestMessage = unreadMessages[0]
        if (latestMessage.wamId) {
          await whatsapp.markAsRead(user.phoneNumberId, latestMessage.wamId)
          console.log(`✅ Marked message ${latestMessage.wamId} as read for customer ${customerId}`)
        }
      } catch (error) {
        console.error('Failed to send mark as read to WhatsApp:', error)
        // Don't fail the request - still update local status
      }
    }

    // Update local message status to READ
    await prisma.message.updateMany({
      where: {
        id: { in: unreadMessages.map(m => m.id) }
      },
      data: {
        status: 'READ'
      }
    })

    // Emit WebSocket event for unread count update (Requirement 4.2)
    try {
      console.log(`[MarkAsRead] Emitting conversation_updated with unreadCount: 0 for customer ${customerId}`)
      eventEmitter.emitConversationUpdated(userId, {
        conversationId: customerId,
        changes: {
          unreadCount: 0
        }
      })
    } catch (err) {
      console.error('Failed to emit unread count update:', err)
    }

    // After marking as read, unread count for this customer is 0
    return c.json({ 
      success: true, 
      message: 'Messages marked as read',
      markedCount: unreadMessages.length,
      unreadCount: 0
    })

  } catch (error: any) {
    console.error('Mark as read error:', error)
    return c.json({ 
      error: 'Failed to mark messages as read',
      details: error.message 
    }, 500)
  }
})

export default app
