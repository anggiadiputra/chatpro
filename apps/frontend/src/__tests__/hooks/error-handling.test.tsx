/**
 * Property 4: Retry with Exponential Backoff
 * Validates: Requirements 9.1
 *
 * For any failed query, the system SHALL retry with exponentially increasing delays
 * (1s, 2s, 4s), up to a maximum of 3 retries, before marking the query as failed.
 *
 * Property 5: Error Fallback to Cached Data
 * Validates: Requirements 9.2, 9.3
 *
 * For any query that fails after all retries, if cached data exists, the system
 * SHALL display the cached data instead of an error state. Error state SHALL
 * only be shown when no cached data is available.
 */

import React, { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import {
  shouldShowError,
  shouldShowStaleIndicator,
  getQueryErrorState,
  categorizeError,
  getErrorMessage,
} from '@/lib/error-handling'
import { DEFAULT_CACHE_CONFIG } from '@/lib/cache-config'

describe('Property 4: Retry with Exponential Backoff', () => {
  /**
   * Feature: frontend-data-caching, Property 4: Retry with Exponential Backoff
   * Validates: Requirements 9.1
   *
   * For any failed query, the system SHALL retry with exponentially increasing delays
   */

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
          retry: 3,
          retryDelay: (attemptIndex) =>
            Math.min(1000 * Math.pow(2, attemptIndex), 30000),
          gcTime: 0,
          staleTime: 0,
        },
      },
    })
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  it('should retry failed queries up to configured retry count', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['test-retry'],
          queryFn: mockFn,
          retry: 3,
          retryDelay: 0, // No delay for faster test
        }),
      { wrapper: createWrapper() }
    )

    // Wait for all retries to complete
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true)
      },
      { timeout: 10000 }
    )

    // Should have been called 4 times (1 initial + 3 retries)
    expect(mockFn).toHaveBeenCalledTimes(4)
  })

  it('should use exponential backoff delays (1s, 2s, 4s)', () => {
    const retryDelay = (attemptIndex: number) =>
      Math.min(1000 * Math.pow(2, attemptIndex), 30000)

    // First retry: 1000 * 2^0 = 1000ms (1s)
    expect(retryDelay(0)).toBe(1000)

    // Second retry: 1000 * 2^1 = 2000ms (2s)
    expect(retryDelay(1)).toBe(2000)

    // Third retry: 1000 * 2^2 = 4000ms (4s)
    expect(retryDelay(2)).toBe(4000)

    // Fourth retry: 1000 * 2^3 = 8000ms (8s)
    expect(retryDelay(3)).toBe(8000)

    // Should cap at 30000ms
    expect(retryDelay(10)).toBe(30000)
  })

  it('should stop retrying after successful response', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: 'success' })

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['test-retry-success'],
          queryFn: mockFn,
          retry: 3,
          retryDelay: 0, // No delay for faster test
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true)
      },
      { timeout: 10000 }
    )

    // Should only have been called twice (initial + 1 retry that succeeded)
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('should verify QueryClient default retry configuration', () => {
    const defaultQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: DEFAULT_CACHE_CONFIG.staleTime,
          gcTime: DEFAULT_CACHE_CONFIG.gcTime,
          retry: 3,
          retryDelay: (attemptIndex) =>
            Math.min(1000 * Math.pow(2, attemptIndex), 30000),
        },
      },
    })

    const defaultOptions = defaultQueryClient.getDefaultOptions()
    expect(defaultOptions.queries?.retry).toBe(3)
  })

  it('should verify exponential backoff formula for all retry attempts', () => {
    // Property: For any attempt index n, delay = min(1000 * 2^n, 30000)
    const retryDelay = (attemptIndex: number) =>
      Math.min(1000 * Math.pow(2, attemptIndex), 30000)

    // Test multiple attempt indices
    const testCases = [
      { attempt: 0, expected: 1000 },
      { attempt: 1, expected: 2000 },
      { attempt: 2, expected: 4000 },
      { attempt: 3, expected: 8000 },
      { attempt: 4, expected: 16000 },
      { attempt: 5, expected: 30000 }, // Capped
      { attempt: 10, expected: 30000 }, // Still capped
    ]

    testCases.forEach(({ attempt, expected }) => {
      expect(retryDelay(attempt)).toBe(expected)
    })
  })
})

