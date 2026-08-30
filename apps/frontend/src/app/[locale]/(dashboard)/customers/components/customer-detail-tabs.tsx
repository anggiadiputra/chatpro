"use client"

import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  History,
  User,
  Phone,
  Mail,
  Clock,
  Check,
  Tags,
  FileText,
  MessageCircle,
  Calendar,
  List,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Customer } from "../data/schema"
import { ActivityTimeline } from "./activity-timeline"

interface CustomerDetailTabsProps {
  customer: Customer
  getConsentBadge: (status: string) => React.ReactNode
}

export function CustomerDetailTabs({
  customer,
  getConsentBadge,
}: CustomerDetailTabsProps) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="details">
          <User className="mr-2 h-4 w-4" />
          Details
        </TabsTrigger>
        <TabsTrigger value="activity">
          <History className="mr-2 h-4 w-4" />
          Activity
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-6 space-y-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="text-muted-foreground text-sm font-semibold uppercase">
            Contact Information
          </h4>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div className="flex-1">
                <p className="text-muted-foreground text-xs">Phone Number</p>
                <p className="font-medium">{customer.phoneNumber}</p>
              </div>
            </div>

            {customer.email && (
              <div className="flex items-start gap-3">
                <Mail className="text-muted-foreground mt-0.5 h-4 w-4" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Marketing Consent */}
        <div className="space-y-4">
          <h4 className="text-muted-foreground text-sm font-semibold uppercase">
            Marketing Consent
          </h4>
          <div className="flex items-start gap-3">
            <Check className="text-muted-foreground mt-0.5 h-4 w-4" />
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">Status</p>
              <div className="mt-1">
                {getConsentBadge(customer.consentStatus)}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Message Window */}
        <div className="space-y-4">
          <h4 className="text-muted-foreground text-sm font-semibold uppercase">
            Message Window
          </h4>
          <div className="flex items-start gap-3">
            <Clock className="text-muted-foreground mt-0.5 h-4 w-4" />
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">24-Hour Window</p>
              {customer.hasActiveWindow && customer.windowExpiresAt ? (
                <div className="mt-1">
                  <Badge className="bg-emerald-600">Active</Badge>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Expires{" "}
                    {formatDistanceToNow(new Date(customer.windowExpiresAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ) : (
                <div className="mt-1">
                  <Badge variant="outline">No Active Window</Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Tags */}
        {customer.tags && customer.tags.length > 0 && (
          <>
            <div className="space-y-4">
              <h4 className="text-muted-foreground text-sm font-semibold uppercase">
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    <Tags className="mr-1 h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Custom Fields */}
        {customer.customFields && customer.customFields.length > 0 && (
          <>
            <div className="space-y-4">
              <h4 className="text-muted-foreground text-sm font-semibold uppercase">
                Custom Fields
              </h4>
              <div className="space-y-3">
                {customer.customFields.map((cf: any) => (
                  <div key={cf.id} className="flex items-start gap-3">
                    <List className="text-muted-foreground mt-0.5 h-4 w-4" />
                    <div className="flex-1">
                      <p className="text-muted-foreground text-xs">
                        {cf.fieldDefinition.name}
                      </p>
                      <p className="font-medium">{cf.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Notes */}
        {customer.notes && (
          <>
            <div className="space-y-4">
              <h4 className="text-muted-foreground text-sm font-semibold uppercase">
                Notes
              </h4>
              <div className="flex items-start gap-3">
                <FileText className="text-muted-foreground mt-0.5 h-4 w-4" />
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Activity Summary */}
        <div className="space-y-4">
          <h4 className="text-muted-foreground text-sm font-semibold uppercase">
            Activity Summary
          </h4>

          <div className="space-y-3">
            {customer.lastMessageAt && (
              <div className="flex items-start gap-3">
                <MessageCircle className="text-muted-foreground mt-0.5 h-4 w-4" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs">Last Message</p>
                  <p className="font-medium">
                    {format(
                      new Date(customer.lastMessageAt),
                      "MMM dd, yyyy 'at' HH:mm"
                    )}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(customer.lastMessageAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div className="flex-1">
                <p className="text-muted-foreground text-xs">Added On</p>
                <p className="font-medium">
                  {format(
                    new Date(customer.createdAt),
                    "MMM dd, yyyy 'at' HH:mm"
                  )}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(customer.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="activity" className="mt-6">
        <ActivityTimeline customerId={customer.id} />
      </TabsContent>
    </Tabs>
  )
}
