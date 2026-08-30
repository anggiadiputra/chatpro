"use client"

import {
  Phone,
  CircleCheck,
  AlertTriangle,
  CircleX,
  TrendingUp,
} from "lucide-react"
import { getTierInfo, type PhoneNumberDetails } from "@/lib/api/waba"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Props {
  phoneInfo: PhoneNumberDetails | null
}

export function PhoneNumberCard({ phoneInfo }: Props) {
  if (!phoneInfo) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Phone className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">No Phone Number</h3>
          <p className="text-muted-foreground text-sm">
            Connect a WABA to see phone number details
          </p>
        </CardContent>
      </Card>
    )
  }

  const qualityConfig = {
    GREEN: {
      label: "High Quality",
      variant: "active" as const,
      icon: CircleCheck,
      description: "Excellent messaging quality",
    },
    YELLOW: {
      label: "Medium Quality",
      variant: "warning" as const,
      icon: AlertTriangle,
      description: "Quality under review",
    },
    RED: {
      label: "Low Quality",
      variant: "destructive" as const,
      icon: CircleX,
      description: "Quality issues detected",
    },
    UNKNOWN: {
      label: "Unknown",
      variant: "neutral" as const,
      icon: AlertTriangle,
      description: "Quality not rated yet",
    },
  }

  const quality = qualityConfig[phoneInfo.qualityRating || "UNKNOWN"]
  const QualityIcon = quality.icon
  const tierInfo = getTierInfo(phoneInfo.messagingLimitTier)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Phone Number
          {phoneInfo.isPrimary && (
            <Badge variant="default" className="text-xs">
              Primary
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Your WhatsApp Business phone number details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Phone Number Display */}
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Phone className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-mono text-lg font-bold">
                {phoneInfo.displayPhoneNumber}
              </p>
              {phoneInfo.verifiedName && (
                <p className="text-muted-foreground text-sm">
                  {phoneInfo.verifiedName}
                </p>
              )}
            </div>
          </div>

          {/* Quality Rating */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Quality Rating</p>
              <Badge variant={quality.variant}>
                <QualityIcon className="mr-1 h-3 w-3" />
                {quality.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {quality.description}
            </p>

            {/* Quality Progress Bar */}
            <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all ${
                  phoneInfo.qualityRating === "GREEN"
                    ? "w-full bg-green-500"
                    : phoneInfo.qualityRating === "YELLOW"
                      ? "w-2/3 bg-yellow-500"
                      : phoneInfo.qualityRating === "RED"
                        ? "w-1/3 bg-red-500"
                        : "w-0 bg-gray-400"
                }`}
              />
            </div>
          </div>

          {/* Messaging Tier */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">Messaging Limit</span>
              </div>
              <span className={`text-lg font-bold ${tierInfo.color}`}>
                {tierInfo.limit}/day
              </span>
            </div>

            {/* Tier Progress Indicator */}
            <div className="flex gap-1">
              {["TIER_1K", "TIER_10K", "TIER_100K", "TIER_UNLIMITED"].map(
                (tier, index) => {
                  const currentTierIndex = [
                    "TIER_1K",
                    "TIER_10K",
                    "TIER_100K",
                    "TIER_UNLIMITED",
                  ].indexOf(phoneInfo.messagingLimitTier || "")
                  const isActive = index <= currentTierIndex

                  return (
                    <div
                      key={tier}
                      className={`h-1.5 flex-1 rounded-full ${
                        isActive ? "bg-blue-500" : "bg-gray-200"
                      }`}
                    />
                  )
                }
              )}
            </div>
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>1K</span>
              <span>10K</span>
              <span>100K</span>
              <span>∞</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="border-t pt-4">
            <p className="text-muted-foreground text-xs">Phone Number ID</p>
            <p className="font-mono text-sm">{phoneInfo.phoneNumberId}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
