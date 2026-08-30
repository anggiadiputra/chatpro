"use client"

import { AlertCircle, PlugZap, RefreshCw, Clock, Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import type { InsightsError } from "@/lib/api/insights-api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface NoWabaConnectedProps {
  className?: string
}

/**
 * No WABA Connected Error State
 * Displays when user has no WhatsApp Business Account connected
 * Requirements: 1.4, 4.4
 */
export function NoWabaConnectedError({ className }: NoWabaConnectedProps) {
  const t = useTranslations("insights.errors")

  return (
    <Alert variant="destructive" className={className}>
      <PlugZap className="h-4 w-4" />
      <AlertTitle>{t("noWabaConnected")}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>{t("noWabaDescription")}</span>
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link href="/waba">{t("connectWaba")}</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

interface ApiErrorStateProps {
  error?: InsightsError | null
  onRetry?: () => void
  className?: string
}

/**
 * API Error State
 * Displays when Meta API returns an error with retry option
 * Requirements: 1.4, 4.4
 */
export function ApiErrorState({
  error,
  onRetry,
  className,
}: ApiErrorStateProps) {
  const t = useTranslations("insights.errors")

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <AlertCircle className="text-destructive h-12 w-12 opacity-50" />
        <h3 className="mt-4 text-lg font-medium">{t("apiError")}</h3>
        <p className="text-muted-foreground mt-2 max-w-md text-center text-sm">
          {error?.message || t("apiErrorDescription")}
        </p>
        {error?.details?.metaErrorCode && (
          <p className="text-muted-foreground mt-1 text-xs">
            Error code: {error.details.metaErrorCode}
          </p>
        )}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t("retry")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface RateLimitedBannerProps {
  retryAfter?: number
  className?: string
}

/**
 * Rate Limited Warning Banner
 * Displays when Meta API rate limit is reached, showing cached data
 * Requirements: 7.4, 4.4
 */
export function RateLimitedBanner({
  retryAfter = 60,
  className,
}: RateLimitedBannerProps) {
  const t = useTranslations("insights.errors")

  return (
    <Alert variant="default" className={className}>
      <Clock className="h-4 w-4" />
      <AlertTitle>{t("rateLimited")}</AlertTitle>
      <AlertDescription>
        {t("rateLimitedDescription", { seconds: retryAfter })}
      </AlertDescription>
    </Alert>
  )
}

interface RegionRestrictedNoticeProps {
  className?: string
}

/**
 * Region Restriction Notice
 * Displays when template metrics are unavailable due to EU/Japan restrictions
 * Requirements: 3.3, 4.4
 */
export function RegionRestrictedNotice({
  className,
}: RegionRestrictedNoticeProps) {
  const t = useTranslations("insights.templatePerformance")

  return (
    <Alert className={className}>
      <Lock className="h-4 w-4" />
      <AlertDescription>{t("regionRestricted")}</AlertDescription>
    </Alert>
  )
}

interface UnauthorizedErrorProps {
  className?: string
}

/**
 * Unauthorized Error State
 * Displays when access token is invalid or expired
 * Requirements: 4.4
 */
export function UnauthorizedError({ className }: UnauthorizedErrorProps) {
  const t = useTranslations("insights.errors")

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{t("unauthorized")}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>{t("unauthorizedDescription")}</span>
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link href="/waba">{t("reconnectWaba")}</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
