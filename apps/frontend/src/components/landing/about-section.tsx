"use client"

import { Heart, Target } from "lucide-react"

export function AboutSection() {
  return (
    <section id="about" className="py-16 sm:py-24 relative overflow-hidden bg-slate-50 border-b-2 border-[#1E293B] scroll-mt-24">
      {/* Background Decorators */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute top-16 right-16 w-32 h-32 bg-[#22C55E]/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-16 left-16 w-36 h-36 bg-[#DB2777]/10 rounded-full blur-2xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10 text-center">
        
        {/* Heart Icon Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white border-2 border-[#1E293B] rounded-3xl shadow-pop mb-6">
          <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-[#DB2777] fill-[#DB2777]" />
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#1E293B] mb-8">
          Tentang ProChat
        </h2>

        {/* Story Card */}
        <div className="bg-white border-2 border-[#1E293B] rounded-3xl p-6 sm:p-10 shadow-pop mb-10 text-left space-y-4">
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            <strong className="text-[#1E293B]">ProChat</strong> lahir dari keresahan ribuan pemilik bisnis dan tim customer service di Indonesia yang kelelahan mengelola chat dari berbagai channel secara manual dan terpisah-pisah.
          </p>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Kami percaya bahwa teknologi otomasi AI & omnichannel tidak harus mahal dan rumit. Misi kami adalah menghadirkan platform kelas enterprise dengan antarmuka yang sangat ramah, setup secepat kilat, dan harga yang terjangkau untuk seluruh pebisnis di tanah air.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="inline-block">
          <div className="flex items-center gap-2.5 mb-2 justify-center text-[#22C55E]">
            <Target className="w-6 h-6 stroke-[2.5]" />
            <span className="text-base sm:text-lg font-heading font-extrabold text-[#1E293B]">Misi kami sederhana:</span>
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1E293B]">
            <span className="highlight-primary">Bantu bisnis kamu berkomunikasi lebih efektif, cepat, dan efisien.</span>
          </p>
        </div>

      </div>
    </section>
  )
}
