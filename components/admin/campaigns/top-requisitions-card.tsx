"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Award } from "lucide-react";

export interface RequisitionItem {
  jobPostId: string;
  title: string;
  applicationsCount: number;
}

interface TopRequisitionsCardProps {
  data?: RequisitionItem[];
  isLoading?: boolean;
}

export function TopRequisitionsCard({
  data,
  isLoading,
}: TopRequisitionsCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Top Requisitions by Application Volume
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Skeleton className="h-[280px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const items = data && data.length > 0 ? data : [];

  return (
    <Card className="h-full border-border/70 shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>Top Requisitions by Application Volume</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Highest-yield job vacancies across acquisition funnels
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {items.length} Roles Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {items.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Award className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm font-medium">No job attribution recorded</p>
            <p className="text-xs mt-1">
              Campaigns linked to job postings will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {items.map((job, idx) => (
              <div
                key={job.jobPostId || idx}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {job.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Fast-track candidate inflow
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {job.applicationsCount.toLocaleString()} apps
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      verified candidates
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
