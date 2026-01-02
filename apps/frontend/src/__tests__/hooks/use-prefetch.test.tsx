/**
 * Property 7: Prefetch Non-Blocking Execution
 * Validates: Requirements 7.3, 7.4
 *
 * For any prefetch operation, the system SHALL execute asynchronously
 * without blocking the current thread, and SHALL silently handle any
 * errors without affecting user experience.
 */

import React, { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePrefetch } from '@/hooks/use-prefetch'
import { queryKeys } from '@/lib/query-keys'

// Mock the API modules
vi.mock('@/lib/api/dashboard-api', () => ({
  dashboardApi: {
    getStats: vi.fn(),
  },
}))

vi.mock('@/lib/api/templates-api', () => ({
  templatesApi: {
    getTemplates: vi.fn(),
  },
}))

vi.mock('@/lib/api/customers-api', () => ({
  customersApi: {
    getCustomers: vi.fn(),
  },
}))

import { dashboardApi } from '@/lib/api/dashboard-api'
import { templatesApi } from '@/lib/api/templates-api'
import { customersApi } from '@/lib/api/customers-api'

describe('usePrefetch - Property 7: Prefetch Non-Blocking Execution', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Non-blocking execution', () => {
    /**
     * Test: Prefetch returns immediately (async)
     * Validates: Requirements 7.3
     */
    it('prefetchDashboard should return immediately without blocking', async () => {
      const mockGetStats = vi.mocked(dashboardApi.getStats)
      
      // Create a delayed promise to simulate slow network
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockGetStats.mockReturnValue(slowPromise as any)

      const { result } = renderHook(() => usePrefetch(), {
        wrapper: createWrapper(),
      })

      // Start prefetch
      const startTime = Date.now()
      await act(async () => {
        // This should return immediately, not wait for the API
        void result.current.prefetchDashboard()
      })
      const endTime = Date.now()

      // Should return almost immediately (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)

      // Resolve the promise to clean up
      resolvePromise!({ messages: { total: 0 } })
    })

    /**
     * Test: Prefetch templates returns immediately
     * Validates: Requirements 7.3
     */
    it('prefetchTemplates should return immediately without blocking', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockGetTemplates.mockReturnValue(slowPromise as any)

      const { result } = renderHook(() => usePrefetch(), {
        wrapper: createWrapper(),
      })

      const startTime = Date.now()
      await act(async () => {
        void result.current.prefetchTemplates()
      })
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100)
      resolvePromise!([])
    })

    /**
     * Test: Prefetch customers returns immediately
     * Validates: Requirements 7.3
     */
    it('prefetchCustomers should return immediately without blocking', async () => {
      const mockGetCustomers = vi.mocked(customersApi.getCustomers)
      
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockGetCustomers.mockReturnValue(slowPromise as any)

      const { result } = renderHook(() => usePrefetch(), {
        wrapper: createWrapper(),
      })

      const startTime = Date.now()
      await act(async () => {
        void result.current.prefetchCustomers()
      })
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100)
      resolvePromise!([])
    })
  })

  describe('Silent error handling', () => {
    /**
     * Test: Prefetch errors are silently handled
     * Validates: Requirements 7.4
     */
    it('prefetchDashboard should silently handle errors without throwing', async () => {
      const mockGetStats = vi.mocked(dashboardApi.getStats)
      mockGetStats.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => usePrefetch(), {
        wrapper: createWrapper(),
      })

      // Should not throw
      await act(async () => {
        await expect(result.current.prefetchDashboard()).resolves.not.toThrow()
      })

      // API was called
      expect(mockGetStats).toHaveBeenCalled()
    })

    /**
     * Test: Prefetch templates errors are silently handled
     * Validates: Requirements 7.4
     */
    it('prefetchTemplates should silently handle errors without throwing', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      mockGetTemplates.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => usePrefetch(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await expect(result.current.prefetchTemplates()).resolves.not.toThrow()
      })

      expect(mockGetTemplates).toHaveBeenCalled()
    })

    /**
     * Test: Prefetch customers errors are silently handled
     * Validates: Requirements 7.4
     */
    it('prefetchCustomers should silently handle errors without throwing', async () => {
      const mockGetCustomers = vi.mocked(customersApi.getCustomers)
      mockGetCustomers.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => usePrefetch(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await expect(result.current.prefetchCustomers()).resolves.not.toThrow()
      })

      expect(mockGetCustomers).toHaveBeenCalled()
    })

    /**
     * Test: Multiple prefetch errors don't affect each other
     * Validates: Requirements 7.4
     */
    it('should handle multiple prefetch errors independently', async () => {
      const mockGetStats = vi.mocked(dashboardApi.getStats)
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      const mockGetCustomers = vi.mocked(customersApi.getCustomers)

      mockGetStats.mockRejectedValue(new Error('Dashboard error'))
      mockGetTemplates.mockRejectedValue(new Error('Templates error'))
      mockGetCustomers.mockResolvedValue([{ id: '1', name: 'Test' }] as any)

      const { result } = renderHook(() => usePrefetch(), {
        wrapper: createWrapper(),
      })

      // All should complete without throwing
      await act(async () => {
        await Promise.all([
          result.current.prefetchDashboard(),
          result.current.prefetchTemplates(),
          result.current.prefetchCustomers(),
        ])
      })

      // All APIs were called
      expect(mockGetStats).toHaveBeenCalled()
      expect(mockGetTemplates).toHaveBeenCalled()
      expect(mockGetCustomers).toHaveBeenCalled()

      // Successful prefetch should populate cache
      const customersCache = queryClient.getQueryData(queryKeys.customers.list({}))
      expect(customersCache).toEqual([{ id: '1', name: 'Test' }])
    })
  })

  describe('Cache population', () => {
    /**
     * Test: Successful prefetch populates cache
     * Validates: Requirements 7.1, 7.2
     */
    it('should populate cache on successful prefetch', async () => {
      const mockStats = { messages: { total: 100 } }
      const mockGetStats = vi.mocked(dashboardApi.getStats)
      mockGetStats.mockResolvedValue(mockStats as any)

      const { result } = renderHook(() => usePrefetch(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.prefetchDashboard()
      })

      // Cache should be populated
      const cachedData = queryClient.getQueryData(queryKeys.dashboard.stats())
      expect(cachedData).toEqual(mockStats)
    })

    /**
     * Test: Prefetch uses correct query keys
     * Validates: Requirements 7.1
     */
    it('should use correct query keys for prefetching', async () => {
      const mockGetStats = vi.mocked(dashboardApi.getStats)
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      const mockGetCustomers = vi.mocked(customersApi.getCustomers)

      mockGetStats.mockResolvedValue({ messages: { total: 0 } } as any)
      mockGetTemplates.mockResolvedValue([])
      mockGetCustomers.mockResolvedValue([])

      const { result } = renderHook(() => usePrefetch(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.prefetchDashboard()
        await result.current.prefetchTemplates()
        await result.current.prefetchCustomers()
      })

      // Verify cache keys
      expect(queryClient.getQueryData(queryKeys.dashboard.stats())).toBeDefined()
      expect(queryClient.getQueryData(queryKeys.templates.list({}))).toBeDefined()
      expect(queryClient.getQueryData(queryKeys.customers.list({}))).toBeDefined()
    })
  })
})
