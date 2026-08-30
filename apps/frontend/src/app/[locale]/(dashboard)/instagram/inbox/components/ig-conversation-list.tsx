"use client"

import { formatDistanceToNow } from "date-fns"
import { RefreshCw, Search, Instagram } from "lucide-react"
import type { IGConversation } from "@/lib/api/instagram"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Props {
  conversations: IGConversation[]
  selectedConversation: IGConversation | null
  onSelectConversation: (conversation: IGConversation) => void
  loading: boolean
  onRefresh: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearch: (query: string) => void
  className?: string
}

export function IGConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading,
  onRefresh,
  searchQuery,
  onSearchChange,
  onSearch,
  className,
}: Props) {
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  return (
    <div className={`flex w-full flex-col border-r md:w-[320px] ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Instagram className="h-5 w-5 text-pink-500" />
            Instagram DMs
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {conversations.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {conversations.length} conversation
            {conversations.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="border-b p-3">
        <div className="relative">
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
        </div>
      </form>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Instagram className="h-8 w-8 text-white" />
            </div>
            <p className="mb-1 text-sm font-medium">No conversations yet</p>
            <p className="text-muted-foreground text-xs">
              Conversations will appear when users message you on Instagram
            </p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const isSelected = selectedConversation?.id === conversation.id
            const hasUnread = conversation.unreadCount > 0

            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`flex w-full items-start gap-3 border-b p-4 transition-all duration-150 ${
                  isSelected
                    ? "bg-accent border-l-4 border-l-pink-500"
                    : "hover:bg-accent/50 border-l-4 border-l-transparent"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={conversation.participantProfilePic || undefined}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {conversation.participantUsername
                        ?.substring(0, 2)
                        .toUpperCase() || "IG"}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.isWindowActive && (
                    <div className="border-background absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 bg-green-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <p
                      className={`truncate font-semibold ${isSelected ? "text-pink-600" : ""}`}
                    >
                      @{conversation.participantUsername || "Unknown"}
                    </p>
                    {conversation.lastMessageAt && (
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(
                          new Date(conversation.lastMessageAt),
                          { addSuffix: false }
                        )}
                      </span>
                    )}
                  </div>

                  {conversation.participantName && (
                    <p className="text-muted-foreground mb-1 text-xs">
                      {conversation.participantName}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <p
                      className={`truncate text-sm ${hasUnread ? "font-medium" : "text-muted-foreground"}`}
                    >
                      {conversation.lastMessagePreview || "No messages"}
                    </p>
                    {hasUnread && (
                      <Badge className="ml-2 flex h-5 min-w-5 items-center justify-center bg-pink-500 text-xs text-white">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>

                  {/* Window status indicator */}
                  {!conversation.isWindowActive && (
                    <p className="mt-1 text-xs text-amber-600">
                      ⚠️ 24h window closed
                    </p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </ScrollArea>
    </div>
  )
}
