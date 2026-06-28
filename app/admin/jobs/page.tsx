// Job Management page with filtering and status management

"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { SearchBar } from "@/components/admin/search-bar"
import { DataTable, type Column } from "@/components/admin/data-table"
import { StatusBadge } from "@/components/admin/status-badge"
import { DetailDrawer } from "@/components/admin/detail-drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { 
  loadJobPostsFromCache,
  fetchAllJobPosts, 
  deleteJobPost, 
  updateJobPost, 
  setFilterStatus,
  syncJobPosts
} from "@/lib/store/jobPostsSlice"
import { useCanWrite } from "@/lib/rbacConfig"
import { exportToExcel } from "@/lib/utils/excelExport"
import type { Job } from "@/lib/types"
import { jobPostsApi, transformJobPost } from "@/lib/api/jobPosts"
import { format, formatDistanceToNow } from "date-fns"
import { MoreVertical, Eye, XCircle, Trash2, RefreshCw, Download } from "lucide-react"
import { useSearchParams } from "next/navigation"

const ITEMS_PER_PAGE = 10

export default function JobsPage() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const canWrite = useCanWrite()
  const { allJobPosts, isLoading, isUpdating, isDeleting, error, filterStatus, lastFetchedAt } = useAppSelector(
    (state) => state.jobPosts
  )
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Job>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Load from IndexedDB cache on mount, fetch from API if no cache
  useEffect(() => {
    const initData = async () => {
      if (allJobPosts.length > 0 && lastFetchedAt) return

      const cacheResult = await dispatch(loadJobPostsFromCache()).unwrap()
      if (!cacheResult) {
        dispatch(fetchAllJobPosts())
      }
    }
    initData()
  }, [dispatch, allJobPosts.length, lastFetchedAt])

  // Deep-link support: auto-open a job's drawer when navigated with ?highlight=<jobId>
  const searchParams = useSearchParams()
  const highlightJobId = searchParams.get("highlight")
  const [highlightHandled, setHighlightHandled] = useState(false)

  useEffect(() => {
    if (!highlightJobId || highlightHandled) return

    const openHighlightedJob = async () => {
      try {
        const res = await jobPostsApi.getJobPost(highlightJobId)
        const jobData = (res?.data as any)?.jobPost || res?.data
        if (jobData) {
          const job = transformJobPost(jobData)
          setSelectedJob(job)
          setFormData(job)
          setIsDetailOpen(true)
        }
      } catch (err) {
        // Job may have been deleted — silently ignore
      } finally {
        setHighlightHandled(true)
      }
    }

    openHighlightedJob()
  }, [highlightJobId, highlightHandled])

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Refresh — incrementally sync or force re-fetch
  const handleRefresh = useCallback(async () => {
    setIsSyncing(true)
    try {
      if (lastFetchedAt) {
        await dispatch(syncJobPosts(lastFetchedAt)).unwrap()
        toast({
          title: "Delta Sync Complete",
          description: `Successfully fetched incremental updates.`,
        })
      } else {
        await dispatch(fetchAllJobPosts()).unwrap()
        toast({
          title: "Full Sync Complete",
          description: `Successfully loaded all job posts.`,
        })
      }
    } catch {
      // Error handled by slice
    } finally {
      setIsSyncing(false)
    }
  }, [dispatch, toast, lastFetchedAt])

  // Export to Excel — from in-memory data
  const handleExport = useCallback(() => {
    if (allJobPosts.length === 0) {
      toast({ title: "No Data", description: "No jobs to export.", variant: "destructive" })
      return
    }

    const rows = allJobPosts.map((job) => ({
      'Job Title': job.title,
      Company: job.companyName,
      Location: job.location,
      Type: job.type,
      'Posted Date': format(new Date(job.postedDate), "yyyy-MM-dd"),
      Status: job.status === 'active' ? 'Active' : 'Closed',
    }))

    exportToExcel(rows, `jobs-${format(new Date(), 'yyyy-MM-dd')}`, 'Jobs')
    toast({ title: "Export Complete", description: `Exported ${rows.length} jobs to Excel.` })
  }, [allJobPosts, toast])

  // Filter jobs based on search and status (client-side)
  const filteredJobs = useMemo(() => {
    let filtered = allJobPosts

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((job) =>
        job.title.toLowerCase().includes(query) ||
        job.companyName.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query)
      )
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((job) => job.status === filterStatus)
    }

    return filtered
  }, [allJobPosts, searchQuery, filterStatus])

  // Client-side pagination
  const totalItems = filteredJobs.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredJobs.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredJobs, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: "all" | "active" | "closed") => {
    dispatch(setFilterStatus(value))
    setCurrentPage(1)
  }

  const handleView = (job: Job) => {
    setSelectedJob(job)
    setFormData(job)
    setIsDetailOpen(true)
  }

  const handleCloseJob = async (job: Job) => {
    if (!confirm(`Are you sure you want to close "${job.title}"?`)) return

    try {
      await dispatch(updateJobPost({ 
        id: job.id, 
        data: { jobStatus: "closed" as "open" | "closed" },
      })).unwrap()
      
      toast({
        title: "Success",
        description: "Job closed successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to close job",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (job: Job) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"?`)) return

    try {
      await dispatch(deleteJobPost(job.id)).unwrap()
      
      toast({
        title: "Success",
        description: "Job deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      })
    }
  }

  const columns: Column<Job>[] = [
    {
      key: "title",
      label: "Job Title",
      render: (item) => (
        <button
          onClick={() => handleView(item)}
          className="text-foreground hover:text-primary transition-colors font-medium text-left"
        >
          {item.title}
        </button>
      ),
    },
    { key: "companyName", label: "Company" },
    { key: "location", label: "Location" },
    {
      key: "type",
      label: "Type",
      render: (item) => <span className="capitalize text-foreground">{item.type.replace("-", " ")}</span>,
    },
    {
      key: "postedDate",
      label: "Posted Date",
      render: (item) => format(new Date(item.postedDate), "MMM dd, yyyy"),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status === "active"} activeLabel="Active" inactiveLabel="Closed" />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isDeleting}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(item)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {canWrite && (
              <>
                {item.status === "active" && (
                  <DropdownMenuItem onClick={() => handleCloseJob(item)} disabled={isUpdating}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Close Job
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleDelete(item)} className="text-destructive" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
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
            <PageHeader title="Job Management" description="Manage job postings and their status" />

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <SearchBar 
                placeholder="Search by title, company..." 
                value={searchQuery} 
                onChange={handleSearchChange} 
              />
              <Select value={filterStatus} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="bg-white w-[130px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading || isSyncing}
                title="Refresh data from server"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleExport}
                disabled={allJobPosts.length === 0}
                title="Export to Excel"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sync indicator */}
          {lastFetchedAt && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Last synced {formatDistanceToNow(new Date(lastFetchedAt), { addSuffix: true })}
              {' · '}{allJobPosts.length} records loaded
            </div>
          )}

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <>
              <DataTable columns={columns} data={paginatedJobs} emptyMessage="No jobs found" />
              
              {/* Client-side Pagination */}
              {totalPages > 1 && !searchQuery && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{' '}
                    {totalItems} jobs
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage > 1) {
                              handlePageChange(currentPage - 1)
                            }
                          }}
                          className={
                            currentPage === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                      
                      {getPageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                          {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(page)
                              }}
                              isActive={page === currentPage}
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
                            if (currentPage < totalPages) {
                              handlePageChange(currentPage + 1)
                            }
                          }}
                          className={
                            currentPage === totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail Drawer */}
        {selectedJob && (
          <DetailDrawer open={isDetailOpen} onOpenChange={setIsDetailOpen} title="Job Details">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <p className="text-sm font-medium">{selectedJob.title}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <p className="text-sm font-medium">{selectedJob.companyName}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <p className="text-sm font-medium">{selectedJob.location}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Posted Date</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedJob.postedDate), "MMMM dd, yyyy")}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="mt-1">
                  <StatusBadge status={selectedJob.status === "active"} activeLabel="Active" inactiveLabel="Closed" />
                </div>
              </div>
              
              {canWrite && selectedJob.status === "active" && (
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      handleCloseJob(selectedJob)
                      setIsDetailOpen(false)
                    }}
                    variant="destructive"
                    className="w-full"
                    disabled={isUpdating}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Close Job
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
