"use client"

import { useState, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  IconUpload,
  IconFileTypeCsv,
  IconDownload,
  IconX,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface CsvUploaderProps {
  phoneNumbers: string[]
  onPhoneNumbersChange: (phones: string[]) => void
}

interface ParseResult {
  valid: string[]
  invalid: string[]
}

// E.164 phone number validation (basic)
const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, "")
  // Must start with + and have 10-15 digits
  return /^\+?\d{10,15}$/.test(cleaned)
}

const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "")
  // Add + if not present and starts with country code
  if (!cleaned.startsWith("+") && cleaned.length >= 10) {
    cleaned = "+" + cleaned
  }
  return cleaned
}

const parseCSV = (content: string): ParseResult => {
  const lines = content.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return { valid: [], invalid: [] }

  // Find phoneNumber column
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const phoneIndex = headers.findIndex(
    (h) => h === "phonenumber" || h === "phone_number" || h === "phone" || h === "nomor" || h === "no_telepon"
  )

  const valid: string[] = []
  const invalid: string[] = []
  const seen = new Set<string>()

  // If no header found, assume first column is phone number
  const colIndex = phoneIndex >= 0 ? phoneIndex : 0
  const startRow = phoneIndex >= 0 ? 1 : 0

  for (let i = startRow; i < lines.length; i++) {
    const cols = lines[i].split(",")
    const rawPhone = cols[colIndex]?.trim()
    if (!rawPhone) continue

    const normalized = normalizePhoneNumber(rawPhone)
    
    // Skip duplicates
    if (seen.has(normalized)) continue
    seen.add(normalized)

    if (isValidPhoneNumber(normalized)) {
      valid.push(normalized)
    } else {
      invalid.push(rawPhone)
    }
  }

  return { valid, invalid }
}

export function CsvUploader({ phoneNumbers, onPhoneNumbersChange }: CsvUploaderProps) {
  const t = useTranslations("broadcast.csvUploader")
  const tRecipient = useTranslations("broadcast.recipientSelector")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [invalidNumbers, setInvalidNumbers] = useState<string[]>([])
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) {
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const result = parseCSV(content)
        onPhoneNumbersChange(result.valid)
        setInvalidNumbers(result.invalid)
        setFileName(file.name)
      }
      reader.readAsText(file)
    },
    [onPhoneNumbersChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleClear = () => {
    onPhoneNumbersChange([])
    setInvalidNumbers([])
    setFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const downloadTemplate = () => {
    const csvContent = "phoneNumber\n+6281234567890\n+6289876543210"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "broadcast_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasData = phoneNumbers.length > 0 || invalidNumbers.length > 0

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          hasData && "border-solid"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleInputChange}
        />

        {hasData ? (
          <div className="space-y-2">
            <IconFileTypeCsv className="text-primary mx-auto h-10 w-10" />
            <p className="font-medium">{fileName}</p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="default" className="gap-1">
                <IconCheck className="h-3 w-3" />
                {t("validCount", { count: phoneNumbers.length })}
              </Badge>
              {invalidNumbers.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <IconAlertTriangle className="h-3 w-3" />
                  {t("invalidCount", { count: invalidNumbers.length })}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <IconUpload className="text-muted-foreground mx-auto h-10 w-10" />
            <p className="font-medium">{t("dropzone.title")}</p>
            <p className="text-muted-foreground text-sm">{t("dropzone.subtitle")}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <IconDownload className="mr-2 h-4 w-4" />
          {t("downloadTemplate")}
        </Button>
        {hasData && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <IconX className="mr-2 h-4 w-4" />
            {t("clear")}
          </Button>
        )}
      </div>

      {/* Invalid numbers list */}
      {invalidNumbers.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3">
          <p className="text-destructive mb-2 text-sm font-medium">
            {t("invalidNumbers")}
          </p>
          <ScrollArea className="h-[100px]">
            <div className="space-y-1">
              {invalidNumbers.map((num, i) => (
                <div key={i} className="text-muted-foreground text-xs">
                  {num}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Selected count */}
      {phoneNumbers.length > 0 && (
        <div className="text-muted-foreground text-sm">
          {tRecipient("selectedCount", { count: phoneNumbers.length })}
        </div>
      )}
    </div>
  )
}

export default CsvUploader
