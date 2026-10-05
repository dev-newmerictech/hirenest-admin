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
import { Campaign, PlatformSetting, CampaignStatus } from "@/lib/api/campaigns";
import { Job } from "@/lib/types";
import { useAppDispatch } from "@/lib/store/hooks";
import {
  createCampaignThunk,
  updateCampaignThunk,
  fetchCampaigns,
  fetchCampaignSummary,
} from "@/lib/store/campaignSlice";
import { useToast } from "@/hooks/use-toast";

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign | null;
  platforms: PlatformSetting[];
  jobs: Job[];
  onSuccess?: () => void;
}

export function CampaignDialog({
  open,
  onOpenChange,
  campaign,
  platforms,
  jobs,
  onSuccess,
}: CampaignDialogProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [campaignCode, setCampaignCode] = useState("");
  const [patternsInput, setPatternsInput] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!campaign;

  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setPlatform(campaign.platform);
      setCampaignCode(campaign.campaignCode);
      setPatternsInput(campaign.patterns?.join(", ") || "");
      setStatus(campaign.status);
      setStartDate(campaign.startDate ? campaign.startDate.split("T")[0] : "");
      setEndDate(campaign.endDate ? campaign.endDate.split("T")[0] : "");
      setSelectedJobId("");
    } else {
      setName("");
      setPlatform(platforms[0]?.platform || "linkedin");
      setCampaignCode("");
      setPatternsInput("");
      setStatus("active");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setSelectedJobId("none");
    }
  }, [campaign, platforms, open]);

  // Auto-generate suggested code when name or platform changes (creation mode only)
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !campaignCode) {
      const pfx = platform ? platform.slice(0, 2).toLowerCase() : "cp";
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .slice(0, 15);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setCampaignCode(`${pfx}_${slug ? slug + "_" : ""}${randomSuffix}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const parsedPatterns = patternsInput
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      if (isEditing && campaign) {
        await dispatch(
          updateCampaignThunk({
            id: campaign.id,
            payload: {
              name: name.trim(),
              status,
              patterns: parsedPatterns.length > 0 ? parsedPatterns : undefined,
              endDate: endDate ? new Date(endDate).toISOString() : undefined,
            },
          }),
        ).unwrap();

        toast({
          title: "Campaign Updated",
          description: `Successfully updated ${name}.`,
        });
      } else {
        await dispatch(
          createCampaignThunk({
            name: name.trim(),
            platform,
            campaignCode: campaignCode.trim() || undefined,
            patterns: parsedPatterns.length > 0 ? parsedPatterns : undefined,
            jobPostIds:
              selectedJobId && selectedJobId !== "none" ? [selectedJobId] : [],
            startDate: startDate
              ? new Date(startDate).toISOString()
              : undefined,
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
          }),
        ).unwrap();

        toast({
          title: "Campaign Created",
          description: `Successfully launched campaign ${name}.`,
        });
      }

      dispatch(fetchCampaigns());
      dispatch(fetchCampaignSummary());
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: isEditing ? "Update Failed" : "Creation Failed",
        description: err || "An error occurred with campaign operation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Campaign" : "Create Marketing Campaign"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campName">Campaign Name</Label>
            <Input
              id="campName"
              placeholder="e.g. Q4 LinkedIn Fast Track Engineers"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          {/* Platform & Status Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Platform Channel</Label>
              <Select
                value={platform}
                onValueChange={setPlatform}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.platform} value={p.platform}>
                      {p.displayName || p.platform}
                    </SelectItem>
                  ))}
                  {platforms.length === 0 && (
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(val: CampaignStatus) => setStatus(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="campCode">Campaign Code (UTM Campaign)</Label>
                <Input
                  id="campCode"
                  placeholder="e.g. li_fasttrack_476953"
                  value={campaignCode}
                  onChange={(e) => setCampaignCode(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            )}
          </div>

          {/* Regex Patterns */}
          <div className="space-y-2">
            <Label htmlFor="patterns">
              UTM Campaign Patterns{" "}
              <span className="text-muted-foreground text-xs">
                (optional regex)
              </span>
            </Label>
            <Input
              id="patterns"
              placeholder="e.g. li_fasttrack_.*, li_eng_2026.*"
              value={patternsInput}
              onChange={(e) => setPatternsInput(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Comma-separated regex patterns for flexible UTM matching.
            </p>
          </div>

          {/* Initial Job Post Selection (Creation only) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Initial Bound Job Posting</Label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job to bind (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (bind later)</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}{" "}
                      {job.companyName ? `(${job.companyName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Update Campaign"
                  : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
