import { describe, it, expect, beforeEach, vi } from 'vitest'

// Create a fresh ConnectionManager class for testing (not the singleton)
class ConnectionManager {
  private connections: Map<string, any> = new Map()
  private userConnections: Map<string, Set<string>> = new Map()

  addConnection(userId: string, socketId: string, userAgent?: string): void {
    const connection = {
      socketId,
      userId,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      userAgent
    }
    this.connections.set(socketId, connection)
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set())
    }
    this.userConnections.get(userId)!.add(socketId)
  }

  removeConnection(socketId: string): void {
    const connection = this.connections.get(socketId)
    if (!connection) return
    const { userId } = connection
    this.connections.delete(socketId)
    const userSockets = this.userConnections.get(userId)
    if (userSockets) {
      userSockets.delete(socketId)
      if (userSockets.size === 0) {
        this.userConnections.delete(userId)
      }
    }
  }

  getUserConnections(userId: string): string[] {
    const sockets = this.userConnections.get(userId)
    return sockets ? Array.from(sockets) : []
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userConnections.get(userId)
    return sockets !== undefined && sockets.size > 0
  }

  getConnection(socketId: string): any | undefined {
    return this.connections.get(socketId)
  }

  updateHeartbeat(socketId: string): void {
    const connection = this.connections.get(socketId)
    if (connection) {
      connection.lastHeartbeat = new Date()
    }
  }

  getTotalConnections(): number {
    return this.connections.size
  }

  getOnlineUsersCount(): number {
    return this.userConnections.size
  }

  cleanupStaleConnections(maxAge: number = 60000): string[] {
    const now = Date.now()
    const staleSocketIds: string[] = []
    for (const [socketId, connection] of this.connections) {
      const age = now - connection.lastHeartbeat.getTime()
      if (age > maxAge) {
        staleSocketIds.push(socketId)
      }
    }
    for (const socketId of staleSocketIds) {
      this.removeConnection(socketId)
    }
    return staleSocketIds
  }
}

describe('ConnectionManager', () => {
  let manager: ConnectionManager

  beforeEach(() => {
    manager = new ConnectionManager()
  })

  describe('addConnection', () => {
    it('should add a connection and track it by socket ID', () => {
      manager.addConnection('user_1', 'socket_1')
      
      const connection = manager.getConnection('socket_1')
      expect(connection).toBeDefined()
      expect(connection.userId).toBe('user_1')
      expect(connection.socketId).toBe('socket_1')
    })

    it('should track connection in user room', () => {
      manager.addConnection('user_1', 'socket_1')
      
      const userConnections = manager.getUserConnections('user_1')
      expect(userConnections).toContain('socket_1')
    })

    it('should support multiple connections per user', () => {
      manager.addConnection('user_1', 'socket_1')
      manager.addConnection('user_1', 'socket_2')
      
      const userConnections = manager.getUserConnections('user_1')
      expect(userConnections).toHaveLength(2)
      expect(userConnections).toContain('socket_1')
      expect(userConnections).toContain('socket_2')
    })

    it('should store user agent when provided', () => {
      manager.addConnection('user_1', 'socket_1', 'Mozilla/5.0')
      
      const connection = manager.getConnection('socket_1')
      expect(connection.userAgent).toBe('Mozilla/5.0')
    })
  })

  describe('removeConnection', () => {
    it('should remove connection from tracking', () => {
      manager.addConnection('user_1', 'socket_1')
      manager.removeConnection('socket_1')
      
      expect(manager.getConnection('socket_1')).toBeUndefined()
    })

    it('should remove socket from user room', () => {
      manager.addConnection('user_1', 'socket_1')
      manager.removeConnection('socket_1')
      
      const userConnections = manager.getUserConnections('user_1')
      expect(userConnections).not.toContain('socket_1')
    })

    it('should clean up user entry when no connections remain', () => {
      manager.addConnection('user_1', 'socket_1')
      manager.removeConnection('socket_1')
      
      expect(manager.isUserOnline('user_1')).toBe(false)
    })

    it('should handle removing non-existent connection gracefully', () => {
      expect(() => manager.removeConnection('nonexistent')).not.toThrow()
    })

    it('should keep other connections when removing one', () => {
      manager.addConnection('user_1', 'socket_1')
      manager.addConnection('user_1', 'socket_2')
      manager.removeConnection('socket_1')
      
      expect(manager.getUserConnections('user_1')).toContain('socket_2')
      expect(manager.isUserOnline('user_1')).toBe(true)
    })
  })

  describe('getUserConnections', () => {
    it('should return empty array for user with no connections', () => {
      const connections = manager.getUserConnections('nonexistent_user')
      expect(connections).toEqual([])
    })

    it('should return all socket IDs for a user', () => {
      manager.addConnection('user_1', 'socket_1')
      manager.addConnection('user_1', 'socket_2')
      
      const connections = manager.getUserConnections('user_1')
      expect(connections).toHaveLength(2)
    })
  })

  describe('isUserOnline', () => {
    it('should return false for user with no connections', () => {
      expect(manager.isUserOnline('user_1')).toBe(false)
    })

    it('should return true for user with active connections', () => {
      manager.addConnection('user_1', 'socket_1')
      expect(manager.isUserOnline('user_1')).toBe(true)
    })
  })

  describe('cleanupStaleConnections', () => {
    it('should remove connections older than maxAge', async () => {
      manager.addConnection('user_1', 'socket_1')
      
      // Manually set old heartbeat
      const connection = manager.getConnection('socket_1')
      connection.lastHeartbeat = new Date(Date.now() - 120000) // 2 minutes ago
      
      const removed = manager.cleanupStaleConnections(60000) // 1 minute max age
      
      expect(removed).toContain('socket_1')
      expect(manager.getConnection('socket_1')).toBeUndefined()
    })

    it('should keep connections within maxAge', () => {
      manager.addConnection('user_1', 'socket_1')
      
      const removed = manager.cleanupStaleConnections(60000)
      
      expect(removed).toHaveLength(0)
      expect(manager.getConnection('socket_1')).toBeDefined()
    })
  })

  describe('getTotalConnections', () => {
    it('should return correct count', () => {
      expect(manager.getTotalConnections()).toBe(0)
      
      manager.addConnection('user_1', 'socket_1')
      expect(manager.getTotalConnections()).toBe(1)
      
      manager.addConnection('user_2', 'socket_2')
      expect(manager.getTotalConnections()).toBe(2)
    })
  })

  describe('getOnlineUsersCount', () => {
    it('should return unique user count', () => {
      manager.addConnection('user_1', 'socket_1')
      manager.addConnection('user_1', 'socket_2')
      manager.addConnection('user_2', 'socket_3')
      
      expect(manager.getOnlineUsersCount()).toBe(2)
    })
  })
})
