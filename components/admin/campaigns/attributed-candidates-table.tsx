"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchAttributedApplicants,
  setApplicantFilters,
  setApplicantPage,
} from "@/lib/store/campaignSlice";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToExcel } from "@/lib/utils/excelExport";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  Users,
  Search,
  Download,
  ExternalLink,
  Zap,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  UserCheck,
  Building,
} from "lucide-react";

export function AttributedCandidatesTable() {
  const dispatch = useAppDispatch();
  const {
    attributedApplicants,
    attributedApplicantsPagination,
    attributedApplicantsSummary,
    isLoadingAttributedApplicants,
    applicantFilters,
    campaigns,
    platforms,
  } = useAppSelector((state) => state.campaigns);

  const [, startTransition] = useTransition();
  const [localSearch, setLocalSearch] = useState(applicantFilters.search || "");

  // Load applicants on mount or when filters change
  useEffect(() => {
    dispatch(fetchAttributedApplicants(applicantFilters));
  }, [dispatch, applicantFilters]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    startTransition(() => {
      dispatch(setApplicantFilters({ search: localSearch.trim() }));
    });
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    dispatch(
      setApplicantFilters({
        search: "",
        campaignCode: "all",
        platform: "all",
        status: "all",
        page: 1,
      }),
    );
  };

  const handlePageChange = (newPage: number) => {
    if (
      newPage < 1 ||
      (attributedApplicantsPagination &&
        newPage > attributedApplicantsPagination.totalPages)
    )
      return;
    dispatch(setApplicantPage(newPage));
  };

  const handleExport = () => {
    if (!attributedApplicants || attributedApplicants.length === 0) {
      toast({
        title: "Export Failed",
        description: "No attributed candidates to export with active filters.",
        variant: "destructive",
      });
      return;
    }

    const flatRows = attributedApplicants.map((item, idx) => ({
      "#": idx + 1,
      "Candidate Name": item.candidateName,
      "Candidate Email": item.candidateEmail,
      "Candidate Phone": item.candidatePhone
        ? `${item.candidateCountryCode ? `+${item.candidateCountryCode} ` : ""}${item.candidatePhone}`
        : "N/A",
      "Applied Requisition": item.jobTitle,
      Company: item.companyName || "N/A",
      "Campaign Name": item.campaignName || "N/A",
      "Campaign Code": item.campaignCode || "N/A",
      Channel: item.platform || "direct",
      "Acquisition Method":
        item.appliedVia === "fast_track" ? "Fast-Track AI" : "Standard Form",
      Status: item.status,
      "Applied Date": item.appliedAt
        ? format(new Date(item.appliedAt), "yyyy-MM-dd HH:mm")
        : "N/A",
      "Resume Link": item.resumeUrl || "Not Attached",
    }));

    const dateStr = format(new Date(), "yyyy-MM-dd");
    exportToExcel(
      flatRows,
      `campaign-attributed-candidates-${dateStr}`,
      "Candidates",
    );

    toast({
      title: "Export Completed",
      description: `Downloaded ${flatRows.length} attributed candidate records.`,
    });
  };

  const hasActiveFilters = Boolean(
    (applicantFilters.search && applicantFilters.search.trim()) ||
    (applicantFilters.campaignCode &&
      applicantFilters.campaignCode !== "all") ||
    (applicantFilters.platform && applicantFilters.platform !== "all") ||
    (applicantFilters.status && applicantFilters.status !== "all"),
  );

  return (
    <Card className="border-border/70 shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Attributed Candidates & Applications</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Direct telemetry on job seekers who onboarded or applied through
              marketing acquisition campaigns
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {attributedApplicantsSummary && (
              <>
                <Badge variant="outline" className="text-xs font-mono">
                  Total: {attributedApplicantsSummary.totalAttributed}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs font-mono flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                >
                  <Zap className="h-3 w-3" />
                  <span>
                    Fast-Track: {attributedApplicantsSummary.fastTrackCount}
                  </span>
                </Badge>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={handleExport}
              disabled={
                isLoadingAttributedApplicants ||
                !attributedApplicants ||
                attributedApplicants.length === 0
              }
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Excel</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="lg:col-span-4 relative flex items-center"
          >
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search candidate name, email, role..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-8 h-8 text-xs w-full"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  dispatch(setApplicantFilters({ search: "" }));
                }}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </form>

          {/* Platform filter */}
          <div className="lg:col-span-2">
            <Select
              value={applicantFilters.platform || "all"}
              onValueChange={(val) =>
                dispatch(setApplicantFilters({ platform: val }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {platforms.map((p) => (
                  <SelectItem key={p.id} value={p.platform}>
                    {p.displayName || p.platform.toUpperCase()}
                  </SelectItem>
                ))}
                <SelectItem value="fast-track">
                  Fast-Track Onboarding
                </SelectItem>
                <SelectItem value="direct">Direct Website</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaign Filter */}
          <div className="lg:col-span-3">
            <Select
              value={applicantFilters.campaignCode || "all"}
              onValueChange={(val) =>
                dispatch(setApplicantFilters({ campaignCode: val }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.campaignCode}>
                    {c.name} ({c.campaignCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <Select
              value={applicantFilters.status || "all"}
              onValueChange={(val) =>
                dispatch(setApplicantFilters({ status: val }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="viewedJobprovider">Reviewed</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="shortListed">Shortlisted</SelectItem>
                <SelectItem value="interviewScheduled">
                  Interview Scheduled
                </SelectItem>
                <SelectItem value="interviewCompleted">
                  Interview Completed
                </SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters Trigger */}
          <div className="lg:col-span-1 flex items-center">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground w-full flex items-center justify-center gap-1"
                title="Reset all filters"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoadingAttributedApplicants ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : attributedApplicants.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
            <UserCheck className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-semibold">No candidates found</p>
            <p className="text-xs mt-1 max-w-sm">
              {hasActiveFilters
                ? "No candidates match your current filter selections. Try clearing or expanding your search."
                : "No campaign attributed applications have been recorded yet."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="mt-4 text-xs h-8"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                <tr>
                  <th className="px-4 py-3 font-semibold">Candidate</th>
                  <th className="px-4 py-3 font-semibold">Applied Role</th>
                  <th className="px-4 py-3 font-semibold">
                    Campaign & Channel
                  </th>
                  <th className="px-4 py-3 font-semibold">Acquisition Flow</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Applied At</th>
                  <th className="px-4 py-3 font-semibold text-right">Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {attributedApplicants.map((item) => {
                  const initials = item.candidateName
                    ? item.candidateName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "CA";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Candidate Identity */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate max-w-[160px]">
                              {item.candidateName}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                              {item.candidateEmail}
                            </div>
                            {item.candidatePhone && (
                              <div className="text-[10px] text-muted-foreground font-mono">
                                {item.candidateCountryCode
                                  ? `+${item.candidateCountryCode} `
                                  : ""}
                                {item.candidatePhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Job Requisition */}
                      <td className="px-4 py-3">
                        <div
                          className="font-semibold text-foreground truncate max-w-[180px]"
                          title={item.jobTitle}
                        >
                          {item.jobTitle}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {item.companyName || "HireNest Partner"}
                          </span>
                        </div>
                        {item.skills && item.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                            {item.skills.slice(0, 2).map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-1.5 py-0.2 bg-muted rounded text-[9px] text-muted-foreground font-mono"
                              >
                                {skill}
                              </span>
                            ))}
                            {item.skills.length > 2 && (
                              <span className="text-[9px] text-muted-foreground font-mono">
                                +{item.skills.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Campaign & Channel */}
                      <td className="px-4 py-3">
                        <div
                          className="font-medium text-foreground truncate max-w-[160px]"
                          title={item.campaignName}
                        >
                          {item.campaignName || "Direct Flow"}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {item.campaignCode && (
                            <span className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] font-semibold text-muted-foreground">
                              {item.campaignCode}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] uppercase font-bold">
                            {item.platform || "channel"}
                          </span>
                        </div>
                      </td>

                      {/* Acquisition Method */}
                      <td className="px-4 py-3">
                        {item.appliedVia === "fast_track" ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 flex items-center gap-1 w-fit"
                          >
                            <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            <span>Fast-Track AI</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium text-muted-foreground w-fit"
                          >
                            Standard ATS
                          </Badge>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            item.status === "hired"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : item.status === "shortListed" ||
                                  item.status === "interviewScheduled"
                                ? "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                                : item.status === "rejected"
                                  ? "bg-red-500/15 text-red-700 dark:text-red-400"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Applied At */}
                      <td className="px-4 py-3 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                        {item.appliedAt
                          ? format(new Date(item.appliedAt), "MMM dd, yyyy")
                          : "N/A"}
                        <div className="text-[10px] text-muted-foreground/80">
                          {item.appliedAt
                            ? format(new Date(item.appliedAt), "HH:mm")
                            : ""}
                        </div>
                      </td>

                      {/* Resume / Action */}
                      <td className="px-4 py-3 text-right">
                        {item.resumeUrl ? (
                          <a
                            href={item.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-colors text-[11px] font-medium"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Resume</span>
                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            No CV
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {attributedApplicantsPagination &&
          attributedApplicantsPagination.totalPages > 1 && (
            <div className="p-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Showing Page {attributedApplicantsPagination.page} of{" "}
                {attributedApplicantsPagination.totalPages} (
                {attributedApplicantsPagination.total} Total)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={attributedApplicantsPagination.page <= 1}
                  onClick={() =>
                    handlePageChange(attributedApplicantsPagination.page - 1)
                  }
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-mono font-medium text-foreground">
                  {attributedApplicantsPagination.page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={
                    attributedApplicantsPagination.page >=
                    attributedApplicantsPagination.totalPages
                  }
                  onClick={() =>
                    handlePageChange(attributedApplicantsPagination.page + 1)
                  }
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
