"use client"

import { useState, useEffect, useCallback } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

interface DatabaseHealth {
  status: "healthy" | "unhealthy"
  latencyMs: number
  error?: string
}

interface RedisHealth {
  status: "healthy" | "unhealthy"
  latencyMs: number
  error?: string
}

interface QueueStats {
  pending: number
  active: number
  completed: number
  failed: number
  delayed: number
  byQueue: {
    webhook: { pending: number; active: number; completed: number; failed: number }
    message: { pending: number; active: number; completed: number; failed: number }
    webhookOutbound: { pending: number; active: number; completed: number; failed: number }
  }
}

interface WebsocketStats {
  activeConnections: number
  onlineUsers: number
}

interface WebhookStats {
  successRate24h: number
  totalDeliveries24h: number
  successCount24h: number
  failedCount24h: number
}

export interface SystemHealth {
  database: DatabaseHealth
  redis: RedisHealth
  queue: QueueStats
  websocket: WebsocketStats
  webhooks: WebhookStats
  overall: "healthy" | "degraded" | "unhealthy"
}

interface UseAdminHealthReturn {
  health: SystemHealth | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAdminHealth(): UseAdminHealthReturn {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/api/v1/admin/health`, {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You don't have permission to access system health")
        }
        throw new Error("Failed to fetch system health")
      }

      const data = await response.json()

      if (data.success && data.data) {
        setHealth(data.data)
      } else {
        throw new Error(data.error?.message || "Failed to fetch system health")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  return {
    health,
    isLoading,
    error,
    refetch: fetchHealth,
  }
}
