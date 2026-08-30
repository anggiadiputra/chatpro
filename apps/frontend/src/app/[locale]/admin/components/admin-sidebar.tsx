"use client"

import { Link, usePathname } from "@/i18n/routing"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  FileText,
  ArrowLeft,
  ShieldAlert,
  Settings,
  Banknote,
  Palette,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { useBrandingContext } from "@/components/branding-provider"

const adminNavItems = [
  {
    title: "Overview",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Revenue",
    url: "/admin/revenue",
    icon: Banknote,
  },
  {
    title: "System Health",
    url: "/admin/system",
    icon: Activity,
  },
  {
    title: "Audit Logs",
    url: "/admin/audit",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Branding",
    url: "/admin/settings/branding",
    icon: Palette,
  },
]

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const { websiteName } = useBrandingContext()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="ring-sidebar-primary/50 focus-visible:ring-1"
            >
              <div className="flex aspect-square size-8 items-center justify-center">
                <ShieldAlert className="text-primary size-5" />
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-semibold">Admin Panel</span>
                <span className="text-muted-foreground truncate text-xs">
                  {websiteName || "Management"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarMenu>
            {adminNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === item.url ||
                    (item.url !== "/admin" && pathname.startsWith(item.url))
                  }
                  tooltip={item.title}
                >
                  <Link href={item.url} onClick={() => setOpenMobile(false)}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Back to Dashboard">
                <Link href="/dashboard" onClick={() => setOpenMobile(false)}>
                  <ArrowLeft className="size-4" />
                  <span>Back to Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
