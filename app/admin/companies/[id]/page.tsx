"use client"

import { useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building2, 
  Briefcase, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Globe, 
  CheckCircle2, 
  Clock, 
  XCircle 
} from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { SourceBadge } from "@/components/admin/source-badge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import {
  clearError,
  clearSelectedCompany,
  fetchCompanyProfile,
} from "@/lib/store/companiesSlice"
import type { DetailedCompany } from "@/lib/types"

function getIdParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? ""
  }
  return value ?? ""
}

export default function CompanyProfilePage() {
  const router = useRouter()
  const params = useParams<{ id: string | string[] }>()
  const dispatch = useAppDispatch()
  
  const currentUser = useAppSelector((state) => state.auth.user)
  const isSuperAdmin = currentUser?.adminRole === "super_admin"

  const { selectedCompany, isLoading, error } = useAppSelector((state) => state.companies)
  const companyId = useMemo(() => getIdParam(params?.id), [params?.id])

  useEffect(() => {
    if (companyId && isSuperAdmin) {
      dispatch(fetchCompanyProfile(companyId))
    }

    return () => {
      dispatch(clearSelectedCompany())
      dispatch(clearError())
    }
  }, [dispatch, companyId, isSuperAdmin])

  const backButton = (
    <Button variant="outline" onClick={() => router.push("/admin/companies")} className="gap-2">
      <ArrowLeft className="h-4 w-4" />
      Back to Companies
    </Button>
  )

  const initials = useMemo(() => {
    if (!selectedCompany?.name) return "CO"
    return selectedCompany.name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }, [selectedCompany?.name])

  const locationString = useMemo(() => {
    if (!selectedCompany) return "Not specified"
    const parts = [
      selectedCompany.addressLine1,
      selectedCompany.city,
      selectedCompany.state,
      selectedCompany.country,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(", ") : "Not specified"
  }, [selectedCompany])

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
          <PageHeader 
            title="Company / Job Provider Profile" 
            description="Strictly read-only administrative inspection (Super Admin)" 
            action={backButton} 
          />

          {!isSuperAdmin ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6 flex items-start gap-4">
                <ShieldAlert className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive">Super Admin Access Required</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Viewing complete employer records, verification documents, and contact details is restricted strictly to Super Admin accounts.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/companies")}>
                    Return to Companies Directory
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : !companyId ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">Invalid company ID in URL.</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="space-y-4">
              <div className="h-48 rounded-xl bg-muted animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-64 rounded-xl bg-muted animate-pulse md:col-span-2" />
                <div className="h-64 rounded-xl bg-muted animate-pulse" />
              </div>
            </div>
          ) : error ? (
            <Card className="border-destructive/30">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </CardContent>
            </Card>
          ) : !selectedCompany ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Company not found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Top Hero / Header Card */}
              <Card className="overflow-hidden border-border/70 shadow-sm">
                <div className="bg-gradient-to-r from-blue-600/15 via-primary/10 to-transparent h-24 sm:h-28" />
                <CardContent className="relative pt-0 sm:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
                    <div className="flex items-end gap-4">
                      <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-md">
                        {selectedCompany.profilePicture ? (
                          <AvatarImage src={selectedCompany.profilePicture} alt={selectedCompany.name} />
                        ) : null}
                        <AvatarFallback className="text-2xl font-bold bg-blue-600 text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {selectedCompany.name}
                          </h1>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium">
                            Job Provider
                          </Badge>
                          <StatusBadge status={selectedCompany.isActive} />
                          {selectedCompany.verificationStatus && (
                            <Badge
                              variant={
                                selectedCompany.verificationStatus === "approved"
                                  ? "default"
                                  : selectedCompany.verificationStatus === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className={`text-xs capitalize ${
                                selectedCompany.verificationStatus === "approved"
                                  ? "bg-green-600/90"
                                  : ""
                              }`}
                            >
                              {selectedCompany.verificationStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span>{selectedCompany.industry || "General Industry"}</span>
                          {selectedCompany.acquisitionSource && (
                            <>
                              <span>•</span>
                              <SourceBadge source={selectedCompany.acquisitionSource} />
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Quick Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-sm">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate select-all text-foreground font-medium">
                        {selectedCompany.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate select-all text-foreground font-medium">
                        {selectedCompany.phone || "No phone provided"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate text-foreground font-medium">
                        {locationString}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-foreground font-medium">
                        Registered {format(new Date(selectedCompany.registrationDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Profile Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* About Company */}
                  {selectedCompany.bio && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          About Company
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line bg-muted/30 p-4 rounded-lg border border-border/50">
                          {selectedCompany.bio}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Representative / Owner Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Company Representatives & Team
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
                          <span className="text-muted-foreground block">Primary Owner / Contact:</span>
                          <span className="font-semibold text-sm text-foreground">
                            {selectedCompany.ownerName || selectedCompany.name}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
                          <span className="text-muted-foreground block">Registered Account Email:</span>
                          <span className="font-semibold text-sm text-foreground select-all">
                            {selectedCompany.email}
                          </span>
                        </div>
                      </div>

                      {selectedCompany.teamMembers && selectedCompany.teamMembers.length > 0 && (
                        <div className="pt-2">
                          <h5 className="text-xs font-semibold text-muted-foreground mb-2">Team Members ({selectedCompany.teamMembers.length})</h5>
                          <div className="space-y-2">
                            {selectedCompany.teamMembers.map((tm, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-card border border-border/60 text-xs">
                                <span className="font-medium text-foreground">{tm.name || tm.email}</span>
                                <Badge variant="outline" className="text-[10px] capitalize">{tm.role || "Member"}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Job Postings Overview */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          Hiring Activity
                        </span>
                        <Badge variant="secondary" className="font-semibold">
                          {selectedCompany.jobPostsCount ?? 0} Jobs Posted
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/60">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Active Recruitment Postings</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedCompany.jobPostsCount 
                              ? `This company has published ${selectedCompany.jobPostsCount} job opportunities on HireNest.` 
                              : "No jobs have been posted by this company yet."}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => router.push(`/admin/jobs?search=${encodeURIComponent(selectedCompany.name)}`)}
                        >
                          View Jobs Directory
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Verification, Documents, Social Links, Audit */}
                <div className="space-y-6">
                  {/* Verification & Compliance */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Verification & Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card">
                        <span className="text-xs text-muted-foreground">GSTIN / Doc Status:</span>
                        <Badge
                          variant={
                            selectedCompany.isDocumentVerified
                              ? "default"
                              : selectedCompany.verificationStatus === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                          className="capitalize text-xs"
                        >
                          {selectedCompany.verificationStatus || "Pending"}
                        </Badge>
                      </div>

                      {selectedCompany.documents && selectedCompany.documents.length > 0 ? (
                        selectedCompany.documents.map((doc, idx) => {
                          const docUrl = doc.url && doc.url.length > 0 ? doc.url[0] : null
                          return (
                            <div key={idx} className="p-3 rounded-lg border border-border/70 bg-card space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-xs capitalize text-foreground flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5 text-primary" />
                                  {doc.name || "Business Document"}
                                </span>
                              </div>
                              {docUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-2 text-xs h-8"
                                  asChild
                                >
                                  <a href={docUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View Document on S3
                                  </a>
                                </Button>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No verification documents attached.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Hiring Preferences & Sectors */}
                  {selectedCompany.preferences && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          Hiring Focus
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        {selectedCompany.preferences.industries && selectedCompany.preferences.industries.length > 0 && (
                          <div>
                            <span className="text-muted-foreground block mb-1">Target Industries:</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedCompany.preferences.industries.map((ind, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{ind}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedCompany.preferences.workMode && selectedCompany.preferences.workMode.length > 0 && (
                          <div className="flex justify-between py-1 border-t border-border/40">
                            <span className="text-muted-foreground">Work Modes:</span>
                            <span className="font-medium capitalize text-foreground">
                              {selectedCompany.preferences.workMode.join(", ")}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Social Links */}
                  {selectedCompany.socialLinks && selectedCompany.socialLinks.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          Website & Profiles
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedCompany.socialLinks.map((link, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-muted/40">
                            <span className="font-medium capitalize">{link.platform || "Website"}</span>
                            {link.url ? (
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                Open <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Audit Details */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Audit Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>Company Profile ID:</span>
                        <span className="font-mono text-foreground">{selectedCompany.id}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Read-Only Mode:</span>
                        <span className="text-green-600 font-medium">Enforced (Super Admin)</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
