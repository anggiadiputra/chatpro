"use client"

import { Shield, Zap, Headphones, BadgeDollarSign, Globe2 } from "lucide-react"

export function WhyUsSection() {
  return (
    <section id="why-us" className="py-16 sm:py-24 relative overflow-hidden bg-slate-50 border-b-2 border-[#1E293B] scroll-mt-24">
      {/* Background Decorators */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 border-4 border-[#22C55E]/20 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="badge-pill bg-emerald-100 border-[#1E293B] mb-4">
            <Shield className="w-4 h-4 text-[#22C55E]" />
            <span className="text-xs sm:text-sm font-bold text-[#22C55E]">Why Choose Us</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#1E293B] mb-4">
            Kenapa Pilih ProChat?
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Bukan sekadar tools pengirim pesan biasa.
          </p>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed mt-1">
            Platform yang <strong className="text-[#1E293B]">dirancang khusus</strong> untuk bisnis Indonesia yang serius meningkatkan loyalitas dan kepuasan pelanggan.
          </p>
        </div>

        {/* 3 Value Proposition Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Card 1: Setup Cepat */}
          <div className="card-sticker flex items-start gap-4">
            <div className="w-12 h-12 bg-[#22C55E] text-white rounded-2xl border-2 border-[#1E293B] shadow-pop flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#1E293B] mb-1">Setup Cepat 5 Menit</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Tanpa verifikasi berbelit-belit. Langsung connect nomor dan mulai melayani pembeli hari ini juga.
              </p>
            </div>
          </div>

          {/* Card 2: Support Lokal */}
          <div className="card-sticker flex items-start gap-4">
            <div className="w-12 h-12 bg-[#DB2777] text-white rounded-2xl border-2 border-[#1E293B] shadow-pop flex items-center justify-center flex-shrink-0">
              <Headphones className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#1E293B] mb-1">Support Lokal Indonesia</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Tim technical support kami siap mendampingi lewat WhatsApp dan video call dalam Bahasa Indonesia.
              </p>
            </div>
          </div>

          {/* Card 3: Harga Transparan */}
          <div className="card-sticker flex items-start gap-4">
            <div className="w-12 h-12 bg-[#F59E0B] text-[#1E293B] rounded-2xl border-2 border-[#1E293B] shadow-pop flex items-center justify-center flex-shrink-0">
              <BadgeDollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#1E293B] mb-1">Harga Sangat Terjangkau</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Tanpa biaya tersembunyi. Mulai Rp25.000/bulan dengan fitur terlengkap di kelasnya.
              </p>
            </div>
          </div>

        </div>

        {/* Meta Partner & Trust Banner */}
        <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 p-6 sm:p-8 bg-white border-2 border-[#1E293B] rounded-3xl shadow-pop max-w-3xl mx-auto mb-10">
          <div className="flex items-center gap-4">
            <img
              src="/meta-partner.webp"
              alt="Official Meta Business Partner"
              className="h-12 sm:h-14 w-auto hover:scale-105 transition-transform"
            />
            <div className="border-l-2 border-slate-200 pl-4">
              <p className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Official Status</p>
              <p className="text-base sm:text-lg font-heading font-extrabold text-[#1E293B]">Meta Business Partner</p>
            </div>
          </div>

          <div className="hidden sm:block h-12 w-0.5 bg-slate-200"></div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-[#0084FF] flex items-center justify-center text-[#0084FF]">
              <Globe2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Support Lokal</p>
              <p className="text-base sm:text-lg font-heading font-extrabold text-[#1E293B]">100% Tim Indonesia</p>
            </div>
          </div>
        </div>

        {/* Section Closing */}
        <div className="text-center">
          <p className="text-base sm:text-xl font-medium text-[#1E293B]">
            Kamu tinggal fokus satu hal:{" "}
            <span className="highlight-primary font-heading font-extrabold ml-1">
              Layani pelanggan dan lipatgandakan omset bisnismu.
            </span>
          </p>
        </div>

      </div>
    </section>
  )
}
