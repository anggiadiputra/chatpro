"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { format } from "date-fns"
import {
  Image,
  Video,
  File,
  CaseSensitive,
  Link,
  DollarSign,
  Calendar as CalendarIcon,
  Loader2,
  Check,
  X,
  Send,
  AlertCircle,
  ExternalLink,
  MessageSquare,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Template } from "../data/schema"
import {
  MediaUploadInput,
  type MediaUploadResult,
  type MediaType,
} from "./media-upload-input"
import type { TemplateVariable } from "./variable-library"

interface TemplateSendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template | null
  customer?: {
    id: string
    name: string
    phoneNumber: string
  } | null
  onSuccess?: () => void
}

interface VariableMapping {
  id: string
  templateName: string
  componentType: string
  componentIndex: number
  parameterIndex: number
  variableId: string
  variable: TemplateVariable
}

interface VariablePosition {
  componentType: "header" | "body" | "footer" | "button"
  componentIndex: number
  parameterIndex: number
  label: string
  variableId?: string
  variable?: TemplateVariable
  isMediaHeader?: boolean
}

interface RenderedTemplate {
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

interface FormErrors {
  [key: string]: string
}

const typeIcons: Record<TemplateVariable["type"], React.ElementType> = {
  TEXT: CaseSensitive,
  URL: Link,
  CURRENCY: DollarSign,
  DATE: CalendarIcon,
  IMAGE: Image,
  VIDEO: Video,
  DOCUMENT: File,
}

const typeColors: Record<TemplateVariable["type"], string> = {
  TEXT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  URL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  CURRENCY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  DATE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  IMAGE: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  VIDEO: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  DOCUMENT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
}

// Validation functions
const validateUrl = (url: string): boolean => {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

const validateCurrency = (value: string): boolean => {
  if (!value) return false
  const numberOnlyPattern = /^[\d,]+(?:\.\d{1,2})?$/
  const currencyWithCodePattern = /^[A-Z]{3}\s+[\d,]+(?:\.\d{1,2})?$/
  return (
    numberOnlyPattern.test(value.trim()) ||
    currencyWithCodePattern.test(value.trim())
  )
}

const validateDate = (value: string): boolean => {
  if (!value) return false
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/
  const ddmmyyyyPattern = /^\d{2}[/-]\d{2}[/-]\d{4}$/
  if (!isoPattern.test(value) && !ddmmyyyyPattern.test(value)) return false
  const date = new Date(value)
  return !isNaN(date.getTime())
}

const validateMediaUrl = (value: string): boolean => {
  if (!value) return false
  if (value.startsWith("http://")) return false
  if (value.startsWith("https://")) return validateUrl(value)
  return /^[\w-]+$/.test(value)
}

/**
 * Generate a unique key for a variable position
 */
function getPositionKey(
  componentType: string,
  componentIndex: number,
  parameterIndex: number
): string {
  return `${componentType}-${componentIndex}-${parameterIndex}`
}

/**
 * Extract variable positions from template
 */
function extractVariablePositions(template: Template): VariablePosition[] {
  const positions: VariablePosition[] = []
  const variableRegex = /\{\{(\d+)\}\}/g

  // Header variables
  if (template.headerType === "TEXT" && template.headerContent) {
    let match
    while ((match = variableRegex.exec(template.headerContent)) !== null) {
      const paramIndex = parseInt(match[1], 10) - 1
      positions.push({
        componentType: "header",
        componentIndex: 0,
        parameterIndex: paramIndex,
        label: `Header {{${match[1]}}}`,
      })
    }
  }

  // Media header (IMAGE, VIDEO, DOCUMENT)
  if (
    template.headerType &&
    ["IMAGE", "VIDEO", "DOCUMENT"].includes(template.headerType)
  ) {
    positions.push({
      componentType: "header",
      componentIndex: 0,
      parameterIndex: 0,
      label: `Header Media (${template.headerType})`,
      isMediaHeader: true,
    })
  }

  // Body variables
  if (template.content) {
    variableRegex.lastIndex = 0
    let match
    while ((match = variableRegex.exec(template.content)) !== null) {
      const paramIndex = parseInt(match[1], 10) - 1
      positions.push({
        componentType: "body",
        componentIndex: 0,
        parameterIndex: paramIndex,
        label: `Body {{${match[1]}}}`,
      })
    }
  }

  // Button variables (dynamic URLs)
  if (template.components) {
    template.components.forEach((component) => {
      if (component.type === "BUTTONS" && component.buttons) {
        component.buttons.forEach((button, buttonIndex) => {
          if (
            button.type === "URL" &&
            button.example &&
            button.example.length > 0
          ) {
            button.example.forEach((_, exampleIndex) => {
              positions.push({
                componentType: "button",
                componentIndex: buttonIndex,
                parameterIndex: exampleIndex,
                label: `Button "${button.text}" URL`,
              })
            })
          }
        })
      }
    })
  }

  return positions
}

export function TemplateSendDialog({
  open,
  onOpenChange,
  template,
  customer,
  onSuccess,
}: TemplateSendDialogProps) {
  const t = useTranslations("templates.sendDialog")
  const tVariables = useTranslations("templates.variables")
  const tCommon = useTranslations("common")
  const { toast } = useToast()

  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  )
  const [mediaUploads, setMediaUploads] = useState<
    Record<string, MediaUploadResult>
  >({})
  const [mappings, setMappings] = useState<VariableMapping[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [preview, setPreview] = useState<RenderedTemplate | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState<string | null>(null)

  // Extract variable positions from template
  const variablePositions = useMemo(() => {
    if (!template) return []
    return extractVariablePositions(template)
  }, [template])

  // Merge positions with mappings to get variable info
  const positionsWithVariables = useMemo(() => {
    return variablePositions.map((pos) => {
      const key = getPositionKey(
        pos.componentType,
        pos.componentIndex,
        pos.parameterIndex
      )
      const mapping = mappings.find(
        (m) =>
          m.componentType === pos.componentType &&
          m.componentIndex === pos.componentIndex &&
          m.parameterIndex === pos.parameterIndex
      )
      return {
        ...pos,
        key,
        variableId: mapping?.variableId,
        variable: mapping?.variable,
      }
    })
  }, [variablePositions, mappings])

  // Load mappings when dialog opens
  const loadMappings = useCallback(async () => {
    if (!template) return

    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
      const response = await fetch(
        `${apiUrl}/api/v1/template-variables/mappings/${encodeURIComponent(template.name)}`,
        { credentials: "include" }
      )

      if (response.ok) {
        const result = await response.json()
        setMappings(result.data || [])
      }
    } catch (error) {
      console.error("Error loading mappings:", error)
    } finally {
      setLoading(false)
    }
  }, [template])

  // Load data when dialog opens
  useEffect(() => {
    if (open && template) {
      loadMappings()
      setVariableValues({})
      setMediaUploads({})
      setErrors({})
      setPreview(null)
    }
  }, [open, template, loadMappings])

  // Render preview when variable values change
  const renderPreview = useCallback(async () => {
    if (!template || Object.keys(variableValues).length === 0) {
      setPreview(null)
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
      const response = await fetch(
        `${apiUrl}/api/v1/templates/render-preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            templateName: template.name,
            languageCode: template.language,
            variableValues,
          }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        setPreview(result.data)
      }
    } catch (error) {
      console.error("Error rendering preview:", error)
    }
  }, [template, variableValues])

  // Debounced preview update
  useEffect(() => {
    const timer = setTimeout(() => {
      renderPreview()
    }, 300)
    return () => clearTimeout(timer)
  }, [renderPreview])

  // Handle variable value change
  const handleValueChange = (variableId: string, value: string) => {
    setVariableValues((prev) => ({
      ...prev,
      [variableId]: value,
    }))
    // Clear error when user types
    if (errors[variableId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[variableId]
        return newErrors
      })
    }
  }

  // Handle media upload change
  const handleMediaChange = (
    variableId: string,
    result: MediaUploadResult | null
  ) => {
    if (result) {
      // Store the media upload result
      setMediaUploads((prev) => ({
        ...prev,
        [variableId]: result,
      }))
      // Store the media_id as the variable value (used in template payload)
      setVariableValues((prev) => ({
        ...prev,
        [variableId]: result.mediaId,
      }))
    } else {
      // Remove media upload
      setMediaUploads((prev) => {
        const newUploads = { ...prev }
        delete newUploads[variableId]
        return newUploads
      })
      setVariableValues((prev) => {
        const newValues = { ...prev }
        delete newValues[variableId]
        return newValues
      })
    }
    // Clear error
    if (errors[variableId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[variableId]
        return newErrors
      })
    }
  }

  // Handle media upload error
  const handleMediaError = (variableId: string, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [variableId]: error,
    }))
  }

  // Validate a single variable value
  const validateValue = (
    variable: TemplateVariable,
    value: string,
    variableId: string
  ): string | null => {
    // For media types, check if we have a media upload
    if (
      variable.type === "IMAGE" ||
      variable.type === "VIDEO" ||
      variable.type === "DOCUMENT"
    ) {
      const hasMediaUpload = mediaUploads[variableId]
      if (!hasMediaUpload && (!value || value.trim() === "")) {
        return t("validation.required")
      }
      // If we have a media upload, the value is the media_id which is valid
      if (hasMediaUpload) {
        return null
      }
      // Otherwise validate as media URL
      if (!validateMediaUrl(value)) {
        return t("validation.invalidMediaUrl")
      }
      return null
    }

    if (!value || value.trim() === "") {
      return t("validation.required")
    }

    switch (variable.type) {
      case "URL":
        if (!validateUrl(value)) {
          return t("validation.invalidUrl")
        }
        break
      case "CURRENCY":
        if (!validateCurrency(value)) {
          return t("validation.invalidCurrency")
        }
        break
      case "DATE":
        if (!validateDate(value)) {
          return t("validation.invalidDate")
        }
        break
    }
    return null
  }

  // Validate all variables
  const validateAll = (): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    for (const pos of positionsWithVariables) {
      if (pos.variableId && pos.variable) {
        const value = variableValues[pos.variableId] || ""
        const error = validateValue(pos.variable, value, pos.variableId)
        if (error) {
          newErrors[pos.variableId] = error
          isValid = false
        }
      }
    }

    setErrors(newErrors)
    return isValid
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!template || !customer) return

    if (!validateAll()) {
      toast({
        title: t("toast.validationError"),
        description: t("toast.checkFields"),
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
      const response = await fetch(`${apiUrl}/api/v1/templates/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerId: customer.id,
          templateName: template.name,
          languageCode: template.language,
          variableValues,
        }),
      })

      if (response.ok) {
        toast({
          title: t("toast.sent"),
          description: t("toast.sentDescription", { customer: customer.name }),
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        const result = await response.json()
        toast({
          title: t("toast.error"),
          description: result.error?.message || t("toast.sendFailed"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending template:", error)
      toast({
        title: t("toast.error"),
        description: t("toast.networkError"),
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  // Handle date selection
  const handleDateSelect = (variableId: string, date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd")
      handleValueChange(variableId, formattedDate)
    }
    setDatePickerOpen(null)
  }

  // Render type-specific input
  const renderVariableInput = (pos: (typeof positionsWithVariables)[0]) => {
    if (!pos.variableId || !pos.variable) {
      return (
        <div className="text-muted-foreground text-sm italic">
          {t("noMappingConfigured")}
        </div>
      )
    }

    const value = variableValues[pos.variableId] || ""
    const error = errors[pos.variableId]
    const TypeIcon = typeIcons[pos.variable.type]

    const baseInputProps = {
      value,
      placeholder: pos.variable.exampleValue || "",
      className: cn(
        error ? "border-destructive" : "",
        value && !error ? "border-green-500 focus-visible:ring-green-500" : ""
      ),
    }

    switch (pos.variable.type) {
      case "DATE":
        return (
          <div className="space-y-1">
            <div className="flex gap-2">
              <Input
                {...baseInputProps}
                onChange={(e) =>
                  handleValueChange(pos.variableId!, e.target.value)
                }
                className={cn(baseInputProps.className, "flex-1")}
              />
              <Popover
                open={datePickerOpen === pos.variableId}
                onOpenChange={(open) =>
                  setDatePickerOpen(open ? pos.variableId! : null)
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={value ? new Date(value) : undefined}
                    onSelect={(date) => handleDateSelect(pos.variableId!, date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        )

      case "CURRENCY":
        return (
          <div className="space-y-1">
            <div className="relative">
              <Input
                {...baseInputProps}
                onChange={(e) =>
                  handleValueChange(pos.variableId!, e.target.value)
                }
                className={cn(baseInputProps.className, "pl-10")}
              />
              <DollarSign className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        )

      case "URL":
        return (
          <div className="space-y-1">
            <div className="relative">
              <Input
                {...baseInputProps}
                type="url"
                onChange={(e) =>
                  handleValueChange(pos.variableId!, e.target.value)
                }
                className={cn(baseInputProps.className, "pr-10 pl-10")}
              />
              <TypeIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              {value && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  {!error ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="text-destructive h-4 w-4" />
                  )}
                </div>
              )}
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        )

      case "IMAGE":
      case "VIDEO":
      case "DOCUMENT":
        return (
          <div className="space-y-1">
            <MediaUploadInput
              type={pos.variable.type as MediaType}
              value={mediaUploads[pos.variableId!] || null}
              onChange={(result) => handleMediaChange(pos.variableId!, result)}
              onError={(err) => handleMediaError(pos.variableId!, err)}
              disabled={sending}
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        )

      default:
        return (
          <div className="space-y-1">
            <div className="relative">
              <Input
                {...baseInputProps}
                onChange={(e) =>
                  handleValueChange(pos.variableId!, e.target.value)
                }
                className={cn(baseInputProps.className, "pr-10")}
              />
              {value && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  {!error ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="text-destructive h-4 w-4" />
                  )}
                </div>
              )}
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        )
    }
  }

  // Get uploaded media for header preview
  const getHeaderMediaUpload = useCallback((): MediaUploadResult | null => {
    // Find the header media position
    const headerMediaPos = positionsWithVariables.find(
      (pos) => pos.isMediaHeader && pos.variableId
    )
    if (headerMediaPos?.variableId) {
      return mediaUploads[headerMediaPos.variableId] || null
    }
    return null
  }, [positionsWithVariables, mediaUploads])

  // Render WhatsApp-style preview
  const renderPreviewContent = () => {
    if (!template) return null

    // Use preview data if available, otherwise show template with placeholders
    const headerContent = preview?.header?.content || template.headerContent
    const bodyContent = preview?.body || template.content
    const footerContent = preview?.footer || template.footerText
    const headerMediaUpload = getHeaderMediaUpload()

    return (
      <div className="min-h-[200px] rounded-lg bg-[#e5ddd5] p-4 dark:bg-gray-800">
        <div className="ml-auto max-w-[280px]">
          {/* Message bubble */}
          <div className="relative rounded-lg bg-[#dcf8c6] p-3 shadow-sm dark:bg-green-900">
            {/* Header */}
            {template.headerType && (
              <div className="mb-2">
                {template.headerType === "TEXT" && headerContent && (
                  <p className="text-sm font-semibold">{headerContent}</p>
                )}
                {template.headerType === "IMAGE" &&
                  (headerMediaUpload?.previewUrl ? (
                    <div className="overflow-hidden rounded">
                      <img
                        src={headerMediaUpload.previewUrl}
                        alt="Header"
                        className="h-auto max-h-48 w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                  ))}
                {template.headerType === "VIDEO" &&
                  (headerMediaUpload?.previewUrl ? (
                    <div className="overflow-hidden rounded bg-black">
                      <video
                        src={headerMediaUpload.previewUrl}
                        className="h-auto max-h-48 w-full object-contain"
                        controls
                        muted
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                      <Video className="h-8 w-8 text-gray-400" />
                    </div>
                  ))}
                {template.headerType === "DOCUMENT" &&
                  (headerMediaUpload ? (
                    <div className="flex items-center gap-2 rounded bg-gray-200 p-3 dark:bg-gray-700">
                      <File className="h-6 w-6 text-gray-400" />
                      <span className="truncate text-sm text-gray-600 dark:text-gray-300">
                        {headerMediaUpload.filename}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded bg-gray-200 p-3 dark:bg-gray-700">
                      <File className="h-6 w-6 text-gray-400" />
                      <span className="text-sm text-gray-500">Document</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Body */}
            <p className="text-sm break-words whitespace-pre-wrap">
              {bodyContent}
            </p>

            {/* Footer */}
            {footerContent && (
              <p className="mt-2 text-xs text-gray-500">{footerContent}</p>
            )}

            {/* Timestamp */}
            <div className="mt-1 flex justify-end">
              <span className="text-[10px] text-gray-500">
                {format(new Date(), "HH:mm")}
              </span>
            </div>
          </div>

          {/* Buttons */}
          {preview?.buttons && preview.buttons.length > 0 && (
            <div className="mt-1 space-y-1">
              {preview.buttons.map((button, index) => (
                <button
                  key={index}
                  className="flex w-full items-center justify-center gap-1 rounded-lg bg-white px-3 py-2 text-sm text-blue-500 shadow-sm dark:bg-gray-700 dark:text-blue-400"
                >
                  {button.type === "url" && (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  {button.text}
                </button>
              ))}
            </div>
          )}

          {/* Show template buttons if no preview */}
          {!preview?.buttons &&
            template.components?.some((c) => c.type === "BUTTONS") && (
              <div className="mt-1 space-y-1">
                {template.components
                  .filter((c) => c.type === "BUTTONS")
                  .flatMap((c) => c.buttons || [])
                  .map((button, index) => (
                    <button
                      key={index}
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-white px-3 py-2 text-sm text-blue-500 shadow-sm dark:bg-gray-700 dark:text-blue-400"
                    >
                      {button.type === "URL" && (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      {button.text}
                    </button>
                  ))}
              </div>
            )}
        </div>
      </div>
    )
  }

  if (!template || !customer) return null

  const hasVariables = positionsWithVariables.length > 0
  const hasMappings = positionsWithVariables.some((p) => p.variableId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description", {
              templateName: template.name,
              customer: customer.name,
            })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
              {/* Left side: Variable inputs */}
              <div className="flex flex-col">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  {t("variableInputs")}
                </h3>

                {!hasVariables ? (
                  <div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg py-8 text-center">
                    <Check className="mb-2 h-8 w-8 text-green-500" />
                    <p className="text-muted-foreground text-sm">
                      {t("noVariablesNeeded")}
                    </p>
                  </div>
                ) : !hasMappings ? (
                  <div className="flex flex-col items-center justify-center rounded-lg bg-amber-50 py-8 text-center dark:bg-amber-900/20">
                    <AlertCircle className="mb-2 h-8 w-8 text-amber-500" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {t("noMappingsConfigured")}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {t("configureMappingsHint")}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="-mr-4 max-h-[400px] flex-1 pr-4">
                    <div className="space-y-4">
                      {positionsWithVariables.map((pos) => {
                        if (!pos.variableId || !pos.variable) return null

                        const TypeIcon = typeIcons[pos.variable.type]

                        return (
                          <div key={pos.key} className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4" />
                              <span>{pos.variable.name}</span>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-xs",
                                  typeColors[pos.variable.type]
                                )}
                              >
                                {tVariables(`types.${pos.variable.type}`)}
                              </Badge>
                            </Label>
                            {pos.variable.description && (
                              <p className="text-muted-foreground text-xs">
                                {pos.variable.description}
                              </p>
                            )}
                            {renderVariableInput(pos)}
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Right side: Preview */}
              <div className="flex flex-col">
                <h3 className="mb-3 text-sm font-medium">{t("preview")}</h3>
                <ScrollArea className="max-h-[400px] flex-1">
                  {renderPreviewContent()}
                </ScrollArea>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={sending || loading || (hasVariables && !hasMappings)}
          >
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            {t("send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
