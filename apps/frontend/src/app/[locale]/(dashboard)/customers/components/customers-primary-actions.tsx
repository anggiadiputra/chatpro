"use client"

import { useState } from "react"
import { Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomersMutateDrawer } from "./customers-mutate-drawer"

export function CustomersPrimaryActions() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleImport = () => {
    // TODO: Open import dialog
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleImport}>
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>
      <Button size="sm" onClick={() => setIsCreateOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Customer
      </Button>

      <CustomersMutateDrawer
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  )
}
