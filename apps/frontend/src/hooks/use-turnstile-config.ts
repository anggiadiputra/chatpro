"use client"

import { useQuery } from "@tanstack/react-query"
import { getTurnstileConfig, type TurnstilePublicConfig } from "@/lib/api/turnstile-api"

export interface UseTurnstileConfigReturn {
  config: TurnstilePublicConfig
  enabled: boolean
  siteKey: string
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

const DEFAULT_CONFIG: TurnstilePublicConfig = {
  enabled: false,
  siteKey: "",
}

/**
 * Hook to fetch and cache public Turnstile configuration
 */
export function useTurnstileConfig(): UseTurnstileConfigReturn {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["turnstile-config"],
    queryFn: getTurnstileConfig,
    staleTime: 60 * 1000, // 60 seconds cache
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const config = data ?? DEFAULT_CONFIG

  return {
    config,
    enabled: !!(config.enabled && config.siteKey),
    siteKey: config.siteKey,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
