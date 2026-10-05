"use client";

import { useState, useEffect, useMemo } from "react";
import { DetailDrawer } from "@/components/admin/detail-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableJobSelect } from "./searchable-job-select";
import { PlatformSetting, Campaign } from "@/lib/api/campaigns";
import { Job } from "@/lib/types";
import { useAppDispatch } from "@/lib/store/hooks";
import {
  createCampaignThunk,
  fetchCampaigns,
  fetchCampaignSummary,
} from "@/lib/store/campaignSlice";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Link2, Copy, Check, Info } from "lucide-react";

interface CreateCampaignDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platforms: PlatformSetting[];
  jobs: Job[];
  onSuccess: (data: { campaign: Campaign; trackingUrl: string }) => void;
}

export function CreateCampaignDrawer({
  open,
  onOpenChange,
  platforms,
  jobs,
  onSuccess,
}: CreateCampaignDrawerProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [campaignCode, setCampaignCode] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);

  // Initialize or reset form state on drawer open
  useEffect(() => {
    if (open) {
      setName("");
      const defaultPlatform = platforms[0]?.platform || "linkedin";
      setPlatform(defaultPlatform);
      setSelectedJobId(jobs[0]?.id || "");

      // Auto-generate fresh campaign code
      const pfx = defaultPlatform.slice(0, 2).toUpperCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setCampaignCode(`${pfx}-2026-${randomSuffix}`);
    }
  }, [open, platforms, jobs]);

  // Dynamically update campaign code prefix when platform changes
  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform);
    const pfx = newPlatform.slice(0, 2).toUpperCase();
    const slug = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "-")
      .slice(0, 10);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setCampaignCode(`${pfx}${slug ? `-${slug}` : ""}-${randomSuffix}`);
  };

  // Dynamically update campaign code slug when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    const pfx = (platform || "cp").slice(0, 2).toUpperCase();
    const slug = val
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "-")
      .slice(0, 12);
    const randomSuffix =
      campaignCode.split("-").pop() || Math.floor(1000 + Math.random() * 9000);
    setCampaignCode(`${pfx}${slug ? `-${slug}` : ""}-${randomSuffix}`);
  };

  // Real-time live tracking URL preview pointing to https://app.hirenest.ai
  const livePreviewUrl = useMemo(() => {
    if (!selectedJobId) return "";
    return `https://app.hirenest.ai/jobs/${selectedJobId}?utm_source=${platform}&utm_campaign=${campaignCode}&utm_medium=fast-track`;
  }, [selectedJobId, platform, campaignCode]);

  const handleCopyPreview = async () => {
    if (!livePreviewUrl) return;
    try {
      await navigator.clipboard.writeText(livePreviewUrl);
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 2000);
      toast({
        title: "Copied",
        description: "Preview link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please copy link manually.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Campaign Name Required",
        description: "Please enter a recognizable name for this campaign.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedJobId) {
      toast({
        title: "Target Job Required",
        description:
          "Please select a target job posting for candidate linking.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const createdCampaign = await dispatch(
        createCampaignThunk({
          name: name.trim(),
          platform,
          campaignCode: campaignCode.trim(),
          jobPostIds: [selectedJobId],
        }),
      ).unwrap();

      toast({
        title: "Campaign Created",
        description: `Campaign "${createdCampaign.name}" is now active.`,
      });

      dispatch(fetchCampaigns({ page: 1, limit: 10 }));
      dispatch(fetchCampaignSummary());

      onOpenChange(false);
      onSuccess({
        campaign: createdCampaign,
        trackingUrl: livePreviewUrl,
      });
    } catch (err: any) {
      toast({
        title: "Creation Failed",
        description: err || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Create Fast-Track Campaign"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pb-6">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary/90 flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Create a targeted campaign to link high-conversion traffic directly
            to job postings with automated guest fast-track applications.
          </span>
        </div>

        {/* Campaign Name */}
        <div className="space-y-1.5">
          <Label htmlFor="campaign-name" className="text-xs font-semibold">
            Campaign Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="campaign-name"
            placeholder="e.g., Q1 Senior Engineers Drive"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="h-9 text-xs"
            required
            autoFocus
          />
        </div>

        {/* Platform Channel */}
        <div className="space-y-1.5">
          <Label htmlFor="campaign-platform" className="text-xs font-semibold">
            Marketing Channel / Platform{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Select value={platform} onValueChange={handlePlatformChange}>
            <SelectTrigger id="campaign-platform" className="h-9 text-xs">
              <SelectValue placeholder="Select platform..." />
            </SelectTrigger>
            <SelectContent>
              {platforms.length > 0 ? (
                platforms.map((p) => (
                  <SelectItem
                    key={p.platform || p.id || (p as any)._id}
                    value={p.platform}
                    className="text-xs"
                  >
                    {p.displayName || p.platform.toUpperCase()}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="linkedin" className="text-xs">
                    LinkedIn
                  </SelectItem>
                  <SelectItem value="indeed" className="text-xs">
                    Indeed
                  </SelectItem>
                  <SelectItem value="meta" className="text-xs">
                    Meta / Instagram
                  </SelectItem>
                  <SelectItem value="whatsapp" className="text-xs">
                    WhatsApp
                  </SelectItem>
                  <SelectItem value="google" className="text-xs">
                    Google Ads
                  </SelectItem>
                  <SelectItem value="direct" className="text-xs">
                    Direct Link
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Auto-Generated Campaign Code (Read-Only) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="campaign-code" className="text-xs font-semibold">
              Campaign Code (Auto-Generated)
            </Label>
            <span className="text-[10px] text-muted-foreground">
              Unique System Identifier
            </span>
          </div>
          <Input
            id="campaign-code"
            readOnly
            value={campaignCode}
            className="h-9 text-xs font-mono bg-muted/40 cursor-default select-all"
          />
        </div>

        {/* Target Job Selection (Sorted Ascending by Created Date) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">
              Target Job Posting <span className="text-destructive">*</span>
            </Label>
            <span className="text-[10px] text-muted-foreground">
              Sorted oldest to newest
            </span>
          </div>
          <SearchableJobSelect
            jobs={jobs}
            value={selectedJobId}
            onChange={setSelectedJobId}
            placeholder="Select a job to bind to this campaign..."
          />
        </div>

        {/* Live Tracking Link Preview */}
        <div className="space-y-1.5 p-3 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Live Link Preview (app.hirenest.ai)
            </span>
            {livePreviewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyPreview}
                className="h-7 px-2 gap-1 text-[11px]"
              >
                {copiedPreview ? (
                  <>
                    <Check className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="p-2 rounded bg-muted/60 font-mono text-[11px] text-foreground break-all select-all border border-border/60">
            {livePreviewUrl ||
              "Select a target job posting above to generate live URL"}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Default destination points to https://app.hirenest.ai. Candidates
            land on this job with fast-track mode enabled.
          </p>
        </div>

        {/* Drawer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim() || !selectedJobId}
            className="text-xs h-9 gap-1.5"
          >
            {isSubmitting ? (
              "Creating Campaign..."
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                Create Campaign
              </>
            )}
          </Button>
        </div>
      </form>
    </DetailDrawer>
  );
}
