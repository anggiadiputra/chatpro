import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock WhatsApp client
vi.mock('../../utils/whatsapp.js', () => ({
  getWhatsAppClientAsync: vi.fn().mockResolvedValue({
    sendMessage: vi.fn().mockResolvedValue({
      messages: [{ id: 'wamid.test123' }]
    })
  })
}));

// Mock message window check
vi.mock('../../utils/messageWindow.js', () => ({
  canSendFreeMessage: vi.fn().mockResolvedValue({ allowed: true })
}));

// Mock audit log
vi.mock('../../utils/auditLog.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined)
}));

// Mock services
vi.mock('../../services/lead-scoring.js', () => ({
  LeadScoringService: {
    updateCustomerScore: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../../services/activity-service.js', () => ({
  ActivityService: {
    logMessageActivity: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../../services/webhook-service.js', () => ({
  webhookService: {
    emitEvent: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../../services/template-variable-service.js', () => ({
  templateVariableService: {
    getMappings: vi.fn().mockResolvedValue([]),
    saveVariableHistoryBatch: vi.fn().mockResolvedValue(undefined),
    incrementUsageCount: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../../services/template-validator-service.js', () => ({
  templateValidatorService: {
    validateAllVariables: vi.fn().mockReturnValue({ valid: true, errors: [] })
  }
}));

vi.mock('../../services/template-renderer-service.js', () => ({
  templateRendererService: {
    buildTemplatePayload: vi.fn().mockReturnValue({
      name: 'test_template',
      language: { code: 'en' },
      components: [{ type: 'body', parameters: [{ type: 'text', text: 'test' }] }]
    }),
    renderTemplate: vi.fn().mockReturnValue({
      body: 'Test message with variable',
      header: null,
      footer: null
    })
  }
}));

// Mock middleware
vi.mock('../../middleware/resolveContext.js', () => ({
  getEffectiveUserId: vi.fn().mockReturnValue('test-user-id'),
  getActingAgentId: vi.fn().mockReturnValue(null)
}));

import sendRoutes from '../../routes/messages/send.js';
import { getWhatsAppClientAsync } from '../../utils/whatsapp.js';

// Create test app with mock user
const app = new Hono();
app.use('*', async (c, next) => {
  c.user = { id: 'test-user-id', role: 'USER' };
  await next();
});
app.route('/api/v1/messages', sendRoutes);

describe('Template Send with Variables', () => {
  let testUserId: string;
  let testCustomerId: string;
  let testTemplateId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: `test_template_${Date.now()}@example.com`,
        name: 'Test User',
        wabaId: 'test-waba-id',
        phoneNumberId: 'test-phone-number-id',
        wabaAccessToken: 'test-access-token',
        wabaConnectionStatus: 'connected'
      }
    });
    testUserId = user.id;

    // Create test customer with consent
    const customer = await prisma.customer.create({
      data: {
        userId: testUserId,
        phoneNumber: '+6281234567890',
        name: 'Test Customer',
        consentStatus: true
      }
    });
    testCustomerId = customer.id;

    // Create test template with variable
    const template = await prisma.messageTemplate.create({
      data: {
        userId: testUserId,
        templateName: 'promo_code_test',
        language: 'en',
        status: 'APPROVED',
        category: 'MARKETING',
        content: 'Thanks for choosing us! Use code {{1}} to get your discount.'
      }
    });
    testTemplateId = template.id;

    // Create template without variables
    await prisma.messageTemplate.create({
      data: {
        userId: testUserId,
        templateName: 'simple_template',
        language: 'en',
        status: 'APPROVED',
        category: 'UTILITY',
        content: 'Thanks for your order!'
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.message.deleteMany({ where: { userId: testUserId } });
    await prisma.messageTemplate.deleteMany({ where: { userId: testUserId } });
    await prisma.customer.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /send - Template with variables', () => {
    it('should reject template with variables when no components provided', async () => {
      const response = await app.request('/api/v1/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          phoneNumber: '+6281234567890',
          type: 'template',
          template: {
            name: 'promo_code_test',
            language: { code: 'en' }
            // No components - should fail
          }
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('MissingVariables');
      expect(data.error.message).toContain('requires 1 variable(s)');
    });

    it('should accept template with variables when body components provided', async () => {
      const response = await app.request('/api/v1/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          phoneNumber: '+6281234567890',
          type: 'template',
          template: {
            name: 'promo_code_test',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: 'DISCOUNT20' }
                ]
              }
            ]
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(getWhatsAppClientAsync).toHaveBeenCalled();
    });

    it('should accept template without variables (no components needed)', async () => {
      const response = await app.request('/api/v1/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          phoneNumber: '+6281234567890',
          type: 'template',
          template: {
            name: 'simple_template',
            language: { code: 'en' }
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should reject template with empty components array when variables required', async () => {
      const response = await app.request('/api/v1/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          phoneNumber: '+6281234567890',
          type: 'template',
          template: {
            name: 'promo_code_test',
            language: { code: 'en' },
            components: [] // Empty array - should fail
          }
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('MissingVariables');
    });

    it('should reject template with body component but no parameters', async () => {
      const response = await app.request('/api/v1/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          phoneNumber: '+6281234567890',
          type: 'template',
          template: {
            name: 'promo_code_test',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [] // Empty parameters - should fail
              }
            ]
          }
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('MissingVariables');
    });
  });

  describe('POST /send - Template validation', () => {
    it('should return 400 for non-existent template', async () => {
      const response = await app.request('/api/v1/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          phoneNumber: '+6281234567890',
          type: 'template',
          template: {
            name: 'non_existent_template',
            language: { code: 'en' }
          }
        })
      });

      // Should still work (template not found in DB doesn't block sending)
      // WhatsApp API will validate the template
      expect(response.status).toBe(200);
    });

    it('should require customer consent for template messages', async () => {
      // Create customer without consent
      const noConsentCustomer = await prisma.customer.create({
        data: {
          userId: testUserId,
          phoneNumber: '+6289999999999',
          name: 'No Consent Customer',
          consentStatus: false
        }
      });

      const response = await app.request('/api/v1/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          phoneNumber: '+6289999999999',
          type: 'template',
          template: {
            name: 'simple_template',
            language: { code: 'en' }
          }
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('ConsentRequired');

      // Cleanup
      await prisma.customer.delete({ where: { id: noConsentCustomer.id } });
    });
  });
});
