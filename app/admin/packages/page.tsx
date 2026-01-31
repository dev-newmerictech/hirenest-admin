"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Edit, Trash2, Check, Users, Briefcase, CreditCard, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import type { SubscriptionPlan, SubscriptionWithProfile } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default function PackagesPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "seeker" | "provider">("all")
  const { toast } = useToast()

  // Subscriber view state
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set())
  const [planSubscribers, setPlanSubscribers] = useState<Record<string, SubscriptionWithProfile[]>>({})
  const [loadingSubscribers, setLoadingSubscribers] = useState<Record<string, boolean>>({})

  // Plan form state
  const [planForm, setPlanForm] = useState({
    name: "",
    type: "provider" as "seeker" | "provider",
    description: "",
    price: 0,
    billingCycle: "monthly" as "monthly" | "yearly" | "lifetime",
    credits: 0,
    features: [] as string[],
    limits: {
      resumeBuilds: 2,
      freeInterviews: 5,
      linkedinRequiredAfter: 2,
    },
    isActive: true,
    isDefault: false,
    priority: 0,
  })

  const [newFeature, setNewFeature] = useState("")

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/subscription/plans`)
      const data = await response.json()
      if (data.success) {
        setPlans(data.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load plans",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = () => {
    setEditingPlan(null)
    setPlanForm({
      name: "",
      type: "provider",
      description: "",
      price: 0,
      billingCycle: "monthly",
      credits: 0,
      features: [],
      limits: {
        resumeBuilds: 2,
        freeInterviews: 5,
        linkedinRequiredAfter: 2,
      },
      isActive: true,
      isDefault: false,
      priority: 0,
    })
    setIsDialogOpen(true)
  }

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      type: plan.type,
      description: plan.description || "",
      price: plan.price,
      billingCycle: plan.billingCycle,
      credits: plan.credits,
      features: plan.features || [],
      limits: {
        resumeBuilds: plan.limits?.resumeBuilds || 3,
        freeInterviews: plan.limits?.freeInterviews || 5,
        linkedinRequiredAfter: plan.limits?.linkedinRequiredAfter || 2,
      },
      isActive: plan.isActive,
      isDefault: plan.isDefault,
      priority: plan.priority,
    })
    setIsDialogOpen(true)
  }

  const handleSavePlan = async () => {
    try {
      const url = editingPlan
        ? `${API_BASE_URL}/admin/subscription/plans/${editingPlan._id}`
        : `${API_BASE_URL}/admin/subscription/plans`
      const method = editingPlan ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planForm),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Plan ${editingPlan ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        fetchPlans()
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save plan",
        variant: "destructive",
      })
    }
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return

    try {
      const response = await fetch(`${API_BASE_URL}/admin/subscription/plans/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Plan deleted successfully",
        })
        fetchPlans()
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      })
    }
  }

  const addFeature = () => {
    if (newFeature.trim() && !planForm.features.includes(newFeature.trim())) {
      setPlanForm({
        ...planForm,
        features: [...planForm.features, newFeature.trim()],
      })
      setNewFeature("")
    }
  }

  const removeFeature = (feature: string) => {
    setPlanForm({
      ...planForm,
      features: planForm.features.filter((f) => f !== feature),
    })
  }

  const filteredPlans = plans.filter((plan) => {
    if (activeTab === "all") return true
    return plan.type === activeTab
  })

  // Fetch subscribers for a specific plan
  const fetchPlanSubscribers = async (planId: string) => {
    if (planSubscribers[planId]) return // Already fetched

    setLoadingSubscribers((prev) => ({ ...prev, [planId]: true }))
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/subscription/subscriptions?planId=${planId}&limit=50`
      )
      const data = await response.json()
      if (data.success) {
        setPlanSubscribers((prev) => ({ ...prev, [planId]: data.data.subscriptions }))
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error)
      toast({
        title: "Error",
        description: "Failed to load subscribers",
        variant: "destructive",
      })
    } finally {
      setLoadingSubscribers((prev) => ({ ...prev, [planId]: false }))
    }
  }

  // Toggle plan expansion
  const togglePlanExpanded = (planId: string) => {
    const newExpanded = new Set(expandedPlans)
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId)
    } else {
      newExpanded.add(planId)
      fetchPlanSubscribers(planId)
    }
    setExpandedPlans(newExpanded)
  }

  // Calculate available credits for a subscription
  const getAvailableCredits = (sub: SubscriptionWithProfile) => {
    return sub.credits.planCredits + sub.credits.addOnCredits - sub.credits.usedCredits
  }

  // Status color mapping
  const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    trial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    free: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    cancelled: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
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
            title="Subscription Plans"
            description="Manage subscription plans for job seekers and providers"
          />

          {/* Tabs for filtering */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All Plans</TabsTrigger>
                <TabsTrigger value="seeker">
                  <Users className="mr-2 h-4 w-4" />
                  Seeker Plans
                </TabsTrigger>
                <TabsTrigger value="provider">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Provider Plans
                </TabsTrigger>
              </TabsList>
              <Button onClick={handleCreatePlan}>
                <Plus className="mr-2 h-4 w-4" />
                Add Plan
              </Button>
            </div>

            <TabsContent value={activeTab} className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPlans
                  .sort((a, b) => a.priority - b.priority)
                  .map((plan) => (
                    <Card key={plan._id} className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                              {plan.isDefault && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {plan.description}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge variant={plan.isActive ? "default" : "secondary"}>
                              {plan.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              {plan.type === "seeker" ? (
                                <><Users className="mr-1 h-3 w-3" /> Seeker</>
                              ) : (
                                <><Briefcase className="mr-1 h-3 w-3" /> Provider</>
                              )}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-3xl font-bold text-foreground">
                            ₹{plan.price}
                            <span className="text-sm font-normal text-muted-foreground">
                              /{plan.billingCycle}
                            </span>
                          </div>

                          {plan.type === "provider" && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CreditCard className="h-4 w-4" />
                              <span>{plan.credits} credits/cycle</span>
                            </div>
                          )}

                          {plan.type === "seeker" && plan.limits && (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div>Resume Builds: {plan.limits.resumeBuilds || "∞"}</div>
                              <div>Free Interviews: {plan.limits.freeInterviews || "∞"}</div>
                              <div>
                                LinkedIn after: {plan.limits.linkedinRequiredAfter || 0} interviews
                              </div>
                            </div>
                          )}
                        </div>

                        {plan.features && plan.features.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-foreground">Features:</div>
                            <div className="space-y-1">
                              {plan.features.slice(0, 5).map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <Check className="h-4 w-4 text-green-500" />
                                  <span className="text-muted-foreground">{feature}</span>
                                </div>
                              ))}
                              {plan.features.length > 5 && (
                                <div className="text-sm text-muted-foreground">
                                  +{plan.features.length - 5} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => handleDeletePlan(plan._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>

                        {/* Expandable Subscribers Section */}
                        <Collapsible
                          open={expandedPlans.has(plan._id)}
                          onOpenChange={() => togglePlanExpanded(plan._id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between mt-2 text-muted-foreground hover:text-foreground"
                            >
                              <span className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                View Subscribers
                                {planSubscribers[plan._id] && (
                                  <Badge variant="secondary" className="ml-1">
                                    {planSubscribers[plan._id].length}
                                  </Badge>
                                )}
                              </span>
                              {expandedPlans.has(plan._id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            {loadingSubscribers[plan._id] ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                  Loading subscribers...
                                </span>
                              </div>
                            ) : planSubscribers[plan._id]?.length === 0 ? (
                              <div className="text-center py-4 text-sm text-muted-foreground">
                                No subscribers for this plan
                              </div>
                            ) : (
                              <div className="rounded-md border max-h-64 overflow-y-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-xs">User</TableHead>
                                      <TableHead className="text-xs">Type</TableHead>
                                      <TableHead className="text-xs">Credits</TableHead>
                                      <TableHead className="text-xs">Status</TableHead>
                                      <TableHead className="text-xs">Billing End</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {planSubscribers[plan._id]?.map((sub) => (
                                      <TableRow key={sub._id}>
                                        <TableCell className="py-2">
                                          <div>
                                            <div className="font-medium text-xs">
                                              {sub.profile?.name || "Unknown"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {sub.profile?.email || "N/A"}
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-2">
                                          <Badge variant="outline" className="text-xs">
                                            {sub.profile?.type === "jobseeker" ? (
                                              <>
                                                <Users className="mr-1 h-3 w-3" /> Seeker
                                              </>
                                            ) : (
                                              <>
                                                <Briefcase className="mr-1 h-3 w-3" /> Provider
                                              </>
                                            )}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="py-2">
                                          <div className="flex items-center gap-1 text-xs">
                                            <CreditCard className="h-3 w-3 text-muted-foreground" />
                                            <span>{getAvailableCredits(sub)}</span>
                                            <span className="text-muted-foreground">
                                              / {sub.credits.planCredits + sub.credits.addOnCredits}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-2">
                                          <Badge
                                            className={`text-xs ${STATUS_COLORS[sub.status] || ""}`}
                                          >
                                            {sub.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="py-2 text-xs text-muted-foreground">
                                          {new Date(sub.billingCycle.endDate).toLocaleDateString()}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </Card>
                  ))}
              </div>

              {filteredPlans.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No plans found. Create one to get started.
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Plan Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
                <DialogDescription>
                  Configure subscription plan details
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="e.g., Pro Plan"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Plan Type</Label>
                    <Select
                      value={planForm.type}
                      onValueChange={(value: "seeker" | "provider") =>
                        setPlanForm({ ...planForm, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seeker">
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            Job Seeker
                          </div>
                        </SelectItem>
                        <SelectItem value="provider">
                          <div className="flex items-center">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Job Provider
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    placeholder="Brief description of the plan"
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingCycle">Billing Cycle</Label>
                    <Select
                      value={planForm.billingCycle}
                      onValueChange={(value: "monthly" | "yearly" | "lifetime") =>
                        setPlanForm({ ...planForm, billingCycle: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="lifetime">Lifetime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Provider-specific: Credits */}
                {planForm.type === "provider" && (
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits per Cycle</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="0"
                      value={planForm.credits}
                      onChange={(e) => setPlanForm({ ...planForm, credits: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of credits provided each billing cycle for interviews
                    </p>
                  </div>
                )}

                {/* Seeker-specific: Limits */}
                {planForm.type === "seeker" && (
                  <div className="space-y-4 rounded-lg border p-4">
                    <h4 className="font-medium">Seeker Limits</h4>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="resumeBuilds">Resume Builds</Label>
                        <Input
                          id="resumeBuilds"
                          type="number"
                          min="0"
                          value={planForm.limits.resumeBuilds}
                          onChange={(e) =>
                            setPlanForm({
                              ...planForm,
                              limits: { ...planForm.limits, resumeBuilds: Number(e.target.value) },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="freeInterviews">Free Interviews</Label>
                        <Input
                          id="freeInterviews"
                          type="number"
                          min="0"
                          value={planForm.limits.freeInterviews}
                          onChange={(e) =>
                            setPlanForm({
                              ...planForm,
                              limits: { ...planForm.limits, freeInterviews: Number(e.target.value) },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="linkedinAfter">LinkedIn After</Label>
                        <Input
                          id="linkedinAfter"
                          type="number"
                          min="0"
                          value={planForm.limits.linkedinRequiredAfter}
                          onChange={(e) =>
                            setPlanForm({
                              ...planForm,
                              limits: {
                                ...planForm.limits,
                                linkedinRequiredAfter: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      LinkedIn is required after the specified number of interviews
                    </p>
                  </div>
                )}

                {/* Features */}
                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {planForm.features.map((feature, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeFeature(feature)}
                      >
                        {feature} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Priority and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority (Display Order)</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={planForm.priority}
                      onChange={(e) => setPlanForm({ ...planForm, priority: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-4 pt-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={planForm.isActive}
                        onCheckedChange={(checked) => setPlanForm({ ...planForm, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isDefault"
                        checked={planForm.isDefault}
                        onCheckedChange={(checked) => setPlanForm({ ...planForm, isDefault: checked })}
                      />
                      <Label htmlFor="isDefault">Default Plan</Label>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePlan}>Save Plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
