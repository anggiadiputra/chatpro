import { ReactNode } from "react"
import { MarketingHeader } from "@/components/marketing-header"

interface AuthContentProps {
  children: ReactNode
}

export function AuthContent({ children }: AuthContentProps) {
  return (
    <div className="min-h-svh bg-slate-50 text-slate-950">
      <MarketingHeader />
      <main className="flex min-h-svh items-center justify-center px-4 pb-12 pt-28 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
