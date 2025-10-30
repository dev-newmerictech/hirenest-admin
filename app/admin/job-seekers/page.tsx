// Job Seekers management page

"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { SearchBar } from "@/components/admin/search-bar"
import { DataTable, type Column } from "@/components/admin/data-table"
import { ActionButtons } from "@/components/admin/action-buttons"
import { StatusBadge } from "@/components/admin/status-badge"
import { DetailDrawer } from "@/components/admin/detail-drawer"
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
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import {
  fetchAllJobSeekers,
  toggleJobSeekerStatus,
  updateJobSeeker,
  deleteJobSeeker,
  setSearchQuery,
  clearError,
} from "@/lib/store/jobSeekersSlice"
import type { JobSeeker } from "@/lib/types"
import { format } from "date-fns"

export default function JobSeekersPage() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const router = useRouter()
  
  // Redux state
  const { jobSeekers, pagination, isLoading, isUpdating, isDeleting, error, searchQuery } = useAppSelector(
    (state) => state.jobSeekers
  )
  
  // Local state
  const [selectedJobSeeker, setSelectedJobSeeker] = useState<JobSeeker | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<JobSeeker>>({})
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch job seekers on mount and when page changes
  useEffect(() => {
    dispatch(fetchAllJobSeekers({ page: currentPage, limit: 10 }))
  }, [dispatch, currentPage])

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

  // Filter job seekers based on search query
  const filteredJobSeekers = useMemo(() => {
    if (!searchQuery.trim()) return jobSeekers
    
    const query = searchQuery.toLowerCase()
    return jobSeekers.filter(
      (seeker) =>
        seeker.name.toLowerCase().includes(query) ||
        seeker.email.toLowerCase().includes(query) ||
        seeker.phone.toLowerCase().includes(query)
    )
  }, [searchQuery, jobSeekers])

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
          phone: formData.phone,
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
    dispatch(setSearchQuery(value))
    // Reset to page 1 when searching
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return []
    
    const { currentPage, totalPages } = pagination
    const pages: (number | 'ellipsis')[] = []
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('ellipsis')
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }
      
      // Always show last page
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
    { key: "phone", label: "Phone" },
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
      key: "actions",
      label: "Actions",
      render: (item) => (
        <ActionButtons
          onView={() => handleView(item)}
          onViewProfile={() => router.push(`/admin/job-seekers/${item.id}`)}
          onActivate={() => handleToggleStatus(item)}
          onDeactivate={() => handleToggleStatus(item)}
          onDelete={() => handleDelete(item)}
          isActive={item.isActive}
        />
      ),
    },
  ]

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">

          <div className="flex items-center justify-between">
            <PageHeader title="Job Seekers" description="Manage job seeker accounts" />
            <SearchBar 
              placeholder="Search by name, email or phone..." 
              value={searchQuery} 
              onChange={handleSearchChange} 
            />
          </div>

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <>
              <DataTable columns={columns} data={filteredJobSeekers} emptyMessage="No job seekers found" />
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && !searchQuery && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} job seekers
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
        {selectedJobSeeker && (
          <DetailDrawer open={isDetailOpen} onOpenChange={setIsDetailOpen} title="Edit Job Seeker">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
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

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DetailDrawer>
        )}
      </AdminLayout>
    </AuthGuard>
  )
}
