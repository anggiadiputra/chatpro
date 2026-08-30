import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME || "Platform"}`,
    default: process.env.NEXT_PUBLIC_APP_NAME || "WhatsApp Cloud API & CRM Platform",
  },
  description: "Platform WhatsApp Cloud API resmi, Instagram DM & Omnichannel CRM untuk kemudahan bisnis Anda.",
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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans group/body antialiased">{children}</body>
    </html>
  )
}
