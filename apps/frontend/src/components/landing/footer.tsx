"use client"

import { Link } from "@/i18n/routing"
import { MessageSquare, Heart, ShieldCheck, ExternalLink } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-[#1E293B] text-white overflow-hidden pt-12 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        
        {/* Main Columns Grid */}
        <div className="grid md:grid-cols-12 gap-10 sm:gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#22C55E] rounded-2xl border-2 border-white flex items-center justify-center shadow-[2px_2px_0px_#FFFFFF]">
                <MessageSquare className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <span className="text-2xl font-heading font-extrabold text-white">ProChat</span>
            </div>

            <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
              Platform omnichannel CRM resmi untuk mengelola WhatsApp Cloud API, Instagram DM, dan Facebook Messenger dalam satu dashboard cerdas.
            </p>

            <div className="pt-1">
              <img
                src="/meta-partner.webp"
                alt="Official Meta Business Partner"
                className="h-10 w-auto hover:opacity-100 opacity-90 transition-opacity bg-white p-1 rounded-lg"
              />
            </div>
          </div>

          {/* Product Links */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-400">
              Produk
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a href="#features" className="hover:text-[#22C55E] transition-colors">
                  Fitur Unggulan
                </a>
              </li>
              <li>
                <a href="#integration" className="hover:text-[#22C55E] transition-colors">
                  Integrasi Omnichannel
                </a>
              </li>
              <li>
                <a href="#coexistence" className="hover:text-[#22C55E] transition-colors">
                  WhatsApp Coexistence
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#22C55E] transition-colors">
                  Paket & Harga
                </a>
              </li>
              <li>
                <a
                  href="https://docs.prochat.id"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#22C55E] transition-colors inline-flex items-center gap-1"
                >
                  <span>API Documentation</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-400">
              Legal & Informasi
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/privacy" className="hover:text-[#22C55E] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#22C55E] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#22C55E] transition-colors">
                  Bantuan & FAQ
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#22C55E] transition-colors">
                  Tentang Kami
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
          <p>© {currentYear} ProChat. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-[#DB2777] fill-[#DB2777]" />
            <span>in Indonesia</span>
          </p>
        </div>

      </div>
    </footer>
  )
}