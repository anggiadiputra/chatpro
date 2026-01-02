/**
 * Property 8: Optimistic Update Rollback on Error
 * Validates: Requirements 8.2, 8.3
 *
 * For any mutation with optimistic update that fails,
 * the system SHALL rollback the cache to its previous state,
 * ensuring data consistency.
 */

import React, { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useTemplates,
  useTemplateDetail,
  useSubmitTemplate,
} from '@/hooks/use-templates'
import {
  useCustomers,
  useCustomerDetail,
  useUpdateCustomer,
  useToggleCustomerBlacklist,
} from '@/hooks/use-customers'
import { queryKeys } from '@/lib/query-keys'
import { CACHE_TIMES } from '@/lib/cache-config'
import type { Template } from '@/app/[locale]/(dashboard)/templates/data/schema'
import type { Customer } from '@/lib/api/customers-api'

// Mock the APIs
vi.mock('@/lib/api/templates-api', () => ({
  templatesApi: {
    getTemplates: vi.fn(),
    getTemplate: vi.fn(),
    submitToMeta: vi.fn(),
  },
}))

vi.mock('@/lib/api/customers-api', () => ({
  customersApi: {
    getCustomers: vi.fn(),
    getCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    toggleBlacklist: vi.fn(),
  },
}))

import { templatesApi } from '@/lib/api/templates-api'
import { customersApi } from '@/lib/api/customers-api'

const mockTemplate: Template = {
  id: 'template-1',
  name: 'welcome_message',
  category: 'MARKETING',
  language: 'en_US',
  status: 'APPROVED',
  content: 'Hello {{1}}, welcome!',
  headerType: 'TEXT',
  headerContent: 'Welcome',
  footerText: null,
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
    name: 'order_update',
    status: 'APPROVED',
  },
]

