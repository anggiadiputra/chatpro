"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  BrainCircuit,
  Settings,
  HelpCircle,
  Ban,
  Loader2,
  Bot,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { useToast } from "@/hooks/use-toast"
import { aiApi, AIConfig, KnowledgeDocument, AIAgent } from "@/lib/api/ai-api"
import { useSession } from "@/lib/auth-client"
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt"
import { RoleGuard } from "@/components/auth/role-guard"

import { GeneralSettings } from "./components/general-settings"
import { KnowledgeBase } from "./components/knowledge-base"
import { AgentsList } from "./components/agents-list"
import { FilterSettings } from "./components/filter-settings"
import { HelpSection } from "./components/help-section"

export default function AIPage() {
  const { data: session, isPending } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [config, setConfig] = useState<AIConfig>({
    enabled: false,
    model: "gpt-4.1-nano-2025-04-14",
    systemPrompt: "",
    temperature: 0.7,
    filterWords: [],
  })

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [agents, setAgents] = useState<AIAgent[]>([])

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any
      // Try subscriptionTier (direct on user) or fallback to nested subscription (if available)
      const tier = user.subscriptionTier || user.subscription?.tier || 'FREE'
      
      if (tier === 'FREE') {
        setLoading(false)
        return
      }
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [configData, docsData, agentsData] = await Promise.all([
        aiApi.getConfig(),
        aiApi.getDocuments(),
        aiApi.getAgents(),
      ])
      setConfig(configData)
      setDocuments(docsData)
      setAgents(agentsData)
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load AI settings",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      setSaving(true)
      await aiApi.updateConfig(config)
      toast({
        title: "Success",
        description: "AI settings saved successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Only PDF files are supported",
      })
      return
    }

    try {
      setUploading(true)
      await aiApi.uploadDocument(file)
      toast({
        title: "Success",
        description: "File uploaded successfully. Processing started.",
      })
      // Refresh list
      const docs = await aiApi.getDocuments()
      setDocuments(docs)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload file",
      })
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ""
    }
  }

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      await aiApi.deleteDocument(id)
      setDocuments(documents.filter((d) => d.id !== id))
      toast({
        title: "Success",
        description: "Document deleted",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document",
      })
    }
  }

  const handleCreateAgent = async (data: { name: string; systemPrompt: string; documentIds: string[] }) => {
    try {
      const newAgent = await aiApi.createAgent(data)
      setAgents([newAgent, ...agents])
      toast({
        title: "Success",
        description: "Agent created successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create agent",
      })
    }
  }

  const handleUpdateAgent = async (id: string, data: { name: string; systemPrompt: string; documentIds: string[] }) => {
    try {
      const updatedAgent = await aiApi.updateAgent(id, data)
      setAgents(agents.map((a) => (a.id === id ? updatedAgent : a)))
      toast({
        title: "Success",
        description: "Agent updated successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update agent",
      })
    }
  }

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return

    try {
      await aiApi.deleteAgent(id)
      setAgents(agents.filter((a) => a.id !== id))
      
      // If active agent was deleted, update config
      if (config.activeAgentId === id) {
        setConfig({ ...config, activeAgentId: undefined })
        // We should also persist this change to backend, but maybe let user notice and fix it?
        // Or auto-save:
        await aiApi.updateConfig({ ...config, activeAgentId: undefined })
      }

      toast({
        title: "Success",
        description: "Agent deleted successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete agent",
      })
    }
  }

  // Check loading state (both initial and session)
  if (loading || isPending) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center h-full p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  const user = session?.user as any
  const tier = user?.subscriptionTier || user?.subscription?.tier || 'FREE'
  const isFreeUser = tier === 'FREE'

  // Locked content component for FREE users
  const LockedContent = () => (
    <div className="max-w-md">
      <UpgradePrompt
        feature="aiChatbot"
        currentTier={tier}
        requiredTier="LITE"
      />
    </div>
  )

  return (
    <RoleGuard>
      <Header />
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <BrainCircuit className="h-7 w-7" />
            AI Auto-Reply
          </h2>
          <p className="text-muted-foreground">
            Configure your AI assistant and manage its knowledge base.
          </p>
        </div>

        <Tabs defaultValue="settings" className="space-y-4">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                General Settings
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Agents
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Knowledge Base
              </TabsTrigger>
              <TabsTrigger value="filter" className="flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="help" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Help & Tips
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="settings" className="space-y-6">
            {isFreeUser ? (
              <LockedContent />
            ) : (
              <GeneralSettings
                config={config}
                agents={agents}
                setConfig={setConfig}
                onSave={handleSaveConfig}
                saving={saving}
              />
            )}
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            {isFreeUser ? (
              <LockedContent />
            ) : (
              <AgentsList
                agents={agents}
                documents={documents}
                onCreate={handleCreateAgent}
                onUpdate={handleUpdateAgent}
                onDelete={handleDeleteAgent}
              />
            )}
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            {isFreeUser ? (
              <LockedContent />
            ) : (
              <KnowledgeBase
                documents={documents}
                uploading={uploading}
                onUpload={handleFileUpload} 
                onDelete={handleDeleteDocument} 
              />
            )}
          </TabsContent>

          <TabsContent value="filter" className="space-y-6">
            {isFreeUser ? (
              <LockedContent />
            ) : (
              <FilterSettings 
                config={config} 
                setConfig={setConfig} 
                onSave={handleSaveConfig} 
                saving={saving} 
              />
            )}
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <HelpSection />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}