"use client";

import React, { useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchAnalyticsOverview,
  setAnalyticsFilters,
} from "@/lib/store/campaignSlice";
import { CampaignAnalyticsFilters } from "./campaign-analytics-filters";
import { CampaignTimeseriesChart } from "./campaign-timeseries-chart";
import { CampaignFunnelMatrix } from "./campaign-funnel-matrix";
import { CampaignChannelDonut } from "./campaign-channel-donut";
import { TopRequisitionsCard } from "./top-requisitions-card";
import { AttributedCandidatesTable } from "./attributed-candidates-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/utils/excelExport";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Eye,
  Users,
  FileCheck,
  TrendingUp,
  Activity,
  Award,
  ArrowUpDown,
  Sparkles,
  Briefcase,
  Layers,
  Globe,
  ExternalLink,
} from "lucide-react";
import { IAnalyticsOverviewFilters, Campaign } from "@/lib/api/campaigns";

export function CampaignAnalyticsView() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const {
    analyticsOverview,
    isLoadingAnalyticsOverview,
    analyticsFilters,
    platforms,
    campaigns,
    allCampaigns,
  } = useAppSelector((state) => state.campaigns);

  const effectiveCampaigns = useMemo(() => {
    return allCampaigns && allCampaigns.length > 0 ? allCampaigns : campaigns;
  }, [allCampaigns, campaigns]);

  const { allJobPosts } = useAppSelector((state) => state.jobPosts);

  // 3-Way Segmented View: "campaigns" | "job_posts" | "sources"
  const [viewMode, setViewMode] = useState<
    "campaigns" | "job_posts" | "sources"
  >("campaigns");

  // Sorting state for campaigns leaderboard
  const [sortField, setSortField] = useState<
    "impressions" | "leads" | "applications" | "cvr" | "ctr"
  >("applications");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Sorting state for job posts
  const [jobSortField, setJobSortField] = useState<
    "impressions" | "signups" | "applications" | "cvr"
  >("applications");
  const [jobSortDirection, setJobSortDirection] = useState<"asc" | "desc">(
    "desc",
  );

  // Sorting state for sources
  const [sourceSortField, setSourceSortField] = useState<
    "campaigns" | "impressions" | "leads" | "applications" | "cvr"
  >("applications");
  const [sourceSortDirection, setSourceSortDirection] = useState<
    "asc" | "desc"
  >("desc");

  const handleFilterChange = (updates: Partial<IAnalyticsOverviewFilters>) => {
    const newFilters = { ...analyticsFilters, ...updates };
    dispatch(setAnalyticsFilters(newFilters));
    dispatch(fetchAnalyticsOverview(newFilters));
  };

  const handleResetFilters = () => {
    const emptyFilters: IAnalyticsOverviewFilters = {};
    dispatch(setAnalyticsFilters(emptyFilters));
    dispatch(fetchAnalyticsOverview(emptyFilters));
  };

  const handleExport = () => {
    const dateStr = format(new Date(), "yyyy-MM-dd");

    if (viewMode === "campaigns") {
      if (!campaigns || campaigns.length === 0) {
        toast({
          title: "Export Notice",
          description: "No campaign analytics data available to export.",
          variant: "destructive",
        });
        return;
      }

      const flatData = campaigns.map((c: Campaign, idx: number) => {
        const ctr =
          c.impressionsCount > 0
            ? ((c.leadsCount / c.impressionsCount) * 100).toFixed(1)
            : "0.0";
        const cvr =
          c.impressionsCount > 0
            ? ((c.applicationsCount / c.impressionsCount) * 100).toFixed(1)
            : "0.0";

        return {
          Rank: idx + 1,
          "Campaign Name": c.name,
          "Campaign Code": c.campaignCode,
          Channel: c.platform,
          Status: c.status,
          Impressions: c.impressionsCount,
          "Sign-ups": c.leadsCount,
          "CTR (%)": `${ctr}%`,
          Applications: c.applicationsCount,
          "CVR (%)": `${cvr}%`,
          "Created Date": c.createdAt
            ? format(new Date(c.createdAt), "yyyy-MM-dd")
            : "N/A",
        };
      });

      exportToExcel(flatData, `marketing-campaigns-${dateStr}`, "Campaigns");
      toast({
        title: "Export Successful",
        description: `Downloaded spreadsheet with ${flatData.length} campaign rows.`,
      });
    } else if (viewMode === "job_posts") {
      const items = analyticsOverview?.topRequisitions || [];
      if (items.length === 0) {
        toast({
          title: "Export Notice",
          description: "No job post analytics data available to export.",
          variant: "destructive",
        });
        return;
      }

      const flatData = items.map((j, idx) => ({
        Rank: idx + 1,
        "Job Title": j.title,
        "Job ID": j.jobPostId,
        "Linked Campaigns": (j.campaignNames || []).join(", ") || "Direct",
        Channel: j.platform || "Direct",
        Impressions: j.impressions ?? 0,
        "Sign-ups": j.signupsCount ?? 0,
        Applications: j.applicationsCount ?? 0,
        "CVR (%)": `${j.conversionRate ?? 0}%`,
      }));

      exportToExcel(flatData, `marketing-job-posts-${dateStr}`, "JobPosts");
      toast({
        title: "Export Successful",
        description: `Downloaded spreadsheet with ${flatData.length} job post rows.`,
      });
    } else {
      const items = analyticsOverview?.platformBreakdown || [];
      if (items.length === 0) {
        toast({
          title: "Export Notice",
          description: "No source analytics data available to export.",
          variant: "destructive",
        });
        return;
      }

      const flatData = items.map((s, idx) => ({
        Rank: idx + 1,
        Source: s.displayName || s.platform,
        "Active Campaigns": s.campaignsCount,
        Impressions: s.impressions,
        "Sign-ups": s.leads,
        Applications: s.applications,
        "CVR (%)": `${s.conversionRate}%`,
      }));

      exportToExcel(flatData, `marketing-sources-${dateStr}`, "Sources");
      toast({
        title: "Export Successful",
        description: `Downloaded spreadsheet with ${flatData.length} source rows.`,
      });
    }
  };

  const toggleSort = (
    field: "impressions" | "leads" | "applications" | "cvr" | "ctr",
  ) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const toggleJobSort = (
    field: "impressions" | "signups" | "applications" | "cvr",
  ) => {
    if (jobSortField === field) {
      setJobSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setJobSortField(field);
      setJobSortDirection("desc");
    }
  };

  const toggleSourceSort = (
    field: "campaigns" | "impressions" | "leads" | "applications" | "cvr",
  ) => {
    if (sourceSortField === field) {
      setSourceSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSourceSortField(field);
      setSourceSortDirection("desc");
    }
  };

  const sortedLeaderboard = useMemo(() => {
    if (!effectiveCampaigns) return [];
    return [...effectiveCampaigns].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      const ctrA =
        a.impressionsCount > 0 ? (a.leadsCount / a.impressionsCount) * 100 : 0;
      const ctrB =
        b.impressionsCount > 0 ? (b.leadsCount / b.impressionsCount) * 100 : 0;
      const cvrA =
        a.impressionsCount > 0
          ? (a.applicationsCount / a.impressionsCount) * 100
          : 0;
      const cvrB =
        b.impressionsCount > 0
          ? (b.applicationsCount / b.impressionsCount) * 100
          : 0;

      if (sortField === "impressions") {
        valA = a.impressionsCount;
        valB = b.impressionsCount;
      } else if (sortField === "leads") {
        valA = a.leadsCount;
        valB = b.leadsCount;
      } else if (sortField === "applications") {
        valA = a.applicationsCount;
        valB = b.applicationsCount;
      } else if (sortField === "cvr") {
        valA = cvrA;
        valB = cvrB;
      } else if (sortField === "ctr") {
        valA = ctrA;
        valB = ctrB;
      }
      return sortDirection === "asc" ? valA - valB : valB - valA;
    });
  }, [campaigns, sortField, sortDirection]);

  const sortedJobPosts = useMemo(() => {
    const list = analyticsOverview?.topRequisitions || [];
    return [...list].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (jobSortField === "impressions") {
        valA = a.impressions ?? 0;
        valB = b.impressions ?? 0;
      } else if (jobSortField === "signups") {
        valA = a.signupsCount ?? 0;
        valB = b.signupsCount ?? 0;
      } else if (jobSortField === "applications") {
        valA = a.applicationsCount ?? 0;
        valB = b.applicationsCount ?? 0;
      } else if (jobSortField === "cvr") {
        valA = a.conversionRate ?? 0;
        valB = b.conversionRate ?? 0;
      }
      return jobSortDirection === "asc" ? valA - valB : valB - valA;
    });
  }, [analyticsOverview?.topRequisitions, jobSortField, jobSortDirection]);

  const sortedSources = useMemo(() => {
    const list = analyticsOverview?.platformBreakdown || [];
    return [...list].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sourceSortField === "campaigns") {
        valA = a.campaignsCount ?? 0;
        valB = b.campaignsCount ?? 0;
      } else if (sourceSortField === "impressions") {
        valA = a.impressions ?? 0;
        valB = b.impressions ?? 0;
      } else if (sourceSortField === "leads") {
        valA = a.leads ?? 0;
        valB = b.leads ?? 0;
      } else if (sourceSortField === "applications") {
        valA = a.applications ?? 0;
        valB = b.applications ?? 0;
      } else if (sourceSortField === "cvr") {
        valA = a.conversionRate ?? 0;
        valB = b.conversionRate ?? 0;
      }
      return sourceSortDirection === "asc" ? valA - valB : valB - valA;
    });
  }, [
    analyticsOverview?.platformBreakdown,
    sourceSortField,
    sourceSortDirection,
  ]);

  const kpis = analyticsOverview?.kpis;

  return (
    <div className="space-y-6">
      {/* Dynamic Filter Rail */}
      <CampaignAnalyticsFilters
        filters={analyticsFilters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        platforms={platforms}
        jobs={allJobPosts}
        campaigns={effectiveCampaigns}
        onExport={handleExport}
        isLoading={isLoadingAnalyticsOverview}
      />

      {/* High-Impact Marketing KPI Ribbons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Impressions */}
        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Impressions</span>
              <Eye className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {isLoadingAnalyticsOverview ? (
                <div className="h-6 w-16 bg-muted/60 animate-pulse rounded" />
              ) : (
                (kpis?.totalImpressions || 0).toLocaleString()
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Gate impressions & traffic
            </div>
          </CardContent>
        </Card>

        {/* Total Job Views */}
        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Page Views</span>
              <Activity className="h-3.5 w-3.5 text-sky-500" />
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {isLoadingAnalyticsOverview ? (
                <div className="h-6 w-16 bg-muted/60 animate-pulse rounded" />
              ) : (
                (kpis?.totalJobViews || 0).toLocaleString()
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Job specification visits
            </div>
          </CardContent>
        </Card>

        {/* Sign-ups */}
        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Sign-ups</span>
              <Users className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {isLoadingAnalyticsOverview ? (
                <div className="h-6 w-16 bg-muted/60 animate-pulse rounded" />
              ) : (
                (kpis?.totalLeads || 0).toLocaleString()
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Verified campaign registrations
            </div>
          </CardContent>
        </Card>

        {/* Total Applications */}
        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Applications</span>
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {isLoadingAnalyticsOverview ? (
                <div className="h-6 w-16 bg-muted/60 animate-pulse rounded" />
              ) : (
                (kpis?.totalApplications || 0).toLocaleString()
              )}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Verified ATS candidates
            </div>
          </CardContent>
        </Card>

        {/* Overall Blended Conversion Rate */}
        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Blended CVR</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {isLoadingAnalyticsOverview ? (
                <div className="h-6 w-16 bg-muted/60 animate-pulse rounded" />
              ) : (
                `${kpis?.blendedConversionRate || 0}%`
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Impression-to-App yield
            </div>
          </CardContent>
        </Card>

        {/* Active Campaigns Count */}
        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Active Channels</span>
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {isLoadingAnalyticsOverview ? (
                <div className="h-6 w-16 bg-muted/60 animate-pulse rounded" />
              ) : (
                (kpis?.activeCampaignsCount || 0).toLocaleString()
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Active campaigns running
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: TimeSeries Velocity Chart + Conversion Funnel Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 min-h-[360px]">
          <CampaignTimeseriesChart
            data={analyticsOverview?.timeseries}
            isLoading={isLoadingAnalyticsOverview}
          />
        </div>
        <div className="lg:col-span-5 min-h-[360px]">
          <CampaignFunnelMatrix
            funnel={analyticsOverview?.funnel}
            isLoading={isLoadingAnalyticsOverview}
          />
        </div>
      </div>

      {/* Row 2: Platform Attribution Donut + Top Converting Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 min-h-[320px]">
          <CampaignChannelDonut
            data={analyticsOverview?.platformBreakdown}
            isLoading={isLoadingAnalyticsOverview}
          />
        </div>
        <div className="lg:col-span-6 min-h-[320px]">
          <TopRequisitionsCard
            data={analyticsOverview?.topRequisitions}
            isLoading={isLoadingAnalyticsOverview}
          />
        </div>
      </div>

      {/* Row 3: Marketing Conversion Multi-View Leaderboard (Campaign, Job Post, Source) */}
      <Card className="border-border/70 shadow-xs">
        <div className="p-4 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span>
                {viewMode === "campaigns"
                  ? "Campaign Performance Leaderboard"
                  : viewMode === "job_posts"
                    ? "Job Post Conversion Matrix"
                    : "Source & Channel Yield"}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {viewMode === "campaigns"
                ? "Side-by-side comparative ROI, CTR, and application conversion matrix by campaign"
                : viewMode === "job_posts"
                  ? "Requisition-level attribution, inbound traffic volume, and candidate funnel velocity"
                  : "Platform efficiency across verified campaigns created through the Campaign Page"}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* 3-Way Segmented Control */}
            <div className="flex items-center p-1 rounded-lg bg-muted/60 border border-border/50 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("campaigns")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  viewMode === "campaigns"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                By Campaign ({sortedLeaderboard.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("job_posts")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  viewMode === "job_posts"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                By Job Post ({sortedJobPosts.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("sources")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  viewMode === "sources"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                By Source ({sortedSources.length})
              </button>
            </div>
          </div>
        </div>

        {/* 1. VIEW MODE: BY CAMPAIGN */}
        {viewMode === "campaigns" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rank & Campaign</th>
                  <th className="px-4 py-3 font-semibold">Channel</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("impressions")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Impressions</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("leads")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Sign-ups (CTR)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("applications")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Applications (CVR)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoadingAnalyticsOverview ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-4 py-3 h-12 bg-muted/20" />
                    </tr>
                  ))
                ) : sortedLeaderboard.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No campaign conversion data matching active filters.
                    </td>
                  </tr>
                ) : (
                  sortedLeaderboard.map((camp, idx) => {
                    const ctr =
                      camp.impressionsCount > 0
                        ? (
                            (camp.leadsCount / camp.impressionsCount) *
                            100
                          ).toFixed(1)
                        : "0.0";
                    const cvr =
                      camp.impressionsCount > 0
                        ? (
                            (camp.applicationsCount / camp.impressionsCount) *
                            100
                          ).toFixed(1)
                        : "0.0";

                    return (
                      <tr
                        key={camp.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Rank & Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                idx === 0
                                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : idx === 1
                                    ? "bg-slate-300/40 text-slate-700 dark:text-slate-300"
                                    : idx === 2
                                      ? "bg-amber-700/20 text-amber-800 dark:text-amber-600"
                                      : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-foreground">
                                {camp.name}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground">
                                {camp.campaignCode}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Channel */}
                        <td className="px-4 py-3">
                          <span className="capitalize font-medium px-2 py-0.5 rounded bg-muted/60 text-foreground text-[11px]">
                            {camp.platform}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                              camp.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                camp.status === "active"
                                  ? "bg-emerald-500"
                                  : "bg-muted-foreground"
                              }`}
                            />
                            {camp.status}
                          </span>
                        </td>

                        {/* Impressions */}
                        <td className="px-4 py-3 font-mono font-medium">
                          {camp.impressionsCount.toLocaleString()}
                        </td>

                        {/* Sign-ups + CTR */}
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-primary">
                            {camp.leadsCount.toLocaleString()}
                            <span className="text-[10px] text-muted-foreground ml-1 font-normal">
                              ({ctr}%)
                            </span>
                          </div>
                        </td>

                        {/* Applications + CVR */}
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {camp.applicationsCount.toLocaleString()}
                            <span className="text-[10px] text-muted-foreground ml-1 font-normal">
                              ({cvr}% CVR)
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. VIEW MODE: BY JOB POST */}
        {viewMode === "job_posts" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    Rank & Requisition
                  </th>
                  <th className="px-4 py-3 font-semibold">Linked Campaigns</th>
                  <th className="px-4 py-3 font-semibold">Channel</th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleJobSort("impressions")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Impressions</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleJobSort("signups")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Sign-ups</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleJobSort("applications")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Applications</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleJobSort("cvr")}
                  >
                    <div className="flex items-center gap-1">
                      <span>CVR (%)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    ATS Link
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoadingAnalyticsOverview ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={8} className="px-4 py-3 h-12 bg-muted/20" />
                    </tr>
                  ))
                ) : sortedJobPosts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No job post conversion data matching active filters.
                    </td>
                  </tr>
                ) : (
                  sortedJobPosts.map((job, idx) => {
                    return (
                      <tr
                        key={job.jobPostId || idx}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Rank & Job Title */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                idx === 0
                                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : idx === 1
                                    ? "bg-slate-300/40 text-slate-700 dark:text-slate-300"
                                    : idx === 2
                                      ? "bg-amber-700/20 text-amber-800 dark:text-amber-600"
                                      : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-foreground">
                                {job.title}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground">
                                ID: #
                                {job.jobPostId
                                  ? job.jobPostId.slice(-6)
                                  : "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Linked Campaigns */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {job.campaignNames &&
                            job.campaignNames.length > 0 ? (
                              job.campaignNames.map((name) => (
                                <Badge
                                  key={name}
                                  variant="outline"
                                  className="text-[10px] py-0 px-1.5 font-normal"
                                >
                                  {name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                Direct
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Channel */}
                        <td className="px-4 py-3">
                          <span className="capitalize font-medium px-2 py-0.5 rounded bg-muted/60 text-foreground text-[11px]">
                            {job.platform || "Direct"}
                          </span>
                        </td>

                        {/* Impressions */}
                        <td className="px-4 py-3 font-mono font-medium">
                          {(job.impressions ?? 0).toLocaleString()}
                        </td>

                        {/* Sign-ups */}
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-primary">
                            {(job.signupsCount ?? 0).toLocaleString()}
                          </div>
                        </td>

                        {/* Applications */}
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {(job.applicationsCount ?? 0).toLocaleString()}
                          </div>
                        </td>

                        {/* CVR */}
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {job.conversionRate ?? 0}%
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`/admin/requisitions?search=${job.jobPostId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                          >
                            <ExternalLink className="h-3 w-3" />
                            ATS
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. VIEW MODE: BY SOURCE / CHANNEL */}
        {viewMode === "sources" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    Rank & Acquisition Source
                  </th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSourceSort("campaigns")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Active Campaigns</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSourceSort("impressions")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Impressions</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSourceSort("leads")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Sign-ups (CTR)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSourceSort("applications")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Applications</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSourceSort("cvr")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Blended CVR</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoadingAnalyticsOverview ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-4 py-3 h-12 bg-muted/20" />
                    </tr>
                  ))
                ) : sortedSources.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No source conversion data matching active filters.
                    </td>
                  </tr>
                ) : (
                  sortedSources.map((src, idx) => {
                    const ctr =
                      src.impressions > 0
                        ? ((src.leads / src.impressions) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <tr
                        key={src.platform}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Rank & Channel */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                idx === 0
                                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : idx === 1
                                    ? "bg-slate-300/40 text-slate-700 dark:text-slate-300"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-foreground uppercase tracking-wide">
                                {src.displayName || src.platform}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Verified Campaign Channel
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Active Campaigns */}
                        <td className="px-4 py-3 font-mono font-medium">
                          {src.campaignsCount}{" "}
                          {src.campaignsCount === 1 ? "campaign" : "campaigns"}
                        </td>

                        {/* Impressions */}
                        <td className="px-4 py-3 font-mono font-medium">
                          {src.impressions.toLocaleString()}
                        </td>

                        {/* Sign-ups (CTR) */}
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-primary">
                            {src.leads.toLocaleString()}
                            <span className="text-[10px] text-muted-foreground ml-1 font-normal">
                              ({ctr}%)
                            </span>
                          </div>
                        </td>

                        {/* Applications */}
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {src.applications.toLocaleString()}
                          </div>
                        </td>

                        {/* Blended CVR */}
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {src.conversionRate}% CVR
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Row 4: Campaign Attributed Candidates & Application Inflow Table */}
      <AttributedCandidatesTable />
    </div>
  );
}