const mockCustomer: Customer = {
  id: 'customer-1',
  phoneNumber: '+6281234567890',
  name: 'John Doe',
  email: 'john@example.com',
  consentStatus: 'CONSENTED',
  blacklisted: false,
  leadScore: 50,
  pipelineStageId: 'stage-1',
  pipelineStage: { id: 'stage-1', name: 'Lead', color: '#blue' },
  lastMessageAt: '2024-01-01T00:00:00Z',
  hasActiveWindow: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockCustomers: Customer[] = [
  mockCustomer,
  {
    ...mockCustomer,
    id: 'customer-2',
    name: 'Jane Smith',
    phoneNumber: '+6281234567891',
  },
]

describe('Property 8: Optimistic Update Rollback on Error', () => {
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
          gcTime: 0,
          staleTime: 0,
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

  describe('Template Status Optimistic Update', () => {
    /**
     * Test: UI updates immediately on template submit mutation
     * Validates: Requirements 8.2
     */
    it('should optimistically update template status to PENDING immediately', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      const mockGetTemplate = vi.mocked(templatesApi.getTemplate)
      const mockSubmitToMeta = vi.mocked(templatesApi.submitToMeta)

      mockGetTemplates.mockResolvedValue(mockTemplates)
      mockGetTemplate.mockResolvedValue(mockTemplate)
      
      // Make submit hang to observe optimistic state
      let resolveSubmit: (value: any) => void
      mockSubmitToMeta.mockImplementation(() => new Promise(resolve => {
        resolveSubmit = resolve
      }))

      // Populate cache with templates list
      const { result: listResult } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(listResult.current.data).toEqual(mockTemplates)
      })

      // Populate cache with template detail
      const { result: detailResult } = renderHook(
        () => useTemplateDetail('template-1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(detailResult.current.data).toEqual(mockTemplate)
      })

      // Start submit mutation
      const { result: submitResult } = renderHook(() => useSubmitTemplate(), {
        wrapper: createWrapper(),
      })

      // Trigger mutation (don't await)
      act(() => {
        submitResult.current.mutate('template-1')
      })

      // Check optimistic update happened immediately
      await waitFor(() => {
        const cachedDetail = queryClient.getQueryData<Template>(
          queryKeys.templates.detail('template-1')
        )
        expect(cachedDetail?.status).toBe('PENDING')
      })

      // Resolve the mutation
      await act(async () => {
        resolveSubmit!({ success: true })
      })
    })

    /**
     * Test: Cache rolls back on template submit mutation error
     * Validates: Requirements 8.3
     */
    it('should rollback template status on mutation error', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      const mockGetTemplate = vi.mocked(templatesApi.getTemplate)
      const mockSubmitToMeta = vi.mocked(templatesApi.submitToMeta)

      mockGetTemplates.mockResolvedValue(mockTemplates)
      mockGetTemplate.mockResolvedValue(mockTemplate)
      
      // Make submit fail
      mockSubmitToMeta.mockRejectedValue(new Error('Network error'))

      // Populate cache
      const { result: listResult } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(listResult.current.data).toEqual(mockTemplates)
      })

      const { result: detailResult } = renderHook(
        () => useTemplateDetail('template-1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(detailResult.current.data?.status).toBe('APPROVED')
      })

      // Start submit mutation
      const { result: submitResult } = renderHook(() => useSubmitTemplate(), {
        wrapper: createWrapper(),
      })

      // Trigger mutation and wait for error
      await act(async () => {
        try {
          await submitResult.current.mutateAsync('template-1')
        } catch {
          // Expected error
        }
      })

      // After error, cache should be rolled back to original status
      await waitFor(() => {
        const cachedDetail = queryClient.getQueryData<Template>(
          queryKeys.templates.detail('template-1')
        )
        // Status should be rolled back (or refetched to original)
        expect(cachedDetail?.status).toBe('APPROVED')
      })
    })

    /**
     * Test: List cache is also rolled back on error
     * Validates: Requirements 8.3
     */
    it('should rollback template list cache on mutation error', async () => {
      const mockGetTemplates = vi.mocked(templatesApi.getTemplates)
      const mockSubmitToMeta = vi.mocked(templatesApi.submitToMeta)

      mockGetTemplates.mockResolvedValue(mockTemplates)
      mockSubmitToMeta.mockRejectedValue(new Error('Network error'))

      // Populate list cache
      const { result: listResult } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(listResult.current.data).toEqual(mockTemplates)
      })

      // Verify original status
      const originalTemplate = listResult.current.data?.find(t => t.id === 'template-1')
      expect(originalTemplate?.status).toBe('APPROVED')

      // Start submit mutation
      const { result: submitResult } = renderHook(() => useSubmitTemplate(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        try {
          await submitResult.current.mutateAsync('template-1')
        } catch {
          // Expected error
        }
      })

      // List cache should be rolled back
      await waitFor(() => {
        const cachedList = queryClient.getQueryData<Template[]>(
          queryKeys.templates.list({})
        )
        const template = cachedList?.find(t => t.id === 'template-1')
        expect(template?.status).toBe('APPROVED')
      })
    })
  })

  describe('Customer Update Optimistic Update', () => {
    /**
     * Test: UI updates immediately on customer update mutation
     * Validates: Requirements 8.2
     */
    it('should optimistically update customer data immediately', async () => {
      const mockGetCustomers = vi.mocked(customersApi.getCustomers)
      const mockGetCustomer = vi.mocked(customersApi.getCustomer)
      const mockUpdateCustomer = vi.mocked(customersApi.updateCustomer)

      mockGetCustomers.mockResolvedValue(mockCustomers)
      mockGetCustomer.mockResolvedValue(mockCustomer)
      
      // Make update hang to observe optimistic state
      let resolveUpdate: (value: any) => void
      mockUpdateCustomer.mockImplementation(() => new Promise(resolve => {
        resolveUpdate = resolve
      }))

      // Populate cache
      const { result: listResult } = renderHook(() => useCustomers(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(listResult.current.data).toEqual(mockCustomers)
      })

      const { result: detailResult } = renderHook(
        () => useCustomerDetail('customer-1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(detailResult.current.data).toEqual(mockCustomer)
      })

      // Start update mutation
      const { result: updateResult } = renderHook(() => useUpdateCustomer(), {
        wrapper: createWrapper(),
      })

      // Trigger mutation (don't await)
      act(() => {
        updateResult.current.mutate({
          id: 'customer-1',
          data: { name: 'John Updated' },
        })
      })

      // Check optimistic update happened immediately
      await waitFor(() => {
        const cachedDetail = queryClient.getQueryData<Customer>(
          queryKeys.customers.detail('customer-1')
        )
        expect(cachedDetail?.name).toBe('John Updated')
      })

      // Resolve the mutation
      await act(async () => {
        resolveUpdate!({ success: true })
      })
    })

    /**
     * Test: Cache rolls back on customer update mutation error
     * Validates: Requirements 8.3
     */
    it('should rollback customer data on mutation error', async () => {
      const mockGetCustomers = vi.mocked(customersApi.getCustomers)
      const mockGetCustomer = vi.mocked(customersApi.getCustomer)
      const mockUpdateCustomer = vi.mocked(customersApi.updateCustomer)

      mockGetCustomers.mockResolvedValue(mockCustomers)
      mockGetCustomer.mockResolvedValue(mockCustomer)
      mockUpdateCustomer.mockRejectedValue(new Error('Network error'))

      // Populate cache
      const { result: listResult } = renderHook(() => useCustomers(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(listResult.current.data).toEqual(mockCustomers)
      })

      const { result: detailResult } = renderHook(
        () => useCustomerDetail('customer-1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(detailResult.current.data?.name).toBe('John Doe')
      })

      // Start update mutation
      const { result: updateResult } = renderHook(() => useUpdateCustomer(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        try {
          await updateResult.current.mutateAsync({
            id: 'customer-1',
            data: { name: 'John Updated' },
          })
        } catch {
          // Expected error
        }
      })

      // After error, cache should be rolled back
      await waitFor(() => {
        const cachedDetail = queryClient.getQueryData<Customer>(
          queryKeys.customers.detail('customer-1')
        )
        expect(cachedDetail?.name).toBe('John Doe')
      })
    })
  })

  describe('Customer Blacklist Toggle Optimistic Update', () => {
    /**
     * Test: UI updates immediately on blacklist toggle
     * Validates: Requirements 8.2
     */
    it('should optimistically toggle blacklist status immediately', async () => {
      const mockGetCustomers = vi.mocked(customersApi.getCustomers)
      const mockGetCustomer = vi.mocked(customersApi.getCustomer)
      const mockToggleBlacklist = vi.mocked(customersApi.toggleBlacklist)

      mockGetCustomers.mockResolvedValue(mockCustomers)
      mockGetCustomer.mockResolvedValue(mockCustomer)
      
      // Make toggle hang
      let resolveToggle: (value: any) => void
      mockToggleBlacklist.mockImplementation(() => new Promise(resolve => {
        resolveToggle = resolve
      }))

      // Populate cache
      const { result: detailResult } = renderHook(
        () => useCustomerDetail('customer-1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(detailResult.current.data?.blacklisted).toBe(false)
      })

      // Start toggle mutation
      const { result: toggleResult } = renderHook(() => useToggleCustomerBlacklist(), {
        wrapper: createWrapper(),
      })

      // Trigger mutation (don't await)
      act(() => {
        toggleResult.current.mutate({ id: 'customer-1', blacklisted: false })
      })

      // Check optimistic update - should be toggled to true
      await waitFor(() => {
        const cachedDetail = queryClient.getQueryData<Customer>(
          queryKeys.customers.detail('customer-1')
        )
        expect(cachedDetail?.blacklisted).toBe(true)
      })

      // Resolve the mutation
      await act(async () => {
        resolveToggle!({ success: true })
      })
    })

    /**
     * Test: Cache rolls back on blacklist toggle error
     * Validates: Requirements 8.3
     */
    it('should rollback blacklist status on mutation error', async () => {
      const mockGetCustomers = vi.mocked(customersApi.getCustomers)
      const mockGetCustomer = vi.mocked(customersApi.getCustomer)
      const mockToggleBlacklist = vi.mocked(customersApi.toggleBlacklist)

      mockGetCustomers.mockResolvedValue(mockCustomers)
      mockGetCustomer.mockResolvedValue(mockCustomer)
      mockToggleBlacklist.mockRejectedValue(new Error('Network error'))

      // Populate cache
      const { result: detailResult } = renderHook(
        () => useCustomerDetail('customer-1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(detailResult.current.data?.blacklisted).toBe(false)
      })

      // Start toggle mutation
      const { result: toggleResult } = renderHook(() => useToggleCustomerBlacklist(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        try {
          await toggleResult.current.mutateAsync({ id: 'customer-1', blacklisted: false })
        } catch {
          // Expected error
        }
      })

      // After error, cache should be rolled back to false
      await waitFor(() => {
        const cachedDetail = queryClient.getQueryData<Customer>(
          queryKeys.customers.detail('customer-1')
        )
        expect(cachedDetail?.blacklisted).toBe(false)
      })
    })
  })

  describe('Data Consistency After Rollback', () => {
    /**
     * Test: Both list and detail caches are consistent after rollback
     * Validates: Requirements 8.3
     */
    it('should maintain consistency between list and detail caches after rollback', async () => {
      const mockGetCustomers = vi.mocked(customersApi.getCustomers)
      const mockGetCustomer = vi.mocked(customersApi.getCustomer)
      const mockUpdateCustomer = vi.mocked(customersApi.updateCustomer)

      mockGetCustomers.mockResolvedValue(mockCustomers)
      mockGetCustomer.mockResolvedValue(mockCustomer)
      mockUpdateCustomer.mockRejectedValue(new Error('Network error'))

      // Populate both caches
      const { result: listResult } = renderHook(() => useCustomers(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(listResult.current.data).toEqual(mockCustomers)
      })

      const { result: detailResult } = renderHook(
        () => useCustomerDetail('customer-1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(detailResult.current.data).toEqual(mockCustomer)
      })

      // Attempt update that will fail
      const { result: updateResult } = renderHook(() => useUpdateCustomer(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        try {
          await updateResult.current.mutateAsync({
            id: 'customer-1',
            data: { name: 'Failed Update' },
          })
        } catch {
          // Expected error
        }
      })

      // Both caches should have consistent data after rollback
      await waitFor(() => {
        const cachedList = queryClient.getQueryData<Customer[]>(
          queryKeys.customers.list({})
        )
        const cachedDetail = queryClient.getQueryData<Customer>(
          queryKeys.customers.detail('customer-1')
        )

        const listCustomer = cachedList?.find(c => c.id === 'customer-1')
        
        // Both should have the original name
        expect(listCustomer?.name).toBe('John Doe')
        expect(cachedDetail?.name).toBe('John Doe')
      })
    })
  })
})
