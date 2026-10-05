// Job Reports Management page for reviewing reported job postings

"use client"

import { useEffect, useState, useCallback } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, type Column } from "@/components/admin/data-table"
import { DetailDrawer } from "@/components/admin/detail-drawer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api/client"
import { format } from "date-fns"
import { MoreVertical, Eye, CheckCircle, XCircle, AlertTriangle, Flag, Ban, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface JobReport {
  _id: string
  id: string
  jobPost: {
    _id: string
    title: string
    description?: string
    company?: {
      _id: string
      name: string
      email?: string
    }
    address?: {
      city?: string
      state?: string
      country?: string
    }
    jobStatus?: string
  } | null
  reporter: {
    _id: string
    name: string
    email: string
    type?: string
  } | null
  reason: string
  description?: string
  status: "pending" | "reviewed" | "dismissed" | "action_taken"
  adminNotes?: string
  resolvedAt?: string
  // Snapshot fields — preserved even if the job is later deleted
  jobTitle?: string
  companyName?: string
  createdAt: string
  updatedAt: string
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  fraudulent: { label: "Fraudulent / Scam", color: "bg-red-100 text-red-800" },
  misleading: { label: "Misleading", color: "bg-orange-100 text-orange-800" },
  spam: { label: "Spam / Duplicate", color: "bg-yellow-100 text-yellow-800" },
  inappropriate: { label: "Inappropriate", color: "bg-purple-100 text-purple-800" },
  other: { label: "Other", color: "bg-gray-100 text-gray-800" },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800" },
  reviewed: { label: "Reviewed", color: "bg-blue-100 text-blue-800" },
  dismissed: { label: "Dismissed", color: "bg-gray-100 text-gray-700" },
  action_taken: { label: "Action Taken", color: "bg-green-100 text-green-800" },
}

export default function ReportsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [reports, setReports] = useState<JobReport[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedReport, setSelectedReport] = useState<JobReport | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isClosingJob, setIsClosingJob] = useState(false)

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", String(currentPage))
      params.append("limit", "20")
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const res = await api.get<{ status: string; data: { reports: JobReport[]; pagination: PaginationMeta } }>(
        `/admin/job-reports?${params.toString()}`
      )

      // DataTable requires items with an `id` field; map MongoDB _id → id
      const mapped = res.data.reports.map((r) => ({ ...r, id: r._id }))
      setReports(mapped)
      setPagination(res.data.pagination)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch reports",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, statusFilter, toast])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleView = (report: JobReport) => {
    setSelectedReport(report)
    setAdminNotes(report.adminNotes || "")
    setIsDetailOpen(true)
  }

  const handleUpdateStatus = async (report: JobReport, newStatus: string) => {
    setIsUpdating(true)
    try {
      await api.patch(`/admin/job-reports/${report._id}`, {
        status: newStatus,
        adminNotes: adminNotes.trim() || undefined,
      })

      toast({
        title: "Success",
        description: `Report marked as "${STATUS_LABELS[newStatus]?.label || newStatus}"`,
      })

      setIsDetailOpen(false)
      fetchReports()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update report",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCloseJob = async (report: JobReport) => {
    if (!report.jobPost?._id) {
      toast({ title: "Error", description: "Job post not found", variant: "destructive" })
      return
    }
    if (!confirm(`Are you sure you want to close the job "${report.jobPost.title}"?`)) return

    setIsClosingJob(true)
    try {
      await api.patch(`/admin/job-posts/${report.jobPost._id}`, { jobStatus: "closed" })
      toast({
        title: "Success",
        description: `Job "${report.jobPost.title}" has been closed.`,
      })
      fetchReports()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to close job",
        variant: "destructive",
      })
    } finally {
      setIsClosingJob(false)
    }
  }

  const getPageNumbers = () => {
    if (!pagination) return []
    const pages: (number | "ellipsis")[] = []
    const totalPages = pagination.totalPages
    const current = pagination.page

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (current >= totalPages - 2) {
        pages.push(1)
        pages.push("ellipsis")
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("ellipsis")
        for (let i = current - 1; i <= current + 1; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }
    return pages
  }

  const columns: Column<JobReport>[] = [
    {
      key: "jobPost",
      label: "Job Title",
      render: (item) => {
        const title = item.jobPost?.title || item.jobTitle || "Deleted Job"
        const isJobClosed = item.jobPost?.jobStatus === "closed"
        const isJobDeleted = !item.jobPost
        return (
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => handleView(item)}
              className="text-foreground hover:text-primary transition-colors font-medium text-left"
            >
              {title}
            </button>
            {isJobDeleted && (
              <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600">
                Job Deleted
              </span>
            )}
            {!isJobDeleted && isJobClosed && (
              <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                Job Closed
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: "company",
      label: "Company",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.jobPost?.company?.name || item.companyName || "—"}
        </span>
      ),
    },
    {
      key: "reporter",
      label: "Reporter",
      render: (item) => (
        <span className="text-sm">{item.reporter?.name || item.reporter?.email || "—"}</span>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (item) => {
        const reason = REASON_LABELS[item.reason] || { label: item.reason, color: "bg-gray-100 text-gray-800" }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reason.color}`}>
            {reason.label}
          </span>
        )
      },
    },
    {
      key: "status",
      label: "Status",
      render: (item) => {
        const status = STATUS_LABELS[item.status] || { label: item.status, color: "bg-gray-100 text-gray-800" }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        )
      },
    },
    {
      key: "createdAt",
      label: "Date Filed",
      render: (item) => format(new Date(item.createdAt), "MMM dd, yyyy"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(item)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {item.status === "pending" && (
              <>
                <DropdownMenuItem onClick={() => handleUpdateStatus(item, "reviewed")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Reviewed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus(item, "dismissed")}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Dismiss
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus(item, "action_taken")} className="text-destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Action Taken
                </DropdownMenuItem>
              </>
            )}
            {item.jobPost && item.jobPost.jobStatus !== "closed" && (
              <DropdownMenuItem onClick={() => handleCloseJob(item)} disabled={isClosingJob}>
                <Ban className="mr-2 h-4 w-4" />
                Close Job
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="mt-4 sm:mt-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <PageHeader
              title="Job Reports"
              description="Review and manage reported job postings"
            />

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="bg-white w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                  <SelectItem value="action_taken">Action Taken</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <>
              <DataTable columns={columns} data={reports} emptyMessage="No reports found" />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} reports
                  </div>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (pagination.page > 1) handlePageChange(pagination.page - 1)
                          }}
                          className={pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {getPageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                          {page === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(page)
                              }}
                              isActive={page === pagination.page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (pagination.page < pagination.totalPages) handlePageChange(pagination.page + 1)
                          }}
                          className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>

        {/* Report Detail Drawer */}
        {selectedReport && (
          <DetailDrawer open={isDetailOpen} onOpenChange={setIsDetailOpen} title="Report Details">
            <div className="grid gap-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <Flag className="h-5 w-5 text-red-500" />
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_LABELS[selectedReport.status]?.color || "bg-gray-100"}`}>
                  {STATUS_LABELS[selectedReport.status]?.label || selectedReport.status}
                </span>
              </div>

              {/* Job Info */}
              <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
                <Label>Reported Job</Label>
                <p className="text-sm font-medium">
                  {selectedReport.jobPost?.title || selectedReport.jobTitle || "Deleted Job"}
                  {!selectedReport.jobPost && <span className="text-xs text-muted-foreground ml-1">(job no longer exists)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedReport.jobPost?.company?.name || selectedReport.companyName || "Unknown Company"}
                  {selectedReport.jobPost?.address?.city && ` • ${selectedReport.jobPost.address.city}`}
                </p>
                {selectedReport.jobPost?.jobStatus && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    selectedReport.jobPost.jobStatus === "open" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    Job Status: {selectedReport.jobPost.jobStatus === "open" ? "Active" : "Closed"}
                  </span>
                )}
                {selectedReport.jobPost && (
                  <button
                    onClick={() => router.push(`/admin/jobs?highlight=${selectedReport.jobPost?._id}`)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  >
                    View in Jobs Section
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Job Description */}
              {selectedReport.jobPost?.description && (
                <div className="space-y-2">
                  <Label>Job Description</Label>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md border max-h-48 overflow-y-auto">
                    {selectedReport.jobPost.description}
                  </div>
                </div>
              )}

              {/* Reporter Info */}
              <div className="space-y-2">
                <Label>Reported By</Label>
                <p className="text-sm font-medium">{selectedReport.reporter?.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{selectedReport.reporter?.email || "—"}</p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason</Label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${REASON_LABELS[selectedReport.reason]?.color || "bg-gray-100"}`}>
                  {REASON_LABELS[selectedReport.reason]?.label || selectedReport.reason}
                </span>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md border">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-2">
                <Label>Date Filed</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedReport.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}
                </p>
              </div>

              {selectedReport.resolvedAt && (
                <div className="space-y-2">
                  <Label>Resolved At</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedReport.resolvedAt), "MMMM dd, yyyy 'at' hh:mm a")}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this report..."
                  rows={3}
                  disabled={isUpdating || selectedReport.status !== "pending"}
                />
              </div>

              {/* Action Buttons */}
              {selectedReport.status === "pending" && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <Button
                    onClick={() => handleUpdateStatus(selectedReport, "reviewed")}
                    variant="outline"
                    className="w-full"
                    disabled={isUpdating}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                    Mark as Reviewed
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedReport, "dismissed")}
                    variant="outline"
                    className="w-full"
                    disabled={isUpdating}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-gray-500" />
                    Dismiss Report
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedReport, "action_taken")}
                    variant="destructive"
                    className="w-full"
                    disabled={isUpdating}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Action Taken
                  </Button>
                </div>
              )}

              {selectedReport.jobPost && selectedReport.jobPost.jobStatus !== "closed" && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Job Actions</Label>
                  <Button
                    onClick={() => {
                      handleCloseJob(selectedReport)
                      setIsDetailOpen(false)
                    }}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                    disabled={isClosingJob}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {isClosingJob ? "Closing..." : "Close This Job"}
                  </Button>
                </div>
              )}
            </div>
          </DetailDrawer>
        )}
      </AdminLayout>
    </AuthGuard>
  )
}
