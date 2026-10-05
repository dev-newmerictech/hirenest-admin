"use client";

import { useState } from "react";
import { DetailDrawer } from "@/components/admin/detail-drawer";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SearchableJobSelect } from "./searchable-job-select";
import { Campaign } from "@/lib/api/campaigns";
import { Job } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  toggleJobBindingThunk,
  bindJobThunk,
  updateCampaignThunk,
  fetchCampaign,
} from "@/lib/store/campaignSlice";
import { useToast } from "@/hooks/use-toast";
import {
  Layers,
  Copy,
  Check,
  Plus,
  ExternalLink,
  Edit,
  Briefcase,
  Building2,
  Sparkles,
  Link2,
} from "lucide-react";

interface CampaignDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  jobs: Job[];
  onEditCampaign: (campaign: Campaign) => void;
}

export function CampaignDetailDrawer({
  open,
  onOpenChange,
  campaign,
  jobs,
  onEditCampaign,
}: CampaignDetailDrawerProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { selectedCampaign, isMutating } = useAppSelector(
    (state) => state.campaigns,
  );

  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedJobToBind, setSelectedJobToBind] = useState<string>("");
  const [isBinding, setIsBinding] = useState(false);

  // Use the reactive selectedCampaign from Redux if available for instantaneous state updates
  const activeCampaign =
    (selectedCampaign && selectedCampaign.id === campaign?.id
      ? selectedCampaign
      : campaign) || campaign;

  if (!activeCampaign) return null;

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
      toast({
        title: "Copied!",
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
        toggleJobBindingThunk({ campaignId: activeCampaign.id, jobId }),
      ).unwrap();
      toast({
        title: "Binding Updated",
        description: `Job route is now ${!currentStatus ? "Active" : "Disabled"}.`,
      });
      dispatch(fetchCampaign(activeCampaign.id));
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err || "Failed to toggle job binding",
        variant: "destructive",
      });
    }
  };

  const handleToggleCampaignStatus = async (newActive: boolean) => {
    try {
      await dispatch(
        updateCampaignThunk({
          id: activeCampaign.id,
          payload: { status: newActive ? "active" : "paused" },
        }),
      ).unwrap();
      toast({
        title: "Campaign Status Updated",
        description: `Campaign is now ${newActive ? "Active" : "Paused"}.`,
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err || "Failed to update campaign status",
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
          campaignId: activeCampaign.id,
          payload: { jobPostId: selectedJobToBind },
        }),
      ).unwrap();

      toast({
        title: "Job Bound Successfully",
        description: "Job attached and live tracking link generated.",
      });
      setSelectedJobToBind("");
      // Refresh to guarantee sync
      dispatch(fetchCampaign(activeCampaign.id));
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

  // Helper to resolve job metadata from jobs array or binding object
  const getJobDetails = (jobPostId: any) => {
    const rawId =
      typeof jobPostId === "object" && jobPostId !== null
        ? jobPostId._id || jobPostId.id
        : String(jobPostId);
    const found = jobs.find((j) => j.id === rawId);
    return {
      id: rawId,
      title:
        found?.title ||
        (typeof jobPostId === "object" ? jobPostId.title : null) ||
        `Job Post #${rawId?.slice(-6)}`,
      companyName: found?.companyName || "HireNest",
      location: found?.location || "Remote",
    };
  };

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={activeCampaign.name}
    >
      <div className="space-y-6 pb-6 w-full max-w-full overflow-hidden">
        {/* Campaign Identity & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-muted/40 border border-border w-full">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {activeCampaign.platform}
              </span>
              <StatusBadge
                status={activeCampaign.status === "active"}
                activeLabel="Active"
                inactiveLabel={activeCampaign.status}
              />
            </div>
            <div className="text-sm font-mono text-foreground font-semibold truncate">
              Code: {activeCampaign.campaignCode}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 pr-2 border-r border-border">
              <span className="text-xs text-muted-foreground">Active</span>
              <Switch
                checked={activeCampaign.status === "active"}
                onCheckedChange={handleToggleCampaignStatus}
                disabled={isMutating}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditCampaign(activeCampaign)}
              className="gap-1.5 text-xs h-8 shrink-0"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </div>

        {/* HERO SECTION: Job Linkage & Route Manager */}
        <div className="space-y-4 w-full min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary shrink-0" />
                Bound Job Postings ({activeCampaign.jobBindings?.length ?? 0})
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Each bound job generates an authenticated fast-track link
                pointing directly to app.hirenest.ai
              </p>
            </div>
          </div>

          {/* Attach Job Searchable Bar */}
          <div className="p-3.5 rounded-lg border border-border bg-card space-y-3 w-full min-w-0">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
              Attach Another Job to this Campaign
            </label>
            <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0">
              <div className="flex-1 min-w-0">
                <SearchableJobSelect
                  jobs={jobs}
                  value={selectedJobToBind}
                  onChange={setSelectedJobToBind}
                  placeholder="Search and select job posting to bind..."
                />
              </div>
              <Button
                onClick={handleBindJob}
                disabled={!selectedJobToBind || isBinding}
                size="sm"
                className="gap-1.5 text-xs h-10 sm:h-auto px-4 shrink-0"
              >
                <Link2 className="h-3.5 w-3.5" />
                {isBinding ? "Binding..." : "Bind Job"}
              </Button>
            </div>
          </div>

          {/* Bound Jobs List */}
          <div className="space-y-2.5 w-full min-w-0">
            {!activeCampaign.jobBindings ||
            activeCampaign.jobBindings.length === 0 ? (
              <div className="p-8 text-center rounded-lg border border-dashed border-border bg-muted/20">
                <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <div className="text-xs font-semibold text-foreground">
                  No Job Postings Bound Yet
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Select a job above to generate this campaign's tracking route.
                </div>
              </div>
            ) : (
              activeCampaign.jobBindings.map((binding, idx) => {
                const jobMeta = getJobDetails(binding.jobPostId);
                const rawUrl = binding.generatedUrl?.startsWith("http")
                  ? binding.generatedUrl
                  : `https://app.hirenest.ai${binding.generatedUrl || `/jobs/${jobMeta.id}?utm_source=${activeCampaign.platform}&utm_campaign=${activeCampaign.campaignCode}&utm_medium=fast-track`}`;

                return (
                  <div
                    key={binding.jobPostId ? String(jobMeta.id) : idx}
                    className="p-3 rounded-lg border border-border bg-card space-y-2 hover:border-primary/40 transition-colors w-full min-w-0 overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {jobMeta.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                            {jobMeta.companyName}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 min-w-0">
                          <span className="flex items-center gap-1 min-w-0">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{jobMeta.location}</span>
                          </span>
                        </div>
                      </div>

                      {/* Route On/Off Switch */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {binding.isActive ? "Route ON" : "Paused"}
                        </span>
                        <Switch
                          checked={binding.isActive}
                          onCheckedChange={() =>
                            handleToggleBinding(jobMeta.id, binding.isActive)
                          }
                        />
                      </div>
                    </div>

                    {/* URL bar with 1-click copy & test gate */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/50 w-full min-w-0">
                      <div
                        className="flex-1 min-w-0 font-mono text-[11px] bg-muted/50 px-2.5 py-1.5 rounded truncate select-all text-foreground border border-border/50"
                        title={rawUrl}
                      >
                        {rawUrl}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(rawUrl)}
                        className="h-8 px-2.5 gap-1 shrink-0 text-xs"
                      >
                        {copiedUrl === rawUrl ? (
                          <>
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="text-green-600 text-[11px]">
                              Copied
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(rawUrl, "_blank", "noopener,noreferrer")
                        }
                        className="h-8 px-2 shrink-0"
                        title="Test gate in new window"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DetailDrawer>
  );
}
