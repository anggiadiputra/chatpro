"use client"

import { useState, useEffect } from "react"
import {
  RefreshCw,
  PlugZap,
  Save,
  AlertCircle,
  CircleCheck,
  Info,
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
import { useAdminSettings } from "../../hooks/use-admin-settings"
import { SensitiveInput } from "./sensitive-input"

interface InstagramSettings {
  appId: string
  appSecret: string
  redirectUri: string
  webhookVerifyToken: string
}

const defaultSettings: InstagramSettings = {
  appId: "",
  appSecret: "",
  redirectUri: "",
  webhookVerifyToken: "",
}

export function InstagramSettingsForm() {
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
  } = useAdminSettings<InstagramSettings>("instagram")

  const [formData, setFormData] = useState<InstagramSettings>(defaultSettings)
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
    (field: keyof InstagramSettings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      setSaveResult(null)
    }

  const handleSave = async () => {
    setSaveResult(null)
    setTestResult(null)
    const result = await updateSettings(formData)
    setSaveResult(result)
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
    if (result.success) {
      setSaveResult({
        success: true,
        message: "Settings reset to .env defaults",
      })
    } else {
      setSaveResult(result)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Instagram Configuration</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
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
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instagram Configuration</CardTitle>
        <CardDescription>
          Configure Instagram API credentials and webhook settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {source && (
          <Alert variant={source === "database" ? "default" : "destructive"}>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {source === "database"
                ? "Settings loaded from database"
                : "Settings loaded from .env (database unavailable or empty)"}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CircleCheck className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
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
            <Label htmlFor="appId">App ID</Label>
            <Input
              id="appId"
              value={formData.appId}
              onChange={handleChange("appId")}
              placeholder="Enter Instagram App ID"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="appSecret">App Secret</Label>
            <SensitiveInput
              id="appSecret"
              value={formData.appSecret}
              onChange={handleChange("appSecret")}
              placeholder="Enter Instagram App Secret"
              isMasked={formData.appSecret?.includes("****")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="redirectUri">Redirect URI</Label>
            <Input
              id="redirectUri"
              value={formData.redirectUri}
              onChange={handleChange("redirectUri")}
              placeholder="https://example.com/instagram/callback"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="webhookVerifyToken">Webhook Verify Token</Label>
            <SensitiveInput
              id="webhookVerifyToken"
              value={formData.webhookVerifyToken}
              onChange={handleChange("webhookVerifyToken")}
              placeholder="Enter Webhook Verify Token"
              isMasked={formData.webhookVerifyToken?.includes("****")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || isUpdating}
          >
            <PlugZap className="mr-2 h-4 w-4" />
            {isTesting ? "Testing..." : "Test Connection"}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isResetting || isUpdating}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isResetting ? "Resetting..." : "Reset to Default"}
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            <Save className="mr-2 h-4 w-4" />
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
