// Job Seekers management page

"use client"

import { useEffect, useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import type { JobSeeker } from "@/lib/types"
import { format } from "date-fns"

export default function JobSeekersPage() {
  const { toast } = useToast()
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([])
  const [filteredJobSeekers, setFilteredJobSeekers] = useState<JobSeeker[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJobSeeker, setSelectedJobSeeker] = useState<JobSeeker | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<JobSeeker>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchJobSeekers()
  }, [])

  useEffect(() => {
    const filtered = jobSeekers.filter(
      (seeker) =>
        seeker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seeker.email.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setFilteredJobSeekers(filtered)
  }, [searchQuery, jobSeekers])

  const fetchJobSeekers = async () => {
    try {
      const response = await fetch("/api/admin/job-seekers")
      if (response.ok) {
        const data = await response.json()
        setJobSeekers(data)
        setFilteredJobSeekers(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch job seekers:", error)
      toast({
        title: "Error",
        description: "Failed to load job seekers",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = (jobSeeker: JobSeeker) => {
    setSelectedJobSeeker(jobSeeker)
    setFormData(jobSeeker)
    setIsDetailOpen(true)
  }

  const handleToggleStatus = async (jobSeeker: JobSeeker) => {
    try {
      const response = await fetch(`/api/admin/job-seekers/${jobSeeker.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !jobSeeker.isActive }),
      })

      if (response.ok) {
        setJobSeekers((prev) => prev.map((js) => (js.id === jobSeeker.id ? { ...js, isActive: !js.isActive } : js)))
        toast({
          title: "Success",
          description: `Job seeker ${jobSeeker.isActive ? "deactivated" : "activated"} successfully`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (jobSeeker: JobSeeker) => {
    if (!confirm(`Are you sure you want to delete ${jobSeeker.name}?`)) return

    try {
      const response = await fetch(`/api/admin/job-seekers/${jobSeeker.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setJobSeekers((prev) => prev.filter((js) => js.id !== jobSeeker.id))
        toast({
          title: "Success",
          description: "Job seeker deleted successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job seeker",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedJobSeeker) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/job-seekers/${selectedJobSeeker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedJobSeeker = await response.json()
        setJobSeekers((prev) => prev.map((js) => (js.id === selectedJobSeeker.id ? updatedJobSeeker : js)))
        setSelectedJobSeeker(updatedJobSeeker)
        toast({
          title: "Success",
          description: "Job seeker updated successfully",
        })
        setIsDetailOpen(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job seeker",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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
          <PageHeader title="Job Seekers" description="Manage job seeker accounts" />

          <div className="flex items-center justify-between">
            <SearchBar placeholder="Search by name or email..." value={searchQuery} onChange={setSearchQuery} />
          </div>

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <DataTable columns={columns} data={filteredJobSeekers} emptyMessage="No job seekers found" />
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
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DetailDrawer>
        )}
      </AdminLayout>
    </AuthGuard>
  )
}
