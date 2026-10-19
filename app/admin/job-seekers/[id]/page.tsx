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
  Briefcase, 
  GraduationCap, 
  Award, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Globe, 
  Sparkles 
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
  clearSelectedJobSeeker,
  fetchJobSeekerProfile,
} from "@/lib/store/jobSeekersSlice"

function getIdParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? ""
  }
  return value ?? ""
}

export default function JobSeekerProfilePage() {
  const router = useRouter()
  const params = useParams<{ id: string | string[] }>()
  const dispatch = useAppDispatch()
  
  const currentUser = useAppSelector((state) => state.auth.user)
  const isSuperAdmin = currentUser?.adminRole === "super_admin"
  
  const { selectedJobSeeker, isLoading, error } = useAppSelector((state) => state.jobSeekers)
  const jobSeekerId = useMemo(() => getIdParam(params?.id), [params?.id])

  useEffect(() => {
    if (jobSeekerId && isSuperAdmin) {
      dispatch(fetchJobSeekerProfile(jobSeekerId))
    }

    return () => {
      dispatch(clearSelectedJobSeeker())
      dispatch(clearError())
    }
  }, [dispatch, jobSeekerId, isSuperAdmin])

  const backButton = (
    <Button variant="outline" onClick={() => router.push("/admin/job-seekers")} className="gap-2">
      <ArrowLeft className="h-4 w-4" />
      Back to Job Seekers
    </Button>
  )

  const initials = useMemo(() => {
    if (!selectedJobSeeker?.name) return "JS"
    return selectedJobSeeker.name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }, [selectedJobSeeker?.name])

  const locationString = useMemo(() => {
    if (!selectedJobSeeker) return "Not specified"
    const parts = [
      selectedJobSeeker.addressLine1,
      selectedJobSeeker.city,
      selectedJobSeeker.state,
      selectedJobSeeker.country,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(", ") : "Not specified"
  }, [selectedJobSeeker])

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
          <PageHeader 
            title="Candidate Profile" 
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
                    Viewing complete candidate profile details, resumes, contact information, and personal records is restricted strictly to Super Admin accounts.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/job-seekers")}>
                    Return to Job Seekers Directory
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : !jobSeekerId ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">Invalid job seeker ID in URL.</p>
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
          ) : !selectedJobSeeker ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Job seeker not found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Top Hero / Header Card */}
              <Card className="overflow-hidden border-border/70 shadow-sm">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent h-24 sm:h-28" />
                <CardContent className="relative pt-0 sm:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
                    <div className="flex items-end gap-4">
                      <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-md">
                        {selectedJobSeeker.profilePicture ? (
                          <AvatarImage src={selectedJobSeeker.profilePicture} alt={selectedJobSeeker.name} />
                        ) : null}
                        <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {selectedJobSeeker.name}
                          </h1>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                            Job Seeker
                          </Badge>
                          <StatusBadge status={selectedJobSeeker.isActive} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span>{selectedJobSeeker.email}</span>
                          {selectedJobSeeker.acquisitionSource && (
                            <>
                              <span>•</span>
                              <SourceBadge source={selectedJobSeeker.acquisitionSource} />
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
                        {selectedJobSeeker.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate select-all text-foreground font-medium">
                        {selectedJobSeeker.phone || "No phone provided"}
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
                        Joined {format(new Date(selectedJobSeeker.registrationDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Profile Grid: Left 2 cols, Right 1 col */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Bio / Summary */}
                  {selectedJobSeeker.bio && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          About / Professional Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line bg-muted/30 p-4 rounded-lg border border-border/50">
                          {selectedJobSeeker.bio}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Work Experiences */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Experience History ({selectedJobSeeker.experiences?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!selectedJobSeeker.experiences || selectedJobSeeker.experiences.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No work experience entries recorded.</p>
                      ) : (
                        selectedJobSeeker.experiences.map((exp, idx) => (
                          <div key={idx} className="p-4 rounded-lg bg-card border border-border/70 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <h4 className="font-semibold text-foreground text-sm">
                                {exp.position || "Position not specified"}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {exp.startDate ? format(new Date(exp.startDate), "MMM yyyy") : "N/A"} -{" "}
                                {exp.endDate ? format(new Date(exp.endDate), "MMM yyyy") : "Present"}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-primary">{exp.company || "Company not specified"}</p>
                            {exp.keyResponsibilities && exp.keyResponsibilities.length > 0 && (
                              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1 pt-1">
                                {exp.keyResponsibilities.map((resp, rIdx) => (
                                  <li key={rIdx}>{resp}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Education */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        Education ({selectedJobSeeker.educations?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!selectedJobSeeker.educations || selectedJobSeeker.educations.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No education entries recorded.</p>
                      ) : (
                        selectedJobSeeker.educations.map((edu, idx) => (
                          <div key={idx} className="p-4 rounded-lg bg-card border border-border/70 space-y-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <h4 className="font-semibold text-foreground text-sm">
                                {edu.degree || "Degree not specified"}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {edu.startDate ? format(new Date(edu.startDate), "yyyy") : "N/A"} -{" "}
                                {edu.endDate ? format(new Date(edu.endDate), "yyyy") : "Present"}
                              </span>
                            </div>
                            <p className="text-xs text-primary font-medium">{edu.institution || "Institution not specified"}</p>
                            {edu.fieldOfStudy && (
                              <p className="text-xs text-muted-foreground">Field of study: {edu.fieldOfStudy}</p>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Skills, Documents, Preferences, Social Links */}
                <div className="space-y-6">
                  {/* Resumes & Documents */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Resumes & Documents ({selectedJobSeeker.documents?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selectedJobSeeker.documents || selectedJobSeeker.documents.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No documents uploaded.</p>
                      ) : (
                        selectedJobSeeker.documents.map((doc, idx) => {
                          const docUrl = doc.url && doc.url.length > 0 ? doc.url[0] : null
                          return (
                            <div key={idx} className="p-3 rounded-lg border border-border/70 bg-card space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-xs capitalize text-foreground flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5 text-primary" />
                                  {doc.name || "Resume PDF"}
                                </span>
                                {doc.verificationStatus && (
                                  <Badge variant="outline" className="text-[10px] capitalize">
                                    {doc.verificationStatus}
                                  </Badge>
                                )}
                              </div>
                              {docUrl ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-2 text-xs h-8"
                                  asChild
                                >
                                  <a href={docUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View Resume on S3
                                  </a>
                                </Button>
                              ) : (
                                <p className="text-[11px] text-muted-foreground">No file link available</p>
                              )}
                            </div>
                          )
                        })
                      )}
                    </CardContent>
                  </Card>

                  {/* Skills */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        Skills & Competencies
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selectedJobSeeker.preferences?.skills || selectedJobSeeker.preferences.skills.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No skills listed.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedJobSeeker.preferences.skills.map((skill, idx) => {
                            const isVerified = selectedJobSeeker.preferences?.verifiedSkills?.includes(skill)
                            return (
                              <Badge
                                key={idx}
                                variant={isVerified ? "default" : "secondary"}
                                className={`text-xs ${
                                  isVerified ? "bg-green-600/90 hover:bg-green-600 gap-1" : ""
                                }`}
                              >
                                {isVerified && <Sparkles className="h-3 w-3" />}
                                {skill}
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Preferences */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        Work Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Open to Work:</span>
                        <span className="font-medium capitalize text-foreground">
                          {selectedJobSeeker.preferences?.openToWork || "Not specified"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Work Mode:</span>
                        <span className="font-medium capitalize text-foreground">
                          {selectedJobSeeker.preferences?.workMode?.join(", ") || "Any"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Employment Type:</span>
                        <span className="font-medium capitalize text-foreground">
                          {selectedJobSeeker.preferences?.employmentType?.join(", ") || "Any"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="font-medium capitalize text-foreground">
                          {selectedJobSeeker.gender || "Not specified"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Links */}
                  {selectedJobSeeker.socialLinks && selectedJobSeeker.socialLinks.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          Online Profiles
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedJobSeeker.socialLinks.map((link, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-muted/40">
                            <span className="font-medium capitalize">{link.platform || "Web link"}</span>
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

                  {/* Account / Audit Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Audit Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>Profile ID:</span>
                        <span className="font-mono text-foreground">{selectedJobSeeker.id}</span>
                      </div>
                      {selectedJobSeeker.createdByDetails?.provider && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span>Auth Provider:</span>
                          <span className="capitalize text-foreground">
                            {selectedJobSeeker.createdByDetails.provider.join(", ")}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span>Read-Only Mode:</span>
                        <span className="text-green-600 font-medium">Enforced</span>
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
