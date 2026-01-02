import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  validateWebSocketEvent,
  getValidationErrors,
  type NewMessageEvent,
  type ConversationUpdatedEvent,
  type MessageStatusEvent,
  type TypingIndicatorEvent,
  type AssignmentChangedEvent
} from '../../websocket/types.js'

describe('EventEmitter - Payload Validation', () => {
  describe('validateWebSocketEvent', () => {
    describe('new_message event', () => {
      it('should validate a correct new_message event', () => {
        const event: NewMessageEvent = {
          type: 'new_message',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            channel: 'whatsapp',
            participantId: 'participant_123',
            participantName: 'John Doe',
            message: {
              id: 'msg_123',
              preview: 'Hello, how can I help?',
              timestamp: new Date().toISOString(),
              direction: 'inbound'
            }
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).not.toBeNull()
        expect(result?.type).toBe('new_message')
      })

      it('should allow null participantName', () => {
        const event: NewMessageEvent = {
          type: 'new_message',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            channel: 'instagram',
            participantId: 'participant_123',
            participantName: null,
            message: {
              id: 'msg_123',
              preview: 'Test message',
              timestamp: new Date().toISOString(),
              direction: 'inbound'
            }
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).not.toBeNull()
      })

      it('should reject event with missing conversationId', () => {
        const event = {
          type: 'new_message',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            channel: 'whatsapp',
            participantId: 'participant_123',
            participantName: 'John',
            message: {
              id: 'msg_123',
              preview: 'Test',
              timestamp: new Date().toISOString(),
              direction: 'inbound'
            }
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).toBeNull()
      })

      it('should reject event with invalid channel', () => {
        const event = {
          type: 'new_message',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            channel: 'telegram', // Invalid channel
            participantId: 'participant_123',
            participantName: 'John',
            message: {
              id: 'msg_123',
              preview: 'Test',
              timestamp: new Date().toISOString(),
              direction: 'inbound'
            }
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).toBeNull()
      })
    })

    describe('conversation_updated event', () => {
      it('should validate a correct conversation_updated event', () => {
        const event: ConversationUpdatedEvent = {
          type: 'conversation_updated',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            changes: {
              unreadCount: 5,
              lastMessageAt: new Date().toISOString()
            }
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).not.toBeNull()
        expect(result?.type).toBe('conversation_updated')
      })

      it('should allow partial changes object', () => {
        const event: ConversationUpdatedEvent = {
          type: 'conversation_updated',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            changes: {
              isWindowActive: true
            }
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).not.toBeNull()
      })
    })

    describe('message_status event', () => {
      it('should validate a correct message_status event', () => {
        const event: MessageStatusEvent = {
          type: 'message_status',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            messageId: 'msg_123',
            conversationId: 'conv_123',
            status: 'delivered'
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).not.toBeNull()
        expect(result?.type).toBe('message_status')
      })

      it('should reject invalid status value', () => {
        const event = {
          type: 'message_status',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            messageId: 'msg_123',
            conversationId: 'conv_123',
            status: 'pending' // Invalid status
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).toBeNull()
      })
    })

    describe('typing_indicator event', () => {
      it('should validate a correct typing_indicator event', () => {
        const event: TypingIndicatorEvent = {
          type: 'typing_indicator',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            isTyping: true
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).not.toBeNull()
        expect(result?.type).toBe('typing_indicator')
      })
    })

    describe('assignment_changed event', () => {
      it('should validate a correct assignment_changed event for assignment', () => {
        const event: AssignmentChangedEvent = {
          type: 'assignment_changed',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            conversationType: 'whatsapp',
            assigneeId: 'agent_456',
            assigneeName: 'John Agent',
            assignedById: 'owner_789',
            action: 'assigned'
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).not.toBeNull()
        expect(result?.type).toBe('assignment_changed')
      })

      it('should validate a correct assignment_changed event for unassignment', () => {
        const event: AssignmentChangedEvent = {
          type: 'assignment_changed',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            conversationType: 'instagram',
            assigneeId: null,
            assigneeName: null,
            assignedById: 'owner_789',
            action: 'unassigned'
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).not.toBeNull()
        expect(result?.type).toBe('assignment_changed')
      })

      it('should reject event with invalid conversationType', () => {
        const event = {
          type: 'assignment_changed',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            conversationType: 'telegram', // Invalid
            assigneeId: 'agent_456',
            assigneeName: 'John Agent',
            assignedById: 'owner_789',
            action: 'assigned'
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).toBeNull()
      })

      it('should reject event with invalid action', () => {
        const event = {
          type: 'assignment_changed',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            conversationType: 'whatsapp',
            assigneeId: 'agent_456',
            assigneeName: 'John Agent',
            assignedById: 'owner_789',
            action: 'reassigned' // Invalid
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).toBeNull()
      })

      it('should reject event with missing assignedById', () => {
        const event = {
          type: 'assignment_changed',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            conversationType: 'whatsapp',
            assigneeId: 'agent_456',
            assigneeName: 'John Agent',
            action: 'assigned'
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).toBeNull()
      })
    })

    describe('invalid events', () => {
      it('should reject event with unknown type', () => {
        const event = {
          type: 'unknown_event',
          timestamp: new Date().toISOString(),
          userId: 'user_123',
          payload: {}
        }

        const result = validateWebSocketEvent(event)
        expect(result).toBeNull()
      })

      it('should reject event with missing userId', () => {
        const event = {
          type: 'new_message',
          timestamp: new Date().toISOString(),
          payload: {
            conversationId: 'conv_123',
            channel: 'whatsapp',
            participantId: 'p_123',
            participantName: 'John',
            message: {
              id: 'msg_123',
              preview: 'Test',
              timestamp: new Date().toISOString(),
              direction: 'inbound'
            }
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).toBeNull()
      })

      it('should reject event with invalid timestamp format', () => {
        const event = {
          type: 'new_message',
          timestamp: 'invalid-date',
          userId: 'user_123',
          payload: {
            conversationId: 'conv_123',
            channel: 'whatsapp',
            participantId: 'p_123',
            participantName: 'John',
            message: {
              id: 'msg_123',
              preview: 'Test',
              timestamp: new Date().toISOString(),
              direction: 'inbound'
            }
          }
        }

        const result = validateWebSocketEvent(event)
        expect(result).toBeNull()
      })
    })
  })

  describe('getValidationErrors', () => {
    it('should return empty array for valid event', () => {
      const event: NewMessageEvent = {
        type: 'new_message',
        timestamp: new Date().toISOString(),
        userId: 'user_123',
        payload: {
          conversationId: 'conv_123',
          channel: 'whatsapp',
          participantId: 'p_123',
          participantName: 'John',
          message: {
            id: 'msg_123',
            preview: 'Test',
            timestamp: new Date().toISOString(),
            direction: 'inbound'
          }
        }
      }

      const errors = getValidationErrors(event)
      expect(errors).toEqual([])
    })

    it('should return error messages for invalid event', () => {
      const event = {
        type: 'new_message',
        timestamp: new Date().toISOString(),
        userId: 'user_123',
        payload: {
          // Missing required fields
        }
      }

      const errors = getValidationErrors(event)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should include path information in error messages', () => {
      const event = {
        type: 'new_message',
        timestamp: new Date().toISOString(),
        userId: 'user_123',
        payload: {
          conversationId: '', // Empty string should fail min(1)
          channel: 'whatsapp',
          participantId: 'p_123',
          participantName: 'John',
          message: {
            id: 'msg_123',
            preview: 'Test',
            timestamp: new Date().toISOString(),
            direction: 'inbound'
          }
        }
      }

      const errors = getValidationErrors(event)
      expect(errors.some(e => e.includes('conversationId'))).toBe(true)
    })
  })
})
