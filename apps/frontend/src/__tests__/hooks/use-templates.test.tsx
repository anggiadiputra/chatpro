/**
 * Property 2: Cache Invalidation After Mutation
 * Validates: Requirements 2.4, 3.2, 4.2, 5.3, 8.1
 *
 * For any mutation that modifies data (create, update, delete),
 * the system SHALL invalidate all related query caches,
 * ensuring subsequent queries fetch fresh data from the server.
 */

import React, { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useTemplates,
  useTemplateDetail,
  useCreateTemplate,
  useSubmitTemplate,
  useDeleteTemplate,
  type CreateTemplateInput,
} from '@/hooks/use-templates'
import { queryKeys } from '@/lib/query-keys'
import { CACHE_TIMES } from '@/lib/cache-config'
import type { Template } from '@/app/[locale]/(dashboard)/templates/data/schema'

// Mock the templates API
vi.mock('@/lib/api/templates-api', () => ({
  templatesApi: {
    getTemplates: vi.fn(),
    getTemplate: vi.fn(),
    createTemplate: vi.fn(),
    submitToMeta: vi.fn(),
    deleteTemplate: vi.fn(),
    getAnalytics: vi.fn(),
  },
}))

import { templatesApi } from '@/lib/api/templates-api'

const mockTemplate: Template = {
  id: 'template-1',
  name: 'welcome_message',
  category: 'MARKETING',
  language: 'en_US',
  status: 'APPROVED',
  content: 'Hello {{1}}, welcome to our service!',
  headerType: 'TEXT',
  headerContent: 'Welcome',
  footerText: 'Reply STOP to unsubscribe',
  metaTemplateId: 'meta-123',
  quality: 'HIGH',
  components: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
}

const mockTemplates: Template[] = [
  mockTemplate,
  {
    ...mockTemplate,
    id: 'template-2',
    name: 'order_confirmation',
    category: 'UTILITY',
    status: 'PENDING',
  },
]

