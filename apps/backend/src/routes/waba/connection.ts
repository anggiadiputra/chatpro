/**
 * WABA Connection Routes
 * Handles disconnect and connection status
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import { requireRole } from '../../middleware/auth.js'
import { prisma } from '../../utils/database.js'
import { auditLog } from '../../utils/auditLog.js'
import { TokenEncryptionService } from '../../utils/tokenEncryption.js'
import { getUserByWabaId } from './helpers.js'
import { disconnectService, type DisconnectMode, type WabaDeletedCounts } from '../../services/disconnect-service.js'

const app = new Hono()

// POST /disconnect - Disconnect a WABA
app.post('/disconnect', requireRole(['ADMIN', 'BUSINESS_OWNER']), async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({
        error: {
          code: 'Unauthorized',
          message: 'Authentication required'
        }
      }, 401)
    }

    const wabaId = c.req.param('wabaId')
    const body = await c.req.json().catch(() => ({}))
    const reason = body.reason || 'User requested disconnection'
    
    // Get mode parameter with validation (Req 6.1, 6.2)
    const mode: DisconnectMode = body.mode === 'hard' ? 'hard' : 'soft'
    
    // Validate mode parameter
    if (body.mode && body.mode !== 'soft' && body.mode !== 'hard') {
      return c.json({
        error: {
          code: 'INVALID_MODE',
          message: "Invalid disconnect mode. Must be 'soft' or 'hard'"
        }
      }, 400)
    }

    // Get user and check access
    const result = await getUserByWabaId(wabaId, c.user.id, c.user.role)

    if ('error' in result) {
      return c.json(result.error, result.status as any)
    }

    const { user } = result

    // Check if already disconnected (no token means truly disconnected)
    if (!user.wabaAccessToken && user.wabaConnectionStatus === 'disconnected') {
      return c.json({
        error: {
          code: 'ALREADY_DISCONNECTED',
          message: 'WABA is already disconnected'
        }
      }, 400)
    }

    // If status is disconnected but token exists, allow disconnect to clean up the token
    if (!user.wabaAccessToken && user.wabaConnectionStatus !== 'disconnected') {
      // Update status to disconnected if no token exists
      await prisma.user.update({
        where: { id: user.id },
        data: { wabaConnectionStatus: 'disconnected' }
      })

      return c.json({
        success: true,
        message: 'WABA status updated to disconnected (no token found)',
        mode
      })
    }

    // Revoke access token with Meta API (optional - token will expire anyway)
    try {
      if (user.wabaAccessToken && user.wabaAccessTokenIV && user.wabaAccessTokenTag) {
        const tokenEncryption = new TokenEncryptionService()
        const accessToken = tokenEncryption.decrypt({
          ciphertext: user.wabaAccessToken,
          iv: user.wabaAccessTokenIV,
          authTag: user.wabaAccessTokenTag,
          algorithm: 'aes-256-gcm'
        })
      }
    } catch (revokeError) {
      // Token revocation error - continue with disconnect anyway
    }

    // Call DisconnectService based on mode (Req 6.3)
    let disconnectResult
    if (mode === 'hard') {
      disconnectResult = await disconnectService.hardDisconnectWaba(user.id)
    } else {
      disconnectResult = await disconnectService.softDisconnectWaba(user.id)
    }

    const deletedCounts = disconnectResult.deletedCounts as WabaDeletedCounts

    // Create connection log with mode information (Req 7.1, 7.2, 7.3)
    await prisma.wABAConnectionLog.create({
      data: {
        userId: user.id,
        action: 'disconnected',
        details: {
          wabaId,
          reason,
          mode,
          disconnectedBy: c.user.id,
          disconnectedAt: new Date().toISOString(),
          deletedCounts: { ...deletedCounts }
        }
      }
    })

    // Audit log with mode information (Req 6.4)
    await auditLog(
      'WABA_DISCONNECTED',
      'User',
      user.id,
      {
        wabaId,
        reason,
        mode,
        userId: c.user.id,
        deletedCounts
      },
      c.user.id
    )

    return c.json({
      success: true,
      message: disconnectResult.message,
      mode,
      deletedCounts
    })
  } catch (error) {
    console.error('WABA disconnect error:', error)
    return c.json({
      error: {
        code: 'DISCONNECT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to disconnect WABA'
      }
    }, 500)
  }
})

export default app
