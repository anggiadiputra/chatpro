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

    const config = await prisma.aIConfig.upsert({
      where: { userId: c.user.id },
      update: {},
      create: { userId: c.user.id },
    })

    return c.json({ success: true, data: config })
  } catch (error) {
    console.error('Failed to fetch AI config:', error)
    return c.json({ error: { code: 'InternalServerError', message: error instanceof Error ? error.message : 'Failed to fetch AI config' } }, 500)
  }
})

// POST /api/v1/ai/config - Update AI config
app.post('/config', requireRole(['ADMIN', 'BUSINESS_OWNER']), async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
    }

    const body = await c.req.json()

    const updatedConfig = await prisma.aIConfig.upsert({
      where: { userId: c.user.id },
      create: {
        userId: c.user.id,
        enabled: body.enabled ?? false,
        model: body.model ?? 'gpt-4.1-nano-2025-04-14',
        systemPrompt: body.systemPrompt ?? 'You are a helpful customer support assistant.',
        temperature: body.temperature ?? 0.7,
        filterWords: body.filterWords,
        activeAgentId: body.activeAgentId,
      },
      update: {
        enabled: body.enabled,
        model: body.model,
        systemPrompt: body.systemPrompt,
        temperature: body.temperature,
        filterWords: body.filterWords,
        activeAgentId: body.activeAgentId,
      },
    })

    return c.json({ success: true, data: updatedConfig })
  } catch (error) {
    console.error('Failed to update AI config:', error)
    return c.json({ error: { code: 'InternalServerError', message: error instanceof Error ? error.message : 'Failed to update AI config' } }, 500)
  }
})

export default app