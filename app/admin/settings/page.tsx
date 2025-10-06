// Platform Settings page

"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { PlatformSettings } from "@/lib/types"
import { Save } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: "",
    platformEmail: "",
    defaultJobExpiryDays: 30,
    requireEmailVerification: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: keyof PlatformSettings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <AdminLayout>
          <div className="space-y-6">
            <PageHeader title="Settings" description="Configure platform settings" />
            <div className="h-96 rounded-lg bg-muted animate-pulse" />
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
            title="Settings"
            description="Configure platform settings"
            action={
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            }
          />

          <div className="grid gap-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">General Settings</CardTitle>
                <CardDescription>Basic platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName" className="text-foreground">
                    Platform Name
                  </Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) => handleChange("platformName", e.target.value)}
                    placeholder="Enter platform name"
                  />
                  <p className="text-xs text-muted-foreground">The name of your job listing platform</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platformEmail" className="text-foreground">
                    Platform Email
                  </Label>
                  <Input
                    id="platformEmail"
                    type="email"
                    value={settings.platformEmail}
                    onChange={(e) => handleChange("platformEmail", e.target.value)}
                    placeholder="contact@example.com"
                  />
                  <p className="text-xs text-muted-foreground">Contact email for platform communications</p>
                </div>
              </CardContent>
            </Card>

            {/* Job Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Job Settings</CardTitle>
                <CardDescription>Configure job posting behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jobExpiryDays" className="text-foreground">
                    Default Job Expiry Days
                  </Label>
                  <Input
                    id="jobExpiryDays"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.defaultJobExpiryDays}
                    onChange={(e) => handleChange("defaultJobExpiryDays", Number.parseInt(e.target.value) || 30)}
                  />
                  <p className="text-xs text-muted-foreground">Number of days before a job posting expires (1-365)</p>
                </div>
              </CardContent>
            </Card>

            {/* User Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">User Settings</CardTitle>
                <CardDescription>Configure user account behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailVerification" className="text-foreground">
                      Require Email Verification
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Users must verify their email before accessing the platform
                    </p>
                  </div>
                  <Switch
                    id="emailVerification"
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => handleChange("requireEmailVerification", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
