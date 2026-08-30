"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useBrandingContext } from "./branding-provider"

// Comprehensive route to page title dictionary
const ROUTE_TITLES: Record<string, string> = {
  "/": "WhatsApp & Omnichannel Platform",
  "/login": "Masuk / Login",
  "/register": "Daftar Akun / Register",
  "/forgot-password": "Lupa Password",
  "/accept-invitation": "Terima Undangan",
  "/dashboard": "Dashboard",
  "/oneinbox": "OneInbox (Live Chat)",
  "/messages": "Pesan / Messages",
  "/waba": "WhatsApp WABA",
  "/waba/callback": "WABA Setup Callback",
  "/instagram": "Instagram DM",
  "/instagram/inbox": "Instagram Inbox",
  "/broadcast": "Broadcast Pesan",
  "/templates": "Template Pesan",
  "/customers": "Kontak & Pelanggan",
  "/crm/pipeline": "CRM Pipeline",
  "/analytics": "Analitik Performa",
  "/insights": "Insights & Biaya",
  "/ai": "AI Assistant & Agents",
  "/team": "Manajemen Tim",
  "/subscription": "Paket Langganan",
  "/profile": "Profil Saya",
  "/settings": "Pengaturan Akun",
  "/settings/crm": "Pengaturan CRM",
  "/developers": "Developer Platform",
  "/developers/overview": "Ringkasan API",
  "/developers/api-keys": "API Keys",
  "/developers/webhooks": "Webhooks",
  "/developers/events-&-logs": "Event & Log Aktivitas",
  "/help-support": "Bantuan & Dukungan",
  "/terms": "Syarat & Ketentuan",
  "/privacy": "Kebijakan Privasi",
  "/admin": "Admin Dashboard",
  "/admin/users": "Manajemen Pengguna",
  "/admin/subscription-plans": "Paket & Fitur Admin",
  "/admin/subscriptions": "Kelola Langganan Admin",
  "/admin/revenue": "Pendapatan & Transaksi",
  "/admin/audit": "Audit Log",
  "/admin/settings": "Konfigurasi Admin",
  "/admin/settings/branding": "Pengaturan Branding",
  "/admin/system": "Status Sistem & PM2",
  "/401": "401 Tidak Diizinkan",
  "/403": "403 Akses Ditolak",
  "/404": "404 Halaman Tidak Ditemukan",
  "/503": "503 Layanan Sedang Pemeliharaan",
  "/error": "Terjadi Kesalahan",
}

function resolvePageTitle(pathname: string): string {
  // Strip locale prefix (e.g. /id, /en)
  const cleanPath = pathname.replace(/^\/(?:id|en)(?=\/|$)/, "") || "/"

  // Direct match
  if (ROUTE_TITLES[cleanPath]) {
    return ROUTE_TITLES[cleanPath]
  }

  // Dynamic route patterns
  if (cleanPath.startsWith("/developers/webhooks/")) {
    return "Detail Webhook"
  }
  if (cleanPath.startsWith("/admin/users/")) {
    return "Detail Pengguna"
  }
  if (cleanPath.startsWith("/customers/")) {
    return "Detail Pelanggan"
  }

  // Fallback: capitalize last segment
  const segments = cleanPath.split("/").filter(Boolean)
  if (segments.length > 0) {
    const last = segments[segments.length - 1]
    return last
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return "Dashboard"
}

export function RouteTitleTracker() {
  const pathname = usePathname()
  const { websiteName } = useBrandingContext()

  useEffect(() => {
    if (!pathname) return

    const brand = websiteName || process.env.NEXT_PUBLIC_APP_NAME || "Platform"
    const pageTitle = resolvePageTitle(pathname)

    if (pathname === "/" || pathname === "/id" || pathname === "/en") {
      document.title = `${brand} - ${pageTitle}`
    } else {
      document.title = `${pageTitle} | ${brand}`
    }
  }, [pathname, websiteName])

  return null
}
