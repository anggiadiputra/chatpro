"use client"

import { useState, useEffect } from "react"
import { Link } from "@/i18n/routing"
import { MessageSquare } from "lucide-react"

export function Navbar() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY < 100) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false) // scrolling down -> hide
      } else {
        setIsVisible(true) // scrolling up -> show
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      window.history.pushState(null, "", `#${targetId}`)
    }
  }

  return (
    <header
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-[92%] max-w-5xl ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"
      }`}
    >
      <nav className="flex items-center justify-between px-3 py-2 sm:px-4 bg-white/95 backdrop-blur-md border-2 border-[#1E293B] rounded-full shadow-pop">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 px-2 py-1 font-heading font-extrabold text-[#1E293B] hover:text-[#22C55E] transition-colors"
          aria-label="ProChat Home"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#22C55E] border-2 border-[#1E293B] rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#1E293B]">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight">ProChat</span>
        </Link>

        {/* Navigation Anchors - Desktop */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          <a
            href="#features"
            onClick={(e) => handleScrollTo(e, "features")}
            className="px-3 py-1.5 text-sm font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors rounded-full hover:bg-slate-100"
          >
            Fitur
          </a>
          <a
            href="#integration"
            onClick={(e) => handleScrollTo(e, "integration")}
            className="px-3 py-1.5 text-sm font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors rounded-full hover:bg-slate-100"
          >
            Integrasi
          </a>
          <a
            href="#coexistence"
            onClick={(e) => handleScrollTo(e, "coexistence")}
            className="px-3 py-1.5 text-sm font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors rounded-full hover:bg-slate-100"
          >
            Coexistence
          </a>
          <a
            href="#pricing"
            onClick={(e) => handleScrollTo(e, "pricing")}
            className="px-3 py-1.5 text-sm font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors rounded-full hover:bg-slate-100"
          >
            Harga
          </a>
          <a
            href="#faq"
            onClick={(e) => handleScrollTo(e, "faq")}
            className="px-3 py-1.5 text-sm font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors rounded-full hover:bg-slate-100"
          >
            FAQ
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-[#1E293B] hover:text-[#22C55E] transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="btn-candy !py-1.5 !px-3.5 sm:!px-5 text-xs sm:text-sm"
          >
            Daftar
          </Link>
        </div>
      </nav>
    </header>
  )
}
