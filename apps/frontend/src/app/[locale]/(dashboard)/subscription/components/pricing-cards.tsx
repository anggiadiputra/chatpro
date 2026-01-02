'use client'

/**
 * PricingCards Component
 * Displays subscription tier cards with pricing, features, and duration selection
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Crown, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DurationSelector, type DurationOption } from './duration-selector'
import type { SubscriptionTier, PricingData, PricingDataWithDurations } from '../hooks/use-subscription'

interface PricingCardsProps {
  currentTier: SubscriptionTier
  pricing: PricingData | null
  pricingWithDurations?: PricingDataWithDurations | null
  loading: boolean
  onUpgrade: (tier: SubscriptionTier, durationMonths: number) => void
}

// Default features for FREE tier
const FREE_FEATURES = [
  'WhatsApp Business API',
  'Instagram DM Integration',
  'Unlimited pesan',
  'Analytics Dashboard',
]

// Filter out API Keys and Webhook features from display
function filterFeatures(features: string[] | undefined): string[] | undefined {
  if (!features) return undefined
  return features.filter(
    (f) => !f.toLowerCase().includes('api key') && !f.toLowerCase().includes('webhook')
  )
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

export function PricingCards({
  currentTier,
  pricing,
  pricingWithDurations,
  loading,
  onUpgrade,
}: PricingCardsProps) {
  const t = useTranslations('subscription')
  
  // State for selected duration per tier
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>({
    LITE: 1,
    PRO: 1,
  })

  const handleDurationSelect = (tier: string, months: number) => {
    setSelectedDurations(prev => ({ ...prev, [tier]: months }))
  }

  // Get duration options for a tier
  const getDurations = (tier: 'LITE' | 'PRO'): DurationOption[] => {
    if (!pricingWithDurations) return []
    const tierData = tier === 'LITE' ? pricingWithDurations.lite : pricingWithDurations.pro
    return tierData?.durations || []
  }

  // Get selected duration data for a tier
  const getSelectedDuration = (tier: 'LITE' | 'PRO'): DurationOption | null => {
    const durations = getDurations(tier)
    const selectedMonths = selectedDurations[tier] || 1
    return durations.find(d => d.months === selectedMonths) || durations[0] || null
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="grid gap-5 md:grid-cols-3 max-w-5xl w-full">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="relative">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-7 w-28 mt-2" />
              </CardHeader>
              <CardContent className="space-y-2 py-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </CardContent>
              <CardFooter className="pt-3">
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Get base prices from pricing data
  const liteBasePrice = pricingWithDurations?.lite.basePrice || pricing?.lite.price || 99000
  const proBasePrice = pricingWithDurations?.pro.basePrice || pricing?.pro.price || 299000

  const tiers = [
    {
      name: 'FREE',
      tier: 'FREE' as SubscriptionTier,
      basePrice: 0,
      description: t('freeDescription'),
      features: FREE_FEATURES,
      icon: Zap,
      popular: false,
      hasDurations: false,
    },
    {
      name: 'LITE',
      tier: 'LITE' as SubscriptionTier,
      basePrice: liteBasePrice,
      description: t('liteDescription'),
      features: filterFeatures(pricingWithDurations?.lite.features || pricing?.lite.features) || [
        'Semua fitur FREE',
        'Unlimited pesan',
        '1 AI Agent',
        '5 Knowledge Documents',
        'n8n Integration',
      ],
      icon: Sparkles,
      popular: true,
      hasDurations: true,
    },
    {
      name: 'PRO',
      tier: 'PRO' as SubscriptionTier,
      basePrice: proBasePrice,
      description: t('proDescription'),
      features: filterFeatures(pricingWithDurations?.pro.features || pricing?.pro.features) || [
        'Semua fitur LITE',
        '10 AI Agents',
        '50 Knowledge Documents',
      ],
      icon: Crown,
      popular: false,
      hasDurations: true,
    },
  ]

  return (
    <div className="flex justify-center">
      <div className="grid gap-5 md:grid-cols-3 max-w-5xl w-full">
        {tiers.map((tier) => {
          const isCurrent = currentTier === tier.tier
          const canUpgrade =
            (currentTier === 'FREE' && tier.tier !== 'FREE') ||
            (currentTier === 'LITE' && tier.tier === 'PRO')

          const durations = tier.hasDurations ? getDurations(tier.tier as 'LITE' | 'PRO') : []
          const selectedDuration = tier.hasDurations ? getSelectedDuration(tier.tier as 'LITE' | 'PRO') : null
          const displayPrice = selectedDuration?.totalPrice || tier.basePrice
          const effectiveMonthlyPrice = selectedDuration?.effectiveMonthlyPrice || tier.basePrice
          const savings = selectedDuration?.savings || 0
          const hasDiscount = savings > 0

          return (
            <Card
              key={tier.tier}
              className={`relative flex flex-col ${
                tier.popular
                  ? 'border-primary shadow-md'
                  : 'border-border'
              } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5">
                  {t('popular')}
                </Badge>
              )}
              {isCurrent && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2.5 right-3 text-xs px-2 py-0.5"
                >
                  {t('currentPlanBadge')}
                </Badge>
              )}

              <CardHeader className="pb-3 pt-5">
                <div className="flex items-center gap-2">
                  <tier.icon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{tier.name}</CardTitle>
                </div>
                <CardDescription className="text-xs">{tier.description}</CardDescription>
                
                {/* Price display */}
                <div className="mt-3">
                  {tier.basePrice === 0 ? (
                    <span className="text-2xl font-bold">{t('free')}</span>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          {formatPrice(displayPrice)}
                        </span>
                        {selectedDuration && selectedDuration.months > 1 && (
                          <span className="text-muted-foreground text-sm">
                            /{selectedDuration.months} {t('months')}
                          </span>
                        )}
                        {selectedDuration && selectedDuration.months === 1 && (
                          <span className="text-muted-foreground text-sm">{t('perMonth')}</span>
                        )}
                      </div>
                      
                      {/* Effective monthly price for multi-month plans */}
                      {selectedDuration && selectedDuration.months > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(effectiveMonthlyPrice)}{t('perMonth')} {t('effective')}
                        </p>
                      )}
                      
                      {/* Savings badge */}
                      {hasDiscount && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          {t('save')} {formatPrice(savings)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 py-3 space-y-4">
                {/* Duration selector for paid tiers */}
                {tier.hasDurations && durations.length > 0 && canUpgrade && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{t('selectDuration')}</p>
                    <DurationSelector
                      durations={durations}
                      selectedMonths={selectedDurations[tier.tier] || 1}
                      onSelect={(months) => handleDurationSelect(tier.tier, months)}
                    />
                  </div>
                )}

                {/* Features list */}
                <ul className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-3 pb-4">
                {isCurrent ? (
                  <Button className="w-full h-9 text-sm" variant="secondary" disabled>
                    {t('activePlan')}
                  </Button>
                ) : canUpgrade ? (
                  <Button
                    className="w-full h-9 text-sm"
                    onClick={() => onUpgrade(tier.tier, selectedDurations[tier.tier] || 1)}
                  >
                    {t('upgradeTo', { tier: tier.name })}
                  </Button>
                ) : (
                  <Button className="w-full h-9 text-sm" variant="outline" disabled>
                    {tier.tier === 'FREE' ? t('basicPlan') : t('notAvailable')}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
