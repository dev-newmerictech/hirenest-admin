// Job Seekers management page

"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { SearchBar } from "@/components/admin/search-bar"
import { DataTable, type Column } from "@/components/admin/data-table"
import { ActionButtons } from "@/components/admin/action-buttons"
import { StatusBadge } from "@/components/admin/status-badge"
import { DetailDrawer } from "@/components/admin/detail-drawer"
import { SourceBadge } from "@/components/admin/source-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { DateRangeFilter } from "@/components/admin/date-range-filter"
import { DateRange } from "react-day-picker"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import {
  loadJobSeekersFromCache,
  fetchAllJobSeekers,
  toggleJobSeekerStatus,
  updateJobSeeker,
  deleteJobSeeker,
  clearError,
  syncJobSeekers,
} from "@/lib/store/jobSeekersSlice"
import { useCanWrite } from "@/lib/rbacConfig"
import { exportToExcel } from "@/lib/utils/excelExport"
import type { JobSeeker } from "@/lib/types"
import { format, formatDistanceToNow } from "date-fns"
import { RefreshCw, Download, CheckCircle, XCircle } from "lucide-react"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"

const ITEMS_PER_PAGE = 10

export default function JobSeekersPage() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const canWrite = useCanWrite()
  
  // Redux state
  const { allJobSeekers, isLoading, isUpdating, isDeleting, error, lastFetchedAt } = useAppSelector(
    (state) => state.jobSeekers
  )
  
  // Local state
  const [selectedJobSeeker, setSelectedJobSeeker] = useState<JobSeeker | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<JobSeeker>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // Load from IndexedDB cache for instant display, then always fetch fresh data from API
  useEffect(() => {
    const initData = async () => {
      // Load cache first for instant display
      if (allJobSeekers.length === 0) {
        await dispatch(loadJobSeekersFromCache()).unwrap()
      }
      // Always fetch fresh data from API to avoid stale cache
      dispatch(fetchAllJobSeekers())
    }
    initData()
  }, [dispatch])

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
      dispatch(clearError())
    }
  }, [error, toast, dispatch])

  // Filter job seekers based on search query (client-side)
  const filteredJobSeekers = useMemo(() => {
    const onboardedSeekers = allJobSeekers.filter(seeker => seeker && seeker.id && seeker.isOnboarded !== false)
    
    let result = onboardedSeekers

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (seeker) =>
          seeker.name.toLowerCase().includes(query) ||
          seeker.email.toLowerCase().includes(query) ||
          (seeker.city && seeker.city.toLowerCase().includes(query)) ||
          (seeker.state && seeker.state.toLowerCase().includes(query))
      )
    }

    if (dateRange?.from) {
      const from = startOfDay(dateRange.from)
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
      
      result = result.filter((seeker) => {
        if (!seeker.registrationDate) return false
        const seekerDate = new Date(seeker.registrationDate)
        return isWithinInterval(seekerDate, { start: from, end: to })
      })
    }

    return result
  }, [searchQuery, dateRange, allJobSeekers])

  // Client-side pagination
  const totalItems = filteredJobSeekers.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const paginatedJobSeekers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredJobSeekers.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredJobSeekers, currentPage])

  // Refresh — incrementally sync or force re-fetch
  const handleRefresh = useCallback(async () => {
    setIsSyncing(true)
    try {
      if (lastFetchedAt) {
        await dispatch(syncJobSeekers(lastFetchedAt)).unwrap()
        toast({
          title: "Delta Sync Complete",
          description: `Successfully fetched incremental updates.`,
        })
      } else {
        await dispatch(fetchAllJobSeekers()).unwrap()
        toast({
          title: "Full Sync Complete",
          description: `Successfully loaded all job seekers.`,
        })
      }
    } catch {
      // Error is handled by the slice
    } finally {
      setIsSyncing(false)
    }
  }, [dispatch, toast, lastFetchedAt])

  // Export to Excel — from in-memory data (no API call)
  const handleExport = useCallback(() => {
    if (allJobSeekers.length === 0) {
      toast({ title: "No Data", description: "No job seekers to export.", variant: "destructive" })
      return
    }

    const rows = allJobSeekers.map((seeker) => ({
      Name: seeker.name,
      Email: seeker.email,
      Gender: seeker.gender || 'N/A',
      City: seeker.city || 'N/A',
      State: seeker.state || 'N/A',
      Country: seeker.country || 'N/A',
      Source: seeker.acquisitionSource || 'direct',
      'Registration Date': format(new Date(seeker.registrationDate), "yyyy-MM-dd"),
      Status: seeker.isActive ? 'Active' : 'Inactive',
    }))

    exportToExcel(rows, `job-seekers-${format(new Date(), 'yyyy-MM-dd')}`, 'Job Seekers')
    toast({ title: "Export Complete", description: `Exported ${rows.length} job seekers to Excel.` })
  }, [allJobSeekers, toast])

  const handleView = (jobSeeker: JobSeeker) => {
    setSelectedJobSeeker(jobSeeker)
    setFormData(jobSeeker)
    setIsDetailOpen(true)
  }

  const handleToggleStatus = async (jobSeeker: JobSeeker) => {
    const result = await dispatch(
      toggleJobSeekerStatus({ 
        id: jobSeeker.id, 
        isActive: !jobSeeker.isActive 
      })
    )
    
    if (toggleJobSeekerStatus.fulfilled.match(result)) {
      toast({
        title: "Success",
        description: `Job seeker ${jobSeeker.isActive ? "deactivated" : "activated"} successfully`,
      })
    }
  }

  const handleDelete = async (jobSeeker: JobSeeker) => {
    if (!confirm(`Are you sure you want to delete ${jobSeeker.name}?`)) return

    const result = await dispatch(deleteJobSeeker(jobSeeker.id))
    
    if (deleteJobSeeker.fulfilled.match(result)) {
      toast({
        title: "Success",
        description: "Job seeker deleted successfully",
      })
      setIsDetailOpen(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedJobSeeker) return

    const result = await dispatch(
      updateJobSeeker({
        id: selectedJobSeeker.id,
        data: {
          name: formData.name,
          email: formData.email,
        },
      })
    )
    
    if (updateJobSeeker.fulfilled.match(result)) {
      toast({
        title: "Success",
        description: "Job seeker updated successfully",
      })
      setIsDetailOpen(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('ellipsis')
      }
      
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }
      
      pages.push(totalPages)
    }
    
    return pages
  }

  const columns: Column<JobSeeker>[] = [
    {
      key: "name",
      label: "Name",
      render: (item) => (
        <button
          onClick={() => handleView(item)}
          className="text-foreground hover:text-primary transition-colors font-medium text-left"
        >
          {item.name}
        </button>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "gender",
      label: "Gender",
      render: (item) => <span className="capitalize">{item.gender || 'N/A'}</span>,
    },
    {
      key: "city",
      label: "Location",
      render: (item) => {
        const parts = [item.city, item.state].filter(Boolean)
        return <span>{parts.length > 0 ? parts.join(', ') : 'N/A'}</span>
      },
    },
    {
      key: "registrationDate",
      label: "Registration Date",
      render: (item) => format(new Date(item.registrationDate), "MMM dd, yyyy"),
    },
    {
      key: "isActive",
      label: "Status",
      render: (item) => <StatusBadge status={item.isActive} />,
    },
    {
      key: "acquisitionSource",
      label: "Source",
      render: (item) => <SourceBadge source={item.acquisitionSource} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (item) => (
        <ActionButtons
          onView={() => handleView(item)}
          onViewProfile={() => item.id && router.push(`/admin/job-seekers/${item.id}`)}
          {...(canWrite ? {
            onActivate: () => handleToggleStatus(item),
            onDeactivate: () => handleToggleStatus(item),
            onDelete: () => handleDelete(item),
          } : {})}
          isActive={item.isActive}
        />
      ),
    },
  ]

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <PageHeader title="Job Seekers" description="Manage job seeker accounts" />
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
                disabled={allJobSeekers.length === 0}
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
              {' · '}{allJobSeekers.length} records loaded
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <SearchBar 
              onChange={setSearchQuery} 
              placeholder="Search by name, email, or location..." 
              value={searchQuery}
            />
            <DateRangeFilter date={dateRange} setDate={setDateRange} />
          </div>

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <>
              <DataTable columns={columns} data={paginatedJobSeekers} emptyMessage="No job seekers found" />
              
              {/* Client-side Pagination */}
              {totalPages > 1 && !searchQuery && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{' '}
                    {totalItems} job seekers
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
        {selectedJobSeeker && (
          <DetailDrawer open={isDetailOpen} onOpenChange={setIsDetailOpen} title={canWrite ? "Edit Job Seeker" : "Job Seeker Details"}>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                {canWrite ? (
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{selectedJobSeeker.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {canWrite ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{selectedJobSeeker.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <p className="text-sm text-muted-foreground capitalize">{selectedJobSeeker.gender || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <p className="text-sm text-muted-foreground">
                  {[selectedJobSeeker.city, selectedJobSeeker.state, selectedJobSeeker.country].filter(Boolean).join(', ') || 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Registration Date</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedJobSeeker.registrationDate), "MMMM dd, yyyy")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="mt-1">
                  <StatusBadge status={selectedJobSeeker.isActive} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Acquisition Source</Label>
                <div className="mt-1">
                  <SourceBadge source={selectedJobSeeker.acquisitionSource} />
                </div>
              </div>

              {canWrite && (
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)} disabled={isUpdating}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate} disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save Changes"}
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
