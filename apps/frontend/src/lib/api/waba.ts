const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

export interface PhoneNumberDetails {
  id: string
  phoneNumberId: string
  displayPhoneNumber: string
  verifiedName?: string
  qualityRating?: "GREEN" | "YELLOW" | "RED"
  messagingLimitTier?: string
  isVerified: boolean
  isPrimary: boolean
}

export const wabaApi = {
  async getPhoneNumbers(wabaId: string): Promise<PhoneNumberDetails[]> {
    const response = await fetch(`${API_URL}/api/v1/waba/${wabaId}/phone-numbers`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || "Failed to fetch phone numbers")
    }

    const result = await response.json()
    const data = result.data || []

    // Map backend response to frontend interface
    return data.map((item: any) => ({
      id: item.id,
      phoneNumberId: item.id, // Backend returns 'id' which is the phoneNumberId
      displayPhoneNumber: item.displayPhoneNumber,
      verifiedName: item.verifiedName,
      qualityRating: item.qualityRating,
      messagingLimitTier: item.messagingLimitTier,
      isVerified: item.isVerified,
      isPrimary: item.isPrimary,
    }))
  },

  async syncPhoneNumbers(wabaId: string): Promise<{
    phoneNumbers: PhoneNumberDetails[]
    added: number
    deleted: number
  }> {
    const response = await fetch(`${API_URL}/api/v1/waba/${wabaId}/phone-numbers/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || "Failed to sync phone numbers")
    }

    const result = await response.json()
    const data = result.data

    // Map phone numbers to match interface
    return {
      phoneNumbers: (data.phoneNumbers || []).map((item: any) => ({
        id: item.id,
        phoneNumberId: item.id,
        displayPhoneNumber: item.displayPhoneNumber,
        verifiedName: item.verifiedName,
        qualityRating: item.qualityRating,
        messagingLimitTier: item.messagingLimitTier,
        isVerified: item.isVerified,
        isPrimary: item.isPrimary,
      })),
      added: data.added || 0,
      deleted: data.deleted || 0,
    }
  },

  async disconnect(wabaId: string, reason?: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/waba/${wabaId}/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || "Failed to disconnect WABA")
    }
  },

  async refreshToken(wabaId: string): Promise<{ success: boolean; expiresAt: string }> {
    const response = await fetch(`${API_URL}/api/v1/waba/${wabaId}/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || "Failed to refresh token")
    }

    const result = await response.json()
    return result.data
  },
}

export function getTierInfo(tier?: string): { limit: string; color: string } {
  if (!tier) {
    return { limit: "Unknown", color: "text-gray-600" }
  }

  const tierMap: Record<string, { limit: string; color: string }> = {
    TIER_1K: { limit: "1,000", color: "text-blue-600" },
    TIER_10K: { limit: "10,000", color: "text-green-600" },
    TIER_100K: { limit: "100,000", color: "text-purple-600" },
    TIER_UNLIMITED: { limit: "Unlimited", color: "text-orange-600" },
  }

  // If it's a standard tier, return from map
  if (tierMap[tier]) {
    return tierMap[tier]
  }

  // Handle TIER_XXX format (e.g., "TIER_250", "TIER_1000")
  if (tier.startsWith("TIER_")) {
    const numberPart = tier.replace("TIER_", "")
    const numericTier = parseInt(numberPart)
    if (!isNaN(numericTier)) {
      return {
        limit: numericTier.toLocaleString(),
        color: "text-blue-600"
      }
    }
  }

  // If it's just a number (like "250"), format it with comma
  const numericTier = parseInt(tier)
  if (!isNaN(numericTier)) {
    return {
      limit: numericTier.toLocaleString(),
      color: "text-blue-600"
    }
  }

  // Fallback for unknown formats
  return { limit: tier, color: "text-gray-600" }
}
