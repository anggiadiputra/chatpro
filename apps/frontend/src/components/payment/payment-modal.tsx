'use client'

/**
 * Payment Modal Component
 * Displays QRIS payment flow with QR code and status updates
 * Requirements: 3.1-3.4, 4.1-4.8, 9.3-9.5
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { invalidateSubscriptionCache } from '@/hooks/use-subscription-query'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'

// Types
export type SubscriptionTier = 'LITE' | 'PRO'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED'

type ModalStep = 'loading' | 'qr-display' | 'success' | 'error' | 'expired'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  targetTier: SubscriptionTier
  durationMonths: number
  onSuccess: () => void
  tierPrice?: number
}

interface PaymentData {
  orderId: string
  qrString: string
  qrUrl?: string
  amount: number
  expiresAt: string
  subscriptionEndDate?: string
}

// Format price to IDR
function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// Format date to locale string
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Calculate remaining time
function getRemainingTime(expiresAt: string): { minutes: number; seconds: number; expired: boolean } {
  const now = new Date().getTime()
  const expiry = new Date(expiresAt).getTime()
  const diff = expiry - now

  if (diff <= 0) {
    return { minutes: 0, seconds: 0, expired: true }
  }

  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { minutes, seconds, expired: false }
}

export function PaymentModal({
  isOpen,
  onClose,
  targetTier,
  durationMonths,
  onSuccess,
  tierPrice = 0,
}: PaymentModalProps) {
  const t = useTranslations('payment')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  
  const [step, setStep] = useState<ModalStep>('loading')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState({ minutes: 15, seconds: 0 })
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const hasCreatedPayment = useRef(false)

  // Create payment transaction
  const createPayment = useCallback(async () => {
    setStep('loading')
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/v1/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetTier, durationMonths }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || t('failedToCreatePayment'))
      }

      // Calculate subscription end date based on duration
      const subscriptionEndDate = new Date()
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + (durationMonths === 12 ? 365 : durationMonths * 30))
      
      setPaymentData({
        orderId: result.data.orderId,
        qrString: result.data.qrString,
        qrUrl: result.data.qrUrl,
        amount: result.data.amount,
        expiresAt: result.data.expiresAt,
        subscriptionEndDate: subscriptionEndDate.toISOString(),
      })
      setStep('qr-display')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToCreatePayment'))
      setStep('error')
    }
  }, [targetTier, durationMonths, t])

  // Reset state and create payment when modal opens
  useEffect(() => {
    if (isOpen && !hasCreatedPayment.current) {
      hasCreatedPayment.current = true
      setStep('loading')
      setPaymentData(null)
      setError(null)
      createPayment()
    } else if (!isOpen) {
      hasCreatedPayment.current = false
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [isOpen, createPayment])

  // Poll payment status
  const pollStatus = useCallback(async () => {
    if (!paymentData?.orderId) return

    try {
      const response = await fetch(
        `${API_URL}/api/v1/payment/status/${paymentData.orderId}`,
        { credentials: 'include' }
      )

      const result = await response.json()

      if (result.success && result.data) {
        const status = result.data.status as PaymentStatus

        if (status === 'COMPLETED') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          if (countdownRef.current) clearInterval(countdownRef.current)
          setStep('success')
        } else if (status === 'FAILED') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          if (countdownRef.current) clearInterval(countdownRef.current)
          setError(t('paymentFailed'))
          setStep('error')
        } else if (status === 'EXPIRED') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          if (countdownRef.current) clearInterval(countdownRef.current)
          setStep('expired')
        } else if (status === 'CANCELLED') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          if (countdownRef.current) clearInterval(countdownRef.current)
          handleClose()
        }
      }
    } catch (err) {
      console.error('Failed to poll status:', err)
    }
  }, [paymentData?.orderId, t])

  // Start polling when QR is displayed
  useEffect(() => {
    if (step === 'qr-display' && paymentData) {
      // Poll every 6 seconds (10 requests/minute) to stay within rate limits
      pollingRef.current = setInterval(pollStatus, 6000)

      countdownRef.current = setInterval(() => {
        const remaining = getRemainingTime(paymentData.expiresAt)
        setCountdown({ minutes: remaining.minutes, seconds: remaining.seconds })

        if (remaining.expired) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          if (countdownRef.current) clearInterval(countdownRef.current)
          setStep('expired')
        }
      }, 1000)

      const initial = getRemainingTime(paymentData.expiresAt)
      setCountdown({ minutes: initial.minutes, seconds: initial.seconds })
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [step, paymentData, pollStatus])

  // Cancel transaction
  const cancelTransaction = useCallback(async () => {
    if (!paymentData?.orderId) {
      handleClose()
      return
    }

    try {
      await fetch(`${API_URL}/api/v1/payment/cancel/${paymentData.orderId}`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Failed to cancel:', err)
    }

    handleClose()
  }, [paymentData?.orderId])

  // Handle close
  const handleClose = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    onClose()
  }, [onClose])

  // Handle success completion
  const handleSuccessClose = useCallback(() => {
    // Invalidate subscription cache to fetch fresh data after payment
    invalidateSubscriptionCache(queryClient)
    onSuccess()
    handleClose()
  }, [queryClient, onSuccess, handleClose])

  // Handle retry
  const handleRetry = () => {
    hasCreatedPayment.current = false
    setPaymentData(null)
    setError(null)
    createPayment()
  }

  // Get duration label using translations
  const getDurationLabel = (months: number): string => {
    switch (months) {
      case 1:
        return t('duration1Month')
      case 3:
        return t('duration3Months')
      case 6:
        return t('duration6Months')
      case 12:
        return t('duration12Months')
      default:
        return `${months} ${t('duration1Month').split(' ')[1]}`
    }
  }

  // Render loading step
  const renderLoading = () => (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('processingPayment')} - {getDurationLabel(durationMonths)}
        </DialogTitle>
        <DialogDescription>
          {t('upgradeTo', { tier: targetTier })} - {formatPrice(tierPrice)}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center py-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('creatingQrCode')}</p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          {tCommon('cancel')}
        </Button>
      </DialogFooter>
    </>
  )

  // Render QR code display step
  const renderQRDisplay = () => (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('scanQrCode')} - {getDurationLabel(durationMonths)}
        </DialogTitle>
        <DialogDescription>
          {t('scanDescription')}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center py-4 space-y-4">
        <div className="p-4 bg-white rounded-lg">
          {paymentData?.qrString ? (
            <QRCodeSVG
              value={paymentData.qrString}
              size={200}
              level="M"
              marginSize={2}
            />
          ) : (
            <div className="h-[200px] w-[200px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-2xl font-bold">{formatPrice(paymentData?.amount || tierPrice)}</p>
          <p className="text-sm text-muted-foreground">
            {t('orderId')}: {paymentData?.orderId}
          </p>
        </div>

        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            {t('validFor')} {countdown.minutes}:{countdown.seconds.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="w-full rounded-lg bg-muted p-4 text-sm space-y-2">
          <p className="font-medium">{t('paymentInstructions')}</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>{t('instruction1')}</li>
            <li>{t('instruction2')}</li>
            <li>{t('instruction3')}</li>
            <li>{t('instruction4')}</li>
          </ol>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={cancelTransaction}>
          {t('cancelPayment')}
        </Button>
      </DialogFooter>
    </>
  )

  // Render success state
  const renderSuccess = () => (
    <>
      <DialogHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <DialogTitle>{t('paymentSuccess')}</DialogTitle>
        <DialogDescription>
          {t('paymentSuccessDesc', { tier: targetTier })}
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {t('premiumActivated')}
        </p>
        {paymentData?.subscriptionEndDate && (
          <p className="text-sm font-medium">
            {t('subscriptionValidUntil', { date: formatDate(paymentData.subscriptionEndDate) })}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button onClick={handleSuccessClose} className="w-full">
          {tCommon('done')}
        </Button>
      </DialogFooter>
    </>
  )

  // Render error state
  const renderError = () => (
    <>
      <DialogHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <DialogTitle>{t('paymentFailedTitle')}</DialogTitle>
        <DialogDescription>
          {error || t('paymentFailedDesc')}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={handleClose}>
          {tCommon('close')}
        </Button>
        <Button onClick={handleRetry}>
          {t('tryAgain')}
        </Button>
      </DialogFooter>
    </>
  )

  // Render expired state
  const renderExpired = () => (
    <>
      <DialogHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
          <AlertCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>
        <DialogTitle>{t('paymentExpired')}</DialogTitle>
        <DialogDescription>
          {t('paymentExpiredDesc')}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={handleClose}>
          {tCommon('close')}
        </Button>
        <Button onClick={handleRetry}>
          {t('createNewTransaction')}
        </Button>
      </DialogFooter>
    </>
  )

  // Render content based on step
  const renderContent = () => {
    switch (step) {
      case 'loading':
        return renderLoading()
      case 'qr-display':
        return renderQRDisplay()
      case 'success':
        return renderSuccess()
      case 'error':
        return renderError()
      case 'expired':
        return renderExpired()
      default:
        return renderLoading()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
