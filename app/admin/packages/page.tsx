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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Check } from "lucide-react"
import type { Package, Feature, PackageWithFeatures } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageWithFeatures[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false)
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
  const { toast } = useToast()

  // Package form state
  const [packageForm, setPackageForm] = useState({
    name: "",
    description: "",
    price: 0,
    billingCycle: "monthly" as "monthly" | "yearly" | "lifetime",
    isActive: true,
    features: [] as string[],
    maxJobPostings: 0,
    maxApplications: 0,
    priority: 0,
  })

  // Feature form state
  const [featureForm, setFeatureForm] = useState({
    name: "",
    description: "",
    category: "core" as "core" | "advanced" | "premium" | "enterprise",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [packagesRes, featuresRes] = await Promise.all([fetch("/api/admin/packages"), fetch("/api/admin/features")])
      const packagesData = await packagesRes.json()
      const featuresData = await featuresRes.json()
      setPackages(packagesData)
      setFeatures(featuresData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePackage = () => {
    setEditingPackage(null)
    setPackageForm({
      name: "",
      description: "",
      price: 0,
      billingCycle: "monthly",
      isActive: true,
      features: [],
      maxJobPostings: 0,
      maxApplications: 0,
      priority: 0,
    })
    setIsPackageDialogOpen(true)
  }

  const handleEditPackage = (pkg: Package) => {
    setEditingPackage(pkg)
    setPackageForm({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      billingCycle: pkg.billingCycle,
      isActive: pkg.isActive,
      features: pkg.features,
      maxJobPostings: pkg.maxJobPostings,
      maxApplications: pkg.maxApplications,
      priority: pkg.priority,
    })
    setIsPackageDialogOpen(true)
  }

  const handleSavePackage = async () => {
    try {
      const url = editingPackage ? `/api/admin/packages/${editingPackage.id}` : "/api/admin/packages"
      const method = editingPackage ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packageForm),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Package ${editingPackage ? "updated" : "created"} successfully`,
        })
        setIsPackageDialogOpen(false)
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save package",
        variant: "destructive",
      })
    }
  }

  const handleDeletePackage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return

    try {
      const response = await fetch(`/api/admin/packages/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Package deleted successfully",
        })
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      })
    }
  }

  const handleCreateFeature = () => {
    setEditingFeature(null)
    setFeatureForm({
      name: "",
      description: "",
      category: "core",
    })
    setIsFeatureDialogOpen(true)
  }

  const handleEditFeature = (feature: Feature) => {
    setEditingFeature(feature)
    setFeatureForm({
      name: feature.name,
      description: feature.description,
      category: feature.category,
    })
    setIsFeatureDialogOpen(true)
  }

  const handleSaveFeature = async () => {
    try {
      const url = editingFeature ? `/api/admin/features/${editingFeature.id}` : "/api/admin/features"
      const method = editingFeature ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featureForm),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Feature ${editingFeature ? "updated" : "created"} successfully`,
        })
        setIsFeatureDialogOpen(false)
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save feature",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFeature = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feature?")) return

    try {
      const response = await fetch(`/api/admin/features/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Feature deleted successfully",
        })
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      })
    }
  }

  const toggleFeatureInPackage = (featureId: string) => {
    setPackageForm((prev) => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter((id) => id !== featureId)
        : [...prev.features, featureId],
    }))
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
          <PageHeader title="Package & Feature Management" description="Manage pricing packages and feature flags" />

          {/* Features Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Features</h2>
              <Button onClick={handleCreateFeature}>
                <Plus className="mr-2 h-4 w-4" />
                Add Feature
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{feature.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                      <Badge variant="outline" className="mt-2">
                        {feature.category}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditFeature(feature)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteFeature(feature.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Packages Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Packages</h2>
              <Button onClick={handleCreatePackage}>
                <Plus className="mr-2 h-4 w-4" />
                Add Package
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packages
                .sort((a, b) => a.priority - b.priority)
                .map((pkg) => (
                  <Card key={pkg.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
                        </div>
                        <Badge variant={pkg.isActive ? "default" : "secondary"}>
                          {pkg.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-foreground">
                          ${pkg.price}
                          <span className="text-sm font-normal text-muted-foreground">/{pkg.billingCycle}</span>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Max Job Postings: {pkg.maxJobPostings}</div>
                          <div>Max Applications: {pkg.maxApplications}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-foreground">Features:</div>
                        <div className="space-y-1">
                          {pkg.featureDetails.map((feature) => (
                            <div key={feature.id} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-muted-foreground">{feature.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => handleEditPackage(pkg)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => handleDeletePackage(pkg.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>

          {/* Package Dialog */}
          <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingPackage ? "Edit Package" : "Create Package"}</DialogTitle>
                <DialogDescription>Configure package details and select features</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Package Name</Label>
                  <Input
                    id="name"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={packageForm.description}
                    onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={packageForm.price}
                      onChange={(e) => setPackageForm({ ...packageForm, price: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingCycle">Billing Cycle</Label>
                    <Select
                      value={packageForm.billingCycle}
                      onValueChange={(value: "monthly" | "yearly" | "lifetime") =>
                        setPackageForm({ ...packageForm, billingCycle: value })
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxJobPostings">Max Job Postings</Label>
                    <Input
                      id="maxJobPostings"
                      type="number"
                      value={packageForm.maxJobPostings}
                      onChange={(e) =>
                        setPackageForm({
                          ...packageForm,
                          maxJobPostings: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxApplications">Max Applications</Label>
                    <Input
                      id="maxApplications"
                      type="number"
                      value={packageForm.maxApplications}
                      onChange={(e) =>
                        setPackageForm({
                          ...packageForm,
                          maxApplications: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority (Display Order)</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={packageForm.priority}
                      onChange={(e) => setPackageForm({ ...packageForm, priority: Number(e.target.value) })}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      id="isActive"
                      checked={packageForm.isActive}
                      onCheckedChange={(checked) => setPackageForm({ ...packageForm, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="space-y-2 rounded-lg border border-border p-4">
                    {features.map((feature) => (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <Switch
                          id={`feature-${feature.id}`}
                          checked={packageForm.features.includes(feature.id)}
                          onCheckedChange={() => toggleFeatureInPackage(feature.id)}
                        />
                        <Label htmlFor={`feature-${feature.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span>{feature.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {feature.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPackageDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePackage}>Save Package</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Feature Dialog */}
          <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingFeature ? "Edit Feature" : "Create Feature"}</DialogTitle>
                <DialogDescription>Define a feature for your packages</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="featureName">Feature Name</Label>
                  <Input
                    id="featureName"
                    value={featureForm.name}
                    onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featureDescription">Description</Label>
                  <Textarea
                    id="featureDescription"
                    value={featureForm.description}
                    onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={featureForm.category}
                    onValueChange={(value: "core" | "advanced" | "premium" | "enterprise") =>
                      setFeatureForm({ ...featureForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFeatureDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveFeature}>Save Feature</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
