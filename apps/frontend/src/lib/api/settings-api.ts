const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005').replace(/\/api\/v1?$/, '')

const buildApiUrl = (path: string) => `${API_BASE_URL}/api/v1${path.startsWith('/') ? path : `/${path}`}`

export const settingsApi = {
    async getProfile() {
        const response = await fetch(buildApiUrl('/settings/profile'), {
            method: 'GET',
            credentials: 'include',
        })

        const result = await response.json()

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch profile')
        }

        return result.data
    },

    async updateProfile(data: { name: string; email?: string }) {
        const response = await fetch(buildApiUrl('/settings/profile'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!result.success) {
            const errorMessage = result.error?.details
                ? result.error.details.map((d: any) => d.message).join(', ')
                : result.error?.message || 'Failed to update profile'
            throw new Error(errorMessage)
        }

        return result
    },

    async changePassword(data: {
        currentPassword: string
        newPassword: string
        confirmPassword: string
    }) {
        const response = await fetch(buildApiUrl('/settings/password'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!result.success) {
            const errorMessage = result.error?.details
                ? result.error.details.map((d: any) => d.message).join(', ')
                : result.error?.message || 'Failed to change password'
            throw new Error(errorMessage)
        }

        return result
    },
}
