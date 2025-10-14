// Job Management page with filtering and status management

"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { SearchBar } from "@/components/admin/search-bar"
import { DataTable, type Column } from "@/components/admin/data-table"
import { StatusBadge } from "@/components/admin/status-badge"
import { DetailDrawer } from "@/components/admin/detail-drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { Job } from "@/lib/types"
import { format } from "date-fns"
import { MoreVertical, Eye, XCircle, Trash2 } from "lucide-react"

export default function JobsPage() {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Job>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    let filtered = jobs.filter((job) => job.title.toLowerCase().includes(searchQuery.toLowerCase()))

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter)
    }

    setFilteredJobs(filtered)
  }, [searchQuery, statusFilter, jobs])

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/admin/jobs")
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
        setFilteredJobs(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch jobs:", error)
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = (job: Job) => {
    setSelectedJob(job)
    setFormData(job)
    setIsDetailOpen(true)
  }

  const handleCloseJob = async (job: Job) => {
    if (!confirm(`Are you sure you want to close "${job.title}"?`)) return

    try {
      const response = await fetch(`/api/admin/jobs/${job.id}/close`, {
        method: "PATCH",
      })

      if (response.ok) {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "closed" } : j)))
        toast({
          title: "Success",
          description: "Job closed successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to close job",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (job: Job) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"?`)) return

    try {
      const response = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== job.id))
        toast({
          title: "Success",
          description: "Job deleted successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedJob) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/jobs/${selectedJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedJob = await response.json()
        setJobs((prev) => prev.map((j) => (j.id === selectedJob.id ? updatedJob : j)))
        setSelectedJob(updatedJob)
        toast({
          title: "Success",
          description: "Job updated successfully",
        })
        setIsDetailOpen(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const columns: Column<Job>[] = [
    {
      key: "title",
      label: "Job Title",
      render: (item) => (
        <button
          onClick={() => handleView(item)}
          className="text-foreground hover:text-primary transition-colors font-medium text-left"
        >
          {item.title}
        </button>
      ),
    },
    { key: "companyName", label: "Company" },
    { key: "location", label: "Location" },
    {
      key: "type",
      label: "Type",
      render: (item) => <span className="capitalize text-foreground">{item.type.replace("-", " ")}</span>,
    },
    {
      key: "postedDate",
      label: "Posted Date",
      render: (item) => format(new Date(item.postedDate), "MMM dd, yyyy"),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status === "active"} activeLabel="Active" inactiveLabel="Closed" />,
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
            {item.status === "active" && (
              <DropdownMenuItem onClick={() => handleCloseJob(item)}>
                <XCircle className="mr-2 h-4 w-4" />
                Close Job
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
            <PageHeader title="Job Management" description="Manage job postings and their status" />

            <div className="flex items-center gap-4">
              <SearchBar placeholder="Search by job title..." value={searchQuery} onChange={setSearchQuery} />
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <DataTable columns={columns} data={filteredJobs} emptyMessage="No jobs found" />
          )}
        </div>

        {/* Detail Drawer */}
        {selectedJob && (
          <DetailDrawer open={isDetailOpen} onOpenChange={setIsDetailOpen} title="Edit Job">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  value={formData.companyName || ""}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Job Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Posted Date</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedJob.postedDate), "MMMM dd, yyyy")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="mt-1">
                  <StatusBadge status={selectedJob.status === "active"} activeLabel="Active" inactiveLabel="Closed" />
                </div>
              </div>
              {selectedJob.status === "active" && (
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      handleCloseJob(selectedJob)
                      setIsDetailOpen(false)
                    }}
                    variant="destructive"
                    className="w-full"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Close Job
                  </Button>
                </div>
              )}

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
