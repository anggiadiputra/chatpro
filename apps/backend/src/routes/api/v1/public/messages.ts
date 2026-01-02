import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { prisma } from '../../../../utils/database.js';
import { getWhatsAppClientAsync } from '../../../../utils/whatsapp.js';
import { canSendFreeMessage } from '../../../../utils/messageWindow.js';
import { instagramService } from '../../../../services/InstagramService.js';
import { getApiKeyUserId } from '../../../../middleware/apiKeyAuth.js';
import { combinedSendRateLimiter } from '../../../../middleware/publicApiRateLimiter.js';
import { logger } from '../../../../utils/logger.js';
import { webhookService } from '../../../../services/webhook-service.js';

const app = new Hono();

// WhatsApp message types
const WHATSAPP_MESSAGE_TYPES = ['text', 'image', 'document', 'audio', 'video', 'template'] as const;
// Instagram message types
const INSTAGRAM_MESSAGE_TYPES = ['text', 'image', 'media_share'] as const;

// Content length limits
const WHATSAPP_TEXT_MAX_LENGTH = 4096;
const INSTAGRAM_TEXT_MAX_LENGTH = 1000;
const MAX_MEDIA_SIZE_BYTES = 16 * 1024 * 1024; // 16MB

// Validation schema for send message
const sendMessageSchema = z.object({
  customer_id: z.string().min(1, 'customer_id is required'),
  channel: z.enum(['whatsapp', 'instagram']),
  message_type: z.string(),
  content: z.string().optional(),
  media_url: z.string().url().optional(),
  // WhatsApp template specific
  template: z.object({
    name: z.string(),
    language: z.object({ code: z.string() }),
    components: z.array(z.any()).optional(),
  }).optional(),
  // WhatsApp document specific
  filename: z.string().optional(),
  caption: z.string().optional(),
});

/**
 * POST /api/v1/messages/send
 * Send a message to a customer via WhatsApp or Instagram
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
app.post('/send', combinedSendRateLimiter, async (c: Context) => {
  const startTime = Date.now();
  
  try {
    const userId = getApiKeyUserId(c);
    const body = await c.req.json();
    
    // Validate request body
    const parseResult = sendMessageSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'Invalid request parameters',
          details: parseResult.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      }, 400);
    }
    
    const data = parseResult.data;
    
    // Validate message type per channel
    if (data.channel === 'whatsapp') {
      if (!WHATSAPP_MESSAGE_TYPES.includes(data.message_type as any)) {
        return c.json({
          error: {
            code: 'ValidationError',
            message: `Invalid message_type for WhatsApp. Allowed types: ${WHATSAPP_MESSAGE_TYPES.join(', ')}`,
          },
        }, 400);
      }
    } else if (data.channel === 'instagram') {
      if (!INSTAGRAM_MESSAGE_TYPES.includes(data.message_type as any)) {
        return c.json({
          error: {
            code: 'ValidationError',
            message: `Invalid message_type for Instagram. Allowed types: ${INSTAGRAM_MESSAGE_TYPES.join(', ')}`,
          },
        }, 400);
      }
    }
    
    // Validate content length
    if (data.content) {
      if (data.channel === 'whatsapp' && data.content.length > WHATSAPP_TEXT_MAX_LENGTH) {
        return c.json({
          error: {
            code: 'ValidationError',
            message: `Content exceeds maximum length of ${WHATSAPP_TEXT_MAX_LENGTH} characters for WhatsApp`,
            details: [{ field: 'content', message: `Maximum ${WHATSAPP_TEXT_MAX_LENGTH} characters allowed` }],
          },
        }, 400);
      }
      if (data.channel === 'instagram' && data.content.length > INSTAGRAM_TEXT_MAX_LENGTH) {
        return c.json({
          error: {
            code: 'ValidationError',
            message: `Content exceeds maximum length of ${INSTAGRAM_TEXT_MAX_LENGTH} characters for Instagram`,
            details: [{ field: 'content', message: `Maximum ${INSTAGRAM_TEXT_MAX_LENGTH} characters allowed` }],
          },
        }, 400);
      }
    }
    
    // Require content for text messages
    if (data.message_type === 'text' && !data.content) {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'content is required for text messages',
        },
      }, 400);
    }
    
    // Require media_url for media messages
    if (['image', 'document', 'audio', 'video', 'media_share'].includes(data.message_type) && !data.media_url) {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'media_url is required for media messages',
        },
      }, 400);
    }
    
    // Require template for template messages
    if (data.message_type === 'template' && !data.template) {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'template object is required for template messages',
        },
      }, 400);
    }
    
    // Get customer and verify ownership
    const customer = await prisma.customer.findUnique({
      where: { id: data.customer_id },
      include: {
        igConversations: {
          include: {
            instagramAccount: true,
          },
        },
      },
    });
    
    if (!customer) {
      return c.json({
        error: {
          code: 'NotFound',
          message: 'Customer not found',
        },
      }, 404);
    }
    
    if (customer.userId !== userId) {
      return c.json({
        error: {
          code: 'Forbidden',
          message: 'Customer does not belong to authenticated user',
        },
      }, 403);
    }
    
    // Route to appropriate channel handler
    if (data.channel === 'whatsapp') {
      return await sendWhatsAppMessage(c, userId, customer, data);
    } else {
      return await sendInstagramMessage(c, userId, customer, data);
    }
    
  } catch (error: any) {
    logger.error('Public API send message error:', error);
    
    return c.json({
      error: {
        code: 'InternalError',
        message: 'Failed to send message',
      },
    }, 500);
  }
});

/**
 * Send message via WhatsApp
 */
