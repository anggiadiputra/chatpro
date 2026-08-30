"use client"

import { Link } from "@/i18n/routing"
import { Row } from "@tanstack/react-table"
import { MoreHorizontal, ListChecks, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Types
export type Role = "ADMIN" | "BUSINESS_OWNER" | "AGENT"

export interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
  subscriptionTier: string
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
  wabaConnectionStatus?: string | null
}

interface Props {
  row: Row<AdminUser>
  onActivate?: (user: AdminUser) => void
  onDeactivate?: (user: AdminUser) => void
}

export function DataTableRowActions({ row, onActivate, onDeactivate }: Props) {
  const user = row.original
  const isActive = user.isActive

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem asChild>
          <Link href={`/admin/users/${user.id}`}>
            View Detail
            <DropdownMenuShortcut>
              <ListChecks size={16} />
            </DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isActive ? (
          <DropdownMenuItem
            onClick={() => onDeactivate?.(user)}
            className="text-red-500!"
          >
            Deactivate
            <DropdownMenuShortcut>
              <UserX size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onActivate?.(user)}
            className="text-green-600!"
          >
            Activate
            <DropdownMenuShortcut>
              <UserCheck size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
