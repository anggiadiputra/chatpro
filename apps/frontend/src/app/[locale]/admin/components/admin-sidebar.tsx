"use client"

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
import {
  IconLayoutDashboard,
  IconUsers,
  IconCreditCard,
  IconActivity,
  IconFileText,
  IconArrowLeft,
  IconShieldLock,
  IconSettings,
  IconCash,
  IconPalette,
} from "@tabler/icons-react"
import { Link, usePathname } from "@/i18n/routing"

const adminNavItems = [
  {
    title: "Overview",
    url: "/admin",
    icon: IconLayoutDashboard,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: IconUsers,
  },
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: IconCreditCard,
  },
  {
    title: "Revenue",
    url: "/admin/revenue",
    icon: IconCash,
  },
  {
    title: "System Health",
    url: "/admin/system",
    icon: IconActivity,
  },
  {
    title: "Audit Logs",
    url: "/admin/audit",
    icon: IconFileText,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: IconSettings,
  },
  {
    title: "Branding",
    url: "/admin/settings/branding",
    icon: IconPalette,
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()

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
                <IconShieldLock className="size-5 text-primary" />
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-semibold">Admin Panel</span>
                <span className="truncate text-xs text-muted-foreground">KirimChat</span>
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
                  isActive={pathname === item.url || (item.url !== "/admin" && pathname.startsWith(item.url))}
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
                  <IconArrowLeft className="size-4" />
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
