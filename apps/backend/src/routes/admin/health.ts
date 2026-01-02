import { Hono } from 'hono'
import type { Context } from 'hono'
import { AdminHealthService } from '../../services/admin/health-service.js'

const app = new Hono()

/**
 * GET /api/v1/admin/health
 * Get system health status
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
app.get('/', async (c: Context) => {
  try {
    const health = await AdminHealthService.getSystemHealth()

    // Return appropriate HTTP status based on health
    const httpStatus = health.overall === 'healthy' ? 200 
      : health.overall === 'degraded' ? 200 
      : 503

    return c.json({
      success: true,
      data: health
    }, httpStatus)
  } catch (error) {
    console.error('Admin health check error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to check system health'
      }
    }, 500)
  }
})

/**
 * GET /api/v1/admin/health/database
 * Get database health only
 */
app.get('/database', async (c: Context) => {
  try {
    const health = await AdminHealthService.checkDatabase()

    return c.json({
      success: true,
      data: health
    }, health.status === 'healthy' ? 200 : 503)
  } catch (error) {
    console.error('Database health check error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to check database health'
      }
    }, 500)
  }
})

/**
 * GET /api/v1/admin/health/redis
 * Get Redis health only
 */
app.get('/redis', async (c: Context) => {
  try {
    const health = await AdminHealthService.checkRedis()

    return c.json({
      success: true,
      data: health
    }, health.status === 'healthy' ? 200 : 503)
  } catch (error) {
    console.error('Redis health check error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to check Redis health'
      }
    }, 500)
  }
})

/**
 * GET /api/v1/admin/health/queues
 * Get queue statistics
 */
app.get('/queues', async (c: Context) => {
  try {
    const stats = await AdminHealthService.getQueueStats()

    return c.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Queue stats error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to get queue statistics'
      }
    }, 500)
  }
})

/**
 * GET /api/v1/admin/health/webhooks
 * Get webhook delivery statistics
 */
app.get('/webhooks', async (c: Context) => {
  try {
    const stats = await AdminHealthService.getWebhookStats()

    return c.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Webhook stats error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to get webhook statistics'
      }
    }, 500)
  }
})

export default app