async function sendWhatsAppMessage(
  c: Context,
  userId: string,
  customer: any,
  data: z.infer<typeof sendMessageSchema>
) {
  // Get user's WABA configuration
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user || !user.wabaId || !user.phoneNumberId) {
    return c.json({
      error: {
        code: 'ConfigurationError',
        message: 'WhatsApp Business Account not connected',
      },
    }, 400);
  }
  
  if (user.wabaConnectionStatus === 'disconnected') {
    return c.json({
      error: {
        code: 'ConnectionError',
        message: 'WhatsApp Business Account is disconnected',
        recoveryAction: 'Reconnect your WhatsApp Business Account',
      },
    }, 403);
  }
  
  if (!customer.phoneNumber) {
    return c.json({
      error: {
        code: 'ValidationError',
        message: 'Customer does not have a phone number for WhatsApp',
      },
    }, 400);
  }
  
  // Check 24-hour window for non-template messages
  if (data.message_type !== 'template') {
    const windowCheck = await canSendFreeMessage(customer.id);
    
    if (!windowCheck.allowed) {
      return c.json({
        error: {
          code: 'WindowClosed',
          message: windowCheck.reason || '24-hour messaging window expired. Use template message.',
          windowStatus: {
            expired: true,
            expiredAt: windowCheck.windowStatus?.windowExpiresAt,
          },
        },
      }, 400);
    }
  }
  
  // Build WhatsApp message payload
  const whatsapp = await getWhatsAppClientAsync();
  let messagePayload: any = {
    phoneNumberId: user.phoneNumberId,
    to: customer.phoneNumber,
    type: data.message_type,
  };
  
  switch (data.message_type) {
    case 'text':
      messagePayload.text = { body: data.content };
      break;
    case 'template':
      messagePayload.template = data.template;
      break;
    case 'image':
      messagePayload.image = { link: data.media_url, caption: data.caption };
      break;
    case 'document':
      messagePayload.document = { link: data.media_url, filename: data.filename, caption: data.caption };
      break;
    case 'audio':
      messagePayload.audio = { link: data.media_url };
      break;
    case 'video':
      messagePayload.video = { link: data.media_url, caption: data.caption };
      break;
  }
  
  // Send via WhatsApp API
  const result = await whatsapp.sendMessage(messagePayload);
  
  // Save message to database
  const message = await prisma.message.create({
    data: {
      userId,
      customerId: customer.id,
      messageType: data.message_type.toUpperCase() as any,
      direction: 'OUTBOUND',
      content: data.content || data.caption || null,
      mediaUrl: data.media_url || null,
      wamId: result.messages?.[0]?.id,
      status: 'SENT',
      source: 'API',
    },
  });
  
  // Emit webhook event for message.sent (Requirement 3.1, 8.1, 8.2, 8.4)
  webhookService.emitEvent(
    userId,
    'message.sent',
    'whatsapp',
    {
      message_id: message.id,
      customer_id: customer.id,
      customer_phone: customer.phoneNumber,
      direction: 'outbound',
      message_type: data.message_type,
      content: data.content || data.caption || undefined,
      media_url: data.media_url || undefined,
    }
  ).catch(err => logger.error('Failed to emit message.sent webhook:', err));
  
  return c.json({
    success: true,
    data: {
      message_id: message.id,
      status: 'sent',
      channel: 'whatsapp',
      timestamp: message.createdAt.toISOString(),
    },
  });
}

