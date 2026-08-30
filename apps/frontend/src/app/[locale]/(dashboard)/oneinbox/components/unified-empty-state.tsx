"use client"

import { Inbox, MessageCircle, Instagram } from "lucide-react"

export function UnifiedEmptyState() {
  return (
    <div className="bg-muted/30 hidden flex-1 items-center justify-center md:flex">
      <div className="max-w-md text-center">
        <div className="bg-primary/10 mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full">
          <Inbox className="text-primary h-10 w-10" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">OneInbox</h3>
        <p className="text-muted-foreground mb-6">
          Select a conversation from the list to view and reply to messages
        </p>
        <div className="text-muted-foreground flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 text-green-500" />
            <span>WhatsApp</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Instagram className="h-4 w-4 text-pink-500" />
            <span>Instagram</span>
          </div>
        </div>
      </div>
    </div>
  )
}
