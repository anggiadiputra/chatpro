"use client"

import Image from "next/image"
import { Link } from "@/i18n/routing"
import { LogIn, MessageSquareText } from "lucide-react"
import { useBranding } from "@/hooks/use-branding"
import { useScroll } from "@/hooks/use-scroll"
import { cn } from "@/lib/utils"

export function MarketingHeader() {
  const scrolled = useScroll(8)
  const { websiteName, logoUrl } = useBranding()

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-200",
        scrolled && "border-b border-slate-200/80 bg-white/90 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link
            href="/login"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-950"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                width={28}
                height={28}
                className="size-7 object-contain"
              />
            ) : (
              <MessageSquareText className="size-7 text-blue-600" strokeWidth={2.2} />
            )}
            <span>
              {websiteName || process.env.NEXT_PUBLIC_APP_NAME || "App"}
              <span className="text-blue-600">.</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200"
          >
            <LogIn className="size-4" />
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Daftar
          </Link>
        </div>
      </div>
    </header>
  )
}