"use client";

import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AuthGuard } from "@/components/admin/auth-guard";
import { PageHeader } from "@/components/admin/page-header";
import { SearchBar } from "@/components/admin/search-bar";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { CampaignStats } from "@/components/admin/campaigns/campaign-stats";
import { PlatformToggles } from "@/components/admin/campaigns/platform-toggles";
import { CampaignDialog } from "@/components/admin/campaigns/campaign-dialog";
import { CreateCampaignDrawer } from "@/components/admin/campaigns/create-campaign-drawer";
import { CampaignSuccessDialog } from "@/components/admin/campaigns/campaign-success-dialog";
import { LinkGeneratorDialog } from "@/components/admin/campaigns/link-generator-dialog";
import { CampaignDetailDrawer } from "@/components/admin/campaigns/campaign-detail-drawer";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchCampaignSummary,
  fetchPlatforms,
  fetchCampaigns,
  fetchCampaign,
  updateCampaignThunk,
  setSearchQuery,
  setFilterPlatform,
  setFilterStatus,
} from "@/lib/store/campaignSlice";
import { fetchAllJobPosts } from "@/lib/store/jobPostsSlice";
import { Campaign } from "@/lib/api/campaigns";
import { Plus, Link2, Eye, Sparkles } from "lucide-react";

