"use client"

import { useState, useEffect } from "react"
import {
  RefreshCw,
  Save,
  AlertCircle,
  CircleCheck,
  Info,
  MessageCircle,
  Mail,
  Image as ImageIcon,
  Globe,
  SquarePen,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

interface BrandingSettings {
  websiteName: string
  logoUrl: string
  supportEmail: string
  supportWhatsapp: string
}

const defaultSettings: BrandingSettings = {
  websiteName: process.env.NEXT_PUBLIC_APP_NAME || "Platform",
  logoUrl: "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
  supportWhatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "+6281295648580",
}

export default function BrandingSettingsPage() {
  const t = useTranslations("admin")
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings)
  const [initialSettings, setInitialSettings] = useState<BrandingSettings>(defaultSettings)
  const [isEditing, setIsEditing] = useState(false)
  const [source, setSource] = useState<"database" | "env" | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [saveResult, setSaveResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})

  // Fetch branding settings
  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `${API_URL}/api/v1/admin/settings/branding`,
        {
          credentials: "include",
        }
      )

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You don't have permission to access settings")
        }
        throw new Error("Failed to fetch settings")
      }

      const result = await response.json()

      if (result.success && result.data) {
        setSettings(result.data.data as BrandingSettings)
        setInitialSettings(result.data.data as BrandingSettings)
        setSource(result.data.source)
      } else {
        throw new Error(result.error?.message || "Failed to fetch settings")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // Validate email format
  const validateEmail = (email: string): boolean => {
    if (!email) return true // Empty is valid (will use default)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate phone format (basic validation)
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Empty is valid (will use default)
    // Allow formats like +6281234567890, 081234567890, +62 812-3456-7890
    const phoneRegex = /^[+]?[\d\s\-()]{8,20}$/
    return phoneRegex.test(phone)
  }

  const handleChange =
    (field: keyof BrandingSettings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSettings((prev) => ({ ...prev, [field]: value }))
      setSaveResult(null)

      // Clear validation error for this field
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })

      // Validate on change
      if (field === "supportEmail" && value && !validateEmail(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          supportEmail: t("branding.invalidEmail") || "Invalid email format",
        }))
      }
      if (field === "supportWhatsapp" && value && !validatePhone(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          supportWhatsapp: t("branding.invalidPhone") || "Invalid phone format",
        }))
      }
    }

  const handleSave = async () => {
    // Validate before saving
    const errors: Record<string, string> = {}
    if (settings.supportEmail && !validateEmail(settings.supportEmail)) {
      errors.supportEmail = t("branding.invalidEmail") || "Invalid email format"
    }
    if (settings.supportWhatsapp && !validatePhone(settings.supportWhatsapp)) {
      errors.supportWhatsapp =
        t("branding.invalidPhone") || "Invalid phone format"
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      setIsUpdating(true)
      setSaveResult(null)

      const response = await fetch(
        `${API_URL}/api/v1/admin/settings/branding`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(settings),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        setSaveResult({
          success: false,
          message: result.error?.message || "Failed to update settings",
        })
        return
      }

      await fetchSettings()
      setIsEditing(false)
      setSaveResult({
        success: true,
        message:
          result.message ||
          t("branding.saveSuccess") ||
          "Settings saved successfully",
      })
    } catch (err) {
      setSaveResult({
        success: false,
        message: err instanceof Error ? err.message : "An error occurred",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setSettings(initialSettings)
    setValidationErrors({})
    setSaveResult(null)
    setIsEditing(false)
  }

  const handleReset = async () => {
    try {
      setIsResetting(true)
      setSaveResult(null)

      const response = await fetch(
        `${API_URL}/api/v1/admin/settings/branding/reset`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      const result = await response.json()

      if (!response.ok) {
        setSaveResult({
          success: false,
          message: result.error?.message || "Failed to reset settings",
        })
        return
      }

      await fetchSettings()
      setIsEditing(false)
      setSaveResult({
        success: true,
        message:
          result.message ||
          t("branding.resetSuccess") ||
          "Settings reset to defaults",
      })
    } catch (err) {
      setSaveResult({
        success: false,
        message: err instanceof Error ? err.message : "An error occurred",
      })
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("branding.title") || "Branding Settings"}
          </h1>
          <p className="text-muted-foreground">
            {t("branding.description") ||
              "Configure website branding and support contact information"}
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("branding.title") || "Branding Settings"}
          </h1>
          <p className="text-muted-foreground">
            {t("branding.description") ||
              "Configure website branding and support contact information"}
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSaveResult(null)
              setIsEditing(true)
            }}
            className="gap-1.5 self-start sm:self-auto"
          >
            <SquarePen className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {/* Website Branding Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("branding.websiteBranding") || "Website Branding"}
          </CardTitle>
          <CardDescription>
            {t("branding.websiteBrandingDesc") ||
              "Configure website name and logo displayed across the application"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {source && (
            <Alert variant={source === "database" ? "default" : "destructive"}>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {source === "database"
                  ? t("branding.sourceDatabase") ||
                    "Settings loaded from database"
                  : t("branding.sourceEnv") ||
                    "Settings loaded from .env (database unavailable or empty)"}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saveResult && (
            <Alert variant={saveResult.success ? "default" : "destructive"}>
              {saveResult.success ? (
                <CircleCheck className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{saveResult.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="websiteName">
                <Globe className="mr-1 inline h-4 w-4" />
                {t("branding.websiteName") || "Website Name"}
              </Label>
              <Input
                id="websiteName"
                value={settings.websiteName}
                onChange={handleChange("websiteName")}
                placeholder="My Brand Name"
                disabled={!isEditing}
              />
              <p className="text-muted-foreground text-xs">
                {t("branding.websiteNameHint") ||
                  "Displayed in page titles, headers, and sidebar"}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="logoUrl">
                <ImageIcon className="mr-1 inline h-4 w-4" />
                {t("branding.logoUrl") || "Logo URL"}
              </Label>
              <Input
                id="logoUrl"
                value={settings.logoUrl}
                onChange={handleChange("logoUrl")}
                placeholder="https://example.com/logo.png"
                disabled={!isEditing}
              />
              <p className="text-muted-foreground text-xs">
                {t("branding.logoUrlHint") ||
                  "URL to logo image. Leave empty to show website name as text"}
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-muted/30 rounded-lg border p-4">
            <Label className="mb-3 block text-sm font-medium">
              {t("branding.preview") || "Preview"}
            </Label>
            <div className="bg-background flex items-center gap-3 rounded-md border p-3">
              {settings.logoUrl ? (
                <Image
                  src={settings.logoUrl}
                  alt={settings.websiteName || "Logo"}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    // Hide broken image
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              ) : (
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded">
                  <span className="text-primary text-sm font-bold">
                    {(settings.websiteName || "K").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-semibold">
                {settings.websiteName || process.env.NEXT_PUBLIC_APP_NAME || "App Platform"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Contact Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("branding.supportContact") || "Support Contact"}
          </CardTitle>
          <CardDescription>
            {t("branding.supportContactDesc") ||
              "Configure support contact information displayed on Help & Support page"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="supportEmail">
                <Mail className="mr-1 inline h-4 w-4" />
                {t("branding.supportEmail") || "Support Email"}
              </Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={handleChange("supportEmail")}
                placeholder="support@example.com"
                disabled={!isEditing}
                className={
                  validationErrors.supportEmail ? "border-destructive" : ""
                }
              />
              {validationErrors.supportEmail && (
                <p className="text-destructive text-xs">
                  {validationErrors.supportEmail}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                {t("branding.supportEmailHint") ||
                  "Email address for customer support inquiries"}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supportWhatsapp">
                <MessageCircle className="mr-1 inline h-4 w-4" />
                {t("branding.supportWhatsapp") || "Support WhatsApp"}
              </Label>
              <Input
                id="supportWhatsapp"
                value={settings.supportWhatsapp}
                onChange={handleChange("supportWhatsapp")}
                placeholder="+6281234567890"
                disabled={!isEditing}
                className={
                  validationErrors.supportWhatsapp ? "border-destructive" : ""
                }
              />
              {validationErrors.supportWhatsapp && (
                <p className="text-destructive text-xs">
                  {validationErrors.supportWhatsapp}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                {t("branding.supportWhatsappHint") ||
                  "WhatsApp number for customer support (include country code)"}
              </p>
            </div>
          </div>

          {/* Support Preview */}
          <div className="bg-muted/30 rounded-lg border p-4">
            <Label className="mb-3 block text-sm font-medium">
              {t("branding.supportPreview") || "Support Links Preview"}
            </Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${settings.supportEmail || "support@example.com"}`}
                className="bg-background hover:bg-muted flex items-center gap-2 rounded-md border px-4 py-2 transition-colors"
              >
                <Mail className="text-primary h-4 w-4" />
                <span className="text-sm">
                  {settings.supportEmail || "support@example.com"}
                </span>
              </a>
              <a
                href={`https://wa.me/${(settings.supportWhatsapp || "+6281295648580").replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-background hover:bg-muted flex items-center gap-2 rounded-md border px-4 py-2 transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  {settings.supportWhatsapp || "+6281295648580"}
                </span>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isResetting || isUpdating}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isResetting || isUpdating}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isResetting
              ? t("branding.resetting") || "Resetting..."
              : t("branding.resetToDefault") || "Reset to Default"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating || Object.keys(validationErrors).length > 0}
          >
            <Save className="mr-2 h-4 w-4" />
            {isUpdating
              ? t("branding.saving") || "Saving..."
              : t("branding.saveChanges") || "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  )
}
