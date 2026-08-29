"use client"

import { useState } from "react"
import { HelpCircle, ChevronDown } from "lucide-react"

interface FaqItem {
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    question: "Apakah pesan yang bisa dikirim unlimited?",
    answer:
      "Ya! Seluruh paket di ProChat menyediakan kuota chat masuk dan keluar unlimited (tanpa batas). Kamu bisa melayani pesan dan membalas pelanggan sepuasnya tanpa takut kehabisan kuota sistem.",
  },
  {
    question: "Apakah bisa kirim broadcast / bulk message?",
    answer:
      "Tentu saja! ProChat mendukung fitur broadcast WhatsApp Cloud API resmi untuk mengirim pesan promosi, reminder, atau pengumuman ke ratusan hingga ribuan kontak sekaligus secara terjadwal.",
  },
  {
    question: "Berapa biaya broadcast WhatsApp?",
    answer:
      "Biaya broadcast per percakapan (conversation fee) dibayarkan langsung sesuai tarif resmi Meta (WhatsApp). ProChat tidak mengenakan komisi atau margin tambahan sedikit pun.",
  },
  {
    question: "Apakah saya harus mengganti nomor WhatsApp yang sudah ada?",
    answer:
      "Tidak perlu. Melalui fitur resmi WhatsApp Coexistence dari Meta, nomor WhatsApp bisnis yang aktif di smartphone kamu tetap bisa digunakan bersamaan dengan sistem API ProChat tanpa kehilangan kontak atau riwayat chat sebelumnya.",
  },
  {
    question: "Berapa lama waktu yang dibutuhkan untuk setup?",
    answer:
      "Hanya butuh waktu sekitar 5 menit! Cukup daftar, login ke dashboard, scan QR / hubungkan akun Meta kamu, dan seluruh fitur langsung siap digunakan saat itu juga.",
  },
  {
    question: "Bagaimana cara mulai mendaftar dan apakah perlu kartu kredit?",
    answer:
      "Cukup klik tombol 'Daftar' di bagian atas, isi email & password kamu. Kamu bisa langsung mengeksplorasi dashboard tanpa harus memasukkan detail kartu kredit apa pun.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-16 sm:py-24 relative overflow-hidden bg-white border-b-2 border-[#1E293B] scroll-mt-24">
      {/* Background Decorators */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" aria-hidden="true"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="badge-pill bg-white border-[#1E293B] mb-4">
            <HelpCircle className="w-4 h-4 text-[#22C55E]" />
            <span className="text-xs sm:text-sm font-bold text-[#1E293B]">Frequently Asked Questions</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#1E293B] mb-4">
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <p className="text-base sm:text-lg text-[#64748B]">
            Punya pertanyaan seputar cara kerja, harga, atau setup ProChat? Temukan jawabannya di bawah:
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="bg-white border-2 border-[#1E293B] rounded-2xl shadow-pop overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading font-extrabold text-base sm:text-lg text-[#1E293B] pr-4">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 bg-[#22C55E] text-white" : "text-[#22C55E]"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 stroke-[3]" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-sm sm:text-base text-[#64748B] leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
