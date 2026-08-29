"use client"

import { Link } from "@/i18n/routing"
import { Sparkles, Check, Clock, Zap, ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section id="cta" className="relative pt-20 pb-28 sm:py-28 overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white scroll-mt-24">
      {/* Background Patterns & Floating Ornaments */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-dots" aria-hidden="true"></div>
      <div className="absolute top-10 left-10 w-36 h-36 border-4 border-white/20 rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-28 h-28 border-4 border-white/10 rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10 text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full mb-6 border border-white/30 text-xs sm:text-sm font-heading font-extrabold text-white">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Siap Melipatgandakan Omset Bisnis?</span>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-white mb-6 leading-tight">
          Siap Tingkatkan Customer Experience?
        </h2>

        {/* Paragraph */}
        <div className="space-y-2 mb-8 max-w-2xl mx-auto text-white/90 text-base sm:text-xl leading-relaxed">
          <p>
            Gabung bersama ribuan bisnis yang telah memudahkan tim CS mereka mengelola pesan WhatsApp dan Instagram.
          </p>
          <p className="font-semibold text-amber-200">
            Coba sekarang. Gak perlu kartu kredit. Setup dalam 5 menit.
          </p>
        </div>

        {/* Benefit Pills */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs sm:text-sm font-semibold">
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
            <span>Tanpa kartu kredit</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs sm:text-sm font-semibold">
            <Clock className="w-4 h-4 text-amber-300 stroke-[2.5]" />
            <span>Setup 5 menit</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs sm:text-sm font-semibold">
            <Zap className="w-4 h-4 text-yellow-300 stroke-[2.5]" />
            <span>Langsung produktif</span>
          </div>
        </div>

        {/* Big CTA Candy Button */}
        <div>
          <Link
            href="/register"
            className="inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 bg-white text-[#1E293B] font-heading font-extrabold text-lg sm:text-xl rounded-full border-2 border-[#1E293B] shadow-[6px_6px_0px_0px_#1E293B] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#1E293B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1E293B] transition-all duration-300"
          >
            <span>Mulai Sekarang Gratis</span>
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#22C55E] flex items-center justify-center text-white">
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </span>
          </Link>
        </div>

      </div>

      {/* Bottom Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" aria-hidden="true">
        <svg className="w-full h-12 sm:h-16 text-[#1E293B]" viewBox="0 0 1440 64" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,32 C360,64 720,0 1080,32 C1260,48 1380,48 1440,32 L1440,64 L0,64 Z" />
        </svg>
      </div>
    </section>
  )
}
