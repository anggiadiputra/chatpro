import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'
import { prisma } from '../../utils/database.js'
import { auditLog } from '../../utils/auditLog.js'
import { getWhatsAppClientAsync } from '../../utils/whatsapp.js'
import { canSendFreeMessage } from '../../utils/messageWindow.js'
import { LeadScoringService } from '../../services/lead-scoring.js'
import { ActivityService } from '../../services/activity-service.js'
import { webhookService } from '../../services/webhook-service.js'
import { getEffectiveUserId, getActingAgentId } from '../../middleware/resolveContext.js'
import { templateRendererService, type WhatsAppTemplate, type WhatsAppTemplateComponent } from '../../services/template-renderer-service.js'
import { templateVariableService } from '../../services/template-variable-service.js'
import { templateValidatorService } from '../../services/template-validator-service.js'

const app = new Hono()

/**
 * Helper function to convert DB template to WhatsAppTemplate format
 * The DB stores template data in separate fields, we need to reconstruct components
 */
function dbTemplateToWhatsAppTemplate(dbTemplate: {
  id: string;
  templateName: string;
  language: string;
  status: string;
  category: string;
  content: string;
  headerType?: string | null;
  headerContent?: string | null;
  footerContent?: string | null;
  buttons?: any;
  variables?: any;
}): WhatsAppTemplate {
  const components: WhatsAppTemplateComponent[] = []

  // Add header component if present
  if (dbTemplate.headerType && dbTemplate.headerContent) {
    components.push({
      type: 'HEADER',
      format: dbTemplate.headerType.toUpperCase() as 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT',
      text: dbTemplate.headerType.toUpperCase() === 'TEXT' ? dbTemplate.headerContent : undefined
    })
  }

  // Add body component (always present)
  components.push({
    type: 'BODY',
    text: dbTemplate.content
  })

  // Add footer component if present
  if (dbTemplate.footerContent) {
    components.push({
      type: 'FOOTER',
      text: dbTemplate.footerContent
    })
  }

  // Add buttons component if present
  if (dbTemplate.buttons && Array.isArray(dbTemplate.buttons) && dbTemplate.buttons.length > 0) {
    components.push({
      type: 'BUTTONS',
      buttons: dbTemplate.buttons
    })
  }

  return {
    id: dbTemplate.id,
    name: dbTemplate.templateName,
    language: dbTemplate.language,
    status: dbTemplate.status as 'APPROVED' | 'PENDING' | 'REJECTED',
    category: dbTemplate.category as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
    components
  }
}

const sendMessageSchema = z.object({
  userId: z.string().optional(), // Optional - will use effectiveUserId if not provided
  customerId: z.string().optional(),
  phoneNumber: z.string().optional(),
  type: z.enum(['text', 'template', 'image', 'document', 'interactive']),
  text: z.object({
    body: z.string(),
    preview_url: z.boolean().optional()
  }).optional(),
  template: z.object({
    name: z.string(),
    language: z.object({ code: z.string() }),
    components: z.array(z.any()).optional()
  }).optional(),
  // Template variable values for the new variable system (Requirement 4.4)
  variableValues: z.record(z.string(), z.string()).optional(),
  image: z.object({
    id: z.string().optional(),
    link: z.string().optional(),
    caption: z.string().optional()
  }).optional(),
  document: z.object({
    id: z.string().optional(),
    link: z.string().optional(),
    filename: z.string().optional(),
    caption: z.string().optional()
  }).optional(),
  interactive: z.object({
    type: z.enum(['cta_url', 'button', 'list']),
    header: z.any().optional(),
    body: z.object({ text: z.string() }).optional(),
    footer: z.object({ text: z.string() }).optional(),
    action: z.object({
      name: z.string().optional(),
      parameters: z.object({
        display_text: z.string(),
        url: z.string()
      }).optional(),
      buttons: z.array(z.object({
        type: z.literal('reply'),
        reply: z.object({
          id: z.string(),
          title: z.string()
        })
      })).max(3).optional()
    })
  }).optional()
})

