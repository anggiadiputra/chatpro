"use client"

import { useState } from "react"
import {
  Loader2,
  EllipsisVertical,
  SquarePen,
  Trash2,
  Play,
  ToggleLeft,
  ToggleRight,
  History,
} from "lucide-react"
import { webhooksApi, type WebhookEndpoint } from "@/lib/api/webhooks-api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { MutateWebhook } from "./mutate-webhook"
import { WebhookLogsDialog } from "./webhook-logs-dialog"
import { WebhookTestDialog } from "./webhook-test-dialog"
import { useWebhooksContext } from "./webhooks-context"

interface Props {
  webhook: WebhookEndpoint
}

export function WebhookRowActions({ webhook }: Props) {
  const { onWebhookUpdated, onWebhookDeleted } = useWebhooksContext()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [logsOpen, setLogsOpen] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await webhooksApi.delete(webhook.id)
      onWebhookDeleted(webhook.id)
      toast({
        title: "Webhook Deleted",
        description: `"${webhook.name}" has been deleted successfully.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete webhook",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteOpen(false)
    }
  }

  const handleToggle = async () => {
    try {
      setIsToggling(true)
      const updated = await webhooksApi.update(webhook.id, {
        isActive: !webhook.isActive,
      })
      onWebhookUpdated(updated)
      toast({
        title: webhook.isActive ? "Webhook Disabled" : "Webhook Enabled",
        description: `"${webhook.name}" has been ${webhook.isActive ? "disabled" : "enabled"}.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update webhook",
        variant: "destructive",
      })
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <EllipsisVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => setTestOpen(true)}>
            <Play className="mr-2 h-4 w-4" />
            Test Webhook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLogsOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            View Logs
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <SquarePen className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggle} disabled={isToggling}>
            {isToggling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : webhook.isActive ? (
              <ToggleLeft className="mr-2 h-4 w-4" />
            ) : (
              <ToggleRight className="mr-2 h-4 w-4" />
            )}
            {webhook.isActive ? "Disable" : "Enable"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MutateWebhook
        open={editOpen}
        setOpen={setEditOpen}
        currentWebhook={webhook}
        onSuccess={onWebhookUpdated}
      />

      <WebhookTestDialog
        open={testOpen}
        onOpenChange={setTestOpen}
        webhook={webhook}
      />

      <WebhookLogsDialog
        open={logsOpen}
        onOpenChange={setLogsOpen}
        webhook={webhook}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Webhook"
        desc={
          <span>
            Are you sure you want to delete <strong>{webhook.name}</strong>?
            This action cannot be undone and no future events will be sent to
            this endpoint.
          </span>
        }
        confirmText={
          isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            "Delete"
          )
        }
        destructive
        isLoading={isDeleting}
        handleConfirm={handleDelete}
      />
    </>
  )
}