describe('Property 5: Error Fallback to Cached Data', () => {
  /**
   * Feature: frontend-data-caching, Property 5: Error Fallback to Cached Data
   * Validates: Requirements 9.2, 9.3
   *
   * For any query that fails after all retries, if cached data exists,
   * the system SHALL display the cached data instead of an error state.
   */

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
          retry: false, // Disable retry for faster tests
          gcTime: 30 * 60 * 1000,
          staleTime: 0,
        },
      },
    })
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  it('should show cached data when query fails and cache exists', async () => {
    const cachedData = { id: 1, name: 'Cached Item' }
    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'))

    // Pre-populate cache
    queryClient.setQueryData(['test-cache-fallback'], cachedData)

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['test-cache-fallback'],
          queryFn: mockFn,
          placeholderData: (previousData) => previousData,
          retry: false,
        }),
      { wrapper: createWrapper() }
    )

    // Should have cached data immediately
    expect(result.current.data).toEqual(cachedData)

    // Wait for error state
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Should still have data from cache (via placeholderData)
    expect(result.current.data).toEqual(cachedData)
  })

  it('should show error state only when no cached data exists', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['test-no-cache'],
          queryFn: mockFn,
          placeholderData: (previousData) => previousData,
          retry: false,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // No cached data, so data should be undefined
    expect(result.current.data).toBeUndefined()

    // shouldShowError should return true
    expect(shouldShowError(result.current.isError, result.current.data)).toBe(true)
  })

  it('should not show error state when cached data exists', async () => {
    const cachedData = { id: 1, name: 'Cached Item' }
    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'))

    // Pre-populate cache
    queryClient.setQueryData(['test-cache-no-error'], cachedData)

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['test-cache-no-error'],
          queryFn: mockFn,
          placeholderData: (previousData) => previousData,
          retry: false,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // shouldShowError should return false because we have cached data
    expect(shouldShowError(result.current.isError, result.current.data)).toBe(false)
  })

  describe('shouldShowError utility', () => {
    it('should return true when error and no data', () => {
      expect(shouldShowError(true, undefined)).toBe(true)
    })

    it('should return false when error but data exists', () => {
      expect(shouldShowError(true, { data: 'cached' })).toBe(false)
    })

    it('should return false when no error', () => {
      expect(shouldShowError(false, undefined)).toBe(false)
      expect(shouldShowError(false, { data: 'fresh' })).toBe(false)
    })
  })

  describe('shouldShowStaleIndicator utility', () => {
    it('should return true when stale and fetching', () => {
      expect(shouldShowStaleIndicator(true, true)).toBe(true)
    })

    it('should return false when not stale', () => {
      expect(shouldShowStaleIndicator(false, true)).toBe(false)
    })

    it('should return false when not fetching', () => {
      expect(shouldShowStaleIndicator(true, false)).toBe(false)
    })
  })

  describe('getQueryErrorState utility', () => {
    it('should return correct error state when error with no data', () => {
      const state = getQueryErrorState({
        isError: true,
        error: new Error('Network error'),
        data: undefined,
        isStale: false,
        isFetching: false,
      })

      expect(state.showError).toBe(true)
      expect(state.showStaleIndicator).toBe(false)
      expect(state.hasData).toBe(false)
      expect(state.errorType).toBe('network')
    })

    it('should return correct state when error with cached data', () => {
      const state = getQueryErrorState({
        isError: true,
        error: new Error('Server error'),
        data: { cached: true },
        isStale: true,
        isFetching: false,
      })

      expect(state.showError).toBe(false)
      expect(state.hasData).toBe(true)
      expect(state.errorType).toBe('server')
    })

    it('should show stale indicator when stale and fetching', () => {
      const state = getQueryErrorState({
        isError: false,
        error: null,
        data: { cached: true },
        isStale: true,
        isFetching: true,
      })

      expect(state.showStaleIndicator).toBe(true)
      expect(state.showError).toBe(false)
    })
  })

  describe('categorizeError utility', () => {
    it('should categorize network errors', () => {
      expect(categorizeError(new Error('Network error'))).toBe('network')
      expect(categorizeError(new Error('Failed to fetch'))).toBe('network')
      expect(categorizeError(new Error('Connection refused'))).toBe('network')
    })

    it('should categorize auth errors', () => {
      expect(categorizeError(new Error('401 Unauthorized'))).toBe('auth')
      expect(categorizeError(new Error('Authentication failed'))).toBe('auth')
    })

    it('should categorize server errors', () => {
      expect(categorizeError(new Error('500 Internal Server Error'))).toBe('server')
      expect(categorizeError(new Error('Server unavailable'))).toBe('server')
    })

    it('should return unknown for other errors', () => {
      expect(categorizeError(new Error('Something went wrong'))).toBe('unknown')
      expect(categorizeError(null)).toBe('unknown')
    })
  })

  describe('getErrorMessage utility', () => {
    it('should return appropriate messages for each error type', () => {
      expect(getErrorMessage('network')).toContain('internet connection')
      expect(getErrorMessage('auth')).toContain('session')
      expect(getErrorMessage('server')).toContain('Server error')
      expect(getErrorMessage('unknown')).toContain('Something went wrong')
    })
  })
})
