"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Campaign } from "@/lib/api/campaigns";
import { Job } from "@/lib/types";
import { useAppDispatch } from "@/lib/store/hooks";
import { generateTrackingLinkThunk } from "@/lib/store/campaignSlice";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, ExternalLink, Sparkles } from "lucide-react";

interface LinkGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: Campaign[];
  jobs: Job[];
  defaultCampaign?: Campaign | null;
  defaultJobId?: string;
}

export function LinkGeneratorDialog({
  open,
  onOpenChange,
  campaigns,
  jobs,
  defaultCampaign,
  defaultJobId,
}: LinkGeneratorDialogProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [utmMedium, setUtmMedium] = useState("fast-track");
  const [utmContent, setUtmContent] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (defaultCampaign) {
      setSelectedCampaignId(defaultCampaign.id);
    } else if (campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0].id);
    }

    if (defaultJobId) {
      setSelectedJobId(defaultJobId);
    } else if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [defaultCampaign, defaultJobId, campaigns, jobs, open]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  // Handle generation via backend V2 API endpoint
  const handleGenerate = async () => {
    if (!selectedCampaign || !selectedJobId) {
      toast({
        title: "Missing Information",
        description: "Please select both a campaign and a job posting.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await dispatch(
        generateTrackingLinkThunk({
          platform: selectedCampaign.platform,
          campaignCode: selectedCampaign.campaignCode,
          jobId: selectedJobId,
          utmMedium: utmMedium.trim() || undefined,
          utmContent: utmContent.trim() || undefined,
        }),
      ).unwrap();

      setGeneratedUrl(res.trackingUrl);
      toast({
        title: "Link Generated",
        description: "Tracking URL generated successfully with UTM parameters.",
      });
    } catch (err: any) {
      toast({
        title: "Generation Failed",
        description: err || "Failed to generate tracking link",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "Campaign tracking URL copied.",
      });
    } catch (e) {
      toast({
        title: "Copy Failed",
        description: "Please copy manually from the input box.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Fast-Track Link Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Campaign Selector */}
          <div className="space-y-2">
            <Label>Target Campaign</Label>
            <Select
              value={selectedCampaignId}
              onValueChange={(val) => {
                setSelectedCampaignId(val);
                setGeneratedUrl("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((camp) => (
                  <SelectItem key={camp.id} value={camp.id}>
                    {camp.name} ({camp.platform} · {camp.campaignCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Selector */}
          <div className="space-y-2">
            <Label>Target Job Posting</Label>
            <Select
              value={selectedJobId}
              onValueChange={(val) => {
                setSelectedJobId(val);
                setGeneratedUrl("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job posting" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} {job.companyName ? `(${job.companyName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* UTM Parameters Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="utmMedium">UTM Medium</Label>
              <Input
                id="utmMedium"
                placeholder="e.g. fast-track, social, cpc"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utmContent">UTM Content (optional)</Label>
              <Input
                id="utmContent"
                placeholder="e.g. post_cta, hero_btn"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
              />
            </div>
          </div>

          {/* Action Trigger */}
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !selectedCampaignId || !selectedJobId}
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate Tracking URL"}
          </Button>

          {/* URL Result Box */}
          {generatedUrl && (
            <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
              <span className="text-xs font-semibold text-primary block">
                Tracking URL (Gated & Evaluated)
              </span>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedUrl}
                  className="font-mono text-xs bg-background selection:bg-primary/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                  title="Copy Link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(generatedUrl, "_blank")}
                  className="shrink-0"
                  title="Test in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Candidates opening this link will trigger Fast-Track evaluate,
                receive HMAC session cookies, and see the gated 1-click
                application drawer.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
