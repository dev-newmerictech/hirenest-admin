// Companies management page with verification functionality

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
import { Badge } from "@/components/ui/badge"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import {
  fetchAllCompanies,
  toggleCompanyStatus,
  updateCompany,
  deleteCompany,
  setSearchQuery,
  clearError,
} from "@/lib/store/companiesSlice"
import type { Company } from "@/lib/types"
import { format } from "date-fns"
import { MoreVertical, Eye, Ban, CheckCircle, Trash2, ShieldCheck, ShieldX } from "lucide-react"

export default function CompaniesPage() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  
  // Redux state
  const { companies, pagination, isLoading, isUpdating, isDeleting, error, searchQuery } = useAppSelector(
    (state) => state.companies
  )
  
  // Local state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Company>>({})
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch companies on mount and when page changes
  useEffect(() => {
    dispatch(fetchAllCompanies({ page: currentPage, limit: 10 }))
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

  // Filter companies based on search query
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies
    
    const query = searchQuery.toLowerCase()
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(query) ||
        company.email.toLowerCase().includes(query) ||
        company.industry.toLowerCase().includes(query)
    )
  }, [searchQuery, companies])

  const handleView = (company: Company) => {
    setSelectedCompany(company)
    setFormData(company)
    setIsDetailOpen(true)
  }

  const handleToggleStatus = async (company: Company) => {
    const result = await dispatch(
      toggleCompanyStatus({ 
        id: company.id, 
        isActive: !company.isActive 
      })
    )
    
    if (toggleCompanyStatus.fulfilled.match(result)) {
      toast({
        title: "Success",
        description: `Company ${company.isActive ? "deactivated" : "activated"} successfully`,
      })
    }
  }

  const handleVerification = async (company: Company, status: "approved" | "rejected") => {
    // Note: Verification endpoint not provided in API list, keeping as is for now
    // TODO: Add verification API endpoint when available
    toast({
      title: "Info",
      description: "Verification API endpoint not yet configured",
      variant: "default",
    })
  }

  const handleDelete = async (company: Company) => {
    if (!confirm(`Are you sure you want to delete ${company.name}?`)) return

    const result = await dispatch(deleteCompany(company.id))
    
    if (deleteCompany.fulfilled.match(result)) {
      toast({
        title: "Success",
        description: "Company deleted successfully",
      })
      setIsDetailOpen(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedCompany) return

    const result = await dispatch(
      updateCompany({
        id: selectedCompany.id,
        data: {
          name: formData.name,
          email: formData.email,
          industry: formData.industry,
        },
      })
    )
    
    if (updateCompany.fulfilled.match(result)) {
      toast({
        title: "Success",
        description: "Company updated successfully",
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

  const columns: Column<Company>[] = [
    {
      key: "name",
      label: "Company Name",
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
    { key: "industry", label: "Industry" },
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
      key: "verificationStatus",
      label: "Verification",
      render: (item) => (
        <Badge
          variant={
            item.verificationStatus === "approved"
              ? "default"
              : item.verificationStatus === "rejected"
                ? "destructive"
                : "secondary"
          }
          className={
            item.verificationStatus === "approved"
              ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
              : item.verificationStatus === "rejected"
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                : ""
          }
        >
          {item.verificationStatus.charAt(0).toUpperCase() + item.verificationStatus.slice(1)}
        </Badge>
      ),
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
            {item.verificationStatus === "pending" && (
              <>
                <DropdownMenuItem onClick={() => handleVerification(item, "approved")}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Approve Verification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleVerification(item, "rejected")}>
                  <ShieldX className="mr-2 h-4 w-4" />
                  Reject Verification
                </DropdownMenuItem>
              </>
            )}
            {item.isActive ? (
              <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
                <Ban className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleDelete(item)} className="text-destructive">
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

          <div className="flex items-center justify-between">
            <PageHeader title="Companies" description="Manage company accounts and verifications" />
            <SearchBar placeholder="Search by company name..." value={searchQuery} onChange={handleSearchChange} />
          </div>

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <>
              <DataTable columns={columns} data={filteredCompanies} emptyMessage="No companies found" />
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && !searchQuery && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} companies
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
        {selectedCompany && (
          <DetailDrawer open={isDetailOpen} onOpenChange={setIsDetailOpen} title="Edit Company">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
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
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry || ""}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Registration Date</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedCompany.registrationDate), "MMMM dd, yyyy")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="mt-1">
                  <StatusBadge status={selectedCompany.isActive} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Verification Status</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedCompany.verificationStatus === "approved"
                        ? "default"
                        : selectedCompany.verificationStatus === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                    className={
                      selectedCompany.verificationStatus === "approved"
                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        : selectedCompany.verificationStatus === "rejected"
                          ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          : ""
                    }
                  >
                    {selectedCompany.verificationStatus.charAt(0).toUpperCase() +
                      selectedCompany.verificationStatus.slice(1)}
                  </Badge>
                </div>
              </div>
              {selectedCompany.verificationStatus === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => {
                      handleVerification(selectedCompany, "approved")
                      setIsDetailOpen(false)
                    }}
                    className="flex-1"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      handleVerification(selectedCompany, "rejected")
                      setIsDetailOpen(false)
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <ShieldX className="mr-2 h-4 w-4" />
                    Reject
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
