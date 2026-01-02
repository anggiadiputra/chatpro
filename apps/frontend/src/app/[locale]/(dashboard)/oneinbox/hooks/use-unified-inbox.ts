/**
 * useUnifiedInbox Hook
 * Combines WhatsApp and Instagram conversations into a unified inbox
 * with real-time WebSocket updates and smart polling fallback
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { messagesApi } from "@/lib/api/messages-api"
import { instagramApi, type IGConversation, type IGMessage } from "@/lib/api/instagram"
import { assignmentApi } from "@/lib/api/assignment-api"
import { useToast } from "@/hooks/use-toast"
import { useBusinessAccount } from "@/hooks/use-business-account"
import { fetchWindowStatus, type WindowStatus } from "@/lib/window-utils"
import { useWebSocket, type NewMessageEvent, type ConversationUpdatedEvent, type UnreadCountUpdatedEvent, type AssignmentChangedEvent } from "@/hooks/use-websocket"
import type { Customer } from "../../messages/hooks/use-chat"
import {
  type ChannelType,
  type UnifiedConversation,
  type ReadStatusFilter,
  type AssignmentFilterType,
  type AssignableUser,
  type CRMCustomer,
  type CRMCustomerDetail,
  type PipelineStage,
  transformWhatsAppToUnified,
  transformInstagramToUnified,
} from "../types/unified-inbox"

export function useUnifiedInbox() {
  // Core state
  const [conversations, setConversations] = useState<UnifiedConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null)
  const [channelFilter, setChannelFilter] = useState<ChannelType | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)

  // CRM data cache state
  const [crmCustomers, setCrmCustomers] = useState<Map<string, CRMCustomer>>(new Map())
  const [crmCustomersByIgsid, setCrmCustomersByIgsid] = useState<Map<string, CRMCustomer>>(new Map())
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [crmDataLoaded, setCrmDataLoaded] = useState(false)

  // Filter state
  const [readStatusFilter, setReadStatusFilter] = useState<ReadStatusFilter>("all")
  const [tagsFilter, setTagsFilter] = useState<string[]>([])
  const [pipelineFilter, setPipelineFilter] = useState<string[]>([])

  // Assignment state (Requirements: 5.2, 5.3, 5.4)
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilterType>("all")
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  // AI status state (Requirements: 5.1, 5.2, 5.3, 5.4)
  const [aiEnabled, setAIEnabled] = useState(false)
  const [defaultAIAgentName, setDefaultAIAgentName] = useState<string | null>(null)
  // Customer panel state
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CRMCustomerDetail | null>(null)
  const [customerLoading, setCustomerLoading] = useState(false)

  // Connection status
  const [whatsappConnected, setWhatsappConnected] = useState(true)
  const [instagramConnected, setInstagramConnected] = useState<boolean | null>(null)

  // WhatsApp specific state
  const [waMessages, setWaMessages] = useState<any[]>([])
  const [waCustomers, setWaCustomers] = useState<Customer[]>([])
  const [waTemplates, setWaTemplates] = useState<any[]>([])
  const [waWindowStatus, setWaWindowStatus] = useState<WindowStatus | null>(null)

  // Instagram specific state
  const [igMessages, setIgMessages] = useState<IGMessage[]>([])

  // Sending states
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)

  const { userId, phoneNumberId, isLoading: isLoadingAccount } = useBusinessAccount()
  const { toast } = useToast()


  // Load conversations from both channels
  const loadConversations = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    const errors: string[] = []
    let waConversations: UnifiedConversation[] = []
    let igConversations: UnifiedConversation[] = []

    // Load WhatsApp messages
    try {
      const response = await messagesApi.getMessages()
      // Extract data, unreadCounts, and assignments from response
      const data = response.data || []
      const unreadCounts = response.unreadCounts || {}
      const assignments = response.assignments || {}

      setWaMessages(data)

      // Extract unique customers
      const uniqueCustomers = data.reduce((acc: Customer[], msg: any) => {
        if (!msg.customer) return acc
        const exists = acc.find(
          (c) => c.phoneNumber === msg.customer.phoneNumber || c.id === msg.customer.id
        )
        if (!exists) {
          acc.push({
            id: msg.customer.id,
            phoneNumber: msg.customer.phoneNumber,
            name: msg.customer.name,
          })
        }
        return acc
      }, [])

      setWaCustomers(uniqueCustomers)
      setWhatsappConnected(true)

      // Transform to unified format with unread counts and assignments from backend
      // Requirements: 1.1 - Calculate unreadCount from INBOUND messages with status NOT READ
      waConversations = uniqueCustomers.map((customer: Customer) =>
        transformWhatsAppToUnified(customer, data, unreadCounts, assignments)
      )
    } catch (error) {
      console.error("Failed to load WhatsApp messages:", error)
      errors.push("WhatsApp")
      setWhatsappConnected(false)
    }

    // Load Instagram conversations
    try {
      const status = await instagramApi.getConnectionStatus()
      if (status.connected) {
        const response = await instagramApi.getConversations({ limit: 50 })
        setInstagramConnected(true)

        // Transform to unified format
        igConversations = (response.data || []).map(transformInstagramToUnified)
      } else {
        setInstagramConnected(false)
      }
    } catch (error) {
      console.error("Failed to load Instagram conversations:", error)
      errors.push("Instagram")
      setInstagramConnected(false)
    }

    // Merge and sort by lastMessageAt descending
    const merged = [...waConversations, ...igConversations].sort((a, b) => {
      const aTime = a.lastMessageAt?.getTime() || 0
      const bTime = b.lastMessageAt?.getTime() || 0
      return bTime - aTime
    })

    // Enrich conversations with CRM data
    const enrichedConversations = merged.map((conversation) => {
      let crmCustomer: CRMCustomer | undefined

      if (conversation.channel === "whatsapp") {
        // Match WhatsApp by phone number
        crmCustomer = crmCustomers.get(conversation.participantIdentifier)
      } else if (conversation.channel === "instagram") {
        // Match Instagram by IGSID (participantIdentifier is the Instagram user ID)
        crmCustomer = crmCustomersByIgsid.get(conversation.participantIdentifier)
      }

      if (crmCustomer) {
        return {
          ...conversation,
          tags: crmCustomer.tags,
          pipelineStageId: crmCustomer.pipelineStageId,
          pipelineStage: crmCustomer.pipelineStage,
          crmCustomerId: crmCustomer.id,
        }
      }
      return conversation
    })

    setConversations(enrichedConversations)

    // Show warning if any channel failed
    if (errors.length > 0 && (whatsappConnected || instagramConnected)) {
      toast({
        variant: "destructive",
        title: "Partial Load",
        description: `Could not load ${errors.join(", ")} messages`,
      })
    }

    setLoading(false)
  }, [userId, toast, whatsappConnected, instagramConnected, crmCustomers, crmCustomersByIgsid])


  // Load templates for WhatsApp
  const loadTemplates = useCallback(async () => {
    if (!userId) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
      const response = await fetch(`${apiUrl}/api/v1/templates?userId=${userId}`, {
        credentials: "include",
      })
      const result = await response.json()
      const approvedTemplates = result.data?.filter((t: any) => t.status === "APPROVED") || []
      setWaTemplates(approvedTemplates)
    } catch (error) {
      console.error("Failed to load templates:", error)
    }
  }, [userId])

  // Load CRM data (customers and pipeline stages) for filtering
  const loadCrmData = useCallback(async () => {
    if (!userId) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

    try {
      // Fetch customers and pipelines in parallel
      const [customersRes, pipelinesRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/customers`, { credentials: "include" }),
        fetch(`${apiUrl}/api/v1/crm/pipelines`, { credentials: "include" }),
      ])

      // Process customers
      if (customersRes.ok) {
        const customersResult = await customersRes.json()
        const customers = customersResult.data || []

        // Build customer maps keyed by phoneNumber and instagramIgsid for quick lookup
        const customerMap = new Map<string, CRMCustomer>()
        const customerByIgsidMap = new Map<string, CRMCustomer>()
        const allTags = new Set<string>()

        customers.forEach((customer: any) => {
          const crmCustomer: CRMCustomer = {
            id: customer.id,
            phoneNumber: customer.phoneNumber,
            tags: customer.tags || [],
            pipelineStageId: customer.pipelineStageId || null,
            pipelineStage: customer.pipelineStage
              ? {
                id: customer.pipelineStage.id,
                name: customer.pipelineStage.name,
                color: customer.pipelineStage.color,
              }
              : null,
          }

          // Map by phone number for WhatsApp
          if (customer.phoneNumber) {
            customerMap.set(customer.phoneNumber, crmCustomer)
          }

          // Map by Instagram IGSID for Instagram
          if (customer.instagramIgsid) {
            customerByIgsidMap.set(customer.instagramIgsid, crmCustomer)
          }

          // Extract unique tags
          if (customer.tags && Array.isArray(customer.tags)) {
            customer.tags.forEach((tag: string) => allTags.add(tag))
          }
        })

        setCrmCustomers(customerMap)
        setCrmCustomersByIgsid(customerByIgsidMap)
        setAvailableTags(Array.from(allTags).sort())
      }

      // Process pipelines
      if (pipelinesRes.ok) {
        const pipelinesResult = await pipelinesRes.json()
        const pipelines = pipelinesResult.data || []

        // Extract all stages from all pipelines
        const allStages: PipelineStage[] = []
        pipelines.forEach((pipeline: any) => {
          if (pipeline.stages && Array.isArray(pipeline.stages)) {
            pipeline.stages.forEach((stage: any) => {
              allStages.push({
                id: stage.id,
                name: stage.name,
                color: stage.color || "#000000",
                order: stage.order || 0,
              })
            })
          }
        })

        // Sort by order
        allStages.sort((a, b) => a.order - b.order)
        setPipelineStages(allStages)
      }

      setCrmDataLoaded(true)
    } catch (error) {
      console.error("Failed to load CRM data:", error)
      // Continue without CRM data - filters will be disabled
    }
  }, [userId])

  // Load customer detail for panel display
  const loadCustomerDetail = useCallback(async (customerId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
    setCustomerLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/v1/customers/${customerId}`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load customer detail")
      }
      const result = await response.json()
      const data = result.data

      const customerDetail: CRMCustomerDetail = {
        id: data.id,
        name: data.name || null,
        phoneNumber: data.phoneNumber,
        email: data.email || null,
        avatar: data.avatar || null,
        tags: data.tags || [],
        pipelineStageId: data.pipelineStageId || null,
        pipelineStage: data.pipelineStage || null,
        notes: (data.notes || []).map((note: any) => ({
          id: note.id,
          content: note.content,
          createdAt: new Date(note.createdAt),
          createdBy: note.createdBy || "",
        })),
        customFields: data.customFields || {},
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      }

      setSelectedCustomerDetail(customerDetail)
    } catch (error) {
      console.error("Failed to load customer detail:", error)
      setSelectedCustomerDetail(null)
    } finally {
      setCustomerLoading(false)
    }
  }, [])

  // Update customer tags
  const updateCustomerTags = useCallback(async (customerId: string, tags: string[]) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
    try {
      const response = await fetch(`${apiUrl}/api/v1/customers/${customerId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      })
      if (!response.ok) {
        throw new Error("Failed to update customer tags")
      }
      // Refresh customer detail
      await loadCustomerDetail(customerId)
      // Refresh CRM data to update filter options
      await loadCrmData()
      return true
    } catch (error) {
      console.error("Failed to update customer tags:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update tags",
      })
      return false
    }
  }, [loadCustomerDetail, loadCrmData, toast])

  // Update customer pipeline stage
  const updateCustomerStage = useCallback(async (customerId: string, pipelineStageId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
    try {
      const response = await fetch(`${apiUrl}/api/v1/customers/${customerId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStageId }),
      })
      if (!response.ok) {
        throw new Error("Failed to update pipeline stage")
      }
      // Refresh customer detail
      await loadCustomerDetail(customerId)
      return true
    } catch (error) {
      console.error("Failed to update pipeline stage:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update pipeline stage",
      })
      return false
    }
  }, [loadCustomerDetail, toast])

  // Add customer note
  const addCustomerNote = useCallback(async (customerId: string, content: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
    try {
      const response = await fetch(`${apiUrl}/api/v1/customers/${customerId}/notes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        throw new Error("Failed to add note")
      }
      // Refresh customer detail
      await loadCustomerDetail(customerId)
      return true
    } catch (error) {
      console.error("Failed to add customer note:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add note",
      })
      return false
    }
  }, [loadCustomerDetail, toast])

  // Update customer contact info
  const updateCustomerContact = useCallback(async (
    customerId: string,
    updates: { name?: string; email?: string; customFields?: Record<string, string> }
  ) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
    try {
      const response = await fetch(`${apiUrl}/api/v1/customers/${customerId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error("Failed to update contact info")
      }
      // Refresh customer detail
      await loadCustomerDetail(customerId)
      return true
    } catch (error) {
      console.error("Failed to update customer contact:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update contact info",
      })
      return false
    }
  }, [loadCustomerDetail, toast])

  // Link customer to Instagram conversation
  const linkCustomerToConversation = useCallback(async (customerId: string) => {
    if (!selectedConversation) return false

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

    // For Instagram conversations, update the customer with Instagram IGSID
    if (selectedConversation.channel === "instagram") {
      const igConversation = selectedConversation.originalData as IGConversation
      try {
        const response = await fetch(`${apiUrl}/api/v1/customers/${customerId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instagramIgsid: igConversation.participantIgsid,
            instagramUsername: selectedConversation.participantName || null,
          }),
        })
        if (!response.ok) {
          throw new Error("Failed to link customer")
        }

        // Update the conversation with the linked customer ID
        setSelectedConversation(prev => prev ? {
          ...prev,
          crmCustomerId: customerId,
        } : null)

        // Refresh customer detail
        await loadCustomerDetail(customerId)

        // Refresh CRM data and conversations
        await loadCrmData()
        await loadConversations()

        toast({
          title: "Success",
          description: "Customer linked successfully",
        })
        return true
      } catch (error) {
        console.error("Failed to link customer:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to link customer",
        })
        return false
      }
    }

    return false
  }, [selectedConversation, loadCustomerDetail, loadCrmData, loadConversations, toast])

  // Load assignable users and AI agents (Requirements: 2.1, 5.1, 5.2, 5.3, 5.4)
  const loadAssignableUsers = useCallback(async () => {
    try {
      // Fetch both users and AI agents in one call
      const response = await assignmentApi.fetchAssignableEntities()
      
      // Extract human users from the response
      const users = (response.humans || []).map(entity => ({
        id: entity.id,
        name: entity.name,
        email: entity.type === 'HUMAN' ? entity.email : '',
        image: entity.type === 'HUMAN' ? entity.image : null,
        role: entity.type === 'HUMAN' ? entity.role : 'AGENT' as const,
      }))
      setAssignableUsers(users)
      
      // Set AI enabled status based on available AI agents (Requirements: 5.1, 5.2)
      const hasAIAgents = response.aiAgents && response.aiAgents.length > 0
      setAIEnabled(hasAIAgents)
      
      // Set default AI agent name (first agent if available)
      if (hasAIAgents && response.aiAgents[0]) {
        setDefaultAIAgentName(response.aiAgents[0].name)
      } else {
        setDefaultAIAgentName(null)
      }
    } catch (error) {
      console.error("Failed to load assignable users:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load team members",
      })
    }
  }, [toast])

  // Assign conversation to a user or AI Agent (Requirements: 1.4, 2.2)
  const assignConversation = useCallback(async (
    conversationId: string,
    conversationType: ChannelType,
    id: string,
    type: 'human' | 'ai' = 'human'
  ): Promise<boolean> => {
    // Find the conversation to get the raw ID (without wa- or ig- prefix)
    const conversation = conversations.find(c => c.id === conversationId)
    if (!conversation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Conversation not found",
      })
      return false
    }

    // Extract the raw conversation ID (remove wa- or ig- prefix)
    const rawConversationId = conversationId.replace(/^(wa|ig)-/, "")

    // Find the assignee name for optimistic update
    // For AI agents, we'll need to fetch the name from the API response
    const assignee = type === 'human' ? assignableUsers.find(u => u.id === id) : null

    // Optimistic update for human assignment
    if (type === 'human') {
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            assigneeId: id,
            assigneeName: assignee?.name || null,
            assigneeImage: assignee?.image || null,
            assignedAt: new Date(),
          }
        }
        return conv
      }))

      // Also update selected conversation if it's the same
      setSelectedConversation(prev => {
        if (prev?.id === conversationId) {
          return {
            ...prev,
            assigneeId: id,
            assigneeName: assignee?.name || null,
            assigneeImage: assignee?.image || null,
            assignedAt: new Date(),
          }
        }
        return prev
      })
    }

    try {
      const result = await assignmentApi.assignConversation(rawConversationId, conversationType, id, type)
      
      // Update with actual result from API (especially for AI agents)
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            assigneeId: result.assigneeId,
            assigneeName: result.assigneeName,
            assigneeImage: result.assigneeImage || null,
            assignedAt: result.assignedAt,
          }
        }
        return conv
      }))

      setSelectedConversation(prev => {
        if (prev?.id === conversationId) {
          return {
            ...prev,
            assigneeId: result.assigneeId,
            assigneeName: result.assigneeName,
            assigneeImage: result.assigneeImage || null,
            assignedAt: result.assignedAt,
          }
        }
        return prev
      })

      const displayName = type === 'ai' 
        ? result.aiAgentName || "AI Agent"
        : assignee?.name || "team member"
      
      toast({
        title: "Success",
        description: `Conversation assigned to ${displayName}`,
      })
      return true
    } catch (error: any) {
      console.error("Failed to assign conversation:", error)
      // Revert optimistic update
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            assigneeId: conversation.assigneeId,
            assigneeName: conversation.assigneeName,
            assigneeImage: conversation.assigneeImage,
            assignedAt: conversation.assignedAt,
          }
        }
        return conv
      }))
      setSelectedConversation(prev => {
        if (prev?.id === conversationId) {
          return {
            ...prev,
            assigneeId: conversation.assigneeId,
            assigneeName: conversation.assigneeName,
            assigneeImage: conversation.assigneeImage,
            assignedAt: conversation.assignedAt,
          }
        }
        return prev
      })
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to assign conversation",
      })
      return false
    }
  }, [conversations, assignableUsers, toast])

  // Unassign conversation (Requirements: 3.1)
  const unassignConversation = useCallback(async (
    conversationId: string,
    conversationType: ChannelType
  ): Promise<boolean> => {
    // Find the conversation to get the current assignment for rollback
    const conversation = conversations.find(c => c.id === conversationId)
    if (!conversation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Conversation not found",
      })
      return false
    }

    // Extract the raw conversation ID (remove wa- or ig- prefix)
    const rawConversationId = conversationId.replace(/^(wa|ig)-/, "")

    // Optimistic update
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          assigneeId: null,
          assigneeName: null,
          assigneeImage: null,
          assignedAt: null,
        }
      }
      return conv
    }))

    // Also update selected conversation if it's the same
    setSelectedConversation(prev => {
      if (prev?.id === conversationId) {
        return {
          ...prev,
          assigneeId: null,
          assigneeName: null,
          assigneeImage: null,
          assignedAt: null,
        }
      }
      return prev
    })

    try {
      await assignmentApi.unassignConversation(rawConversationId, conversationType)
      toast({
        title: "Success",
        description: "Conversation unassigned",
      })
      return true
    } catch (error: any) {
      console.error("Failed to unassign conversation:", error)
      // Revert optimistic update
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            assigneeId: conversation.assigneeId,
            assigneeName: conversation.assigneeName,
            assigneeImage: conversation.assigneeImage,
            assignedAt: conversation.assignedAt,
          }
        }
        return conv
      }))
      setSelectedConversation(prev => {
        if (prev?.id === conversationId) {
          return {
            ...prev,
            assigneeId: conversation.assigneeId,
            assigneeName: conversation.assigneeName,
            assigneeImage: conversation.assigneeImage,
            assignedAt: conversation.assignedAt,
          }
        }
        return prev
      })
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to unassign conversation",
      })
      return false
    }
  }, [conversations, toast])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setReadStatusFilter("all")
    setAssignmentFilter("all")
    setTagsFilter([])
    setPipelineFilter([])
    setSearchQuery("")
  }, [])

  // Filtering logic
  const filteredConversations = useMemo(() => {
    let filtered = conversations

    // Filter by channel
    if (channelFilter !== "all") {
      filtered = filtered.filter((c) => c.channel === channelFilter)
    }

    // Filter by read status
    if (readStatusFilter === "unread") {
      filtered = filtered.filter((c) => c.unreadCount > 0)
    } else if (readStatusFilter === "read") {
      filtered = filtered.filter((c) => c.unreadCount === 0)
    }

    // Filter by assignment status (Requirements: 5.2, 5.3, 5.4)
    if (assignmentFilter === "mine") {
      filtered = filtered.filter((c) => c.assigneeId === userId)
    } else if (assignmentFilter === "unassigned") {
      filtered = filtered.filter((c) => !c.assigneeId)
    } else if (assignmentFilter === "others") {
      filtered = filtered.filter((c) => c.assigneeId && c.assigneeId !== userId)
    }

    // Filter by tags (OR logic within tags)
    if (tagsFilter.length > 0) {
      filtered = filtered.filter((c) =>
        c.tags.some((tag) => tagsFilter.includes(tag))
      )
    }

    // Filter by pipeline stages (OR logic within stages)
    if (pipelineFilter.length > 0) {
      const includeNoStage = pipelineFilter.includes("no-stage")
      filtered = filtered.filter((c) => {
        if (includeNoStage && !c.pipelineStageId) return true
        return c.pipelineStageId && pipelineFilter.includes(c.pipelineStageId)
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.participantName?.toLowerCase().includes(query) ||
          c.participantIdentifier.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [conversations, channelFilter, readStatusFilter, assignmentFilter, tagsFilter, pipelineFilter, searchQuery, userId])

  // Select conversation and load messages
  const selectConversation = useCallback(
    async (conversation: UnifiedConversation | null) => {
      setSelectedConversation(conversation)

      if (!conversation) {
        setWaWindowStatus(null)
        setIgMessages([])
        setSelectedCustomerDetail(null)
        return
      }

      // Load customer detail if conversation has crmCustomerId
      if (conversation.crmCustomerId) {
        loadCustomerDetail(conversation.crmCustomerId)
      } else {
        setSelectedCustomerDetail(null)
      }

      if (conversation.channel === "whatsapp") {
        // Load window status for WhatsApp
        const customer = conversation.originalData as Customer
        const status = await fetchWindowStatus(customer.id)
        setWaWindowStatus(status)
        setIgMessages([])
        
        // Optimistic update: Set unreadCount to 0 immediately (Requirements: 2.2)
        setConversations(prev => prev.map(conv => {
          if (conv.id === conversation.id) {
            return { ...conv, unreadCount: 0 }
          }
          return conv
        }))
        // Also update the selected conversation state
        setSelectedConversation(prev => prev ? { ...prev, unreadCount: 0 } : null)
        
        // Mark WhatsApp messages as read when opening chat
        await messagesApi.markAsRead(customer.id).catch((error) => {
          console.error("Failed to mark WhatsApp messages as read:", error)
        })
      } else {
        // Load Instagram messages
        const igConversation = conversation.originalData as IGConversation
        try {
          const response = await instagramApi.getMessages(igConversation.id, { limit: 100 })
          setIgMessages(response.data || [])
          // Optimistic update for Instagram as well
          setConversations(prev => prev.map(conv => {
            if (conv.id === conversation.id) {
              return { ...conv, unreadCount: 0 }
            }
            return conv
          }))
          setSelectedConversation(prev => prev ? { ...prev, unreadCount: 0 } : null)
          // Mark as read
          await instagramApi.markAsRead(igConversation.id).catch(() => { })
        } catch (error) {
          console.error("Failed to load Instagram messages:", error)
        }
        setWaWindowStatus(null)
      }
    },
    [loadCustomerDetail]
  )


  // WhatsApp message sending
  const sendWhatsAppMessage = async (text: string) => {
    if (!selectedConversation || selectedConversation.channel !== "whatsapp" || !text.trim()) {
      return false
    }

    if (!waWindowStatus?.isActive) {
      toast({
        variant: "destructive",
        title: "Window Expired",
        description: "24-hour window expired. Please use a message template.",
      })
      return "WINDOW_EXPIRED"
    }

    const customer = selectedConversation.originalData as Customer
    try {
      setSending(true)
      await messagesApi.sendMessage({
        userId: userId!,
        phoneNumber: customer.phoneNumber,
        type: "text",
        text: { body: text },
      })
      setTimeout(() => loadConversations(), 500)
      return true
    } catch (error: any) {
      console.error("Failed to send WhatsApp message:", error)
      if (error.message?.toLowerCase().includes("window")) {
        toast({
          variant: "destructive",
          title: "Window Expired",
          description: "24-hour window expired. Use a template instead.",
        })
        return "WINDOW_EXPIRED"
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      })
      return false
    } finally {
      setSending(false)
    }
  }

  const sendWhatsAppTemplate = async (template: any) => {
    if (!selectedConversation || selectedConversation.channel !== "whatsapp") return false

    const customer = selectedConversation.originalData as Customer
    try {
      setSending(true)
      await messagesApi.sendMessage({
        userId: userId!,
        phoneNumber: customer.phoneNumber,
        type: "template",
        template: {
          name: template.templateName,
          language: { code: template.language },
          components: template.components,
        },
        variableValues: template.variableValues,
      })
      toast({ title: "Success", description: `Template "${template.templateName}" sent!` })
      setTimeout(() => loadConversations(), 500)
      return true
    } catch (error: any) {
      console.error("Failed to send template:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send template",
      })
      return false
    } finally {
      setSending(false)
    }
  }

  const sendWhatsAppMedia = async (file: File, caption?: string) => {
    if (!selectedConversation || selectedConversation.channel !== "whatsapp") return false

    if (!waWindowStatus?.isActive) {
      toast({
        variant: "destructive",
        title: "Window Expired",
        description: "24-hour window expired. Please use a message template.",
      })
      return "WINDOW_EXPIRED"
    }

    const customer = selectedConversation.originalData as Customer
    try {
      setUploading(true)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("phoneNumberId", phoneNumberId!)
      formData.append("target", "whatsapp")

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
      const uploadResponse = await fetch(`${apiUrl}/api/v1/media/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error?.message || "Failed to upload media")
      }

      const uploadResult = await uploadResponse.json()
      const mediaId = uploadResult.data.id
      const mediaUrl = uploadResult.data.url

      const messageType = file.type.startsWith("image/") ? "image" : "document"
      const mediaPayload: any = { caption: caption?.trim() || undefined }

      if (mediaId) mediaPayload.id = mediaId
      if (mediaUrl) mediaPayload.link = mediaUrl
      if (messageType === "document") mediaPayload.filename = file.name

      await messagesApi.sendMessage({
        userId: userId!,
        phoneNumber: customer.phoneNumber,
        type: messageType,
        [messageType]: mediaPayload,
      })

      toast({ title: "Success", description: "Media sent!" })
      setTimeout(() => loadConversations(), 500)
      return true
    } catch (error: any) {
      console.error("Failed to send media:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send media",
      })
      return false
    } finally {
      setUploading(false)
    }
  }

  // WhatsApp CTA button sending
  const sendWhatsAppCta = async (ctaForm: {
    bodyText: string
    buttonLabel: string
    buttonUrl: string
    footerText: string
    headerImageUrl: string
  }) => {
    if (!selectedConversation || selectedConversation.channel !== "whatsapp") return false
    if (!ctaForm.bodyText || !ctaForm.buttonLabel || !ctaForm.buttonUrl) return false

    if (!waWindowStatus?.isActive) {
      toast({
        variant: "destructive",
        title: "Window Expired",
        description: "24-hour window expired. Please use a message template.",
      })
      return "WINDOW_EXPIRED"
    }

    const customer = selectedConversation.originalData as Customer
    try {
      setSending(true)

      let header
      if (ctaForm.headerImageUrl) {
        header = {
          type: "image",
          image: { link: ctaForm.headerImageUrl }
        } as any
      }

      await messagesApi.sendMessage({
        userId: userId!,
        phoneNumber: customer.phoneNumber,
        type: "interactive",
        interactive: {
          type: "cta_url",
          header,
          body: { text: ctaForm.bodyText },
          footer: ctaForm.footerText ? { text: ctaForm.footerText } : undefined,
          action: {
            name: "cta_url",
            parameters: {
              display_text: ctaForm.buttonLabel,
              url: ctaForm.buttonUrl
            }
          }
        }
      })

      toast({
        title: "Success",
        description: "CTA Message sent!",
      })
      setTimeout(() => loadConversations(), 500)
      return true
    } catch (error: any) {
      console.error("Failed to send CTA message:", error)
      if (error.message?.toLowerCase().includes("window")) {
        toast({
          variant: "destructive",
          title: "Window Expired",
          description: "24-hour window expired. Use a template instead.",
        })
        return "WINDOW_EXPIRED"
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send CTA message",
      })
      return false
    } finally {
      setSending(false)
    }
  }

  // WhatsApp Reply Buttons sending
  const sendWhatsAppReplyButtons = async (replyForm: {
    bodyText: string
    buttons: { id: string; title: string }[]
    footerText: string
    headerImage: File | null
  }) => {
    if (!selectedConversation || selectedConversation.channel !== "whatsapp") return false
    if (!replyForm.bodyText || replyForm.buttons.some(b => !b.title)) return false

    if (!waWindowStatus?.isActive) {
      toast({
        variant: "destructive",
        title: "Window Expired",
        description: "24-hour window expired. Please use a message template.",
      })
      return "WINDOW_EXPIRED"
    }

    const customer = selectedConversation.originalData as Customer
    try {
      setSending(true)

      let header
      if (replyForm.headerImage) {
        // Upload header image
        const formData = new FormData()
        formData.append("file", replyForm.headerImage)
        formData.append("phoneNumberId", phoneNumberId!)
        formData.append("target", "whatsapp")

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
        const uploadResponse = await fetch(`${apiUrl}/api/v1/media/upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        if (!uploadResponse.ok) throw new Error("Failed to upload header image")
        const uploadResult = await uploadResponse.json()

        header = {
          type: "image",
          image: { id: uploadResult.data.id }
        } as any
      }

      await messagesApi.sendMessage({
        userId: userId!,
        phoneNumber: customer.phoneNumber,
        type: "interactive",
        interactive: {
          type: "button",
          header,
          body: { text: replyForm.bodyText },
          footer: replyForm.footerText ? { text: replyForm.footerText } : undefined,
          action: {
            buttons: replyForm.buttons.map(b => ({
              type: "reply",
              reply: {
                id: b.id,
                title: b.title
              }
            }))
          }
        }
      })

      toast({
        title: "Success",
        description: "Reply Buttons sent!",
      })
      setTimeout(() => loadConversations(), 500)
      return true
    } catch (error: any) {
      console.error("Failed to send Reply Buttons:", error)
      if (error.message?.toLowerCase().includes("window")) {
        toast({
          variant: "destructive",
          title: "Window Expired",
          description: "24-hour window expired. Use a template instead.",
        })
        return "WINDOW_EXPIRED"
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send Reply Buttons",
      })
      return false
    } finally {
      setSending(false)
    }
  }


  // Instagram message sending
  const sendInstagramMessage = async (data: {
    type: "text" | "image" | "video" | "audio" | "sticker"
    text?: string
    mediaUrl?: string
  }) => {
    if (!selectedConversation || selectedConversation.channel !== "instagram") return false

    const igConversation = selectedConversation.originalData as IGConversation

    if (!igConversation.isWindowActive) {
      toast({
        variant: "destructive",
        title: "Messaging Window Closed",
        description: "You can only reply within 24 hours of receiving a message from this user.",
      })
      return false
    }

    try {
      setSending(true)
      await instagramApi.sendMessage(igConversation.id, data)

      // Reload messages
      const response = await instagramApi.getMessages(igConversation.id, { limit: 100 })
      setIgMessages(response.data || [])

      toast({ title: "Success", description: "Message sent!" })
      return true
    } catch (error: any) {
      console.error("Failed to send Instagram message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      })
      return false
    } finally {
      setSending(false)
    }
  }

  const sendInstagramReaction = async (messageId: string) => {
    if (!selectedConversation || selectedConversation.channel !== "instagram") return

    const igConversation = selectedConversation.originalData as IGConversation
    try {
      await instagramApi.sendReaction(messageId, "love")
      const response = await instagramApi.getMessages(igConversation.id, { limit: 100 })
      setIgMessages(response.data || [])
    } catch (error: any) {
      console.error("Failed to send reaction:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reaction",
      })
    }
  }

  // Refresh messages for currently selected conversation
  const refreshSelectedConversationMessages = useCallback(async () => {
    if (!selectedConversation) return

    if (selectedConversation.channel === "instagram") {
      const igConversation = selectedConversation.originalData as IGConversation
      try {
        const response = await instagramApi.getMessages(igConversation.id, { limit: 100 })
        setIgMessages(response.data || [])
      } catch (error) {
        // Silently fail on polling refresh
      }
    } else if (selectedConversation.channel === "whatsapp") {
      // Refresh WhatsApp messages - waMessages already contains all messages
      // The loadConversations call will update waMessages state
      // No additional action needed as ChatArea uses waMessages from this hook
    }
  }, [selectedConversation])

  // Track tab visibility for smart polling
  const [isTabVisible, setIsTabVisible] = useState(true)



  // Handle visibility change for smart polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible"
      setIsTabVisible(isVisible)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  // Ref to track selected conversation for WebSocket handlers
  const selectedConversationRef = useRef<UnifiedConversation | null>(null)
  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  // Handle new message from WebSocket
  const handleNewMessage = useCallback((event: NewMessageEvent) => {
    // Refresh conversations to get the new message
    loadConversations()

    // If the message is for the currently selected conversation, refresh messages
    const currentConversation = selectedConversationRef.current
    if (currentConversation) {
      const isCurrentConversation =
        (event.payload.channel === "whatsapp" &&
          currentConversation.channel === "whatsapp" &&
          currentConversation.participantIdentifier === event.payload.participantId) ||
        (event.payload.channel === "instagram" &&
          currentConversation.channel === "instagram" &&
          event.payload.conversationId === currentConversation.id)

      if (isCurrentConversation) {
        refreshSelectedConversationMessages()
      }
    }
  }, [loadConversations, refreshSelectedConversationMessages])

  // Handle conversation updated from WebSocket
  const handleConversationUpdated = useCallback((event: ConversationUpdatedEvent) => {
    // Update the specific conversation in state
    setConversations(prev => prev.map(conv => {
      if (conv.id === event.payload.conversationId) {
        return {
          ...conv,
          unreadCount: event.payload.changes.unreadCount ?? conv.unreadCount,
          lastMessageAt: event.payload.changes.lastMessageAt
            ? new Date(event.payload.changes.lastMessageAt)
            : conv.lastMessageAt,
        }
      }
      return conv
    }))
  }, [])

  // Handle unread count updated from WebSocket (Requirements: 4.1, 4.2)
  const handleUnreadCountUpdated = useCallback((event: UnreadCountUpdatedEvent) => {
    // Update the unread count for the specific WhatsApp conversation
    setConversations(prev => prev.map(conv => {
      // Match WhatsApp conversations by customer ID
      if (conv.channel === "whatsapp") {
        const customer = conv.originalData as Customer
        if (customer.id === event.payload.customerId) {
          return {
            ...conv,
            unreadCount: event.payload.unreadCount,
          }
        }
      }
      return conv
    }))
  }, [])

  // Handle assignment changed from WebSocket (Requirements: 2.4, 2.5)
  const handleAssignmentChanged = useCallback((event: AssignmentChangedEvent) => {
    const { conversationId, conversationType, assigneeId, assigneeName, action } = event.payload
    
    // Build the prefixed conversation ID to match our internal format
    const prefix = conversationType === "whatsapp" ? "wa-" : "ig-"
    const prefixedConversationId = `${prefix}${conversationId}`

    // Update the conversation in state
    setConversations(prev => prev.map(conv => {
      if (conv.id === prefixedConversationId) {
        if (action === "assigned") {
          return {
            ...conv,
            assigneeId,
            assigneeName,
            assigneeImage: null, // Will be loaded separately if needed
            assignedAt: new Date(),
          }
        } else {
          // unassigned
          return {
            ...conv,
            assigneeId: null,
            assigneeName: null,
            assigneeImage: null,
            assignedAt: null,
          }
        }
      }
      return conv
    }))

    // Also update selected conversation if it's the same
    setSelectedConversation(prev => {
      if (prev?.id === prefixedConversationId) {
        if (action === "assigned") {
          return {
            ...prev,
            assigneeId,
            assigneeName,
            assigneeImage: null,
            assignedAt: new Date(),
          }
        } else {
          return {
            ...prev,
            assigneeId: null,
            assigneeName: null,
            assigneeImage: null,
            assignedAt: null,
          }
        }
      }
      return prev
    })
  }, [])



  // Initialize WebSocket connection
  const { state: webSocketState } = useWebSocket({
    onNewMessage: handleNewMessage,
    onConversationUpdated: handleConversationUpdated,
    onUnreadCountUpdated: handleUnreadCountUpdated,
    onAssignmentChanged: handleAssignmentChanged,
    enabled: !isLoadingAccount && !!userId,
  })

  // Determine if polling should be active (only when WebSocket is not connected)
  const shouldPoll = useMemo(() => {
    // Poll when WebSocket is not connected or in polling fallback mode
    return !webSocketState.isConnected || webSocketState.connectionMode === "polling"
  }, [webSocketState.isConnected, webSocketState.connectionMode])

  // Load CRM data once on mount (separate from polling)
  useEffect(() => {
    if (!isLoadingAccount && userId) {
      loadCrmData()
    }
  }, [userId, isLoadingAccount, loadCrmData])

  // Initial load of conversations and templates
  useEffect(() => {
    if (!isLoadingAccount && userId) {
      loadConversations()
      loadTemplates()
    }
  }, [userId, isLoadingAccount, loadConversations, loadTemplates])

  // Polling for real-time updates (5s interval, only when WebSocket disconnected and tab visible)
  useEffect(() => {
    if (!isLoadingAccount && userId && shouldPoll) {
      // Immediately fetch when entering poll mode (WebSocket disconnected)
      if (isTabVisible) {
        loadConversations()
        refreshSelectedConversationMessages()
      }

      // Poll every 5 seconds for new messages (faster fallback when WebSocket not connected)
      const interval = setInterval(() => {
        if (isTabVisible) {
          loadConversations()
          refreshSelectedConversationMessages()
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [userId, isLoadingAccount, loadConversations, refreshSelectedConversationMessages, isTabVisible, shouldPoll])

  return {
    // Conversations
    conversations,
    filteredConversations,
    selectedConversation,
    selectConversation,
    // Filters
    channelFilter,
    setChannelFilter,
    searchQuery,
    setSearchQuery,
    // New filter state
    readStatusFilter,
    setReadStatusFilter,
    tagsFilter,
    setTagsFilter,
    pipelineFilter,
    setPipelineFilter,
    clearFilters,
    // Assignment state (Requirements: 5.2, 5.3, 5.4)
    assignmentFilter,
    setAssignmentFilter,
    assignableUsers,
    // AI status state (Requirements: 5.1, 5.2, 5.3, 5.4)
    aiEnabled,
    defaultAIAgentName,
    // Assignment methods (Requirements: 2.2, 3.1)
    assignConversation,
    unassignConversation,
    loadAssignableUsers,
    // CRM data for filter dropdowns
    availableTags,
    pipelineStages,
    crmDataLoaded,
    // Customer panel state
    isPanelOpen,
    setIsPanelOpen,
    selectedCustomerDetail,
    customerLoading,
    loadCustomerDetail,
    // Customer update methods
    updateCustomerTags,
    updateCustomerStage,
    addCustomerNote,
    updateCustomerContact,
    linkCustomerToConversation,
    // Loading states
    loading,
    sending,
    uploading,
    // Connection status
    whatsappConnected,
    instagramConnected,
    // WhatsApp specific
    waMessages,
    waCustomers,
    waTemplates,
    waWindowStatus,
    setWaWindowStatus,
    sendWhatsAppMessage,
    sendWhatsAppTemplate,
    sendWhatsAppMedia,
    sendWhatsAppCta,
    sendWhatsAppReplyButtons,
    // Instagram specific
    igMessages,
    sendInstagramMessage,
    sendInstagramReaction,
    // Common
    userId,
    isLoadingAccount,
    loadConversations,
    // WebSocket state
    webSocketState,
  }
}
