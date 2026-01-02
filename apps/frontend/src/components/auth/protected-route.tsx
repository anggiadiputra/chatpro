"use client"

import { useEffect } from "react"
import { useRouter } from "@/i18n/routing"
import { useBusinessAccount } from "@/hooks/use-business-account"
import { RefreshCw } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { userId, isLoading: isLoadingAccount, isAuthenticated } = useBusinessAccount()

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isLoadingAccount && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoadingAccount, isAuthenticated, router])

  // Show loading spinner while checking authentication
  if (isLoadingAccount) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // User is authenticated, render children
  return <>{children}</>
}