export default function CampaignsPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const {
    summary,
    platforms,
    campaigns,
    pagination,
    isLoadingSummary,
    isLoadingPlatforms,
    isLoadingCampaigns,
    searchQuery,
    filterPlatform,
    filterStatus,
  } = useAppSelector((state) => state.campaigns);

  const { allJobPosts } = useAppSelector((state) => state.jobPosts);

  const [currentPage, setCurrentPage] = useState(1);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  const [successDialogData, setSuccessDialogData] = useState<{
    campaign: Campaign;
    trackingUrl: string;
  } | null>(null);

  const [isLinkGenOpen, setIsLinkGenOpen] = useState(false);
  const [selectedCampaignForLink, setSelectedCampaignForLink] =
    useState<Campaign | null>(null);

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedCampaignForDetail, setSelectedCampaignForDetail] =
    useState<Campaign | null>(null);

  // Initial load
  useEffect(() => {
    dispatch(fetchCampaignSummary());
    dispatch(fetchPlatforms());
    dispatch(fetchAllJobPosts());
  }, [dispatch]);

  // Fetch campaigns on filter/page change
  useEffect(() => {
    dispatch(
      fetchCampaigns({
        page: currentPage,
        limit: 10,
        platform: filterPlatform !== "all" ? filterPlatform : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        search: searchQuery || undefined,
      }),
    );
  }, [dispatch, currentPage, filterPlatform, filterStatus, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    if (!pagination) return [];
    const pages: (number | "ellipsis")[] = [];
    const totalPages = pagination.totalPages;
    const current = pagination.page;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (current >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleRowClick = async (campaign: Campaign) => {
    try {
      const detailed = await dispatch(fetchCampaign(campaign.id)).unwrap();
      setSelectedCampaignForDetail(detailed);
    } catch {
      setSelectedCampaignForDetail(campaign);
    }
    setIsDetailDrawerOpen(true);
  };

  const handleOpenEdit = (campaign: Campaign) => {
    setCampaignToEdit(campaign);
    setIsCampaignDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setIsCreateDrawerOpen(true);
  };

  const handleOpenLinkGen = (campaign: Campaign) => {
    setSelectedCampaignForLink(campaign);
    setIsLinkGenOpen(true);
  };

  const handleToggleCampaignStatus = async (
    campaign: Campaign,
    newActive: boolean,
  ) => {
    try {
      await dispatch(
        updateCampaignThunk({
          id: campaign.id,
          payload: { status: newActive ? "active" : "paused" },
        }),
      ).unwrap();
      toast({
        title: "Status Updated",
        description: `Campaign "${campaign.name}" is now ${newActive ? "Active" : "Paused"}.`,
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err || "Failed to toggle campaign status",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Campaign>[] = [
    {
      key: "name",
      label: "Campaign",
      render: (item) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground">{item.name}</div>
          <div className="text-xs font-mono text-muted-foreground">
            {item.campaignCode}
          </div>
        </div>
      ),
    },
    {
      key: "platform",
      label: "Channel",
      render: (item) => (
        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-muted/70 text-foreground">
          {item.platform}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            checked={item.status === "active"}
            onCheckedChange={(checked) =>
              handleToggleCampaignStatus(item, checked)
            }
          />
          <span className="text-xs font-medium capitalize">
            {item.status === "active" ? "Active" : "Paused"}
          </span>
        </div>
      ),
    },
    {
      key: "impressionsCount",
      label: "Impressions",
      render: (item) => (
        <span className="font-mono text-xs">
          {item.impressionsCount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "leadsCount",
      label: "Leads",
      render: (item) => {
        const rate =
          item.impressionsCount > 0
            ? ((item.leadsCount / item.impressionsCount) * 100).toFixed(1)
            : "0.0";
        return (
          <div className="font-mono text-xs">
            <span className="font-semibold text-primary">
              {item.leadsCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground ml-1">
              ({rate}%)
            </span>
          </div>
        );
      },
    },
    {
      key: "applicationsCount",
      label: "Applications",
      render: (item) => {
        const rate =
          item.leadsCount > 0
            ? ((item.applicationsCount / item.leadsCount) * 100).toFixed(1)
            : "0.0";
        return (
          <div className="font-mono text-xs">
            <span className="font-semibold text-green-600">
              {item.applicationsCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground ml-1">
              ({rate}%)
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (item) => (
        <div
          className="flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => handleOpenLinkGen(item)}
            title="Generate Link"
          >
            <Link2 className="h-3.5 w-3.5 text-primary" />
            Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => handleRowClick(item)}
          >
            <Eye className="h-3.5 w-3.5" />
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6 mt-4 sm:mt-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <PageHeader
              title="Marketing & Campaigns"
              description="Manage fast-track acquisition campaigns, platform gating switches, and candidate conversion funnels"
            />
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <Button
                onClick={handleOpenCreate}
                className="gap-1.5 text-xs h-9"
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          </div>

          {/* Top KPI Stats */}
          <CampaignStats summary={summary} isLoading={isLoadingSummary} />

          {/* Platform Channel Switches */}
          <PlatformToggles
            platforms={platforms}
            summary={summary}
            isLoading={isLoadingPlatforms}
          />

          {/* Campaigns Table Section */}
          <div className="space-y-4">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <SearchBar
                  placeholder="Search campaigns by name or code..."
                  value={searchQuery}
                  onChange={(val) => {
                    dispatch(setSearchQuery(val));
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Platform Filter */}
                <Select
                  value={filterPlatform}
                  onValueChange={(val) => {
                    dispatch(setFilterPlatform(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] text-xs h-10">
                    <SelectValue placeholder="All Channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    {platforms.map((p) => (
                      <SelectItem key={p.platform} value={p.platform}>
                        {p.displayName || p.platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={filterStatus}
                  onValueChange={(val) => {
                    dispatch(setFilterStatus(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[120px] text-xs h-10">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            {isLoadingCampaigns ? (
              <div className="rounded-md border border-border bg-card p-8 text-center text-muted-foreground text-sm">
                Loading marketing campaigns...
              </div>
            ) : (
              <>
                <DataTable
                  columns={columns}
                  data={campaigns}
                  onRowClick={handleRowClick}
                  emptyMessage="No marketing campaigns found. Create your first campaign above."
                />

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total,
                      )}{" "}
                      of {pagination.total} campaigns
                    </p>

                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => {
                              if (pagination.page > 1)
                                handlePageChange(pagination.page - 1);
                            }}
                            className={
                              pagination.page === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {getPageNumbers().map((pageNum, idx) => (
                          <PaginationItem key={idx}>
                            {pageNum === "ellipsis" ? (
                              <PaginationEllipsis />
                            ) : (
                              <PaginationLink
                                onClick={() => handlePageChange(pageNum)}
                                isActive={pageNum === pagination.page}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => {
                              if (pagination.page < pagination.totalPages) {
                                handlePageChange(pagination.page + 1);
                              }
                            }}
                            className={
                              pagination.page === pagination.totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dialogs & Drawers */}
          <CreateCampaignDrawer
            open={isCreateDrawerOpen}
            onOpenChange={setIsCreateDrawerOpen}
            platforms={platforms}
            jobs={allJobPosts}
            onSuccess={(data) => {
              setSuccessDialogData(data);
            }}
          />

          {successDialogData && (
            <CampaignSuccessDialog
              open={!!successDialogData}
              onOpenChange={(open) => !open && setSuccessDialogData(null)}
              campaignName={successDialogData.campaign.name}
              platform={successDialogData.campaign.platform}
              campaignCode={successDialogData.campaign.campaignCode}
              trackingUrl={successDialogData.trackingUrl}
            />
          )}

          <CampaignDialog
            open={isCampaignDialogOpen}
            onOpenChange={setIsCampaignDialogOpen}
            campaign={campaignToEdit}
            platforms={platforms}
            jobs={allJobPosts}
          />

          <LinkGeneratorDialog
            open={isLinkGenOpen}
            onOpenChange={setIsLinkGenOpen}
            campaigns={campaigns}
            jobs={allJobPosts}
            defaultCampaign={selectedCampaignForLink}
          />

          <CampaignDetailDrawer
            open={isDetailDrawerOpen}
            onOpenChange={setIsDetailDrawerOpen}
            campaign={selectedCampaignForDetail}
            jobs={allJobPosts}
            onEditCampaign={(camp) => {
              setIsDetailDrawerOpen(false);
              handleOpenEdit(camp);
            }}
          />
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
