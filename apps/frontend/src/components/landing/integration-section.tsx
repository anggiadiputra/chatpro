"use client"

import { Plug, Check, ArrowRight, LayoutDashboard, UserCheck, HeartHandshake, RefreshCw } from "lucide-react"

const benefits = [
  {
    icon: LayoutDashboard,
    title: "Satu Dashboard Terpusat",
    description: "WhatsApp, Instagram, dan FB Messenger dalam satu tampilan. Gak perlu buka banyak tab browser atau gonta-ganti aplikasi HP.",
  },
  {
    icon: UserCheck,
    title: "Unified Customer Profile",
    description: "Lihat semua riwayat chat, transaksi, dan interaksi pelanggan dari berbagai channel dalam satu profil kontak terintegrasi.",
  },
  {
    icon: HeartHandshake,
    title: "Pengalaman Pelanggan Konsisten",
    description: "Berikan respon standar yang cepat dan profesional di semua channel. Pelanggan puas, loyalitas bisnis meningkat.",
  },
  {
    icon: RefreshCw,
    title: "Real-time Two-Way Sync",
    description: "Semua pesan, status tiket, dan tag tersinkron secara real-time. Tim CS selalu punya informasi pelanggan yang paling mutakhir.",
  },
]

export function IntegrationSection() {
  return (
    <section id="integration" className="py-16 sm:py-24 relative overflow-hidden bg-white border-b-2 border-[#1E293B] scroll-mt-24">
      {/* Background Curved Connector Lines & Floating Plugs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <svg className="absolute top-1/4 left-0 w-full h-64 opacity-20" viewBox="0 0 1200 200" fill="none">
          <path d="M0,100 Q300,20 600,100 T1200,100" stroke="#22C55E" strokeWidth="3" strokeDasharray="8 8" />
          <path d="M0,140 Q300,60 600,140 T1200,140" stroke="#DB2777" strokeWidth="3" strokeDasharray="8 8" />
        </svg>
        <div className="absolute top-12 right-16 w-12 h-12 bg-[#047857]/15 rounded-2xl flex items-center justify-center rotate-12 animate-float">
          <Plug className="w-6 h-6 text-[#047857]" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="badge-pill bg-[#DCFCE7] border-[#1E293B] mb-4">
            <Plug className="w-4 h-4 text-[#047857]" />
            <span className="text-xs sm:text-sm font-bold text-[#047857]">Seamless Integration</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#1E293B] mb-4">
            Integrasi Seamless Omnichannel
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            ProChat terintegrasi langsung dengan <strong className="text-[#1E293B]">WhatsApp Cloud API resmi</strong>,{" "}
            <strong className="text-[#1E293B]">Instagram Graph API</strong>, dan <strong className="text-[#1E293B]">Facebook Messenger API</strong>.
          </p>
          <p className="text-sm sm:text-base text-[#64748B] mt-2">
            Semua pesan masuk ke satu tempat. Tim kamu gak perlu lagi pusing buka banyak aplikasi terpisah.
          </p>
        </div>

        {/* 4 Interactive Benefit Cards */}
        <div className="space-y-4 max-w-3xl mx-auto mb-12">
          {benefits.map((b, idx) => {
            const Icon = b.icon
            return (
              <div
                key={idx}
                className="group flex items-start gap-4 p-4 sm:p-5 bg-white border-2 border-[#1E293B] rounded-2xl shadow-[4px_4px_0px_#E2E8F0] hover:shadow-pop hover:border-[#1E293B] hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Number / Checkmark Icon */}
                <div className="flex-shrink-0 w-11 h-11 bg-emerald-50 border-2 border-[#22C55E] rounded-xl flex items-center justify-center group-hover:bg-[#22C55E] text-[#22C55E] group-hover:text-white transition-colors shadow-sm">
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#1E293B] mb-1 group-hover:text-[#22C55E] transition-colors">
                    {b.title}
                  </h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    {b.description}
                  </p>
                </div>

                {/* Right Arrow on Hover */}
                <div className="hidden sm:flex flex-shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all pt-2 text-[#22C55E]">
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Callout */}
        <div className="text-center">
          <p className="text-base sm:text-lg font-medium text-[#1E293B]">
            Artinya?{" "}
            <span className="highlight-yellow font-extrabold ml-1">
              Komunikasi lebih efisien, biaya operasional hemat, pelanggan jauh lebih puas.
            </span>
          </p>
        </div>

      </div>
    </section>
  )
}
