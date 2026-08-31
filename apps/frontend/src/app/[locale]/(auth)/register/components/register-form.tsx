"use client"

import { HTMLAttributes, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, LockKeyhole, Mail, RefreshCw, UserRound } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useRegister } from "@/hooks/use-register"
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
import { OTPInput } from "@/components/ui/otp-input"
import { GoogleSignInButton } from "@/components/auth/google-signin-button"
import { PasswordInput } from "@/components/password-input"
import { useTurnstileConfig } from "@/hooks/use-turnstile-config"
import { Turnstile, TurnstileSkeleton } from "@/components/auth/turnstile"

function useFormSchema() {
  const t = useTranslations("validation")
  return z
    .object({
      email: z
        .string()
        .min(1, { message: t("enterEmail") })
        .email({ message: t("invalidEmail") }),
      password: z
        .string()
        .min(1, { message: t("enterPassword") })
        .min(8, { message: t("minLength", { min: 8 }) }),
      confirmPassword: z.string(),
      name: z.string().min(1, { message: t("enterName") }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    })
}

export function RegisterForm({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const [otp, setOtp] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string>("")
  const { enabled: turnstileEnabled, siteKey: turnstileSiteKey, isLoading: isTurnstileLoading } = useTurnstileConfig()
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const formSchema = useFormSchema()

  const {
    step,
    loading,
    error,
    email,
    timeRemaining,
    resendCooldown,
    resendsRemaining,
    attemptsRemaining,
    initiateRegistration,
    verifyOTP,
    resendOTP,
    goBackToForm,
    clearError,
  } = useRegister()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (turnstileEnabled && !turnstileToken) {
      return
    }

    await initiateRegistration({
      email: data.email,
      password: data.password,
      name: data.name,
      turnstileToken,
    })
  }

  async function handleVerifyOTP() {
    if (otp.length !== 6) return
    await verifyOTP(otp)
  }

  async function handleResendOTP() {
    setOtp("")
    clearError()
    await resendOTP()
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Step 2: OTP Verification
  if (step === "otp") {
    return (
      <div className={cn("grid gap-4 sm:gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16">
            <Mail className="text-primary h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold sm:text-xl">
              {t("verifyEmail")}
            </h2>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              {t("enterOtpCode")}
            </p>
            <p className="text-primary text-sm font-medium break-all sm:text-base">
              {email}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <OTPInput
            value={otp}
            onChange={(value) => {
              setOtp(value)
              clearError()
            }}
            disabled={loading}
            autoFocus
          />

          {/* Countdown timer */}
          {timeRemaining > 0 && (
            <p className="text-muted-foreground text-center text-sm">
              {t("codeValidFor")}{" "}
              <span className="text-foreground font-medium">
                {formatTime(timeRemaining)}
              </span>
            </p>
          )}

          {timeRemaining === 0 && (
            <p className="text-destructive text-center text-sm">
              {t("codeExpired")}
            </p>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-center text-sm">
              {error}
              {attemptsRemaining < 5 && attemptsRemaining > 0 && (
                <span className="mt-1 block text-xs">
                  {t("remainingAttempts", { count: attemptsRemaining })}
                </span>
              )}
            </div>
          )}

          <Button
            className="h-11 w-full font-semibold"
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
          >
            {loading ? t("verifying") : t("verify")}
          </Button>

          {/* Resend OTP */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground text-sm">
              {t("didntReceiveCode")}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResendOTP}
              disabled={loading || resendCooldown > 0 || resendsRemaining === 0}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {resendCooldown > 0
                ? t("resendIn", { seconds: resendCooldown })
                : resendsRemaining === 0
                  ? t("resendLimitReached")
                  : t("resendCode")}
            </Button>
            {resendsRemaining > 0 && resendsRemaining < 5 && (
              <p className="text-muted-foreground text-xs">
                {t("remainingResends", { count: resendsRemaining })}
              </p>
            )}
          </div>

          {/* Back button */}
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-2"
            onClick={goBackToForm}
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToForm")}
          </Button>
        </div>
      </div>
    )
  }

  // Step 1: Registration Form
  return (
    <div className={cn("grid gap-5", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <GoogleSignInButton mode="register" />

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
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-medium text-slate-700">
                    {t("fullName")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        autoComplete="name"
                        placeholder={t("fullName")}
                        className="h-10 border-slate-300 bg-white pl-10 text-slate-900 shadow-xs focus-visible:ring-blue-600"
                        disabled={loading}
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
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-medium text-slate-700">
                    {t("email")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder={tCommon("emailPlaceholder")}
                        className="h-10 border-slate-300 bg-white pl-10 text-slate-900 shadow-xs focus-visible:ring-blue-600"
                        disabled={loading}
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
                  <FormLabel className="text-sm font-medium text-slate-700">
                    {t("password")}
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder={t("minChars", { min: 8 })}
                      autoComplete="new-password"
                      className="h-10"
                      inputClassName="h-10 border-slate-300 bg-white pr-10 text-slate-900 shadow-xs focus-visible:ring-blue-600"
                      startIcon={<LockKeyhole className="size-4" />}
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-medium text-slate-700">
                    {t("confirmPassword")}
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder={t("confirmPassword")}
                      autoComplete="new-password"
                      className="h-10"
                      inputClassName="h-10 border-slate-300 bg-white pr-10 text-slate-900 shadow-xs focus-visible:ring-blue-600"
                      startIcon={<LockKeyhole className="size-4" />}
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error message */}
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-center text-sm">
                {error}
              </div>
            )}

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
              disabled={loading || isTurnstileLoading || (turnstileEnabled && !turnstileToken)}
            >
              {loading ? t("sendingOtp") : t("register")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
