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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  } = useAppSelector((state) => state.campaigns);

  const { allJobPosts } = useAppSelector((state) => state.jobPosts);

  // Sorting state for leaderboard
  const [sortField, setSortField] = useState<
    "impressions" | "leads" | "applications" | "cvr" | "ctr"
  >("applications");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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
        Leads: c.leadsCount,
        "CTR (%)": `${ctr}%`,
        Applications: c.applicationsCount,
        "CVR (%)": `${cvr}%`,
        "Created Date": c.createdAt
          ? format(new Date(c.createdAt), "yyyy-MM-dd")
          : "N/A",
      };
    });

    const dateStr = format(new Date(), "yyyy-MM-dd");
    exportToExcel(
      flatData,
      `marketing-campaign-analytics-${dateStr}`,
      "Overview",
    );
    toast({
      title: "Export Successful",
      description: `Downloaded spreadsheet with ${flatData.length} campaign rows.`,
    });
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

  const sortedLeaderboard = useMemo(() => {
    if (!campaigns) return [];
    return [...campaigns].sort((a, b) => {
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

        {/* Leads Captured */}
        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Leads Captured</span>
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
              Fast-track candidate gates
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

      {/* Row 3: Marketing Campaign Conversion Leaderboard */}
      <Card className="border-border/70 shadow-xs">
        <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span>Campaign Performance Leaderboard</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Side-by-side comparative ROI, CTR, and application conversion
              matrix
            </p>
          </div>
          <Badge
            variant="secondary"
            className="text-xs font-mono self-start sm:self-auto"
          >
            {sortedLeaderboard.length} Campaigns Ranked
          </Badge>
        </div>

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
                    <span>Leads (CTR)</span>
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

                      {/* Leads + CTR */}
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
      </Card>
    </div>
  );
}
