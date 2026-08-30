"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import {
  Image,
  Video,
  File,
  ExternalLink,
  Phone,
  Check,
  CheckCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Template } from "../data/schema"

/**
 * Rendered template structure from backend
 */
export interface RenderedTemplate {
  header?: {
    type: "text" | "image" | "video" | "document"
    content: string
  }
  body: string
  footer?: string
  buttons?: Array<{
    type: "url" | "phone_number" | "quick_reply"
    text: string
    url?: string
  }>
}

interface TemplatePreviewProps {
  /** Template data */
  template: Template
  /** Variable values mapped by variableId */
  variableValues?: Record<string, string>
  /** Pre-rendered template from backend */
  renderedPreview?: RenderedTemplate | null
  /** Show timestamp */
  showTimestamp?: boolean
  /** Custom timestamp */
  timestamp?: Date
  /** Message status indicator */
  status?: "sent" | "delivered" | "read"
  /** Additional class names */
  className?: string
}

/**
 * Replace variable placeholders with values
 */
function replaceVariables(text: string, values: string[]): string {
  let result = text
  values.forEach((value, index) => {
    const placeholder = `{{${index + 1}}}`
    result = result.replace(placeholder, value || placeholder)
  })
  return result
}

/**
 * Extract variable values in order from template positions
 */
function extractOrderedValues(
  variableValues: Record<string, string>,
  componentType: "header" | "body"
): string[] {
  // For now, return values in order they appear
  // This is a simplified version - the actual mapping should come from backend
  return Object.values(variableValues)
}

