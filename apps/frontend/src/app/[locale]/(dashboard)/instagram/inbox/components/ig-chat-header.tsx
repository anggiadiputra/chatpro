"use client"

import { ArrowLeft, ExternalLink, Instagram } from "lucide-react"
import type { IGConversation } from "@/lib/api/instagram"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Props {
  conversation: IGConversation
  onBack: () => void
}

export function IGChatHeader({ conversation, onBack }: Props) {
  const openInstagramProfile = () => {
    if (conversation.participantUsername) {
      window.open(
        `https://instagram.com/${conversation.participantUsername}`,
        "_blank"
      )
    }
  }

  return (
    <div className="bg-background flex items-center gap-3 border-b p-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="h-8 w-8 p-0 md:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <Avatar className="h-10 w-10">
        <AvatarImage src={conversation.participantProfilePic || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          {conversation.participantUsername?.substring(0, 2).toUpperCase() ||
            "IG"}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">
            @{conversation.participantUsername || "Unknown"}
          </p>
          {conversation.isFollower && (
            <Badge variant="secondary" className="text-xs">
              Follower
            </Badge>
          )}
          {conversation.isFollowing && (
            <Badge variant="outline" className="text-xs">
              Following
            </Badge>
          )}
        </div>
        {conversation.participantName && (
          <p className="text-muted-foreground truncate text-sm">
            {conversation.participantName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={openInstagramProfile}
          className="h-8 w-8 p-0"
          title="View Instagram Profile"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
          <Instagram className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  )
}
