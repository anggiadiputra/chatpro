"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Customer } from "../data/schema"
import {
  IconEdit,
  IconTrash,
  IconMessageCircle,
  IconEye,
} from "@tabler/icons-react"

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
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={handleView}>
          <IconEye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <IconEdit className="mr-2 h-4 w-4" />
          Edit Customer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSendMessage}>
          <IconMessageCircle className="mr-2 h-4 w-4" />
          Send Message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          <IconTrash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
