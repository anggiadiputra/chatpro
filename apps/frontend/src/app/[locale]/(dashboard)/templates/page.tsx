"use client"

import { LayoutTemplate, Variable } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useBusinessAccount } from "@/hooks/use-business-account"
import { useTemplates } from "@/hooks/use-templates"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RoleGuard } from "@/components/auth/role-guard"
import { Header } from "@/components/layout/header"
import { PageHeader } from "@/components/page-header"
import { columns } from "./components/templates-columns"
import { TemplatesPrimaryActions } from "./components/templates-primary-actions"
import { TemplatesTable } from "./components/templates-table"
import { VariableLibrary } from "./components/variable-library"

export default function TemplatesPage() {
  const t = useTranslations("templates")
  const { userId, isLoading: isLoadingAccount } = useBusinessAccount()

  // Use TanStack Query for templates data with caching
  // Requirements: 3.1, 3.3
  const {
    data: templates = [],
    isLoading,
    isFetching,
  } = useTemplates(undefined, !isLoadingAccount && !!userId)

  // Tab navigation with URL params
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = searchParams.get("tab") || "templates"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Show loading skeleton only on initial load, not on background refetch
  // Requirements: 2.3 - Background refetch without loading spinner
  const showLoadingSkeleton = isLoading || isLoadingAccount

  if (showLoadingSkeleton) {
    return (
      <>
        <Header />
        <div className="space-y-6 p-6">
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
      <div className="space-y-6 p-6">
        <PageHeader
          title={t("title")}
          description={
            activeTab === "templates"
              ? "Create and manage WhatsApp message templates for your business"
              : t("variables.description")
          }
        />

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
              <TabsTrigger value="templates" className="gap-2">
                <LayoutTemplate className="h-4 w-4" />
                <span>{t("tabs.templates")}</span>
              </TabsTrigger>
              <TabsTrigger value="variables" className="gap-2">
                <Variable className="h-4 w-4" />
                <span>{t("tabs.variables")}</span>
              </TabsTrigger>
            </TabsList>

            {activeTab === "templates" && (
              <div className="w-full sm:w-auto">
                <TemplatesPrimaryActions />
              </div>
            )}
          </div>

          <TabsContent value="templates" className="mt-4">
            {templates.length === 0 && !isLoading ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <LayoutTemplate className="text-muted-foreground mb-4 h-12 w-12" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No templates yet
                  </h3>
                  <p className="text-muted-foreground mb-4 text-center text-sm">
                    Create your first WhatsApp message template to start sending
                    messages
                  </p>
                  <TemplatesPrimaryActions />
                </CardContent>
              </Card>
            ) : (
              <div className="flex-1">
                <TemplatesTable data={templates} columns={columns} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="variables" className="mt-4">
            <VariableLibrary />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}
