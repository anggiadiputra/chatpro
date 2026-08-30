"use client"

import { Link } from "@/i18n/routing"
import { RefreshCw, User, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { IGConversationList, IGChatArea, IGEmptyState } from "./components"
import { useInstagramChat } from "./hooks/use-instagram-chat"

export default function InstagramInboxPage() {
  const {
    conversations,
    messages,
    selectedConversation,
    setSelectedConversation,
    loading,
    loadingMessages,
    sending,
    searchQuery,
    setSearchQuery,
    loadConversations,
    sendMessage,
    sendReaction,
    searchConversations,
    userId,
    isLoadingAccount,
    isConnected,
    checkingConnection,
  } = useInstagramChat()

  // Show loading state while checking authentication or connection
  if (isLoadingAccount || checkingConnection) {
    return (
      <>
        <Header />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      </>
    )
  }

  // Show message if user is not authenticated
  if (!userId) {
    return (
      <>
        <Header />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <User className="text-muted-foreground/50 mx-auto mb-4 h-16 w-16" />
            <h3 className="mb-2 text-lg font-semibold">
              Authentication Required
            </h3>
            <p className="text-muted-foreground text-sm">
              Please log in to access Instagram messages
            </p>
          </div>
        </div>
      </>
    )
  }

  // Show message if Instagram is not connected
  if (isConnected === false) {
    return (
      <>
        <Header />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="max-w-md px-4 text-center">
            <Instagram className="text-muted-foreground/50 mx-auto mb-4 h-16 w-16" />
            <h3 className="mb-2 text-lg font-semibold">
              Instagram Not Connected
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Connect your Instagram Professional account to start managing your
              DMs
            </p>
            <Button asChild>
              <Link href="/instagram">Connect Instagram</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="bg-background flex h-[calc(100vh-4rem)]">
        {/* Conversations Sidebar */}
        <IGConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          loading={loading}
          onRefresh={loadConversations}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={searchConversations}
          className={selectedConversation ? "hidden md:flex" : "flex"}
        />

        {/* Chat Area */}
        {selectedConversation ? (
          <div
            className={`bg-background flex h-full flex-1 flex-col ${!selectedConversation ? "hidden md:flex" : "flex"}`}
          >
            <IGChatArea
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={sendMessage}
              onSendReaction={sendReaction}
              sending={sending}
              loadingMessages={loadingMessages}
              onBack={() => setSelectedConversation(null as any)}
            />
          </div>
        ) : (
          <IGEmptyState />
        )}
      </div>
    </>
  )
}
