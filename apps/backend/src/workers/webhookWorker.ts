console.log('📦 Loading webhookWorker module...')

import { Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { prisma } from '../utils/database.js'
import { openMessageWindow } from '../utils/messageWindow.js'
import { AIOrchestrator } from '../services/ai/AIOrchestrator.js'
import { getWhatsAppClientAsync, initWhatsAppClient } from '../utils/whatsapp.js'
import { QUEUE_NAMES } from '../utils/queue.js'
import { LeadScoringService } from '../services/lead-scoring.js'
import { ActivityService } from '../services/activity-service.js'
import { webhookService } from '../services/webhook-service.js'
import { eventEmitter } from '../websocket/index.js'
import { mediaDownloadService } from '../services/media-download-service.js'

console.log('📦 webhookWorker imports loaded')

// Redis connection for worker (same config as queue.ts)
const redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    family: 4,
})

// AI Orchestrator instance
const aiOrchestrator = new AIOrchestrator()

// Initialize WhatsApp client with database settings at startup
initWhatsAppClient().catch(err => {
    console.error('Failed to initialize WhatsApp client:', err)
})

// Webhook job data interface
interface WebhookJobData {
    message: any
    metadata: any
    contacts?: WhatsAppContact[] // Optional contacts array from webhook payload
    user: any
}

/**
 * WhatsApp contact object from webhook payload
 */
interface WhatsAppContact {
    profile?: {
        name?: string
    }
    wa_id: string
}

/**
 * Extract profile name from contacts array by matching wa_id with sender
 * @param contacts - Array of contacts from webhook payload
 * @param senderWaId - The wa_id of the message sender (message.from)
 * @returns Profile name or null if not found
 */
export function extractProfileName(contacts: WhatsAppContact[] | undefined, senderWaId: string): string | null {
    if (!contacts || contacts.length === 0) return null

    // Find contact matching sender's wa_id
    const contact = contacts.find(c => c.wa_id === senderWaId)
    if (!contact?.profile?.name) return null

    // Truncate if exceeds 255 characters (database field limit)
    const name = contact.profile.name
    return name.length > 255 ? name.substring(0, 255) : name
}

/**
 * Get a preview string for non-text messages
 */
function getMessagePreview(messageType: string): string {
    const previews: Record<string, string> = {
        image: '📷 Image',
        video: '🎥 Video',
        audio: '🎵 Audio',
        document: '📄 Document',
        location: '📍 Location',
        contacts: '👤 Contact',
        sticker: '🎨 Sticker',
        reaction: '👍 Reaction',
    }
    return previews[messageType.toLowerCase()] || 'Message'
}

