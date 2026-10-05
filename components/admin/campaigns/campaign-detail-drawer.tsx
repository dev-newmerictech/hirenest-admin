"use client";

import { useEffect, useState } from "react";
import { DetailDrawer } from "@/components/admin/detail-drawer";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FunnelChart } from "./funnel-chart";
import { Campaign, CampaignAnalytics } from "@/lib/api/campaigns";
import { Job } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchCampaignAnalyticsThunk,
  toggleJobBindingThunk,
  bindJobThunk,
  fetchCampaign,
} from "@/lib/store/campaignSlice";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Layers,
  Link2,
  Copy,
  Check,
  Plus,
  ExternalLink,
  Edit,
  Code2,
} from "lucide-react";

interface CampaignDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  jobs: Job[];
  onEditCampaign: (campaign: Campaign) => void;
  onGenerateLink: (campaign: Campaign, jobId?: string) => void;
}

export function CampaignDetailDrawer({
  open,
  onOpenChange,
  campaign,
  jobs,
  onEditCampaign,
  onGenerateLink,
}: CampaignDetailDrawerProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { selectedCampaignAnalytics, isLoadingAnalytics, isMutating } =
    useAppSelector((state) => state.campaigns);

  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedJobToBind, setSelectedJobToBind] = useState<string>("");
  const [isBinding, setIsBinding] = useState(false);

  useEffect(() => {
    if (campaign?.id && open) {
      dispatch(fetchCampaignAnalyticsThunk(campaign.id));
    }
  }, [campaign?.id, open, dispatch]);

  if (!campaign) return null;

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
      toast({
        title: "Copied",
        description: "Job tracking URL copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please copy URL manually.",
        variant: "destructive",
      });
    }
  };

  const handleToggleBinding = async (jobId: string, currentStatus: boolean) => {
    try {
      await dispatch(
        toggleJobBindingThunk({ campaignId: campaign.id, jobId }),
      ).unwrap();
      toast({
        title: "Binding Updated",
        description: `Job route is now ${!currentStatus ? "Active" : "Disabled"}.`,
      });
      dispatch(fetchCampaign(campaign.id));
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err || "Failed to toggle job binding",
        variant: "destructive",
      });
    }
  };

  const handleBindJob = async () => {
    if (!selectedJobToBind) return;
    setIsBinding(true);
    try {
      await dispatch(
        bindJobThunk({
          campaignId: campaign.id,
          payload: { jobPostId: selectedJobToBind },
        }),
      ).unwrap();

      toast({
        title: "Job Bound",
        description: "Job successfully attached to this campaign.",
      });
      setSelectedJobToBind("");
      dispatch(fetchCampaign(campaign.id));
    } catch (err: any) {
      toast({
        title: "Binding Failed",
        description: err || "Failed to bind job",
        variant: "destructive",
      });
    } finally {
      setIsBinding(false);
    }
  };

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} title={campaign.name}>
      <div className="space-y-6 pb-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-muted/40 border border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {campaign.platform}
              </span>
              <StatusBadge
                status={campaign.status === "active"}
                activeLabel="Active"
                inactiveLabel={campaign.status}
              />
            </div>
            <div className="text-sm font-mono text-foreground font-medium">
              Code: {campaign.campaignCode}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditCampaign(campaign)}
              className="gap-1 text-xs"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => onGenerateLink(campaign)}
              className="gap-1 text-xs"
            >
              <Link2 className="h-3.5 w-3.5" />
              Generate Link
            </Button>
          </div>
        </div>

        {/* Schedule & Metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-border bg-card">
            <span className="text-muted-foreground flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              Start Date
            </span>
            <span className="font-medium text-foreground">
              {campaign.startDate
                ? new Date(campaign.startDate).toLocaleDateString()
                : "Immediate"}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-border bg-card">
            <span className="text-muted-foreground flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              End Date
            </span>
            <span className="font-medium text-foreground">
              {campaign.endDate
                ? new Date(campaign.endDate).toLocaleDateString()
                : "Ongoing"}
            </span>
          </div>
        </div>

        {/* Regex Patterns */}
        {campaign.patterns && campaign.patterns.length > 0 && (
          <div className="space-y-1.5 p-3 rounded-lg border border-border bg-card">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-primary" />
              UTM Regex Patterns
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {campaign.patterns.map((p, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-muted font-mono text-[11px] text-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Funnel Chart */}
        <FunnelChart
          impressions={
            selectedCampaignAnalytics?.impressions ?? campaign.impressionsCount
          }
          leads={selectedCampaignAnalytics?.leads ?? campaign.leadsCount}
          applications={
            selectedCampaignAnalytics?.applications ??
            campaign.applicationsCount
          }
          dailyTrends={selectedCampaignAnalytics?.dailyFunnelTrends}
          title="Campaign Conversion Funnel"
        />

        {/* Bound Jobs Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Bound Job Postings ({campaign.jobBindings?.length ?? 0})
            </h4>
          </div>

          {/* Add Job Binding inline selector */}
          <div className="flex items-center gap-2">
            <Select
              value={selectedJobToBind}
              onValueChange={setSelectedJobToBind}
            >
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Attach another job to campaign..." />
              </SelectTrigger>
              <SelectContent>
                {jobs
                  .filter((j) => {
                    const alreadyBound = campaign.jobBindings?.some((b) => {
                      const id =
                        typeof b.jobPostId === "string"
                          ? b.jobPostId
                          : b.jobPostId?._id;
                      return id === j.id;
                    });
                    return !alreadyBound;
                  })
                  .map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title} {j.companyName ? `(${j.companyName})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleBindJob}
              disabled={!selectedJobToBind || isBinding}
              className="h-9 gap-1 text-xs shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Bind Job
            </Button>
          </div>

          {/* Job Bindings List */}
          <div className="space-y-2 pt-1">
            {campaign.jobBindings && campaign.jobBindings.length > 0 ? (
              campaign.jobBindings.map((binding, idx) => {
                const jobId =
                  typeof binding.jobPostId === "string"
                    ? binding.jobPostId
                    : binding.jobPostId?._id;
                const matchingJob = jobs.find((j) => j.id === jobId);
                const jobTitle =
                  matchingJob?.title ||
                  (typeof binding.jobPostId === "object"
                    ? binding.jobPostId?.title
                    : null) ||
                  `Job #${jobId.slice(-6)}`;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border bg-card space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-foreground block">
                          {jobTitle}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          ID: {jobId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {binding.isActive ? "Active" : "Disabled"}
                        </span>
                        <Switch
                          checked={binding.isActive}
                          onCheckedChange={() =>
                            handleToggleBinding(jobId, binding.isActive)
                          }
                        />
                      </div>
                    </div>

                    {binding.generatedUrl && (
                      <div className="flex items-center gap-2 pt-1">
                        <Input
                          readOnly
                          value={binding.generatedUrl}
                          className="font-mono text-[11px] h-7 bg-muted/30"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleCopy(binding.generatedUrl)}
                          title="Copy Link"
                        >
                          {copiedUrl === binding.generatedUrl ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() =>
                            window.open(binding.generatedUrl, "_blank")
                          }
                          title="Open URL"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                No jobs currently bound. Any traffic arriving with this campaign
                code will default to the primary job in the link.
              </div>
            )}
          </div>
        </div>
      </div>
    </DetailDrawer>
  );
}
