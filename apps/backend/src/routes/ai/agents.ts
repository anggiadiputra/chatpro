import { Hono } from 'hono'
import type { Context } from 'hono'
import { requireRole } from '../../middleware/auth.js'
import { prisma } from '../../utils/database.js'
import { checkUsageLimit, checkFeatureAccess } from '../../middleware/subscription.js'

const app = new Hono()

// GET /api/v1/ai/agents - List all agents for the current user
app.get('/', requireRole(['ADMIN', 'BUSINESS_OWNER']), async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
    }

    const agents = await prisma.aIAgent.findMany({
      where: { userId: c.user.id },
      include: {
        _count: {
          select: { knowledgeDocuments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      knowledgeDocumentCount: agent._count.knowledgeDocuments,
    }))

    return c.json({ success: true, data: formattedAgents })
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return c.json({ error: { code: 'InternalServerError', message: 'Failed to fetch agents' } }, 500)
  }
})

// GET /api/v1/ai/agents/:id - Get a single agent
app.get('/:id', requireRole(['ADMIN', 'BUSINESS_OWNER']), async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
    }

    const { id } = c.req.param()
    const agent = await prisma.aIAgent.findFirst({
      where: { id, userId: c.user.id },
      include: { knowledgeDocuments: true },
    })

    if (!agent) {
      return c.json({ error: { code: 'NotFound', message: 'Agent not found' } }, 404)
    }

    return c.json({ success: true, data: agent })
  } catch (error) {
    console.error('Failed to fetch agent:', error)
    return c.json({ error: { code: 'InternalServerError', message: 'Failed to fetch agent' } }, 500)
  }
})

// POST /api/v1/ai/agents - Create a new agent
app.post('/', requireRole(['ADMIN', 'BUSINESS_OWNER']), async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
    }

    // Check AI feature access first
    const hasAccess = await checkFeatureAccess(c.user.id, 'aiChatbot')
    if (!hasAccess) {
      return c.json({ error: { code: 'Forbidden', message: 'AI Chatbot is not available in your current plan' } }, 403)
    }

    // Check Agent limits
    const limitCheck = await checkUsageLimit(c.user.id, 'maxAgents')
    if (!limitCheck.allowed) {
      return c.json({
        error: {
          code: 'Forbidden',
          message: `You have reached the maximum number of agents (${limitCheck.limit}) for your plan.`
        }
      }, 403)
    }

    const { name, systemPrompt, documentIds } = await c.req.json()

    if (!name || !systemPrompt) {
      return c.json({ error: { code: 'BadRequest', message: 'Name and system prompt are required' } }, 400)
    }

    const newAgent = await prisma.aIAgent.create({
      data: {
        name,
        systemPrompt,
        userId: c.user.id,
        knowledgeDocuments: {
          connect: documentIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: { knowledgeDocuments: true },
    })

    return c.json({ success: true, data: newAgent }, 201)
  } catch (error) {
    console.error('Failed to create agent:', error)
    return c.json({ error: { code: 'InternalServerError', message: 'Failed to create agent' } }, 500)
  }
})

// PUT /api/v1/ai/agents/:id - Update an agent
app.put('/:id', requireRole(['ADMIN', 'BUSINESS_OWNER']), async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
    }

    const { id } = c.req.param()
    const { name, systemPrompt, documentIds } = await c.req.json()

    const updatedAgent = await prisma.aIAgent.update({
      where: { id, userId: c.user.id },
      data: {
        name,
        systemPrompt,
        knowledgeDocuments: {
          set: documentIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: { knowledgeDocuments: true },
    })

    return c.json({ success: true, data: updatedAgent })
  } catch (error) {
    console.error('Failed to update agent:', error)
    return c.json({ error: { code: 'InternalServerError', message: 'Failed to update agent' } }, 500)
  }
})

// DELETE /api/v1/ai/agents/:id - Delete an agent
app.delete('/:id', requireRole(['ADMIN', 'BUSINESS_OWNER']), async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
    }

    const { id } = c.req.param()

    await prisma.aIAgent.delete({
      where: { id, userId: c.user.id },
    })

    return c.body(null, 204)
  } catch (error) {
    console.error('Failed to delete agent:', error)
    return c.json({ error: { code: 'InternalServerError', message: 'Failed to delete agent' } }, 500)
  }
})

export default app