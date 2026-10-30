"use client";

import { StatCard } from "@/components/admin/stat-card";
import { Megaphone, Eye, UserCheck, FileCheck } from "lucide-react";
import { GlobalDashboardSummary, Campaign } from "@/lib/api/campaigns";

interface CampaignStatsProps {
  summary: GlobalDashboardSummary | null;
  selectedCampaign?: Campaign | null;
  isLoading?: boolean;
}

export function CampaignStats({
  summary,
  selectedCampaign,
  isLoading,
}: CampaignStatsProps) {
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

  if (selectedCampaign) {
    const totalImpressions = selectedCampaign.impressionsCount ?? 0;
    const totalLeads = selectedCampaign.leadsCount ?? 0;
    const totalApplications = selectedCampaign.applicationsCount ?? 0;

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
          title="Campaign Status"
          value={selectedCampaign.status.toUpperCase()}
          icon={Megaphone}
          description={selectedCampaign.name || selectedCampaign.campaignCode}
        />
        <StatCard
          title="Impressions"
          value={totalImpressions.toLocaleString()}
          icon={Eye}
          description={`Gate visits on ${selectedCampaign.platform.toUpperCase()}`}
        />
        <StatCard
          title="Sign-ups"
          value={totalLeads.toLocaleString()}
          icon={UserCheck}
          description={`${leadConvRate}% sign-up conversion`}
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

  const activeCampaigns = summary?.activeCampaigns ?? 0;
  const totalCampaigns = summary?.totalCampaigns ?? 0;
  const totalImpressions =
    summary?.impressions ?? summary?.totalImpressions ?? 0;
  const totalLeads = summary?.leads ?? summary?.totalLeads ?? 0;
  const totalApplications =
    summary?.applications ?? summary?.totalApplications ?? 0;

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
        description={`${totalCampaigns} total registered (Collective)`}
      />
      <StatCard
        title="Impressions"
        value={totalImpressions.toLocaleString()}
        icon={Eye}
        description="Gate visits across platforms (Collective)"
      />
      <StatCard
        title="Sign-ups"
        value={totalLeads.toLocaleString()}
        icon={UserCheck}
        description={`${leadConvRate}% sign-up conversion`}
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
