"use client"

import { Smartphone, Cloud, ArrowLeftRight, ShieldCheck, History, RefreshCcw, Sparkles } from "lucide-react"

export function CoexistenceSection() {
  return (
    <section id="coexistence" className="py-16 sm:py-24 relative overflow-hidden bg-gradient-to-br from-purple-50/60 via-white to-pink-50/40 border-b-2 border-[#1E293B] scroll-mt-24">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-10 left-1/4 w-28 h-28 border-4 border-dashed border-[#8B5CF6]/20 rounded-full animate-rotate-slow"></div>
        <div className="absolute bottom-12 right-1/4 w-16 h-16 bg-[#DB2777]/10 rounded-2xl rotate-12"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="badge-pill bg-purple-100 border-[#1E293B] mb-4">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-xs sm:text-sm font-bold text-[#8B5CF6]">Fitur Terbaru Meta</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#1E293B] mb-4">
            <span className="squiggle-underline">WhatsApp Coexistence</span>
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Fitur resmi Meta yang membuat transisi bisnis kamu ke WhatsApp Cloud API menjadi sangat mudah tanpa ribet.
          </p>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed mt-2">
            Dulu, kalau mau pakai WhatsApp API, kamu harus uninstall WhatsApp Business di HP. Riwayat chat hilang, kontak hilang.{" "}
            <strong className="text-[#1E293B] bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">Sekarang? Gak perlu lagi!</strong>
          </p>
        </div>

        {/* Visual Architecture Diagram */}
        <div className="flex justify-center mb-14">
          <div className="relative flex flex-wrap items-center justify-center gap-4 sm:gap-6 p-6 sm:p-8 bg-white border-2 border-[#1E293B] rounded-3xl shadow-pop max-w-2xl w-full">
            
            {/* Box 1: WhatsApp App (HP) */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#22C55E] rounded-2xl flex items-center justify-center border-2 border-[#1E293B] shadow-pop text-white hover:scale-105 transition-transform">
                <Smartphone className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
              </div>
              <span className="text-xs sm:text-sm font-heading font-extrabold text-[#1E293B]">WA App di HP</span>
            </div>

            {/* Sync Flow Indicator */}
            <div className="flex flex-col items-center gap-1 text-[#8B5CF6]">
              <div className="w-10 h-10 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center animate-pulse">
                <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#8B5CF6]">Sync Dua Arah</span>
            </div>

            {/* Box 2: WhatsApp Cloud API */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#8B5CF6] rounded-2xl flex items-center justify-center border-2 border-[#1E293B] shadow-pop text-white hover:scale-105 transition-transform">
                <Cloud className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
              </div>
              <span className="text-xs sm:text-sm font-heading font-extrabold text-[#1E293B]">ProChat API</span>
            </div>

            {/* Equal Sign */}
            <div className="text-2xl sm:text-3xl font-extrabold text-[#F59E0B] mx-1">=</div>

            {/* Box 3: 1 Single Phone Number */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F59E0B] rounded-2xl flex items-center justify-center border-2 border-[#1E293B] shadow-pop text-[#1E293B] hover:scale-105 transition-transform font-heading font-extrabold text-2xl sm:text-3xl">
                1
              </div>
              <span className="text-xs sm:text-sm font-heading font-extrabold text-[#1E293B]">Nomor Sama!</span>
            </div>

          </div>
        </div>

        {/* 4 Key Benefits Grid */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-12">
          
          {/* Item 1 */}
          <div className="card-sticker !border-l-4 !border-l-[#8B5CF6] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#8B5CF6] border border-purple-300 flex items-center justify-center flex-shrink-0">
              <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#1E293B] mb-1">Satu Nomor, Dua Akses</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Gunakan aplikasi WhatsApp Business di HP dan dashboard ProChat secara simultan di nomor yang sama.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="card-sticker !border-l-4 !border-l-[#22C55E] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#22C55E] border border-emerald-300 flex items-center justify-center flex-shrink-0">
              <History className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#1E293B] mb-1">Chat History Tetap Aman</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Semua riwayat chat lampau, kontak tersimpan, dan grup pelanggan tetap utuh tanpa risiko hilang.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="card-sticker !border-l-4 !border-l-[#DB2777] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#DB2777] border border-pink-300 flex items-center justify-center flex-shrink-0">
              <RefreshCcw className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#1E293B] mb-1">Transisi Tanpa Gangguan</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Tim tetap bisa membalas manual dari smartphone, sementara sistem backend menjalankan otomasi AI & broadcast.
              </p>
            </div>
          </div>

          {/* Item 4 */}
          <div className="card-sticker !border-l-4 !border-l-[#F59E0B] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#F59E0B] border border-amber-300 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#1E293B] mb-1">Resmi & Bergaransi Meta</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Didukung langsung oleh Meta Business API dengan tingkat keamanan enterprise dan jaminan anti-blokir nomor.
              </p>
            </div>
          </div>

        </div>

        {/* Section Closing */}
        <div className="text-center">
          <p className="text-base sm:text-lg text-[#1E293B]">
            Artinya?{" "}
            <span className="highlight-pink font-extrabold ml-1">
              Kamu bisa scale bisnis secara masif tanpa merusak sistem chat yang sudah berjalan.
            </span>
          </p>
        </div>

      </div>
    </section>
  )
}
