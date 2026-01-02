import { prisma } from '../../utils/database.js'
import type { Role, SubscriptionTier, SubscriptionStatus } from '@prisma/client'

// Query interfaces
export interface AdminUsersQuery {
  page?: number
  limit?: number
  search?: string
  role?: Role
  tier?: SubscriptionTier
  status?: 'active' | 'inactive'
}

export interface UpdateUserRequest {
  isActive?: boolean
  role?: Role
}

export interface UpdateSubscriptionRequest {
  tier?: SubscriptionTier
  status?: SubscriptionStatus
  endDate?: string
  notes?: string
}

// Response interfaces
export interface AdminUser {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  subscriptionTier: string
  wabaConnectionStatus: string | null
  createdAt: Date
  lastLoginAt: Date | null
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdminUserListResponse {
  users: AdminUser[]
  pagination: Pagination
}

export interface AdminUserDetailResponse {
  user: AdminUser & {
    email: string
    emailVerified: boolean
    phoneNumberId: string | null
    wabaId: string | null
  }
  subscription: {
    id: string
    tier: SubscriptionTier
    status: SubscriptionStatus
    startDate: Date
    endDate: Date | null
    notes: string | null
  } | null
  wabaStatus: {
    wabaId: string | null
    phoneNumberId: string | null
    connectionStatus: string | null
    connectedAt: Date | null
    lastSyncAt: Date | null
  } | null
  instagramAccounts: {
    id: string
    username: string
    connectionStatus: string
    connectedAt: Date
  }[]
  recentActivity: {
    id: string
    action: string
    entityType: string
    entityId: string
    details: any
    timestamp: Date
  }[]
}

export interface AdminUserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  newUsersThisMonth: number
}


export class AdminUserService {
  /**
   * Get user statistics for dashboard
   */
  static async getUserStats(): Promise<AdminUserStats> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalUsers, activeUsers, inactiveUsers, newUsersThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      })
    ])

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersThisMonth
    }
  }

  /**
   * List users with pagination, search, and filters
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  static async listUsers(query: AdminUsersQuery): Promise<AdminUserListResponse> {
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 100)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Search by name or email
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    // Filter by role
    if (query.role) {
      where.role = query.role
    }

    // Filter by status
    if (query.status) {
      where.isActive = query.status === 'active'
    }

    // Filter by subscription tier
    if (query.tier) {
      where.subscription = {
        tier: query.tier
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          subscriptionTier: true,
          wabaConnectionStatus: true,
          createdAt: true,
          lastLoginAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        subscriptionTier: user.subscriptionTier,
        wabaConnectionStatus: user.wabaConnectionStatus,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Get detailed user information
   * Requirements: 3.5
   */
  static async getUserDetail(userId: string): Promise<AdminUserDetailResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        instagramAccounts: {
          select: {
            id: true,
            username: true,
            connectionStatus: true,
            connectedAt: true
          }
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            details: true,
            timestamp: true
          }
        }
      }
    })

    if (!user) {
      return null
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        subscriptionTier: user.subscriptionTier,
        wabaConnectionStatus: user.wabaConnectionStatus,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        emailVerified: user.emailVerified,
        phoneNumberId: user.phoneNumberId,
        wabaId: user.wabaId
      },
      subscription: user.subscription ? {
        id: user.subscription.id,
        tier: user.subscription.tier,
        status: user.subscription.status,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        notes: user.subscription.notes
      } : null,
      wabaStatus: {
        wabaId: user.wabaId,
        phoneNumberId: user.phoneNumberId,
        connectionStatus: user.wabaConnectionStatus,
        connectedAt: user.wabaConnectedAt,
        lastSyncAt: user.wabaLastSyncAt
      },
      instagramAccounts: user.instagramAccounts,
      recentActivity: user.auditLogs
    }
  }

  /**
   * Update user status and role
   * Requirements: 3.6
   */
  static async updateUser(
    userId: string,
    data: UpdateUserRequest,
    adminUserId: string
  ): Promise<AdminUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return null
    }

    // Build update data
    const updateData: any = {}
    const changes: string[] = []

    if (data.isActive !== undefined && data.isActive !== user.isActive) {
      updateData.isActive = data.isActive
      changes.push(`isActive: ${user.isActive} → ${data.isActive}`)
    }

    if (data.role !== undefined && data.role !== user.role) {
      updateData.role = data.role
      changes.push(`role: ${user.role} → ${data.role}`)
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        subscriptionTier: user.subscriptionTier,
        wabaConnectionStatus: user.wabaConnectionStatus,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    }

    // Update user and create audit log in transaction
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          subscriptionTier: true,
          wabaConnectionStatus: true,
          createdAt: true,
          lastLoginAt: true
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'USER_UPDATED',
          entityType: 'User',
          entityId: userId,
          details: {
            changes,
            updatedFields: updateData
          }
        }
      })
    ])

    return updatedUser
  }

  /**
   * Bulk update multiple users (activate/deactivate)
   */
  static async bulkUpdateUsers(
    userIds: string[],
    action: 'activate' | 'deactivate',
    adminUserId: string
  ): Promise<{ updated: number; failed: string[] }> {
    const isActive = action === 'activate'
    const failed: string[] = []

    // Verify all users exist
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true }
    })

    const existingIds = new Set(existingUsers.map(u => u.id))
    const notFoundIds = userIds.filter(id => !existingIds.has(id))
    failed.push(...notFoundIds)

    const validIds = userIds.filter(id => existingIds.has(id))

    if (validIds.length === 0) {
      return { updated: 0, failed }
    }

    // Update users and create audit log in transaction
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { id: { in: validIds } },
        data: { isActive }
      }),
      prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: action === 'activate' ? 'USERS_BULK_ACTIVATED' : 'USERS_BULK_DEACTIVATED',
          entityType: 'User',
          entityId: 'bulk',
          details: {
            userIds: validIds,
            count: validIds.length,
            action
          }
        }
      })
    ])

    return { updated: validIds.length, failed }
  }

  /**
   * Update user subscription
   * Requirements: 3.7
   */
  static async updateSubscription(
    userId: string,
    data: UpdateSubscriptionRequest,
    adminUserId: string
  ): Promise<{ success: boolean; subscription?: any; error?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const changes: string[] = []
    const updateData: any = {}

    if (data.tier !== undefined) {
      updateData.tier = data.tier
      changes.push(`tier: ${user.subscription?.tier || 'none'} → ${data.tier}`)
    }

    if (data.status !== undefined) {
      updateData.status = data.status
      changes.push(`status: ${user.subscription?.status || 'none'} → ${data.status}`)
    }

    if (data.endDate !== undefined) {
      updateData.endDate = new Date(data.endDate)
      changes.push(`endDate: ${user.subscription?.endDate || 'none'} → ${data.endDate}`)
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes
    }

    // Upsert subscription and create audit log
    const [subscription] = await prisma.$transaction([
      prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          tier: data.tier || 'FREE',
          status: data.status || 'ACTIVE',
          endDate: data.endDate ? new Date(data.endDate) : null,
          notes: data.notes
        },
        update: updateData
      }),
      prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'SUBSCRIPTION_UPDATED',
          entityType: 'Subscription',
          entityId: userId,
          details: {
            targetUserId: userId,
            changes,
            updatedFields: updateData
          }
        }
      }),
      // Also update the user's subscriptionTier field for quick access
      ...(data.tier ? [
        prisma.user.update({
          where: { id: userId },
          data: { subscriptionTier: data.tier }
        })
      ] : [])
    ])

    return { success: true, subscription }
  }
}
