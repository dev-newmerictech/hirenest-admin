// Job Management page with filtering and status management

"use client"

import { useEffect, useState, useMemo } from "react"
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
  fetchAllJobPosts, 
  deleteJobPost, 
  updateJobPost, 
  setSearchQuery, 
  setFilterStatus
} from "@/lib/store/jobPostsSlice"
import type { Job, Company } from "@/lib/types"
import { companiesApi, transformCompany } from "@/lib/api/companies"
import { format } from "date-fns"
import { MoreVertical, Eye, XCircle, Trash2 } from "lucide-react"

export default function JobsPage() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { jobPosts, pagination, isLoading, isUpdating, isDeleting, error, searchQuery, filterStatus } = useAppSelector(
    (state) => state.jobPosts
  )
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Job>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")

  useEffect(() => {
    dispatch(fetchAllJobPosts({ 
      page: currentPage, 
      limit: 10, 
      company: selectedCompanyId !== 'all' ? selectedCompanyId : undefined 
    }))
  }, [dispatch, currentPage, selectedCompanyId])

  // Load companies for the company filter select
  useEffect(() => {
    (async () => {
      try {
        const res = await companiesApi.getAllCompanies(1, 1000)
        const list = res.data.jobProviders.map(transformCompany)
        setCompanies(list)
      } catch (e) {
        // silently ignore for now; filter will show only "All Companies"
      }
    })()
  }, [])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getPageNumbers = () => {
    if (!pagination) return []
    const pages: (number | 'ellipsis')[] = []
    const totalPages = pagination.totalPages
    const current = pagination.currentPage

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (current >= totalPages - 2) {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = current - 1; i <= current + 1; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }

    return pages
  }

  // Filter jobs based on search and status
  const filteredJobs = useMemo(() => {
    let filtered = jobPosts.filter((job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (filterStatus !== "all") {
      filtered = filtered.filter((job) => job.status === filterStatus)
    }

    return filtered
  }, [jobPosts, searchQuery, filterStatus])

  const handleSearchChange = (value: string) => {
    dispatch(setSearchQuery(value))
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: "all" | "active" | "closed") => {
    dispatch(setFilterStatus(value))
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
        currentPage: currentPage
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
      await dispatch(deleteJobPost({ id: job.id, currentPage })).unwrap()
      
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

  const handleUpdate = async () => {
    if (!selectedJob) return

    try {
      await dispatch(updateJobPost({
        id: selectedJob.id,
        data: {
          title: formData.title,
          description: formData.description,
        },
        currentPage: currentPage
      })).unwrap()
      
      toast({
        title: "Success",
        description: "Job updated successfully",
      })
      setIsDetailOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      })
    }
  }

  // Show error toast when there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

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

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
              <SearchBar 
                placeholder="Search by job title..." 
                value={searchQuery} 
                onChange={handleSearchChange} 
              />
              <Select value={selectedCompanyId} onValueChange={(value) => { setSelectedCompanyId(value); setCurrentPage(1); }}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <>
              <DataTable columns={columns} data={filteredJobs} emptyMessage="No jobs found" />
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && !searchQuery && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} jobs
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (pagination.currentPage > 1) {
                              handlePageChange(pagination.currentPage - 1)
                            }
                          }}
                          className={
                            pagination.currentPage === 1
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
                              isActive={page === pagination.currentPage}
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
                            if (pagination.currentPage < pagination.totalPages) {
                              handlePageChange(pagination.currentPage + 1)
                            }
                          }}
                          className={
                            pagination.currentPage === pagination.totalPages
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
          <DetailDrawer open={isDetailOpen} onOpenChange={setIsDetailOpen} title="Edit Job">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  value={formData.companyName || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  disabled={isUpdating}
                />
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
              
              {selectedJob.status === "active" && (
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

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DetailDrawer>
        )}
      </AdminLayout>
    </AuthGuard>
  )
}

