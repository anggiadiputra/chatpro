import { webhookQueue } from '../../utils/queue.js'

export async function handleIncomingMessage(
  message: any,
  metadata: any,
  user: any
): Promise<void> {
  try {
    if (!user) {
      console.error('❌ User not found for incoming message')
      return
    }

    console.log('📨 Enqueueing incoming message:', {
      from: message.from,
      type: message.type,
      userId: user.id
    })

    // Add job to queue for background processing
    await webhookQueue.add(
      'process-incoming-message',
      {
        message,
        metadata,
        user,
      },
      {
        // Priority based on message type (text messages get higher priority for AI)
        priority: message.type === 'text' ? 1 : 5,
        // Remove duplicate messages (same wamId)
        jobId: message.id,
      }
    )

    console.log('✅ Message enqueued for processing:', message.id)

    // Return immediately - webhook processing happens in background
    // This ensures Meta gets a fast 200 OK response
  } catch (error) {
    console.error('❌ Error enqueueing incoming message:', error)
    throw error
  }
}
