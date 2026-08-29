import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { SolutionFlow } from "@/components/landing/solution-flow"
import { FeaturesBento } from "@/components/landing/features-bento"
import { IntegrationSection } from "@/components/landing/integration-section"
import { CoexistenceSection } from "@/components/landing/coexistence-section"
import { WhyUsSection } from "@/components/landing/why-us-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { AboutSection } from "@/components/landing/about-section"
import { FaqSection } from "@/components/landing/faq-section"
import { CtaSection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] text-[#1E293B] flex flex-col selection:bg-[#22C55E] selection:text-white">
      {/* Floating Pill Navbar */}
      <Navbar />

      {/* Main Sections */}
      <main className="flex-1 w-full">
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Solution & 3-Step Setup Flow */}
        <SolutionFlow />

        {/* 3. 9-Feature Bento Grid */}
        <FeaturesBento />

        {/* 4. Seamless Omnichannel Integration */}
        <IntegrationSection />

        {/* 5. WhatsApp Coexistence Highlight */}
        <CoexistenceSection />

        {/* 6. Why Choose Us & Trust Badges */}
        <WhyUsSection />

        {/* 7. Simple & Transparent Pricing */}
        <PricingSection />

        {/* 8. About Us & Mission */}
        <AboutSection />

        {/* 9. Interactive FAQ Accordion */}
        <FaqSection />

        {/* 10. Final High-Conversion CTA */}
        <CtaSection />
      </main>

      {/* 11. Dark Themed Footer */}
      <Footer />
    </div>
  )
}