// Process webhook job
async function processWebhook(job: Job<WebhookJobData>): Promise<void> {
    const { message, metadata, contacts, user } = job.data

    try {
        if (!user) {
            console.error('❌ User not found for incoming message')
            return
        }

        console.log('📨 Processing incoming message:', {
            from: message.from,
            type: message.type,
            userId: user.id,
            jobId: job.id,
        })

        // Extract profile name from contacts array (Requirements: 1.1, 2.1, 2.2, 3.1)
        const customerName = extractProfileName(contacts, message.from)

        // RACE CONDITION & TRANSACTION FIX:
        // Use transaction with upsert to atomically create customer + consent log
        const customer = await prisma.$transaction(async (tx) => {
            // Get existing customer or create new one (atomic)
            let customer = await tx.customer.upsert({
                where: {
                    userId_phoneNumber: {
                        userId: user.id,
                        phoneNumber: message.from,
                    },
                },
                update: {
                    // If exists and has new name, update it
                    ...(customerName && { name: customerName }),
                },
                create: {
                    userId: user.id,
                    phoneNumber: message.from,
                    name: customerName,
                    consentStatus: true, // Auto-consent customers who message us
                    consentCapturedAt: new Date(),
                    consentSource: 'AUTO_INBOUND',
                    consentPurpose: 'Service messages after customer initiated contact',
                },
            })

            // Check if consent log already exists (for new customers)
            const existingConsentLog = await tx.consentLog.findFirst({
                where: {
                    customerId: customer.id,
                    source: 'AUTO_INBOUND',
                },
            })

            // Create consent log only for new customers (atomic)
            if (!existingConsentLog) {
                await tx.consentLog.create({
                    data: {
                        customerId: customer.id,
                        action: 'OPT_IN',
                        source: 'AUTO_INBOUND',
                        purpose: 'Service messages after customer initiated contact',
                        userId: user.id,
                    },
                })
                console.log('✅ New customer created with auto-consent:', customer.id, customerName || 'no name')
            } else if (customerName && customer.name !== customerName) {
                console.log('✅ Customer name updated:', customer.id, 'to:', customerName)
            }

            return customer
        })

        // Open 24-hour messaging window
        await openMessageWindow(customer.id)
        console.log('✅ Message window opened for customer:', customer.id)

        // Extract message content based on type
        let content = null
        let mediaUrl = null
        let mediaId = null // Original WhatsApp media ID

        switch (message.type) {
            case 'text':
                content = message.text?.body
                break
            case 'image':
                content = message.image?.caption
                mediaId = message.image?.id
                break
            case 'document':
                content = message.document?.caption
                mediaId = message.document?.id
                break
            case 'audio':
                mediaId = message.audio?.id
                break
            case 'video':
                content = message.video?.caption
                mediaId = message.video?.id
                break
            case 'location':
                content = `Location: ${message.location?.latitude}, ${message.location?.longitude}`
                break
            case 'contacts':
                content = `Contact: ${message.contacts?.[0]?.name?.formatted_name}`
                break
            case 'reaction':
                // Store emoji as content, empty emoji means reaction removed
                content = message.reaction?.emoji || null
                // Store the message_id being reacted to in mediaUrl field for reference
                mediaUrl = message.reaction?.message_id || null
                break
        }

        // Download and store media for supported types (Requirements: 6.1, 6.3, 6.4)
        if (mediaId && ['image', 'video', 'audio', 'document'].includes(message.type)) {
            try {
                console.log(`📥 Downloading media for message ${message.id}, mediaId: ${mediaId}`)
                const downloadResult = await mediaDownloadService.downloadAndStore(mediaId)
                
                if (downloadResult.success && downloadResult.localUrl) {
                    mediaUrl = downloadResult.localUrl
                    console.log(`✅ Media downloaded and stored: ${mediaUrl}`)
                } else {
                    // Store original media ID for proxy fallback (Requirement 6.4)
                    mediaUrl = mediaId
                    console.log(`⚠️ Media download failed, storing original ID for proxy fallback: ${mediaId}`, downloadResult.error)
                }
            } catch (error) {
                // Store original media ID for proxy fallback (Requirement 6.4)
                mediaUrl = mediaId
                console.error(`❌ Error downloading media ${mediaId}:`, error)
            }
        }

        // Save message to database
        const savedMessage = await prisma.message.create({
            data: {
                userId: user.id,
                customerId: customer.id,
                messageType: message.type.toUpperCase(),
                direction: 'INBOUND',
                content,
                mediaUrl,
                wamId: message.id,
                status: 'DELIVERED', // Incoming messages are considered delivered
                timestamp: new Date(parseInt(message.timestamp) * 1000),
            },
        })

        console.log('✅ Incoming message saved:', message.id)

        // Emit webhook event for message.received (Requirement 3.1, 8.1, 8.2, 8.4)
        webhookService.emitEvent(
            user.id,
            'message.received',
            'whatsapp',
            {
                message_id: savedMessage.id,
                customer_id: customer.id,
                customer_phone: customer.phoneNumber,
                direction: 'inbound',
                message_type: message.type,
                content: content || undefined,
                media_url: mediaUrl || undefined,
            }
        ).catch(err => console.error('Failed to emit message.received webhook:', err))

        // Emit WebSocket event for real-time UI update (Requirement 2.1)
        console.log(`[WebhookWorker] Emitting new_message event for user ${user.id}`)
        const emitResult = eventEmitter.emitNewMessage(user.id, {
            conversationId: customer.id, // Using customerId as conversationId for WhatsApp
            channel: 'whatsapp',
            participantId: customer.phoneNumber,
            participantName: customer.name,
            message: {
                id: savedMessage.id,
                preview: (content || getMessagePreview(message.type)).substring(0, 100),
                timestamp: savedMessage.timestamp.toISOString(),
                direction: 'inbound',
            },
        })
        console.log(`[WebhookWorker] Emit result: ${emitResult}`)

        // Calculate and emit unread count update (Requirements: 1.2, 4.1)
        try {
            const unreadCount = await prisma.message.count({
                where: {
                    userId: user.id,
                    customerId: customer.id,
                    direction: 'INBOUND',
                    status: { not: 'READ' }
                }
            })
            
            console.log(`[WebhookWorker] Emitting conversation_updated with unreadCount: ${unreadCount}`)
            eventEmitter.emitConversationUpdated(user.id, {
                conversationId: customer.id,
                changes: {
                    unreadCount,
                    lastMessageAt: savedMessage.timestamp.toISOString()
                }
            })
        } catch (err) {
            console.error('Failed to emit unread count update:', err)
        }

        // Trigger lead scoring update asynchronously
        LeadScoringService.updateCustomerScore(customer.id).catch(err =>
            console.error(`Failed to update lead score for customer ${customer.id}:`, err)
        )

        // Log incoming message activity
        ActivityService.logMessageActivity(
            customer.id,
            user.id,
            'received',
            message.id,
            content?.substring(0, 100)
        ).catch(err => console.error('Failed to log message activity:', err))

        // NOTE: Mark as read is NOT automatic anymore
        // It will be triggered when user opens the chat in inbox (frontend calls API)
        // This provides better UX - customer sees "unread" until agent actually views it

        // --- AI Auto-Reply Logic with Assignment Check ---
        // Requirements: 6.1, 6.2, 6.3 - Check assignment status before AI response
        if (message.type === 'text' && content) {
            // Check subscription tier
            if (user.subscriptionTier === 'FREE') {
                console.log('⚠️ AI Auto-Reply skipped: User is on FREE tier', user.id)
                return
            }

            // Check if WABA is connected before auto-replying
            if (user.wabaConnectionStatus === 'disconnected' || !user.wabaAccessToken) {
                console.log('⚠️  AI Auto-Reply skipped: WABA is disconnected for user', user.id)
                return // Skip auto-reply if disconnected
            }

            try {
                const whatsapp = await getWhatsAppClientAsync()
                
                // Process AI response with assignment check (Requirements: 6.1, 6.2, 6.3)
                // - If assigned to human → skip AI response
                // - If assigned to AI Agent → use that AI Agent's configuration
                // - If unassigned with AI enabled → use default AI Agent
                const response = await aiOrchestrator.handleMessageWithAssignmentCheck(
                    user.id,
                    content,
                    customer.id, // conversationId for WhatsApp is the Customer ID
                    'WHATSAPP',  // conversationType
                    customer.id  // customerId for conversation history
                )

                // Only send typing indicator + mark as read if AI will actually reply
                if (response) {
                    // Send typing indicator to show we're about to reply
                    whatsapp.markAsRead(user.phoneNumberId, message.id, true).catch((e) => {
                        console.error('Failed to send typing indicator:', e)
                    })
                    
                    console.log('🤖 AI Auto-Reply generated for:', message.id)

                    // Send the response
                    const result = await whatsapp.sendMessage({
                        phoneNumberId: user.phoneNumberId,
                        to: message.from,
                        type: 'text',
                        text: { body: response },
                    })

                    // Save AI reply to database
                    const aiReplyMessage = await prisma.message.create({
                        data: {
                            userId: user.id,
                            customerId: customer.id,
                            messageType: 'TEXT',
                            direction: 'OUTBOUND',
                            content: response,
                            wamId: result.messages?.[0]?.id,
                            status: 'SENT',
                            source: 'API',
                        },
                    })

                    console.log('🤖 AI Auto-Reply sent and saved:', message.from)

                    // Emit webhook event for message.sent (Requirement 3.1, 8.1, 8.2, 8.4)
                    webhookService.emitEvent(
                        user.id,
                        'message.sent',
                        'whatsapp',
                        {
                            message_id: aiReplyMessage.id,
                            customer_id: customer.id,
                            customer_phone: customer.phoneNumber,
                            direction: 'outbound',
                            message_type: 'text',
                            content: response,
                        }
                    ).catch(err => console.error('Failed to emit message.sent webhook:', err))
                }
            } catch (err) {
                console.error('❌ Error in AI Auto-Reply:', err)
                // Don't throw - we don't want to fail the entire webhook processing
            }
        }
    } catch (error) {
        console.error('❌ Error handling incoming message:', error)
        throw error // Re-throw to trigger retry
    }
}

// Create webhook worker
export const webhookWorker = new Worker<WebhookJobData>(
    QUEUE_NAMES.WEBHOOK,
    processWebhook,
    {
        connection: redisConnection,
        concurrency: 10, // Process up to 10 webhooks concurrently
        limiter: {
            max: 100, // Max 100 jobs
            duration: 1000, // Per second
        },
    }
)

// Worker event handlers
webhookWorker.on('completed', (job) => {
    console.log(`✅ Webhook worker completed job ${job.id}`)
})

webhookWorker.on('failed', (job, err) => {
    console.error(`❌ Webhook worker failed job ${job?.id}:`, err.message)
})

webhookWorker.on('error', (err) => {
    console.error('❌ Webhook worker error:', err)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📦 Closing webhook worker...')
    await webhookWorker.close()
    await redisConnection.quit()
    console.log('✅ Webhook worker closed')
})

console.log('🚀 Webhook worker started')
