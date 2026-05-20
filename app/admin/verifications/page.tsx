// GSTIN Verification management page for admin
// Shows only companies that have submitted GSTIN for verification (status: pending/verified/rejected)

"use client"

import { useEffect, useState, useCallback } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, type Column } from "@/components/admin/data-table"
import { DetailDrawer } from "@/components/admin/detail-drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api/client"
import { format } from "date-fns"
import { ShieldCheck, ShieldX, ExternalLink, RefreshCw, AlertCircle } from "lucide-react"

interface VerificationEntry {
  id: string              // profile _id
  name: string            // company name
  email: string
  documentType: string    // gstin, pan, ein, cin, udyam, vat
  documentValue: string   // the actual number
  verificationStatus: "unverified" | "pending" | "verified" | "rejected"
  verificationSubmittedAt?: string
  createdAt?: string
  rejectionReason?: string
  address?: {
    city?: string
    state?: string
    country?: string
  }
}

interface ApiResponse {
  status: string
  data: {
    jobProviders: any[]
    pagination?: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  gstin: "GSTIN",
  pan: "PAN",
  cin: "CIN",
  udyam: "Udyam",
  ein: "EIN",
  vat: "VAT",
}

const PORTAL_URLS: Record<string, string> = {
  gstin: "https://services.gst.gov.in/services/searchtp",
  pan: "https://www.incometax.gov.in/iec/foportal/",
  cin: "https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html",
  udyam: "https://udyamregistration.gov.in/udyam_verify.aspx",
}

const STANDARD_REJECTION_REASONS = [
  "Document is blurry or illegible",
  "Name on document does not match company name",
  "Document number format is invalid",
  "Document is expired",
  "Invalid document type submitted",
  "Document appears to be tampered with or fraudulent",
  "Other",
]

export default function VerificationsPage() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<VerificationEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<VerificationEntry | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending")

  // Rejection reason modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectingEntry, setRejectingEntry] = useState<VerificationEntry | null>(null)
  const [selectedStandardReason, setSelectedStandardReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [rejectionReasonError, setRejectionReasonError] = useState("")

  // Fetch all job providers and filter those with GSTIN submitted
  const fetchVerifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<any>("/admin/job-providers?limit=100")
      console.log("[Verifications] Raw API response:", res)

      // The API response is: { status, data: { jobProviders: [...], pagination } }
      // Extract the jobProviders array — handle multiple possible nesting levels
      let allProviders: any[] = []
      if (Array.isArray(res)) {
        allProviders = res
      } else if (res?.data?.jobProviders && Array.isArray(res.data.jobProviders)) {
        allProviders = res.data.jobProviders
      } else if (res?.jobProviders && Array.isArray(res.jobProviders)) {
        allProviders = res.jobProviders
      } else if (Array.isArray(res?.data)) {
        allProviders = res.data
      }

      console.log("[Verifications] Extracted providers count:", allProviders.length)

      // Build one row per document (each provider can have multiple docs)
      const entries: VerificationEntry[] = []
      const verifiableTypes = ["gstin", "pan", "cin", "udyam", "ein", "vat"]

      for (const p of allProviders) {
        const docs = Array.isArray(p.documents) ? p.documents : []

        // Check documents[] array for verifiable docs
        for (const doc of docs) {
          const docName = doc.name === "company-registration-number" ? "ein" : doc.name
          if (!verifiableTypes.includes(docName)) continue

          const status = doc.verificationStatus || "unverified"
          if (status === "unverified") continue // Only show submitted docs

          const docValue = Array.isArray(doc.documentIdNumber) ? doc.documentIdNumber[0] : ""
          entries.push({
            id: `${p._id}-${docName}`,
            name: p.name || "Unknown",
            email: p.email || "",
            documentType: docName,
            documentValue: docValue || "",
            verificationStatus: status,
            verificationSubmittedAt: doc.verificationSubmittedAt,
            rejectionReason: doc.rejectionReason || "",
            createdAt: p.createdAt,
            address: p.address,
          })
        }

        // Backward compat: also check top-level gstin field if not already in entries
        if (p.gstin && p.verificationStatus && p.verificationStatus !== "unverified") {
          const alreadyHasGstin = entries.some((e) => e.id === `${p._id}-gstin`)
          if (!alreadyHasGstin) {
            entries.push({
              id: `${p._id}-gstin`,
              name: p.name || "Unknown",
              email: p.email || "",
              documentType: "gstin",
              documentValue: p.gstin,
              verificationStatus: p.verificationStatus,
              verificationSubmittedAt: p.verificationSubmittedAt,
              rejectionReason: "",
              createdAt: p.createdAt,
              address: p.address,
            })
          }
        }
      }

      console.log("[Verifications] Total verification entries:", entries.length, entries)
      setEntries(entries)
    } catch (err: any) {
      console.error("[Verifications] Fetch error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to fetch verifications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchVerifications()
  }, [fetchVerifications])

