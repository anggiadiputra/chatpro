import { WindowStatusBanner } from "@/components/window-status-banner"
import { ChatHeader } from "./chat-header"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { Customer } from "../hooks/use-chat"
import { useChatScroll } from "../hooks/use-chat-scroll"
import type { WindowStatus } from "@/lib/window-utils"

interface ChatAreaProps {
    selectedCustomer: Customer
    messages: any[]
    currentUserId: string
    onSendMessage: (text: string) => Promise<any>
    onSendTemplate: (template: any) => Promise<any>
    onSendCta: (data: any) => Promise<any>
    onSendReplyButtons: (data: any) => Promise<any>
    onSendMedia: (file: File, caption?: string) => Promise<any>
    sending: boolean
    uploading: boolean
    templates: any[]
    onBack: () => void
    windowStatus?: WindowStatus | null
    setWindowStatus?: (status: any) => void
}

export function ChatArea({
    selectedCustomer,
    messages,
    currentUserId,
    onSendMessage,
    onSendTemplate,
    onSendCta,
    onSendReplyButtons,
    onSendMedia,
    sending,
    uploading,
    templates,
    onBack,
    windowStatus,
    setWindowStatus
}: ChatAreaProps) {
    // Filter messages for selected customer
    const filteredMessages = messages
        .filter((msg) => msg.customer?.id === selectedCustomer.id)
        .sort(
            (a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )

    // Use chat scroll hook
    const {
        messageContainerRef,
        handleScroll,
        messagesEndRef
    } = useChatScroll(filteredMessages, selectedCustomer)

    return (
        <div className="flex flex-col h-full">
            {/* Window Status Banner */}
            {selectedCustomer && (
                <div className="flex-shrink-0">
                    <WindowStatusBanner
                        customerId={selectedCustomer.id}
                        onStatusChange={setWindowStatus}
                    />
                </div>
            )}

            {/* Chat Header */}
            <div className="flex-shrink-0">
                <ChatHeader customer={selectedCustomer} onBack={onBack} />
            </div>

            {/* Messages Area - Takes remaining space */}
            <div className="flex-1 overflow-y-auto">
                <MessageList
                    messages={filteredMessages}
                    currentUserId={currentUserId}
                    scrollRef={messagesEndRef as any}
                    containerRef={messageContainerRef as any}
                    onScroll={handleScroll}
                />
            </div>

            {/* Message Input - Fixed at bottom */}
            <div className="flex-shrink-0 border-t bg-background w-full" style={{ position: 'relative', zIndex: 10 }}>
                <MessageInput
                    onSendMessage={onSendMessage}
                    onSendTemplate={onSendTemplate}
                    onSendCta={onSendCta}
                    onSendReplyButtons={onSendReplyButtons}
                    onSendMedia={onSendMedia}
                    sending={sending}
                    uploading={uploading}
                    templates={templates}
                    windowStatus={windowStatus}
                />
            </div>
        </div>
    )
}
