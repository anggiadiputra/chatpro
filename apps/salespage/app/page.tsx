import FaqAccordion from "@/components/FaqAccordion";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section id="hero" className="relative pt-8 pb-16 lg:pt-12 lg:pb-24">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#22c55e]/8 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-20 w-32 h-32 bg-[#db2777]/15 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-1/4 w-24 h-24 bg-[#f59e0b]/20 rounded-full blur-xl"></div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 badge-pill bg-[#dcfce7] border-[#22c55e]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#22c55e]"
                >
                  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path>
                </svg>
                <span className="text-foreground font-semibold text-sm">Harga 25rb/Bulan</span>
              </div>

              {/* Title with real icons */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Kelola{" "}
                <span className="inline-flex items-center gap-1">
                  <span className="w-8 h-8 sm:w-10 sm:h-10 text-[#25D366] inline-block align-middle">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </span>
                </span>{" "}
                <span className="inline-flex items-center gap-1">
                  <span className="w-8 h-8 sm:w-10 sm:h-10 text-[#E4405F] inline-block align-middle">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </span>
                </span>{" "}
                <span className="inline-flex items-center gap-1">
                  <span className="w-8 h-8 sm:w-10 sm:h-10 text-[#0084FF] inline-block align-middle">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.627 0-12 4.975-12 11.111 0 3.497 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111 0-6.136-5.373-11.111-12-11.111zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/>
                    </svg>
                  </span>
                </span>{" "}
                dalam <span className="highlight-primary">Satu Platform</span>
              </h1>

              {/* Intro */}
              <p className="text-base sm:text-lg text-[#64748b] leading-relaxed">
                Bisnis kamu punya banyak channel komunikasi?{" "}
                <strong className="text-[#1e293b]">WhatsApp, Instagram DM, FB Messenger, semuanya berantakan?</strong> Saatnya
                satukan semuanya.
              </p>

              {/* Problems List */}
              <div className="space-y-2">
                <p className="font-semibold text-[#1e293b] text-sm">Masalah yang sering terjadi:</p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-[#64748b] text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-red-500 flex-shrink-0"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                    <span>Chat WhatsApp, Instagram, dan Messenger terpisah, ribet bolak-balik.</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#64748b] text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-red-500 flex-shrink-0"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                    <span>Tim CS kewalahan handle banyak channel sekaligus.</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#64748b] text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-red-500 flex-shrink-0"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                    <span>Data pelanggan tersebar, susah di-track.</span>
                  </li>
                </ul>
              </div>

              {/* Conclusion */}
              <p className="text-base text-[#1e293b]">
                Hasilnya? Respon lambat, pelanggan kabur.{" "}
                <span className="highlight-yellow font-semibold">Bisnis kehilangan peluang setiap hari.</span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a href="https://dash.prochat.work/en/register" className="btn-candy">
                  Coba Sekarang
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
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </a>
                <a href="#solution" className="btn-outline">
                  Lihat Fitur
                </a>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-3">
                <img src="/mbp.svg" alt="Meta Business Partner" className="h-8 opacity-70" />
                <span className="text-xs text-[#64748b]">Official Meta Business Partner</span>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative lg:pl-4">
              <div className="relative border-chunky rounded-xl overflow-hidden shadow-pop-lg bg-card transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                <img
                  src="/inbox.webp"
                  alt="Pro.Chat Dashboard"
                  width={2560}
                  height={1367}
                  className="w-full h-auto"
                />
              </div>

              {/* Floating badges */}
              <div className="absolute -top-3 -right-2 px-3 py-1.5 bg-[#db2777] text-white border-2 border-[#1e293b] rounded-full shadow-pop text-xs">
                <span className="font-bold">AI Chatbot</span>
              </div>
              <div className="absolute -bottom-3 -left-2 px-3 py-1.5 bg-[#f59e0b] text-[#1e293b] border-2 border-[#1e293b] rounded-full shadow-pop text-xs">
                <span className="font-bold">Multi-Agent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="section-playful relative">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" aria-hidden="true"></div>
        <div className="absolute top-20 right-10 w-16 h-16 border-4 border-[#db2777]/30 rounded-full animate-float" aria-hidden="true"></div>
        <div className="absolute bottom-40 left-10 w-12 h-12 bg-[#f59e0b]/20 rounded-lg rotate-45 animate-float" style={{ animationDelay: "0.5s" }} aria-hidden="true"></div>

        <div className="container mx-auto px-6 lg:px-8 max-w-6xl relative">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
              Solusinya Pro.Chat. <span className="inline-block w-3 h-3 bg-[#22c55e] rounded-full ml-1"></span>
            </h2>
            <p className="text-lg sm:text-xl text-[#64748b] leading-relaxed">
              Platform <span className="border-b-2 border-[#22c55e] pb-0.5 font-semibold text-[#1e293b]">omnichannel CRM</span> yang menyatukan semua channel komunikasi kamu.
            </p>
            <p className="text-lg sm:text-xl text-[#64748b] leading-relaxed mt-4">
              Mulai dari <strong className="text-[#1e293b]">Rp25 ribu</strong>, Pro.Chat bantu tim kamu kerja lebih cepat dan pelanggan dapat respons lebih rapi.
            </p>
          </div>

          {/* Animated Flow: Login -> Connect -> Channels */}
          <div className="relative mb-16">
            <div className="max-w-4xl mx-auto relative">
              <div className="relative bg-card border-2 border-[#1e293b] rounded-2xl shadow-pop-lg p-8 md:p-12 overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-30"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                  {/* Step 1: Login */}
                  <div className="flow-step group">
                    <div className="w-20 h-20 bg-[#22c55e] rounded-2xl border-2 border-[#1e293b] shadow-pop flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <path d="m10 17 5-5-5-5"></path>
                        <path d="M15 12H3"></path>
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                      </svg>
                    </div>
                    <p className="mt-3 font-bold text-center">Login</p>
                  </div>

                  {/* Arrow 1 */}
                  <div className="flow-arrow hidden md:block">
                    <svg className="w-12 h-8 text-[#22c55e] animate-pulse-arrow" viewBox="0 0 48 32" fill="none">
                      <path d="M0 16h40M32 8l8 8-8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <div className="flow-arrow md:hidden">
                    <svg className="w-8 h-12 text-[#22c55e] animate-pulse-arrow" viewBox="0 0 32 48" fill="none">
                      <path d="M16 0v40M8 32l8 8 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>

                  {/* Step 2: Connect */}
                  <div className="flow-step group">
                    <div className="w-20 h-20 bg-[#db2777] rounded-2xl border-2 border-[#1e293b] shadow-pop flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                    </div>
                    <p className="mt-3 font-bold text-center">Connect</p>
                  </div>

                  {/* Arrow 2 */}
                  <div className="flow-arrow hidden md:block">
                    <svg className="w-12 h-8 text-[#db2777] animate-pulse-arrow" style={{ animationDelay: "0.3s" }} viewBox="0 0 48 32" fill="none">
                      <path d="M0 16h40M32 8l8 8-8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <div className="flow-arrow md:hidden">
                    <svg className="w-8 h-12 text-[#db2777] animate-pulse-arrow" style={{ animationDelay: "0.3s" }} viewBox="0 0 32 48" fill="none">
                      <path d="M16 0v40M8 32l8 8 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>

                  {/* Step 3: Channels */}
                  <div className="flow-step">
                    <div className="flex -space-x-3">
                      {/* WhatsApp */}
                      <div className="w-16 h-16 bg-white rounded-xl border-2 border-[#1e293b] shadow-pop flex items-center justify-center hover:scale-110 hover:z-10 transition-transform channel-icon" style={{ animationDelay: "0s" }}>
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#25D366">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
                        </svg>
                      </div>
                      {/* Instagram */}
                      <div className="w-16 h-16 bg-white rounded-xl border-2 border-[#1e293b] shadow-pop flex items-center justify-center hover:scale-110 hover:z-10 transition-transform channel-icon" style={{ animationDelay: "0.15s" }}>
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#E4405F">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                        </svg>
                      </div>
                      {/* Messenger */}
                      <div className="w-16 h-16 bg-white rounded-xl border-2 border-[#1e293b] shadow-pop flex items-center justify-center hover:scale-110 hover:z-10 transition-transform channel-icon" style={{ animationDelay: "0.3s" }}>
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#0084FF">
                          <path d="M12 0c-6.627 0-12 4.975-12 11.111 0 3.497 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111 0-6.136-5.373-11.111-12-11.111zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"></path>
                        </svg>
                      </div>
                    </div>
                    <p className="mt-3 font-bold text-center">Ready!</p>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 left-8 inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full border-2 border-[#1e293b] shadow-pop bg-[#22c55e] text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                  <path d="M20 2v4"></path>
                  <path d="M22 4h-4"></path>
                  <circle cx="4" cy="20" r="2"></circle>
                </svg>
                <span>Setup 5 Menit</span>
              </div>
            </div>
          </div>

          {/* Benefits Intro */}
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold">
              <span className="squiggle-underline">Yang bakal kamu dapetin:</span>
            </h3>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-sticker group border-2 border-[#e2e8f0]">
              <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform text-[#25D366]">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-bold mb-2">WhatsApp Business API</h4>
              <p className="text-[#64748b] text-sm leading-relaxed">Akses resmi WhatsApp API dengan fitur lengkap.</p>
            </div>

            <div className="card-sticker group border-2 border-[#e2e8f0]">
              <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform text-[#E4405F]">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-bold mb-2">Instagram DM Integration</h4>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Kelola semua DM Instagram dari dashboard yang sama. Gak perlu buka app terpisah.
              </p>
            </div>

            <div className="card-sticker group border-2 border-[#e2e8f0]">
              <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform text-[#0084FF]">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.627 0-12 4.975-12 11.111 0 3.497 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111 0-6.136-5.373-11.111-12-11.111zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-bold mb-2">FB Messenger Integration</h4>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Terima dan balas pesan Facebook Messenger langsung dari Pro.Chat. Semua channel Meta dalam satu tempat.
              </p>
            </div>
          </div>

          {/* Closing */}
          <div className="text-center mt-16 max-w-2xl mx-auto">
            <p className="text-xl font-medium">Semua ini bisa kamu dapetin.</p>
            <p className="text-2xl font-bold mt-2 highlight-yellow inline-block">
              Setup dalam hitungan menit. Langsung produktif.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-playful bg-[#f1f5f9] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-grid opacity-50"></div>
          <div className="absolute top-20 left-10 w-20 h-20 border-4 border-dashed border-[#22c55e]/20 rounded-full animate-rotate-slow"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-[#db2777]/10 rounded-lg rotate-12"></div>
          <div className="absolute top-1/2 right-20 w-8 h-8 bg-[#f59e0b]/30 rounded-full"></div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 max-w-6xl relative">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 badge-pill bg-white mb-6">
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
                className="text-[#22c55e]"
              >
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              <span className="font-semibold">Fitur Lengkap</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">Fitur Lengkap untuk Bisnis Kamu</h2>
            <p className="text-lg sm:text-xl text-[#64748b] leading-relaxed">
              Semua yang kamu butuhkan untuk mengelola komunikasi pelanggan dalam satu platform:
            </p>
          </div>

          {/* Features Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Unified Inbox */}
            <div className="card-sticker group relative sm:col-span-2 lg:col-span-1">
              <div className="icon-circle text-white mb-4 wiggle-hover" style={{ backgroundColor: "#22C55E" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[#22c55e] transition-colors">Unified Inbox</h3>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Semua chat dari WhatsApp, Instagram, dan FB Messenger dalam satu inbox. Gak perlu buka banyak app, semua terpusat.
              </p>
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-[#22c55e]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e]">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </div>

            {/* 2. AI Chatbot */}
            <div className="card-sticker group relative">
              <div className="icon-circle text-white mb-4 wiggle-hover" style={{ backgroundColor: "#F59E0B" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8"></path>
                  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                  <path d="M2 14h2"></path>
                  <path d="M20 14h2"></path>
                  <path d="M15 13v2"></path>
                  <path d="M9 13v2"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[#22c55e] transition-colors">AI Chatbot</h3>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Balas chat otomatis 24/7 pakai AI. Pelanggan happy, tim kamu gak kewalahan.
              </p>
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-[#f59e0b]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#b45309]">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </div>

            {/* 3. CRM & Contact Management */}
            <div className="card-sticker group relative">
              <div className="icon-circle text-white mb-4 wiggle-hover" style={{ backgroundColor: "#EC4899" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 2v2"></path>
                  <path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path>
                  <path d="M8 2v2"></path>
                  <circle cx="12" cy="11" r="3"></circle>
                  <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[#22c55e] transition-colors">CRM &amp; Contact Management</h3>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Kelola data pelanggan, tag, segment, dan history chat. Semua rapi di satu tempat.
              </p>
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-[#ec4899]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ec4899]">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </div>

            {/* 4. Message Templates */}
            <div className="card-sticker group relative">
              <div className="icon-circle text-white mb-4 wiggle-hover" style={{ backgroundColor: "#8B5CF6" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>
                  <path d="M14 2v5a1 1 0 0 0 1 1h5"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[#22c55e] transition-colors">Message Templates</h3>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Kirim template WhatsApp untuk notifikasi, follow-up, reminder, dan campaign dengan format yang lebih konsisten.
              </p>
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-[#8b5cf6]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8b5cf6]">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </div>

            {/* 5. Reply Buttons */}
            <div className="card-sticker group relative sm:col-span-2 lg:col-span-1">
              <div className="icon-circle text-white mb-4 wiggle-hover" style={{ backgroundColor: "#10B981" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.586 12.586 19 19"></path>
                  <path d="M3.688 3.037a.497.497 0 0 0-.651.651l6.5 15.999a.501.501 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[#22c55e] transition-colors">Reply Buttons</h3>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Permudah pelanggan memilih respons cepat lewat tombol interaktif yang praktis dan lebih mudah diklik.
              </p>
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-[#10b981]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#059669]">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </div>

            {/* 6. Interactive List Messages */}
            <div className="card-sticker group relative">
              <div className="icon-circle text-white mb-4 wiggle-hover" style={{ backgroundColor: "#0EA5E9" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5h.01"></path>
                  <path d="M3 12h.01"></path>
                  <path d="M3 19h.01"></path>
                  <path d="M8 5h13"></path>
                  <path d="M8 12h13"></path>
                  <path d="M8 19h13"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[#22c55e] transition-colors">Interactive List Messages</h3>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Tampilkan daftar opsi dalam satu pesan agar pelanggan bisa memilih kebutuhan mereka dengan lebih jelas.
              </p>
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-[#0ea5e9]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0284c7]">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </div>

            {/* 7. Media Carousel Messages */}
            <div className="card-sticker group relative">
              <div className="icon-circle text-white mb-4 wiggle-hover" style={{ backgroundColor: "#F43F5E" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"></path>
                  <path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"></path>
                  <circle cx="13" cy="7" r="1" fill="currentColor"></circle>
                  <rect x="8" y="2" width="14" height="14" rx="2"></rect>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[#22c55e] transition-colors">Media Carousel Messages</h3>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Tampilkan beberapa kartu konten atau promo sekaligus dalam format carousel yang lebih menarik dan informatif.
              </p>
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-[#f43f5e]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#e11d48]">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </div>

            {/* 8. API & Webhook */}
            <div className="card-sticker group relative">
              <div className="icon-circle text-white mb-4 wiggle-hover" style={{ backgroundColor: "#6366F1" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"></path>
                  <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"></path>
                  <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[#22c55e] transition-colors">API &amp; Webhook</h3>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Hubungkan Pro.Chat ke sistem internal kamu lewat API dan webhook untuk sinkronisasi data serta event secara real-time.
              </p>
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-[#6366f1]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4f46e5]">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </div>

            {/* 9. n8n Integration */}
            <div className="card-sticker group relative">
              <div className="icon-circle text-white mb-4 wiggle-hover" style={{ backgroundColor: "#F97316" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"></path>
                  <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"></path>
                  <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[#22c55e] transition-colors">n8n Integration</h3>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Hubungkan Pro.Chat dengan n8n untuk workflow automation. Buat alur kerja otomatis tanpa coding.
              </p>
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-[#f97316]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ea580c]">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Closing & CTA */}
          <div className="text-center mt-16 space-y-6">
            <div className="inline-block">
              <p className="text-xl font-medium mb-2">Intinya?</p>
              <p className="text-2xl sm:text-3xl font-extrabold">
                <span className="highlight-primary">Satu platform untuk semua kebutuhan komunikasi bisnis.</span>
              </p>
            </div>
            <div>
              <a href="https://dash.prochat.work/en/register" className="btn-candy text-lg">
                Coba Sekarang
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section id="integration" className="section-playful relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <svg className="absolute top-1/4 left-0 w-full h-64 opacity-10" viewBox="0 0 800 200">
            <path d="M0,100 Q200,50 400,100 T800,100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8,8" className="text-[#22c55e]"></path>
            <path d="M0,150 Q200,100 400,150 T800,150" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8,8" className="text-[#db2777]"></path>
          </svg>
          <div className="absolute top-20 right-20 w-12 h-12 bg-[#047857]/20 rounded-xl flex items-center justify-center rotate-12 animate-float">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#047857]">
              <path d="M12 22v-5"></path>
              <path d="M15 8V2"></path>
              <path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"></path>
              <path d="M9 8V2"></path>
            </svg>
          </div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 max-w-6xl relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 badge-pill bg-[#047857]/10 border-[#047857]/30 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#047857]">
                <path d="M12 22v-5"></path>
                <path d="M15 8V2"></path>
                <path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"></path>
                <path d="M9 8V2"></path>
              </svg>
              <span className="font-semibold text-[#047857]">Seamless Integration</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">Integrasi Seamless</h2>
            <p className="text-lg sm:text-xl text-[#64748b] leading-relaxed">
              Pro.Chat terintegrasi dengan <strong className="text-[#1e293b]">WhatsApp Business API resmi</strong>, <strong className="text-[#1e293b]">Instagram Graph API</strong>, dan <strong className="text-[#1e293b]">Facebook Messenger API</strong>.
            </p>
            <p className="text-lg sm:text-xl text-[#64748b] leading-relaxed mt-4">
              Semua pesan masuk ke satu tempat. Tim kamu gak perlu lagi buka banyak aplikasi atau tab browser.
            </p>
          </div>

          {/* Benefits Cards */}
          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-center font-bold text-lg mb-8">Keuntungan integrasi omnichannel:</p>
            <div className="space-y-4">
              <div className="group flex items-start gap-4 p-4 bg-white border-2 border-[#e2e8f0] rounded-xl hover:border-[#22c55e] hover:shadow-pop transition-all duration-300">
                <div className="flex-shrink-0 w-10 h-10 bg-[#22c55e]/10 border-2 border-[#22c55e] rounded-full flex items-center justify-center group-hover:bg-[#22c55e] group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e] group-hover:text-white">
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-[#22c55e] transition-colors">Satu Dashboard</h3>
                  <p className="text-[#64748b] text-sm">WhatsApp, Instagram, dan FB Messenger dalam satu tampilan. Gak perlu switch antar aplikasi.</p>
                </div>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e]">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </div>
              </div>

              <div className="group flex items-start gap-4 p-4 bg-white border-2 border-[#e2e8f0] rounded-xl hover:border-[#22c55e] hover:shadow-pop transition-all duration-300">
                <div className="flex-shrink-0 w-10 h-10 bg-[#22c55e]/10 border-2 border-[#22c55e] rounded-full flex items-center justify-center group-hover:bg-[#22c55e] group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e] group-hover:text-white">
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-[#22c55e] transition-colors">Unified Customer Profile</h3>
                  <p className="text-[#64748b] text-sm">Lihat semua history interaksi pelanggan dari berbagai channel di satu profil.</p>
                </div>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e]">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </div>
              </div>

              <div className="group flex items-start gap-4 p-4 bg-white border-2 border-[#e2e8f0] rounded-xl hover:border-[#22c55e] hover:shadow-pop transition-all duration-300">
                <div className="flex-shrink-0 w-10 h-10 bg-[#22c55e]/10 border-2 border-[#22c55e] rounded-full flex items-center justify-center group-hover:bg-[#22c55e] group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e] group-hover:text-white">
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-[#22c55e] transition-colors">Consistent Experience</h3>
                  <p className="text-[#64748b] text-sm">Berikan pengalaman yang sama baiknya di semua channel. Pelanggan happy, bisnis grow.</p>
                </div>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e]">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </div>
              </div>

              <div className="group flex items-start gap-4 p-4 bg-white border-2 border-[#e2e8f0] rounded-xl hover:border-[#22c55e] hover:shadow-pop transition-all duration-300">
                <div className="flex-shrink-0 w-10 h-10 bg-[#22c55e]/10 border-2 border-[#22c55e] rounded-full flex items-center justify-center group-hover:bg-[#22c55e] group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e] group-hover:text-white">
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-[#22c55e] transition-colors">Real-time Sync</h3>
                  <p className="text-[#64748b] text-sm">Semua data tersinkron real-time. Tim selalu punya informasi terbaru.</p>
                </div>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e]">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl">
              Artinya? <span className="highlight-yellow font-bold ml-1">Komunikasi lebih efisien, pelanggan lebih puas.</span>
            </p>
          </div>
        </div>
      </section>

      {/* WhatsApp Coexistence Section */}
      <section id="coexistence" className="section-playful bg-gradient-to-br from-[#8b5cf6]/5 via-background to-[#db2777]/5 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-10 left-1/4 w-24 h-24 border-4 border-dashed border-[#8b5cf6]/20 rounded-full"></div>
          <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-[#db2777]/10 rounded-xl rotate-12"></div>
          <div className="absolute top-1/3 right-10 text-[#8b5cf6]/20 animate-float">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
              <path d="M12 18h.01"></path>
            </svg>
          </div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 max-w-6xl relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 badge-pill bg-[#8b5cf6]/10 border-[#8b5cf6]/30 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8b5cf6]">
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                <path d="M12 18h.01"></path>
              </svg>
              <span className="font-semibold text-[#8b5cf6]">New Feature</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
              <span className="squiggle-underline">WhatsApp Coexistence</span>
            </h2>
            <p className="text-lg sm:text-xl text-[#64748b] leading-relaxed">
              Fitur terbaru dari Meta yang bikin transisi ke API jadi tanpa ribet.
            </p>
            <p className="text-lg sm:text-xl text-[#64748b] leading-relaxed mt-4">
              Dulu, kalau mau pakai WhatsApp API, kamu harus uninstall WhatsApp Business App. Chat history hilang, kontak hilang, grup hilang. <strong className="text-[#1e293b]">Sekarang? Gak perlu lagi.</strong>
            </p>
          </div>

          {/* Visual Diagram */}
          <div className="flex justify-center mb-12">
            <div className="relative flex items-center gap-4 p-6 bg-white border-2 border-[#1e293b] rounded-2xl shadow-pop max-w-lg">
              {/* Phone App */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-[#22c55e] rounded-xl flex items-center justify-center border-2 border-[#1e293b] shadow-pop">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                    <path d="M12 18h.01"></path>
                  </svg>
                </div>
                <span className="text-sm font-semibold">WA App</span>
              </div>

              {/* Connection arrows */}
              <div className="flex flex-col items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8b5cf6]">
                  <path d="M8 3 4 7l4 4"></path>
                  <path d="M4 7h16"></path>
                  <path d="m16 21 4-4-4-4"></path>
                  <path d="M20 17H4"></path>
                </svg>
                <span className="text-xs text-[#64748b]">Sync</span>
              </div>

              {/* API Cloud */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-[#8b5cf6] rounded-xl flex items-center justify-center border-2 border-[#1e293b] shadow-pop">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                  </svg>
                </div>
                <span className="text-sm font-semibold">WA API</span>
              </div>

              {/* Equal sign */}
              <div className="text-2xl font-bold text-[#f59e0b] mx-2">=</div>

              {/* One number */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-[#f59e0b] rounded-xl flex items-center justify-center border-2 border-[#1e293b] shadow-pop">
                  <span className="text-2xl font-bold text-[#1e293b]">1</span>
                </div>
                <span className="text-sm font-semibold">Nomor</span>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-center font-bold text-lg mb-8">Dengan WhatsApp Coexistence:</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="group p-5 bg-white border border-[#e2e8f0] rounded-xl border-l-4 border-l-[#8b5cf6] hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#8b5cf6] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M8 3 4 7l4 4"></path>
                      <path d="M4 7h16"></path>
                      <path d="m16 21 4-4-4-4"></path>
                      <path d="M20 17H4"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Satu Nomor, Dua Akses</h3>
                    <p className="text-sm text-[#64748b]">Pakai WhatsApp Business App dan API di nomor yang sama. Gak perlu ganti nomor.</p>
                  </div>
                </div>
              </div>

              <div className="group p-5 bg-white border border-[#e2e8f0] rounded-xl border-l-4 border-l-[#22c55e] hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#22c55e] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Chat History Tetap Aman</h3>
                    <p className="text-sm text-[#64748b]">Semua riwayat chat, kontak, dan grup tetap ada. Gak ada yang hilang.</p>
                  </div>
                </div>
              </div>

              <div className="group p-5 bg-white border border-[#e2e8f0] rounded-xl border-l-4 border-l-[#db2777] hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#db2777] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                      <path d="M21 3v5h-5"></path>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                      <path d="M8 16H3v5"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Transisi Tanpa Gangguan</h3>
                    <p className="text-sm text-[#64748b]">Tim tetap bisa chat manual dari HP, sementara sistem handle automation di backend.</p>
                  </div>
                </div>
              </div>

              <div className="group p-5 bg-white border border-[#e2e8f0] rounded-xl border-l-4 border-l-[#f59e0b] hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#f59e0b] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1e293b]">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Real-time Sync</h3>
                    <p className="text-sm text-[#64748b]">Pesan dari App dan API tersinkron. Semua tercatat di satu tempat.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl">
              Artinya? <span className="highlight-pink font-bold ml-1">Kamu bisa scale bisnis tanpa kehilangan apa yang sudah dibangun.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="section-playful relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#f1f5f9] to-transparent"></div>
          <div className="absolute bottom-20 left-10 w-20 h-20 border-4 border-[#22c55e]/20 rounded-full"></div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 max-w-6xl relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 badge-pill bg-[#22c55e]/10 border-[#22c55e]/30 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e]">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
              </svg>
              <span className="font-semibold text-[#22c55e]">Why Choose Us</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">Kenapa Pilih Pro.Chat?</h2>
            <p className="text-lg sm:text-xl text-[#64748b] leading-relaxed">Bukan cuma tools biasa.</p>
            <p className="text-lg sm:text-xl text-[#64748b] leading-relaxed mt-4">
              Platform yang <strong className="text-[#1e293b]">dirancang khusus</strong> untuk bisnis Indonesia yang serius soal customer experience.
            </p>
          </div>

          {/* Checklist as cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            <div className="group flex items-center gap-4 p-4 bg-white border border-[#e2e8f0] rounded-xl hover:shadow-md transition-all duration-300">
              <div className="flex-shrink-0 w-10 h-10 bg-[#22c55e] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              </div>
              <p className="font-medium text-sm">Setup cepat — langsung bisa pakai dalam hitungan menit.</p>
            </div>

            <div className="group flex items-center gap-4 p-4 bg-white border border-[#e2e8f0] rounded-xl hover:shadow-md transition-all duration-300">
              <div className="flex-shrink-0 w-10 h-10 bg-[#db2777] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              </div>
              <p className="font-medium text-sm">Support lokal — tim kami siap bantu kapan saja dalam Bahasa Indonesia.</p>
            </div>

            <div className="group flex items-center gap-4 p-4 bg-white border border-[#e2e8f0] rounded-xl hover:shadow-md transition-all duration-300">
              <div className="flex-shrink-0 w-10 h-10 bg-[#f59e0b] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1e293b]">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              </div>
              <p className="font-medium text-sm">Harga transparan — gak ada biaya tersembunyi, sesuai kebutuhan bisnis kamu.</p>
            </div>
          </div>

          {/* Trust badges banner */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12 p-6 bg-white border-2 border-[#e2e8f0] rounded-2xl">
            <img src="/mbp.svg" alt="Meta Business Partner" className="h-12 opacity-80 hover:opacity-100 transition-opacity" />
            <div className="h-8 w-px bg-[#e2e8f0] hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e]">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                <path d="M2 12h20"></path>
              </svg>
              <span className="font-semibold text-sm sm:text-base">Support Lokal Indonesia</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl">
              Kamu tinggal fokus satu hal: <span className="highlight-primary font-bold ml-1">Layani pelanggan dengan lebih baik.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-playful bg-[#f1f5f9] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-grid opacity-30"></div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 max-w-5xl relative">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 badge-pill bg-[#dcfce7] border-[#22c55e]/30 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e]">
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                <path d="M20 2v4"></path>
                <path d="M22 4h-4"></path>
                <circle cx="4" cy="20" r="2"></circle>
              </svg>
              <span className="font-semibold text-[#22c55e]">Simple Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">Pilih Paket yang Cocok</h2>
            <p className="text-lg text-[#64748b]">Pilih paket sesuai kebutuhan bisnis kamu, upgrade kapan saja.</p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
            {/* BASIC */}
            <div className="relative bg-white rounded-2xl border-2 border-[#0EA5E9] flex flex-col h-full shadow-sm">
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold">BASIC</h3>
                  <p className="text-sm text-[#64748b]">For developer integration</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl lg:text-4xl font-extrabold">Rp 25.000</span>
                  <span className="text-[#64748b] text-sm ml-1">/ month</span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {[
                    "Connect WhatsApp, IG, Messenger",
                    "Unlimited Message",
                    "Akses Inbox",
                    "Quick Reply",
                    "n8n Integration",
                    "API Access",
                    "30-day message history",
                    "1 WhatsApp Number",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e] flex-shrink-0 mt-0.5">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <a href="https://dash.prochat.work/en/register" className="block w-full py-3 px-6 text-center font-semibold rounded-full transition-all duration-300 bg-[#f1f5f9] text-[#1e293b] hover:bg-[#e2e8f0]">
                    Pilih Basic
                  </a>
                </div>
              </div>
            </div>

            {/* LITE */}
            <div className="relative bg-white rounded-2xl border-2 border-[#F97316] flex flex-col h-full shadow-sm">
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold">LITE</h3>
                  <p className="text-sm text-[#64748b]">For growing businesses</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl lg:text-4xl font-extrabold">Rp 49.000</span>
                  <span className="text-[#64748b] text-sm ml-1">/ month</span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {[
                    "Semua fitur BASIC",
                    "AI Chatbot",
                    "5 Knowledge Documents",
                    "n8n Integration",
                    "5 Team Members",
                    "90-day message history",
                    "Media Library",
                    "1 WhatsApp Number",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e] flex-shrink-0 mt-0.5">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <a href="https://dash.prochat.work/en/register" className="block w-full py-3 px-6 text-center font-semibold rounded-full transition-all duration-300 bg-[#f1f5f9] text-[#1e293b] hover:bg-[#e2e8f0]">
                    Pilih Lite
                  </a>
                </div>
              </div>
            </div>

            {/* PRO (Featured) */}
            <div className="relative bg-white rounded-2xl border-2 border-[#22C55E] flex flex-col h-full shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#22c55e] text-white text-xs font-bold rounded-full whitespace-nowrap shadow-sm">
                Rekomendasi
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold">PRO</h3>
                  <p className="text-sm text-[#64748b]">Untuk bisnis skala besar</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl lg:text-4xl font-extrabold">Rp 99.000</span>
                  <span className="text-[#64748b] text-sm ml-1">/ bulan</span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {[
                    "Semua fitur LITE",
                    "10 Knowledge Base",
                    "10 anggota tim",
                    "Vision: analisis gambar oleh AI",
                    "Riwayat pesan tanpa batas",
                    "Penyimpanan media 2 GB",
                    "1 WhatsApp Number",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e] flex-shrink-0 mt-0.5">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <a href="https://dash.prochat.work/en/register" className="block w-full py-3 px-6 text-center font-semibold rounded-full transition-all duration-300 bg-[#22c55e] text-white hover:bg-[#16a34a]">
                    Pilih Pro
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section-playful bg-[#f1f5f9] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-grid opacity-30"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-[#22c55e]/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-20 w-32 h-32 bg-[#db2777]/10 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 max-w-4xl relative">
          <div className="text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white border-2 border-[#1e293b] rounded-2xl shadow-pop mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#db2777]">
                <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path>
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-8">Tentang Pro.Chat</h2>

            {/* Narrative Box */}
            <div className="bg-white border-2 border-[#1e293b] rounded-2xl p-8 shadow-soft mb-8">
              <div className="space-y-6 text-left">
                <p className="text-lg text-[#64748b] leading-relaxed">
                  Pro.Chat adalah platform omnichannel CRM yang menyatukan WhatsApp dan Instagram dalam satu dashboard.
                </p>
                <p className="text-lg text-[#64748b] leading-relaxed">
                  Kami memahami betapa ribetnya mengelola banyak channel komunikasi. Makanya kami bangun solusi yang simpel tapi powerful — supaya tim kamu bisa fokus melayani pelanggan, bukan sibuk pindah-pindah aplikasi.
                </p>
              </div>
            </div>

            {/* Mission Statement */}
            <div className="inline-block">
              <div className="flex items-center gap-3 mb-4 justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e]">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
                <span className="text-xl font-bold">Misi kami satu:</span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold">
                <span className="highlight-primary">Bantu bisnis kamu berkomunikasi lebih efektif dan efisien.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section-playful bg-[#f1f5f9] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 right-20 w-24 h-24 border-4 border-dashed border-[#22c55e]/20 rounded-full"></div>
          <div className="absolute bottom-20 left-10 w-16 h-16 bg-[#db2777]/10 rounded-lg rotate-12"></div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 max-w-4xl relative">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 badge-pill bg-white mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#22c55e]">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <path d="M12 17h.01"></path>
              </svg>
              <span className="text-foreground font-semibold text-sm">FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">Pertanyaan yang Sering Ditanyakan</h2>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* CTA Banner Section */}
      <section id="cta" className="section-playful relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4f46e5] via-[#4338ca] to-[#6d28d9]" aria-hidden="true"></div>
        <div className="absolute inset-0 opacity-10 bg-dots" aria-hidden="true"></div>

        {/* Floating decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white/20 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 border-4 border-white/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <svg className="absolute top-20 right-1/4 w-12 h-12 text-white/20 animate-float" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12,2 22,22 2,22"></polygon>
          </svg>
          <svg className="absolute bottom-20 left-1/3 w-8 h-8 text-white/20 animate-float" style={{ animationDelay: "0.5s" }} viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2"></rect>
          </svg>
        </div>

        <div className="container mx-auto px-6 lg:px-8 max-w-4xl relative">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-8 border border-white/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f59e0b]">
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                <path d="M20 2v4"></path>
                <path d="M22 4h-4"></path>
                <circle cx="4" cy="20" r="2"></circle>
              </svg>
              <span className="font-semibold text-sm">Siap Meningkatkan Bisnis?</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight text-white">
              Siap Tingkatkan Customer Experience?
            </h2>

            <div className="space-y-4 mb-8 max-w-2xl mx-auto">
              <p className="text-lg sm:text-xl text-white/90 leading-relaxed">
                Gabung dengan Pro.Chat untuk memudahkan cs kelola pesan WhatsApp dan Instagram.
              </p>
              <p className="text-lg sm:text-xl text-white/90 leading-relaxed">
                Coba sekarang. Gak perlu kartu kredit. Setup dalam 5 menit.
              </p>
            </div>

            {/* Benefits pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f59e0b]">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-sm font-medium">Tanpa kartu kredit</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f59e0b]">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span className="text-sm font-medium">Setup dalam 5 menit</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f59e0b]">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span className="text-sm font-medium">Langsung produktif</span>
              </div>
            </div>

            {/* CTA Button */}
            <a
              href="https://dash.prochat.work/en/register"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#4f46e5] font-bold text-lg rounded-full border-2 border-[#1e293b] shadow-pop hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-pop-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-pop-active transition-all duration-300"
            >
              Mulai Sekarang
              <span className="w-10 h-10 rounded-full bg-[#4f46e5] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </span>
            </a>
          </div>
        </div>

        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
          <svg className="w-full h-16 text-[#fafbfc]" viewBox="0 0 1440 64" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,32 C360,64 720,0 1080,32 C1260,48 1380,48 1440,32 L1440,64 L0,64 Z"></path>
          </svg>
        </div>
      </section>
    </>
  );
}
