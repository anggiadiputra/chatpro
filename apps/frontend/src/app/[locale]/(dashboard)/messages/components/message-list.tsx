import { Check, CheckCheck, FileText } from "lucide-react"
import { RefObject } from "react"
import { MediaPreview, MediaType } from "./media-preview"

interface MessageListProps {
    messages: any[]
    currentUserId: string
    scrollRef: RefObject<HTMLDivElement>
    containerRef: RefObject<HTMLDivElement>
    onScroll: () => void
}

// Helper to extract media URL from message - handles both stored URLs and media IDs
function getMediaUrl(msg: any, messageType: string): string | null {
    // First check if mediaUrl is stored in the message (from webhook download)
    if (msg.mediaUrl) {
        return msg.mediaUrl
    }
    
    // Fallback to type-specific fields
    switch (messageType) {
        case "image":
            return msg.image?.link || msg.image?.id || null
        case "video":
            return msg.video?.link || msg.video?.id || null
        case "audio":
            return msg.audio?.link || msg.audio?.id || null
        case "document":
            return msg.document?.link || msg.document?.id || null
        default:
            return null
    }
}

// Helper to get caption from message
function getCaption(msg: any, messageType: string): string | undefined {
    switch (messageType) {
        case "image":
            return msg.image?.caption || msg.content
        case "video":
            return msg.video?.caption || msg.content
        case "audio":
            return msg.audio?.caption || msg.content
        case "document":
            return msg.document?.caption || msg.content
        default:
            return undefined
    }
}

// Helper to get filename for documents
function getFilename(msg: any): string | undefined {
    return msg.document?.filename
}

export function MessageList({
    messages,
    currentUserId,
    scrollRef,
    containerRef,
    onScroll
}: MessageListProps) {
    return (
        <div
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-background/50"
            ref={containerRef}
            onScroll={onScroll}
        >
            {messages.map((msg) => {
                const isOutbound = msg.direction === "OUTBOUND"
                const messageType = msg.messageType?.toLowerCase() || msg.type?.toLowerCase()
                const isMediaType = ["image", "video", "audio", "document"].includes(messageType)
                
                return (
                    <div
                        key={msg.id}
                        className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${isOutbound
                                ? "bg-blue-500 text-white rounded-tr-none"
                                : "bg-white dark:bg-gray-800 border rounded-tl-none text-gray-900 dark:text-gray-100"
                                }`}
                        >
                            {/* Text Message */}
                            {messageType === "text" && (
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {msg.content || "No content"}
                                </p>
                            )}

                            {/* Template Message */}
                            {messageType === "template" && (
                                <div className="space-y-2">
                                    {(msg.template?.name || msg.template?.templateName) && (
                                        <div className={`flex items-center gap-1.5 text-xs font-medium ${
                                            isOutbound ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                                        }`}>
                                            <FileText className="h-3.5 w-3.5" />
                                            <span className="uppercase tracking-wider">
                                                {msg.template?.name || msg.template?.templateName}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                        {msg.content || "Template message"}
                                    </p>
                                </div>
                            )}

                            {/* Media Messages - Image, Video, Audio, Document */}
                            {isMediaType && (
                                <MediaPreview
                                    mediaUrl={getMediaUrl(msg, messageType)}
                                    mediaType={messageType as MediaType}
                                    caption={getCaption(msg, messageType)}
                                    filename={getFilename(msg)}
                                    isOutbound={isOutbound}
                                />
                            )}

                            {/* Interactive Message */}
                            {messageType === "interactive" && (
                                <div className="space-y-2">
                                    <div className="text-sm">{msg.content || "Interactive message"}</div>
                                    {msg.interactive?.action?.buttons && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.interactive.action.buttons.map((btn: any, i: number) => (
                                                <div key={i} className={`px-3 py-1 rounded text-xs border ${isOutbound ? "bg-white/20 border-white/30" : "bg-gray-100 dark:bg-gray-700 border-gray-300"}`}>
                                                    {btn.reply?.title}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reaction Message */}
                            {messageType === "reaction" && (
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{msg.content || "👍"}</span>
                                    <span className={`text-xs ${isOutbound ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
                                        Reacted to a message
                                    </span>
                                </div>
                            )}

                            {/* Metadata & Status */}
                            <div
                                className={`flex items-center justify-end gap-1 mt-1.5 ${isOutbound
                                    ? "text-white/70"
                                    : "text-gray-500 dark:text-gray-400"
                                    }`}
                            >
                                <span className="text-[10px] sm:text-xs">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                                {isOutbound && (
                                    <span className="ml-0.5">
                                        {msg.status === "read" ? (
                                            <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                        ) : (
                                            <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
            <div ref={scrollRef} />
        </div>
    )
}
