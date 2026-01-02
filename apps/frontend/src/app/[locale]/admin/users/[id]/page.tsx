"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Shield,
  CreditCard,
  MessageSquare,
  Instagram,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAdminUserDetail, type SubscriptionStatus } from "../../hooks/use-admin-user-detail"
import type { Role, SubscriptionTier } from "../../hooks/use-admin-users"

interface PageProps {
  params: Promise<{ id: string }>
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatShortDate(dateString: string | null | undefined) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getStatusIcon(status: string | null | undefined) {
  switch (status?.toLowerCase()) {
    case "connected":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "disconnected":
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }
}

function getSubscriptionStatusBadge(status: SubscriptionStatus) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
    case "PENDING_PAYMENT":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Payment</Badge>
    case "EXPIRED":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>
    case "CANCELLED":
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function UserDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-48" />
    </div>
  )
}

export default function AdminUserDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data, isLoading, error, refetch, updateUser, updateSubscription, isUpdating } =
    useAdminUserDetail(id)

  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false)
  const [subscriptionForm, setSubscriptionForm] = useState({
    tier: "" as SubscriptionTier | "",
    status: "" as SubscriptionStatus | "",
    endDate: "",
    notes: "",
  })

  if (isLoading) {
    return <UserDetailSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert>
          <AlertDescription>User not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { user, subscription, wabaStatus, instagramAccounts, recentActivity } = data

  const handleToggleActive = async () => {
    await updateUser({ isActive: !user.isActive })
  }

  const handleRoleChange = async (newRole: Role) => {
    await updateUser({ role: newRole })
  }

  const openSubscriptionDialog = () => {
    setSubscriptionForm({
      tier: subscription?.tier || "FREE",
      status: subscription?.status || "ACTIVE",
      endDate: subscription?.endDate ? subscription.endDate.split("T")[0] : "",
      notes: subscription?.notes || "",
    })
    setSubscriptionDialogOpen(true)
  }

  const handleSubscriptionUpdate = async () => {
    const updates: {
      tier?: SubscriptionTier
      status?: SubscriptionStatus
      endDate?: string
      notes?: string
    } = {}

    if (subscriptionForm.tier) updates.tier = subscriptionForm.tier as SubscriptionTier
    if (subscriptionForm.status) updates.status = subscriptionForm.status as SubscriptionStatus
    if (subscriptionForm.endDate) updates.endDate = subscriptionForm.endDate
    if (subscriptionForm.notes !== undefined) updates.notes = subscriptionForm.notes

    const success = await updateSubscription(updates)
    if (success) {
      setSubscriptionDialogOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="w-fit min-h-[44px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-muted-foreground text-sm sm:text-base break-all">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="min-h-[44px] w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>Basic user details and account status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{user.email}</span>
                {user.emailVerified && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Joined</span>
              </div>
              <span className="text-sm font-medium">{formatShortDate(user.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Last Login</span>
              </div>
              <span className="text-sm font-medium">{formatDate(user.lastLoginAt)}</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="user-active" className="text-sm">Account Active</Label>
              <Switch
                id="user-active"
                checked={user.isActive}
                onCheckedChange={handleToggleActive}
                disabled={isUpdating}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Role</Label>
              <Select
                value={user.role}
                onValueChange={(value) => handleRoleChange(value as Role)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="BUSINESS_OWNER">Business Owner</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription
                </CardTitle>
                <CardDescription>Manage user subscription plan</CardDescription>
              </div>
              <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={openSubscriptionDialog}>
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Subscription</DialogTitle>
                    <DialogDescription>
                      Update subscription details for {user.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Tier</Label>
                      <Select
                        value={subscriptionForm.tier}
                        onValueChange={(value) =>
                          setSubscriptionForm({ ...subscriptionForm, tier: value as SubscriptionTier })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FREE">Free</SelectItem>
                          <SelectItem value="LITE">Lite</SelectItem>
                          <SelectItem value="PRO">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={subscriptionForm.status}
                        onValueChange={(value) =>
                          setSubscriptionForm({ ...subscriptionForm, status: value as SubscriptionStatus })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
                          <SelectItem value="EXPIRED">Expired</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={subscriptionForm.endDate}
                        onChange={(e) =>
                          setSubscriptionForm({ ...subscriptionForm, endDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={subscriptionForm.notes}
                        onChange={(e) =>
                          setSubscriptionForm({ ...subscriptionForm, notes: e.target.value })
                        }
                        placeholder="Add notes about this subscription change..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSubscriptionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubscriptionUpdate} disabled={isUpdating}>
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Tier</span>
              <Badge
                className={
                  subscription?.tier === "PRO"
                    ? "bg-purple-100 text-purple-800 border-purple-200"
                    : subscription?.tier === "LITE"
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "bg-gray-100 text-gray-800 border-gray-200"
                }
                variant="outline"
              >
                {subscription?.tier || user.subscriptionTier || "FREE"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              {subscription ? (
                getSubscriptionStatusBadge(subscription.status)
              ) : (
                <Badge variant="outline">No subscription</Badge>
              )}
            </div>

            {subscription?.startDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Start Date</span>
                <span className="text-sm font-medium">{formatShortDate(subscription.startDate)}</span>
              </div>
            )}

            {subscription?.endDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm">End Date</span>
                <span className="text-sm font-medium">{formatShortDate(subscription.endDate)}</span>
              </div>
            )}

            {subscription?.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground">Notes</span>
                  <p className="text-sm mt-1">{subscription.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connections Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Channel Connections
          </CardTitle>
          <CardDescription>WhatsApp Business and Instagram connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* WABA Status */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-4 w-4" />
                <span className="font-medium">WhatsApp Business</span>
                {getStatusIcon(wabaStatus?.connectionStatus)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WABA ID</span>
                  <span className="font-mono">{wabaStatus?.wabaId || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone Number ID</span>
                  <span className="font-mono">{wabaStatus?.phoneNumberId || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connected At</span>
                  <span>{formatShortDate(wabaStatus?.connectedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span>{formatDate(wabaStatus?.lastSyncAt)}</span>
                </div>
              </div>
            </div>

            {/* Instagram Accounts */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Instagram className="h-4 w-4" />
                <span className="font-medium">Instagram Accounts</span>
                <Badge variant="outline">{instagramAccounts.length}</Badge>
              </div>
              {instagramAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No Instagram accounts connected</p>
              ) : (
                <div className="space-y-2">
                  {instagramAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between text-sm">
                      <span>@{account.username}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(account.connectionStatus)}
                        <span className="text-muted-foreground">
                          {formatShortDate(account.connectedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest user actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">
                        {activity.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.entityType} • {activity.entityId.slice(0, 8)}...
                    </p>
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(activity.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
