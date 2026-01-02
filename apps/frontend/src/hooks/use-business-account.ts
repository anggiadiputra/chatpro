import { useSession } from "@/lib/auth-client"

// Extended user type with custom properties
type ExtendedUser = {
    id: string
    email: string
    name: string
    image?: string | null
    role?: string | null
    wabaId?: string | null
    phoneNumberId?: string | null
    wabaConnectionStatus?: string | null
    [key: string]: any
}

/**
 * Custom hook to get user and WABA information from session
 * Note: BusinessAccount concept removed - all data now on User
 */
export function useBusinessAccount() {
    const { data: session, isPending } = useSession()
    const user = session?.user as ExtendedUser | undefined

    return {
        // User info
        userId: user?.id || null,
        userEmail: user?.email || null,
        userName: user?.name || null,
        userImage: user?.image || null,
        userRole: user?.role || null,

        // WABA data (now directly on user)
        wabaId: user?.wabaId || null,
        phoneNumberId: user?.phoneNumberId || null,
        wabaConnectionStatus: user?.wabaConnectionStatus || null,

        // Loading states
        isLoading: isPending,
        isAuthenticated: !!user,

        // Helper to check if WABA is connected
        hasWABA: !!user?.wabaId,
        isWABAConnected: user?.wabaConnectionStatus === 'connected',

        // Full session for advanced use
        session
    }
}

/**
 * Type guard to ensure WABA is connected
 */
export function requireWABA(wabaId: string | null): asserts wabaId is string {
    if (!wabaId) {
        throw new Error('WhatsApp Business Account not connected. Please connect your WABA first.')
    }
}
