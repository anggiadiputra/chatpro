"use client"

import { useState, useEffect } from "react"
import {
  RefreshCw,
  PlugZap,
  Save,
  AlertCircle,
  CircleCheck,
  Info,
  SquarePen,
  ExternalLink,
  ShieldCheck,
} from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { useAdminSettings } from "../../hooks/use-admin-settings"
import { SensitiveInput } from "./sensitive-input"

interface TurnstileSettings {
  siteKey: string
  secretKey: string
  enabled: boolean
}

const defaultSettings: TurnstileSettings = {
  siteKey: "",
  secretKey: "",
  enabled: false,
}

export function TurnstileSettingsForm() {
  const {
    settings,
    source,
    isLoading,
    error,
    updateSettings,
    testConnection,
    resetToDefault,
    isUpdating,
    isTesting,
    isResetting,
  } = useAdminSettings<TurnstileSettings>("turnstile")

  const [formData, setFormData] = useState<TurnstileSettings>(defaultSettings)
  const [isEditing, setIsEditing] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [saveResult, setSaveResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleChange =
    (field: keyof TurnstileSettings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      setSaveResult(null)
    }

  const handleEnabledChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, enabled: checked }))
    setSaveResult(null)
  }

  const handleSave = async () => {
    setSaveResult(null)
    setTestResult(null)
    const result = await updateSettings(formData)
    setSaveResult(result)
    if (result.success) {
      setIsEditing(false)
    }
  }

  const handleTest = async () => {
    setTestResult(null)
    const result = await testConnection()
    setTestResult(result)
  }

  const handleReset = async () => {
    setSaveResult(null)
    setTestResult(null)
    const result = await resetToDefault()
    setSaveResult(result)
    if (result.success && settings) {
      setFormData(settings)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    if (settings) {
      setFormData(settings)
    } else {
      setFormData(defaultSettings)
    }
    setIsEditing(false)
    setSaveResult(null)
    setTestResult(null)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Cloudflare Turnstile</CardTitle>
              <CardDescription>
                Konfigurasi verifikasi CAPTCHA pintar Cloudflare Turnstile untuk halaman Login dan Register
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {source && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                Source: {source}
              </span>
            )}
            {!isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <SquarePen className="h-4 w-4" />
                <span>Edit Pengaturan</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saveResult && (
          <Alert variant={saveResult.success ? "default" : "destructive"}>
            {saveResult.success ? (
              <CircleCheck className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{saveResult.message}</AlertDescription>
          </Alert>
        )}

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CircleCheck className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Dapatkan <strong>Site Key</strong> dan <strong>Secret Key</strong> gratis melalui{" "}
            <a
              href="https://dash.cloudflare.com/?to=/:account/turnstile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2 hover:opacity-80"
            >
              Cloudflare Turnstile Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
            . Pastikan domain aplikasi Anda sudah didaftarkan pada widget Cloudflare.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="turnstile-enabled" className="text-base font-medium">
                Aktifkan Turnstile
              </Label>
              <p className="text-sm text-muted-foreground font-normal">
                Tampilkan widget verifikasi bot Cloudflare Turnstile pada halaman Login dan Register
              </p>
            </div>
            <Switch
              id="turnstile-enabled"
              checked={formData.enabled}
              onCheckedChange={handleEnabledChange}
              disabled={!isEditing || isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteKey">Site Key (Kunci Publik)</Label>
            <Input
              id="siteKey"
              value={formData.siteKey}
              onChange={handleChange("siteKey")}
              placeholder="0x4AAAAAA..."
              disabled={!isEditing || isUpdating}
            />
            <p className="text-xs text-muted-foreground font-normal">
              Kunci publik yang digunakan browser untuk memuat widget Turnstile.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretKey">Secret Key (Kunci Rahasia)</Label>
            <SensitiveInput
              id="secretKey"
              value={formData.secretKey}
              onChange={handleChange("secretKey")}
              placeholder="0x4AAAAAA..."
              disabled={!isEditing || isUpdating}
            />
            <p className="text-xs text-muted-foreground font-normal">
              Kunci rahasia server untuk memverifikasi token respon dengan Cloudflare API (dienkripsi aman).
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || isUpdating || !formData.secretKey}
              className="gap-2"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="h-4 w-4" />
              )}
              <span>{isTesting ? "Memverifikasi..." : "Test Koneksi"}</span>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isUpdating || isResetting}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleReset}
                disabled={isResetting || isUpdating}
                className="gap-2"
              >
                {isResetting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Reset Default</span>
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isUpdating}
                className="gap-2"
              >
                {isUpdating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Simpan Perubahan</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
