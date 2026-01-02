import { Hono } from 'hono'
import type { Context } from 'hono'
import { prisma } from '../../utils/database.js'
import { auditLog } from '../../utils/auditLog.js'

const app = new Hono()

// DELETE /api/v1/customers/:id - Delete customer
app.delete('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')

    const customer = await prisma.customer.findUnique({ where: { id } })
    if (!customer) {
      return c.json({ error: { code: 'NotFound', message: 'Customer not found' } }, 404)
    }

    // Check access
    if (c.user?.role !== 'ADMIN' && c.user?.id !== customer.userId) {
      return c.json({ error: { code: 'Forbidden', message: 'Access denied' } }, 403)
    }

    // Delete customer (cascades to consent logs)
    await prisma.customer.delete({ where: { id } })

    await auditLog('CUSTOMER_DELETED', 'Customer', id, {
      phoneNumber: customer.phoneNumber,
      deletedBy: c.user?.id
    }, c.user?.id)

    return c.json({ success: true, message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Delete customer error:', error)
    return c.json({ error: { code: 'InternalServerError', message: 'Failed to delete customer' } }, 500)
  }
})

export default app
