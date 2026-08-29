import type { Metadata } from "next"
import { Outfit, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "ProChat - Omnichannel CRM WhatsApp & Instagram dalam Satu Platform",
  description: "Platform omnichannel CRM untuk mengelola WhatsApp Business API dan Instagram DM dalam satu dashboard. Setup cepat, support lokal Indonesia, AI chatbot 24/7.",
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${outfit.variable} ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <body className="font-body group/body antialiased">{children}</body>
    </html>
  )
}
