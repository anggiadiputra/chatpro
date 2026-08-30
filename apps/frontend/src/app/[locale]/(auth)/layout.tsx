import { setRequestLocale } from "next-intl/server"
import { AuthContent } from "@/components/auth/auth-content"

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AuthLayout({ children, params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AuthContent>{children}</AuthContent>
}
