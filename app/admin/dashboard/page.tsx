// Dashboard page with statistics

"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { Users, Building2, Briefcase, FileText, TrendingUp, Calendar as CalendarIcon } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { fetchJobSeekersCount, fetchDashboardAnalytics } from "@/lib/store/dashboardSlice"
import dynamic from "next/dynamic"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DashboardChart = dynamic(() => import("@/components/admin/dashboard-chart").then(mod => mod.DashboardChart), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full rounded-xl bg-muted/20 animate-pulse border flex items-center justify-center">Loading chart...</div>
})

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const { 
    totalJobSeekers, 
    totalJobProviders, 
    totalJobs, 
    totalApplications,
    totalUsers,
    analytics,
    isStatsLoading,
    isAnalyticsLoading,
    error
  } = useAppSelector((state) => state.dashboard)

  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    // Fetch dashboard stats from job-seekers/count endpoint
    dispatch(fetchJobSeekersCount())
  }, [dispatch])

  useEffect(() => {
    // Fetch dashboard analytics when timeRange changes
    dispatch(fetchDashboardAnalytics(timeRange))
  }, [dispatch, timeRange])

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-8 mt-4 sm:mt-0 pb-10">
          <PageHeader title="Dashboard" description="Overview of your job listing platform" />

          {/* Statistics Section */}
          {isStatsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatCard
                title="All User"
                value={totalUsers}
                icon={Users}
                description="Total users"
              />
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

          {/* Analytics Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Growth Analytics</h2>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px] h-9">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className={`grid gap-4 md:grid-cols-2 transition-opacity duration-200 ${isAnalyticsLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <DashboardChart 
                title="Job Seekers Onboarded" 
                data={analytics.jobSeekers} 
                color="#3b82f6" 
              />
              <DashboardChart 
                title="Companies Onboarded" 
                data={analytics.companies} 
                color="#8b5cf6" 
              />
              <DashboardChart 
                title="Users Not Onboarded" 
                data={analytics.notOnboarded} 
                color="#f43f5e" 
              />
              <DashboardChart 
                title="Jobs Posted" 
                data={analytics.jobs} 
                color="#10b981" 
              />
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
