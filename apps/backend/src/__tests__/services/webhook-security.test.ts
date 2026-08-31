import { describe, expect, it, vi } from 'vitest'

vi.mock('../../utils/database.js', () => ({
  prisma: {
    webhookEndpoint: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({
        id: 'endpoint-1',
        name: 'Internal',
        url: 'https://127.0.0.1/admin',
        events: ['message.received'],
        channels: ['all'],
        isActive: true,
        failureCount: 0,
        lastFailedAt: null,
        disabledAt: null,
        disableReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    },
  },
}))

vi.mock('../../utils/tokenEncryption.js', () => ({
  tokenEncryption: {
    encrypt: vi.fn().mockReturnValue({ ciphertext: 'x', iv: 'y', authTag: 'z' }),
  },
}))

vi.mock('../../utils/queue.js', () => ({
  webhookOutboundQueue: { add: vi.fn() },
}))

import { WebhookService } from '../../services/webhook-service.js'

describe('webhook destination security', () => {
  it('rejects loopback destinations', async () => {
    const service = new WebhookService()

    await expect(service.createEndpoint({
      userId: 'user-1',
      name: 'Internal',
      url: 'https://127.0.0.1/admin',
      events: ['message.received'],
      channels: ['all'],
    })).rejects.toThrow(/private|loopback|public/i)
  })
})
