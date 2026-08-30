"use client"

import { useState, useRef, useCallback } from "react"
import {
  Image,
  Video,
  File,
  X,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

/**
 * Media type constraints matching backend
 */
export const MEDIA_CONSTRAINTS = {
  IMAGE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png"],
    allowedExtensions: [".jpg", ".jpeg", ".png"],
    accept: "image/jpeg,image/png",
  },
  VIDEO: {
    maxSize: 16 * 1024 * 1024, // 16MB
    allowedMimeTypes: ["video/mp4", "video/3gpp"],
    allowedExtensions: [".mp4", ".3gp", ".3gpp"],
    accept: "video/mp4,video/3gpp",
  },
  DOCUMENT: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    allowedExtensions: [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
    ],
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
  },
} as const

export type MediaType = keyof typeof MEDIA_CONSTRAINTS

export interface MediaUploadResult {
  mediaId: string
  mimeType: string
  fileSize: number
  filename: string
  expiresAt?: string
  previewUrl?: string // For local preview
}

export interface MediaUploadInputProps {
  type: MediaType
  value?: MediaUploadResult | null
  onChange: (result: MediaUploadResult | null) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

type UploadStatus = "idle" | "uploading" | "success" | "error"

const typeIcons: Record<MediaType, React.ElementType> = {
  IMAGE: Image,
  VIDEO: Video,
  DOCUMENT: File,
}

/**
 * Format file size to human readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * MediaUploadInput Component
 *
 * A file upload component with drag-and-drop support for template media variables.
 * Uploads media to WhatsApp API and returns media_id.
 *
 * Requirements: 3.3
 */
export function MediaUploadInput({
  type,
  value,
  onChange,
  onError,
  disabled = false,
  className,
}: MediaUploadInputProps) {
  const t = useTranslations("templates.mediaUpload")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(
    value ? "success" : "idle"
  )
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const constraints = MEDIA_CONSTRAINTS[type]
  const TypeIcon = typeIcons[type]
  const maxSizeMB = constraints.maxSize / (1024 * 1024)

  /**
   * Validate file before upload
   */
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > constraints.maxSize) {
        return t("errors.fileTooLarge", { maxSize: maxSizeMB })
      }

      // Check MIME type
      const allowedTypes = constraints.allowedMimeTypes as readonly string[]
      if (!allowedTypes.includes(file.type)) {
        return t("errors.invalidFileType", {
          allowedTypes: constraints.allowedExtensions.join(", "),
        })
      }

