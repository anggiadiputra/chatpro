"use client"

import { LogIn, Link2, Sparkles, ArrowRight } from "lucide-react"

export function SolutionFlow() {
  return (
    <section id="solution" className="py-16 sm:py-24 relative overflow-hidden bg-white border-y-2 border-[#1E293B] scroll-mt-24">
      {/* Background Dots Pattern & Floating Shapes */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute top-12 right-12 w-16 h-16 border-4 border-[#DB2777]/20 rounded-full animate-float pointer-events-none"></div>
      <div className="absolute bottom-16 left-8 w-12 h-12 bg-[#F59E0B]/20 rounded-xl rotate-45 animate-float pointer-events-none" style={{ animationDelay: "1s" }}></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#1E293B] mb-4">
            Solusinya ProChat.{" "}
            <span className="inline-block w-3.5 h-3.5 bg-[#22C55E] rounded-full ml-1 align-baseline border border-[#1E293B]"></span>
          </h2>
          <p className="text-base sm:text-xl text-[#64748B] leading-relaxed">
            Platform <span className="font-bold text-[#1E293B] underline decoration-[#22C55E] decoration-wavy">omnichannel CRM</span> yang menyatukan semua channel komunikasi kamu.
          </p>
          <p className="text-sm sm:text-lg text-[#64748B] leading-relaxed mt-2">
            Mulai dari <strong className="text-[#1E293B] bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300">Rp25 ribu</strong>, ProChat bantu tim kamu kerja lebih cepat dan pelanggan dapat respons lebih rapi.
          </p>
        </div>

        {/* 3-Step Animated Flow Diagram */}
        <div className="max-w-4xl mx-auto relative mb-16">
          {/* Badge: Setup 5 Menit */}
          <div className="absolute -top-4 left-6 sm:left-10 z-20 badge-pill bg-[#22C55E] text-white border-2 border-[#1E293B] shadow-pop text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-white" />
            <span>Setup 5 Menit Selesai</span>
          </div>

          {/* Card Container */}
          <div className="relative bg-[#FAFBFC] border-2 border-[#1E293B] rounded-3xl shadow-pop-lg p-6 sm:p-10 pt-10 overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"></div>

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
              
              {/* Step 1: Login */}
              <div className="flex flex-col items-center group">
                <div className="w-20 h-20 bg-[#22C55E] rounded-2xl border-2 border-[#1E293B] shadow-pop flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LogIn className="w-10 h-10 text-white stroke-[2.5]" />
                </div>
                <p className="mt-3 font-heading font-extrabold text-[#1E293B] text-base">1. Login</p>
                <p className="text-xs text-[#64748B] text-center max-w-[140px]">Daftar instan tanpa kartu kredit</p>
              </div>

              {/* Arrow 1 */}
              <div className="hidden md:flex items-center text-[#22C55E] animate-pulse-arrow">
                <ArrowRight className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="md:hidden text-[#22C55E] animate-pulse-arrow-down">
                <svg className="w-6 h-6 rotate-90 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* Step 2: Connect */}
              <div className="flex flex-col items-center group">
                <div className="w-20 h-20 bg-[#DB2777] rounded-2xl border-2 border-[#1E293B] shadow-pop flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Link2 className="w-10 h-10 text-white stroke-[2.5]" />
                </div>
                <p className="mt-3 font-heading font-extrabold text-[#1E293B] text-base">2. Hubungkan</p>
                <p className="text-xs text-[#64748B] text-center max-w-[140px]">Scan QR WhatsApp & Meta login</p>
              </div>

              {/* Arrow 2 */}
              <div className="hidden md:flex items-center text-[#DB2777] animate-pulse-arrow" style={{ animationDelay: "0.4s" }}>
                <ArrowRight className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="md:hidden text-[#DB2777] animate-pulse-arrow-down" style={{ animationDelay: "0.4s" }}>
                <svg className="w-6 h-6 rotate-90 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* Step 3: Channels Ready */}
              <div className="flex flex-col items-center">
                <div className="flex -space-x-3 items-center">
                  {/* WhatsApp */}
                  <div className="w-14 h-14 bg-white rounded-xl border-2 border-[#1E293B] shadow-pop flex items-center justify-center hover:scale-110 hover:z-20 transition-transform">
                    <span className="w-8 h-8 text-[#25D366]">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </span>
                  </div>
                  {/* Instagram */}
                  <div className="w-14 h-14 bg-white rounded-xl border-2 border-[#1E293B] shadow-pop flex items-center justify-center hover:scale-110 hover:z-20 transition-transform">
                    <span className="w-8 h-8 text-[#E4405F]">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </span>
                  </div>
                  {/* Messenger */}
                  <div className="w-14 h-14 bg-white rounded-xl border-2 border-[#1E293B] shadow-pop flex items-center justify-center hover:scale-110 hover:z-20 transition-transform">
                    <span className="w-8 h-8 text-[#0084FF]">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.627 0-12 4.975-12 11.111 0 3.497 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111 0-6.136-5.373-11.111-12-11.111zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/></svg>
                    </span>
                  </div>
                </div>
                <p className="mt-3 font-heading font-extrabold text-[#1E293B] text-base">3. Siap Digunakan!</p>
                <p className="text-xs text-[#64748B] text-center max-w-[140px]">Semua chat masuk ke satu inbox</p>
              </div>

            </div>
          </div>
        </div>

        {/* Benefits Subheader */}
        <div className="text-center mb-8">
          <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[#1E293B]">
            <span className="squiggle-underline">Yang bakal kamu dapetin:</span>
          </h3>
        </div>

        {/* 3 Channel Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* WA API Card */}
          <div className="card-sticker group">
            <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform text-[#25D366]">
              <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <h4 className="text-lg font-heading font-extrabold text-[#1E293B] mb-1.5">WhatsApp Business API</h4>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Akses resmi WhatsApp Cloud API dengan broadcast massal, centang hijau ready, dan stabilitas server 99.9%.
            </p>
          </div>

          {/* IG DM Card */}
          <div className="card-sticker group">
            <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform text-[#E4405F]">
              <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <h4 className="text-lg font-heading font-extrabold text-[#1E293B] mb-1.5">Instagram DM Integration</h4>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Kelola semua Direct Message Instagram langsung dari inbox yang sama tanpa harus membuka aplikasi di handphone.
            </p>
          </div>

          {/* FB Messenger Card */}
          <div className="card-sticker group">
            <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform text-[#0084FF]">
              <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 4.975-12 11.111 0 3.497 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111 0-6.136-5.373-11.111-12-11.111zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/>
              </svg>
            </div>
            <h4 className="text-lg font-heading font-extrabold text-[#1E293B] mb-1.5">FB Messenger Integration</h4>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Terima dan balas pesan Facebook Messenger pelanggan tanpa jeda. Semua ekosistem Meta terpusat dalam satu dashboard.
            </p>
          </div>
        </div>

        {/* Section Bottom Banner */}
        <div className="text-center mt-12">
          <p className="text-lg sm:text-xl font-heading font-bold text-[#1E293B]">
            Semua ini bisa kamu dapatkan dengan mudah.
          </p>
          <p className="text-xl sm:text-2xl font-extrabold mt-1 highlight-yellow inline-block">
            Setup dalam hitungan menit. Langsung produktif.
          </p>
        </div>

      </div>
    </section>
  )
}
