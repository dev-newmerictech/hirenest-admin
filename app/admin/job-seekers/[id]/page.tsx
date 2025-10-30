"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { jobSeekersApi } from "@/lib/api/jobSeekers"

interface ProfileData {
  _id: string
  name?: string
  email?: string
  profilePicture?: string
  bio?: string
  address?: { city?: string }
  mobile?: { countryCode?: number | string; mobileNumber?: number | string }
  linkedin?: string
  countryCode?: string
  preferences?: {
    experienceLevel?: "entry" | "mid" | "senior" | "expert"
    skills?: string[]
    openToWork?: string
  }
  experiences?: Array<{
    position?: string
    company?: string
    startDate?: string
    endDate?: string | null
    keyResponsibilities?: string[] | string
  }>
  educations?: Array<{
    degree?: string
    institution?: string
    startDate?: string
    endDate?: string | null
  }>
  createdAt?: string
}

function formatDateToDashFormat(date?: string) {
  if (!date) return ""
  const d = new Date(date)
  if (isNaN(d.getTime())) return ""
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export default function JobSeekerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      if (!id) return
      try {
        setIsLoading(true)
        const res = await jobSeekersApi.getJobSeekerProfile(id)
        if (isMounted) setProfileData(res.data as unknown as ProfileData)
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load profile")
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [id])

  const experienceYears = (() => {
    const level = profileData?.preferences?.experienceLevel
    if (!level) return "0"
    switch (level) {
      case "entry":
        return "0-2"
      case "mid":
        return "2-5"
      case "senior":
        return "5-8"
      case "expert":
        return "8+"
      default:
        return "0"
    }
  })()

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <PageHeader title="Job Seeker Profile" description="Detailed profile view" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>Back</Button>
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : (
            <div className="py-6">
              {/* Header Card */}
              <Card className="border bg-white shadow-sm flex flex-row items-center gap-4 justify-start border-[#ECECF6] rounded-lg px-6 py-4 mb-4">
                <img
                  src={profileData?.profilePicture || "/placeholder-user.jpg"}
                  alt="User"
                  className="w-[100px] h-[100px] rounded-full object-cover"
                />
                <div className="flex flex-col items-start justify-start flex-1">
                  <h1 className="text-[#2A3F5E] text-[30px] font-bold mb-0">
                    {profileData?.name}
                  </h1>
                  <p className="text-[#59596B] text-[16px] font-normal mb-0">
                    {profileData?.experiences?.[0]?.position || "-"}
                  </p>
                  <hr className="w-full border-t border-[#ECECF6] my-2" />
                  <div className="flex flex-row items-center gap-6 text-[#59596B] text-[16px]">
                    <div className="flex items-center gap-2">
                      <span>{profileData?.address?.city || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{experienceYears} years experience</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#05B554] font-medium">
                      <span className="relative pl-3">
                        <span className="absolute left-0 top-1.5 w-[6px] h-[6px] bg-[#05B554] rounded-full" />
                        {profileData?.preferences?.openToWork || "Available for work"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: About + Experience */}
                <div className="lg:col-span-2 space-y-4">
                  {profileData?.bio && (
                    <Card className="border bg-white shadow-sm flex flex-col items-start justify-start border-[#ECECF6] rounded-lg px-6 py-6">
                      <h3 className="text-[16px] font-bold text-[#2A3F5E] mb-2">About Me</h3>
                      <p className="text-[16px] font-normal text-[#1D2D46] mb-0">{profileData?.bio}</p>
                    </Card>
                  )}

                  <Card className="border bg-white shadow-sm flex flex-col items-start justify-start border-[#ECECF6] rounded-lg px-6 py-6">
                    <h3 className="text-[16px] font-bold text-[#2A3F5E] mb-3">Work Experience</h3>
                    <div className="grid grid-cols-1 gap-4 w-full">
                      {profileData?.experiences?.map((experience, idx) => (
                        <div key={idx} className="flex flex-col items-start justify-start">
                          <h4 className="text-[18px] font-semibold text-[#2A3F5E] mb-1">{experience?.position}</h4>
                          <div className="text-[16px] font-normal text-[#1D2D46] mb-1">{experience?.company}</div>
                          <div className="text-[14px] font-normal text-[#6B7280] mb-1">
                            {experience?.startDate ? formatDateToDashFormat(experience.startDate) : ""} to {experience?.endDate ? formatDateToDashFormat(experience.endDate) : "Present"}
                          </div>
                          <div className="text-[14px] font-normal text-[#1D2D46] mb-0">
                            {Array.isArray(experience?.keyResponsibilities)
                              ? experience?.keyResponsibilities?.join(", ")
                              : experience?.keyResponsibilities}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Right: Contact + Skills + Education */}
                <div className="space-y-4">
                  <Card className="border bg-white shadow-sm flex flex-col items-start justify-start border-[#ECECF6] rounded-lg px-6 py-6">
                    <h3 className="text-[16px] font-bold text-[#2A3F5E] mb-3">Contact</h3>
                    <div className="flex flex-col items-start justify-start gap-2">
                      <div className="text-[16px] font-normal text-[#101013]">{profileData?.email}</div>
                      <div className="text-[16px] font-normal text-[#101013]">
                        +{profileData?.mobile?.countryCode} {profileData?.mobile?.mobileNumber}
                      </div>
                      <div className="text-[16px] font-normal text-[#101013]">{profileData?.linkedin || "-"}</div>
                      <div className="text-[16px] font-normal text-[#101013]">{profileData?.countryCode || "-"}</div>
                    </div>
                  </Card>

                  <Card className="border bg-white shadow-sm flex flex-col items-start justify-start border-[#ECECF6] rounded-lg px-6 py-6">
                    <h3 className="text-[16px] font-bold text-[#2A3F5E] mb-3">Core Skills</h3>
                    <div className="flex flex-row flex-wrap gap-2 w-full">
                      {profileData?.preferences?.skills?.map((skill, idx) => (
                        <div key={idx} className="flex flex-row items-center" style={{ background: "#E0E7FF", padding: "5px 10px", borderRadius: "8px" }}>
                          <span className="text-[12px] text-[#4338CA]">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="border bg-white shadow-sm flex flex-col items-start justify-start border-[#ECECF6] rounded-lg px-6 py-6">
                    <h3 className="text-[16px] font-bold text-[#2A3F5E] mb-3">Education</h3>
                    <div className="grid grid-cols-1 gap-4 w-full">
                      {profileData?.educations?.map((edu, idx) => (
                        <div key={idx} className="flex flex-col items-start justify-start">
                          <div className="text-[16px] font-semibold text-[#101013] mb-2">{edu?.degree}</div>
                          <div className="text-[16px] font-medium text-[#31313A] mb-2">{edu?.institution}</div>
                          <div className="text-[14px] font-normal text-[#6B7280] mb-0">
                            {edu?.startDate ? formatDateToDashFormat(edu.startDate) : ""} to {edu?.endDate ? formatDateToDashFormat(edu.endDate) : "Present"}
                          </div>
                        </div>
                      ))}
                    </div>
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


