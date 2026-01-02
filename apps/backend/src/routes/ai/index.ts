import { Hono } from 'hono'
import type { Context } from 'hono'
import { requireRole } from '../../middleware/auth.js'
import { prisma } from '../../utils/database.js'
import agents from './agents.js'
import knowledge from './knowledge.js'

const app = new Hono()

app.route('/agents', agents)
app.route('/knowledge', knowledge)

// GET /api/v1/ai/config - Get AI config
app.get('/config', requireRole(['ADMIN', 'BUSINESS_OWNER']), async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
    }

    const config = await prisma.aIConfig.findUnique({
      where: { userId: c.user.id },
    })

    if (!config) {
      // Create a default config if it doesn't exist
      const newConfig = await prisma.aIConfig.create({
        data: { userId: c.user.id },
      })
      return c.json({ success: true, data: newConfig })
    }

    return c.json({ success: true, data: config })
  } catch (error) {
    console.error('Failed to fetch AI config:', error)
    return c.json({ error: { code: 'InternalServerError', message: 'Failed to fetch AI config' } }, 500)
  }
})

// POST /api/v1/ai/config - Update AI config
app.post('/config', requireRole(['ADMIN', 'BUSINESS_OWNER']), async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
    }

    const body = await c.req.json()

    const updatedConfig = await prisma.aIConfig.update({
      where: { userId: c.user.id },
      data: {
        enabled: body.enabled,
        model: body.model,
        temperature: body.temperature,
        filterWords: body.filterWords,
        activeAgentId: body.activeAgentId,
      },
    })

    return c.json({ success: true, data: updatedConfig })
  } catch (error) {
    console.error('Failed to update AI config:', error)
    return c.json({ error: { code: 'InternalServerError', message: 'Failed to update AI config' } }, 500)
  }
})

export default app