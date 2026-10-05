"use client"

import { useState, useRef, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, ExternalLink, ShieldCheck, BarChart3, Maximize2, Minimize2 } from "lucide-react"

const SITES = [
  {
    id: "app",
    label: "App Portal (app.hirenest.ai)",
    url: "https://analytics.hirenest.ai/share/hirenest-analytics",
    description: "Logged-in job seekers, employers, applications, and AI interviews",
  },
  {
    id: "marketing",
    label: "Marketing Website (hirenest.ai)",
    url: "https://analytics.hirenest.ai/share/hirenest-website",
    description: "Public visitors, SEO, blogs, salary guides, and CTA conversions",
  },
]

export default function AnalyticsPage() {
  const [activeSite, setActiveSite] = useState<"app" | "marketing">("app")
  const [isLoading, setIsLoading] = useState(true)
  const [iframeKey, setIframeKey] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentSite = SITES.find((s) => s.id === activeSite) || SITES[0]
  const umamiUrl = currentSite.url

  const handleSiteChange = (siteId: "app" | "marketing") => {
    if (siteId === activeSite) return
    setIsLoading(true)
    setActiveSite(siteId)
    setIframeKey((prev) => prev + 1)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setIframeKey((prev) => prev + 1)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } catch (err) {
      console.error("Fullscreen toggle error:", err)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

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
                className="h-9 gap-1.5 border-border/80 bg-card/60 hover:bg-muted text-foreground"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>

              {/* Native HTML5 Fullscreen */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="h-9 gap-1.5 border-border/80 bg-card/60 hover:bg-muted text-foreground"
                title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
              </Button>

              {/* Open in External Tab */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(umamiUrl, "_blank")}
                className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                title="Open standalone dashboard in a new tab"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">New Tab</span>
              </Button>
            </div>
          </div>

          {/* Security & System Info Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/40 backdrop-blur-md px-4 py-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>
                Hardened Isolation: <strong className="text-foreground">300MB RAM Capped</strong> &bull; Non-Root UID 1000 &bull; Frame Ancestor Whitelist Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Analytics Engine Live
              </span>
            </div>
          </div>

          {/* Site Selector Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
            <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/60">
              {SITES.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => handleSiteChange(site.id as "app" | "marketing")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeSite === site.id
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  }`}
                >
                  <BarChart3 className={`h-3.5 w-3.5 ${activeSite === site.id ? "text-primary" : "text-muted-foreground"}`} />
                  <span>{site.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {currentSite.description}
            </p>
          </div>

          {/* Embedded Full Dashboard Container */}
          <div
            ref={containerRef}
            className={`relative w-full rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden ${
              isFullscreen ? "h-screen w-screen rounded-none border-none p-0 m-0" : "min-h-[calc(100vh-14rem)]"
            }`}
          >
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-10 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Loading Analytics Engine...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Connecting to hardened analytics service</p>
                </div>
              </div>
            )}

            <iframe
              key={iframeKey}
              src={umamiUrl}
              className={`w-full border-0 ${
                isFullscreen ? "h-screen" : "h-full min-h-[calc(100vh-14rem)]"
              }`}
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
