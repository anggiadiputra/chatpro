/**
 * WABA Routes - Main Router
 * Modular WABA routes for better maintainability
 */

import { Hono } from 'hono'
import signupRoutes from './signup.js'
import phoneNumberRoutes from './phone-numbers.js'
import connectionRoutes from './connection.js'
import tokenRoutes from './tokens.js'
import coexistenceRoutes from './coexistence.js'

const app = new Hono()

// Signup & OAuth routes
app.route('/signup', signupRoutes)

// WABA-specific routes (with :wabaId parameter)
// Phone numbers
app.route('/:wabaId/phone-numbers', phoneNumberRoutes)

// Coexistence operations
app.route('/:wabaId', coexistenceRoutes)

// Connection management
app.route('/:wabaId', connectionRoutes)

// Token management
app.route('/:wabaId', tokenRoutes)

export default app
