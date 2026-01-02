/**
 * Disconnect Service
 * Handles soft and hard disconnect logic for WhatsApp and Instagram channels
 * 
 * Soft disconnect: Preserves customer data, only removes messages and credentials
 * Hard disconnect: Removes all data including customers
 */

import { prisma } from '../utils/database.js'

// Types
export type DisconnectMode = 'soft' | 'hard'

export interface WabaDeletedCounts {
  messages: number
  phoneNumbers: number
  customers?: number
  customerActivities?: number
  customerCustomFields?: number
  consentLogs?: number
}

export interface InstagramDeletedCounts {
  messages: number
  conversations: number
  accountDeleted?: boolean
}

export interface DisconnectResult {
  success: boolean
  message: string
  mode: DisconnectMode
  deletedCounts: WabaDeletedCounts | InstagramDeletedCounts
}

export class DisconnectService {
  /**
   * Soft disconnect WhatsApp - preserve customer data
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async softDisconnectWaba(userId: string): Promise<DisconnectResult> {
    const deletedCounts: WabaDeletedCounts = {
      messages: 0,
      phoneNumbers: 0
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete all Message records for user (Req 2.1)
      const messagesResult = await tx.message.deleteMany({
        where: { userId }
      })
      deletedCounts.messages = messagesResult.count

      // Delete all PhoneNumber records for user (Req 2.2)
      const phoneNumbersResult = await tx.phoneNumber.deleteMany({
        where: { userId }
      })
      deletedCounts.phoneNumbers = phoneNumbersResult.count

      // Clear WABA credentials and update status (Req 2.3, 2.5)
      await tx.user.update({
        where: { id: userId },
        data: {
          wabaId: null,
          phoneNumberId: null,
          wabaAccessToken: null,
          wabaAccessTokenIV: null,
          wabaAccessTokenTag: null,
          wabaTokenExpiresAt: null,
          wabaTokenLastRefresh: null,
          wabaConnectionStatus: 'disconnected',
          webhookSubscribedAt: null,
          webhookSubscribedEvents: null
        }
      })
    })

    // Customer data is preserved (Req 2.4)
    return {
      success: true,
      message: 'WhatsApp disconnected successfully. Customer data has been preserved.',
      mode: 'soft',
      deletedCounts
    }
  }

  /**
   * Hard disconnect WhatsApp - delete all data including customers
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
   */
  async hardDisconnectWaba(userId: string): Promise<DisconnectResult> {
    const deletedCounts: WabaDeletedCounts = {
      messages: 0,
      phoneNumbers: 0,
      customers: 0,
      customerActivities: 0,
      customerCustomFields: 0,
      consentLogs: 0
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete all Message records for user (Req 3.1)
      const messagesResult = await tx.message.deleteMany({
        where: { userId }
      })
      deletedCounts.messages = messagesResult.count

      // Delete all ConsentLog records for user's customers (Req 3.2)
      const consentLogsResult = await tx.consentLog.deleteMany({
        where: { customer: { userId } }
      })
      deletedCounts.consentLogs = consentLogsResult.count

      // Delete all CustomerCustomField records for user's customers (Req 3.3)
      const customFieldsResult = await tx.customerCustomField.deleteMany({
        where: { customer: { userId } }
      })
      deletedCounts.customerCustomFields = customFieldsResult.count

      // Delete all CustomerActivity records for user's customers (Req 3.4)
      const activitiesResult = await tx.customerActivity.deleteMany({
        where: { customer: { userId } }
      })
      deletedCounts.customerActivities = activitiesResult.count

      // Delete all Customer records for user (Req 3.5)
      const customersResult = await tx.customer.deleteMany({
        where: { userId }
      })
      deletedCounts.customers = customersResult.count

      // Delete all PhoneNumber records for user (Req 3.6)
      const phoneNumbersResult = await tx.phoneNumber.deleteMany({
        where: { userId }
      })
      deletedCounts.phoneNumbers = phoneNumbersResult.count

      // Clear WABA credentials (Req 3.7)
      await tx.user.update({
        where: { id: userId },
        data: {
          wabaId: null,
          phoneNumberId: null,
          wabaAccessToken: null,
          wabaAccessTokenIV: null,
          wabaAccessTokenTag: null,
          wabaTokenExpiresAt: null,
          wabaTokenLastRefresh: null,
          wabaConnectionStatus: 'disconnected',
          webhookSubscribedAt: null,
          webhookSubscribedEvents: null
        }
      })
    })

    return {
      success: true,
      message: 'WhatsApp disconnected successfully. All data including customers has been deleted.',
      mode: 'hard',
      deletedCounts
    }
  }

  /**
   * Soft disconnect Instagram - preserve account record
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async softDisconnectInstagram(accountId: string): Promise<DisconnectResult> {
    const deletedCounts: InstagramDeletedCounts = {
      messages: 0,
      conversations: 0
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete all IGMessage records for account (Req 4.1)
      const messagesResult = await tx.iGMessage.deleteMany({
        where: {
          conversation: { instagramAccountId: accountId }
        }
      })
      deletedCounts.messages = messagesResult.count

      // Delete all IGConversation records for account (Req 4.2)
      const conversationsResult = await tx.iGConversation.deleteMany({
        where: { instagramAccountId: accountId }
      })
      deletedCounts.conversations = conversationsResult.count

      // Clear access token credentials and update status (Req 4.3, 4.4)
      await tx.instagramAccount.update({
        where: { id: accountId },
        data: {
          connectionStatus: 'disconnected',
          accessToken: '',
          accessTokenIV: '',
          accessTokenTag: ''
        }
      })
    })

    return {
      success: true,
      message: 'Instagram disconnected successfully. Account record has been preserved.',
      mode: 'soft',
      deletedCounts
    }
  }

  /**
   * Hard disconnect Instagram - delete account record entirely
   * Requirements: 5.1, 5.2, 5.3
   */
  async hardDisconnectInstagram(accountId: string): Promise<DisconnectResult> {
    const deletedCounts: InstagramDeletedCounts = {
      messages: 0,
      conversations: 0,
      accountDeleted: true
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete all IGMessage records for account (Req 5.1)
      const messagesResult = await tx.iGMessage.deleteMany({
        where: {
          conversation: { instagramAccountId: accountId }
        }
      })
      deletedCounts.messages = messagesResult.count

      // Delete all IGConversation records for account (Req 5.2)
      const conversationsResult = await tx.iGConversation.deleteMany({
        where: { instagramAccountId: accountId }
      })
      deletedCounts.conversations = conversationsResult.count

      // Delete connection logs first (foreign key constraint)
      await tx.iGConnectionLog.deleteMany({
        where: { instagramAccountId: accountId }
      })

      // Delete InstagramAccount record entirely (Req 5.3)
      await tx.instagramAccount.delete({
        where: { id: accountId }
      })
    })

    return {
      success: true,
      message: 'Instagram disconnected successfully. All data including account has been deleted.',
      mode: 'hard',
      deletedCounts
    }
  }
}

// Export singleton instance
export const disconnectService = new DisconnectService()
