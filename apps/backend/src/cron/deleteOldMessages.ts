import cron from 'node-cron'
import { prisma } from '../utils/database.js'

/**
 * Soft-delete messages older than 30 days (Meta compliance requirement)
 * Runs daily at 2 AM
 */
export async function deleteOldMessages() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const result = await prisma.message.updateMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo
      },
      deletedAt: null // Only delete messages not already deleted
    },
    data: {
      deletedAt: new Date(),
      // Optionally clear sensitive data
      content: null,
      mediaUrl: null
    }
  })

  return result.count
}

/**
 * Cron job to delete messages older than 30 days
 * Runs daily at 2:00 AM
 */
export function startMessageDeletionJob() {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      const count = await deleteOldMessages()
      if (count > 0) {
        console.log(`✅ Soft-deleted ${count} messages older than 30 days (Meta compliance)`)
      }
    } catch (error) {
      console.error('❌ Error deleting old messages:', error)
    }
  })

  console.log('🗑️  Message deletion cron job started (runs daily at 2:00 AM)')
}
