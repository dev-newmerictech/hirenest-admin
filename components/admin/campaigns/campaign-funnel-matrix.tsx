"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { IFunnelDropoffStage } from "@/lib/api/campaigns";
import { ArrowDown, TrendingDown, Target, Zap } from "lucide-react";

interface CampaignFunnelMatrixProps {
  funnel?: IFunnelDropoffStage[];
  isLoading?: boolean;
}

interface StageConfig {
  label: string;
  description: string;
  barColor: string;
  bgAccent: string;
}

const CANONICAL_STAGE_CONFIGS: Record<string, StageConfig> = {
  visitors: {
    label: "1. Visitors Landed",
    description: "Traffic arrivals / gate visits via campaign link",
    barColor: "bg-indigo-500",
    bgAccent:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  clicks: {
    label: "2. Clicked 'Apply'",
    description: "Visitors who clicked 'Apply' button on requisition gate",
    barColor: "bg-sky-500",
    bgAccent:
      "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  signups: {
    label: "3. Created Accounts",
    description: "Real registered candidate accounts in database",
    barColor: "bg-amber-500",
    bgAccent:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  applications: {
    label: "4. Submitted Applications",
    description: "Completed job applications matching job provider count",
    barColor: "bg-emerald-500",
    bgAccent:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
};

function resolveStageConfig(stageName: string, idx: number): StageConfig {
  const normalized = (stageName || "").toLowerCase();
  if (normalized.includes("visitor") || normalized.includes("impression")) {
    return CANONICAL_STAGE_CONFIGS.visitors;
  }
  if (
    normalized.includes("click") ||
    normalized.includes("apply button") ||
    normalized.includes("cta")
  ) {
    return CANONICAL_STAGE_CONFIGS.clicks;
  }
  if (
    normalized.includes("account") ||
    normalized.includes("sign-up") ||
    normalized.includes("signup") ||
    normalized.includes("lead")
  ) {
    return CANONICAL_STAGE_CONFIGS.signups;
  }
  if (
    normalized.includes("application") ||
    normalized.includes("submitted")
  ) {
    return CANONICAL_STAGE_CONFIGS.applications;
  }
  const fallbackKey =
    idx === 0 ? "visitors" : idx === 1 ? "clicks" : idx === 2 ? "signups" : "applications";
  return (
    CANONICAL_STAGE_CONFIGS[fallbackKey] || {
      label: stageName || `Stage ${idx + 1}`,
      description: "",
      barColor: "bg-primary",
      bgAccent: "bg-primary/10 text-primary border-primary/20",
    }
  );
}

export function CampaignFunnelMatrix({
  funnel,
  isLoading,
}: CampaignFunnelMatrixProps) {
  if (isLoading) {
    return (
      <Card className="h-full border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Conversion Funnel Drop-Off</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-md bg-muted/60 animate-pulse"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Display complete 4-stage funnel (or canonical 4-stage fallback)
  const stages = React.useMemo(() => {
    if (funnel && funnel.length > 0) return funnel;
    return [
      {
        stage: "1. Visitors Landed",
        count: 0,
        conversionRate: 100,
        dropoffRate: 0,
        dropoffCount: 0,
        dropoffLabel: "0 Bounced (0.0%)",
      },
      {
        stage: "2. Clicked 'Apply'",
        count: 0,
        conversionRate: 0,
        dropoffRate: 0,
        dropoffCount: 0,
        dropoffLabel: "0 Dropped at Phone Prompt (0.0%)",
      },
      {
        stage: "3. Created Accounts",
        count: 0,
        conversionRate: 0,
        dropoffRate: 0,
        dropoffCount: 0,
        dropoffLabel: "0 Dropped at Resume Step (0.0%)",
      },
      {
        stage: "4. Submitted Applications",
        count: 0,
        conversionRate: 0,
        dropoffRate: 0,
        dropoffCount: 0,
        dropoffLabel: "",
      },
    ];
  }, [funnel]);

  const topImpressionCount = stages[0]?.count || 0;
  const bottomAppCount = stages[stages.length - 1]?.count || 0;
  const overallEfficiency =
    topImpressionCount > 0
      ? ((bottomAppCount / topImpressionCount) * 100).toFixed(2)
      : "0.00";

  return (
    <Card className="h-full border-border/70 shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span>Conversion Funnel Drop-Off</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Retention rate and drop-off between each candidate stage
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-mono font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1"
          >
            <Zap className="h-3 w-3" />
            <span>{overallEfficiency}% Overall CVR</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 flex-1 flex flex-col justify-around">
        {stages.map((stage, idx) => {
          const config = resolveStageConfig(stage.stage, idx);

          const widthPercent =
            topImpressionCount > 0
              ? Math.max(
                  4,
                  Math.min(100, (stage.count / topImpressionCount) * 100),
                )
              : 0;

          return (
            <div key={stage.stage || idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {config.label}
                  </span>
                  <span className="hidden sm:inline text-[11px] text-muted-foreground">
                    ({config.description})
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-semibold text-foreground">
                    {stage.count.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    ({stage.conversionRate.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Visual Funnel Bar */}
              <div className="relative h-6 w-full rounded-md bg-muted/50 overflow-hidden border border-border/40 flex items-center px-2">
                <div
                  className={`absolute left-0 top-0 bottom-0 ${config.barColor} opacity-85 transition-all duration-500 rounded-r`}
                  style={{ width: `${widthPercent}%` }}
                />
                <span className="relative z-10 text-[11px] font-mono font-medium text-foreground">
                  {stage.count.toLocaleString()} candidates
                </span>
              </div>

              {/* Drop-off indicator to next stage */}
              {idx < stages.length - 1 && (
                <div className="flex items-center justify-end pr-2 pt-0.5 gap-1.5 text-[11px] text-muted-foreground">
                  <ArrowDown className="h-3 w-3 text-rose-500" />
                  {stage.dropoffLabel ? (
                    <span className="text-rose-500 font-medium">
                      {stage.dropoffLabel}
                    </span>
                  ) : (
                    <>
                      <span className="text-rose-500 font-medium">
                        -{stage.dropoffRate ? stage.dropoffRate.toFixed(1) : "0.0"}%
                        drop-off
                      </span>
                      <span>to next step</span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
