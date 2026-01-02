"use client"

import { Button } from "@/components/ui/button"
import { IconPlus, IconUpload } from "@tabler/icons-react"
import { useState } from "react"
import { CustomersMutateDrawer } from "./customers-mutate-drawer"

export function CustomersPrimaryActions() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleImport = () => {
    // TODO: Open import dialog
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleImport}>
        <IconUpload className="h-4 w-4" />
        Import CSV
      </Button>
      <Button size="sm" onClick={() => setIsCreateOpen(true)}>
        <IconPlus className="h-4 w-4" />
        Add Customer
      </Button>

      <CustomersMutateDrawer
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  )
}
