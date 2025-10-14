// Dashboard page with statistics

"use client"

import { useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { Users, Building2, Briefcase, FileText, TrendingUp } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { fetchJobSeekersCount } from "@/lib/store/dashboardSlice"

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const { 
    totalJobSeekers, 
    totalJobProviders, 
    totalJobs, 
    totalApplications,
    isLoading,
    error 
  } = useAppSelector((state) => state.dashboard)

  useEffect(() => {
    // Fetch dashboard stats from job-seekers/count endpoint
    dispatch(fetchJobSeekersCount())
  }, [dispatch])

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-8">
          <PageHeader title="Dashboard" description="Overview of your job listing platform" />

          {/* Show error if any */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive">
              <p className="text-sm font-medium">Error: {error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Job Seekers"
                value={totalJobSeekers}
                icon={Users}
                description="Total job seekers"
              />
              <StatCard
                title="Job Providers"
                value={totalJobProviders}
                icon={Building2}
                description="Total companies"
              />
              <StatCard
                title="Total Jobs"
                value={totalJobs}
                icon={Briefcase}
                description="All job postings"
              />
              <StatCard
                title="Applications"
                value={totalApplications}
                icon={FileText}
                description="Total applications"
              />
            </div>
          )}

          {/* Recent Activity Section */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            </div>
            <p className="text-sm text-muted-foreground">Activity tracking will be displayed here once implemented.</p>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
