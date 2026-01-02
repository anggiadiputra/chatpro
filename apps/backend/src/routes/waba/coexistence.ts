/**
 * Coexistence API Endpoints
 * Manages WhatsApp Business App + Cloud API coexistence operations
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import { prisma } from '../../utils/database.js'
import { wabaService } from '../../services/waba/index.js'
import { TokenEncryptionService } from '../../utils/tokenEncryption.js'

const app = new Hono()
const tokenEncryption = new TokenEncryptionService()

// POST /:wabaId/sync-contacts - Trigger contact synchronization
app.post('/:wabaId/sync-contacts', async (c: Context) => {
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

    // Get user with WABA
    const user = await prisma.user.findFirst({
      where: {
        id: c.user.id,
        wabaId
      }
    })

    if (!user) {
      return c.json({
        error: {
          code: 'NotFound',
          message: 'WABA not found'
        }
      }, 404)
    }

    if (!user.isCoexistence) {
      return c.json({
        error: {
          code: 'InvalidOperation',
          message: 'Coexistence is not enabled for this WABA'
        }
      }, 400)
    }

    if (!user.phoneNumberId) {
      return c.json({
        error: {
          code: 'InvalidState',
          message: 'Phone number ID not found'
        }
      }, 400)
    }

    // Decrypt access token
    if (!user.wabaAccessToken || !user.wabaAccessTokenIV || !user.wabaAccessTokenTag) {
      return c.json({
        error: {
          code: 'InvalidState',
          message: 'Access token not found'
        }
      }, 400)
    }

    const accessToken = tokenEncryption.decrypt({
      ciphertext: user.wabaAccessToken,
      iv: user.wabaAccessTokenIV,
      authTag: user.wabaAccessTokenTag,
      algorithm: 'aes-256-gcm'
    })

    // Trigger contact sync
    const requestId = await wabaService.syncContacts(user.phoneNumberId, accessToken)

    // Create or update sync status
    await prisma.coexistenceSyncStatus.upsert({
      where: {
        userId_syncType: {
          userId: user.id,
          syncType: 'contacts'
        }
      },
      create: {
        userId: user.id,
        syncType: 'contacts',
        status: 'in_progress',
        requestId,
        progress: 0
      },
      update: {
        status: 'in_progress',
        requestId,
        progress: 0,
        errorMessage: null,
        errorCode: null
      }
    })

    return c.json({
      success: true,
      data: {
        requestId,
        message: 'Contact synchronization initiated'
      }
    })
  } catch (error) {
    console.error('Contact sync error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: error instanceof Error ? error.message : 'Failed to sync contacts'
      }
    }, 500)
  }
})

// POST /:wabaId/sync-history - Trigger message history synchronization
app.post('/:wabaId/sync-history', async (c: Context) => {
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

    // Get user with WABA
    const user = await prisma.user.findFirst({
      where: {
        id: c.user.id,
        wabaId
      }
    })

    if (!user) {
      return c.json({
        error: {
          code: 'NotFound',
          message: 'WABA not found'
        }
      }, 404)
    }

    if (!user.isCoexistence) {
      return c.json({
        error: {
          code: 'InvalidOperation',
          message: 'Coexistence is not enabled for this WABA'
        }
      }, 400)
    }

    if (!user.phoneNumberId) {
      return c.json({
        error: {
          code: 'InvalidState',
          message: 'Phone number ID not found'
        }
      }, 400)
    }

    // Decrypt access token
    if (!user.wabaAccessToken || !user.wabaAccessTokenIV || !user.wabaAccessTokenTag) {
      return c.json({
        error: {
          code: 'InvalidState',
          message: 'Access token not found'
        }
      }, 400)
    }

    const accessToken = tokenEncryption.decrypt({
      ciphertext: user.wabaAccessToken,
      iv: user.wabaAccessTokenIV,
      authTag: user.wabaAccessTokenTag,
      algorithm: 'aes-256-gcm'
    })

    // Trigger history sync
    const requestId = await wabaService.syncHistory(user.phoneNumberId, accessToken)

    // Create or update sync status
    await prisma.coexistenceSyncStatus.upsert({
      where: {
        userId_syncType: {
          userId: user.id,
          syncType: 'history'
        }
      },
      create: {
        userId: user.id,
        syncType: 'history',
        status: 'in_progress',
        requestId,
        progress: 0
      },
      update: {
        status: 'in_progress',
        requestId,
        progress: 0,
        phase: 0,
        errorMessage: null,
        errorCode: null
      }
    })

    return c.json({
      success: true,
      data: {
        requestId,
        message: 'Message history synchronization initiated'
      }
    })
  } catch (error) {
    console.error('History sync error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: error instanceof Error ? error.message : 'Failed to sync history'
      }
    }, 500)
  }
})

// GET /:wabaId/sync-status - Get synchronization status
app.get('/:wabaId/sync-status', async (c: Context) => {
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

    // Get user with WABA
    const user = await prisma.user.findFirst({
      where: {
        id: c.user.id,
        wabaId
      }
    })

    if (!user) {
      return c.json({
        error: {
          code: 'NotFound',
          message: 'WABA not found'
        }
      }, 404)
    }

    // Get sync status
    const syncStatus = await wabaService.getSyncStatus(user.id)

    return c.json({
      success: true,
      data: {
        isCoexistence: user.isCoexistence,
        syncStatus: user.coexistenceSyncStatus,
        overallProgress: syncStatus.overallProgress,
        contacts: syncStatus.contacts,
        history: syncStatus.history
      }
    })
  } catch (error) {
    console.error('Get sync status error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: error instanceof Error ? error.message : 'Failed to get sync status'
      }
    }, 500)
  }
})

// GET /:wabaId/coexistence-status - Check if WABA is using coexistence
app.get('/:wabaId/coexistence-status', async (c: Context) => {
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

    // Get user with WABA
    const user = await prisma.user.findFirst({
      where: {
        id: c.user.id,
        wabaId
      }
    })

    if (!user) {
      return c.json({
        error: {
          code: 'NotFound',
          message: 'WABA not found'
        }
      }, 404)
    }

    if (!user.phoneNumberId) {
      return c.json({
        error: {
          code: 'InvalidState',
          message: 'Phone number ID not found'
        }
      }, 400)
    }

    // Decrypt access token
    if (!user.wabaAccessToken || !user.wabaAccessTokenIV || !user.wabaAccessTokenTag) {
      return c.json({
        error: {
          code: 'InvalidState',
          message: 'Access token not found'
        }
      }, 400)
    }

    const accessToken = tokenEncryption.decrypt({
      ciphertext: user.wabaAccessToken,
      iv: user.wabaAccessTokenIV,
      authTag: user.wabaAccessTokenTag,
      algorithm: 'aes-256-gcm'
    })

    // Check coexistence status from Meta API
    const coexStatus = await wabaService.checkCoexistenceStatus(
      user.phoneNumberId,
      accessToken
    )

    // Update database if status changed
    if (coexStatus.isOnBizApp !== user.isCoexistence) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isCoexistence: coexStatus.isOnBizApp
        }
      })
    }

    return c.json({
      success: true,
      data: {
        isOnBizApp: coexStatus.isOnBizApp,
        platformType: coexStatus.platformType,
        isCoexistence: coexStatus.isOnBizApp && coexStatus.platformType === 'CLOUD_API'
      }
    })
  } catch (error) {
    console.error('Get coexistence status error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: error instanceof Error ? error.message : 'Failed to get coexistence status'
      }
    }, 500)
  }
})

export default app
