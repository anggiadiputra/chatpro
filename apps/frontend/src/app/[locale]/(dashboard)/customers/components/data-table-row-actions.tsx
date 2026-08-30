"use client"

import { Row } from "@tanstack/react-table"
import {
  MoreHorizontal,
  SquarePen,
  Trash2,
  Eye,
} from "lucide-react"
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Customer } from "../data/schema"

interface Props {
  row: Row<Customer>
  onView: (customer: Customer) => void
  onEdit: (customer: Customer) => void
}

export function DataTableRowActions({ row, onView, onEdit }: Props) {
  const customer = row.original

  const handleView = () => {
    onView(customer)
  }

  const handleEdit = () => {
    onEdit(customer)
  }

  const handleSendMessage = () => {
    // TODO: Open message dialog or redirect to messages page
  }

  const handleDelete = () => {
    // TODO: Show confirmation dialog
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={handleView}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <SquarePen className="mr-2 h-4 w-4" />
          Edit Customer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSendMessage}>
          <WhatsAppIcon size={16} className="mr-2 text-green-500" />
          Send Message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
