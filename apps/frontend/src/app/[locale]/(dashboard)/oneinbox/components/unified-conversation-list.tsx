"use client"

import { formatDistanceToNow } from "date-fns"
import {
  RefreshCw,
  Search,
  Instagram,
  Inbox,
  FilterX,
} from "lucide-react"
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type {
  UnifiedConversation,
  ChannelType,
  ReadStatusFilter,
  AssignmentFilterType,
  AssignableUser,
  PipelineStage,
} from "../types/unified-inbox"
import { AIStatusIndicator } from "./ai-status-indicator"
import { AssignmentBadge } from "./assignment-badge"
import { AssignmentFilter } from "./assignment-filter"
import { ChannelFilter } from "./channel-filter"
import { FilterBar } from "./filter-bar"

interface UnifiedConversationListProps {
  conversations: UnifiedConversation[]
  selectedConversation: UnifiedConversation | null
  onSelectConversation: (conversation: UnifiedConversation) => void
  loading: boolean
  onRefresh: () => void
  channelFilter: ChannelType | "all"
  onChannelFilterChange: (filter: ChannelType | "all") => void
  searchQuery: string
  onSearchChange: (query: string) => void
  whatsappConnected: boolean
  instagramConnected: boolean | null
  // Filter props
  readStatusFilter: ReadStatusFilter
  onReadStatusChange: (status: ReadStatusFilter) => void
  tagsFilter: string[]
  onTagsChange: (tags: string[]) => void
  pipelineFilter: string[]
  onPipelineChange: (stages: string[]) => void
  availableTags: string[]
  pipelineStages: PipelineStage[]
  onClearFilters: () => void
  // Assignment filter props (Requirements: 5.1)
  assignmentFilter: AssignmentFilterType
  onAssignmentFilterChange: (filter: AssignmentFilterType) => void
  assignableUsers: AssignableUser[]
  // AI status props (Requirements: 5.1, 5.2, 5.3, 5.4)
  aiEnabled: boolean
  defaultAIAgentName?: string | null
  className?: string
}

