"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { History, UserPlus, UserX, Bot } from "lucide-react"
import { useTranslations } from "next-intl"
import { assignmentApi } from "@/lib/api/assignment-api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  AssignmentHistoryItem,
  ChannelType,
} from "../../types/unified-inbox"

/**
 * AssignmentHistorySection Component
 *
 * Displays the assignment history for a conversation in the customer panel.
 * Shows chronological list of assignments with assignee name, assigned by, and timestamps.
 * Supports both human and AI Agent assignments with distinct visual indicators.
 *
 * Requirements: 7.1, 7.2, 7.3, 8.2, 8.3
 */

interface AssignmentHistorySectionProps {
  conversationId: string
  conversationType: ChannelType
  maxDisplay?: number
}

export function AssignmentHistorySection({
  conversationId,
  conversationType,
  maxDisplay = 5,
}: AssignmentHistorySectionProps) {
  const t = useTranslations("messages.assignment.history")
  const tErrors = useTranslations("messages.assignment.errors")
  const [history, setHistory] = useState<AssignmentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  // Extract raw conversation ID (remove wa- or ig- prefix)
  const rawConversationId = conversationId.replace(/^(wa|ig)-/, "")

  // Load assignment history
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await assignmentApi.getAssignmentHistory(
          rawConversationId,
          conversationType
        )
        setHistory(data)
      } catch (err: any) {
        console.error("Failed to load assignment history:", err)
        setError(tErrors("loadFailed"))
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [rawConversationId, conversationType, tErrors])

  const displayedHistory = showAll ? history : history.slice(0, maxDisplay)
  const hasMore = history.length > maxDisplay
  const remainingCount = history.length - maxDisplay

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  /**
   * Get display name for an assignment history item
   * Shows "AI Agent: [Name]" for AI assignments, user name for human assignments
   * Requirements: 7.1, 7.2, 7.3
   */
  const getDisplayName = (item: AssignmentHistoryItem): string => {
    if (item.assigneeType === "AI_AGENT" && item.aiAgentName) {
      return `AI Agent: ${item.aiAgentName}`
    }
    return item.assigneeName || "Unknown"
  }

  /**
   * Check if assignment is to an AI Agent
   * Requirements: 7.1
   */
  const isAIAgentAssignment = (item: AssignmentHistoryItem): boolean => {
    return item.assigneeType === "AI_AGENT"
  }

  if (loading) {
    return (
      <div className="border-b p-4">
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-b p-4">
        <div className="mb-3 flex items-center gap-2">
          <History className="text-muted-foreground h-4 w-4" />
          <h4 className="text-sm font-medium">{t("title")}</h4>
        </div>
        <p className="text-destructive text-xs">{error}</p>
      </div>
    )
  }

  return (
    <div className="border-b p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <History className="text-muted-foreground h-4 w-4" />
          {t("title")}
        </h4>
        {history.length > 0 && (
          <span className="text-muted-foreground text-xs">
            {history.length === 1
              ? t("records", { count: history.length })
              : t("recordsPlural", { count: history.length })}
          </span>
        )}
      </div>

      {/* History list */}
      <div className="space-y-2">
        {displayedHistory.length === 0 ? (
          <p className="text-muted-foreground text-xs">{t("noHistory")}</p>
        ) : (
          displayedHistory.map((item) => {
            const isActive = !item.unassignedAt
            const isAI = isAIAgentAssignment(item)
            const displayName = getDisplayName(item)

            return (
              <div
                key={item.id}
                className={`rounded-md p-2 text-sm ${
                  isActive
                    ? "bg-primary/10 border-primary/20 border"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Assignee avatar - show robot icon for AI Agent, avatar for human */}
                  {isAI ? (
                    <div className="bg-primary/20 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                      <Bot className="text-primary h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                        {getInitials(item.assigneeName || "?")}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="min-w-0 flex-1">
                    {/* Assignee name and status */}
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium">
                        {displayName}
                      </span>
                      {isActive && (
                        <span className="bg-primary/20 text-primary rounded px-1.5 py-0.5 text-[10px] font-medium">
                          {t("current")}
                        </span>
                      )}
                    </div>

                    {/* Assignment details */}
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      <div className="flex items-center gap-1">
                        <UserPlus className="h-3 w-3" />
                        <span>
                          {t("assignedBy", {
                            name: item.assignedByName || "Unknown",
                          })}{" "}
                          •{" "}
                          {formatDistanceToNow(item.assignedAt, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      {item.unassignedAt && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <UserX className="h-3 w-3" />
                          <span>
                            {t("unassignedTime", {
                              time: formatDistanceToNow(item.unassignedAt, {
                                addSuffix: true,
                              }),
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Show more/less button */}
      {hasMore && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="mt-2 w-full text-xs"
        >
          {remainingCount === 1
            ? t("showMore", { count: remainingCount })
            : t("showMorePlural", { count: remainingCount })}
        </Button>
      )}
      {showAll && hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(false)}
          className="mt-2 w-full text-xs"
        >
          {t("showLess")}
        </Button>
      )}
    </div>
  )
}