/**
 * WhatsApp-style Template Preview Component
 *
 * Renders a template message in WhatsApp message bubble style with:
 * - Header (text/image/video/document)
 * - Body with line breaks
 * - Footer
 * - Buttons (reply/URL/phone)
 * - Timestamp and status indicators
 * - Responsive design
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */
export function TemplatePreview({
  template,
  variableValues = {},
  renderedPreview,
  showTimestamp = true,
  timestamp = new Date(),
  status = "sent",
  className,
}: TemplatePreviewProps) {
  // Use rendered preview if available, otherwise use template with placeholders
  const headerContent = useMemo(() => {
    if (renderedPreview?.header) {
      return renderedPreview.header
    }
    if (template.headerType === "TEXT" && template.headerContent) {
      return {
        type: "text" as const,
        content: template.headerContent,
      }
    }
    if (
      template.headerType &&
      ["IMAGE", "VIDEO", "DOCUMENT"].includes(template.headerType)
    ) {
      return {
        type: template.headerType.toLowerCase() as
          "image" | "video" | "document",
        content: "",
      }
    }
    return null
  }, [renderedPreview, template])

  const bodyContent = useMemo(() => {
    return renderedPreview?.body || template.content || ""
  }, [renderedPreview, template])

  const footerContent = useMemo(() => {
    return renderedPreview?.footer || template.footerText || null
  }, [renderedPreview, template])

  const buttons = useMemo(() => {
    if (renderedPreview?.buttons && renderedPreview.buttons.length > 0) {
      return renderedPreview.buttons
    }
    // Extract buttons from template components
    const buttonComponent = template.components?.find(
      (c) => c.type === "BUTTONS"
    )
    if (buttonComponent?.buttons) {
      return buttonComponent.buttons.map((btn) => ({
        type: btn.type.toLowerCase() as "url" | "phone_number" | "quick_reply",
        text: btn.text,
        url: btn.url || undefined,
      }))
    }
    return []
  }, [renderedPreview, template])

  // Render status icon
  const renderStatusIcon = () => {
    switch (status) {
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case "sent":
      default:
        return <Check className="h-3 w-3 text-gray-400" />
    }
  }

  return (
    <div
      className={cn(
        "min-h-[200px] rounded-lg bg-[#e5ddd5] p-4 dark:bg-gray-800",
        className
      )}
    >
      <div className="ml-auto max-w-[300px]">
        {/* Message bubble */}
        <div className="relative overflow-hidden rounded-lg bg-[#dcf8c6] shadow-sm dark:bg-green-900">
          {/* Header */}
          {headerContent && (
            <div className={cn(headerContent.type !== "text" && "mb-0")}>
              {headerContent.type === "text" && (
                <div className="p-3 pb-0">
                  <p className="text-sm font-semibold break-words whitespace-pre-wrap">
                    {headerContent.content}
                  </p>
                </div>
              )}
              {headerContent.type === "image" && (
                <div className="flex h-40 items-center justify-center bg-gray-200 dark:bg-gray-700">
                  {headerContent.content ? (
                    <img
                      src={headerContent.content}
                      alt="Header"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden"
                        )
                      }}
                    />
                  ) : null}
                  <div
                    className={cn(
                      "flex flex-col items-center gap-2",
                      headerContent.content && "hidden"
                    )}
                  >
                    <Image className="h-10 w-10 text-gray-400" />
                    <span className="text-xs text-gray-500">Image</span>
                  </div>
                </div>
              )}
              {headerContent.type === "video" && (
                <div className="flex h-40 flex-col items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700">
                  <Video className="h-10 w-10 text-gray-400" />
                  <span className="text-xs text-gray-500">Video</span>
                </div>
              )}
              {headerContent.type === "document" && (
                <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 p-3 dark:border-gray-600 dark:bg-gray-700">
                  <div className="rounded bg-red-100 p-2 dark:bg-red-900/30">
                    <File className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">Document</p>
                    <p className="text-xs text-gray-500">PDF</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-3">
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
              {bodyContent}
            </p>

            {/* Footer */}
            {footerContent && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {footerContent}
              </p>
            )}

            {/* Timestamp and status */}
            {showTimestamp && (
              <div className="mt-1 flex items-center justify-end gap-1">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {format(timestamp, "HH:mm")}
                </span>
                {renderStatusIcon()}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        {buttons.length > 0 && (
          <div className="mt-1 space-y-1">
            {buttons.map((button, index) => (
              <button
                key={index}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm text-blue-500 shadow-sm transition-colors hover:bg-gray-50 dark:bg-gray-700 dark:text-blue-400 dark:hover:bg-gray-600"
                onClick={(e) => e.preventDefault()}
              >
                {button.type === "url" && <ExternalLink className="h-4 w-4" />}
                {button.type === "phone_number" && (
                  <Phone className="h-4 w-4" />
                )}
                <span className="truncate">{button.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Compact template preview for lists and cards
 */
export function TemplatePreviewCompact({
  template,
  className,
}: {
  template: Template
  className?: string
}) {
  return (
    <div className={cn("bg-muted/50 rounded-lg p-3 text-sm", className)}>
      {/* Header indicator */}
      {template.headerType && (
        <div className="text-muted-foreground mb-2 flex items-center gap-2">
          {template.headerType === "TEXT" && (
            <span className="text-foreground truncate font-medium">
              {template.headerContent}
            </span>
          )}
          {template.headerType === "IMAGE" && (
            <>
              <Image className="h-4 w-4" />
              <span>Image header</span>
            </>
          )}
          {template.headerType === "VIDEO" && (
            <>
              <Video className="h-4 w-4" />
              <span>Video header</span>
            </>
          )}
          {template.headerType === "DOCUMENT" && (
            <>
              <File className="h-4 w-4" />
              <span>Document header</span>
            </>
          )}
        </div>
      )}

      {/* Body preview */}
      <p className="text-muted-foreground line-clamp-3 whitespace-pre-wrap">
        {template.content}
      </p>

      {/* Footer */}
      {template.footerText && (
        <p className="text-muted-foreground mt-2 truncate text-xs">
          {template.footerText}
        </p>
      )}
    </div>
  )
}

export default TemplatePreview