export function UnifiedConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading,
  onRefresh,
  channelFilter,
  onChannelFilterChange,
  searchQuery,
  onSearchChange,
  whatsappConnected,
  instagramConnected,
  readStatusFilter,
  onReadStatusChange,
  tagsFilter,
  onTagsChange,
  pipelineFilter,
  onPipelineChange,
  availableTags,
  pipelineStages,
  onClearFilters,
  assignmentFilter,
  onAssignmentFilterChange,
  assignableUsers,
  aiEnabled,
  defaultAIAgentName,
  className,
}: UnifiedConversationListProps) {
  const getInitials = (name?: string | null, identifier?: string) => {
    if (name) return name.substring(0, 2).toUpperCase()
    if (identifier)
      return identifier.replace(/[@+]/g, "").substring(0, 2).toUpperCase()
    return "U"
  }

  const hasActiveFilters =
    readStatusFilter !== "all" ||
    assignmentFilter !== "all" ||
    tagsFilter.length > 0 ||
    pipelineFilter.length > 0

  const getChannelIcon = (channel: ChannelType) => {
    if (channel === "whatsapp") {
      return <WhatsAppIcon size={16} className="text-green-500" />
    }
    return <Instagram className="h-4 w-4 text-pink-500" />
  }

  const getChannelColor = (channel: ChannelType, isSelected: boolean) => {
    if (!isSelected) return "border-l-transparent"
    return channel === "whatsapp" ? "border-l-green-500" : "border-l-pink-500"
  }

  const getAvatarStyle = (channel: ChannelType) => {
    if (channel === "instagram") {
      return "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
    }
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
  }

  return (
    <div className={`flex w-full flex-col border-r md:w-[360px] ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Inbox className="text-primary h-5 w-5" />
            OneInbox
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

        {/* Filter Dropdowns - Side by side */}
        <div className="flex gap-2">
          {/* Channel Filter */}
          <div className="flex-1">
            <ChannelFilter
              value={channelFilter}
              onChange={onChannelFilterChange}
            />
          </div>

          {/* Assignment Filter (Requirements: 5.1) */}
          <div className="flex-1">
            <AssignmentFilter
              value={assignmentFilter}
              onChange={onAssignmentFilterChange}
            />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="border-b p-3">
        <div className="relative">
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        readStatusFilter={readStatusFilter}
        onReadStatusChange={onReadStatusChange}
        tagsFilter={tagsFilter}
        onTagsChange={onTagsChange}
        pipelineFilter={pipelineFilter}
        onPipelineChange={onPipelineChange}
        availableTags={availableTags}
        availableStages={pipelineStages}
        resultCount={conversations.length}
        onClearFilters={onClearFilters}
      />

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
              {hasActiveFilters ? (
                <FilterX className="text-primary h-8 w-8" />
              ) : (
                <Inbox className="text-primary h-8 w-8" />
              )}
            </div>
            <p className="mb-1 text-sm font-medium">
              {hasActiveFilters
                ? "No conversations match your filters"
                : "No conversations yet"}
            </p>
            <p className="text-muted-foreground mb-3 text-xs">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results"
                : "Messages from WhatsApp and Instagram will appear here"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          conversations.map((conversation) => {
            const isSelected = selectedConversation?.id === conversation.id
            const hasUnread = conversation.unreadCount > 0

            // Build assignee object for AssignmentBadge (Requirements: 4.1, 4.2)
            const assignee: AssignableUser | null = conversation.assigneeId
              ? assignableUsers.find(
                  (u) => u.id === conversation.assigneeId
                ) || {
                  id: conversation.assigneeId,
                  name: conversation.assigneeName || "Unknown",
                  email: "",
                  image: conversation.assigneeImage,
                  role: "AGENT" as const,
                }
              : null

            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`flex w-full items-start gap-3 border-b border-l-4 p-4 transition-all duration-150 ${
                  isSelected
                    ? `bg-accent ${getChannelColor(conversation.channel, true)}`
                    : `hover:bg-accent/50 ${getChannelColor(conversation.channel, false)}`
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={conversation.participantAvatar || undefined}
                    />
                    <AvatarFallback
                      className={getAvatarStyle(conversation.channel)}
                    >
                      {getInitials(
                        conversation.participantName,
                        conversation.participantDisplayId
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {/* Channel indicator */}
                  <div className="bg-background absolute -right-1 -bottom-1 rounded-full p-0.5">
                    {getChannelIcon(conversation.channel)}
                  </div>
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <p
                        className={`truncate font-semibold ${
                          isSelected
                            ? conversation.channel === "whatsapp"
                              ? "text-green-600"
                              : "text-pink-600"
                            : ""
                        }`}
                      >
                        {conversation.participantName ||
                          conversation.participantDisplayId}
                      </p>
                      {/* Assignment Badge (Requirements: 1.5, 1.6, 4.1, 4.2) */}
                      <AssignmentBadge
                        assignee={assignee}
                        size="sm"
                        showTooltip={true}
                        assigneeType={conversation.assigneeType}
                        aiAgentName={conversation.aiAgentName}
                      />
                      {/* AI Status Indicator (Requirements: 5.1, 5.2, 5.3, 5.4) */}
                      <AIStatusIndicator
                        assignment={null}
                        aiEnabled={aiEnabled}
                        defaultAIAgentName={defaultAIAgentName}
                        size="sm"
                        showTooltip={true}
                        assigneeType={conversation.assigneeType}
                        aiAgentName={conversation.aiAgentName}
                        hasHumanAssignee={
                          !!conversation.assigneeId &&
                          conversation.assigneeType !== "AI_AGENT"
                        }
                      />
                    </div>
                    {conversation.lastMessageAt && (
                      <span className="text-muted-foreground ml-2 flex-shrink-0 text-xs">
                        {formatDistanceToNow(conversation.lastMessageAt, {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>

                  {conversation.participantName && (
                    <p className="text-muted-foreground mb-1 text-xs">
                      {conversation.participantDisplayId}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <p
                      className={`truncate text-sm ${hasUnread ? "font-medium" : "text-muted-foreground"}`}
                    >
                      {conversation.lastMessagePreview || "No messages"}
                    </p>
                    {hasUnread && (
                      <Badge
                        className={`ml-2 flex h-5 min-w-5 items-center justify-center text-xs text-white ${
                          conversation.channel === "whatsapp"
                            ? "bg-green-500"
                            : "bg-pink-500"
                        }`}
                      >
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
