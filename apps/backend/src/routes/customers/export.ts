import { Hono } from 'hono'
import type { Context } from 'hono'
import { prisma } from '../../utils/database.js'
import { auditLog } from '../../utils/auditLog.js'

const app = new Hono()

// GET /api/v1/customers/export - Export customers to CSV
app.get('/export', async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
    }

    const userId = c.user.id

    const customers = await prisma.customer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // Generate CSV
    const csvHeaders = 'Phone Number,Name,Consent Status,Consent Source,Blacklisted,Created At\n'
    const csvRows = customers.map(c =>
      `${c.phoneNumber},"${c.name || ''}",${c.consentStatus ? 'Yes' : 'No'},"${c.consentSource || ''}",${c.blacklisted ? 'Yes' : 'No'},${c.createdAt.toISOString()}`
    ).join('\n')

    const csv = csvHeaders + csvRows

    await auditLog('CUSTOMERS_EXPORTED', 'Customer', userId, {
      count: customers.length,
      exportedBy: c.user.id
    }, c.user.id)

    return c.text(csv, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.csv"`
    })
  } catch (error) {
    console.error('Export customers error:', error)
    return c.json({ error: { code: 'InternalServerError', message: 'Failed to export customers' } }, 500)
  }
})

export default app
