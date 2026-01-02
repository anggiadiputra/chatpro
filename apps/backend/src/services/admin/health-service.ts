import { prisma } from '../../utils/database.js'
import { connectionManager } from '../../websocket/connection-manager.js'
import { webhookQueue, messageQueue, webhookOutboundQueue } from '../../utils/queue.js'

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy'
  latencyMs: number
  error?: string
}

export interface RedisHealth {
  status: 'healthy' | 'unhealthy'
  latencyMs: number
  error?: string
}

export interface QueueStats {
  pending: number
  active: number
  completed: number
  failed: number
  delayed: number
  byQueue: {
    webhook: { pending: number; active: number; completed: number; failed: number }
    message: { pending: number; active: number; completed: number; failed: number }
    webhookOutbound: { pending: number; active: number; completed: number; failed: number }
  }
}

export interface WebsocketStats {
  activeConnections: number
  onlineUsers: number
}

export interface WebhookStats {
  successRate24h: number
  totalDeliveries24h: number
  successCount24h: number
  failedCount24h: number
}

export interface SystemHealth {
  database: DatabaseHealth
  redis: RedisHealth
  queue: QueueStats
  websocket: WebsocketStats
  webhooks: WebhookStats
  overall: 'healthy' | 'degraded' | 'unhealthy'
}


export class AdminHealthService {
  /**
   * Check database connection and latency
   * Requirements: 6.1
   */
  static async checkDatabase(): Promise<DatabaseHealth> {
    const start = Date.now()
    try {
      // Simple query to check connection
      await prisma.$queryRaw`SELECT 1`
      const latencyMs = Date.now() - start

      return {
        status: 'healthy',
        latencyMs
      }
    } catch (error) {
      const latencyMs = Date.now() - start
      return {
        status: 'unhealthy',
        latencyMs,
        error: error instanceof Error ? error.message : 'Unknown database error'
      }
    }
  }

  /**
   * Check Redis connection and latency
   * Requirements: 6.2
   */
  static async checkRedis(): Promise<RedisHealth> {
    const start = Date.now()
    try {
      // Use webhookQueue's client to ping Redis
      const client = await webhookQueue.client
      await client.ping()
      const latencyMs = Date.now() - start

      return {
        status: 'healthy',
        latencyMs
      }
    } catch (error) {
      const latencyMs = Date.now() - start
      return {
        status: 'unhealthy',
        latencyMs,
        error: error instanceof Error ? error.message : 'Unknown Redis error'
      }
    }
  }

  /**
   * Get BullMQ queue statistics
   * Requirements: 6.3
   */
  static async getQueueStats(): Promise<QueueStats> {
    const [webhookCounts, messageCounts, webhookOutboundCounts] = await Promise.all([
      webhookQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
      messageQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
      webhookOutboundQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed')
    ])

    return {
      pending: webhookCounts.waiting + messageCounts.waiting + webhookOutboundCounts.waiting,
      active: webhookCounts.active + messageCounts.active + webhookOutboundCounts.active,
      completed: webhookCounts.completed + messageCounts.completed + webhookOutboundCounts.completed,
      failed: webhookCounts.failed + messageCounts.failed + webhookOutboundCounts.failed,
      delayed: webhookCounts.delayed + messageCounts.delayed + webhookOutboundCounts.delayed,
      byQueue: {
        webhook: {
          pending: webhookCounts.waiting,
          active: webhookCounts.active,
          completed: webhookCounts.completed,
          failed: webhookCounts.failed
        },
        message: {
          pending: messageCounts.waiting,
          active: messageCounts.active,
          completed: messageCounts.completed,
          failed: messageCounts.failed
        },
        webhookOutbound: {
          pending: webhookOutboundCounts.waiting,
          active: webhookOutboundCounts.active,
          completed: webhookOutboundCounts.completed,
          failed: webhookOutboundCounts.failed
        }
      }
    }
  }

  /**
   * Get WebSocket connection statistics
   */
  static getWebsocketStats(): WebsocketStats {
    return {
      activeConnections: connectionManager.getTotalConnections(),
      onlineUsers: connectionManager.getOnlineUsersCount()
    }
  }

  /**
   * Get webhook delivery statistics for last 24 hours
   * Requirements: 6.4
   */
  static async getWebhookStats(): Promise<WebhookStats> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [totalDeliveries, successCount] = await Promise.all([
      prisma.webhookDeliveryLog.count({
        where: { createdAt: { gte: twentyFourHoursAgo } }
      }),
      prisma.webhookDeliveryLog.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
          status: 'success'
        }
      })
    ])

    const failedCount = totalDeliveries - successCount
    const successRate = totalDeliveries > 0
      ? Math.round((successCount / totalDeliveries) * 100 * 10) / 10
      : 100 // If no deliveries, consider it 100%

    return {
      successRate24h: successRate,
      totalDeliveries24h: totalDeliveries,
      successCount24h: successCount,
      failedCount24h: failedCount
    }
  }

  /**
   * Determine overall health status
   * Requirements: 6.5
   */
  static determineOverallHealth(
    database: DatabaseHealth,
    redis: RedisHealth,
    queue: QueueStats
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // If database or Redis is down, system is unhealthy
    if (database.status === 'unhealthy' || redis.status === 'unhealthy') {
      return 'unhealthy'
    }

    // If there are many failed jobs, system is degraded
    const totalFailed = queue.failed
    if (totalFailed > 100) {
      return 'degraded'
    }

    // If latency is high, system is degraded
    if (database.latencyMs > 1000 || redis.latencyMs > 500) {
      return 'degraded'
    }

    return 'healthy'
  }

  /**
   * Get complete system health status
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    const [database, redis, queue, webhooks] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.getQueueStats(),
      this.getWebhookStats()
    ])

    const websocket = this.getWebsocketStats()
    const overall = this.determineOverallHealth(database, redis, queue)

    return {
      database,
      redis,
      queue,
      websocket,
      webhooks,
      overall
    }
  }
}
