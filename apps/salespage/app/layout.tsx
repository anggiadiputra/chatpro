import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://prochat.work"),
  title: "Pro.Chat - Omnichannel CRM WhatsApp & Instagram dalam Satu Platform",
  description:
    "Platform omnichannel CRM untuk mengelola WhatsApp Business API dan Instagram DM dalam satu dashboard. Setup cepat, support lokal Indonesia, AI chatbot 24/7.",
  keywords: [
    "whatsapp business api",
    "instagram dm",
    "omnichannel crm",
    "customer service",
    "chatbot ai",
    "pro.chat",
    "whatsapp api indonesia",
    "crm indonesia",
    "unified inbox",
    "multi agent support",
  ],
  authors: [{ name: "Pro.Chat" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "https://prochat.work/",
    title: "Pro.Chat - Omnichannel CRM WhatsApp & Instagram dalam Satu Platform",
    description:
      "Platform omnichannel CRM untuk mengelola WhatsApp Business API dan Instagram DM dalam satu dashboard. Setup cepat, support lokal Indonesia, AI chatbot 24/7.",
    siteName: "Pro.Chat",
    locale: "id_ID",
    images: [
      {
        url: "/og-image.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pro.Chat - Omnichannel CRM WhatsApp & Instagram dalam Satu Platform",
    description:
      "Platform omnichannel CRM untuk mengelola WhatsApp Business API dan Instagram DM dalam satu dashboard. Setup cepat, support lokal Indonesia, AI chatbot 24/7.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Pro.Chat",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Platform omnichannel CRM untuk mengelola WhatsApp Business API dan Instagram DM dalam satu dashboard.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "IDR",
              },
            }),
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-[#22c55e] selection:text-white">
        <Navbar />
        <main className="pt-24">{children}</main>
        <Footer />

        {/* Decorative Shapes - Floating Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#22c55e]/5 rounded-full blur-3xl"></div>
          <div className="absolute -top-10 right-20 w-48 h-48 bg-[#db2777]/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 -left-10 w-32 h-32 bg-[#f59e0b]/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-40 right-10 w-24 h-24 bg-[#047857]/10 rounded-full blur-xl"></div>
        </div>
      </body>
    </html>
  );
}