describe('Templates Query Hooks - Cache Invalidation After Mutation', () => {
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
          gcTime: CACHE_TIMES.templates.gcTime,
          staleTime: CACHE_TIMES.templates.staleTime,
        },
        mutations: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Property 2: Cache Invalidation After Mutation', () => {
    /**
     * Test: Create mutation invalidates templates cache
     * Validates: Requirements 3.2, 8.1
     */
    it('should invalidate templates cache after create mutation', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      const mockCreateTemplate = vi.mocked(templatesApi.createTemplate)
      
      // Initial templates list
      mockGetTemplates.mockResolvedValue(mockTemplates)
      mockCreateTemplate.mockResolvedValue({ success: true, data: mockTemplate })

      // First, fetch templates to populate cache
      const { result: templatesResult } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(templatesResult.current.isLoading).toBe(false)
      })

      expect(mockGetTemplates).toHaveBeenCalledTimes(1)

      // Now create a new template
      const { result: createResult } = renderHook(() => useCreateTemplate(), {
        wrapper: createWrapper(),
      })

      const newTemplateInput: CreateTemplateInput = {
        userId: 'user-1',
        templateName: 'new_template',
        language: 'en_US',
        category: 'MARKETING',
        content: 'Hello world!',
      }

      await act(async () => {
        await createResult.current.mutateAsync(newTemplateInput)
      })

      // After mutation, cache should be invalidated
      // The templates query should refetch
      await waitFor(() => {
        expect(mockGetTemplates).toHaveBeenCalledTimes(2)
      })
    })

    /**
     * Test: Delete mutation invalidates templates cache
     * Validates: Requirements 3.2, 8.1
     */
    it('should invalidate templates cache after delete mutation', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      const mockDeleteTemplate = vi.mocked(templatesApi.deleteTemplate)
      
      mockGetTemplates.mockResolvedValue(mockTemplates)
      mockDeleteTemplate.mockResolvedValue({ success: true })

      // First, fetch templates to populate cache
      const { result: templatesResult } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(templatesResult.current.isLoading).toBe(false)
      })

      expect(mockGetTemplates).toHaveBeenCalledTimes(1)

      // Now delete a template
      const { result: deleteResult } = renderHook(() => useDeleteTemplate(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await deleteResult.current.mutateAsync('template-1')
      })

      // After mutation, cache should be invalidated
      await waitFor(() => {
        expect(mockGetTemplates).toHaveBeenCalledTimes(2)
      })
    })

    /**
     * Test: Submit mutation invalidates template detail and list cache
     * Validates: Requirements 3.2, 8.1
     */
    it('should invalidate template caches after submit mutation', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      const mockSubmitToMeta = vi.mocked(templatesApi.submitToMeta)
      
      mockGetTemplates.mockResolvedValue(mockTemplates)
      mockSubmitToMeta.mockResolvedValue({ success: true })

      // First, fetch templates to populate cache
      const { result: templatesResult } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(templatesResult.current.isLoading).toBe(false)
      })

      expect(mockGetTemplates).toHaveBeenCalledTimes(1)

      // Now submit a template
      const { result: submitResult } = renderHook(() => useSubmitTemplate(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await submitResult.current.mutateAsync('template-2')
      })

      // After mutation, list cache should be invalidated
      await waitFor(() => {
        expect(mockGetTemplates).toHaveBeenCalledTimes(2)
      })
    })

    /**
     * Test: Subsequent query fetches fresh data after mutation
     * Validates: Requirements 3.2, 8.1
     */
    it('should fetch fresh data after cache invalidation', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      const mockDeleteTemplate = vi.mocked(templatesApi.deleteTemplate)
      
      // Initial data
      mockGetTemplates.mockResolvedValueOnce(mockTemplates)
      mockDeleteTemplate.mockResolvedValue({ success: true })
      
      // Updated data after deletion
      const updatedTemplates = [mockTemplates[1]]
      mockGetTemplates.mockResolvedValueOnce(updatedTemplates)

      // First, fetch templates
      const { result: templatesResult } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(templatesResult.current.data).toEqual(mockTemplates)
      })

      // Delete a template
      const { result: deleteResult } = renderHook(() => useDeleteTemplate(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await deleteResult.current.mutateAsync('template-1')
      })

      // After invalidation, should have fresh data
      await waitFor(() => {
        expect(templatesResult.current.data).toEqual(updatedTemplates)
      })
    })

    /**
     * Test: Cache config uses correct stale and gc times for templates
     * Validates: Requirements 3.1
     */
    it('should use correct cache configuration for templates data', () => {
      expect(CACHE_TIMES.templates.staleTime).toBe(5 * 60 * 1000) // 5 minutes
      expect(CACHE_TIMES.templates.gcTime).toBe(30 * 60 * 1000) // 30 minutes
    })

    /**
     * Test: Different filter parameters create separate cache entries
     * Validates: Requirements 3.4
     */
    it('should cache templates separately for different filter parameters', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      mockGetTemplates.mockResolvedValue(mockTemplates)

      // Fetch with no filters
      const { result: result1 } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      // Fetch with page filter
      const { result: result2 } = renderHook(() => useTemplates({ page: 2 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Fetch with search filter
      const { result: result3 } = renderHook(() => useTemplates({ search: 'welcome' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result3.current.isLoading).toBe(false)
      })

      // Each unique filter combination should trigger a separate fetch
      expect(mockGetTemplates).toHaveBeenCalledTimes(3)
    })
  })

  describe('useTemplateDetail cache behavior', () => {
    /**
     * Test: Template detail is cached separately from list
     * Validates: Requirements 3.4
     */
    it('should cache template detail separately from list', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      const mockGetTemplate = vi.mocked(templatesApi.getTemplate)
      
      mockGetTemplates.mockResolvedValue(mockTemplates)
      mockGetTemplate.mockResolvedValue(mockTemplate)

      // Fetch list
      const { result: listResult } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(listResult.current.isLoading).toBe(false)
      })

      // Fetch detail
      const { result: detailResult } = renderHook(
        () => useTemplateDetail('template-1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(detailResult.current.isLoading).toBe(false)
      })

      // Both should have been called
      expect(mockGetTemplates).toHaveBeenCalledTimes(1)
      expect(mockGetTemplate).toHaveBeenCalledTimes(1)
      expect(mockGetTemplate).toHaveBeenCalledWith('template-1')
    })

    /**
     * Test: Template detail query is disabled when id is undefined
     */
    it('should not fetch when id is undefined', async () => {
      const mockGetTemplate = vi.mocked(templatesApi.getTemplate)

      const { result } = renderHook(() => useTemplateDetail(undefined), {
        wrapper: createWrapper(),
      })

      // Should not be loading and should not have called API
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(mockGetTemplate).not.toHaveBeenCalled()
    })
  })

  describe('placeholderData behavior', () => {
    /**
     * Test: Previous data is shown as placeholder on error
     * Validates: Requirements 9.2, 9.3
     */
    it('should show cached data as placeholder when available', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      mockGetTemplates.mockResolvedValueOnce(mockTemplates)

      // First fetch succeeds
      const { result, rerender } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockTemplates)
      })

      // Simulate error on next fetch
      mockGetTemplates.mockRejectedValueOnce(new Error('Network error'))

      // Invalidate to trigger refetch
      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.templates.all })
      })

      rerender()

      // Should still have previous data as placeholder
      await waitFor(() => {
        expect(result.current.data).toEqual(mockTemplates)
      })
    })
  })
})
