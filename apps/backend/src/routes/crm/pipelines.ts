import { Hono } from 'hono'
import type { Context } from 'hono'
import { prisma } from '../../utils/database.js'
import { auditLog } from '../../utils/auditLog.js'

const app = new Hono()

// --- Pipelines ---

// GET /api/v1/crm/pipelines - List all pipelines
app.get('/pipelines', async (c: Context) => {
    try {
        if (!c.user) return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)

        const pipelines = await prisma.pipeline.findMany({
            where: { userId: c.user.id },
            include: {
                stages: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        return c.json({ success: true, data: pipelines })
    } catch (error) {
        console.error('List pipelines error:', error)
        return c.json({ error: { code: 'InternalServerError', message: 'Failed to fetch pipelines' } }, 500)
    }
})

// POST /api/v1/crm/pipelines - Create pipeline
app.post('/pipelines', async (c: Context) => {
    try {
        if (!c.user) return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)

        const body = await c.req.json()
        const { name, description, isDefault, stages } = body

        const pipeline = await prisma.pipeline.create({
            data: {
                userId: c.user.id,
                name,
                description,
                isDefault: isDefault || false,
                stages: {
                    create: stages?.map((stage: any, index: number) => ({
                        name: stage.name,
                        color: stage.color || '#000000',
                        order: stage.order || index
                    }))
                }
            },
            include: { stages: true }
        })

        await auditLog('PIPELINE_CREATED', 'Pipeline', pipeline.id, { name }, c.user.id)

        return c.json({ success: true, data: pipeline })
    } catch (error) {
        console.error('Create pipeline error:', error)
        return c.json({ error: { code: 'InternalServerError', message: 'Failed to create pipeline' } }, 500)
    }
})

// PUT /api/v1/crm/pipelines/:id - Update pipeline
app.put('/pipelines/:id', async (c: Context) => {
    try {
        if (!c.user) return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
        const id = c.req.param('id')
        const body = await c.req.json()
        const { name, description, isDefault } = body

        const pipeline = await prisma.pipeline.update({
            where: { id, userId: c.user.id },
            data: { name, description, isDefault },
            include: { stages: true }
        })

        return c.json({ success: true, data: pipeline })
    } catch (error) {
        console.error('Update pipeline error:', error)
        return c.json({ error: { code: 'InternalServerError', message: 'Failed to update pipeline' } }, 500)
    }
})

// DELETE /api/v1/crm/pipelines/:id - Delete pipeline
app.delete('/pipelines/:id', async (c: Context) => {
    try {
        if (!c.user) return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
        const id = c.req.param('id')

        await prisma.pipeline.delete({
            where: { id, userId: c.user.id }
        })

        await auditLog('PIPELINE_DELETED', 'Pipeline', id, {}, c.user.id)

        return c.json({ success: true, message: 'Pipeline deleted' })
    } catch (error) {
        console.error('Delete pipeline error:', error)
        return c.json({ error: { code: 'InternalServerError', message: 'Failed to delete pipeline' } }, 500)
    }
})

// --- Stages ---

// POST /api/v1/crm/pipelines/:id/stages - Add stage
app.post('/pipelines/:id/stages', async (c: Context) => {
    try {
        if (!c.user) return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
        const pipelineId = c.req.param('id')
        const body = await c.req.json()
        const { name, color, order } = body

        // Verify pipeline ownership
        const pipeline = await prisma.pipeline.findUnique({
            where: { id: pipelineId, userId: c.user.id }
        })
        if (!pipeline) return c.json({ error: { code: 'NotFound', message: 'Pipeline not found' } }, 404)

        const stage = await prisma.pipelineStage.create({
            data: {
                pipelineId,
                name,
                color,
                order
            }
        })

        return c.json({ success: true, data: stage })
    } catch (error) {
        console.error('Create stage error:', error)
        return c.json({ error: { code: 'InternalServerError', message: 'Failed to create stage' } }, 500)
    }
})

// PUT /api/v1/crm/stages/:id - Update stage
app.put('/stages/:id', async (c: Context) => {
    try {
        if (!c.user) return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
        const id = c.req.param('id')
        const body = await c.req.json()
        const { name, color, order } = body

        // Verify ownership via pipeline
        const stage = await prisma.pipelineStage.findUnique({
            where: { id },
            include: { pipeline: true }
        })
        if (!stage || stage.pipeline.userId !== c.user.id) {
            return c.json({ error: { code: 'NotFound', message: 'Stage not found' } }, 404)
        }

        const updatedStage = await prisma.pipelineStage.update({
            where: { id },
            data: { name, color, order }
        })

        return c.json({ success: true, data: updatedStage })
    } catch (error) {
        console.error('Update stage error:', error)
        return c.json({ error: { code: 'InternalServerError', message: 'Failed to update stage' } }, 500)
    }
})

// DELETE /api/v1/crm/stages/:id - Delete stage
app.delete('/stages/:id', async (c: Context) => {
    try {
        if (!c.user) return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
        const id = c.req.param('id')

        // Verify ownership
        const stage = await prisma.pipelineStage.findUnique({
            where: { id },
            include: { pipeline: true }
        })
        if (!stage || stage.pipeline.userId !== c.user.id) {
            return c.json({ error: { code: 'NotFound', message: 'Stage not found' } }, 404)
        }

        await prisma.pipelineStage.delete({ where: { id } })

        return c.json({ success: true, message: 'Stage deleted' })
    } catch (error) {
        console.error('Delete stage error:', error)
        return c.json({ error: { code: 'InternalServerError', message: 'Failed to delete stage' } }, 500)
    }
})

export default app
