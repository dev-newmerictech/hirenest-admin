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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const { selectedJobSeeker, isLoading, error } = useAppSelector((state) => state.jobSeekers)

  const jobSeekerId = useMemo(() => getIdParam(params?.id), [params?.id])

  useEffect(() => {
    if (jobSeekerId) {
      dispatch(fetchJobSeekerProfile(jobSeekerId))
    }

    return () => {
      dispatch(clearSelectedJobSeeker())
      dispatch(clearError())
    }
  }, [dispatch, jobSeekerId])

  const backButton = (
    <Button variant="outline" onClick={() => router.push("/admin/job-seekers")}>
      <ArrowLeft className="h-4 w-4" />
      Back to Job Seekers
    </Button>
  )

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Job Seeker Profile" description="View account details" action={backButton} />

          {!jobSeekerId ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">Invalid job seeker ID in URL.</p>
              </CardContent>
            </Card>
          ) : null}

          {jobSeekerId && isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : null}

          {jobSeekerId && !isLoading && error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          ) : null}

          {jobSeekerId && !isLoading && !error && !selectedJobSeeker ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Job seeker not found.</p>
              </CardContent>
            </Card>
          ) : null}

          {jobSeekerId && !isLoading && !error && selectedJobSeeker ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedJobSeeker.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedJobSeeker.email}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedJobSeeker.phone}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Registration Date</p>
                    <p className="font-medium">
                      {format(new Date(selectedJobSeeker.registrationDate), "MMMM dd, yyyy")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <StatusBadge status={selectedJobSeeker.isActive} />
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
