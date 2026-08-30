import { setRequestLocale } from "next-intl/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LegalLayout({ children, params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Platform"

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            {appName}
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {children}
      </main>
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {appName}. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
