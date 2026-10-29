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
      <Card className="h-full border-border/70 shadow-xs flex flex-col justify-between">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>Top Requisitions by Application Volume</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <Skeleton className="h-[260px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const items = data && data.length > 0 ? data : [];
  const totalVolume = items.reduce(
    (acc, item) => acc + (item.applicationsCount || 0),
    0,
  );

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

      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Award className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm font-medium">No job attribution recorded</p>
            <p className="text-xs mt-1">
              Campaigns linked to job postings will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                <tr>
                  <th className="px-4 py-2.5 font-semibold w-16">Rank</th>
                  <th className="px-4 py-2.5 font-semibold">
                    Requisition Title
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-right">
                    Volume
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-right w-28">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((job, idx) => {
                  const sharePct =
                    totalVolume > 0
                      ? ((job.applicationsCount / totalVolume) * 100).toFixed(1)
                      : "0.0";

                  return (
                    <tr
                      key={job.jobPostId || idx}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                            idx === 0
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-extrabold"
                              : idx === 1
                                ? "bg-slate-400/15 text-slate-700 dark:text-slate-300 font-bold"
                                : idx === 2
                                  ? "bg-amber-700/15 text-amber-800 dark:text-amber-500 font-bold"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-[260px]"
                          title={job.title}
                        >
                          {job.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          ID: {job.jobPostId ? job.jobPostId.slice(-6) : "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {job.applicationsCount.toLocaleString()} apps
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          verified candidates
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-mono text-xs text-muted-foreground">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(6, Number(sharePct)))}%`,
                              }}
                            />
                          </div>
                          <span className="font-semibold text-foreground">
                            {sharePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
