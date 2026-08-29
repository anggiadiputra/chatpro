"use client"

import { Link } from "@/i18n/routing"
import { Check, Sparkles, ArrowRight } from "lucide-react"

interface PricingTier {
  name: string
  subtitle: string
  price: string
  period: string
  borderColor: string
  badgeText?: string
  isPopular?: boolean
  features: string[]
  buttonText: string
  buttonClass: string
}

const tiers: PricingTier[] = [
  {
    name: "BASIC",
    subtitle: "Untuk developer & integrasi mandiri",
    price: "Rp 25.000",
    period: "/ bulan",
    borderColor: "border-[#0EA5E9]",
    features: [
      "Connect WhatsApp, IG, Messenger",
      "Pesan Masuk & Keluar Unlimited",
      "Unified Inbox Dashboard",
      "Quick Reply Buttons",
      "n8n & Zapier Integration",
      "REST API & Webhook Access",
      "30 Hari Riwayat Pesan",
      "1 Nomor WhatsApp Resmi",
    ],
    buttonText: "Pilih Basic",
    buttonClass: "btn-outline-chunky w-full text-center justify-center",
  },
  {
    name: "LITE",
    subtitle: "Untuk bisnis berkembang & tim kecil",
    price: "Rp 49.000",
    period: "/ bulan",
    borderColor: "border-[#F97316]",
    features: [
      "Semua fitur paket BASIC",
      "AI Chatbot Otomatis 24/7",
      "5 Dokumen Knowledge Base",
      "5 Akun Anggota Tim CS",
      "90 Hari Riwayat Pesan",
      "Media Library Management",
      "WhatsApp Broadcast Message",
      "1 Nomor WhatsApp Resmi",
    ],
    buttonText: "Pilih Lite",
    buttonClass: "btn-outline-chunky w-full text-center justify-center",
  },
  {
    name: "PRO",
    subtitle: "Untuk bisnis skala besar & multi-agent",
    price: "Rp 99.000",
    period: "/ bulan",
    borderColor: "border-[#22C55E]",
    badgeText: "Paling Populer & Direkomendasikan",
    isPopular: true,
    features: [
      "Semua fitur paket LITE",
      "10 Dokumen Knowledge Base AI",
      "AI Vision: Analisis Gambar / Bukti Transfer",
      "10 Akun Anggota Tim CS",
      "Riwayat Pesan Tanpa Batas (Unlimited)",
      "Penyimpanan Media 2 GB Cloud",
      "Prioritas Jalur CS & Dedicated Support",
      "1 Nomor WhatsApp Resmi",
    ],
    buttonText: "Pilih Pro Sekarang",
    buttonClass: "btn-candy w-full text-center justify-center !py-3.5",
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 sm:py-24 relative overflow-hidden bg-white border-b-2 border-[#1E293B] scroll-mt-24">
      {/* Background Dots */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" aria-hidden="true"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="badge-pill bg-emerald-100 border-[#1E293B] mb-4">
            <Sparkles className="w-4 h-4 text-[#22C55E]" />
            <span className="text-xs sm:text-sm font-bold text-[#22C55E]">Simple & Transparent Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#1E293B] mb-4">
            Pilih Paket yang Cocok
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Pilih paket sesuai skala kebutuhan bisnis kamu, bisa upgrade atau downgrade kapan saja tanpa denda.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-12">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative bg-white rounded-3xl border-2 ${tier.borderColor} shadow-pop flex flex-col justify-between p-6 sm:p-7 transition-all duration-300 hover:scale-[1.02] ${
                tier.isPopular ? "border-4 !border-[#22C55E] md:-translate-y-2" : ""
              }`}
            >
              {/* Recommendation Badge */}
              {tier.badgeText && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#22C55E] text-white text-xs font-heading font-extrabold rounded-full border-2 border-[#1E293B] shadow-sm whitespace-nowrap">
                  {tier.badgeText}
                </div>
              )}

              <div>
                {/* Tier Title */}
                <div className="mb-4">
                  <h3 className="text-xl font-heading font-extrabold text-[#1E293B]">{tier.name}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">{tier.subtitle}</p>
                </div>

                {/* Price */}
                <div className="mb-6 pb-5 border-b border-slate-100 flex items-baseline">
                  <span className="text-3xl sm:text-4xl font-heading font-extrabold text-[#1E293B]">
                    {tier.price}
                  </span>
                  <span className="text-sm font-semibold text-[#64748B] ml-1.5">{tier.period}</span>
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1E293B]">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-[#22C55E] stroke-[3]" />
                      </span>
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div>
                <Link href="/register" className={tier.buttonClass}>
                  <span>{tier.buttonText}</span>
                  {tier.isPopular && <ArrowRight className="w-4 h-4 stroke-[3]" />}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Guarantee */}
        <div className="text-center text-xs sm:text-sm text-[#64748B]">
          💡 Seluruh paket sudah termasuk akses Meta Cloud API resmi tanpa potongan komisi pesan dari ProChat.
        </div>

      </div>
    </section>
  )
}
