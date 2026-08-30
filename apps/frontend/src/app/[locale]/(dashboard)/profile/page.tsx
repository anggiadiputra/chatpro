"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Lock, Save, Loader2, SquarePen, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { settingsApi } from "@/lib/api/settings-api"
import { useBusinessAccount } from "@/hooks/use-business-account"
import { useTranslations } from "next-intl"

export default function ProfilePage() {
  const { userEmail, userName, userId, userRole } = useBusinessAccount()
  const [saving, setSaving] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const { toast } = useToast()
  const t = useTranslations("settings")

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (userEmail && userName) {
      setProfileForm({
        name: userName,
        email: userEmail,
      })
    }
  }, [userEmail, userName])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profileForm.name.trim()) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("nameRequired"),
      })
      return
    }

    try {
      setSaving(true)
      const result = await settingsApi.updateProfile({
        name: profileForm.name,
        email: profileForm.email !== userEmail ? profileForm.email : undefined,
      })

      toast({
        title: t("success"),
        description: result.message || t("profileUpdated"),
      })
      setIsEditingProfile(false)

      if (profileForm.email !== userEmail) {
        setTimeout(() => {
          toast({
            title: t("verificationRequired"),
            description: t("checkEmailVerification"),
          })
        }, 1000)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || t("profileUpdateFailed"),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordForm.currentPassword) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("currentPasswordRequired"),
      })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("passwordMinLength"),
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("passwordsDoNotMatch"),
      })
      return
    }

    try {
      setSaving(true)
      await settingsApi.changePassword(passwordForm)

      toast({
        title: t("success"),
        description: t("passwordChanged"),
      })
      setIsEditingPassword(false)

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || t("passwordChangeFailed"),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("profile")}</h1>
        <p className="text-muted-foreground">{t("profileDescription")}</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                {t("profileSettings")}
              </CardTitle>
              <CardDescription>{t("updateProfileInfo")}</CardDescription>
            </div>
            {!isEditingProfile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
                className="gap-1.5"
              >
                <SquarePen className="h-4 w-4" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  placeholder={t("yourName")}
                  disabled={!isEditingProfile}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  disabled={!isEditingProfile}
                  required
                />
                {isEditingProfile && profileForm.email !== userEmail && (
                  <p className="text-sm text-amber-600">
                    {t("emailChangeVerification")}
                  </p>
                )}
              </div>

              {userRole === "AGENT" && (
                <div className="space-y-2">
                  <Label>{t("role")}</Label>
                  <p className="text-sm text-muted-foreground">{t("agentRole")}</p>
                </div>
              )}

              {isEditingProfile && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("saving")}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t("saveChanges")}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      setProfileForm({
                        name: userName || "",
                        email: userEmail || "",
                      })
                      setIsEditingProfile(false)
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                {t("changePassword")}
              </CardTitle>
              <CardDescription>{t("changePasswordDescription")}</CardDescription>
            </div>
            {!isEditingPassword && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditingPassword(true)}
                className="gap-1.5"
              >
                <SquarePen className="h-4 w-4" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder={t("enterCurrentPassword")}
                  disabled={!isEditingPassword}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder={t("enterNewPassword")}
                  disabled={!isEditingPassword}
                  required
                  minLength={8}
                />
                <p className="text-sm text-muted-foreground">
                  {t("passwordRequirements")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("confirmNewPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder={t("confirmNewPasswordPlaceholder")}
                  disabled={!isEditingPassword}
                  required
                />
                {isEditingPassword &&
                  passwordForm.confirmPassword &&
                  passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {t("passwordsDoNotMatch")}
                    </p>
                  )}
              </div>

              {isEditingPassword && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("changingPassword")}
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        {t("changePassword")}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      setPasswordForm({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      })
                      setIsEditingPassword(false)
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
