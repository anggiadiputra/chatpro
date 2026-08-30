"use client"

import { useState } from "react"
import { Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { TemplatesMutateDrawer } from "./templates-mutate-drawer"

export function TemplatesPrimaryActions() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
      const response = await fetch(`${apiUrl}/api/v1/templates/sync`, {
        method: "POST",
        credentials: "include",
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Templates Synced!",
          description:
            result.data.message || "Templates synced successfully from Meta",
        })
        // Reload to show new templates
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast({
          title: "Sync Failed",
          description:
            result.error?.message || "Failed to sync templates from Meta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error syncing templates:", error)
      toast({
        title: "Sync Error",
        description: "An error occurred while syncing templates",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing}
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Syncing..." : "Sync from Meta"}
      </Button>
      <Button size="sm" onClick={() => setIsCreateOpen(true)}>
        <Plus className="h-4 w-4" />
        Create Template
      </Button>

      <TemplatesMutateDrawer
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  )
}
