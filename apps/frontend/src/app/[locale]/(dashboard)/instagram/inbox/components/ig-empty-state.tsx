"use client"

import { Instagram } from "lucide-react"

export function IGEmptyState() {
  return (
    <div className="bg-muted/30 hidden flex-1 items-center justify-center md:flex">
      <div className="text-center">
        <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
          <Instagram className="h-10 w-10 text-white" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">
          Instagram Direct Messages
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Select a conversation from the list to view and reply to messages
        </p>
      </div>
    </div>
  )
}
