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
  loadNotOnboardedFromCache,
  fetchAllNotOnboarded,
  deleteNotOnboardedUser,
  setSearchQuery,
  clearError,
  syncNotOnboarded,
} from "@/lib/store/notOnboardedSlice"
import { useCanWrite } from "@/lib/rbacConfig"
import { exportToExcel } from "@/lib/utils/excelExport"
import { format, formatDistanceToNow } from "date-fns"
import { MoreVertical, Eye, Trash2, User, RefreshCw, Download } from "lucide-react"

const ITEMS_PER_PAGE = 10

export default function NotOnboardedPage() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const canWrite = useCanWrite()
  
  // Redux state
  const { allNotOnboarded, isLoading, isDeleting, error, searchQuery, lastFetchedAt } = useAppSelector(
    (state) => state.notOnboarded
  )
  
  // Local state
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSyncing, setIsSyncing] = useState(false)

  // Load from IndexedDB cache on mount, fetch from API if no cache
  useEffect(() => {
    const initData = async () => {
      if (allNotOnboarded.length > 0 && lastFetchedAt) return

      const cacheResult = await dispatch(loadNotOnboardedFromCache()).unwrap()
      if (!cacheResult) {
        dispatch(fetchAllNotOnboarded())
      }
    }
    initData()
  }, [dispatch, allNotOnboarded.length, lastFetchedAt])

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

  // Filter based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allNotOnboarded
    
    const query = searchQuery.toLowerCase()
    return allNotOnboarded.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }, [searchQuery, allNotOnboarded])

  // Pagination
  const totalItems = filteredUsers.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredUsers, currentPage])

  // Refresh (sync or fetch all)
  const handleRefresh = useCallback(async () => {
    setIsSyncing(true)
    try {
      if (lastFetchedAt) {
        await dispatch(syncNotOnboarded(lastFetchedAt)).unwrap()
        toast({
          title: "Sync Complete",
          description: `Successfully fetched incremental updates.`,
        })
      } else {
        await dispatch(fetchAllNotOnboarded()).unwrap()
        toast({
          title: "Fetch Complete",
          description: `Successfully loaded all users.`,
        })
      }
    } catch {
      // Handled by slice
    } finally {
      setIsSyncing(false)
    }
  }, [dispatch, toast, lastFetchedAt])

  const handleExport = useCallback(() => {
    if (allNotOnboarded.length === 0) {
      toast({ title: "No Data", description: "No users to export.", variant: "destructive" })
      return
    }

    const rows = allNotOnboarded.map((user) => ({
      'Name': user.name,
      'Email': user.email,
      'Source': user.source || 'direct',
      'Registration Date': format(new Date(user.registrationDate), "yyyy-MM-dd"),
    }))
    
    exportToExcel(rows, `not_onboarded_${format(new Date(), 'yyyy-MM-dd')}`)
  }, [allNotOnboarded, toast])

  const handleSearch = (value: string) => {
    dispatch(setSearchQuery(value))
    setCurrentPage(1)
  }

  const handleDelete = async (user: any) => {
    if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      try {
        await dispatch(deleteNotOnboardedUser(user.id)).unwrap()
        toast({
          title: "User deleted",
          description: "The user account has been deleted successfully.",
        })
        setIsDetailOpen(false)
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to delete user",
          variant: "destructive",
        })
      }
    }
  }

  const columns: Column<any>[] = [
    {
      key: "name",
      label: "Name",
      render: (item) => (
        <button
          onClick={() => {
            setSelectedUser(item)
            setIsDetailOpen(true)
          }}
          className="text-foreground hover:text-primary transition-colors font-medium text-left"
        >
          {item.name}
        </button>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "registrationDate",
      label: "Registration Date",
      render: (item) => format(new Date(item.registrationDate), "MMM dd, yyyy"),
    },
    {
      key: "role",
      label: "Role",
      render: (item) => {
        if (item.role === 'jobseeker') return 'Job Seeker'
        if (item.role === 'jobprovider') return 'Job Provider'
        return 'N/A'
      }
    },
    {
      key: "onboardingStage",
      label: "Onboarding Stage",
      render: (item) => item.onboardingStage ? `Stage ${item.onboardingStage}` : 'N/A'
    },
    {
      key: "source",
      label: "Source",
      render: (item) => <SourceBadge source={item.source} />
    },
    {
      key: "actions",
      label: "Actions",
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem 
              onClick={() => {
                setSelectedUser(item)
                setIsDetailOpen(true)
              }}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> View Details
            </DropdownMenuItem>
            {canWrite && (
              <DropdownMenuItem onClick={() => handleDelete(item)} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  // Generating Pagination items
  const renderPaginationItems = () => {
    let items = []
    
    // Always show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink 
          onClick={() => setCurrentPage(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    )

    // Calculate window
    let startPage = Math.max(2, currentPage - 1)
    let endPage = Math.min(totalPages - 1, currentPage + 1)
    
    if (currentPage <= 3) {
      endPage = Math.min(totalPages - 1, 4)
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - 3)
    }

    if (startPage > 2) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    if (endPage < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Always show last page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          <PageHeader
            title="Not Onboarded Users"
            description="Manage users who have signed up but have not yet created a profile."
          />

          <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
            <SearchBar 
              onChange={handleSearch} 
              placeholder="Search by name or email..." 
              value={searchQuery}
            />
            
            <div className="flex items-center gap-2 self-end tablet:self-auto">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isSyncing || isLoading}
                className="shadow-sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Refresh'}
              </Button>
              <Button 
                onClick={handleExport}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <DataTable 
              columns={columns} 
              data={paginatedUsers} 
            />
          </div>

          {!isLoading && totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {renderPaginationItems()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          <DetailDrawer
            open={isDetailOpen}
            onOpenChange={setIsDetailOpen}
            title="User Details"
          >
            {selectedUser && (
              <div className="space-y-6 pb-6">
                <div className="flex items-center space-x-4 border-b border-border pb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{selectedUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    <div className="mt-2">
                      <SourceBadge source={selectedUser.source} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Registration Date</Label>
                      <div className="mt-1.5 text-sm font-medium text-foreground">
                        {format(new Date(selectedUser.registrationDate), "MMMM dd, yyyy")}
                        <span className="text-muted-foreground font-normal ml-2">
                          ({formatDistanceToNow(new Date(selectedUser.registrationDate))} ago)
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Acquisition Source</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Source:</span>
                          <span className="text-sm text-muted-foreground">{selectedUser.sourceData?.utm_source || 'direct'}</span>
                        </div>
                        {selectedUser.sourceData?.utm_medium && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Medium:</span>
                            <span className="text-sm text-muted-foreground">{selectedUser.sourceData.utm_medium}</span>
                          </div>
                        )}
                        {selectedUser.sourceData?.utm_campaign && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Campaign:</span>
                            <span className="text-sm text-muted-foreground">{selectedUser.sourceData.utm_campaign}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Onboarding Progress</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Role:</span>
                          <span className="text-sm text-muted-foreground">
                            {selectedUser.role === 'jobseeker' ? 'Job Seeker' : selectedUser.role === 'jobprovider' ? 'Job Provider' : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Stage Reached:</span>
                          <span className="text-sm text-muted-foreground">
                            {selectedUser.onboardingStage ? `Stage ${selectedUser.onboardingStage}` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DetailDrawer>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
