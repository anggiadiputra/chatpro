import { describe, it, expect } from 'vitest'
import { queryKeys } from '@/lib/query-keys'

/**
 * Property 3: Cache Key Uniqueness with Parameters
 * Validates: Requirements 3.4, 4.3, 4.4, 6.2
 *
 * For any two queries with different parameters (page number, search term, date range, etc.),
 * the system SHALL generate unique cache keys, ensuring each parameter combination has its own cached data.
 */
describe('queryKeys', () => {
  describe('dashboard keys', () => {
    it('should generate correct base key', () => {
      expect(queryKeys.dashboard.all).toEqual(['dashboard'])
    })

    it('should generate correct stats key', () => {
      expect(queryKeys.dashboard.stats()).toEqual(['dashboard', 'stats'])
    })

    it('should generate unique keys for different message volume days', () => {
      const key7Days = queryKeys.dashboard.messageVolume(7)
      const key30Days = queryKeys.dashboard.messageVolume(30)

      expect(key7Days).toEqual(['dashboard', 'message-volume', { days: 7 }])
      expect(key30Days).toEqual(['dashboard', 'message-volume', { days: 30 }])
      expect(key7Days).not.toEqual(key30Days)
    })

    it('should generate correct customer insights key', () => {
      expect(queryKeys.dashboard.customerInsights()).toEqual([
        'dashboard',
        'customer-insights',
      ])
    })

    it('should generate correct quality metrics key', () => {
      expect(queryKeys.dashboard.qualityMetrics()).toEqual([
        'dashboard',
        'quality-metrics',
      ])
    })
  })

  describe('templates keys', () => {
    it('should generate correct base key', () => {
      expect(queryKeys.templates.all).toEqual(['templates'])
    })

    it('should generate unique keys for different page numbers', () => {
      const page1 = queryKeys.templates.list({ page: 1 })
      const page2 = queryKeys.templates.list({ page: 2 })

      expect(page1).not.toEqual(page2)
      expect(page1).toEqual(['templates', 'list', { page: 1 }])
      expect(page2).toEqual(['templates', 'list', { page: 2 }])
    })

    it('should generate unique keys for different search terms', () => {
      const searchA = queryKeys.templates.list({ search: 'welcome' })
      const searchB = queryKeys.templates.list({ search: 'promo' })

      expect(searchA).not.toEqual(searchB)
    })

    it('should generate unique keys for combined filters', () => {
      const filter1 = queryKeys.templates.list({ page: 1, search: 'test' })
      const filter2 = queryKeys.templates.list({ page: 1, search: 'other' })
      const filter3 = queryKeys.templates.list({ page: 2, search: 'test' })

      expect(filter1).not.toEqual(filter2)
      expect(filter1).not.toEqual(filter3)
      expect(filter2).not.toEqual(filter3)
    })

    it('should generate unique keys for different template details', () => {
      const detail1 = queryKeys.templates.detail('template-1')
      const detail2 = queryKeys.templates.detail('template-2')

      expect(detail1).toEqual(['templates', 'detail', 'template-1'])
      expect(detail2).toEqual(['templates', 'detail', 'template-2'])
      expect(detail1).not.toEqual(detail2)
    })
  })

  describe('customers keys', () => {
    it('should generate correct base key', () => {
      expect(queryKeys.customers.all).toEqual(['customers'])
    })

    it('should generate unique keys for different page numbers', () => {
      const page1 = queryKeys.customers.list({ page: 1 })
      const page2 = queryKeys.customers.list({ page: 2 })

      expect(page1).not.toEqual(page2)
    })

    it('should generate unique keys for different search terms', () => {
      const searchA = queryKeys.customers.list({ search: 'john' })
      const searchB = queryKeys.customers.list({ search: 'jane' })

      expect(searchA).not.toEqual(searchB)
    })

    it('should generate unique keys for different pipelines', () => {
      const pipeline1 = queryKeys.customers.list({ pipeline: 'lead' })
      const pipeline2 = queryKeys.customers.list({ pipeline: 'customer' })

      expect(pipeline1).not.toEqual(pipeline2)
    })

    it('should generate unique keys for different customer details', () => {
      const detail1 = queryKeys.customers.detail('customer-1')
      const detail2 = queryKeys.customers.detail('customer-2')

      expect(detail1).not.toEqual(detail2)
    })
  })

  describe('subscription keys', () => {
    it('should generate correct base key', () => {
      expect(queryKeys.subscription.all).toEqual(['subscription'])
    })

    it('should generate correct status key', () => {
      expect(queryKeys.subscription.status()).toEqual([
        'subscription',
        'status',
      ])
    })

    it('should generate correct pricing key', () => {
      expect(queryKeys.subscription.pricing()).toEqual([
        'subscription',
        'pricing',
      ])
    })
  })

  describe('insights keys', () => {
    it('should generate correct base key', () => {
      expect(queryKeys.insights.all).toEqual(['insights'])
    })

    it('should generate unique keys for different date ranges', () => {
      const range1 = queryKeys.insights.byDateRange('2024-01-01', '2024-01-31')
      const range2 = queryKeys.insights.byDateRange('2024-02-01', '2024-02-28')

      expect(range1).toEqual([
        'insights',
        { startDate: '2024-01-01', endDate: '2024-01-31' },
      ])
      expect(range2).toEqual([
        'insights',
        { startDate: '2024-02-01', endDate: '2024-02-28' },
      ])
      expect(range1).not.toEqual(range2)
    })

    it('should generate unique keys for same start but different end dates', () => {
      const range1 = queryKeys.insights.byDateRange('2024-01-01', '2024-01-15')
      const range2 = queryKeys.insights.byDateRange('2024-01-01', '2024-01-31')

      expect(range1).not.toEqual(range2)
    })
  })

  describe('team keys', () => {
    it('should generate correct base key', () => {
      expect(queryKeys.team.all).toEqual(['team'])
    })

    it('should generate correct members key', () => {
      expect(queryKeys.team.members()).toEqual(['team', 'members'])
    })

    it('should generate correct invitations key', () => {
      expect(queryKeys.team.invitations()).toEqual(['team', 'invitations'])
    })
  })

  describe('messages keys', () => {
    it('should generate correct base key', () => {
      expect(queryKeys.messages.all).toEqual(['messages'])
    })

    it('should generate unique keys for different wabaIds', () => {
      const list1 = queryKeys.messages.list({ wabaId: 'waba-1' })
      const list2 = queryKeys.messages.list({ wabaId: 'waba-2' })

      expect(list1).not.toEqual(list2)
    })

    it('should generate unique keys for different conversations', () => {
      const conv1 = queryKeys.messages.conversation('customer-1')
      const conv2 = queryKeys.messages.conversation('customer-2')

      expect(conv1).toEqual(['messages', 'conversation', 'customer-1'])
      expect(conv2).toEqual(['messages', 'conversation', 'customer-2'])
      expect(conv1).not.toEqual(conv2)
    })
  })

  describe('key hierarchy for invalidation', () => {
    it('should allow invalidating all dashboard queries via base key', () => {
      const baseKey = queryKeys.dashboard.all
      const statsKey = queryKeys.dashboard.stats()
      const volumeKey = queryKeys.dashboard.messageVolume(7)

      // All keys should start with the base key
      expect(statsKey.slice(0, baseKey.length)).toEqual(baseKey)
      expect(volumeKey.slice(0, baseKey.length)).toEqual(baseKey)
    })

    it('should allow invalidating all template lists via lists key', () => {
      const listsKey = queryKeys.templates.lists()
      const list1 = queryKeys.templates.list({ page: 1 })
      const list2 = queryKeys.templates.list({ page: 2, search: 'test' })

      // All list keys should start with the lists key
      expect(list1.slice(0, listsKey.length)).toEqual(listsKey)
      expect(list2.slice(0, listsKey.length)).toEqual(listsKey)
    })

    it('should allow invalidating all customer details via details key', () => {
      const detailsKey = queryKeys.customers.details()
      const detail1 = queryKeys.customers.detail('customer-1')
      const detail2 = queryKeys.customers.detail('customer-2')

      // All detail keys should start with the details key
      expect(detail1.slice(0, detailsKey.length)).toEqual(detailsKey)
      expect(detail2.slice(0, detailsKey.length)).toEqual(detailsKey)
    })
  })
})
