import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import {
  invalidateOnMessageSent,
  invalidateOnTemplateChange,
  invalidateOnCustomerChange,
  invalidateOnPaymentComplete,
  clearAllCacheOnLogout,
} from '@/lib/cache-utils'
import { queryKeys } from '@/lib/query-keys'

/**
 * Property 6: Cache Cleanup on Logout
 * Validates: Requirements 10.3
 *
 * For any logout action, the system SHALL clear all cached data from the query client,
 * ensuring no data leakage between user sessions.
 */
describe('cache-utils', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity, // Keep cache for testing
        },
      },
    })
  })

  describe('clearAllCacheOnLogout', () => {
    it('should clear all cached data after logout', () => {
      // Populate cache with various data types
      queryClient.setQueryData(queryKeys.dashboard.stats(), { totalMessages: 100 })
      queryClient.setQueryData(queryKeys.templates.list({ page: 1 }), [{ id: '1', name: 'Template 1' }])
      queryClient.setQueryData(queryKeys.customers.list({ page: 1 }), [{ id: '1', name: 'Customer 1' }])
      queryClient.setQueryData(queryKeys.subscription.status(), { plan: 'PRO' })
      queryClient.setQueryData(queryKeys.insights.byDateRange('2024-01-01', '2024-01-31'), { views: 500 })
      queryClient.setQueryData(queryKeys.team.members(), [{ id: '1', name: 'Member 1' }])
      queryClient.setQueryData(queryKeys.messages.list({ wabaId: 'waba-1' }), [{ id: '1', text: 'Hello' }])

      // Verify cache is populated
      expect(queryClient.getQueryData(queryKeys.dashboard.stats())).toBeDefined()
      expect(queryClient.getQueryData(queryKeys.templates.list({ page: 1 }))).toBeDefined()
      expect(queryClient.getQueryData(queryKeys.customers.list({ page: 1 }))).toBeDefined()
      expect(queryClient.getQueryData(queryKeys.subscription.status())).toBeDefined()
      expect(queryClient.getQueryData(queryKeys.insights.byDateRange('2024-01-01', '2024-01-31'))).toBeDefined()
      expect(queryClient.getQueryData(queryKeys.team.members())).toBeDefined()
      expect(queryClient.getQueryData(queryKeys.messages.list({ wabaId: 'waba-1' }))).toBeDefined()

      // Clear cache on logout
      clearAllCacheOnLogout(queryClient)

      // Verify all cache is cleared
      expect(queryClient.getQueryData(queryKeys.dashboard.stats())).toBeUndefined()
      expect(queryClient.getQueryData(queryKeys.templates.list({ page: 1 }))).toBeUndefined()
      expect(queryClient.getQueryData(queryKeys.customers.list({ page: 1 }))).toBeUndefined()
      expect(queryClient.getQueryData(queryKeys.subscription.status())).toBeUndefined()
      expect(queryClient.getQueryData(queryKeys.insights.byDateRange('2024-01-01', '2024-01-31'))).toBeUndefined()
      expect(queryClient.getQueryData(queryKeys.team.members())).toBeUndefined()
      expect(queryClient.getQueryData(queryKeys.messages.list({ wabaId: 'waba-1' }))).toBeUndefined()
    })

    it('should result in empty query cache after logout', () => {
      // Populate cache with multiple entries
      queryClient.setQueryData(queryKeys.dashboard.stats(), { data: 'stats' })
      queryClient.setQueryData(queryKeys.dashboard.messageVolume(7), { data: 'volume' })
      queryClient.setQueryData(queryKeys.templates.list({ page: 1 }), { data: 'templates1' })
      queryClient.setQueryData(queryKeys.templates.list({ page: 2 }), { data: 'templates2' })
      queryClient.setQueryData(queryKeys.customers.detail('customer-1'), { data: 'customer1' })

      // Verify cache has entries
      const cacheBeforeLogout = queryClient.getQueryCache().getAll()
      expect(cacheBeforeLogout.length).toBeGreaterThan(0)

      // Clear cache on logout
      clearAllCacheOnLogout(queryClient)

      // Verify no data remains in query client
      const cacheAfterLogout = queryClient.getQueryCache().getAll()
      expect(cacheAfterLogout.length).toBe(0)
    })

    it('should handle empty cache gracefully', () => {
      // Verify cache is empty
      expect(queryClient.getQueryCache().getAll().length).toBe(0)

      // Should not throw when clearing empty cache
      expect(() => clearAllCacheOnLogout(queryClient)).not.toThrow()

      // Cache should still be empty
      expect(queryClient.getQueryCache().getAll().length).toBe(0)
    })
  })

  describe('invalidateOnMessageSent', () => {
    it('should invalidate dashboard and messages caches', () => {
      // Set up cache data
      queryClient.setQueryData(queryKeys.dashboard.stats(), { totalMessages: 100 })
      queryClient.setQueryData(queryKeys.dashboard.messageVolume(7), { data: [] })
      queryClient.setQueryData(queryKeys.messages.list({ wabaId: 'waba-1' }), [])

      // Invalidate on message sent
      invalidateOnMessageSent(queryClient)

      // Check that queries are marked as stale (invalidated)
      const dashboardStatsQuery = queryClient.getQueryCache().find({ queryKey: queryKeys.dashboard.stats() })
      const messagesQuery = queryClient.getQueryCache().find({ queryKey: queryKeys.messages.list({ wabaId: 'waba-1' }) })

      expect(dashboardStatsQuery?.state.isInvalidated).toBe(true)
      expect(messagesQuery?.state.isInvalidated).toBe(true)
    })
  })

  describe('invalidateOnTemplateChange', () => {
    it('should invalidate templates and dashboard caches', () => {
      // Set up cache data
      queryClient.setQueryData(queryKeys.templates.list({ page: 1 }), [])
      queryClient.setQueryData(queryKeys.templates.detail('template-1'), {})
      queryClient.setQueryData(queryKeys.dashboard.stats(), { totalTemplates: 10 })

      // Invalidate on template change
      invalidateOnTemplateChange(queryClient)

      // Check that queries are marked as stale (invalidated)
      const templatesListQuery = queryClient.getQueryCache().find({ queryKey: queryKeys.templates.list({ page: 1 }) })
      const templateDetailQuery = queryClient.getQueryCache().find({ queryKey: queryKeys.templates.detail('template-1') })
      const dashboardStatsQuery = queryClient.getQueryCache().find({ queryKey: queryKeys.dashboard.stats() })

      expect(templatesListQuery?.state.isInvalidated).toBe(true)
      expect(templateDetailQuery?.state.isInvalidated).toBe(true)
      expect(dashboardStatsQuery?.state.isInvalidated).toBe(true)
    })
  })

  describe('invalidateOnCustomerChange', () => {
    it('should invalidate customers and dashboard caches', () => {
      // Set up cache data
      queryClient.setQueryData(queryKeys.customers.list({ page: 1 }), [])
      queryClient.setQueryData(queryKeys.customers.detail('customer-1'), {})
      queryClient.setQueryData(queryKeys.dashboard.stats(), { totalCustomers: 50 })

      // Invalidate on customer change
      invalidateOnCustomerChange(queryClient)

      // Check that queries are marked as stale (invalidated)
      const customersListQuery = queryClient.getQueryCache().find({ queryKey: queryKeys.customers.list({ page: 1 }) })
      const customerDetailQuery = queryClient.getQueryCache().find({ queryKey: queryKeys.customers.detail('customer-1') })
      const dashboardStatsQuery = queryClient.getQueryCache().find({ queryKey: queryKeys.dashboard.stats() })

      expect(customersListQuery?.state.isInvalidated).toBe(true)
      expect(customerDetailQuery?.state.isInvalidated).toBe(true)
      expect(dashboardStatsQuery?.state.isInvalidated).toBe(true)
    })
  })

  describe('invalidateOnPaymentComplete', () => {
    it('should invalidate subscription caches', () => {
      // Set up cache data
      queryClient.setQueryData(queryKeys.subscription.status(), { plan: 'FREE' })
      queryClient.setQueryData(queryKeys.subscription.pricing(), { plans: [] })

      // Invalidate on payment complete
      invalidateOnPaymentComplete(queryClient)

      // Check that queries are marked as stale (invalidated)
      const subscriptionStatusQuery = queryClient.getQueryCache().find({ queryKey: queryKeys.subscription.status() })
      const subscriptionPricingQuery = queryClient.getQueryCache().find({ queryKey: queryKeys.subscription.pricing() })

      expect(subscriptionStatusQuery?.state.isInvalidated).toBe(true)
      expect(subscriptionPricingQuery?.state.isInvalidated).toBe(true)
    })
  })
})
