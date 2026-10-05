"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CampaignSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignName: string;
  platform: string;
  campaignCode: string;
  trackingUrl: string;
}

export function CampaignSuccessDialog({
  open,
  onOpenChange,
  campaignName,
  platform,
  campaignCode,
  trackingUrl,
}: CampaignSuccessDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Fast-track campaign tracking link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleTestGate = () => {
    if (trackingUrl) {
      window.open(trackingUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-6">
        <DialogHeader className="text-center sm:text-left space-y-2">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto sm:mx-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Campaign Created Successfully!
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Your fast-track acquisition campaign is live and ready for candidate
            distribution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Metadata Summary Card */}
          <div className="p-3 rounded-lg border border-border bg-muted/40 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Name
              </span>
              <span className="font-semibold text-foreground truncate block">
                {campaignName}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Channel
              </span>
              <span className="font-semibold text-foreground capitalize block">
                {platform}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Code
              </span>
              <span className="font-mono font-semibold text-foreground block">
                {campaignCode}
              </span>
            </div>
          </div>

          {/* Tracking Link Preview & 1-Click Copy */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Direct Fast-Track Tracking Link
            </label>
            <div className="flex items-center gap-2 w-full min-w-0">
              <Input
                readOnly
                value={trackingUrl}
                className="font-mono text-xs h-9 bg-muted/30 select-all min-w-0 flex-1 truncate"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-9 px-3 shrink-0 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-green-600 font-medium text-xs">
                      Copied
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Share this link across {platform}. Candidates clicking will bypass
              login gates and land straight into the fast-track application
              flow.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestGate}
            className="w-full sm:w-auto gap-1.5 text-xs h-9"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Test Gate
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs h-9"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
