"use client"

import { HTMLAttributes, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/routing"
import { authClient } from "@/lib/auth-client"
import { LockKeyhole, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/password-input"
import { useToast } from "@/hooks/use-toast"
import { GoogleSignInButton } from "@/components/auth/google-signin-button"
import { useTurnstileConfig } from "@/hooks/use-turnstile-config"
import { Turnstile, TurnstileSkeleton } from "@/components/auth/turnstile"

function useFormSchema() {
  const t = useTranslations("validation")
  return z.object({
    email: z
      .string()
      .min(1, { message: t("enterEmail") })
      .email({ message: t("invalidEmail") }),
    password: z
      .string()
      .min(1, { message: t("enterPassword") }),
  })
}

export function UserAuthForm({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string>("")
  const { enabled: turnstileEnabled, siteKey: turnstileSiteKey, isLoading: isTurnstileLoading } = useTurnstileConfig()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const tErrors = useTranslations("errors")
  const formSchema = useFormSchema()


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (turnstileEnabled && !turnstileToken) {
      toast({
        variant: "destructive",
        title: "Verifikasi Diperlukan",
        description: "Harap selesaikan verifikasi keamanan Cloudflare Turnstile terlebih dahulu.",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        toast({
          variant: "destructive",
          title: t("loginError"),
          description: result.error.message,
        })
        setIsLoading(false)
      } else {
        // Refresh to update session state, then redirect
        router.refresh()
        router.replace("/dashboard")
        // Keep isLoading true to prevent double-click during navigation
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: tErrors("generic"),
        description: error.message || tErrors("errorOccurred"),
      })
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("grid gap-5", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <GoogleSignInButton mode="login" />

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-slate-500">
                  {tCommon("continueWith")} email
                </span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-medium text-slate-700">{t("email")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder={tCommon("emailPlaceholder")}
                        className="h-10 border-slate-300 bg-white pl-10 text-slate-900 shadow-xs focus-visible:ring-blue-600"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium text-slate-700">{t("password")}</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput
                      placeholder={t("minChars", { min: 8 })}
                      autoComplete="current-password"
                      className="h-10"
                      inputClassName="h-10 border-slate-300 bg-white pr-10 text-slate-900 shadow-xs focus-visible:ring-blue-600"
                      startIcon={<LockKeyhole className="size-4" />}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isTurnstileLoading ? (
              <TurnstileSkeleton />
            ) : turnstileEnabled && turnstileSiteKey ? (
              <Turnstile
                siteKey={turnstileSiteKey}
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken("")}
                onError={() => setTurnstileToken("")}
              />
            ) : null}

            <Button
              className="mt-2 h-10 bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading || isTurnstileLoading || (turnstileEnabled && !turnstileToken)}
            >
              {isLoading ? t("processing") : t("login")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
