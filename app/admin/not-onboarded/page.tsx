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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DateRangeFilter } from "@/components/admin/date-range-filter"
import { DateRange } from "react-day-picker"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import {
  loadNotOnboardedFromCache,
  fetchAllNotOnboarded,
  deleteNotOnboardedUser,
  clearError,
  syncNotOnboarded,
} from "@/lib/store/notOnboardedSlice"
import { useCanWrite } from "@/lib/rbacConfig"
import { exportToExcel } from "@/lib/utils/excelExport"
import { format, formatDistanceToNow } from "date-fns"
import { MoreVertical, Eye, Trash2, User, RefreshCw, Download, Info } from "lucide-react"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"

const ITEMS_PER_PAGE = 10

export default function NotOnboardedPage() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const canWrite = useCanWrite()
  
  // Redux state
  const { allNotOnboarded, isLoading, isDeleting, error, lastFetchedAt } = useAppSelector(
    (state) => state.notOnboarded
  )
  
  // Local state
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // Load from IndexedDB cache on mount for instant display, then always fetch fresh data from API
  useEffect(() => {
    const initData = async () => {
      // Load cache first for instant display
      if (allNotOnboarded.length === 0) {
        await dispatch(loadNotOnboardedFromCache()).unwrap()
      }
      // Always fetch fresh data from API to avoid stale cache
      dispatch(fetchAllNotOnboarded())
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

  // Filter based on search query
  const filteredUsers = useMemo(() => {
    let result = allNotOnboarded

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (user) =>
          user && user.id && (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
          )
      )
    }

    if (dateRange?.from) {
      const from = startOfDay(dateRange.from)
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
      
      result = result.filter((user) => {
        if (!user.registrationDate) return false
        const userDate = new Date(user.registrationDate)
        return isWithinInterval(userDate, { start: from, end: to })
      })
    }

    return result
  }, [searchQuery, dateRange, allNotOnboarded])

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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
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
      label: (
        <div className="flex items-center gap-2">
          Onboarding Stage
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent sideOffset={8} className="max-w-[400px] p-4 text-sm bg-white text-slate-900 border border-slate-200 shadow-md">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 border-b pb-1">Onboarding Progress</h4>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-slate-900 whitespace-nowrap">Stage 0:</span> 
                      <span>Signed up (Email/Social), but no details filled yet.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-slate-900 whitespace-nowrap">Stage 1:</span> 
                      <span>Basic Details screen reached and completed.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-slate-900 whitespace-nowrap">Stage 2:</span> 
                      <span>Preferences & Role screen reached and completed.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-slate-900 whitespace-nowrap">Stage 3:</span> 
                      <span>Experience / Company Details screen reached and completed.</span>
                    </li>
                  </ul>
                  <p className="text-xs text-slate-400 mt-2 italic">* Stages represent the last screen the user successfully completed before dropping off.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <PageHeader
              title="Not Onboarded Users"
              description="Manage users who have signed up but have not yet created a profile."
            />
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
                disabled={allNotOnboarded.length === 0}
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
              {' · '}{allNotOnboarded.length} records loaded
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search not onboarded users..." 
            />
            <DateRangeFilter date={dateRange} setDate={setDateRange} />
          </div>

          {isLoading ? (
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
          ) : (
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <DataTable 
                columns={columns} 
                data={paginatedUsers} 
                emptyMessage="No users found"
              />
            </div>
          )}

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

                  {/* Stage-wise Onboarding Data Display */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Onboarding Data Breakdown</h4>
                    
                    {selectedUser.role === 'jobseeker' ? (
                      <div className="space-y-6">
                        {/* STAGE 1 */}
                        <div className="relative pl-6 border-l-2 border-emerald-500">
                          <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-emerald-500" />
                          <h5 className="text-xs font-bold uppercase text-emerald-600 tracking-wider">Stage 1: Role Selection</h5>
                          <p className="text-sm text-foreground mt-1">Selected Role: <span className="font-semibold text-emerald-700">Job Seeker</span></p>
                        </div>

                        {/* STAGE 2 */}
                        {(() => {
                          const hasResume = selectedUser.draftProfile?.documents?.some((doc: any) => doc?.name === 'resume' || doc?.url);
                          const isPastStage2 = selectedUser.onboardingStage >= 2 || hasResume;
                          return (
                            <div className={`relative pl-6 border-l-2 ${isPastStage2 ? 'border-emerald-500' : 'border-slate-200'}`}>
                              <div className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${isPastStage2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                              <h5 className={`text-xs font-bold uppercase tracking-wider ${isPastStage2 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                Stage 2: Resume Upload
                              </h5>
                              {hasResume ? (
                                <p className="text-sm text-foreground mt-1">
                                  Resume Uploaded: <span className="font-medium text-emerald-700">Yes</span>
                                </p>
                              ) : isPastStage2 ? (
                                <p className="text-sm text-slate-500 mt-1">Skipped (Chose manual entry)</p>
                              ) : (
                                <p className="text-sm text-slate-400 mt-1 italic">Pending</p>
                              )}
                            </div>
                          );
                        })()}

                        {/* STAGE 3 */}
                        {(() => {
                          const isPastStage3 = selectedUser.onboardingStage >= 3 || selectedUser.draftProfile;
                          const profile = selectedUser.draftProfile;
                          return (
                            <div className={`relative pl-6 border-l-2 ${isPastStage3 ? 'border-emerald-500' : 'border-slate-200'}`}>
                              <div className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${isPastStage3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                              <h5 className={`text-xs font-bold uppercase tracking-wider ${isPastStage3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                Stage 3: Contact & Location
                              </h5>
                              {isPastStage3 && profile ? (
                                <div className="mt-2 space-y-2 text-sm">
                                  {selectedUser.name && (
                                    <div>
                                      <span className="text-xs text-muted-foreground block uppercase">Name</span>
                                      <span className="text-foreground font-medium">{selectedUser.name}</span>
                                    </div>
                                  )}
                                  {profile.mobile && (
                                    <div>
                                      <span className="text-xs text-muted-foreground block uppercase">Phone Number</span>
                                      <span className="text-foreground font-medium">
                                        {profile.mobile.countryCode && `+${profile.mobile.countryCode} `}
                                        {profile.mobile.mobileNumber}
                                      </span>
                                    </div>
                                  )}
                                  {profile.address && (
                                    <div>
                                      <span className="text-xs text-muted-foreground block uppercase">Location</span>
                                      <span className="text-foreground font-medium">
                                        {[
                                          profile.address.city,
                                          profile.address.state,
                                          profile.address.country
                                        ].filter(Boolean).join(', ') || 'N/A'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 mt-1 italic">Pending</p>
                              )}
                            </div>
                          );
                        })()}

                        {/* STAGE 4 */}
                        {(() => {
                          const isPastStage4 = selectedUser.onboardingStage >= 4 || selectedUser.draftProfile?.experiences?.length > 0 || selectedUser.draftProfile?.education?.length > 0;
                          const profile = selectedUser.draftProfile;
                          return (
                            <div className={`relative pl-6 border-l-2 ${isPastStage4 ? 'border-emerald-500' : 'border-slate-200'}`}>
                              <div className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${isPastStage4 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                              <h5 className={`text-xs font-bold uppercase tracking-wider ${isPastStage4 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                Stage 4: Background / Experience
                              </h5>
                              {isPastStage4 && profile ? (
                                <div className="mt-2 space-y-2 text-sm">
                                  {profile.experiences?.length > 0 ? (
                                    <div>
                                      <span className="text-xs text-muted-foreground block uppercase">Work Experiences</span>
                                      <span className="text-foreground font-medium">{profile.experiences.length} record(s)</span>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400">No work experiences filled</p>
                                  )}
                                  {profile.education?.length > 0 ? (
                                    <div>
                                      <span className="text-xs text-muted-foreground block uppercase">Education</span>
                                      <span className="text-foreground font-medium">{profile.education.length} record(s)</span>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400">No education records filled</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 mt-1 italic">Pending</p>
                              )}
                            </div>
                          );
                        })()}

                        {/* STAGE 5 */}
                        {(() => {
                          const isPastStage5 = selectedUser.onboardingStage >= 5 || selectedUser.draftProfile?.preferences?.industries?.length > 0;
                          const profile = selectedUser.draftProfile;
                          return (
                            <div className={`relative pl-6 ${isPastStage5 ? 'border-l-2 border-emerald-500' : 'border-l-2 border-slate-200'}`}>
                              <div className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${isPastStage5 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                              <h5 className={`text-xs font-bold uppercase tracking-wider ${isPastStage5 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                Stage 5: Job Preferences
                              </h5>
                              {isPastStage5 && profile?.preferences ? (
                                <div className="mt-2 space-y-2 text-sm">
                                  {profile.preferences.industries?.length > 0 && (
                                    <div>
                                      <span className="text-xs text-muted-foreground block uppercase">Preferred Industries</span>
                                      <span className="text-foreground font-medium">{profile.preferences.industries.join(', ')}</span>
                                    </div>
                                  )}
                                  {profile.preferences.categories?.length > 0 && (
                                    <div>
                                      <span className="text-xs text-muted-foreground block uppercase">Preferred Categories</span>
                                      <span className="text-foreground font-medium">{profile.preferences.categories.join(', ')}</span>
                                    </div>
                                  )}
                                  {profile.preferences.experienceLevel && (
                                    <div>
                                      <span className="text-xs text-muted-foreground block uppercase">Experience Level</span>
                                      <span className="text-foreground font-medium capitalize">{profile.preferences.experienceLevel}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 mt-1 italic">Pending</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* STAGE 1 */}
                        <div className="relative pl-6 border-l-2 border-emerald-500">
                          <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-emerald-500" />
                          <h5 className="text-xs font-bold uppercase text-emerald-600 tracking-wider">Stage 1: Role Selection</h5>
                          <p className="text-sm text-foreground mt-1">Selected Role: <span className="font-semibold text-emerald-700">Job Provider (Company)</span></p>
                        </div>

                        {/* STAGE 2 */}
                        {(() => {
                          const isPastStage2 = selectedUser.onboardingStage >= 2 || selectedUser.draftProfile;
                          const profile = selectedUser.draftProfile;
                          return (
                            <div className={`relative pl-6 ${isPastStage2 ? 'border-l-2 border-emerald-500' : 'border-l-2 border-slate-200'}`}>
                              <div className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${isPastStage2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                              <h5 className={`text-xs font-bold uppercase tracking-wider ${isPastStage2 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                Stage 2: Business Profile
                              </h5>
                              {isPastStage2 && profile ? (
                                <div className="mt-2 space-y-2 text-sm">
                                  {profile.name && (
                                    <div>
                                      <span className="text-xs text-muted-foreground block uppercase">Company Name</span>
                                      <span className="text-foreground font-medium">{profile.name}</span>
                                    </div>
                                  )}
                                  {profile.einNumber && (
                                    <div>
                                      <span className="text-xs text-muted-foreground block uppercase">EIN Number</span>
                                      <span className="text-foreground font-medium">{profile.einNumber}</span>
                                    </div>
                                  )}
                                  {profile.address && (
                                    <div>
                                      <span className="text-xs text-muted-foreground block uppercase">Company Address</span>
                                      <span className="text-foreground font-medium">
                                        {[
                                          profile.address.addressLine1,
                                          profile.address.city,
                                          profile.address.state,
                                          profile.address.country
                                        ].filter(Boolean).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 mt-1 italic">Pending</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
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
