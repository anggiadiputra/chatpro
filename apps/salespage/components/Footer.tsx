import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative bg-[#1e293b] text-white overflow-hidden">
      {/* Decorative top wave */}
      <div className="absolute top-0 left-0 right-0 -translate-y-[99%]" aria-hidden="true">
        <svg
          className="w-full h-12 text-[#1e293b]"
          viewBox="0 0 1440 48"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,48 L1440,48 L1440,24 C1200,48 960,0 720,24 C480,48 240,0 0,24 Z"></path>
        </svg>
      </div>

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-20 right-20 w-32 h-32 border border-white/10 rounded-full"></div>
        <div className="absolute bottom-10 left-20 w-24 h-24 border border-white/5 rounded-full"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-lg rotate-45"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 max-w-6xl relative py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#22c55e] rounded-xl flex items-center justify-center">
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
                  className="text-white"
                >
                  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <span className="text-2xl font-bold font-heading">Pro.Chat</span>
            </div>
            <p className="text-white/70 leading-relaxed mb-6 max-w-sm">
              Platform omnichannel CRM untuk mengelola WhatsApp Business API dan Instagram DM dalam satu dashboard.
            </p>
            <div className="relative w-48 h-10">
              <img
                src="/mbp.svg"
                alt="Meta Business Partner"
                className="h-10 w-auto brightness-0 invert opacity-90"
              />
            </div>
          </div>

          {/* Product & Legal Links */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-8">
            {/* Product Links */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/#features" className="text-white/80 hover:text-[#22c55e] transition-colors inline-flex items-center gap-1">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/#pricing" className="text-white/80 hover:text-[#22c55e] transition-colors inline-flex items-center gap-1">
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="https://prochat.work"
                    className="text-white/80 hover:text-[#22c55e] transition-colors inline-flex items-center gap-1"
                  >
                    API Docs
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/60"
                    >
                      <path d="M15 3h6v6"></path>
                      <path d="M10 14 21 3"></path>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    </svg>
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy-policy" className="text-white/80 hover:text-[#22c55e] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-white/80 hover:text-[#22c55e] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/aup" className="text-white/80 hover:text-[#22c55e] transition-colors">
                    Acceptable Use Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            &copy; 2026 Pro.Chat. All rights reserved.
          </p>
          <p className="text-white/50 text-sm flex items-center gap-1">
            Made with{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#db2777]"
            >
              <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path>
            </svg>{" "}
            in Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