/**
 * Send message via Instagram
 */
async function sendInstagramMessage(
  c: Context,
  userId: string,
  customer: any,
  data: z.infer<typeof sendMessageSchema>
) {
  // Find Instagram conversation for this customer
  const igConversation = customer.igConversations?.[0];
  
  if (!igConversation || !igConversation.instagramAccount) {
    return c.json({
      error: {
        code: 'ConfigurationError',
        message: 'No Instagram conversation found for this customer',
      },
    }, 400);
  }
  
  const igAccount = igConversation.instagramAccount;
  
  if (igAccount.connectionStatus !== 'connected') {
    return c.json({
      error: {
        code: 'ConnectionError',
        message: 'Instagram account is disconnected',
        recoveryAction: 'Reconnect your Instagram account',
      },
    }, 403);
  }
  
  // Check 24-hour window for Instagram
  if (!igConversation.isWindowActive) {
    return c.json({
      error: {
        code: 'WindowClosed',
        message: '24-hour messaging window expired. Wait for customer to send a new message.',
        windowStatus: {
          expired: true,
          expiredAt: igConversation.windowExpiresAt,
        },
      },
    }, 400);
  }
  
  let result;
  
  // Send via Instagram API
  switch (data.message_type) {
    case 'text':
      result = await instagramService.sendTextMessage(
        igAccount.igId,
        igConversation.participantIgsid,
        data.content!
      );
      break;
    case 'image':
      result = await instagramService.sendMediaMessage(
        igAccount.igId,
        igConversation.participantIgsid,
        'image',
        data.media_url!
      );
      break;
    case 'media_share':
      // For media_share, we send as image
      result = await instagramService.sendMediaMessage(
        igAccount.igId,
        igConversation.participantIgsid,
        'image',
        data.media_url!
      );
      break;
    default:
      return c.json({
        error: {
          code: 'ValidationError',
          message: `Unsupported message type for Instagram: ${data.message_type}`,
        },
      }, 400);
  }
  
  // Save message to database
  const message = await prisma.iGMessage.create({
    data: {
      conversationId: igConversation.id,
      igMessageId: result.messageId,
      direction: 'OUTBOUND',
      messageType: data.message_type.toUpperCase() as any,
      text: data.content || null,
      mediaUrl: data.media_url || null,
      status: 'SENT',
    },
  });
  
  // Update conversation last message
  await prisma.iGConversation.update({
    where: { id: igConversation.id },
    data: {
      lastMessageAt: new Date(),
      lastMessagePreview: data.content?.substring(0, 100) || '[Media]',
    },
  });
  
  // Emit webhook event for message.sent (Requirement 3.1, 8.1, 8.2, 8.4)
  // Get customer info for webhook payload
  const customerForWebhook = customer.instagramUsername 
    ? { customer_username: customer.instagramUsername }
    : {};
  
  webhookService.emitEvent(
    userId,
    'message.sent',
    'instagram',
    {
      message_id: message.id,
      customer_id: customer.id,
      ...customerForWebhook,
      direction: 'outbound',
      message_type: data.message_type,
      content: data.content || undefined,
      media_url: data.media_url || undefined,
    }
  ).catch(err => logger.error('Failed to emit message.sent webhook:', err));
  
  return c.json({
    success: true,
    data: {
      message_id: message.id,
      status: 'sent',
      channel: 'instagram',
      timestamp: message.createdAt.toISOString(),
    },
  });
}

