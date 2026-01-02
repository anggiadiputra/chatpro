const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'

interface SendMessageRequest {
    userId: string
    customerId?: string
    phoneNumber?: string
    type: 'text' | 'template' | 'image' | 'document' | 'interactive'
    text?: {
        body: string
        preview_url?: boolean
    }
    template?: {
        name: string
        language: { code: string }
        components?: any[]
    }
    variableValues?: Record<string, string>
    image?: {
        link?: string
        caption?: string
    }
    document?: {
        link: string
        filename?: string
        caption?: string
    }
    interactive?: {
        type: 'cta_url' | 'button' | 'list'
        header?: {
            type: 'text' | 'image'
            text?: string
            image?: { link?: string; id?: string }
        }
        body: { text: string }
        footer?: { text: string }
        action: {
            name?: 'cta_url'
            parameters?: {
                display_text: string
                url: string
            }
            buttons?: Array<{
                type: 'reply'
                reply: {
                    id: string
                    title: string
                }
            }>
        }
    }
}

/**
 * Response type for GET /messages endpoint
 * Includes unreadCounts per customer for WhatsApp unread tracking
 * Requirements: 5.1
 */
export interface MessagesListResponse {
    success: boolean
    data: Message[]
    /** Unread counts per customer ID - count of INBOUND messages with status NOT READ */
    unreadCounts: Record<string, number>
    /** Assignment data per customer ID (conversationId) - supports both HUMAN and AI_AGENT types */
    assignments: Record<string, {
        assigneeId: string | null
        assigneeName: string | null
        assigneeImage: string | null
        assigneeType: 'HUMAN' | 'AI_AGENT'
        aiAgentId: string | null
        aiAgentName: string | null
        assignedAt: string
    }>
}

/**
 * Message type from the API response
 */
export interface Message {
    id: string
    waMessageId?: string
    userId: string
    customerId: string
    direction: 'INBOUND' | 'OUTBOUND'
    type: string
    content: string
    status: string
    timestamp: string
    customer?: {
        id: string
        phoneNumber: string
        name?: string
    }
    user?: {
        id: string
        name: string
        email: string
    }
    template?: {
        id: string
        templateName: string
        category: string
    }
}

/**
 * Response type for POST /messages/read endpoint
 * Requirements: 2.1, 2.2
 */
export interface MarkAsReadResponse {
    success: boolean
    message?: string
    updatedCount?: number
    unreadCount?: number
    error?: string
}

export const messagesApi = {
    async getMessages(userId?: string, customerId?: string): Promise<MessagesListResponse> {
        const params = new URLSearchParams()
        if (userId) params.append('userId', userId)
        if (customerId) params.append('customerId', customerId)

        // Send cookies directly, Better Auth will handle session
        const response = await fetch(`${API_URL}/api/v1/messages?${params}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // This sends cookies automatically
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            console.error('API Error:', error)
            throw new Error(error.error?.message || 'Failed to fetch messages')
        }

        const result = await response.json()
        
        // Ensure unreadCounts and assignments are always present (backward compatibility)
        return {
            success: result.success,
            data: result.data || [],
            unreadCounts: result.unreadCounts || {},
            assignments: result.assignments || {}
        }
    },

    async sendMessage(data: SendMessageRequest) {
        // Send cookies directly, Better Auth will handle session
        const response = await fetch(`${API_URL}/api/v1/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // This sends cookies automatically
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            console.error('API Error:', error)
            throw new Error(error.error?.message || 'Failed to send message')
        }

        return response.json()
    },

    /**
     * Mark messages from a customer as read
     * Called when user opens a chat in the inbox
     * Requirements: 2.1, 2.2
     */
    async markAsRead(customerId: string): Promise<MarkAsReadResponse> {
        const response = await fetch(`${API_URL}/api/v1/messages/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ customerId }),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            console.error('Mark as read error:', error)
            // Don't throw - this is a non-critical operation
            return { success: false, error: error.error?.message }
        }

        return response.json()
    },
}
