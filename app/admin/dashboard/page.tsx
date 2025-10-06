// Dashboard page with statistics

"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { Users, Building2, Briefcase, FileText, TrendingUp } from "lucide-react"
import type { DashboardStats } from "@/lib/types"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalJobSeekers: 0,
    totalCompanies: 0,
    activeJobs: 0,
    totalApplications: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch dashboard stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-8">
          <PageHeader title="Dashboard" description="Overview of your job listing platform" />

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatCard title="Total Users" value={stats.totalUsers} icon={Users} description="All registered users" />
              <StatCard
                title="Job Seekers"
                value={stats.totalJobSeekers}
                icon={Users}
                description="Active job seekers"
              />
              <StatCard
                title="Companies"
                value={stats.totalCompanies}
                icon={Building2}
                description="Registered companies"
              />
              <StatCard
                title="Active Jobs"
                value={stats.activeJobs}
                icon={Briefcase}
                description="Currently open positions"
              />
              <StatCard
                title="Applications"
                value={stats.totalApplications}
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
