"use client"

import { useEffect, useRef, useState, useId } from "react"
import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          "error-callback"?: (error?: any) => void
          "expired-callback"?: () => void
          theme?: "auto" | "light" | "dark"
          size?: "normal" | "compact" | "flexible"
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
    onloadTurnstileCallback?: () => void
  }
}

interface TurnstileProps {
  siteKey: string
  onVerify: (token: string) => void
  onError?: (error?: any) => void
  onExpire?: () => void
  theme?: "auto" | "light" | "dark"
  size?: "normal" | "compact" | "flexible"
  className?: string
}

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script"
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

/**
 * Skeleton Placeholder for Turnstile widget (prevents Layout Shift)
 */
export function TurnstileSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-[65px] w-full max-w-[300px] items-center justify-between rounded-lg border border-slate-200 bg-slate-100/90 px-3.5 py-2 shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900/60 animate-pulse my-2 mx-auto",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-5 w-5 rounded-md border border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-28 rounded bg-slate-300 dark:bg-slate-700" />
          <div className="h-2 w-16 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 opacity-60">
        <ShieldCheck className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        <div className="flex flex-col items-end gap-1">
          <div className="h-2 w-12 rounded bg-slate-300 dark:bg-slate-700" />
          <div className="h-1.5 w-8 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
}

export function Turnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = "auto",
  size = "normal",
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isWidgetRendered, setIsWidgetRendered] = useState(false)
  const id = useId()
  const containerId = `turnstile-${id.replace(/:/g, "")}`

  // Keep latest callbacks in refs to avoid re-triggering render effect
  const onVerifyRef = useRef(onVerify)
  const onErrorRef = useRef(onError)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onVerifyRef.current = onVerify
    onErrorRef.current = onError
    onExpireRef.current = onExpire
  })

  // Load Cloudflare Turnstile script once
  useEffect(() => {
    if (typeof window === "undefined") return

    if (window.turnstile) {
      setIsScriptLoaded(true)
      return
    }

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID)
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.turnstile) {
          setIsScriptLoaded(true)
          clearInterval(checkLoaded)
        }
      }, 50)
      return () => clearInterval(checkLoaded)
    }

    const script = document.createElement("script")
    script.id = TURNSTILE_SCRIPT_ID
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsScriptLoaded(true)
    }
    script.onerror = (e) => {
      console.error("Failed to load Cloudflare Turnstile script:", e)
      onErrorRef.current?.(e)
    }

    document.head.appendChild(script)
  }, [])

  // Render Turnstile widget when script and container are ready
  useEffect(() => {
    if (!isScriptLoaded || !window.turnstile || !containerRef.current || !siteKey) return

    // Clean up previous widget if exists
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current)
      } catch {}
      widgetIdRef.current = null
      setIsWidgetRendered(false)
    }

    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token: string) => {
          onVerifyRef.current?.(token)
        },
        "error-callback": (err: any) => {
          onErrorRef.current?.(err)
        },
        "expired-callback": () => {
          onExpireRef.current?.()
        },
      })
      widgetIdRef.current = widgetId
      setIsWidgetRendered(true)
    } catch (err) {
      console.error("Error rendering Turnstile widget:", err)
      onErrorRef.current?.(err)
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {}
        widgetIdRef.current = null
        setIsWidgetRendered(false)
      }
    }
  }, [isScriptLoaded, siteKey, theme, size])

  if (!siteKey) return null

  return (
    <div className={cn("relative my-2 flex flex-col items-center justify-center", className)}>
      {/* Skeleton placeholder shown while script is loading or widget is rendering */}
      {!isWidgetRendered && (
        <TurnstileSkeleton />
      )}

      {/* Actual Turnstile container */}
      <div
        id={containerId}
        ref={containerRef}
        className={cn(
          "flex min-h-[65px] items-center justify-center transition-opacity duration-300",
          !isWidgetRendered ? "absolute -z-10 opacity-0 pointer-events-none" : "opacity-100"
        )}
      />
    </div>
  )
}
