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
} from "lucide-react"
import { type SidebarData } from "../types"

export const sidebarData: SidebarData = {
  user: {
    name: "User",
    email: "user@kirim.chat",
    avatar: "/favicon.svg",
  },
  teams: [
    {
      name: process.env.NEXT_PUBLIC_APP_NAME || "Kirim.Chat",
      logo: ({ className }: { className: string }) => (
        <MessageSquare className={className} />
      ),
      plan: "WhatsApp Business",
    },
  ],
  navGroups: [
    {
      title: "Global",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Inbox",
          url: "/oneinbox",
          icon: Inbox,
        },
        {
          title: "Templates",
          url: "/templates",
          icon: LayoutTemplate,
        },
      ],
    },
    {
      title: "CRM",
      items: [
        {
          title: "Customers",
          url: "/customers",
          icon: Users,
        },
        {
          title: "Pipeline",
          url: "/crm/pipeline",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Platforms",
      items: [
        {
          title: "WhatsApp",
          url: "/waba",
          icon: MessageCircle,
        },
        {
          title: "Instagram",
          url: "/instagram",
          icon: Instagram,
        },
      ],
    },
    {
      title: "Configuration",
      items: [
        {
          title: "AI Chatbot",
          url: "/ai",
          icon: BrainCircuit,
        },
        {
          title: "Developers",
          url: "/developers",
          icon: Code,
        },
        {
          title: "Subscription",
          url: "/subscription",
          icon: CreditCard,
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          title: "Help & Support",
          url: "/help-support",
          icon: HelpCircle,
        },
      ],
    },
  ],
}
