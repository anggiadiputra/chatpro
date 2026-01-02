import { Hono } from 'hono'
import type { Context } from 'hono'
import { prisma } from '../../utils/database.js'
import { getEffectiveUserId } from '../../middleware/resolveContext.js'

const app = new Hono()

// GET /api/v1/messages - List messages
app.get('/', async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({ 
        error: { 
          code: 'Unauthorized', 
          message: 'Authentication required' 
        } 
      }, 401)
    }

    // Use effectiveUserId for agents to access business owner's data
    // Requirements: 5.3, 6.2
    const effectiveUserId = getEffectiveUserId(c)
    const customerId = c.req.query('customerId')

    const where: any = { userId: effectiveUserId }
    if (customerId) where.customerId = customerId

    // Fetch messages, unread counts, and assignments in parallel
    // Requirements: 5.1, 5.2 - Calculate unread counts efficiently using database queries
    const [messages, unreadCountsRaw, assignmentsRaw] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          customer: {
            select: { 
              id: true, 
              phoneNumber: true, 
              name: true 
            }
          },
          user: {
            select: { 
              id: true, 
              name: true, 
              email: true 
            }
          },
          template: {
            select: { 
              id: true, 
              templateName: true, 
              category: true 
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 100
      }),
      // Calculate unread counts per customer
      // Requirements: 1.1, 5.1 - Count INBOUND messages with status NOT equal to READ
      prisma.message.groupBy({
        by: ['customerId'],
        where: {
          userId: effectiveUserId,
          direction: 'INBOUND',
          status: { not: 'READ' }
        },
        _count: { id: true }
      }),
      // Fetch active assignments for WhatsApp conversations
      prisma.conversationAssignment.findMany({
        where: {
          businessOwnerId: effectiveUserId,
          conversationType: 'WHATSAPP',
          unassignedAt: null, // Only active assignments
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          aiAgent: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      })
    ])

    // Transform unread counts to Record<string, number>
    const unreadCounts: Record<string, number> = {}
    for (const item of unreadCountsRaw) {
      unreadCounts[item.customerId] = item._count.id
    }

    // Transform assignments to Record<conversationId, assignment>
    // Support both HUMAN and AI_AGENT assignment types
    const assignments: Record<string, {
      assigneeId: string | null
      assigneeName: string | null
      assigneeImage: string | null
      assigneeType: string
      aiAgentId: string | null
      aiAgentName: string | null
      assignedAt: Date
    }> = {}
    for (const assignment of assignmentsRaw) {
      // Handle both HUMAN and AI_AGENT assignment types
      const isAIAgent = assignment.assigneeType === 'AI_AGENT'
      assignments[assignment.conversationId] = {
        assigneeId: assignment.assigneeId,
        assigneeName: assignment.assignee?.name ?? null,
        assigneeImage: assignment.assignee?.image ?? null,
        assigneeType: assignment.assigneeType,
        aiAgentId: assignment.aiAgentId,
        aiAgentName: assignment.aiAgent?.name ?? null,
        assignedAt: assignment.assignedAt,
      }
    }

    return c.json({ 
      success: true, 
      data: messages,
      unreadCounts,
      assignments
    })
  } catch (error) {
    console.error('List messages error:', error)
    return c.json({ 
      error: { 
        code: 'InternalServerError', 
        message: 'Failed to fetch messages' 
      } 
    }, 500)
  }
})

export default app
