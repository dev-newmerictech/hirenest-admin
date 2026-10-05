"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlatformSetting, GlobalDashboardSummary } from "@/lib/api/campaigns";
import { useAppDispatch } from "@/lib/store/hooks";
import {
  togglePlatformThunk,
  createPlatformThunk,
} from "@/lib/store/campaignSlice";
import { useToast } from "@/hooks/use-toast";
import { Plus, Globe } from "lucide-react";

interface PlatformTogglesProps {
  platforms: PlatformSetting[];
  summary?: GlobalDashboardSummary | null;
  isLoading?: boolean;
}

export function PlatformToggles({
  platforms,
  summary,
  isLoading,
}: PlatformTogglesProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPlatformKey, setNewPlatformKey] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = async (platform: string, currentStatus: boolean) => {
    try {
      await dispatch(togglePlatformThunk(platform)).unwrap();
      toast({
        title: "Platform Updated",
        description: `${platform} tracking is now ${!currentStatus ? "Active" : "Disabled"}.`,
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err || "Failed to update platform status",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformKey.trim()) return;

    setIsSubmitting(true);
    try {
      const sanitizedKey = newPlatformKey
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
      await dispatch(
        createPlatformThunk({
          platform: sanitizedKey,
          displayName: newDisplayName.trim() || undefined,
        }),
      ).unwrap();

      toast({
        title: "Platform Added",
        description: `Successfully added ${newDisplayName || sanitizedKey}.`,
      });
      setIsAddOpen(false);
      setNewPlatformKey("");
      setNewDisplayName("");
    } catch (err: any) {
      toast({
        title: "Creation Failed",
        description: err || "Failed to create platform",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-muted/60 animate-pulse rounded-md"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Channel Tracking Switches
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Instantly gate or enable Fast-Track evaluation by traffic source
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="text-xs h-8 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Channel
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {platforms.map((p) => {
          const breakdown = summary?.platformBreakdown?.find(
            (b) => b.platform.toLowerCase() === p.platform.toLowerCase(),
          );

          return (
            <div
              key={p.platform}
              className="flex flex-col justify-between p-3 rounded-lg border border-border bg-background hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground capitalize truncate">
                  {p.displayName || p.platform}
                </span>
                <Switch
                  checked={p.isActive}
                  onCheckedChange={() => handleToggle(p.platform, p.isActive)}
                  aria-label={`Toggle ${p.displayName || p.platform}`}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
                <span>{breakdown?.campaignsCount ?? 0} campaigns</span>
                <span className="font-semibold text-foreground">
                  {breakdown?.leadsCount ?? 0} leads
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Platform Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Marketing Channel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="platformKey">Platform Identifier (slug)</Label>
              <Input
                id="platformKey"
                placeholder="e.g. tiktok, glassdoor, meta"
                value={newPlatformKey}
                onChange={(e) => setNewPlatformKey(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Matches the `utm_source` query parameter.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g. TikTok Ads, Glassdoor"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Platform"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
