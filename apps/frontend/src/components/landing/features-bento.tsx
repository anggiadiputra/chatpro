"use client"

import Link from "next/link"
import {
  Inbox,
  Bot,
  Users,
  FileText,
  MousePointerClick,
  ListFilter,
  Images,
  Webhook,
  Workflow,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  iconBg: string
  arrowColor: string
}

const features: FeatureItem[] = [
  {
    icon: Inbox,
    title: "Unified Inbox",
    description:
      "Semua chat dari WhatsApp, Instagram, dan FB Messenger dalam satu inbox. Gak perlu buka banyak app, semua terpusat dan rapi.",
    iconBg: "bg-[#22C55E]",
    arrowColor: "text-[#22C55E]",
  },
  {
    icon: Bot,
    title: "AI Chatbot 24/7",
    description:
      "Balas chat pelanggan otomatis 24 jam nonstop pakai AI berbasis Knowledge Base bisnis kamu. Pelanggan senang, tim CS santai.",
    iconBg: "bg-[#F59E0B]",
    arrowColor: "text-[#F59E0B]",
  },
  {
    icon: Users,
    title: "CRM & Contact Management",
    description:
      "Kelola data pelanggan, tag, segmentasi kustom, dan seluruh riwayat chat lampau. Semua tersimpan aman dan terstruktur.",
    iconBg: "bg-[#EC4899]",
    arrowColor: "text-[#EC4899]",
  },
  {
    icon: FileText,
    title: "WhatsApp Message Templates",
    description:
      "Kirim template pesan WhatsApp resmi untuk notifikasi order, reminder invoice, dan promo broadcast berkala tanpa takut banned.",
    iconBg: "bg-[#8B5CF6]",
    arrowColor: "text-[#8B5CF6]",
  },
  {
    icon: MousePointerClick,
    title: "Quick Reply Buttons",
    description:
      "Permudah pelanggan memilih opsi respon cepat lewat tombol interaktif yang praktis, meningkatkan konversi penjualan.",
    iconBg: "bg-[#10B981]",
    arrowColor: "text-[#10B981]",
  },
  {
    icon: ListFilter,
    title: "Interactive List Messages",
    description:
      "Tampilkan daftar menu produk, layanan, atau cabang dalam satu pesan terstruktur agar pelanggan memilih dengan jelas.",
    iconBg: "bg-[#0EA5E9]",
    arrowColor: "text-[#0EA5E9]",
  },
  {
    icon: Images,
    title: "Media Carousel Messages",
    description:
      "Kirim katalog visual berupa beberapa kartu promo bergambar sekaligus dalam format carousel interaktif yang memukau.",
    iconBg: "bg-[#F43F5E]",
    arrowColor: "text-[#F43F5E]",
  },
  {
    icon: Webhook,
    title: "REST API & Real-time Webhook",
    description:
      "Hubungkan ProChat ke sistem internal, ERP, website e-commerce, atau POS kamu lewat REST API & Webhook berkecepatan tinggi.",
    iconBg: "bg-[#6366F1]",
    arrowColor: "text-[#6366F1]",
  },
  {
    icon: Workflow,
    title: "n8n Automation Integration",
    description:
      "Integrasi tanpa batas dengan workflow automation n8n, Make, atau Zapier. Buat alur kerja otomatisasi tanpa batas tanpa ribet coding.",
    iconBg: "bg-[#F97316]",
    arrowColor: "text-[#F97316]",
  },
]

export function FeaturesBento() {
  return (
    <section id="features" className="py-16 sm:py-24 relative overflow-hidden bg-slate-50 scroll-mt-24">
      {/* Background Decorators */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute top-20 left-10 w-24 h-24 border-4 border-dashed border-[#22C55E]/20 rounded-full animate-rotate-slow pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-20 h-20 bg-[#DB2777]/10 rounded-2xl rotate-12 pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="badge-pill bg-white border-[#1E293B] mb-4">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            <span className="text-xs sm:text-sm font-bold text-[#1E293B]">Fitur Lengkap & Modern</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#1E293B] mb-4">
            Fitur Lengkap untuk Bisnis Kamu
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Semua yang kamu butuhkan untuk mengelola dan mengotomasi komunikasi pelanggan dalam satu dashboard terpadu:
          </p>
        </div>

        {/* 3x3 Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="card-sticker group relative flex flex-col justify-between hover:border-[#1E293B]"
              >
                <div>
                  {/* Colorful Circle Icon with Wiggle */}
                  <div
                    className={`w-12 h-12 rounded-2xl ${feature.iconBg} text-white border-2 border-[#1E293B] shadow-[2px_2px_0px_#1E293B] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform wiggle-hover`}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-heading font-extrabold text-[#1E293B] mb-2 group-hover:text-[#22C55E] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Arrow Indicator */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#64748B] group-hover:text-[#1E293B]">
                  <span>Pelajari lebih lanjut</span>
                  <div
                    className={`w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center group-hover:bg-slate-200 group-hover:translate-x-1 transition-all ${feature.arrowColor}`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Section Closing & CTA Box */}
        <div className="mt-14 text-center space-y-5">
          <div className="inline-block">
            <p className="text-base font-semibold text-[#64748B]">Intinya?</p>
            <p className="text-xl sm:text-2xl font-heading font-extrabold text-[#1E293B]">
              <span className="highlight-primary">Satu platform untuk semua kebutuhan komunikasi bisnis.</span>
            </p>
          </div>
          <div>
            <Link href="/register" className="btn-candy text-base !py-3 !px-7">
              <span>Coba Sekarang Gratis</span>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center ml-1">
                <ArrowRight className="w-4 h-4 text-white stroke-[3]" />
              </span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