/**
 * POST /api/v1/messages/:messageId/read
 * Mark a message as read and send read receipt
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
app.post('/:messageId/read', async (c: Context) => {
  try {
    const userId = getApiKeyUserId(c);
    const messageId = c.req.param('messageId');
    
    if (!messageId) {
      return c.json({
        error: {
          code: 'ValidationError',
          message: 'messageId is required',
        },
      }, 400);
    }
    
    // Try to find message in WhatsApp messages first
    let message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        customer: true,
      },
    });
    
    // If not found, try Instagram messages
    let igMessage = null;
    if (!message) {
      igMessage = await prisma.iGMessage.findUnique({
        where: { id: messageId },
        include: {
          conversation: {
            include: {
              instagramAccount: true,
            },
          },
        },
      });
    }
    
    // Message not found in either table
    if (!message && !igMessage) {
      return c.json({
        error: {
          code: 'NotFound',
          message: 'Message not found',
        },
      }, 404);
    }
    
    // Handle WhatsApp message
    if (message) {
      // Verify ownership
      if (message.userId !== userId) {
        return c.json({
          error: {
            code: 'NotFound',
            message: 'Message not found',
          },
        }, 404);
      }
      
      // Only mark inbound messages as read
      if (message.direction !== 'INBOUND') {
        return c.json({
          error: {
            code: 'ValidationError',
            message: 'Only inbound messages can be marked as read',
          },
        }, 400);
      }
      
      // Get user's phone number ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!user?.phoneNumberId || !message.wamId) {
        return c.json({
          error: {
            code: 'ConfigurationError',
            message: 'Cannot send read receipt: missing configuration',
          },
        }, 400);
      }
      
      // Send read receipt via WhatsApp API
      const whatsapp = await getWhatsAppClientAsync();
      await whatsapp.markAsRead(user.phoneNumberId, message.wamId);
      
      // Update message status
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { status: 'READ' },
      });
      
      return c.json({
        success: true,
        data: {
          message_id: updatedMessage.id,
          status: 'read',
          channel: 'whatsapp',
          updated_at: updatedMessage.createdAt.toISOString(),
        },
      });
    }
    
    // Handle Instagram message
    if (igMessage) {
      const igAccount = igMessage.conversation.instagramAccount;
      
      // Verify ownership
      if (igAccount.userId !== userId) {
        return c.json({
          error: {
            code: 'NotFound',
            message: 'Message not found',
          },
        }, 404);
      }
      
      // Only mark inbound messages as read
      if (igMessage.direction !== 'INBOUND') {
        return c.json({
          error: {
            code: 'ValidationError',
            message: 'Only inbound messages can be marked as read',
          },
        }, 400);
      }
      
      // Send mark_seen to Instagram API (Requirement 4.1)
      let markSeenWarning: string | undefined;
      try {
        await instagramService.sendMarkSeen(
          igAccount.igId,
          igMessage.conversation.participantIgsid
        );
      } catch (error) {
        // Log but don't fail - mark_seen is best effort (Requirement 4.3)
        logger.warn('Failed to send mark_seen to Instagram:', error);
        markSeenWarning = 'Failed to send read receipt to Instagram';
      }
      
      // Update local message status (Requirement 4.2)
      const updatedMessage = await prisma.iGMessage.update({
        where: { id: messageId },
        data: { 
          status: 'READ',
          readAt: new Date(),
        },
      });
      
      // Update conversation unread count
      await prisma.iGConversation.update({
        where: { id: igMessage.conversationId },
        data: {
          unreadCount: {
            decrement: 1,
          },
        },
      });
      
      return c.json({
        success: true,
        data: {
          message_id: updatedMessage.id,
          status: 'read',
          channel: 'instagram',
          updated_at: updatedMessage.createdAt.toISOString(),
          ...(markSeenWarning && { warning: markSeenWarning }),
        },
      });
    }
    
    // Should never reach here
    return c.json({
      error: {
        code: 'InternalError',
        message: 'Unexpected error',
      },
    }, 500);
    
  } catch (error: any) {
    logger.error('Public API mark as read error:', error);
    
    return c.json({
      error: {
        code: 'InternalError',
        message: 'Failed to mark message as read',
      },
    }, 500);
  }
});

export default app;
