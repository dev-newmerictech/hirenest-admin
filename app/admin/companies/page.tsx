// Companies management page with verification functionality

"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { SearchBar } from "@/components/admin/search-bar"
import { DataTable, type Column } from "@/components/admin/data-table"
import { StatusBadge } from "@/components/admin/status-badge"
import { DetailDrawer } from "@/components/admin/detail-drawer"
import { SourceBadge } from "@/components/admin/source-badge"
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
  loadCompaniesFromCache,
  fetchAllCompanies,
  toggleCompanyStatus,
  updateCompany,
  deleteCompany,
  setSearchQuery,
  clearError,
  syncCompanies,
} from "@/lib/store/companiesSlice"
import { useCanWrite } from "@/lib/rbacConfig"
import { exportToExcel } from "@/lib/utils/excelExport"
import type { Company } from "@/lib/types"
import { format, formatDistanceToNow } from "date-fns"
import { MoreVertical, Eye, Ban, CheckCircle, Trash2, ShieldCheck, ShieldX, User, RefreshCw, Download, XCircle } from "lucide-react"

const ITEMS_PER_PAGE = 10

export default function CompaniesPage() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const canWrite = useCanWrite()
  
  // Redux state
  const { allCompanies, isLoading, isUpdating, isDeleting, error, searchQuery, lastFetchedAt } = useAppSelector(
    (state) => state.companies
  )
  
  // Local state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Company>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [isSyncing, setIsSyncing] = useState(false)

  // Load from IndexedDB cache on mount, fetch from API if no cache
  useEffect(() => {
    const initData = async () => {
      if (allCompanies.length > 0 && lastFetchedAt) return

      const cacheResult = await dispatch(loadCompaniesFromCache()).unwrap()
      if (!cacheResult) {
        dispatch(fetchAllCompanies())
      }
    }
    initData()
  }, [dispatch, allCompanies.length, lastFetchedAt])

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

  // Filter companies based on search query (client-side)
  const filteredCompanies = useMemo(() => {
    const onboardedCompanies = allCompanies.filter(company => company.isOnboarded)
    if (!searchQuery.trim()) return onboardedCompanies
    
    const query = searchQuery.toLowerCase()
    return onboardedCompanies.filter(
      (company) =>
        company.name.toLowerCase().includes(query) ||
        company.email.toLowerCase().includes(query) ||
        company.industry.toLowerCase().includes(query)
    )
  }, [searchQuery, allCompanies])

  // Client-side pagination
  const totalItems = filteredCompanies.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredCompanies.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredCompanies, currentPage])

  // Refresh — incrementally sync or force re-fetch
  const handleRefresh = useCallback(async () => {
    setIsSyncing(true)
    try {
      if (lastFetchedAt) {
        await dispatch(syncCompanies(lastFetchedAt)).unwrap()
        toast({
          title: "Delta Sync Complete",
          description: `Successfully fetched incremental updates.`,
        })
      } else {
        await dispatch(fetchAllCompanies()).unwrap()
        toast({
          title: "Full Sync Complete",
          description: `Successfully loaded all companies.`,
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
    if (allCompanies.length === 0) {
      toast({ title: "No Data", description: "No companies to export.", variant: "destructive" })
      return
    }

    const rows = allCompanies.map((company) => ({
      'Company Name': company.name,
      Email: company.email,
      Industry: company.industry,
      Source: company.acquisitionSource || 'direct',
      'Registration Date': format(new Date(company.registrationDate), "yyyy-MM-dd"),
      Status: company.isActive ? 'Active' : 'Inactive',
      Verification: getVerificationStatus(company).charAt(0).toUpperCase() + getVerificationStatus(company).slice(1),
    }))

    exportToExcel(rows, `companies-${format(new Date(), 'yyyy-MM-dd')}`, 'Companies')
    toast({ title: "Export Complete", description: `Exported ${rows.length} companies to Excel.` })
  }, [allCompanies, toast])

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
    const isDocumentVerified = status === "approved"
    const result = await dispatch(
      updateCompany({
        id: company.id,
        data: { isDocumentVerified },
      })
    )

    if (updateCompany.fulfilled.match(result)) {
      toast({
        title: "Success",
        description: `Verification ${status} successfully`,
      })
    }
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
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getVerificationStatus = (company: Company): "approved" | "rejected" | "pending" => {
    if (typeof company.isDocumentVerified === "boolean") {
      return company.isDocumentVerified ? "approved" : "rejected"
    }

    if (company.verificationStatus === "approved" || company.verificationStatus === "rejected") {
      return company.verificationStatus
    }

    return "pending"
  }

  const selectedVerificationStatus = useMemo(
    () => (selectedCompany ? getVerificationStatus(selectedCompany) : "pending"),
    [selectedCompany]
  )

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
      render: (item) => {
        const status = getVerificationStatus(item)
        
        return (
          <Badge
            variant={
              status === "approved"
                ? "default"
                : status === "rejected"
                  ? "destructive"
                  : "secondary"
            }
            className={
              status === "approved"
                ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                : status === "rejected"
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  : ""
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
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
            <DropdownMenuItem onClick={() => item.id && router.push(`/admin/companies/${item.id}`)}>
              <User className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            {canWrite && (
              <>
                {getVerificationStatus(item) !== "approved" && (
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
            <PageHeader title="Companies" description="Manage company accounts and verifications" />
            <div className="flex items-center gap-2">
              <SearchBar placeholder="Search by company name..." value={searchQuery} onChange={handleSearchChange} />
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
                disabled={allCompanies.length === 0}
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
              {' · '}{allCompanies.length} records loaded
            </div>
          )}

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <>
              <DataTable columns={columns} data={paginatedCompanies} emptyMessage="No companies found" />
              
              {/* Client-side Pagination */}
              {totalPages > 1 && !searchQuery && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{' '}
                    {totalItems} companies
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
        {selectedCompany && (
          <DetailDrawer open={isDetailOpen} onOpenChange={setIsDetailOpen} title="Company Details">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <p className="text-sm font-medium">{selectedCompany.name}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <p className="text-sm font-medium">{selectedCompany.email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <p className="text-sm font-medium">{selectedCompany.industry}</p>
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
                <Label>Acquisition Source</Label>
                <div className="mt-1">
                  <SourceBadge source={selectedCompany.acquisitionSource} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Document Verification</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedVerificationStatus === "approved"
                        ? "default"
                        : selectedVerificationStatus === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                    className={
                      selectedVerificationStatus === "approved"
                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        : selectedVerificationStatus === "rejected"
                          ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          : ""
                    }
                  >
                    {selectedVerificationStatus === "approved"
                      ? "Verified"
                      : selectedVerificationStatus === "rejected"
                        ? "Rejected"
                        : "Pending"}
                  </Badge>
                </div>
              </div>
              {canWrite && selectedVerificationStatus !== "approved" && (
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
            </div>
          </DetailDrawer>
        )}
      </AdminLayout>
    </AuthGuard>
  )
}
