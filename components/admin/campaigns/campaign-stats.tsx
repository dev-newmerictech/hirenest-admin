"use client";

import { StatCard } from "@/components/admin/stat-card";
import { Megaphone, Eye, UserCheck, FileCheck } from "lucide-react";
import { GlobalDashboardSummary } from "@/lib/api/campaigns";

interface CampaignStatsProps {
  summary: GlobalDashboardSummary | null;
  isLoading?: boolean;
}

export function CampaignStats({ summary, isLoading }: CampaignStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-lg bg-muted animate-pulse border border-border"
          />
        ))}
      </div>
    );
  }

  const activeCampaigns = summary?.activeCampaigns ?? 0;
  const totalCampaigns = summary?.totalCampaigns ?? 0;
  const totalImpressions = summary?.totalImpressions ?? 0;
  const totalLeads = summary?.totalLeads ?? 0;
  const totalApplications = summary?.totalApplications ?? 0;

  const leadConvRate =
    totalImpressions > 0
      ? ((totalLeads / totalImpressions) * 100).toFixed(1)
      : "0.0";
  const appConvRate =
    totalLeads > 0
      ? ((totalApplications / totalLeads) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active Campaigns"
        value={activeCampaigns}
        icon={Megaphone}
        description={`${totalCampaigns} total registered`}
      />
      <StatCard
        title="Impressions"
        value={totalImpressions.toLocaleString()}
        icon={Eye}
        description="Gate visits across platforms"
      />
      <StatCard
        title="Leads Captured"
        value={totalLeads.toLocaleString()}
        icon={UserCheck}
        description={`${leadConvRate}% lead conversion`}
      />
      <StatCard
        title="Applications"
        value={totalApplications.toLocaleString()}
        icon={FileCheck}
        description={`${appConvRate}% application conversion`}
      />
    </div>
  );
}