  // Open rejection modal instead of rejecting directly
  const openRejectModal = (entry: VerificationEntry) => {
    setRejectingEntry(entry)
    setSelectedStandardReason("")
    setCustomReason("")
    setRejectionReasonError("")
    setIsRejectModalOpen(true)
  }

  // Submit rejection with reason
  const handleRejectWithReason = async () => {
    if (!rejectingEntry) return

    // Determine the final reason string
    const finalReason = selectedStandardReason === "Other"
      ? customReason.trim()
      : selectedStandardReason

    if (!finalReason) {
      setRejectionReasonError(
        selectedStandardReason === "Other"
          ? "Please provide a specific reason for rejection."
          : "Please select a reason for rejection."
      )
      return
    }

    setIsRejectModalOpen(false)
    await handleVerification(rejectingEntry, "rejected", finalReason)
    setRejectingEntry(null)
    setSelectedStandardReason("")
    setCustomReason("")
  }

  const handleVerification = async (entry: VerificationEntry, status: "verified" | "rejected", reason?: string) => {
    setIsUpdating(true)
    try {
      // entry.id is composite: "${providerId}-${docType}" — extract the real provider ID
      const providerId = entry.id.replace(/-[^-]+$/, "")
      const payload: Record<string, string> = {
        verificationStatus: status,
        documentType: entry.documentType,
      }
      if (status === "rejected" && reason) {
        payload.rejectionReason = reason
      }
      await api.patch(`/admin/job-providers/${providerId}/verification`, payload)
      toast({
        title: "Success",
        description: `${DOCUMENT_TYPE_LABELS[entry.documentType] || entry.documentType} for "${entry.name}" has been ${status}.`,
      })
      const updatedReason = status === "rejected" ? (reason || "") : ""
      // Update local state — match by both id AND documentType
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id && e.documentType === entry.documentType
            ? { ...e, verificationStatus: status, rejectionReason: updatedReason }
            : e
        )
      )
      if (selectedEntry?.id === entry.id && selectedEntry?.documentType === entry.documentType) {
        setSelectedEntry({ ...entry, verificationStatus: status, rejectionReason: updatedReason })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update verification status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleView = (entry: VerificationEntry) => {
    setSelectedEntry(entry)
    setIsDetailOpen(true)
  }

  // Filter entries based on active tab
  const filteredEntries = activeFilter === "all" ? entries : entries.filter((e) => e.verificationStatus === activeFilter)

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Pending</Badge>
      case "verified":
        return <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Verified</Badge>
      case "rejected":
        return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const columns: Column<VerificationEntry>[] = [
    {
      key: "name",
      label: "Company",
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
    {
      key: "documentType",
      label: "Type",
      render: (item) => (
        <Badge variant="outline" className="text-xs font-medium">
          {DOCUMENT_TYPE_LABELS[item.documentType] || item.documentType.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "documentValue",
      label: "Document No.",
      render: (item) => (
        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{item.documentValue}</code>
      ),
    },
    {
      key: "verificationStatus",
      label: "Status",
      render: (item) => statusBadge(item.verificationStatus),
    },
    {
      key: "verificationSubmittedAt",
      label: "Submitted",
      render: (item) =>
        item.verificationSubmittedAt
          ? format(new Date(item.verificationSubmittedAt), "MMM dd, yyyy")
          : "—",
    },
    {
      key: "actions",
      label: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          {item.verificationStatus === "pending" && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                onClick={() => handleVerification(item, "verified")}
                disabled={isUpdating}
              >
                <ShieldCheck className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                onClick={() => openRejectModal(item)}
                disabled={isUpdating}
              >
                <ShieldX className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => handleView(item)}
          >
            View
          </Button>
        </div>
      ),
    },
  ]

  const pendingCount = entries.filter((e) => e.verificationStatus === "pending").length

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="mt-4 sm:mt-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <PageHeader
              title="Verifications"
              description={`GSTIN verification requests from job providers${pendingCount > 0 ? ` · ${pendingCount} pending` : ""}`}
            />
            <Button variant="outline" size="sm" onClick={fetchVerifications} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 border-b border-border pb-2">
            {(["pending", "all", "verified", "rejected"] as const).map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className="capitalize"
              >
                {filter}
                {filter === "pending" && pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <DataTable
              columns={columns}
              data={filteredEntries}
              emptyMessage={
                activeFilter === "pending"
                  ? "No pending verification requests"
                  : "No verification entries found"
              }
            />
          )}
        </div>

        {/* Detail Drawer */}
        {selectedEntry && (
          <DetailDrawer open={isDetailOpen} onOpenChange={setIsDetailOpen} title="Verification Details">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <p className="text-sm font-medium">{selectedEntry.name}</p>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm font-medium">{selectedEntry.email}</p>
              </div>
              {selectedEntry.address && (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <p className="text-sm text-muted-foreground">
                    {[selectedEntry.address.city, selectedEntry.address.state, selectedEntry.address.country]
                      .filter(Boolean)
                      .join(", ") || "Not provided"}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Badge variant="outline" className="text-xs font-medium">
                  {DOCUMENT_TYPE_LABELS[selectedEntry.documentType] || selectedEntry.documentType.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>{DOCUMENT_TYPE_LABELS[selectedEntry.documentType] || "Document No."}</Label>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded font-semibold">
                    {selectedEntry.documentValue}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedEntry.documentValue)
                      toast({ title: "Copied", description: `${DOCUMENT_TYPE_LABELS[selectedEntry.documentType] || "Document number"} copied to clipboard` })
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="mt-1">{statusBadge(selectedEntry.verificationStatus)}</div>
              </div>
              {selectedEntry.verificationSubmittedAt && (
                <div className="space-y-2">
                  <Label>Submitted On</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEntry.verificationSubmittedAt), "MMMM dd, yyyy 'at' hh:mm a")}
                  </p>
                </div>
              )}

              {/* Verification Portal link — only for document types that have a portal */}
              {PORTAL_URLS[selectedEntry.documentType] && (
                <div className="rounded-lg border border-border p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-3">
                    Verify this {DOCUMENT_TYPE_LABELS[selectedEntry.documentType] || "document"} on the official portal. Copy the number above, then click below to search for it.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(PORTAL_URLS[selectedEntry.documentType], "_blank")}
                    className="w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open {DOCUMENT_TYPE_LABELS[selectedEntry.documentType]} Portal
                  </Button>
                </div>
              )}

              {/* Action buttons */}
              {selectedEntry.verificationStatus === "pending" && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    onClick={() => {
                      handleVerification(selectedEntry, "verified")
                      setIsDetailOpen(false)
                    }}
                    className="flex-1"
                    disabled={isUpdating}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDetailOpen(false)
                      openRejectModal(selectedEntry)
                    }}
                    variant="destructive"
                    className="flex-1"
                    disabled={isUpdating}
                  >
                    <ShieldX className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}

              {/* Show rejection reason if document is rejected */}
              {selectedEntry.verificationStatus === "rejected" && selectedEntry.rejectionReason && (
                <div className="rounded-lg border border-destructive/30 p-4 bg-destructive/5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-destructive mb-1">Rejection Reason</p>
                      <p className="text-sm text-foreground">{selectedEntry.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedEntry.verificationStatus !== "pending" && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    onClick={() => {
                      if (selectedEntry.verificationStatus === "verified") {
                        setIsDetailOpen(false)
                        openRejectModal(selectedEntry)
                      } else {
                        handleVerification(selectedEntry, "verified")
                        setIsDetailOpen(false)
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={isUpdating}
                  >
                    {selectedEntry.verificationStatus === "verified" ? (
                      <>
                        <ShieldX className="mr-2 h-4 w-4" />
                        Revoke Verification
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </DetailDrawer>
        )}

        {/* Rejection Reason Modal — uses native Dialog + themed components */}
        <Dialog
          open={isRejectModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsRejectModalOpen(false)
              setRejectingEntry(null)
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10">
                  <ShieldX className="h-4 w-4 text-destructive" />
                </div>
                Reject Document
              </DialogTitle>
              <DialogDescription>
                {rejectingEntry?.name} — {DOCUMENT_TYPE_LABELS[rejectingEntry?.documentType || ""] || rejectingEntry?.documentType}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-2">
              <div className="grid gap-2">
                <Label htmlFor="standard-reason">
                  Reason for rejection <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedStandardReason}
                  onValueChange={(val) => {
                    setSelectedStandardReason(val)
                    if (rejectionReasonError) setRejectionReasonError("")
                  }}
                >
                  <SelectTrigger
                    id="standard-reason"
                    className={`w-full ${
                      rejectionReasonError && !selectedStandardReason
                        ? "border-destructive ring-destructive/20"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_REJECTION_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStandardReason === "Other" && (
                <div className="grid gap-2">
                  <Label htmlFor="custom-reason">Please specify</Label>
                  <Textarea
                    id="custom-reason"
                    className={`min-h-[80px] resize-none ${
                      rejectionReasonError && selectedStandardReason === "Other"
                        ? "border-destructive ring-destructive/20"
                        : ""
                    }`}
                    placeholder="Enter specific details for rejection..."
                    value={customReason}
                    onChange={(e) => {
                      setCustomReason(e.target.value)
                      if (rejectionReasonError) setRejectionReasonError("")
                    }}
                    autoFocus
                  />
                </div>
              )}

              {rejectionReasonError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {rejectionReasonError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This reason will be visible to the job provider.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectModalOpen(false)
                  setRejectingEntry(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectWithReason}
                disabled={isUpdating}
              >
                <ShieldX className="mr-2 h-4 w-4" />
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AuthGuard>
  )
}
