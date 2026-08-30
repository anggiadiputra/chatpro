"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Apakah pesan yang bisa dikirim unlimited?",
    answer:
      "Ya! Semua paket Pro.Chat menyediakan unlimited pesan masuk dan keluar. Kamu bisa balas chat pelanggan sepuasnya tanpa khawatir kuota habis.",
  },
  {
    question: "Apakah bisa kirim broadcast / bulk message?",
    answer:
      "Bisa! Pro.Chat mendukung fitur broadcast untuk mengirim pesan ke banyak pelanggan sekaligus. Cocok untuk promo, pengumuman, atau follow-up.",
  },
  {
    question: "Berapa biaya broadcast WhatsApp?",
    answer:
      "Biaya broadcast dibayar langsung ke Meta (WhatsApp) sesuai tarif resmi mereka. Pro.Chat tidak mengambil margin tambahan. Kamu hanya bayar sesuai harga Meta.",
  },
  {
    question: "Apakah perlu nomor WhatsApp baru?",
    answer:
      "Tidak harus. Kamu bisa pakai nomor WhatsApp yang sudah ada, atau daftar nomor baru. Tim kami akan bantu proses migrasi jika diperlukan.",
  },
  {
    question: "Berapa lama proses setup?",
    answer:
      "Setup Pro.Chat hanya butuh 5 menit! Login, connect channel WhatsApp/Instagram, dan langsung bisa dipakai.",
  },
  {
    question: "Bagaimana cara mulai berlangganan?",
    answer:
      "Cukup daftar, pilih paket yang sesuai kebutuhan bisnis kamu, dan langsung explore semua fiturnya. Setup hanya butuh beberapa menit tanpa kartu kredit.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="faq-item bg-white border-2 border-[#1e293b] rounded-xl shadow-pop overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => toggleFaq(index)}
              className="faq-trigger w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#f1f5f9]/50 transition-colors cursor-pointer"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
            >
              <span className="font-bold text-lg pr-4 text-[#1e293b]">{faq.question}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-[#22c55e] flex-shrink-0 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
            <div
              id={`faq-answer-${index}`}
              className={`faq-content px-6 pb-5 transition-all duration-300 ${
                isOpen ? "block" : "hidden"
              }`}
            >
              <p className="text-[#64748b] leading-relaxed">{faq.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
