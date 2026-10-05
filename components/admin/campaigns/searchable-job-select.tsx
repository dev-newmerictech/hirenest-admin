"use client";

import { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Job } from "@/lib/types";
import {
  ChevronsUpDown,
  Check,
  Search,
  Briefcase,
  Building2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableJobSelectProps {
  jobs: Job[];
  value: string;
  onChange: (jobId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableJobSelect({
  jobs,
  value,
  onChange,
  placeholder = "Select a target job posting...",
  disabled = false,
  className,
}: SearchableJobSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Sort jobs ascending by postedDate / createdAt as requested
  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      const timeA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
      const timeB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
      return timeA - timeB;
    });
  }, [jobs]);

  // Filter sorted jobs by title, company name, or location
  const filteredJobs = useMemo(() => {
    if (!searchTerm.trim()) return sortedJobs;
    const term = searchTerm.toLowerCase();
    return sortedJobs.filter(
      (job) =>
        job.title?.toLowerCase().includes(term) ||
        job.companyName?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term),
    );
  }, [sortedJobs, searchTerm]);

  const selectedJob = useMemo(
    () => sortedJobs.find((j) => j.id === value),
    [sortedJobs, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal h-10 px-3",
            !selectedJob && "text-muted-foreground",
            className,
          )}
        >
          {selectedJob ? (
            <div className="flex items-center gap-2 truncate">
              <Briefcase className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-foreground truncate">
                {selectedJob.title}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                • {selectedJob.companyName || "Company"}
              </span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[340px] max-w-[480px] p-2 bg-popover text-popover-foreground border shadow-lg"
      >
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search job title, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-xs"
            autoFocus
          />
        </div>

        <ScrollArea className="h-64 pr-2">
          {filteredJobs.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No matching job postings found.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredJobs.map((job) => {
                const isSelected = job.id === value;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => {
                      onChange(job.id);
                      setOpen(false);
                      setSearchTerm("");
                    }}
                    className={cn(
                      "w-full text-left p-2.5 rounded-md text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/70 text-foreground",
                    )}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="font-semibold truncate">{job.title}</div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {job.companyName || "HireNest"}
                        </span>
                        {job.postedDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(job.postedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