// POST /api/v1/messages/send - Send message
app.post('/send', async (c: Context) => {
  try {
    const body = await c.req.json()

    const data = sendMessageSchema.parse(body)

    // Use effectiveUserId for agents to send on behalf of business owner
    // Requirements: 5.3, 6.2, 6.3
    const effectiveUserId = getEffectiveUserId(c)
    const actingAgentId = getActingAgentId(c)

    // Use effectiveUserId if userId not provided in request
    const targetUserId = data.userId || effectiveUserId

    // Check access - allow if admin or if userId matches effective user
    if (c.user?.role !== 'ADMIN' && effectiveUserId !== targetUserId) {
      return c.json({
        error: {
          code: 'Forbidden',
          message: 'Access denied'
        }
      }, 403)
    }

    // Get user (business owner)
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!user || !user.wabaId) {
      return c.json({
        error: {
          code: 'ConfigurationError',
          message: 'WhatsApp Business Account not connected'
        }
      }, 400)
    }

    // Check if WABA is connected (not disconnected)
    if (user.wabaConnectionStatus === 'disconnected') {
      return c.json({
        error: {
          code: 'ConnectionError',
          message: 'WhatsApp Business Account is disconnected. Please reconnect to send messages.',
          recoveryAction: 'Go to WABA page and click "Connect WhatsApp Business" to reconnect'
        }
      }, 403)
    }

    // Check if user has access token (additional safety check)
    if (!user.wabaAccessToken) {
      return c.json({
        error: {
          code: 'ConfigurationError',
          message: 'No active WhatsApp access token. Please reconnect your WhatsApp Business Account.',
          recoveryAction: 'Go to WABA page to reconnect'
        }
      }, 403)
    }

    if (!user.phoneNumberId) {
      return c.json({
        error: {
          code: 'ConfigurationError',
          message: 'No phone number configured'
        }
      }, 400)
    }

    const phoneNumberId = user.phoneNumberId

    // Get or create customer
    let customer
    if (data.customerId) {
      customer = await prisma.customer.findUnique({
        where: { id: data.customerId }
      })
    } else if (data.phoneNumber) {
      // RACE CONDITION FIX: Use upsert instead of check-then-create
      // This is atomic - prevents duplicate customer creation
      customer = await prisma.customer.upsert({
        where: {
          userId_phoneNumber: {
            userId: targetUserId,
            phoneNumber: data.phoneNumber
          }
        },
        update: {}, // If exists, don't update anything
        create: {
          userId: targetUserId,
          phoneNumber: data.phoneNumber,
          consentStatus: false
        }
      })
    }

    if (!customer) {
      return c.json({
        error: {
          code: 'CustomerRequired',
          message: 'Customer not found'
        }
      }, 400)
    }

    // Check 24-hour window for non-template messages
    if (data.type !== 'template') {
      const windowCheck = await canSendFreeMessage(customer.id)

      if (!windowCheck.allowed) {
        const windowStatus = windowCheck.windowStatus
        const hoursAgo = windowStatus?.windowExpiresAt
          ? Math.floor((Date.now() - new Date(windowStatus.windowExpiresAt).getTime()) / 1000 / 3600)
          : null

        return c.json({
          error: {
            code: 'WindowExpired',
            message: windowCheck.reason || '24-hour window expired. Use message template.',
            windowStatus: {
              expired: true,
              expiredAt: windowStatus?.windowExpiresAt,
              expiredHoursAgo: hoursAgo,
              lastInboundAt: windowStatus?.lastInboundMessageAt
            }
          }
        }, 403)
      }
    }

    // Check consent for marketing messages
    if (data.type === 'template' && !customer.consentStatus) {
      return c.json({
        error: {
          code: 'ConsentRequired',
          message: 'Customer has not consented'
        }
      }, 400)
    }

    // Variables for template message handling (Requirement 4.4)
    let dbTemplate: any = null
    let renderedContent: string | null = null
    let templatePayload: any = null

    // Load template from database for template messages
    if (data.type === 'template' && data.template) {
      dbTemplate = await prisma.messageTemplate.findFirst({
        where: {
          userId: targetUserId,
          templateName: data.template.name,
          language: data.template.language.code
        }
      })
    }

    // Handle template with variable values using mapping system (Requirement 4.4)
    if (data.type === 'template' && data.template && data.variableValues && Object.keys(data.variableValues).length > 0 && dbTemplate) {
      // Convert DB template to WhatsAppTemplate format
      const template = dbTemplateToWhatsAppTemplate(dbTemplate)

      // Get variable mappings
      const mappings = await templateVariableService.getMappings(targetUserId, data.template.name)

      // Translate numeric keys (from frontend manual input) to variableIds using mappings
      const processedVariableValues: Record<string, string> = { ...data.variableValues }
      const mappedVariableIds: string[] = []

      for (const [key, value] of Object.entries(data.variableValues)) {
        if (/^\d+$/.test(key)) {
          const paramIndex = parseInt(key) - 1
          // Try to find mapping for this parameter (prioritize body as it's most common)
          // Use case-insensitive comparison for componentType
          const mapping = mappings.find(m =>
            m.parameterIndex === paramIndex &&
            m.componentType.toLowerCase() === 'body'
          ) || mappings.find(m =>
            m.parameterIndex === paramIndex
          )

          if (mapping) {
            processedVariableValues[mapping.variableId] = value
            mappedVariableIds.push(mapping.variableId)
          }
        } else {
          mappedVariableIds.push(key)
        }
      }

      // Get variables for validation
      const variables = await prisma.templateVariable.findMany({
        where: {
          id: { in: mappedVariableIds },
          userId: targetUserId
        }
      })

      // Validate all variable values
      if (variables.length > 0) {
        const validationResult = templateValidatorService.validateAllVariables(
          processedVariableValues,
          variables
        )

        if (!validationResult.valid) {
          return c.json({
            error: {
              code: 'ValidationError',
              message: 'Variable validation failed',
              details: validationResult.errors
            }
          }, 400)
        }
      }

      // Build WhatsApp API payload with variables
      const builtPayload = templateRendererService.buildTemplatePayload(
        data.template.name,
        data.template.language.code,
        template,
        processedVariableValues,
        mappings
      )

      // Check if the built payload actually has valid parameters (not empty strings)
      // If it's empty or has only empty strings but frontend sent valid parameters, we prefer frontend's data
      const hasBuiltParams = builtPayload.components?.some(c =>
        c.parameters && c.parameters.some(p => p.text && p.text.trim() !== '')
      )
      const frontendHasParams = data.template?.components?.some((c: any) =>
        c.parameters && c.parameters.some((p: any) => p.text && p.text.trim() !== '')
      )

      // FIXED: If no mappings exist, don't use built payload - use frontend components directly
      if (mappings.length === 0) {
        // Keep templatePayload as null so frontend components are used
      } else if (hasBuiltParams) {
        templatePayload = builtPayload
      } else if (!frontendHasParams) {
        templatePayload = builtPayload
      }
      // else: keep templatePayload as null so it uses data.template (which has the frontend components)

      // Render template for storage
      const rendered = templateRendererService.renderTemplate(
        template,
        processedVariableValues,
        mappings
      )

      // Build content string for message record
      renderedContent = rendered.body
      if (rendered.header?.type === 'text') {
        renderedContent = `${rendered.header.content}\n\n${renderedContent}`
      }
      if (rendered.footer) {
        renderedContent = `${renderedContent}\n\n${rendered.footer}`
      }

      // Save variable history for suggestions
      if (customer) {
        const historyEntries = variables.map(v => ({
          templateName: data.template!.name,
          variableId: v.id,
          value: processedVariableValues[v.id] || '',
          customerId: customer.id
        })).filter(entry => entry.value !== '')

        if (historyEntries.length > 0) {
          await templateVariableService.saveVariableHistoryBatch(targetUserId, historyEntries).catch(err =>
            console.error('Failed to save variable history:', err)
          )

          // Increment usage count for variables
          for (const variable of variables) {
            templateVariableService.incrementUsageCount(variable.id).catch(err =>
              console.error(`Failed to increment usage count for variable ${variable.id}:`, err)
            )
          }
        }
      }
    }

    // Prepare payload for WhatsApp
    // If ID is present, we don't need to send link to WhatsApp (it might confuse the API)
    // We must deep clone or carefully clone the nested objects to avoid mutating 'data' which is used later
    const whatsappData = JSON.parse(JSON.stringify(data))

    // Check if template has variables but no components were sent
    // This catches the case where frontend didn't send variable values
    if (data.type === 'template' && dbTemplate?.content) {
      const templateVariables = dbTemplate.content.match(/\{\{(\d+)\}\}/g)
      const hasVariablesInTemplate = templateVariables && templateVariables.length > 0
      const hasComponentsSent = data.template?.components && data.template.components.length > 0

      // Check if body component has parameters (this is what frontend sends)
      const bodyComponent = data.template?.components?.find((c: any) => c.type === 'body')
      const hasBodyParameters = bodyComponent?.parameters && bodyComponent.parameters.length > 0

      // If template has variables but no components/payload were sent
      // Check if we should return an error or try to proceed
      if (hasVariablesInTemplate && !templatePayload && !hasBodyParameters && !hasComponentsSent) {
        // Extract variable numbers from template (e.g., {{1}}, {{2}})
        const varNumbers = templateVariables!.map((v: string) => parseInt(v.replace(/[{}]/g, '')))
        const uniqueVarNumbers = [...new Set(varNumbers)].sort((a: number, b: number) => a - b)

        // Return error with helpful message
        return c.json({
          error: {
            code: 'MissingVariables',
            message: `Template "${dbTemplate.templateName}" requires ${templateVariables.length} variable(s) but none were provided`,
            details: {
              requiredVariables: templateVariables.length,
              variableNumbers: uniqueVarNumbers,
              templateContent: dbTemplate.content,
              receivedComponents: data.template?.components,
              hint: 'Frontend must send template.components with body.parameters containing variable values'
            }
          }
        }, 400)
      }
    }

    // If we built a template payload with variables (from variableValues + mappings system), use it
    if (templatePayload) {
      whatsappData.template = templatePayload
    }
    // Otherwise, if frontend sent components directly (simple variable input), use as-is
    // This supports the "Fill Template Variables" dialog that sends components directly
    else if (data.type === 'template' && data.template?.components && data.template.components.length > 0) {
      // Frontend already built the correct WhatsApp API payload with components
      // Just ensure the template structure is correct
      whatsappData.template = {
        name: data.template.name,
        language: data.template.language,
        components: data.template.components
      }
    }

    // Build rendered content for message storage (for display in chat)
    // This must happen AFTER template payload is set, regardless of which path was taken
    if (data.type === 'template' && !renderedContent && dbTemplate?.content) {
      // Try to render content from template + components for storage
      const componentsToUse = whatsappData.template?.components || data.template?.components
      const bodyComponent = componentsToUse?.find((c: any) => c.type === 'body')
      
      if (bodyComponent?.parameters && bodyComponent.parameters.length > 0) {
        let content = dbTemplate.content
        bodyComponent.parameters.forEach((param: any, index: number) => {
          content = content.replace(`{{${index + 1}}}`, param.text || '')
        })
        renderedContent = content
      } else {
        // Fallback to original template content if no parameters
        renderedContent = dbTemplate.content
      }
    }

    if (whatsappData.type === 'image' && whatsappData.image?.id) {
      delete whatsappData.image.link
    } else if (whatsappData.type === 'document' && whatsappData.document?.id) {
      delete whatsappData.document.link
    } else if (whatsappData.type === 'interactive' && whatsappData.interactive) {
      // No specific cleanup needed for interactive yet
    }

    // Send via WhatsApp API
    const whatsapp = await getWhatsAppClientAsync()

    const result = await whatsapp.sendMessage({
      phoneNumberId: phoneNumberId,
      to: customer.phoneNumber,
      type: data.type as any,
      ...whatsappData
    })

    // Extract media URL or ID
    let mediaUrl = null
    if (data.type === 'image') {
      mediaUrl = data.image?.link || data.image?.id
    } else if (data.type === 'document') {
      mediaUrl = data.document?.link || data.document?.id
    } else if (data.type === 'interactive') {
      // Maybe store button link?
      if (data.interactive?.action?.parameters?.url) {
        mediaUrl = data.interactive.action.parameters.url;
      }
    }

    // Extract content
    let content: string | null = null
    if (data.text?.body) {
      content = data.text.body
    } else if (data.image?.caption) {
      content = data.image.caption
    } else if (data.document?.caption) {
      content = data.document.caption
    } else if (data.type === 'interactive') {
      const bodyText = data.interactive?.body?.text || 'Interactive Message';

      // Append button info for visibility in chat history
      let buttonsText = '';
      if (data.interactive?.type === 'cta_url') {
        const label = data.interactive.action?.parameters?.display_text;
        const url = data.interactive.action?.parameters?.url;
        if (label) buttonsText += `\n[${label}](${url})`;
      } else if (data.interactive?.type === 'button' && data.interactive.action?.buttons) {
        buttonsText = '\n' + data.interactive.action.buttons
          .map((b: any) => `[${b.reply.title}]`)
          .join(' ');
      }

      content = bodyText + buttonsText;
    } else if (data.type === 'template' && renderedContent) {
      // Use rendered content for template messages with variables (Requirement 4.4)
      content = renderedContent
    }

    // Save message with business owner's userId but track agent in metadata
    // Requirements: 6.3 - Record message with Business Owner's userId but track Agent as sender
    // Requirement 4.4 - Save rendered content to message record for template messages
    const message = await prisma.message.create({
      data: {
        userId: targetUserId,
        customerId: customer.id,
        messageType: data.type.toUpperCase() as any,
        direction: 'OUTBOUND',
        content,
        mediaUrl,
        wamId: result.messages?.[0]?.id,
        status: 'SENT',
        templateId: dbTemplate?.id || undefined
      }
    })

    await auditLog(
      data.type === 'template' ? 'TEMPLATE_MESSAGE_SENT' : 'MESSAGE_SENT',
      'Message',
      message.id,
      {
        to: customer.phoneNumber,
        type: data.type,
        sentBy: c.user?.id,
        actingAgentId: actingAgentId, // Track agent if message sent by agent
        templateName: data.template?.name,
        templateLanguage: data.template?.language?.code,
        hasVariables: data.variableValues ? Object.keys(data.variableValues).length > 0 : false
      },
      c.user?.id
    )

    // Trigger lead scoring update asynchronously
    LeadScoringService.updateCustomerScore(customer.id).catch(err =>
      console.error(`Failed to update lead score for customer ${customer.id}:`, err)
    )

    // Log message activity
    if (c.user?.id) {
      ActivityService.logMessageActivity(
        customer.id,
        c.user.id,
        'sent',
        message.id,
        content?.substring(0, 100)
      ).catch(err => console.error('Failed to log message activity:', err))
    }

    // Emit webhook event for message.sent (Requirement 3.1, 8.1, 8.2, 8.4)
    // Include template information for template messages (Requirement 4.4)
    webhookService.emitEvent(
      targetUserId,
      'message.sent',
      'whatsapp',
      {
        message_id: message.id,
        customer_id: customer.id,
        customer_phone: customer.phoneNumber,
        direction: 'outbound',
        message_type: data.type,
        content: content || undefined,
        media_url: mediaUrl || undefined,
      }
    ).catch(err => console.error('Failed to emit message.sent webhook:', err))

    return c.json({
      success: true,
      data: {
        message,
        whatsappResult: result
      }
    })
  } catch (error: any) {
    console.error('Send message error:', error.response?.data || error)
    
    const errorCode = error.response?.data?.error?.code;
    const errorMessage = error.response?.data?.error?.message || 'Failed to send message';
    
    // Map common WhatsApp API error codes to user-friendly messages
    let userFriendlyMessage = errorMessage;
    if (errorCode === 131042) {
      userFriendlyMessage = 'Payment method required. Please add a payment method in Meta Business Suite to send template messages.';
    } else if (errorCode === 131008) {
      userFriendlyMessage = 'Required parameter is missing. Please check template variables.';
    } else if (errorCode === 131026) {
      userFriendlyMessage = 'Message undeliverable. The recipient may have blocked you or the number is invalid.';
    } else if (errorCode === 131047) {
      userFriendlyMessage = 'Re-engagement message required. More than 24 hours have passed since the last customer message.';
    } else if (errorCode === 131051) {
      userFriendlyMessage = 'Unsupported message type.';
    } else if (errorCode === 131052) {
      userFriendlyMessage = 'Media download failed. Please check the media URL.';
    } else if (errorCode === 131053) {
      userFriendlyMessage = 'Media upload failed. Please try again.';
    } else if (errorCode === 130429) {
      userFriendlyMessage = 'Rate limit exceeded. Please slow down message sending.';
    } else if (errorCode === 131031) {
      userFriendlyMessage = 'Account has been locked. Please contact Meta support.';
    }
    
    return c.json({
      error: {
        code: errorCode || 'SendError',
        message: userFriendlyMessage,
        details: error.response?.data?.error?.error_data?.details
      }
    }, 500)
  }
})

export default app
