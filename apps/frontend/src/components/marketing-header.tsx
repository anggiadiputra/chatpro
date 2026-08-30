"use client"

import { useState } from "react"
import Image from "next/image"
import { Link, usePathname } from "@/i18n/routing"
import { LogIn, Menu, MessageSquareText, X } from "lucide-react"
import { useBranding } from "@/hooks/use-branding"
import { useScroll } from "@/hooks/use-scroll"
import { cn } from "@/lib/utils"

const navigation = [
  { href: "/", label: "Home" },
  { href: "/#templates", label: "Templates" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#features", label: "Features" },
] as const

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
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
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-950"
            onClick={() => setMenuOpen(false)}
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

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
            {navigation.map((item) => {
              const active = item.href === "/" && pathname === "/"
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "text-base font-medium text-slate-900 transition-colors hover:text-blue-600",
                    active && "text-blue-600",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-4 md:flex">
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
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-md text-slate-900 hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-5 shadow-lg md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-2.5 font-medium text-slate-900 hover:bg-slate-50 hover:text-blue-600"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-100 text-sm font-semibold text-slate-900"
                onClick={() => setMenuOpen(false)}
              >
                <LogIn className="size-4" />
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 text-sm font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}