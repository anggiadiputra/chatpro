"use client"

import { Link } from "@/i18n/routing"
import { RadioTower, Play, History, AlertTriangle, PlugZap } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useBusinessAccount } from "@/hooks/use-business-account"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RoleGuard } from "@/components/auth/role-guard"
import { Header } from "@/components/layout/header"
import { ActiveJobs } from "./components/active-jobs"
import { BroadcastForm } from "./components/broadcast-form"
import { BroadcastHistory } from "./components/broadcast-history"

export default function BroadcastPage() {
  const t = useTranslations("broadcast")
  const { isLoading, isWABAConnected, wabaConnectionStatus } =
    useBusinessAccount()

  // Tab navigation with URL params
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = searchParams.get("tab") || "create"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Check if WABA is connected
  const isConnected = isWABAConnected && wabaConnectionStatus === "connected"

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="space-y-4 p-4">
          <div className="animate-pulse space-y-4">
            <div className="bg-muted h-8 w-48 rounded"></div>
            <div className="bg-muted h-64 w-full rounded"></div>
          </div>
        </div>
      </>
    )
  }

  return (
    <RoleGuard>
      <Header />
      <div className="space-y-4 p-4">
        <div className="mb-2 flex flex-col justify-between gap-4 md:flex-row md:items-baseline md:gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
        </div>

        {/* WABA Not Connected Warning */}
        {!isConnected && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("wabaNotConnected.title")}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{t("wabaNotConnected.description")}</span>
              <Link href="/waba">
                <Button variant="outline" size="sm" className="w-fit gap-2">
                  <PlugZap className="h-4 w-4" />
                  {t("wabaNotConnected.connectButton")}
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
            <TabsTrigger
              value="create"
              className="gap-2"
              disabled={!isConnected}
            >
              <RadioTower className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tabs.create")}</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tabs.active")}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tabs.history")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4">
            {isConnected ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t("createBroadcast.title")}</CardTitle>
                  <CardDescription>
                    {t("createBroadcast.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BroadcastForm />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <RadioTower className="text-muted-foreground mb-4 h-12 w-12" />
                  <h3 className="mb-2 text-lg font-semibold">
                    {t("wabaNotConnected.title")}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-center text-sm">
                    {t("wabaNotConnected.description")}
                  </p>
                  <Link href="/waba">
                    <Button variant="default" className="gap-2">
                      <PlugZap className="h-4 w-4" />
                      {t("wabaNotConnected.connectButton")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("activeJobs.title")}</CardTitle>
                <CardDescription>{t("activeJobs.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ActiveJobs />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("history.title")}</CardTitle>
                <CardDescription>{t("history.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <BroadcastHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}
