import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'
import { prisma } from '../../utils/database.js'
import { auditLog } from '../../utils/auditLog.js'

const app = new Hono()

// POST /api/v1/customers/import - Import customers from CSV
app.post('/import', async (c: Context) => {
  try {
    const body = await c.req.json()
    const { customers } = z.object({
      customers: z.array(z.object({
        phoneNumber: z.string().min(10),
        name: z.string().optional(),
        consentStatus: z.boolean().default(false),
        consentSource: z.string().optional()
      }))
    }).parse(body)

    if (!c.user) {
      return c.json({ error: { code: 'Unauthorized', message: 'Authentication required' } }, 401)
    }

    const userId = c.user.id

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    }

    for (const customerData of customers) {
      try {
        // Check if customer already exists
        const existing = await prisma.customer.findUnique({
          where: {
            userId_phoneNumber: {
              userId,
              phoneNumber: customerData.phoneNumber
            }
          }
        })

        if (existing) {
          results.failed++
          results.errors.push({
            phoneNumber: customerData.phoneNumber,
            error: 'Customer already exists'
          })
          continue
        }

        // Create customer
        const customer = await prisma.customer.create({
          data: {
            userId,
            phoneNumber: customerData.phoneNumber,
            name: customerData.name,
            consentStatus: customerData.consentStatus,
            consentSource: customerData.consentSource || 'CSV Import',
            consentCapturedAt: customerData.consentStatus ? new Date() : null
          }
        })

        // Create consent log if opted in
        if (customerData.consentStatus) {
          await prisma.consentLog.create({
            data: {
              customerId: customer.id,
              action: 'OPT_IN',
              source: customerData.consentSource || 'CSV Import',
              userId: c.user.id
            }
          })
        }

        results.success++
      } catch (err) {
        results.failed++
        results.errors.push({
          phoneNumber: customerData.phoneNumber,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    await auditLog('CUSTOMERS_IMPORTED', 'Customer', userId, {
      total: customers.length,
      success: results.success,
      failed: results.failed,
      importedBy: c.user.id
    }, c.user.id)

    return c.json({
      success: true,
      data: results,
      message: `Imported ${results.success} customers, ${results.failed} failed`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: { code: 'ValidationError', message: 'Invalid input', details: error.issues } }, 400)
    }
    console.error('Import customers error:', error)
    return c.json({ error: { code: 'InternalServerError', message: 'Failed to import customers' } }, 500)
  }
})

export default app
