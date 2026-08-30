"use client"

import { useEffect, useState, useCallback } from "react"
import { formatDistanceToNow, format } from "date-fns"
import { id, enUS } from "date-fns/locale"
import {
  Check,
  X,
  AlertCircle,
  RefreshCw,
  History,
  LayoutTemplate,
  Eye,
  Ban,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"

interface BroadcastJob {
  id: string
  templateName: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"
  totalRecipients: number
  successCount: number
  failedCount: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

interface JobDetail extends BroadcastJob {
  results?: Array<{
    phoneNumber: string
    success: boolean
    messageId?: string
    error?: string
  }>
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function BroadcastHistory() {
  const t = useTranslations("broadcast")
  const locale = useLocale()
  const [jobs, setJobs] = useState<BroadcastJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const dateLocale = locale === "id" ? id : enUS

  const loadJobs = useCallback(async (page: number = 1) => {
    try {
      setError(null)
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
      const response = await fetch(
        `${apiUrl}/api/v1/broadcast/jobs?page=${page}&limit=10`,
        { credentials: "include" }
      )

      if (response.ok) {
        const result = await response.json()
        // Filter out PENDING and PROCESSING jobs (those are shown in Active Jobs)
        const historyJobs = (result.data || []).filter(
          (job: BroadcastJob) =>
            job.status === "COMPLETED" ||
            job.status === "FAILED" ||
            job.status === "CANCELLED"
        )
        setJobs(historyJobs)
        setPagination(
          result.pagination || {
            page: 1,
            limit: 10,
            total: historyJobs.length,
            totalPages: 1,
          }
        )
      } else {
        setError("Failed to load history")
      }
    } catch (err) {
      console.error("Error loading history:", err)
      setError("Failed to load history")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const loadJobDetail = async (jobId: string) => {
    try {
      setLoadingDetail(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
      const response = await fetch(`${apiUrl}/api/v1/broadcast/jobs/${jobId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const result = await response.json()
        setSelectedJob(result.data)
      }
    } catch (err) {
      console.error("Error loading job detail:", err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handlePageChange = (page: number) => {
    loadJobs(page)
  }

  const getStatusBadge = (status: BroadcastJob["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <Check className="h-3 w-3" />
            {t("status.completed")}
          </Badge>
        )
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1">
            <X className="h-3 w-3" />
            {t("status.failed")}
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="secondary" className="gap-1">
            <Ban className="h-3 w-3" />
            {t("status.cancelled")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="text-destructive mb-2 h-8 w-8" />
        <p className="text-destructive text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={() => loadJobs()}
        >
          <RefreshCw className="h-4 w-4" />
          {t("customerSelector.retry")}
        </Button>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <History className="text-muted-foreground mb-4 h-12 w-12" />
        <p className="text-muted-foreground">{t("history.noHistory")}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => loadJobDetail(job.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">{job.templateName}</span>
                    {getStatusBadge(job.status)}
                  </div>
                  <div className="text-muted-foreground flex gap-4 text-sm">
                    <span>
                      {t("jobCard.recipients")}: {job.totalRecipients}
                    </span>
                    <span className="text-green-600">
                      {t("jobCard.success")}: {job.successCount}
                    </span>
                    <span className="text-destructive">
                      {t("jobCard.failed")}: {job.failedCount}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {job.completedAt
                      ? format(new Date(job.completedAt), "PPp", {
                          locale: dateLocale,
                        })
                      : formatDistanceToNow(new Date(job.createdAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Eye className="h-4 w-4" />
                  {t("jobCard.viewDetails")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className={
                    pagination.page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - pagination.page) <= 1
                )
                .map((page, index, arr) => (
                  <PaginationItem key={page}>
                    {index > 0 && arr[index - 1] !== page - 1 && (
                      <span className="px-2">...</span>
                    )}
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={page === pagination.page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className={
                    pagination.page >= pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              {selectedJob?.templateName}
            </DialogTitle>
            <DialogDescription>
              {selectedJob?.completedAt &&
                format(new Date(selectedJob.completedAt), "PPpp", {
                  locale: dateLocale,
                })}
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedJob ? (
            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">
                      {selectedJob.totalRecipients}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("jobCard.recipients")}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedJob.successCount}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("jobCard.success")}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-destructive text-2xl font-bold">
                      {selectedJob.failedCount}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("jobCard.failed")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Results List */}
              {selectedJob.results && selectedJob.results.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Results</h4>
                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-2">
                    {selectedJob.results.map((result, index) => (
                      <div
                        key={index}
                        className="bg-muted/50 flex items-center justify-between rounded-md p-2 text-sm"
                      >
                        <span className="font-mono">{result.phoneNumber}</span>
                        {result.success ? (
                          <Badge variant="default" className="bg-green-500">
                            <Check className="mr-1 h-3 w-3" />
                            Success
                          </Badge>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="destructive">
                              <X className="mr-1 h-3 w-3" />
                              Failed
                            </Badge>
                            {result.error && (
                              <span className="text-muted-foreground max-w-[300px] text-right text-xs">
                                {result.error}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default BroadcastHistory
