'use client'

/**
 * Subscription Page
 * Displays current subscription status and available plans with duration selection
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2
 */

import { useState } from 'react'
import { CreditCard, Calendar, AlertCircle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/page-header'
import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useSubscription, type SubscriptionTier } from './hooks/use-subscription'
import { PricingCards } from './components/pricing-cards'
import { PaymentHistory } from './components/payment-history'
import { PaymentModal } from '@/components/payment/payment-modal'
import { RoleGuard } from '@/components/auth/role-guard'

// Status badge variants
const statusVariants: Record<string, 'active' | 'warning' | 'destructive' | 'outline'> = {
  ACTIVE: 'active',
  PENDING_PAYMENT: 'warning',
  EXPIRED: 'destructive',
  CANCELLED: 'outline',
}

// Format date to Indonesian locale
function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function SubscriptionPage() {
  const t = useTranslations('subscription')
  const tCommon = useTranslations('common')
  const { subscription, pricing, pricingWithDurations, loading, error, refetch } = useSubscription()
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null)
  const [selectedDurationMonths, setSelectedDurationMonths] = useState<number>(1)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  // Get status label from translations
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      ACTIVE: t('statusActive'),
      PENDING_PAYMENT: t('pendingPayment'),
      EXPIRED: t('statusExpired'),
      CANCELLED: t('statusCancelled'),
    }
    return statusMap[status] || status
  }

  const handleUpgrade = (tier: SubscriptionTier, durationMonths: number) => {
    setSelectedTier(tier)
    setSelectedDurationMonths(durationMonths)
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false)
    setSelectedTier(null)
    setSelectedDurationMonths(1)
    refetch()
  }

  const handlePaymentClose = () => {
    setIsPaymentModalOpen(false)
    setSelectedTier(null)
    setSelectedDurationMonths(1)
  }

  // Get price for selected tier and duration
  const getSelectedTierPrice = (): number => {
    if (!selectedTier) return 0
    
    // Try to get price from pricingWithDurations first
    if (pricingWithDurations) {
      const tierData = selectedTier === 'LITE' ? pricingWithDurations.lite : pricingWithDurations.pro
      const durationData = tierData?.durations.find(d => d.months === selectedDurationMonths)
      if (durationData) {
        return durationData.totalPrice
      }
    }
    
    // Fallback to legacy pricing
    if (pricing) {
      return selectedTier === 'LITE' ? pricing.lite.price : pricing.pro.price
    }
    
    return 0
  }

  return (
    <RoleGuard>
      <Header />
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Page Header */}
        <PageHeader
          title={t('title')}
          description={t('subtitle')}
        />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tCommon('error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('subscriptionStatus')}
            </CardTitle>
            <CardDescription>
              {t('currentPlanInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                ))}
              </div>
            ) : subscription ? (
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('plan')}</p>
                  <p className="text-lg font-semibold">{subscription.tier}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('status')}</p>
                  <Badge variant={statusVariants[subscription.status] || 'default'}>
                    {getStatusLabel(subscription.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('validUntil')}
                  </p>
                  <p className="text-lg font-semibold">
                    {subscription.tier === 'FREE'
                      ? tCommon('forever')
                      : formatDate(subscription.endDate)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {tCommon('noData')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Expiry Warning */}
        {subscription?.status === 'EXPIRED' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('expiredWarning')}</AlertTitle>
            <AlertDescription>
              {t('expiredWarningDesc')}
            </AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div>
          <h2 className="text-xl font-semibold mb-4">{t('choosePlan')}</h2>
          <PricingCards
            currentTier={subscription?.tier || 'FREE'}
            pricing={pricing}
            pricingWithDurations={pricingWithDurations}
            loading={loading}
            onUpgrade={handleUpgrade}
          />
        </div>

        {/* Payment History */}
        <PaymentHistory />

        {/* Payment Modal */}
        {selectedTier && selectedTier !== 'FREE' && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={handlePaymentClose}
            targetTier={selectedTier}
            durationMonths={selectedDurationMonths}
            onSuccess={handlePaymentSuccess}
            tierPrice={getSelectedTierPrice()}
          />
        )}
      </div>
    </RoleGuard>
  )
}
