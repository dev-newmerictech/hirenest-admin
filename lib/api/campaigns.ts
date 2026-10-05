import { apiClient } from "./client";

export type CampaignStatus = "active" | "paused" | "expired" | "unverified";

export interface IJobBinding {
  jobPostId:
    | string
    | { _id: string; title?: string; jobStatus?: string; isActive?: boolean };
  isActive: boolean;
  generatedUrl: string;
  deactivatedAt?: string | null;
}

export interface Campaign {
  id: string;
  campaignCode: string;
  name: string;
  platform: string;
  status: CampaignStatus;
  patterns: string[];
  jobBindings: IJobBinding[];
  companyId?: string;
  startDate: string;
  endDate?: string;
  impressionsCount: number;
  leadsCount: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSetting {
  id: string;
  platform: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalDashboardSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalLeads: number;
  totalApplications: number;
  platformBreakdown: Array<{
    platform: string;
    campaignsCount: number;
    impressionsCount: number;
    leadsCount: number;
    applicationsCount: number;
  }>;
}

export interface CampaignAnalytics {
  campaignId: string;
  campaignCode: string;
  platform: string;
  impressions: number;
  leads: number;
  applications: number;
  leadConversionRate: number;
  applicationConversionRate: number;
  activeJobBindings: number;
  dailyFunnelTrends?: Array<{
    date: string;
    impressions: number;
    leads: number;
    applications: number;
  }>;
}

export interface CreateCampaignDTO {
  name: string;
  platform: string;
  campaignCode?: string;
  jobPostIds?: string[];
  patterns?: string[];
  startDate?: string;
  endDate?: string;
}

export interface UpdateCampaignDTO {
  name?: string;
  status?: CampaignStatus;
  patterns?: string[];
  endDate?: string;
}

export interface BindJobDTO {
  jobPostId: string;
  isActive?: boolean;
  customBaseUrl?: string;
}

export interface GenerateLinkDTO {
  platform: string;
  campaignCode: string;
  jobId: string;
  baseUrl?: string;
  utmMedium?: string;
  utmContent?: string;
}

export const campaignsApi = {
  getSummary: async (): Promise<GlobalDashboardSummary> => {
    const res = await apiClient<{
      success: boolean;
      data: GlobalDashboardSummary;
    }>("/api/v2/campaigns/admin/dashboard/summary");
    return res.data;
  },

  listPlatforms: async (): Promise<PlatformSetting[]> => {
    const res = await apiClient<{ success: boolean; data: PlatformSetting[] }>(
      "/api/v2/campaigns/admin/platforms",
    );
    return res.data;
  },

  togglePlatform: async (platform: string): Promise<PlatformSetting> => {
    const res = await apiClient<{ success: boolean; data: PlatformSetting }>(
      `/api/v2/campaigns/admin/platforms/${platform}/toggle`,
      { method: "PUT" },
    );
    return res.data;
  },

  createPlatform: async (
    platform: string,
    displayName?: string,
  ): Promise<PlatformSetting> => {
    const res = await apiClient<{ success: boolean; data: PlatformSetting }>(
      "/api/v2/campaigns/admin/platforms",
      {
        method: "POST",
        body: JSON.stringify({ platform, displayName }),
      },
    );
    return res.data;
  },

  listCampaigns: async (params?: {
    page?: number;
    limit?: number;
    platform?: string;
    status?: string;
    search?: string;
  }): Promise<{
    items: Campaign[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.platform && params.platform !== "all")
      query.set("platform", params.platform);
    if (params?.status && params.status !== "all")
      query.set("status", params.status);
    if (params?.search) query.set("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient<{
      success: boolean;
      data: {
        items: Campaign[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/api/v2/campaigns/admin${queryString}`);
    return res.data;
  },

  getCampaign: async (id: string): Promise<Campaign> => {
    const res = await apiClient<{ success: boolean; data: Campaign }>(
      `/api/v2/campaigns/admin/${id}`,
    );
    return res.data;
  },

  createCampaign: async (payload: CreateCampaignDTO): Promise<Campaign> => {
    const res = await apiClient<{ success: boolean; data: Campaign }>(
      "/api/v2/campaigns/admin",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    return res.data;
  },

  updateCampaign: async (
    id: string,
    payload: UpdateCampaignDTO,
  ): Promise<Campaign> => {
    const res = await apiClient<{ success: boolean; data: Campaign }>(
      `/api/v2/campaigns/admin/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return res.data;
  },

  bindJob: async (
    campaignId: string,
    payload: BindJobDTO,
  ): Promise<Campaign> => {
    const res = await apiClient<{ success: boolean; data: Campaign }>(
      `/api/v2/campaigns/admin/${campaignId}/bind-job`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    return res.data;
  },

  toggleJobBinding: async (
    campaignId: string,
    jobId: string,
  ): Promise<{ jobPostId: string; isActive: boolean }> => {
    const res = await apiClient<{
      success: boolean;
      data: { jobPostId: string; isActive: boolean };
    }>(`/api/v2/campaigns/admin/${campaignId}/jobs/${jobId}/toggle`, {
      method: "PATCH",
    });
    return res.data;
  },

  generateTrackingLink: async (
    payload: GenerateLinkDTO,
  ): Promise<{
    trackingUrl: string;
    platform: string;
    campaignCode: string;
    jobId: string;
  }> => {
    const res = await apiClient<{
      success: boolean;
      data: {
        trackingUrl: string;
        platform: string;
        campaignCode: string;
        jobId: string;
      };
    }>("/api/v2/campaigns/admin/generate-link", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  getCampaignAnalytics: async (
    campaignId: string,
  ): Promise<CampaignAnalytics> => {
    const res = await apiClient<{ success: boolean; data: CampaignAnalytics }>(
      `/api/v2/campaigns/admin/${campaignId}/analytics`,
    );
    return res.data;
  },
};
