"use client"

import {
  BrainCircuit,
  HelpCircle,
  LayoutDashboard,
  Settings,
  MessageSquare,
  Users,
  BarChart3,
  Instagram,
  MessageCircle,
  Inbox,
  Code,
  LayoutTemplate,
  CreditCard,
  Shield,
  RadioTower,
  LineChart,
  Users as UsersGroupIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useBranding } from "@/hooks/use-branding"
import { useBusinessAccount } from "@/hooks/use-business-account"
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"
import { type SidebarData, type NavItem } from "../types"

// Extended NavItem with optional roles for filtering
type NavItemWithRoles = NavItem & { roles?: string[] }

export function useSidebarData(): SidebarData {
  const t = useTranslations("navigation")
  const { userRole } = useBusinessAccount()
  const { websiteName, logoUrl } = useBranding()

  // Filter items based on user role
  const filterByRole = (items: NavItemWithRoles[]): NavItem[] => {
    return items
      .filter((item) => {
        if (!item.roles || item.roles.length === 0) return true
        return item.roles.includes(userRole || "")
      })
      .map(({ roles, ...rest }) => rest as NavItem)
  }

  const navGroups = [
    {
      title: t("global"),
      items: filterByRole([
        {
          title: t("dashboard"),
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: t("inbox"),
          url: "/oneinbox",
          icon: Inbox,
        },
        {
          title: t("templates"),
          url: "/templates",
          icon: LayoutTemplate,
          roles: ["BUSINESS_OWNER", "ADMIN"],
        },
        {
          title: t("broadcast"),
          url: "/broadcast",
          icon: RadioTower,
          roles: ["BUSINESS_OWNER", "ADMIN"],
        },
        {
          title: t("insights"),
          url: "/insights",
          icon: LineChart,
          roles: ["BUSINESS_OWNER", "ADMIN"],
        },
      ]),
    },
    {
      title: t("crm"),
      items: filterByRole([
        {
          title: t("customers"),
          url: "/customers",
          icon: Users,
        },
        {
          title: t("pipeline"),
          url: "/crm/pipeline",
          icon: BarChart3,
          roles: ["BUSINESS_OWNER", "ADMIN"],
        },
      ]),
    },
    {
      title: t("platforms"),
      items: filterByRole([
        {
          title: t("whatsapp"),
          url: "/waba",
          icon: WhatsAppIcon,
          roles: ["BUSINESS_OWNER", "ADMIN"],
        },
        {
          title: t("instagram"),
          url: "/instagram",
          icon: Instagram,
          roles: ["BUSINESS_OWNER", "ADMIN"],
        },
      ]),
    },
    {
      title: t("configuration"),
      items: filterByRole([
        {
          title: t("team"),
          url: "/team",
          icon: UsersGroupIcon,
          roles: ["BUSINESS_OWNER", "ADMIN"],
        },
        {
          title: t("aiChatbot"),
          url: "/ai",
          icon: BrainCircuit,
          roles: ["BUSINESS_OWNER", "ADMIN"],
        },
        {
          title: t("developers"),
          url: "/developers",
          icon: Code,
          roles: ["BUSINESS_OWNER", "ADMIN"],
        },
        {
          title: t("subscription"),
          url: "/subscription",
          icon: CreditCard,
          roles: ["BUSINESS_OWNER", "ADMIN"],
        },
        {
          title: t("settings"),
          url: "/settings",
          icon: Settings,
          roles: ["BUSINESS_OWNER", "ADMIN"],
        },
      ]),
    },
    {
      title: t("support"),
      items: filterByRole([
        {
          title: t("helpSupport"),
          url: "/help-support",
          icon: HelpCircle,
        },
      ]),
    },
    {
      title: t("administration"),
      items: filterByRole([
        {
          title: t("adminPanel"),
          url: "/admin",
          icon: Shield,
          roles: ["ADMIN"],
        },
      ]),
    },
  ]

  // Filter out empty groups
  const filteredNavGroups = navGroups.filter((group) => group.items.length > 0)

  return {
    user: {
      name: "User",
      email: "user@example.com",
      avatar: "/favicon.svg",
    },
    teams: [
      {
        name: websiteName,
        logo: logoUrl
          ? ({ className }: { className: string }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={websiteName} className={className} />
            )
          : ({ className }: { className: string }) => (
              <MessageSquare className={className} />
            ),
        plan: "WhatsApp Business",
      },
    ],
    navGroups: filteredNavGroups,
  }
}
