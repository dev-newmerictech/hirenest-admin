"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { fetchMetrics, fetchInsights, triggerGenerateInsights, fetchFeedbackList, setFilters, setPage } from "@/lib/store/feedbackAnalyticsSlice"
import { DetailDrawer } from "@/components/admin/detail-drawer"
import { FeedbackItem } from "@/lib/api/feedback"
import { format } from "date-fns"
import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Modular components
import { KpiRow } from "@/components/admin/feedback/kpi-row"
import { TrendsChart } from "@/components/admin/feedback/trends-chart"
import { FeatureSentimentChart } from "@/components/admin/feedback/feature-sentiment-chart"
import { AiInsightsPanel } from "@/components/admin/feedback/ai-insights-panel"
import { RawDataTable } from "@/components/admin/feedback/raw-data-table"
import { SentimentBadge } from "@/components/admin/feedback/sentiment-badge"

export default function FeedbackDashboardPage() {
  const dispatch = useAppDispatch()
  const { metrics, metricsLoading, insights, insightsLoading, insightsGenerating, insufficientDataMsg, list, listLoading, pagination, filters } = useAppSelector((state) => state.feedbackAnalytics)
  
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchMetrics())
    dispatch(fetchInsights())
    dispatch(fetchFeedbackList())
  }, [dispatch])

  const handleGenerateInsights = () => {
    dispatch(triggerGenerateInsights())
  }

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value }))
    dispatch(fetchFeedbackList())
  }

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage))
    dispatch(fetchFeedbackList())
  }

  const openDrawer = (item: FeedbackItem) => {
    setSelectedFeedback(item)
    setDrawerOpen(true)
  }

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-8 mt-4 sm:mt-0">
          <PageHeader title="Feedback Analytics" description="Enterprise-grade data visualization for user feedback synthesis" />

          {/* Tier 1: KPI Row */}
          <KpiRow metrics={metrics} loading={metricsLoading} />

          {/* Tier 2: Trends */}
          <div className="grid gap-4 md:grid-cols-2">
            <TrendsChart metrics={metrics} loading={metricsLoading} />
            <FeatureSentimentChart metrics={metrics} loading={metricsLoading} />
          </div>

          {/* Tier 3: AI Insights */}
          <AiInsightsPanel 
            insights={insights}
            loading={insightsLoading}
            generating={insightsGenerating}
            insufficientDataMsg={insufficientDataMsg}
            onGenerate={handleGenerateInsights}
          />

          {/* Tier 4: Raw Data Table */}
          <RawDataTable
            list={list}
            loading={listLoading}
            filters={filters}
            pagination={pagination}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onRowClick={openDrawer}
          />
        </div>
      </AdminLayout>

      {/* Tier 4 Detail Drawer */}
      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Feedback Details">
        {selectedFeedback && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{selectedFeedback.featureKey}</h3>
                <p className="text-sm text-muted-foreground">{format(new Date(selectedFeedback.createdAt), 'MMMM dd, yyyy HH:mm')}</p>
              </div>
              <SentimentBadge sentiment={selectedFeedback.sentiment} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rating</p>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < selectedFeedback.rating ? 'fill-primary text-primary' : 'text-muted'}`} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">User Role</p>
                <Badge variant="outline">{selectedFeedback.profileType}</Badge>
              </div>
            </div>

            {selectedFeedback.profileId && (
              <div className="bg-muted/30 p-4 rounded-md border border-border">
                <p className="text-sm font-medium mb-2">User Details</p>
                <div className="space-y-1">
                  <p className="text-sm"><span className="text-muted-foreground">Name:</span> {selectedFeedback.profileId.name}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Email:</span> {selectedFeedback.profileId.email}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-2">Technical ID</p>
              <p className="font-mono text-xs text-muted-foreground bg-muted p-2 rounded-md break-all">{selectedFeedback._id}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Raw Comment</p>
              <div className="bg-card border border-border p-4 rounded-md whitespace-pre-wrap text-sm">
                {selectedFeedback.comment || <span className="italic text-muted-foreground">User did not provide a comment.</span>}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </AuthGuard>
  )
}
