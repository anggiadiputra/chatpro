/**
 * Property 3: Filter Consistency
 * Validates: Requirements 3.1, 3.2, 3.3
 *
 * For any set of conversations, filtering by "unread" SHALL return only
 * conversations where unreadCount > 0, and filtering by "read" SHALL return
 * only conversations where unreadCount === 0.
 */

import { describe, it, expect } from 'vitest'
import {
  type UnifiedConversation,
  type ReadStatusFilter,
  transformWhatsAppToUnified,
  transformInstagramToUnified,
} from '@/app/[locale]/(dashboard)/oneinbox/types/unified-inbox'
import type { IGConversation } from '@/lib/api/instagram'

// Helper to create mock WhatsApp customer
const createMockCustomer = (id: string, phoneNumber: string, name?: string) => ({
  id,
  phoneNumber,
  name: name || null,
})

// Helper to create mock messages
const createMockMessages = (customerId: string, count: number, statuses: string[] = []) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${customerId}-${i}`,
    customer: { id: customerId, phoneNumber: `+62${customerId}` },
    direction: 'INBOUND',
    status: statuses[i] || 'DELIVERED',
    content: `Message ${i}`,
    timestamp: new Date(Date.now() - i * 1000).toISOString(),
  }))
}

// Helper to create mock Instagram conversation
const createMockIGConversation = (
  id: string,
  unreadCount: number,
  participantName?: string
): IGConversation => ({
  id,
  participantIgsid: `igsid-${id}`,
  participantUsername: `user_${id}`,
  participantName: participantName || `User ${id}`,
  participantProfilePic: null,
  lastMessagePreview: 'Hello',
  lastMessageAt: new Date().toISOString(),
  unreadCount,
  isWindowActive: true,
})

// Filter function extracted from useUnifiedInbox hook for testing
const filterByReadStatus = (
  conversations: UnifiedConversation[],
  readStatusFilter: ReadStatusFilter
): UnifiedConversation[] => {
  if (readStatusFilter === 'unread') {
    return conversations.filter((c) => c.unreadCount > 0)
  } else if (readStatusFilter === 'read') {
    return conversations.filter((c) => c.unreadCount === 0)
  }
  return conversations
}

describe('Filter Consistency - Property 3', () => {
  describe('WhatsApp conversations filter', () => {
    /**
     * Test: Unread filter returns only WhatsApp conversations with unreadCount > 0
     * Validates: Requirements 3.1
     */
    it('should return only WhatsApp conversations with unreadCount > 0 when filtering by unread', () => {
      const customer1 = createMockCustomer('c1', '+6281234567890', 'Customer 1')
      const customer2 = createMockCustomer('c2', '+6281234567891', 'Customer 2')
      const customer3 = createMockCustomer('c3', '+6281234567892', 'Customer 3')

      const messages = [
        ...createMockMessages('c1', 3),
        ...createMockMessages('c2', 2),
        ...createMockMessages('c3', 1),
      ]

      // Unread counts: c1 has 3 unread, c2 has 0 unread, c3 has 1 unread
      const unreadCounts: Record<string, number> = {
        c1: 3,
        c2: 0,
        c3: 1,
      }

      const conversations: UnifiedConversation[] = [
        transformWhatsAppToUnified(customer1, messages, unreadCounts),
        transformWhatsAppToUnified(customer2, messages, unreadCounts),
        transformWhatsAppToUnified(customer3, messages, unreadCounts),
      ]

      const filtered = filterByReadStatus(conversations, 'unread')

      // Should only include c1 and c3 (unreadCount > 0)
      expect(filtered).toHaveLength(2)
      expect(filtered.every((c) => c.unreadCount > 0)).toBe(true)
      expect(filtered.map((c) => c.participantIdentifier)).toContain('+6281234567890')
      expect(filtered.map((c) => c.participantIdentifier)).toContain('+6281234567892')
      expect(filtered.map((c) => c.participantIdentifier)).not.toContain('+6281234567891')
    })

    /**
     * Test: Read filter returns only WhatsApp conversations with unreadCount === 0
     * Validates: Requirements 3.2
     */
    it('should return only WhatsApp conversations with unreadCount === 0 when filtering by read', () => {
      const customer1 = createMockCustomer('c1', '+6281234567890', 'Customer 1')
      const customer2 = createMockCustomer('c2', '+6281234567891', 'Customer 2')
      const customer3 = createMockCustomer('c3', '+6281234567892', 'Customer 3')

      const messages = [
        ...createMockMessages('c1', 3),
        ...createMockMessages('c2', 2),
        ...createMockMessages('c3', 1),
      ]

      const unreadCounts: Record<string, number> = {
        c1: 3,
        c2: 0,
        c3: 0,
      }

      const conversations: UnifiedConversation[] = [
        transformWhatsAppToUnified(customer1, messages, unreadCounts),
        transformWhatsAppToUnified(customer2, messages, unreadCounts),
        transformWhatsAppToUnified(customer3, messages, unreadCounts),
      ]

      const filtered = filterByReadStatus(conversations, 'read')

      // Should only include c2 and c3 (unreadCount === 0)
      expect(filtered).toHaveLength(2)
      expect(filtered.every((c) => c.unreadCount === 0)).toBe(true)
      expect(filtered.map((c) => c.participantIdentifier)).toContain('+6281234567891')
      expect(filtered.map((c) => c.participantIdentifier)).toContain('+6281234567892')
      expect(filtered.map((c) => c.participantIdentifier)).not.toContain('+6281234567890')
    })

    /**
     * Test: All filter returns all WhatsApp conversations regardless of unreadCount
     * Validates: Requirements 3.3
     */
    it('should return all WhatsApp conversations when filtering by all', () => {
      const customer1 = createMockCustomer('c1', '+6281234567890', 'Customer 1')
      const customer2 = createMockCustomer('c2', '+6281234567891', 'Customer 2')

      const messages = [
        ...createMockMessages('c1', 3),
        ...createMockMessages('c2', 2),
      ]

      const unreadCounts: Record<string, number> = {
        c1: 3,
        c2: 0,
      }

      const conversations: UnifiedConversation[] = [
        transformWhatsAppToUnified(customer1, messages, unreadCounts),
        transformWhatsAppToUnified(customer2, messages, unreadCounts),
      ]

      const filtered = filterByReadStatus(conversations, 'all')

      expect(filtered).toHaveLength(2)
    })
  })

  describe('Instagram conversations filter', () => {
    /**
     * Test: Unread filter returns only Instagram conversations with unreadCount > 0
     * Validates: Requirements 3.1
     */
    it('should return only Instagram conversations with unreadCount > 0 when filtering by unread', () => {
      const igConv1 = createMockIGConversation('ig1', 5, 'Instagram User 1')
      const igConv2 = createMockIGConversation('ig2', 0, 'Instagram User 2')
      const igConv3 = createMockIGConversation('ig3', 2, 'Instagram User 3')

      const conversations: UnifiedConversation[] = [
        transformInstagramToUnified(igConv1),
        transformInstagramToUnified(igConv2),
        transformInstagramToUnified(igConv3),
      ]

      const filtered = filterByReadStatus(conversations, 'unread')

      expect(filtered).toHaveLength(2)
      expect(filtered.every((c) => c.unreadCount > 0)).toBe(true)
      expect(filtered.map((c) => c.participantIdentifier)).toContain('igsid-ig1')
      expect(filtered.map((c) => c.participantIdentifier)).toContain('igsid-ig3')
      expect(filtered.map((c) => c.participantIdentifier)).not.toContain('igsid-ig2')
    })

    /**
     * Test: Read filter returns only Instagram conversations with unreadCount === 0
     * Validates: Requirements 3.2
     */
    it('should return only Instagram conversations with unreadCount === 0 when filtering by read', () => {
      const igConv1 = createMockIGConversation('ig1', 5, 'Instagram User 1')
      const igConv2 = createMockIGConversation('ig2', 0, 'Instagram User 2')
      const igConv3 = createMockIGConversation('ig3', 0, 'Instagram User 3')

      const conversations: UnifiedConversation[] = [
        transformInstagramToUnified(igConv1),
        transformInstagramToUnified(igConv2),
        transformInstagramToUnified(igConv3),
      ]

      const filtered = filterByReadStatus(conversations, 'read')

      expect(filtered).toHaveLength(2)
      expect(filtered.every((c) => c.unreadCount === 0)).toBe(true)
      expect(filtered.map((c) => c.participantIdentifier)).toContain('igsid-ig2')
      expect(filtered.map((c) => c.participantIdentifier)).toContain('igsid-ig3')
      expect(filtered.map((c) => c.participantIdentifier)).not.toContain('igsid-ig1')
    })
  })

  describe('Mixed channel filter (WhatsApp + Instagram)', () => {
    /**
     * Test: Filter applies consistently across both channels
     * Validates: Requirements 3.3
     */
    it('should apply the same filter logic for both WhatsApp and Instagram conversations', () => {
      // WhatsApp conversations
      const waCustomer1 = createMockCustomer('wa1', '+6281234567890', 'WA Customer 1')
      const waCustomer2 = createMockCustomer('wa2', '+6281234567891', 'WA Customer 2')
      const waMessages = [
        ...createMockMessages('wa1', 2),
        ...createMockMessages('wa2', 1),
      ]
      const waUnreadCounts: Record<string, number> = {
        wa1: 2,
        wa2: 0,
      }

      // Instagram conversations
      const igConv1 = createMockIGConversation('ig1', 3, 'IG User 1')
      const igConv2 = createMockIGConversation('ig2', 0, 'IG User 2')

      const allConversations: UnifiedConversation[] = [
        transformWhatsAppToUnified(waCustomer1, waMessages, waUnreadCounts),
        transformWhatsAppToUnified(waCustomer2, waMessages, waUnreadCounts),
        transformInstagramToUnified(igConv1),
        transformInstagramToUnified(igConv2),
      ]

      // Test unread filter
      const unreadFiltered = filterByReadStatus(allConversations, 'unread')
      expect(unreadFiltered).toHaveLength(2) // wa1 and ig1
      expect(unreadFiltered.every((c) => c.unreadCount > 0)).toBe(true)
      expect(unreadFiltered.some((c) => c.channel === 'whatsapp')).toBe(true)
      expect(unreadFiltered.some((c) => c.channel === 'instagram')).toBe(true)

      // Test read filter
      const readFiltered = filterByReadStatus(allConversations, 'read')
      expect(readFiltered).toHaveLength(2) // wa2 and ig2
      expect(readFiltered.every((c) => c.unreadCount === 0)).toBe(true)
      expect(readFiltered.some((c) => c.channel === 'whatsapp')).toBe(true)
      expect(readFiltered.some((c) => c.channel === 'instagram')).toBe(true)

      // Test all filter
      const allFiltered = filterByReadStatus(allConversations, 'all')
      expect(allFiltered).toHaveLength(4)
    })

    /**
     * Test: Edge case - empty conversations array
     */
    it('should return empty array when filtering empty conversations', () => {
      const conversations: UnifiedConversation[] = []

      expect(filterByReadStatus(conversations, 'unread')).toHaveLength(0)
      expect(filterByReadStatus(conversations, 'read')).toHaveLength(0)
      expect(filterByReadStatus(conversations, 'all')).toHaveLength(0)
    })

    /**
     * Test: Edge case - all conversations have same read status
     */
    it('should handle all conversations having the same read status', () => {
      const waCustomer1 = createMockCustomer('wa1', '+6281234567890')
      const waCustomer2 = createMockCustomer('wa2', '+6281234567891')
      const waMessages = [
        ...createMockMessages('wa1', 1),
        ...createMockMessages('wa2', 1),
      ]

      // All unread
      const allUnreadCounts: Record<string, number> = { wa1: 1, wa2: 2 }
      const allUnreadConvs: UnifiedConversation[] = [
        transformWhatsAppToUnified(waCustomer1, waMessages, allUnreadCounts),
        transformWhatsAppToUnified(waCustomer2, waMessages, allUnreadCounts),
      ]

      expect(filterByReadStatus(allUnreadConvs, 'unread')).toHaveLength(2)
      expect(filterByReadStatus(allUnreadConvs, 'read')).toHaveLength(0)

      // All read
      const allReadCounts: Record<string, number> = { wa1: 0, wa2: 0 }
      const allReadConvs: UnifiedConversation[] = [
        transformWhatsAppToUnified(waCustomer1, waMessages, allReadCounts),
        transformWhatsAppToUnified(waCustomer2, waMessages, allReadCounts),
      ]

      expect(filterByReadStatus(allReadConvs, 'unread')).toHaveLength(0)
      expect(filterByReadStatus(allReadConvs, 'read')).toHaveLength(2)
    })
  })

  describe('transformWhatsAppToUnified unreadCount handling', () => {
    /**
     * Test: Transform function correctly uses unreadCounts from backend
     * Validates: Requirements 1.1, 5.1
     */
    it('should use unreadCount from backend unreadCounts map', () => {
      const customer = createMockCustomer('c1', '+6281234567890', 'Test Customer')
      const messages = createMockMessages('c1', 5)
      const unreadCounts: Record<string, number> = { c1: 3 }

      const conversation = transformWhatsAppToUnified(customer, messages, unreadCounts)

      expect(conversation.unreadCount).toBe(3)
    })

    /**
     * Test: Transform function defaults to 0 when customer not in unreadCounts
     */
    it('should default to 0 when customer not in unreadCounts map', () => {
      const customer = createMockCustomer('c1', '+6281234567890', 'Test Customer')
      const messages = createMockMessages('c1', 5)
      const unreadCounts: Record<string, number> = { c2: 3 } // Different customer

      const conversation = transformWhatsAppToUnified(customer, messages, unreadCounts)

      expect(conversation.unreadCount).toBe(0)
    })

    /**
     * Test: Transform function defaults to 0 when unreadCounts is undefined
     */
    it('should default to 0 when unreadCounts is undefined', () => {
      const customer = createMockCustomer('c1', '+6281234567890', 'Test Customer')
      const messages = createMockMessages('c1', 5)

      const conversation = transformWhatsAppToUnified(customer, messages, undefined)

      expect(conversation.unreadCount).toBe(0)
    })
  })
})
