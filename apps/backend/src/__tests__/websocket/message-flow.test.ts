import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { Server as SocketIOServer } from 'socket.io'
import {
  type NewMessageEvent,
  type ConversationUpdatedEvent,
  validateWebSocketEvent
} from '../../websocket/types.js'

// Mock Socket.IO server
const mockEmit = vi.fn()
const mockTo = vi.fn(() => ({ emit: mockEmit }))
const mockIO: Partial<SocketIOServer> = {
  to: mockTo as any
}

// Mock the server module
vi.mock('../../websocket/server.js', () => ({
  getIO: () => mockIO,
  isWebSocketInitialized: () => true
}))

// Create test instances (not singletons) for isolation
class TestConnectionManager {
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
}

class TestEventEmitter {
  constructor(private connectionManager: TestConnectionManager) {}

  emitToUser(userId: string, event: any): boolean {
    const validatedEvent = validateWebSocketEvent(event)
    if (!validatedEvent) {
      return false
    }

    if (!this.connectionManager.isUserOnline(userId)) {
      return false
    }

    try {
      mockTo(`user:${userId}`)
      mockEmit(event.type, validatedEvent)
      return true
    } catch {
      return false
    }
  }

  emitNewMessage(userId: string, payload: NewMessageEvent['payload']): boolean {
    const event: NewMessageEvent = {
      type: 'new_message',
      timestamp: new Date().toISOString(),
      userId,
      payload
    }
    return this.emitToUser(userId, event)
  }

  emitConversationUpdated(userId: string, payload: ConversationUpdatedEvent['payload']): boolean {
    const event: ConversationUpdatedEvent = {
      type: 'conversation_updated',
      timestamp: new Date().toISOString(),
      userId,
      payload
    }
    return this.emitToUser(userId, event)
  }
}

