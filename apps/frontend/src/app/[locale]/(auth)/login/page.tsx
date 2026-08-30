import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { Card } from "@/components/ui/card"
import { UserAuthForm } from "./components/user-auth-form"
import { BrandingPageTitle } from "@/components/branding-page-title"

interface Props {
  params: Promise<{ locale: string }>
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  
  const t = await getTranslations("auth")

  return (
    <div data-auth-content>
      <BrandingPageTitle suffix={t("login")} />
      <Card
        className="border-slate-200 bg-white p-6 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.22)] sm:p-8"
        data-auth-card
      >
        <div className="mb-8 flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {t("welcomeBack")}
          </h1>
          <p className="text-sm text-slate-600">
            {t("enterCredentials")}
          </p>
        </div>
        <UserAuthForm />

        <p className="mt-8 text-center text-sm text-slate-600">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
          >
            {t("registerNow")}
          </Link>
        </p>
      </Card>
    </div>
  )
}
