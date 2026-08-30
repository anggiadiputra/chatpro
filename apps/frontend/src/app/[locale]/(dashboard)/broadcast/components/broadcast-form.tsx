"use client"

import { useState, useMemo } from "react"
import { Send, Loader2, Users, FileSpreadsheet, Eye, Clock } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Template } from "../../templates/data/schema"
import { CsvUploader } from "./csv-uploader"
import { CustomerSelector } from "./customer-selector"
import { TemplatePreviewLive } from "./template-preview-live"
import { TemplateSelector } from "./template-selector"
import { VariableInput, validateVariables } from "./variable-input"

interface BroadcastFormProps {
  onSuccess?: () => void
}

type RecipientMode = "customers" | "csv"

// Delay options in milliseconds
const DELAY_OPTIONS = [
  { value: "0", label: "No delay" },
  { value: "500", label: "0.5 seconds" },
  { value: "1000", label: "1 second" },
  { value: "2000", label: "2 seconds" },
  { value: "3000", label: "3 seconds" },
  { value: "5000", label: "5 seconds" },
  { value: "10000", label: "10 seconds" },
]

export function BroadcastForm({ onSuccess }: BroadcastFormProps) {
  const t = useTranslations("broadcast")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  )
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  )
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("customers")
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messageDelay, setMessageDelay] = useState("1000") // Default 1 second

  // Reset variables when template changes
  const handleTemplateSelect = (template: Template | null) => {
    setSelectedTemplate(template)
    setVariableValues({})
  }

  // Validation
  const isValid = useMemo(() => {
    if (!selectedTemplate) return false

    // Check variables are filled
    if (!validateVariables(selectedTemplate, variableValues)) return false

    // Check recipients
    if (recipientMode === "customers" && selectedCustomerIds.length === 0)
      return false
    if (recipientMode === "csv" && phoneNumbers.length === 0) return false

    return true
  }, [
    selectedTemplate,
    variableValues,
    recipientMode,
    selectedCustomerIds,
    phoneNumbers,
  ])

  // Get recipient count
  const recipientCount =
    recipientMode === "customers"
      ? selectedCustomerIds.length
      : phoneNumbers.length

  const handleSubmit = async () => {
    if (!selectedTemplate || !isValid) {
      toast({
        title: t("form.validationError"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

      // Use templateName from API response (backend uses templateName, not name)
      const templateName =
        (selectedTemplate as any).templateName || selectedTemplate.name

      const payload = {
        templateName,
        languageCode: selectedTemplate.language,
        variableValues,
        recipientSource: recipientMode,
        messageDelayMs: parseInt(messageDelay, 10),
        ...(recipientMode === "customers"
          ? { customerIds: selectedCustomerIds }
          : { phoneNumbers }),
      }

      const response = await fetch(`${apiUrl}/api/v1/broadcast/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      console.log("Broadcast response:", { status: response.status, result })

      if (response.ok && result.success) {
        toast({
          title: t("form.success"),
        })

        // Reset form
        setSelectedTemplate(null)
        setVariableValues({})
        setSelectedCustomerIds([])
        setPhoneNumbers([])

        // Redirect to active jobs tab
        const params = new URLSearchParams(searchParams.toString())
        params.set("tab", "active")
        router.push(`${pathname}?${params.toString()}`)

        onSuccess?.()
      } else {
        console.error("Broadcast error:", result.error)
        toast({
          title: result.error?.message || t("form.error"),
          description: result.error?.code
            ? `Error code: ${result.error.code}`
            : undefined,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Broadcast submit error:", error)
      toast({
        title: t("form.error"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column - Form */}
      <div className="space-y-6">
        {/* Step 1: Template Selection */}
        <TemplateSelector
          selected={selectedTemplate}
          onSelect={handleTemplateSelect}
          showPreview={false}
        />

        {/* Step 2: Variable Input (if template has variables) */}
        {selectedTemplate && (
          <VariableInput
            template={selectedTemplate}
            values={variableValues}
            onChange={setVariableValues}
          />
        )}

        {/* Step 3: Recipient Selection */}
        {selectedTemplate && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("recipientSelector.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={recipientMode}
                onValueChange={(v) => setRecipientMode(v as RecipientMode)}
              >
                <TabsList className="mb-4 grid w-full grid-cols-2">
                  <TabsTrigger value="customers" className="gap-2">
                    <Users className="h-4 w-4" />
                    {t("recipientSelector.fromCustomers")}
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    {t("recipientSelector.fromCsv")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="customers">
                  <CustomerSelector
                    selectedIds={selectedCustomerIds}
                    onSelectionChange={setSelectedCustomerIds}
                  />
                </TabsContent>

                <TabsContent value="csv">
                  <CsvUploader
                    phoneNumbers={phoneNumbers}
                    onPhoneNumbersChange={setPhoneNumbers}
                  />
                </TabsContent>
              </Tabs>

              {/* Delay Setting */}
              <div className="mt-4 border-t pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <Label className="text-sm font-medium">
                    {t("form.delayLabel")}
                  </Label>
                </div>
                <Select value={messageDelay} onValueChange={setMessageDelay}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELAY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t("form.delayDescription")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {selectedTemplate && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-muted-foreground text-sm">
              {recipientCount > 0 &&
                t("recipientSelector.selectedCount", { count: recipientCount })}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("form.sending")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {t("form.send")}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Right Column - Live Preview */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <CardTitle className="text-base">{t("preview.title")}</CardTitle>
            </div>
            <CardDescription>{t("preview.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <TemplatePreviewLive
                template={selectedTemplate}
                variableValues={variableValues}
              />
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
                <Eye className="text-muted-foreground mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
                  {t("preview.placeholder")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BroadcastForm
