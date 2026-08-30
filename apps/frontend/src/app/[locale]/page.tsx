import { setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { BarChart3, Bot, MessageCircleMore, Send, UsersRound } from "lucide-react"
import { MarketingHeader } from "@/components/marketing-header"

interface Props {
  params: Promise<{ locale: string }>
}

const copy = {
  en: {
    eyebrow: "WhatsApp & Instagram messaging platform",
    firstLine: "Manage every chat",
    secondLine: "in one place!",
    description:
      "Bring customer conversations, broadcasts, automation, and team collaboration into one simple workspace.",
    primaryCta: "Get Started",
    secondaryCta: "Explore Features",
    featuresTitle: "Everything your team needs to connect",
    featuresDescription: "A focused toolkit for faster, more personal customer conversations.",
    templatesTitle: "Launch campaigns without starting from zero",
    templatesDescription:
      "Create reusable, approved message templates and keep every customer touchpoint consistent.",
    pricingTitle: "Start building better conversations today.",
    pricingDescription: "Create your account and explore the platform with your team.",
  },
  id: {
    eyebrow: "Platform pesan WhatsApp & Instagram",
    firstLine: "Kelola semua chat",
    secondLine: "dalam satu tempat!",
    description:
      "Satukan percakapan pelanggan, broadcast, automasi, dan kolaborasi tim dalam satu workspace yang sederhana.",
    primaryCta: "Mulai Sekarang",
    secondaryCta: "Lihat Fitur",
    featuresTitle: "Semua yang tim Anda butuhkan untuk terhubung",
    featuresDescription: "Perangkat lengkap untuk percakapan pelanggan yang lebih cepat dan personal.",
    templatesTitle: "Jalankan kampanye tanpa mulai dari nol",
    templatesDescription:
      "Buat template pesan yang konsisten, dapat digunakan kembali, dan siap dikirim kapan saja.",
    pricingTitle: "Mulai percakapan yang lebih baik hari ini.",
    pricingDescription: "Buat akun dan jelajahi platform bersama tim Anda.",
  },
} as const

const features = [
  {
    icon: MessageCircleMore,
    title: "Unified Inbox",
    description: "Handle WhatsApp and Instagram conversations from one organized inbox.",
  },
  {
    icon: Send,
    title: "Smart Broadcast",
    description: "Reach the right audience with reusable templates and targeted campaigns.",
  },
  {
    icon: Bot,
    title: "AI Automation",
    description: "Automate repetitive replies while keeping every interaction personal.",
  },
  {
    icon: UsersRound,
    title: "Team Collaboration",
    description: "Assign conversations and give every customer a clear point of contact.",
  },
  {
    icon: BarChart3,
    title: "Actionable Insights",
    description: "Understand response time, delivery, and team performance at a glance.",
  },
]

export default async function RootPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const content = copy[locale === "id" ? "id" : "en"]

  return (
    <main className="min-h-svh bg-white text-slate-950">
      <MarketingHeader />

      <section className="flex min-h-svh items-center justify-center px-4 pb-16 pt-28">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <p className="mb-7 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
            {content.eyebrow}
          </p>
          <h1 className="max-w-5xl text-[3.35rem] font-bold leading-[0.96] tracking-[-0.055em] sm:text-7xl lg:text-[5.9rem]">
            <span className="block text-blue-600">{content.firstLine}</span>
            <span className="block text-slate-950">{content.secondLine}</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {content.description}
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              {content.primaryCta}
            </Link>
            <Link
              href="/#features"
              className="inline-flex h-11 items-center justify-center rounded-md bg-slate-100 px-6 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200"
            >
              {content.secondaryCta}
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-16 border-t border-slate-200 bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{content.featuresTitle}</h2>
            <p className="mt-4 text-lg text-slate-600">{content.featuresDescription}</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <feature.icon className="size-6 text-blue-600" />
                <h3 className="mt-5 font-bold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="templates" className="scroll-mt-16 px-4 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Templates</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">{content.templatesTitle}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{content.templatesDescription}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            {["Order confirmation", "Shipping update", "Customer follow-up"].map((template, index) => (
              <div key={template} className="mb-3 flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 last:mb-0">
                <div className="flex size-10 items-center justify-center rounded-md bg-blue-50 text-sm font-bold text-blue-600">
                  0{index + 1}
                </div>
                <div>
                  <p className="font-semibold">{template}</p>
                  <p className="mt-1 text-sm text-slate-500">Ready to personalize and send</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-16 border-t border-slate-200 bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{content.pricingTitle}</h2>
            <p className="mt-3 text-slate-300">{content.pricingDescription}</p>
          </div>
          <Link href="/register" className="inline-flex h-11 shrink-0 items-center rounded-md bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-500">
            {content.primaryCta}
          </Link>
        </div>
      </section>
    </main>
  )
}
