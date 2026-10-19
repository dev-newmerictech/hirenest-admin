"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Download, Filter, RefreshCw, X } from "lucide-react";
import {
  PlatformSetting,
  IAnalyticsOverviewFilters,
} from "@/lib/api/campaigns";
import { Job } from "@/lib/types";

interface CampaignAnalyticsFiltersProps {
  filters: IAnalyticsOverviewFilters;
  onFilterChange: (filters: Partial<IAnalyticsOverviewFilters>) => void;
  onReset: () => void;
  platforms: PlatformSetting[];
  jobs: Job[];
  onExport: () => void;
  isLoading?: boolean;
}

export function CampaignAnalyticsFilters({
  filters,
  onFilterChange,
  onReset,
  platforms,
  jobs,
  onExport,
  isLoading,
}: CampaignAnalyticsFiltersProps) {
  const [activePreset, setActivePreset] = useState<string>("30d");
  const [customStart, setCustomStart] = useState<string>(
    filters.startDate || "",
  );
  const [customEnd, setCustomEnd] = useState<string>(filters.endDate || "");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handlePresetSelect = (
    preset: "today" | "7d" | "30d" | "90d" | "all",
  ) => {
    setActivePreset(preset);
    const now = new Date();
    const endStr = now.toISOString().split("T")[0];

    if (preset === "today") {
      onFilterChange({ startDate: endStr, endDate: endStr });
    } else if (preset === "7d") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      onFilterChange({
        startDate: start.toISOString().split("T")[0],
        endDate: endStr,
      });
    } else if (preset === "30d") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      onFilterChange({
        startDate: start.toISOString().split("T")[0],
        endDate: endStr,
      });
    } else if (preset === "90d") {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      onFilterChange({
        startDate: start.toISOString().split("T")[0],
        endDate: endStr,
      });
    } else if (preset === "all") {
      onFilterChange({ startDate: undefined, endDate: undefined });
    }
  };

  const handleApplyCustomDates = () => {
    if (customStart && customEnd) {
      setActivePreset("custom");
      onFilterChange({ startDate: customStart, endDate: customEnd });
      setIsDatePickerOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date Presets Button Group */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md border border-border/60">
          {(
            [
              { id: "today", label: "Today" },
              { id: "7d", label: "7D" },
              { id: "30d", label: "30D" },
              { id: "90d", label: "90D" },
              { id: "all", label: "All Time" },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                activePreset === preset.id
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {preset.label}
            </button>
          ))}

          {/* Custom Date Popover */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition-all ${
                  activePreset === "custom"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Calendar className="h-3 w-3" />
                <span>Custom</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-3" align="start">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold">Custom Date Range</h4>
                <p className="text-[11px] text-muted-foreground">
                  Select start and end date boundaries for analysis.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="space-y-1">
                  <Label htmlFor="custom-start" className="text-xs">
                    Start Date
                  </Label>
                  <Input
                    id="custom-start"
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="custom-end" className="text-xs">
                    End Date
                  </Label>
                  <Input
                    id="custom-end"
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDatePickerOpen(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyCustomDates}
                  className="h-7 text-xs"
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Action Controls: Export & Reset */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-8 gap-1.5 text-xs border-border/80 hover:bg-muted"
            title="Reset Filters"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onExport}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export XLSX</span>
          </Button>
        </div>
      </div>

      {/* Dropdown Filters Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        {/* Platform Channel Select */}
        <Select
          value={filters.platform || "all"}
          onValueChange={(val) => onFilterChange({ platform: val })}
        >
          <SelectTrigger className="w-[150px] text-xs h-8 bg-background">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p.platform} value={p.platform}>
                {p.displayName || p.platform.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Select */}
        <Select
          value={filters.status || "all"}
          onValueChange={(val) => onFilterChange({ status: val })}
        >
          <SelectTrigger className="w-[130px] text-xs h-8 bg-background">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        {/* Requisition Select */}
        <Select
          value={filters.jobPostId || "all"}
          onValueChange={(val) => onFilterChange({ jobPostId: val })}
        >
          <SelectTrigger className="w-[200px] text-xs h-8 bg-background">
            <SelectValue placeholder="All Requisitions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requisitions</SelectItem>
            {jobs.map((j) => (
              <SelectItem key={j.id} value={j.id}>
                {j.title || "Untitled Job"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Active Filter Clear Pill */}
        {(filters.platform !== "all" && filters.platform) ||
        (filters.status !== "all" && filters.status) ||
        (filters.jobPostId !== "all" && filters.jobPostId) ? (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted px-2 py-1 rounded transition-colors"
          >
            <span>Clear filters</span>
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
