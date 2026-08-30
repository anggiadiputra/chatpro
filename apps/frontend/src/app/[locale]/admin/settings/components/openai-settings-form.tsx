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
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useAdminSettings } from "../../hooks/use-admin-settings"
import { SensitiveInput } from "./sensitive-input"

interface OpenAISettings {
  apiKey: string
  enabled: boolean
}

const defaultSettings: OpenAISettings = {
  apiKey: "",
  enabled: false,
}

export function OpenAISettingsForm() {
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
  } = useAdminSettings<OpenAISettings>("openai")

  const [formData, setFormData] = useState<OpenAISettings>(defaultSettings)
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
    (field: keyof OpenAISettings) =>
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
          <CardTitle>OpenAI Configuration</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>OpenAI Configuration</CardTitle>
          <CardDescription>
            Configure OpenAI API key for AI features
          </CardDescription>
        </div>
        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-1.5"
          >
            <SquarePen className="h-4 w-4" />
            Edit
          </Button>
        )}
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
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={handleEnabledChange}
              disabled={!isEditing}
            />
            <Label htmlFor="enabled">Enable AI Features</Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <SensitiveInput
              id="apiKey"
              value={formData.apiKey}
              onChange={handleChange("apiKey")}
              placeholder="sk-..."
              isMasked={formData.apiKey?.includes("****")}
              disabled={!isEditing || !formData.enabled}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || isUpdating || !formData.enabled}
          >
            <PlugZap className="mr-2 h-4 w-4" />
            {isTesting ? "Testing..." : "Test API Key"}
          </Button>
          {isEditing && (
            <>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isResetting || isUpdating}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {isResetting ? "Resetting..." : "Reset to Default"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isUpdating}
                onClick={() => {
                  setFormData(settings || defaultSettings)
                  setIsEditing(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
