"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, ExternalLink, ShieldCheck, BarChart3, Info } from "lucide-react"

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [iframeKey, setIframeKey] = useState(0)

  // Configurable Umami public share or dashboard URL
  const umamiUrl =
    process.env.NEXT_PUBLIC_UMAMI_EMBED_URL || "https://analytics.hirenest.ai"

  const handleRefresh = () => {
    setIsLoading(true)
    setIframeKey((prev) => prev + 1)
  }

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <PageHeader
              title="Marketing & UTM Analytics"
              description="Real-time campaign attribution, traffic sources, bounce rates, and conversion funnels."
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="h-9 gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(umamiUrl, "_blank")}
                className="h-9 gap-1.5"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open Fullscreen</span>
              </Button>
            </div>
          </div>

          {/* Security & System Info Pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>
                Isolated Container: <strong>300MB Capped</strong> &bull; Non-Root UID 1000 &bull; Clickjacking Frame Guard Active
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span>Target: <code>{umamiUrl}</code></span>
            </div>
          </div>

          {/* Embedded Full Umami Dashboard Container */}
          <div className="relative w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden min-h-[calc(100vh-14rem)]">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm z-10 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Loading Analytics Engine...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Connecting to hardened Umami service</p>
                </div>
              </div>
            )}

            <iframe
              key={iframeKey}
              src={umamiUrl}
              className="w-full h-full min-h-[calc(100vh-14rem)] border-0"
              onLoad={() => setIsLoading(false)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title="HireNest Traffic and Marketing Analytics"
            />
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