      return null
    },
    [constraints, maxSizeMB, t]
  )

  /**
   * Upload file to WhatsApp API
   */
  const uploadFile = useCallback(
    async (file: File) => {
      // Validate first
      const validationError = validateFile(file)
      if (validationError) {
        setErrorMessage(validationError)
        setUploadStatus("error")
        onError?.(validationError)
        return
      }

      setUploadStatus("uploading")
      setUploadProgress(0)
      setErrorMessage(null)

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", type)

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

        // Use XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest()

        const uploadPromise = new Promise<MediaUploadResult>(
          (resolve, reject) => {
            xhr.upload.addEventListener("progress", (event) => {
              if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100)
                setUploadProgress(progress)
              }
            })

            xhr.addEventListener("load", () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText)
                if (response.success && response.data) {
                  // Create local preview URL for images/videos
                  let previewUrl: string | undefined
                  if (type === "IMAGE" || type === "VIDEO") {
                    previewUrl = URL.createObjectURL(file)
                  }

                  resolve({
                    ...response.data,
                    previewUrl,
                  })
                } else {
                  reject(
                    new Error(
                      response.error?.message || t("errors.uploadFailed")
                    )
                  )
                }
              } else {
                try {
                  const response = JSON.parse(xhr.responseText)
                  reject(
                    new Error(
                      response.error?.message || t("errors.uploadFailed")
                    )
                  )
                } catch {
                  reject(new Error(t("errors.uploadFailed")))
                }
              }
            })

            xhr.addEventListener("error", () => {
              reject(new Error(t("errors.networkError")))
            })

            xhr.addEventListener("abort", () => {
              reject(new Error(t("errors.uploadCancelled")))
            })

            xhr.open("POST", `${apiUrl}/api/v1/templates/media/upload`)
            xhr.withCredentials = true
            xhr.send(formData)
          }
        )

        const result = await uploadPromise
        setUploadStatus("success")
        setUploadProgress(100)
        onChange(result)
      } catch (error: any) {
        setUploadStatus("error")
        setErrorMessage(error.message)
        onError?.(error.message)
      }
    },
    [type, validateFile, onChange, onError, t]
  )

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      uploadFile(files[0])
    },
    [uploadFile]
  )

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) setIsDragging(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return
      handleFileSelect(e.dataTransfer.files)
    },
    [disabled, handleFileSelect]
  )

  /**
   * Handle remove media
   */
  const handleRemove = useCallback(() => {
    // Revoke preview URL if exists
    if (value?.previewUrl) {
      URL.revokeObjectURL(value.previewUrl)
    }
    onChange(null)
    setUploadStatus("idle")
    setUploadProgress(0)
    setErrorMessage(null)
  }, [value, onChange])

  /**
   * Trigger file input click
   */
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Render uploaded media preview
  if (value && uploadStatus === "success") {
    return (
      <div className={cn("relative", className)}>
        <MediaPreview
          type={type}
          result={value}
          onRemove={handleRemove}
          disabled={disabled}
        />
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Drop zone */}
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-4 transition-colors",
          isDragging && !disabled
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "cursor-not-allowed opacity-50",
          uploadStatus === "error" && "border-destructive"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={constraints.accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || uploadStatus === "uploading"}
          className="hidden"
        />

        {uploadStatus === "uploading" ? (
          // Uploading state
          <div className="flex flex-col items-center gap-3 py-2">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <div className="w-full max-w-xs space-y-1">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-muted-foreground text-center text-xs">
                {t("uploading", { progress: uploadProgress })}
              </p>
            </div>
          </div>
        ) : (
          // Idle/Error state
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className={cn(
                "rounded-full p-3",
                uploadStatus === "error" ? "bg-destructive/10" : "bg-muted"
              )}
            >
              {uploadStatus === "error" ? (
                <AlertCircle className="text-destructive h-6 w-6" />
              ) : (
                <TypeIcon className="text-muted-foreground h-6 w-6" />
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragging ? t("dropHere") : t("dragAndDrop")}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {t("or")}{" "}
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  disabled={disabled}
                  className="text-primary hover:underline focus:outline-none"
                >
                  {t("browse")}
                </button>
              </p>
            </div>

            {/* File constraints info */}
            <div className="text-muted-foreground mt-1 text-center text-xs">
              <p>{t("maxSize", { size: maxSizeMB })}</p>
              <p>{constraints.allowedExtensions.join(", ").toUpperCase()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <p className="text-destructive flex items-center gap-1 text-xs">
          <AlertCircle className="h-3 w-3" />
          {errorMessage}
        </p>
      )}
    </div>
  )
}

/**
 * MediaPreview Component
 *
 * Shows preview of uploaded media with remove/replace option.
 *
 * Requirements: 3.3
 */
interface MediaPreviewProps {
  type: MediaType
  result: MediaUploadResult
  onRemove: () => void
  disabled?: boolean
}

function MediaPreview({ type, result, onRemove, disabled }: MediaPreviewProps) {
  const t = useTranslations("templates.mediaUpload")
  const TypeIcon = typeIcons[type]

  return (
    <div className="bg-muted/30 relative overflow-hidden rounded-lg border">
      {/* Preview content */}
      <div className="p-3">
        {type === "IMAGE" && result.previewUrl ? (
          // Image preview
          <div className="bg-muted relative aspect-video overflow-hidden rounded">
            <img
              src={result.previewUrl}
              alt={result.filename}
              className="h-full w-full object-contain"
            />
          </div>
        ) : type === "VIDEO" && result.previewUrl ? (
          // Video preview
          <div className="relative aspect-video overflow-hidden rounded bg-black">
            <video
              src={result.previewUrl}
              className="h-full w-full object-contain"
              controls
              muted
            />
          </div>
        ) : (
          // Document preview (icon + filename)
          <div className="flex items-center gap-3 p-2">
            <div className="bg-muted rounded p-2">
              <TypeIcon className="text-muted-foreground h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{result.filename}</p>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(result.fileSize)}
              </p>
            </div>
          </div>
        )}

        {/* File info for images/videos */}
        {(type === "IMAGE" || type === "VIDEO") && (
          <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
            <span className="max-w-[60%] truncate">{result.filename}</span>
            <span>{formatFileSize(result.fileSize)}</span>
          </div>
        )}
      </div>

      {/* Success indicator */}
      <div className="absolute top-2 left-2">
        <div className="flex items-center gap-1 rounded bg-green-500/90 px-2 py-1 text-xs text-white">
          <Check className="h-3 w-3" />
          {t("uploaded")}
        </div>
      </div>

      {/* Remove button */}
      {!disabled && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export { MediaPreview }
