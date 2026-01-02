declare module "better-auth/types" {
  interface User {
    role?: string | null
    wabaId?: string | null
    phoneNumberId?: string | null
    wabaConnectionStatus?: string | null
    subscription?: {
      tier: "FREE" | "LITE" | "PRO"
      status: string
      endDate: Date | null
    }
  }
}

export {}
