"use client"

import { Link } from "@/i18n/routing"
import { ArrowRight, Check, MessageCircle, X, Sparkles, Bot, Users, ShieldCheck } from "lucide-react"

export function HeroSection() {
  const handleScrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const element = document.getElementById("features")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      window.history.pushState(null, "", "#features")
    }
  }

  return (
    <section id="hero" className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-[#FAFBFC] scroll-mt-24">
      {/* Background Glows & Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 left-10 w-80 h-80 bg-[#22C55E]/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-24 right-10 w-64 h-64 bg-[#DB2777]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-10 left-1/3 w-56 h-56 bg-[#F59E0B]/10 rounded-full blur-2xl"></div>
        <div className="absolute inset-0 bg-dots opacity-40"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Copywriting & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Price Badge */}
            <div className="badge-pill bg-[#DCFCE7] border-[#1E293B]">
              <MessageCircle className="w-4 h-4 text-[#22C55E] fill-[#22C55E]/20" />
              <span className="text-[#1E293B] font-bold text-xs sm:text-sm">Harga Mulai 25rb/Bulan</span>
            </div>

            {/* Headline with Brand Icons */}
            <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-heading font-extrabold text-[#1E293B] leading-[1.3] tracking-tight">
              <span>Kelola</span>{" "}
              <span className="inline-flex items-center gap-1.5 sm:gap-2 align-middle mx-1 sm:mx-1.5">
                {/* WhatsApp Icon */}
                <span
                  title="WhatsApp"
                  className="w-9 h-9 sm:w-11 sm:h-11 bg-[#25D366] text-white rounded-xl border-2 border-[#1E293B] shadow-[2px_2px_0px_#1E293B] inline-flex items-center justify-center wiggle-hover"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </span>
                {/* Instagram Icon */}
                <span
                  title="Instagram"
                  className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white rounded-xl border-2 border-[#1E293B] shadow-[2px_2px_0px_#1E293B] inline-flex items-center justify-center wiggle-hover"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </span>
                {/* Messenger Icon */}
                <span
                  title="Messenger"
                  className="w-9 h-9 sm:w-11 sm:h-11 bg-[#0084FF] text-white rounded-xl border-2 border-[#1E293B] shadow-[2px_2px_0px_#1E293B] inline-flex items-center justify-center wiggle-hover"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 4.975-12 11.111 0 3.497 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111 0-6.136-5.373-11.111-12-11.111zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/>
                  </svg>
                </span>
              </span>
              <span className="block mt-2 sm:mt-3">
                dalam{" "}
                <span className="highlight-primary whitespace-nowrap shadow-[2px_2px_0px_#1E293B] border-2 border-[#1E293B]">
                  Satu Platform
                </span>
              </span>
            </h1>

            {/* Intro Copy */}
            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
              Bisnis kamu punya banyak channel komunikasi?{" "}
              <strong className="text-[#1E293B]">WhatsApp, Instagram DM, FB Messenger, semuanya berantakan?</strong> Saatnya satukan semuanya dalam satu inbox terpadu.
            </p>

            {/* Problems Checklist */}
            <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#E2E8F0] space-y-2.5">
              <p className="font-bold text-sm text-[#1E293B]">Masalah yang sering dialami tim:</p>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-red-100 border border-red-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 text-red-600 stroke-[3]" />
                  </span>
                  <span>Chat WhatsApp, Instagram, dan Messenger terpisah & ribet bolak-balik.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-red-100 border border-red-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 text-red-600 stroke-[3]" />
                  </span>
                  <span>Tim CS kewalahan handle ribuan chat sekaligus tanpa otomasi AI.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-red-100 border border-red-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 text-red-600 stroke-[3]" />
                  </span>
                  <span>Data pelanggan tersebar, follow-up lambat, dan kehilangan closing order.</span>
                </li>
              </ul>
            </div>

            {/* Conclusion Hook */}
            <p className="text-sm sm:text-base text-[#1E293B] font-medium">
              Hasilnya? Respon lambat, pelanggan kabur.{" "}
              <span className="highlight-yellow font-bold">Bisnis kehilangan peluang setiap hari.</span>
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link href="/register" className="btn-candy text-base !py-3 !px-6">
                <span>Coba Sekarang Gratis</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Link>
              <a
                href="#features"
                onClick={handleScrollToFeatures}
                className="btn-outline-chunky text-base !py-3 !px-6"
              >
                Lihat Fitur Lengkap
              </a>
            </div>

            {/* Trust Partner */}
            <div className="flex items-center gap-3 pt-2">
              <img
                src="/meta-partner.webp"
                alt="Official Meta Business Partner"
                className="h-10 sm:h-11 w-auto hover:scale-105 transition-transform"
              />
              <span className="text-xs text-[#64748B] font-bold">• Support Lokal Indonesia</span>
            </div>
          </div>

          {/* Right Column: Dashboard Mockup Card */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            {/* Mockup Container */}
            <div className="relative border-2 border-[#1E293B] rounded-2xl overflow-hidden shadow-pop-lg bg-white transform -rotate-1 hover:rotate-0 transition-transform duration-500">
              
              {/* Window Header */}
              <div className="bg-slate-100 border-b-2 border-[#1E293B] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400 border border-[#1E293B]"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-400 border border-[#1E293B]"></span>
                  <span className="w-3 h-3 rounded-full bg-green-400 border border-[#1E293B]"></span>
                </div>
                <span className="text-xs font-bold text-[#64748B]">ProChat - Unified Inbox</span>
                <div className="w-10"></div>
              </div>

              {/* Mockup Body: Inbox Layout */}
              <div className="p-4 sm:p-5 space-y-4 bg-slate-50">
                {/* Search & Channel Filters */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-[#22C55E] text-white rounded-md">All (24)</span>
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-white text-slate-600 border border-slate-300 rounded-md">WA (18)</span>
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-white text-slate-600 border border-slate-300 rounded-md">IG (6)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#22C55E] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span> Live 24/7
                  </span>
                </div>

                {/* Chat Preview Item 1 (WhatsApp) */}
                <div className="bg-white p-3 rounded-xl border-2 border-[#1E293B] shadow-[2px_2px_0px_#1E293B] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#25D366] text-white rounded-lg flex items-center justify-center text-xs font-bold">
                        WA
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1E293B]">Budi Santoso</p>
                        <p className="text-[10px] text-[#64748B]">+62 812-3456-7890</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#22C55E] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Auto-Replied by AI
                    </span>
                  </div>
                  <div className="bg-emerald-50/70 p-2.5 rounded-lg text-xs text-slate-700 space-y-1">
                    <p className="text-[11px] font-semibold text-[#16A34A]">🤖 ProChat AI:</p>
                    <p className="text-[11px] leading-relaxed">
                      &quot;Halo Kak Budi! Paket Pro sudah aktif ya. Ada yang bisa kami bantu lagi?&quot;
                    </p>
                  </div>
                </div>

                {/* Chat Preview Item 2 (Instagram DM) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1.5 opacity-90">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white rounded-lg flex items-center justify-center text-xs font-bold">
                        IG
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1E293B]">@clarashop_id</p>
                        <p className="text-[10px] text-[#64748B]">Instagram DM</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">1m ago</span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate pl-9">
                    &quot;Kak, mau tanya integrasi n8n webhook-nya...&quot;
                  </p>
                </div>

                {/* Quick Action Badges Inside Mock */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] text-[#64748B]">Kecepatan Respon</p>
                    <p className="text-sm font-extrabold text-[#1E293B]">&lt; 3 Detik ⚡</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] text-[#64748B]">Status Layanan</p>
                    <p className="text-sm font-extrabold text-[#22C55E]">100% Online</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge Stickers */}
            <div className="absolute -top-4 -right-3 sm:-right-4 px-3.5 py-1.5 bg-[#DB2777] text-white border-2 border-[#1E293B] rounded-full shadow-pop text-xs font-extrabold flex items-center gap-1.5 animate-float">
              <Bot className="w-3.5 h-3.5" />
              <span>AI Chatbot 24/7</span>
            </div>

            <div className="absolute -bottom-4 -left-3 sm:-left-4 px-3.5 py-1.5 bg-[#F59E0B] text-[#1E293B] border-2 border-[#1E293B] rounded-full shadow-pop text-xs font-extrabold flex items-center gap-1.5 animate-float" style={{ animationDelay: "1.5s" }}>
              <Users className="w-3.5 h-3.5" />
              <span>Multi-Agent Support</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
