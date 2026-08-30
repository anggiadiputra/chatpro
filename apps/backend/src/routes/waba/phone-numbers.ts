/**
 * WABA Phone Numbers Routes
 * Handles phone number listing and sync
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import { requireRole } from '../../middleware/auth.js'
import { prisma } from '../../utils/database.js'
import { auditLog } from '../../utils/auditLog.js'
import { wabaService } from '../../services/waba/index.js'
import { TokenEncryptionService } from '../../utils/tokenEncryption.js'
import { getUserByWabaId } from './helpers.js'
import { WABAError, parseMetaError } from '../../utils/wabaErrors.js'

const app = new Hono()

// GET / - Get phone numbers for a WABA
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

    const wabaId = c.req.param('wabaId')

    // Get user and check access
    const result = await getUserByWabaId(wabaId, c.user.id, c.user.role)

    if ('error' in result) {
      return c.json({ error: result.error }, result.status as any)
    }

    const { user } = result

    // Fetch phone numbers from database
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        userId: user.id
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return c.json({
      success: true,
      data: phoneNumbers.map(pn => ({
        id: pn.phoneNumberId,
        displayPhoneNumber: pn.displayPhoneNumber,
        verifiedName: pn.verifiedName,
        qualityRating: pn.qualityRating,
        messagingLimitTier: pn.messagingLimitTier,
        isVerified: pn.isVerified,
        isPrimary: pn.isPrimary,
        createdAt: pn.createdAt,
        updatedAt: pn.updatedAt
      }))
    })
  } catch (error) {
    console.error('Get phone numbers error:', error)
    return c.json({
      error: {
        code: 'InternalServerError',
        message: 'Failed to fetch phone numbers'
      }
    }, 500)
  }
})

// POST /sync - Sync phone numbers from Meta
app.post('/sync', requireRole(['ADMIN', 'BUSINESS_OWNER']), async (c: Context) => {
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

    // Get user and check access
    const result = await getUserByWabaId(wabaId, c.user.id, c.user.role)

    if ('error' in result) {
      return c.json({ error: result.error }, result.status as any)
    }

    const { user } = result

    // Check if WABA is connected
    if (user.wabaConnectionStatus !== 'connected') {
      return c.json({
        error: {
          code: 'BadRequest',
          message: 'WABA is not connected'
        }
      }, 400)
    }

    // Decrypt access token
    if (!user.wabaAccessToken || !user.wabaAccessTokenIV || !user.wabaAccessTokenTag) {
      return c.json({
        error: {
          code: 'BadRequest',
          message: 'No access token found. Please reconnect WABA.'
        }
      }, 400)
    }

    const tokenEncryption = new TokenEncryptionService()
    const accessToken = tokenEncryption.decrypt({
      ciphertext: user.wabaAccessToken,
      iv: user.wabaAccessTokenIV,
      authTag: user.wabaAccessTokenTag,
      algorithm: 'aes-256-gcm'
    })

    // Fetch phone numbers from Meta
    const wabaResources = await wabaService.discoverWABAResources(accessToken)

    // Get current phone numbers from database
    const currentPhoneNumbers = await prisma.phoneNumber.findMany({
      where: { userId: user.id }
    })

    const currentPhoneNumberIds = new Set(currentPhoneNumbers.map(pn => pn.phoneNumberId))
    const metaPhoneNumberIds = new Set(wabaResources.phoneNumbers.map(pn => pn.id))

    // Delete phone numbers that no longer exist in Meta
    const phoneNumbersToDelete = currentPhoneNumbers.filter(pn => !metaPhoneNumberIds.has(pn.phoneNumberId))
    if (phoneNumbersToDelete.length > 0) {
      await prisma.phoneNumber.deleteMany({
        where: {
          phoneNumberId: {
            in: phoneNumbersToDelete.map(pn => pn.phoneNumberId)
          }
        }
      })
    }

    // Upsert phone numbers from Meta
    const updatedPhoneNumbers = await Promise.all(
      wabaResources.phoneNumbers.map(async (pn, index) => {
        return prisma.phoneNumber.upsert({
          where: { phoneNumberId: pn.id },
          create: {
            phoneNumberId: pn.id,
            displayPhoneNumber: pn.displayPhoneNumber,
            verifiedName: pn.verifiedName,
            qualityRating: pn.qualityRating,
            messagingLimitTier: pn.messagingLimitTier,
            isVerified: pn.codeVerificationStatus === 'VERIFIED',
            isPrimary: index === 0,
            userId: user.id
          },
          update: {
            displayPhoneNumber: pn.displayPhoneNumber,
            verifiedName: pn.verifiedName,
            qualityRating: pn.qualityRating,
            messagingLimitTier: pn.messagingLimitTier,
            isVerified: pn.codeVerificationStatus === 'VERIFIED'
          }
        })
      })
    )

    // Update primary phone number in user if needed
    if (updatedPhoneNumbers.length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneNumberId: updatedPhoneNumbers[0].phoneNumberId,
          wabaLastSyncAt: new Date()
        }
      })
    }

    // Audit log
    await auditLog(
      'WABA_PHONE_NUMBERS_SYNCED',
      'User',
      user.id,
      {
        wabaId,
        added: updatedPhoneNumbers.length,
        deleted: phoneNumbersToDelete.length,
        syncedBy: c.user.id
      },
      c.user.id
    )

    return c.json({
      success: true,
      data: {
        phoneNumbers: updatedPhoneNumbers.map(pn => ({
          id: pn.phoneNumberId,
          displayPhoneNumber: pn.displayPhoneNumber,
          verifiedName: pn.verifiedName,
          qualityRating: pn.qualityRating,
          messagingLimitTier: pn.messagingLimitTier,
          isVerified: pn.isVerified,
          isPrimary: pn.isPrimary
        })),
        added: wabaResources.phoneNumbers.filter(pn => !currentPhoneNumberIds.has(pn.id)).length,
        deleted: phoneNumbersToDelete.length,
        message: 'Phone numbers synced successfully'
      }
    })
  } catch (error: any) {
    console.error('Sync phone numbers error:', error)

    if (error instanceof WABAError) {
      return c.json(error.toJSON(), error.statusCode as any)
    }

    return c.json({
      error: {
        code: 'InternalServerError',
        message: error.message || 'Failed to sync phone numbers'
      }
    }, 500)
  }
})

export default app
