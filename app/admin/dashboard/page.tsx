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
    error,
    totalUsers
  } = useAppSelector((state) => state.dashboard)

  useEffect(() => {
    // Fetch dashboard stats from job-seekers/count endpoint
    dispatch(fetchJobSeekersCount())
  }, [dispatch])

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-8 mt-4 sm:mt-0">
          <PageHeader title="Dashboard" description="Overview of your job listing platform" />

          {/* System Overview Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/40 backdrop-blur-md p-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-foreground">Cluster Status: All Systems Operational</span>
              <span className="text-muted-foreground hidden sm:inline">&bull;</span>
              <span className="text-muted-foreground hidden sm:inline">Coolify + Umami + 2FA Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-border/80 bg-muted/40 px-2.5 py-1 text-muted-foreground font-mono text-[11px]">
                EC2 Production (98.90.3.187)
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 rounded-xl border border-border/80 bg-card/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatCard
                title="All Users"
                value={totalUsers}
                icon={Users}
                description="Total platform registered users"
              />
              <StatCard
                title="Job Seekers"
                value={totalJobSeekers}
                icon={Users}
                description="Active candidate profiles"
              />
              <StatCard
                title="Job Providers"
                value={totalJobProviders}
                icon={Building2}
                description="Verified enterprise accounts"
              />
              <StatCard
                title="Total Jobs"
                value={totalJobs}
                icon={Briefcase}
                description="Syndicated job postings"
              />
              <StatCard
                title="Applications"
                value={totalApplications}
                icon={FileText}
                description="Submitted candidate applications"
              />
            </div>
          )}

          {/* Quick Actions & Live Operations Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Analytics & Traffic Card */}
            <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 space-y-4 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Real-time Attribution & Traffic</h3>
                    <p className="text-xs text-muted-foreground">Self-hosted hardened Umami engine</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  300MB RAM Capped
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Monitor real-time campaign attribution, UTM sources, bounce rates, and conversion funnels directly without third-party data tracking.
              </p>
              <div className="pt-2">
                <a
                  href="/admin/analytics"
                  className="inline-flex items-center text-xs font-semibold text-primary hover:underline gap-1"
                >
                  View Marketing Analytics &rarr;
                </a>
              </div>
            </div>

            {/* Geographic Distribution Card */}
            <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 space-y-4 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-2 text-orange-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Global User Heatmap</h3>
                    <p className="text-xs text-muted-foreground">Candidate & Provider Coordinates</p>
                  </div>
                </div>
                <span className="rounded-md border border-border/80 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                  Interactive Supercluster
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Interactive spatial map plotting real-time seeker and provider distribution across regions with automatic zoom clustering.
              </p>
              <div className="pt-2">
                <a
                  href="/admin/user-map"
                  className="inline-flex items-center text-xs font-semibold text-primary hover:underline gap-1"
                >
                  Open Global User Map &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
