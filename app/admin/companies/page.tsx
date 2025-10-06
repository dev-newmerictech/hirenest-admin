// Companies management page with verification functionality

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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { Company } from "@/lib/types"
import { format } from "date-fns"
import { MoreVertical, Eye, Ban, CheckCircle, Trash2, ShieldCheck, ShieldX } from "lucide-react"

export default function CompaniesPage() {
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Company>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    const filtered = companies.filter((company) => company.name.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredCompanies(filtered)
  }, [searchQuery, companies])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
        setFilteredCompanies(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch companies:", error)
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = (company: Company) => {
    setSelectedCompany(company)
    setFormData(company)
    setIsDetailOpen(true)
  }

  const handleToggleStatus = async (company: Company) => {
    try {
      const response = await fetch(`/api/admin/companies/${company.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !company.isActive }),
      })

      if (response.ok) {
        setCompanies((prev) => prev.map((c) => (c.id === company.id ? { ...c, isActive: !c.isActive } : c)))
        toast({
          title: "Success",
          description: `Company ${company.isActive ? "deactivated" : "activated"} successfully`,
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

  const handleVerification = async (company: Company, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/admin/companies/${company.id}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: status }),
      })

      if (response.ok) {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === company.id ? { ...c, verificationStatus: status, isVerified: status === "approved" } : c,
          ),
        )
        toast({
          title: "Success",
          description: `Company verification ${status}`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (company: Company) => {
    if (!confirm(`Are you sure you want to delete ${company.name}?`)) return

    try {
      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCompanies((prev) => prev.filter((c) => c.id !== company.id))
        toast({
          title: "Success",
          description: "Company deleted successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedCompany) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/companies/${selectedCompany.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedCompany = await response.json()
        setCompanies((prev) => prev.map((c) => (c.id === selectedCompany.id ? updatedCompany : c)))
        setSelectedCompany(updatedCompany)
        toast({
          title: "Success",
          description: "Company updated successfully",
        })
        setIsDetailOpen(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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
      render: (item) => (
        <Badge
          variant={
            item.verificationStatus === "approved"
              ? "default"
              : item.verificationStatus === "rejected"
                ? "destructive"
                : "secondary"
          }
          className={
            item.verificationStatus === "approved"
              ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
              : item.verificationStatus === "rejected"
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                : ""
          }
        >
          {item.verificationStatus.charAt(0).toUpperCase() + item.verificationStatus.slice(1)}
        </Badge>
      ),
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
            {item.verificationStatus === "pending" && (
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
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Companies" description="Manage company accounts and verifications" />

          <div className="flex items-center justify-between">
            <SearchBar placeholder="Search by company name..." value={searchQuery} onChange={setSearchQuery} />
          </div>

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <DataTable columns={columns} data={filteredCompanies} emptyMessage="No companies found" />
          )}
        </div>

        {/* Detail Drawer */}
        {selectedCompany && (
          <DetailDrawer open={isDetailOpen} onOpenChange={setIsDetailOpen} title="Edit Company">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
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
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry || ""}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
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
                <Label>Verification Status</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedCompany.verificationStatus === "approved"
                        ? "default"
                        : selectedCompany.verificationStatus === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                    className={
                      selectedCompany.verificationStatus === "approved"
                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        : selectedCompany.verificationStatus === "rejected"
                          ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          : ""
                    }
                  >
                    {selectedCompany.verificationStatus.charAt(0).toUpperCase() +
                      selectedCompany.verificationStatus.slice(1)}
                  </Badge>
                </div>
              </div>
              {selectedCompany.verificationStatus === "pending" && (
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
