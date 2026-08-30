"use client"

import {
  LogOut,
  Settings,
  User,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useRouter } from "@/i18n/routing"
import { authClient } from "@/lib/auth-client"
import { clearAllCacheOnLogout } from "@/lib/cache-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useBusinessAccount } from "@/hooks/use-business-account"

interface Props {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function NavUser({ user }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const { userRole } = useBusinessAccount()
  const queryClient = useQueryClient()
  const t = useTranslations("auth")
  const tNav = useTranslations("navigation")

  const isAgent = userRole === "AGENT"

  const handleLogout = async () => {
    try {
      // Clear all cached data before logout to prevent data leakage
      clearAllCacheOnLogout(queryClient)
      
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login")
          }
        }
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("logoutError"),
        description: t("logoutErrorDesc"),
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-9 items-center gap-2.5 rounded-full px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Avatar className="h-7 w-7 border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs font-semibold">
              {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-xs font-medium md:inline-block max-w-[120px] truncate text-slate-700 dark:text-slate-200">
            {user.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {isAgent ? (
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>{tNav("profile")}</span>
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>{tNav("settings")}</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
