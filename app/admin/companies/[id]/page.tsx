"use client"

import { useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import {
  clearError,
  clearSelectedCompany,
  fetchCompanyProfile,
} from "@/lib/store/companiesSlice"

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
  const { selectedCompany, isLoading, error } = useAppSelector((state) => state.companies)

  const companyId = useMemo(() => getIdParam(params?.id), [params?.id])

  useEffect(() => {
    if (companyId) {
      dispatch(fetchCompanyProfile(companyId))
    }

    return () => {
      dispatch(clearSelectedCompany())
      dispatch(clearError())
    }
  }, [dispatch, companyId])

  const backButton = (
    <Button variant="outline" onClick={() => router.push("/admin/companies")}>
      <ArrowLeft className="h-4 w-4" />
      Back to Companies
    </Button>
  )

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Company Profile" description="View account details" action={backButton} />

          {!companyId ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">Invalid company ID in URL.</p>
              </CardContent>
            </Card>
          ) : null}

          {companyId && isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : null}

          {companyId && !isLoading && error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          ) : null}

          {companyId && !isLoading && !error && !selectedCompany ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Company not found.</p>
              </CardContent>
            </Card>
          ) : null}

          {companyId && !isLoading && !error && selectedCompany ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedCompany.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedCompany.email}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="font-medium">{selectedCompany.industry}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Registration Date</p>
                    <p className="font-medium">
                      {format(new Date(selectedCompany.registrationDate), "MMMM dd, yyyy")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <StatusBadge status={selectedCompany.isActive} />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Verification</p>
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
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
