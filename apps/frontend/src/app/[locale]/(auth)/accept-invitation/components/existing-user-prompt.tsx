"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PasswordInput } from "@/components/password-input"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

interface InvitationData {
  id: string
  email: string
  businessOwnerName: string
  expiresAt: string
}

interface ExistingUserPromptProps {
  invitation: InvitationData
  token: string
}

function useFormSchema() {
  const t = useTranslations("validation")
  return z.object({
    password: z.string().min(1, { message: t("enterPassword") }),
  })
}

export function ExistingUserPrompt({
  invitation,
  token,
}: ExistingUserPromptProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations("team.acceptInvitation")
  const tAuth = useTranslations("auth")
  const formSchema = useFormSchema()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true)
    setError(null)

    try {
      // First, authenticate the user
      const loginResult = await authClient.signIn.email({
        email: invitation.email,
        password: data.password,
      })

      if (loginResult.error) {
        setError(tAuth("loginError"))
        setLoading(false)
        return
      }

      // Then accept the invitation to link the account
      const response = await fetch(
        `${API_URL}/api/v1/team/invitations/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        }
      )

      const result = await response.json()

      if (!result.success) {
        if (result.error?.code === "ALREADY_AGENT_OF_ANOTHER") {
          setError(t("alreadyAgent"))
          return
        }
        setError(result.error?.message || t("error"))
        return
      }

      // Redirect to messages page (agent dashboard)
      window.location.href = "/messages"
    } catch (err) {
      setError(t("error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6" data-auth-content>
      <Card className="border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
            <UserCheck className="text-primary h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("existingAccount")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("subtitle")}{" "}
              <span className="text-foreground font-semibold">
                {invitation.businessOwnerName}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-muted/50 mb-6 rounded-lg p-4">
          <p className="text-muted-foreground text-sm">
            {t("existingAccountDesc")}
          </p>
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">Email: </span>
            <span className="font-medium">{invitation.email}</span>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold">
                      {tAuth("password")}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={tAuth("minChars", { min: 8 })}
                        className="h-11"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-center text-sm">
                  {error}
                </div>
              )}

              <Button className="mt-2 h-11 font-semibold" disabled={loading}>
                {loading ? tAuth("processing") : t("loginToLink")}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  )
}
