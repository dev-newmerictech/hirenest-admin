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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Save, RefreshCw, Video, FileText, HelpCircle, Rocket, Linkedin, Zap } from "lucide-react"
import type { CreditCostConfig } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.hirenest.ai"

const ACTION_TYPE_ICONS: Record<string, any> = {
  mcq_interview: HelpCircle,
  open_ended_interview: FileText,
  video_interview: Video,
  mixed_interview: Zap,
  resume_build: FileText,
  profile_boost: Rocket,
  linkedin_visibility: Linkedin,
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  mcq_interview: "MCQ Interview",
  open_ended_interview: "Open-ended Interview",
  video_interview: "AI Video Interview",
  mixed_interview: "Mixed Interview",
  resume_build: "Resume Build",
  profile_boost: "Profile Boost",
  linkedin_visibility: "LinkedIn Visibility",
}

const CATEGORY_COLORS: Record<string, string> = {
  interview: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  feature: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  boost: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

export default function CreditCostsPage() {
  const [configs, setConfigs] = useState<CreditCostConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editedCosts, setEditedCosts] = useState<Record<string, number>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/subscription/credit-costs`)
      const data = await response.json()
      if (data.success) {
        setConfigs(data.data)
        // Initialize edited costs
        const costs: Record<string, number> = {}
        data.data.forEach((config: CreditCostConfig) => {
          costs[config.actionType] = config.creditCost
        })
        setEditedCosts(costs)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load credit costs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/subscription/credit-costs/seed`, {
        method: "POST",
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Default credit costs seeded successfully",
        })
        fetchConfigs()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to seed default costs",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCost = async (actionType: string) => {
    setSaving(actionType)
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/subscription/credit-costs/${actionType}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creditCost: editedCosts[actionType],
          }),
        }
      )
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: `Credit cost for ${ACTION_TYPE_LABELS[actionType]} updated`,
        })
        fetchConfigs()
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update credit cost",
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }

  const handleToggleActive = async (config: CreditCostConfig) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/subscription/credit-costs/${config.actionType}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creditCost: config.creditCost,
            isActive: !config.isActive,
          }),
        }
      )
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: `${ACTION_TYPE_LABELS[config.actionType]} ${!config.isActive ? "enabled" : "disabled"}`,
        })
        fetchConfigs()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const groupedConfigs = configs.reduce((acc, config) => {
    const category = config.category || "other"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(config)
    return acc
  }, {} as Record<string, CreditCostConfig[]>)

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
          <div className="flex items-center justify-between">
            <PageHeader
              title="Credit Costs Configuration"
              description="Configure credit costs for different actions"
            />
            <Button variant="outline" onClick={handleSeedDefaults}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Seed Defaults
            </Button>
          </div>

          {configs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No credit costs configured yet. Click &quot;Seed Defaults&quot; to initialize.
              </p>
              <Button onClick={handleSeedDefaults}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Seed Default Costs
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
                <Card key={category} className="p-6">
                  <h3 className="text-lg font-semibold mb-4 capitalize">{category} Actions</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-32">Credit Cost</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryConfigs.map((config) => {
                        const Icon = ACTION_TYPE_ICONS[config.actionType] || HelpCircle
                        const hasChanged = editedCosts[config.actionType] !== config.creditCost

                        return (
                          <TableRow key={config._id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {ACTION_TYPE_LABELS[config.actionType] || config.actionType}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {config.description}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                className="w-20"
                                value={editedCosts[config.actionType] ?? config.creditCost}
                                onChange={(e) =>
                                  setEditedCosts({
                                    ...editedCosts,
                                    [config.actionType]: Number(e.target.value),
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={config.isActive}
                                onCheckedChange={() => handleToggleActive(config)}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={hasChanged ? "default" : "outline"}
                                disabled={!hasChanged || saving === config.actionType}
                                onClick={() => handleUpdateCost(config.actionType)}
                              >
                                {saving === config.actionType ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </Card>
              ))}
            </div>
          )}

          {/* Info Card */}
          <Card className="p-6 bg-muted/50">
            <h4 className="font-semibold mb-2">How Credit Costs Work</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Job providers consume credits when creating interviews</li>
              <li>• Different interview types have different credit costs</li>
              <li>• MCQ interviews are cheapest, AI Video interviews are most expensive</li>
              <li>• Mixed interviews (combination of types) have intermediate costs</li>
              <li>• Set cost to 0 for free features</li>
              <li>• Disable actions to prevent providers from using them</li>
            </ul>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
