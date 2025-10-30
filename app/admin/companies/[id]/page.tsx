"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { companiesApi } from "@/lib/api/companies"

interface CompanyProfile {
  _id: string
  name?: string
  email?: string
  industry?: string
  logo?: string
  website?: string
  address?: { city?: string; country?: string }
  mobile?: { countryCode?: number | string; mobileNumber?: number | string }
  isActive?: boolean
  isVerified?: boolean
  verificationStatus?: "pending" | "approved" | "rejected"
  isDocumentVerified?: boolean
  createdAt?: string
  description?: string
}

export default function CompanyProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      if (!id) return
      try {
        setIsLoading(true)
        const res = await companiesApi.getCompanyProfile(id)
        if (isMounted) setProfile(res.data as unknown as CompanyProfile)
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

  const verification = (() => {
    if (profile?.isDocumentVerified === true) return { label: "Verified", variant: "default" as const, cls: "bg-green-500/10 text-green-600" }
    if (profile?.isDocumentVerified === false || profile?.verificationStatus === "rejected") return { label: "Rejected", variant: "destructive" as const, cls: "bg-red-500/10 text-red-600" }
    return { label: "Pending", variant: "secondary" as const, cls: "" }
  })()

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <PageHeader title="Company Profile" description="Detailed company view" />
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
              {/* Header */}
              <Card className="border bg-white shadow-sm flex flex-row items-center gap-4 justify-start border-[#ECECF6] rounded-lg px-6 py-4 mb-4">
                <img
                  src={profile?.logo || "/placeholder-logo.png"}
                  alt="Logo"
                  className="w-[80px] h-[80px] rounded-md object-cover"
                />
                <div className="flex-1">
                  <h1 className="text-[#2A3F5E] text-[26px] font-bold mb-1">{profile?.name}</h1>
                  <div className="text-sm text-[#59596B]">{profile?.industry || "N/A"}</div>
                  <div className="mt-2">
                    <Badge className={verification.cls}>{verification.label}</Badge>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: About */}
                <div className="lg:col-span-2 space-y-4">
                  {profile?.description && (
                    <Card className="border bg-white shadow-sm flex flex-col items-start justify-start border-[#ECECF6] rounded-lg px-6 py-6">
                      <h3 className="text-[16px] font-bold text-[#2A3F5E] mb-2">About</h3>
                      <p className="text-[16px] font-normal text-[#1D2D46] mb-0">{profile.description}</p>
                    </Card>
                  )}
                </div>

                {/* Right: Contact */}
                <div className="space-y-4">
                  <Card className="border bg-white shadow-sm flex flex-col items-start justify-start border-[#ECECF6] rounded-lg px-6 py-6">
                    <h3 className="text-[16px] font-bold text-[#2A3F5E] mb-3">Contact</h3>
                    <div className="flex flex-col gap-2 text-[16px] text-[#101013]">
                      <div>{profile?.email}</div>
                      <div>+{profile?.mobile?.countryCode} {profile?.mobile?.mobileNumber}</div>
                      <div>{profile?.website || "-"}</div>
                      <div>{profile?.address?.city} {profile?.address?.country ? `, ${profile.address.country}` : ""}</div>
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


