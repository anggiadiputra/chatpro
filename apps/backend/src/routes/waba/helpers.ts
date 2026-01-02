/**
 * WABA Route Helpers
 * Shared utilities for WABA routes
 */

import type { Context } from 'hono'
import { prisma } from '../../utils/database.js'

/**
 * Get user by WABA ID with access check
 */
export async function getUserByWabaId(wabaId: string, currentUserId: string, currentUserRole: string) {
  const user = await prisma.user.findFirst({
    where: { wabaId },
    include: {
      phoneNumbers: true
    }
  })

  if (!user) {
    return {
      error: {
        code: 'NotFound',
        message: 'WABA not found'
      },
      status: 404
    }
  }

  // Check access - user can only access their own WABA (unless ADMIN)
  if (currentUserRole !== 'ADMIN' && user.id !== currentUserId) {
    return {
      error: {
        code: 'Forbidden',
        message: 'Access denied to this WABA',
        details: {
          reason: 'You do not have access to this WABA',
          yourUserId: currentUserId,
          wabaUserId: user.id
        }
      },
      status: 403
    }
  }

  return { user }
}

/**
 * Check if user has WABA connected
 */
export function requireWABA(c: Context) {
  if (!c.user) {
    return c.json({
      error: {
        code: 'Unauthorized',
        message: 'Authentication required'
      }
    }, 401)
  }

  return null
}
