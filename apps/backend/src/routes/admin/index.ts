import { Hono } from 'hono'
import statsRoutes from './stats.js'
import usersRoutes from './users.js'
import subscriptionsRoutes from './subscriptions.js'
import healthRoutes from './health.js'
import auditRoutes from './audit.js'
import settingsRoutes from './settings.js'
import revenueRoutes from './revenue.js'
import subscriptionPlansRoutes from './subscription-plans.js'

const app = new Hono()

// Mount admin sub-routes
app.route('/stats', statsRoutes)
app.route('/users', usersRoutes)
app.route('/subscriptions', subscriptionsRoutes)
app.route('/health', healthRoutes)
app.route('/audit', auditRoutes)
app.route('/settings', settingsRoutes)
app.route('/revenue', revenueRoutes)
app.route('/subscription-plans', subscriptionPlansRoutes)

// Health check for admin routes
app.get('/', (c) => {
  return c.json({
    message: 'Admin API',
    version: '1.0.0',
    endpoints: [
      '/stats',
      '/users',
      '/subscriptions',
      '/health',
      '/audit',
      '/settings',
      '/revenue',
      '/subscription-plans'
    ]
  })
})

export default app
