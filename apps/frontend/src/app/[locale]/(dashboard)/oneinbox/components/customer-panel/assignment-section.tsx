"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Loader2, Check, User, UserX, Bot } from "lucide-react"
import { assignmentApi } from "@/lib/api/assignment-api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type {
  AssignableUser,
  AssignableEntity,
  AssigneeType,
  ChannelType,
} from "../../types/unified-inbox"

/**
 * AssignmentSection Component
 *
 * Dropdown for selecting an assignee for a conversation in the customer panel.
 * Style matches PipelineSection for consistency.
 * Supports both human team members and AI Agents.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

interface AssignmentSectionProps {
  conversationId: string
  conversationType: ChannelType
  currentAssignee: AssignableUser | null
  currentAssigneeType?: AssigneeType
  currentAIAgentId?: string | null
  currentAIAgentName?: string | null
  assignableUsers: AssignableUser[]
  currentUserId: string
  onAssign: (userId: string, type?: "human" | "ai") => Promise<boolean>
  onUnassign: () => Promise<boolean>
  loading?: boolean
}

export function AssignmentSection({
  currentAssignee,
  currentAssigneeType = "HUMAN",
  currentAIAgentId,
  currentAIAgentName,
  assignableUsers,
  currentUserId,
  onAssign,
  onUnassign,
  loading = false,
}: AssignmentSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [isUnassigning, setIsUnassigning] = useState(false)

  // State for AI Agents fetched from API
  const [aiAgents, setAIAgents] = useState<AssignableEntity[]>([])
  const [entitiesLoaded, setEntitiesLoaded] = useState(false)

  // Fetch assignable entities (including AI Agents) when dropdown opens
  useEffect(() => {
    if (isOpen && !entitiesLoaded) {
      fetchAssignableEntities()
    }
  }, [isOpen, entitiesLoaded])

  const fetchAssignableEntities = async () => {
    try {
      const response = await assignmentApi.fetchAssignableEntities()
      setAIAgents(response.aiAgents || [])
      setEntitiesLoaded(true)
    } catch (error) {
      console.error(
        "[AssignmentSection] Failed to fetch assignable entities:",
        error
      )
      setEntitiesLoaded(true)
    }
  }

  // Check if currently assigned to an AI Agent
  const isAssignedToAI =
    currentAssigneeType === "AI_AGENT" && !!currentAIAgentId

  // Determine if there's any current assignment (human or AI)
  const hasCurrentAssignment = !!currentAssignee || isAssignedToAI

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getRoleColor = (role: AssignableUser["role"]): string => {
    return role === "BUSINESS_OWNER"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
  }

  const handleAssign = async (
    userId: string,
    type: "human" | "ai" = "human"
  ) => {
    // Skip if already assigned to same entity
    if (
      type === "human" &&
      userId === currentAssignee?.id &&
      currentAssigneeType === "HUMAN"
    ) {
      setIsOpen(false)
      return
    }
    if (
      type === "ai" &&
      userId === currentAIAgentId &&
      currentAssigneeType === "AI_AGENT"
    ) {
      setIsOpen(false)
      return
    }

    setPendingUserId(userId)
    const success = await onAssign(userId, type)
    if (success) {
      setIsOpen(false)
    }
    setPendingUserId(null)
  }

  const handleUnassign = async () => {
    if (!hasCurrentAssignment) return

    setIsUnassigning(true)
    const success = await onUnassign()
    if (success) {
      setIsOpen(false)
    }
    setIsUnassigning(false)
  }

  // Sort users: current user first, then by role (owner first), then alphabetically
  const sortedUsers = [...assignableUsers].sort((a, b) => {
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1
    if (a.role === "BUSINESS_OWNER" && b.role !== "BUSINESS_OWNER") return -1
    if (b.role === "BUSINESS_OWNER" && a.role !== "BUSINESS_OWNER") return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="border-b p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <User className="text-muted-foreground h-4 w-4" />
          Assigned To
        </h4>
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-full justify-between"
            disabled={loading || assignableUsers.length === 0}
          >
            <div className="flex items-center gap-2">
              {isAssignedToAI ? (
                <>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Bot className="h-3 w-3" />
                  </div>
                  <span className="truncate">
                    {currentAIAgentName || "AI Agent"}
                  </span>
                </>
              ) : currentAssignee ? (
                <>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={currentAssignee.image || undefined} />
                    <AvatarFallback
                      className={`text-[10px] ${getRoleColor(currentAssignee.role)}`}
                    >
                      {getInitials(currentAssignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{currentAssignee.name}</span>
                  {currentAssignee.id === currentUserId && (
                    <span className="text-muted-foreground text-xs">(me)</span>
                  )}
                </>
              ) : (
                <>
                  <UserX className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Unassigned</span>
                </>
              )}
            </div>
            {loading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-2" align="start">
          <div className="text-muted-foreground mb-2 text-xs font-medium">
            Assign to
          </div>

          {/* Team Members Section */}
          <div className="text-muted-foreground mb-1 px-2 text-xs font-medium">
            Team Members
          </div>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {sortedUsers.map((user) => {
              const isSelected =
                user.id === currentAssignee?.id &&
                currentAssigneeType === "HUMAN"
              const isPending = user.id === pendingUserId
              const isCurrentUser = user.id === currentUserId

              return (
                <button
                  key={user.id}
                  onClick={() => handleAssign(user.id, "human")}
                  disabled={isPending || isUnassigning}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm disabled:opacity-50 ${
                    isSelected ? "bg-accent" : "hover:bg-accent"
                  }`}
                >
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback
                      className={`text-[10px] ${getRoleColor(user.role)}`}
                    >
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">
                      {user.name}
                      {isCurrentUser && (
                        <span className="text-muted-foreground ml-1">(me)</span>
                      )}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {user.role === "BUSINESS_OWNER" ? "Owner" : "Agent"}
                    </span>
                  </div>
                  {isPending ? (
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                  ) : isSelected ? (
                    <Check className="h-3 w-3 shrink-0" />
                  ) : null}
                </button>
              )
            })}
            {assignableUsers.length === 0 && (
              <p className="text-muted-foreground px-2 py-1 text-xs">
                No team members available
              </p>
            )}
          </div>

          {/* AI Agents Section */}
          {aiAgents.length > 0 && (
            <>
              <div className="my-2 border-t" />
              <div className="text-muted-foreground mb-1 px-2 text-xs font-medium">
                AI Agents
              </div>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {aiAgents.map((agent) => {
                  const isSelected =
                    isAssignedToAI && currentAIAgentId === agent.id
                  const isPending = agent.id === pendingUserId

                  return (
                    <button
                      key={agent.id}
                      onClick={() => handleAssign(agent.id, "ai")}
                      disabled={isPending || isUnassigning}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm disabled:opacity-50 ${
                        isSelected ? "bg-accent" : "hover:bg-accent"
                      }`}
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Bot className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate">{agent.name}</span>
                        <span className="text-muted-foreground text-xs">
                          AI Agent
                        </span>
                      </div>
                      {isPending ? (
                        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                      ) : isSelected ? (
                        <Check className="h-3 w-3 shrink-0" />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Unassign option */}
          {hasCurrentAssignment && (
            <>
              <div className="my-2 border-t" />
              <button
                onClick={handleUnassign}
                disabled={isUnassigning || !!pendingUserId}
                className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm disabled:opacity-50"
              >
                <UserX className="h-4 w-4 shrink-0" />
                <span>Unassign</span>
                {isUnassigning && (
                  <Loader2 className="ml-auto h-3 w-3 shrink-0 animate-spin" />
                )}
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
