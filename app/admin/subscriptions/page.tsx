"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Briefcase,
  CreditCard,
  Plus,
  Eye,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import type { SubscriptionWithProfile, SubscriptionPlan, SubscriptionAnalytics } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  trial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  free: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelled: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithProfile[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "seeker" | "provider">("all")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Dialog state
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithProfile | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAddCreditsOpen, setIsAddCreditsOpen] = useState(false)
  const [creditsToAdd, setCreditsToAdd] = useState(0)
  const [creditReason, setCreditReason] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [activeTab, statusFilter, search, page])

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      })
      if (activeTab !== "all") params.append("type", activeTab)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (search) params.append("search", search)

      const [subsRes, plansRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/subscription/subscriptions?${params}`),
        fetch(`${API_BASE_URL}/admin/subscription/plans`),
      ])

      const subsData = await subsRes.json()
      const plansData = await plansRes.json()

      if (subsData.success) {
        setSubscriptions(subsData.data.subscriptions)
        setTotalPages(subsData.data.pagination.pages)
      }
      if (plansData.success) {
        setPlans(plansData.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/subscription/analytics`)
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    }
  }

  const handleViewDetails = async (profileId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/subscription/subscriptions/${profileId}`
      )
      const data = await response.json()
      if (data.success) {
        setSelectedSubscription(data.data.subscription)
        setIsDetailsOpen(true)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subscription details",
        variant: "destructive",
      })
    }
  }

  const handleAddCredits = async () => {
    if (!selectedSubscription || creditsToAdd <= 0) return

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/subscription/subscriptions/${selectedSubscription.profileId}/credits`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credits: creditsToAdd,
            reason: creditReason || "Admin added credits",
          }),
        }
      )
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: `${creditsToAdd} credits added successfully`,
        })
        setIsAddCreditsOpen(false)
        setCreditsToAdd(0)
        setCreditReason("")
        fetchData()
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add credits",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (profileId: string, status: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/subscription/subscriptions/${profileId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      )
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Subscription status updated",
        })
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const getAvailableCredits = (sub: SubscriptionWithProfile) => {
    return sub.credits.planCredits + sub.credits.addOnCredits - sub.credits.usedCredits
  }

  if (loading) {
    return (
      <AuthGuard>
        <AdminLayout>
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </AdminLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Subscription Management"
            description="Manage user subscriptions and credits"
          />

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total Subscriptions</div>
                <div className="text-2xl font-bold">{analytics.overview.totalSubscriptions}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Active</div>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.overview.activeSubscriptions}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Job Seekers</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {analytics.overview.seekerSubscriptions}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Job Providers</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {analytics.overview.providerSubscriptions}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Credits Used</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {analytics.overview.totalCreditsConsumed}
                </div>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="seeker">Seekers</TabsTrigger>
                <TabsTrigger value="provider">Providers</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Subscriptions Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Billing End</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sub.profile?.name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">
                          {sub.profile?.email || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {sub.profile?.type === "jobseeker" ? (
                          <><Users className="mr-1 h-3 w-3" /> Seeker</>
                        ) : (
                          <><Briefcase className="mr-1 h-3 w-3" /> Provider</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {typeof sub.planId === "object" ? sub.planId.name : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[sub.status] || ""}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span>{getAvailableCredits(sub)}</span>
                        <span className="text-muted-foreground">
                          / {sub.credits.planCredits + sub.credits.addOnCredits}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(sub.billingCycle.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(sub.profileId)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubscription(sub)
                            setIsAddCreditsOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {subscriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}

          {/* Details Dialog */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Subscription Details</DialogTitle>
                <DialogDescription>
                  View and manage subscription for {selectedSubscription?.profile?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedSubscription && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={selectedSubscription.status}
                        onValueChange={(v) =>
                          handleUpdateStatus(selectedSubscription.profileId, v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Plan</Label>
                      <div className="text-sm mt-1">
                        {typeof selectedSubscription.planId === "object"
                          ? selectedSubscription.planId.name
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Plan Credits</div>
                      <div className="text-xl font-bold">
                        {selectedSubscription.credits.planCredits}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Add-on Credits</div>
                      <div className="text-xl font-bold">
                        {selectedSubscription.credits.addOnCredits}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Available</div>
                      <div className="text-xl font-bold text-green-600">
                        {getAvailableCredits(selectedSubscription)}
                      </div>
                    </Card>
                  </div>

                  <div>
                    <Label>Billing Cycle</Label>
                    <div className="text-sm mt-1">
                      {new Date(selectedSubscription.billingCycle.startDate).toLocaleDateString()}{" "}
                      - {new Date(selectedSubscription.billingCycle.endDate).toLocaleDateString()}
                    </div>
                  </div>

                  {selectedSubscription.linkedinUrl && (
                    <div>
                      <Label>LinkedIn URL</Label>
                      <div className="text-sm mt-1">
                        <a
                          href={selectedSubscription.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedSubscription.linkedinUrl}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Credits Dialog */}
          <Dialog open={isAddCreditsOpen} onOpenChange={setIsAddCreditsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Credits</DialogTitle>
                <DialogDescription>
                  Add credits to {selectedSubscription?.profile?.name}&apos;s subscription
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits to Add</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    value={creditsToAdd}
                    onChange={(e) => setCreditsToAdd(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Input
                    id="reason"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="e.g., Promotional credits"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCreditsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCredits} disabled={creditsToAdd <= 0}>
                  Add Credits
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
