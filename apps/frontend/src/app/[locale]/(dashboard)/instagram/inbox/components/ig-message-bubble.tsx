"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Heart, Check, CheckCheck, AlertCircle } from "lucide-react"
import type { IGMessage } from "@/lib/api/instagram"
import { format } from "date-fns"
import { MediaPreview, MediaType } from "@/app/[locale]/(dashboard)/messages/components/media-preview"

interface Props {
  message: IGMessage
  onReact: () => void
}

// Map Instagram message types to MediaPreview types
function getMediaType(messageType: string): MediaType | null {
  switch (messageType) {
    case "IMAGE":
      return "image"
    case "VIDEO":
      return "video"
    case "AUDIO":
      return "audio"
    default:
      return null
  }
}

export function IGMessageBubble({ message, onReact }: Props) {
  const isOutbound = message.direction === "OUTBOUND"
  const isMedia = ["IMAGE", "VIDEO", "AUDIO"].includes(message.messageType)
  const isSticker = message.messageType === "STICKER"
  const isStoryReply = message.messageType === "STORY_REPLY"
  const isStoryMention = message.messageType === "STORY_MENTION"

  const renderStatus = () => {
    if (!isOutbound) return null

    switch (message.status) {
      case "PENDING":
        return <Check className="h-3 w-3 text-muted-foreground" />
      case "SENT":
        return <Check className="h-3 w-3 text-muted-foreground" />
      case "DELIVERED":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case "READ":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case "FAILED":
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  const renderContent = () => {
    // Heart sticker
    if (isSticker) {
      return <span className="text-4xl">❤️</span>
    }

    // Story reply/mention
    if (isStoryReply || isStoryMention) {
      return (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground italic">
            {isStoryReply ? "Replied to your story" : "Mentioned you in their story"}
          </p>
          {message.text && <p>{message.text}</p>}
        </div>
      )
    }

    // Media message - use MediaPreview component for consistency
    if (isMedia && message.mediaUrl) {
      const mediaType = getMediaType(message.messageType)
      if (mediaType) {
        return (
          <MediaPreview
            mediaUrl={message.mediaUrl}
            mediaType={mediaType}
            caption={message.text || undefined}
            isOutbound={isOutbound}
          />
        )
      }
    }

    // Text message
    return <p className="whitespace-pre-wrap break-words">{message.text}</p>
  }

  return (
    <div
      className={cn(
        "flex mb-3 group",
        isOutbound ? "justify-end" : "justify-start"
      )}
    >
      <div className="flex items-end gap-1 max-w-[75%]">
        {/* React button (for inbound messages) */}
        {!isOutbound && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReact}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="React with ❤️"
          >
            <Heart className="h-3 w-3" />
          </Button>
        )}

        <div
          className={cn(
            "px-4 py-2 rounded-2xl",
            isOutbound
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md"
              : "bg-muted rounded-bl-md",
            isSticker && "bg-transparent px-2 py-1"
          )}
        >
          {renderContent()}

          {/* Reaction indicator */}
          {message.reaction && (
            <div className="flex justify-end mt-1">
              <span className="text-sm">❤️</span>
            </div>
          )}

          {/* Timestamp and status */}
          <div
            className={cn(
              "flex items-center gap-1 mt-1",
              isOutbound ? "justify-end" : "justify-start"
            )}
          >
            <span
              className={cn(
                "text-xs",
                isOutbound ? "text-white/70" : "text-muted-foreground"
              )}
            >
              {format(new Date(message.timestamp), "HH:mm")}
            </span>
            {renderStatus()}
          </div>

          {/* Error message */}
          {message.status === "FAILED" && message.errorMessage && (
            <p className="text-xs text-red-300 mt-1">{message.errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  )
}