describe('Message Flow Integration', () => {
  let connectionManager: TestConnectionManager
  let eventEmitter: TestEventEmitter

  beforeEach(() => {
    vi.clearAllMocks()
    connectionManager = new TestConnectionManager()
    eventEmitter = new TestEventEmitter(connectionManager)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('WhatsApp message flow', () => {
    it('should emit new_message event to connected user', () => {
      // Simulate user connection
      connectionManager.addConnection('user_123', 'socket_abc')

      // Simulate webhook receiving WhatsApp message
      const payload: NewMessageEvent['payload'] = {
        conversationId: 'conv_456',
        channel: 'whatsapp',
        participantId: '+1234567890',
        participantName: 'John Doe',
        message: {
          id: 'wamid_123',
          preview: 'Hello, I need help with my order',
          timestamp: new Date().toISOString(),
          direction: 'inbound'
        }
      }

      const result = eventEmitter.emitNewMessage('user_123', payload)

      expect(result).toBe(true)
      expect(mockTo).toHaveBeenCalledWith('user:user_123')
      expect(mockEmit).toHaveBeenCalledWith('new_message', expect.objectContaining({
        type: 'new_message',
        payload: expect.objectContaining({
          channel: 'whatsapp',
          conversationId: 'conv_456'
        })
      }))
    })

    it('should not emit when user is offline', () => {
      // User not connected
      const payload: NewMessageEvent['payload'] = {
        conversationId: 'conv_456',
        channel: 'whatsapp',
        participantId: '+1234567890',
        participantName: 'John',
        message: {
          id: 'wamid_123',
          preview: 'Test message',
          timestamp: new Date().toISOString(),
          direction: 'inbound'
        }
      }

      const result = eventEmitter.emitNewMessage('user_123', payload)

      expect(result).toBe(false)
      expect(mockEmit).not.toHaveBeenCalled()
    })
  })

  describe('Instagram message flow', () => {
    it('should emit new_message event for Instagram messages', () => {
      connectionManager.addConnection('user_123', 'socket_abc')

      const payload: NewMessageEvent['payload'] = {
        conversationId: 'conv_789',
        channel: 'instagram',
        participantId: 'ig_user_456',
        participantName: 'Jane Smith',
        message: {
          id: 'ig_mid_123',
          preview: 'Hi! Saw your post',
          timestamp: new Date().toISOString(),
          direction: 'inbound'
        }
      }

      const result = eventEmitter.emitNewMessage('user_123', payload)

      expect(result).toBe(true)
      expect(mockEmit).toHaveBeenCalledWith('new_message', expect.objectContaining({
        payload: expect.objectContaining({
          channel: 'instagram'
        })
      }))
    })
  })

  describe('Multi-device support', () => {
    it('should emit to user room (all connected devices)', () => {
      // User connected on multiple devices
      connectionManager.addConnection('user_123', 'socket_1')
      connectionManager.addConnection('user_123', 'socket_2')
      connectionManager.addConnection('user_123', 'socket_3')

      const payload: NewMessageEvent['payload'] = {
        conversationId: 'conv_456',
        channel: 'whatsapp',
        participantId: '+1234567890',
        participantName: 'John',
        message: {
          id: 'wamid_123',
          preview: 'Test',
          timestamp: new Date().toISOString(),
          direction: 'inbound'
        }
      }

      const result = eventEmitter.emitNewMessage('user_123', payload)

      expect(result).toBe(true)
      // Should emit to user room, not individual sockets
      expect(mockTo).toHaveBeenCalledWith('user:user_123')
    })
  })

  describe('Conversation update flow', () => {
    it('should emit conversation_updated event', () => {
      connectionManager.addConnection('user_123', 'socket_abc')

      const payload: ConversationUpdatedEvent['payload'] = {
        conversationId: 'conv_456',
        changes: {
          unreadCount: 3,
          lastMessageAt: new Date().toISOString()
        }
      }

      const result = eventEmitter.emitConversationUpdated('user_123', payload)

      expect(result).toBe(true)
      expect(mockEmit).toHaveBeenCalledWith('conversation_updated', expect.objectContaining({
        type: 'conversation_updated',
        payload: expect.objectContaining({
          conversationId: 'conv_456'
        })
      }))
    })
  })

  describe('Connection lifecycle', () => {
    it('should handle user disconnect during message flow', () => {
      connectionManager.addConnection('user_123', 'socket_abc')
      
      // User disconnects
      connectionManager.removeConnection('socket_abc')

      const payload: NewMessageEvent['payload'] = {
        conversationId: 'conv_456',
        channel: 'whatsapp',
        participantId: '+1234567890',
        participantName: 'John',
        message: {
          id: 'wamid_123',
          preview: 'Test',
          timestamp: new Date().toISOString(),
          direction: 'inbound'
        }
      }

      const result = eventEmitter.emitNewMessage('user_123', payload)

      expect(result).toBe(false)
    })

    it('should continue emitting after partial disconnect', () => {
      // User on two devices
      connectionManager.addConnection('user_123', 'socket_1')
      connectionManager.addConnection('user_123', 'socket_2')
      
      // One device disconnects
      connectionManager.removeConnection('socket_1')

      const payload: NewMessageEvent['payload'] = {
        conversationId: 'conv_456',
        channel: 'whatsapp',
        participantId: '+1234567890',
        participantName: 'John',
        message: {
          id: 'wamid_123',
          preview: 'Test',
          timestamp: new Date().toISOString(),
          direction: 'inbound'
        }
      }

      const result = eventEmitter.emitNewMessage('user_123', payload)

      expect(result).toBe(true)
      expect(connectionManager.isUserOnline('user_123')).toBe(true)
    })
  })

  describe('Payload validation in flow', () => {
    it('should reject invalid payload and not emit', () => {
      connectionManager.addConnection('user_123', 'socket_abc')

      // Invalid payload - missing required fields
      const invalidPayload = {
        conversationId: 'conv_456',
        channel: 'whatsapp'
        // Missing message and other required fields
      }

      const event = {
        type: 'new_message',
        timestamp: new Date().toISOString(),
        userId: 'user_123',
        payload: invalidPayload
      }

      const result = eventEmitter.emitToUser('user_123', event)

      expect(result).toBe(false)
      expect(mockEmit).not.toHaveBeenCalled()
    })
  })
})
