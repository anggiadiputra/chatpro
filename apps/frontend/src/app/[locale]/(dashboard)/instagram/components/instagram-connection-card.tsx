"use client"

import { useState } from "react"
import { CircleCheck, RefreshCw, Unlink, Instagram } from "lucide-react"
import type { InstagramAccount } from "@/lib/api/instagram"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Props {
  account: InstagramAccount
  onRefresh: () => void
  onDisconnect: () => void
}

export function InstagramConnectionCard({
  account,
  onRefresh,
  onDisconnect,
}: Props) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={account.profilePicUrl || undefined}
                alt={account.username}
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Instagram className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                @{account.username}
                <Badge className="bg-emerald-600">
                  <CircleCheck className="mr-1 h-3 w-3" />
                  Connected
                </Badge>
              </CardTitle>
              <CardDescription>Instagram Professional Account</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 md:flex-none"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              className="flex-1 text-red-600 hover:text-red-700 md:flex-none"
            >
              <Unlink className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Instagram ID</p>
            <p className="font-mono text-sm font-medium">{account.igId}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Connected Since</p>
            <p className="font-medium">
              {new Date(account.connectedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {account.lastSyncAt && (
            <div className="md:col-span-2">
              <p className="text-muted-foreground text-sm">Last Synced</p>
              <p className="text-sm">
                {new Date(account.lastSyncAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
