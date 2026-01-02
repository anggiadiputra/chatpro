import { Hono } from 'hono'
import type { Context } from 'hono'
import { prisma } from '../../utils/database.js'
import { getWhatsAppClientAsync } from '../../utils/whatsapp.js'
import { templateCacheService } from '../../services/template-cache-service.js'
import { resolveContext, getEffectiveUserId } from '../../middleware/resolveContext.js'

const app = new Hono()

// Apply context resolution middleware
// This ensures agents can sync templates for their business owner
// Requirements: 6.1, 6.2
app.use('*', resolveContext)

// POST /api/v1/templates/sync - Sync templates from Meta
app.post('/sync', async (c: Context) => {
  try {
    const userId = getEffectiveUserId(c)
    
    if (!userId) {
      return c.json({
        error: {
          code: 'Unauthorized',
          message: 'Authentication required'
        }
      }, 401)
    }

    // Get user (business owner) with WABA
    // For agents, this gets their business owner's data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.wabaId) {
      return c.json({
        error: {
          code: 'BadRequest',
          message: 'WhatsApp Business Account not connected'
        }
      }, 400)
    }

    // Get all templates from Meta
    const whatsapp = await getWhatsAppClientAsync()
    const wabaId = user.wabaId

    console.log(`🔄 Syncing templates from Meta for WABA ${wabaId}, userId: ${userId}`)

    // Use the public axios instance from the WhatsApp client
    const metaTemplates = await whatsapp['client'].get(`/${wabaId}/message_templates`, {
      params: {
        limit: 100,
        fields: 'id,name,status,category,language,components,rejected_reason'
      }
    })

    let created = 0
    let deleted = 0
    let synced = 0

    const metaTemplateList = metaTemplates.data.data || []
    
    // Log templates from Meta for debugging
    console.log(`📋 Found ${metaTemplateList.length} templates from Meta:`)
    metaTemplateList.forEach((t: any) => {
      console.log(`   - ${t.name} (${t.language}) - ${t.status}`)
    })
    
    // Build a set of template keys from Meta (name + language)
    const metaTemplateKeys = new Set(
      metaTemplateList.map((t: any) => `${t.name}:${t.language}`)
    )
    
    console.log(`🔑 Meta template keys:`, Array.from(metaTemplateKeys))

    // FORCE DELETE all existing templates for this user first
    // This ensures database is always in sync with Meta
    const deleteResult = await prisma.messageTemplate.deleteMany({
      where: { userId }
    })
    deleted = deleteResult.count
    console.log(`🗑️ Deleted ${deleted} existing templates for user ${userId}`)

    // Create all templates from Meta
    for (const metaTemplate of metaTemplateList) {
      // Extract template content from components
      let content = ''
      let headerType = null
      let headerContent = null
      let footerContent = null
      let buttons = null

      if (metaTemplate.components) {
        const bodyComponent = metaTemplate.components.find((c: any) => c.type === 'BODY')
        const headerComponent = metaTemplate.components.find((c: any) => c.type === 'HEADER')
        const footerComponent = metaTemplate.components.find((c: any) => c.type === 'FOOTER')
        const buttonsComponent = metaTemplate.components.find((c: any) => c.type === 'BUTTONS')

        if (bodyComponent) {
          content = bodyComponent.text || ''
        }
        if (headerComponent) {
          headerType = headerComponent.format || null
          headerContent = headerComponent.text || null
        }
        if (footerComponent) {
          footerContent = footerComponent.text || null
        }
        if (buttonsComponent) {
          buttons = buttonsComponent.buttons || null
        }
      }

      // Create template from Meta
      await prisma.messageTemplate.create({
        data: {
          userId,
          templateName: metaTemplate.name,
          category: metaTemplate.category || 'UTILITY',
          language: metaTemplate.language,
          content: content,
          headerType: headerType,
          headerContent: headerContent,
          footerContent: footerContent,
          buttons: buttons,
          status: metaTemplate.status,
          metaTemplateId: metaTemplate.id,
          approvedAt: metaTemplate.status === 'APPROVED' ? new Date() : null,
          rejectionReason: metaTemplate.status === 'REJECTED' ? metaTemplate.rejected_reason : null
        }
      })
      created++

      synced++
    }

    console.log(`✅ Synced ${synced} templates: ${created} created, ${deleted} old deleted`)

    // Invalidate template list cache after sync
    await templateCacheService.invalidateTemplateList(userId)

    return c.json({
      success: true,
      data: {
        synced,
        created,
        deleted,
        message: `Synced ${synced} templates from Meta (${deleted} old removed, ${created} created)`
      }
    })
  } catch (error: any) {
    console.error('Sync templates error:', error)
    return c.json({
      error: {
        code: 'SyncError',
        message: error.message || 'Failed to sync templates'
      }
    }, 500)
  }
})

export default app
