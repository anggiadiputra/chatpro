"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastScroll = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll < 100) {
        setHidden(false);
      } else if (currentScroll > lastScroll) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScroll = currentScroll;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      id="navbar"
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        hidden ? "-translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex items-center gap-2 px-2 py-2 bg-white/95 backdrop-blur-sm border-2 border-[#1e293b] rounded-full shadow-pop">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 font-heading font-bold text-[#1e293b] hover:text-[#22c55e] transition-colors"
          aria-label="Pro.Chat - Home"
        >
          <span className="w-8 h-8 bg-[#22c55e] rounded-xl flex items-center justify-center" aria-hidden="true">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
          <span className="hidden sm:inline font-heading font-bold text-lg" aria-hidden="true">
            Pro.Chat
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <a
            href="/#features"
            className="px-3 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            Fitur
          </a>
          <a
            href="/#integration"
            className="px-3 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            Integrasi
          </a>
          <a
            href="/#pricing"
            className="px-3 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            Harga
          </a>
          <a
            href="/#about"
            className="px-3 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            Tentang
          </a>
          <a
            href="https://prochat.work"
            className="px-3 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            Docs
          </a>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <a
            href="https://dash.prochat.work/en/login"
            className="px-4 py-2 text-sm font-semibold text-[#1e293b] hover:text-[#22c55e] transition-colors"
          >
            Login
          </a>
          <a
            href="https://dash.prochat.work/en/register"
            className="btn-candy text-sm !py-2 !px-4"
          >
            Daftar
          </a>
        </div>
      </div>
    </nav>
  );
}
