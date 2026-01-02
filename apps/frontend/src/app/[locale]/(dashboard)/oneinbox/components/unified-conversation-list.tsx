"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Search } from "lucide-react"
import { IconBrandWhatsapp, IconBrandInstagram, IconInbox, IconFilterOff } from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import type { UnifiedConversation, ChannelType, ReadStatusFilter, AssignmentFilterType, AssignableUser, PipelineStage } from "../types/unified-inbox"
import { ChannelFilter } from "./channel-filter"
import { AssignmentFilter } from "./assignment-filter"
import { AssignmentBadge } from "./assignment-badge"
import { AIStatusIndicator } from "./ai-status-indicator"
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
    if (identifier) return identifier.replace(/[@+]/g, "").substring(0, 2).toUpperCase()
    return "U"
  }

  const hasActiveFilters =
    readStatusFilter !== "all" || assignmentFilter !== "all" || tagsFilter.length > 0 || pipelineFilter.length > 0

  const getChannelIcon = (channel: ChannelType) => {
    if (channel === "whatsapp") {
      return <IconBrandWhatsapp className="h-4 w-4 text-green-500" />
    }
    return <IconBrandInstagram className="h-4 w-4 text-pink-500" />
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
    <div className={`w-full md:w-[360px] border-r flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <IconInbox className="h-5 w-5 text-primary" />
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
            <ChannelFilter value={channelFilter} onChange={onChannelFilterChange} />
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
      <div className="p-3 border-b">
        <div className="relative">
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              {hasActiveFilters ? (
                <IconFilterOff className="h-8 w-8 text-primary" />
              ) : (
                <IconInbox className="h-8 w-8 text-primary" />
              )}
            </div>
            <p className="text-sm font-medium mb-1">
              {hasActiveFilters ? "No conversations match your filters" : "No conversations yet"}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
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
              ? assignableUsers.find(u => u.id === conversation.assigneeId) || {
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
                className={`w-full p-4 flex items-start gap-3 transition-all duration-150 border-b border-l-4 ${
                  isSelected
                    ? `bg-accent ${getChannelColor(conversation.channel, true)}`
                    : `hover:bg-accent/50 ${getChannelColor(conversation.channel, false)}`
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.participantAvatar || undefined} />
                    <AvatarFallback className={getAvatarStyle(conversation.channel)}>
                      {getInitials(conversation.participantName, conversation.participantDisplayId)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Channel indicator */}
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                    {getChannelIcon(conversation.channel)}
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <p className={`font-semibold truncate ${
                        isSelected 
                          ? conversation.channel === "whatsapp" 
                            ? "text-green-600" 
                            : "text-pink-600"
                          : ""
                      }`}>
                        {conversation.participantName || conversation.participantDisplayId}
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
                        hasHumanAssignee={!!conversation.assigneeId && conversation.assigneeType !== "AI_AGENT"}
                      />
                    </div>
                    {conversation.lastMessageAt && (
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatDistanceToNow(conversation.lastMessageAt, { addSuffix: false })}
                      </span>
                    )}
                  </div>

                  {conversation.participantName && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {conversation.participantDisplayId}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${hasUnread ? "font-medium" : "text-muted-foreground"}`}>
                      {conversation.lastMessagePreview || "No messages"}
                    </p>
                    {hasUnread && (
                      <Badge className={`ml-2 text-white text-xs h-5 min-w-5 flex items-center justify-center ${
                        conversation.channel === "whatsapp" ? "bg-green-500" : "bg-pink-500"
                      }`}>
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>

                  {/* Window status indicator */}
                  {!conversation.isWindowActive && (
                    <p className="text-xs text-amber-600 mt-1">
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
