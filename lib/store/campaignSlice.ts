// Redux slice for marketing & campaigns state management

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  campaignsApi,
  Campaign,
  PlatformSetting,
  GlobalDashboardSummary,
  CampaignAnalytics,
  CreateCampaignDTO,
  UpdateCampaignDTO,
  BindJobDTO,
  GenerateLinkDTO,
  IGlobalAnalyticsOverviewResponse,
  IAnalyticsOverviewFilters,
  IAttributedApplicantItem,
  IAttributedApplicantsResponse,
  IAttributedApplicantsFilters,
} from "../api/campaigns";

interface CampaignState {
  summary: GlobalDashboardSummary | null;
  platforms: PlatformSetting[];
  campaigns: Campaign[];
  allCampaigns: Campaign[];
  selectedCampaign: Campaign | null;
  selectedCampaignAnalytics: CampaignAnalytics | null;
  analyticsOverview: IGlobalAnalyticsOverviewResponse | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoadingSummary: boolean;
  isLoadingPlatforms: boolean;
  isLoadingCampaigns: boolean;
  isLoadingDetail: boolean;
  isLoadingAnalytics: boolean;
  isLoadingAnalyticsOverview: boolean;
  isGeneratingLink: boolean;
  isMutating: boolean;
  error: string | null;
  searchQuery: string;
  filterPlatform: string;
  filterStatus: string;
  analyticsFilters: IAnalyticsOverviewFilters;
  activeTab: "campaigns" | "analytics";
  generatedTrackingLink: string | null;
  attributedApplicants: IAttributedApplicantItem[];
  attributedApplicantsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  attributedApplicantsSummary: {
    totalAttributed: number;
    fastTrackCount: number;
    standardCount: number;
  } | null;
  isLoadingAttributedApplicants: boolean;
  applicantFilters: IAttributedApplicantsFilters;
}

const initialState: CampaignState = {
  summary: null,
  platforms: [],
  campaigns: [],
  allCampaigns: [],
  selectedCampaign: null,
  selectedCampaignAnalytics: null,
  analyticsOverview: null,
  pagination: null,
  isLoadingSummary: false,
  isLoadingPlatforms: false,
  isLoadingCampaigns: false,
  isLoadingDetail: false,
  isLoadingAnalytics: false,
  isLoadingAnalyticsOverview: false,
  isGeneratingLink: false,
  isMutating: false,
  error: null,
  searchQuery: "",
  filterPlatform: "all",
  filterStatus: "all",
  analyticsFilters: {
    platform: "all",
    status: "all",
    jobPostId: "all",
  },
  activeTab: "campaigns",
  generatedTrackingLink: null,
  attributedApplicants: [],
  attributedApplicantsPagination: null,
  attributedApplicantsSummary: null,
  isLoadingAttributedApplicants: false,
  applicantFilters: {
    page: 1,
    limit: 10,
    campaignCode: "all",
    platform: "all",
    status: "all",
    search: "",
  },
};

// Async thunks
export const fetchCampaignSummary = createAsyncThunk<
  GlobalDashboardSummary,
  void,
  { rejectValue: string }
>("campaigns/fetchSummary", async (_, { rejectWithValue }) => {
  try {
    return await campaignsApi.getSummary();
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Failed to fetch campaign summary",
    );
  }
});

export const fetchPlatforms = createAsyncThunk<
  PlatformSetting[],
  void,
  { rejectValue: string }
>("campaigns/fetchPlatforms", async (_, { rejectWithValue }) => {
  try {
    return await campaignsApi.listPlatforms();
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Failed to fetch platform settings",
    );
  }
});

export const togglePlatformThunk = createAsyncThunk<
  PlatformSetting,
  string,
  { rejectValue: string }
>("campaigns/togglePlatform", async (platform, { rejectWithValue }) => {
  try {
    return await campaignsApi.togglePlatform(platform);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : `Failed to toggle platform ${platform}`,
    );
  }
});

export const createPlatformThunk = createAsyncThunk<
  PlatformSetting,
  { platform: string; displayName?: string },
  { rejectValue: string }
>(
  "campaigns/createPlatform",
  async ({ platform, displayName }, { rejectWithValue }) => {
    try {
      return await campaignsApi.createPlatform(platform, displayName);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to create platform setting",
      );
    }
  },
);

export const fetchCampaigns = createAsyncThunk<
  {
    items: Campaign[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  },
  {
    page?: number;
    limit?: number;
    platform?: string;
    status?: string;
    search?: string;
  } | void,
  { rejectValue: string }
>("campaigns/fetchCampaigns", async (params, { rejectWithValue }) => {
  try {
    const page = params && "page" in params ? params.page : 1;
    const limit = params && "limit" in params ? params.limit : 10;
    const platform =
      params && "platform" in params ? params.platform : undefined;
    const status = params && "status" in params ? params.status : undefined;
    const search = params && "search" in params ? params.search : undefined;

    return await campaignsApi.listCampaigns({
      page,
      limit,
      platform,
      status,
      search,
    });
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to fetch campaigns list",
    );
  }
});

export const fetchAllCampaigns = createAsyncThunk<
  Campaign[],
  void,
  { rejectValue: string }
>("campaigns/fetchAllCampaigns", async (_, { rejectWithValue }) => {
  try {
    const res = await campaignsApi.listCampaigns({ page: 1, limit: 100 });
    return res.items || [];
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to fetch all campaigns",
    );
  }
});

export const fetchCampaign = createAsyncThunk<
  Campaign,
  string,
  { rejectValue: string }
>("campaigns/fetchCampaign", async (id, { rejectWithValue }) => {
  try {
    return await campaignsApi.getCampaign(id);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Failed to fetch campaign detail",
    );
  }
});

export const createCampaignThunk = createAsyncThunk<
  Campaign,
  CreateCampaignDTO,
  { rejectValue: string }
>("campaigns/createCampaign", async (payload, { rejectWithValue }) => {
  try {
    return await campaignsApi.createCampaign(payload);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to create campaign",
    );
  }
});

export const updateCampaignThunk = createAsyncThunk<
  Campaign,
  { id: string; payload: UpdateCampaignDTO },
  { rejectValue: string }
>("campaigns/updateCampaign", async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await campaignsApi.updateCampaign(id, payload);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to update campaign",
    );
  }
});

export const bindJobThunk = createAsyncThunk<
  Campaign,
  { campaignId: string; payload: BindJobDTO },
  { rejectValue: string }
>("campaigns/bindJob", async ({ campaignId, payload }, { rejectWithValue }) => {
  try {
    return await campaignsApi.bindJob(campaignId, payload);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to bind job to campaign",
    );
  }
});

export const toggleJobBindingThunk = createAsyncThunk<
  { campaignId: string; jobPostId: string; isActive: boolean },
  { campaignId: string; jobId: string },
  { rejectValue: string }
>(
  "campaigns/toggleJobBinding",
  async ({ campaignId, jobId }, { rejectWithValue }) => {
    try {
      const res = await campaignsApi.toggleJobBinding(campaignId, jobId);
      return { campaignId, jobPostId: res.jobPostId, isActive: res.isActive };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to toggle job binding",
      );
    }
  },
);

export const generateTrackingLinkThunk = createAsyncThunk<
  {
    trackingUrl: string;
    platform: string;
    campaignCode: string;
    jobId: string;
  },
  GenerateLinkDTO,
  { rejectValue: string }
>("campaigns/generateTrackingLink", async (payload, { rejectWithValue }) => {
  try {
    return await campaignsApi.generateTrackingLink(payload);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Failed to generate tracking link",
    );
  }
});

export const fetchCampaignAnalyticsThunk = createAsyncThunk<
  CampaignAnalytics,
  string,
  { rejectValue: string }
>("campaigns/fetchAnalytics", async (campaignId, { rejectWithValue }) => {
  try {
    return await campaignsApi.getCampaignAnalytics(campaignId);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Failed to fetch campaign analytics",
    );
  }
});

export const fetchAnalyticsOverview = createAsyncThunk<
  IGlobalAnalyticsOverviewResponse,
  IAnalyticsOverviewFilters | undefined,
  { rejectValue: string }
>("campaigns/fetchAnalyticsOverview", async (filters, { rejectWithValue }) => {
  try {
    return await campaignsApi.getAnalyticsOverview(filters);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Failed to fetch analytics overview",
    );
  }
});

export const fetchAttributedApplicants = createAsyncThunk<
  IAttributedApplicantsResponse,
  IAttributedApplicantsFilters | undefined,
  { rejectValue: string }
>(
  "campaigns/fetchAttributedApplicants",
  async (filters, { rejectWithValue }) => {
    try {
      return await campaignsApi.getAttributedApplicants(filters);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch attributed candidates",
      );
    }
  },
);

export const campaignSlice = createSlice({
  name: "campaigns",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilterPlatform: (state, action: PayloadAction<string>) => {
      state.filterPlatform = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<string>) => {
      state.filterStatus = action.payload;
    },
    setAnalyticsFilters: (
      state,
      action: PayloadAction<Partial<IAnalyticsOverviewFilters>>,
    ) => {
      state.analyticsFilters = { ...state.analyticsFilters, ...action.payload };
    },
    setActiveTab: (state, action: PayloadAction<"campaigns" | "analytics">) => {
      state.activeTab = action.payload;
    },
    setSelectedCampaign: (state, action: PayloadAction<Campaign | null>) => {
      state.selectedCampaign = action.payload;
    },
    clearSelectedCampaign: (state) => {
      state.selectedCampaign = null;
      state.selectedCampaignAnalytics = null;
    },
    clearGeneratedLink: (state) => {
      state.generatedTrackingLink = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setApplicantFilters: (
      state,
      action: PayloadAction<Partial<IAttributedApplicantsFilters>>,
    ) => {
      state.applicantFilters = {
        ...state.applicantFilters,
        ...action.payload,
        page: action.payload.page ?? 1,
      };
    },
    setApplicantPage: (state, action: PayloadAction<number>) => {
      state.applicantFilters.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Summary
    builder
      .addCase(fetchCampaignSummary.pending, (state) => {
        state.isLoadingSummary = true;
        state.error = null;
      })
      .addCase(fetchCampaignSummary.fulfilled, (state, action) => {
        state.isLoadingSummary = false;
        state.summary = action.payload;
      })
      .addCase(fetchCampaignSummary.rejected, (state, action) => {
        state.isLoadingSummary = false;
        state.error = action.payload || "Failed to fetch summary";
      });

    // Platforms
    builder
      .addCase(fetchPlatforms.pending, (state) => {
        state.isLoadingPlatforms = true;
        state.error = null;
      })
      .addCase(fetchPlatforms.fulfilled, (state, action) => {
        state.isLoadingPlatforms = false;
        state.platforms = action.payload;
      })
      .addCase(fetchPlatforms.rejected, (state, action) => {
        state.isLoadingPlatforms = false;
        state.error = action.payload || "Failed to fetch platforms";
      })
      .addCase(togglePlatformThunk.fulfilled, (state, action) => {
        const index = state.platforms.findIndex(
          (p) => p.platform === action.payload.platform,
        );
        if (index !== -1) {
          state.platforms[index] = action.payload;
        } else {
          state.platforms.push(action.payload);
        }
      })
      .addCase(createPlatformThunk.fulfilled, (state, action) => {
        const index = state.platforms.findIndex(
          (p) => p.platform === action.payload.platform,
        );
        if (index !== -1) {
          state.platforms[index] = action.payload;
        } else {
          state.platforms.push(action.payload);
        }
      });

    // Campaigns list
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.isLoadingCampaigns = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.isLoadingCampaigns = false;
        state.campaigns = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.isLoadingCampaigns = false;
        state.error = action.payload || "Failed to fetch campaigns";
      })
      .addCase(fetchAllCampaigns.fulfilled, (state, action) => {
        state.allCampaigns = action.payload;
      });

    // Single campaign
    builder
      .addCase(fetchCampaign.pending, (state) => {
        state.isLoadingDetail = true;
        state.error = null;
      })
      .addCase(fetchCampaign.fulfilled, (state, action) => {
        state.isLoadingDetail = false;
        state.selectedCampaign = action.payload;
      })
      .addCase(fetchCampaign.rejected, (state, action) => {
        state.isLoadingDetail = false;
        state.error = action.payload || "Failed to fetch campaign";
      });

    // Create Campaign
    builder
      .addCase(createCampaignThunk.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(createCampaignThunk.fulfilled, (state, action) => {
        state.isMutating = false;
        state.campaigns.unshift(action.payload);
      })
      .addCase(createCampaignThunk.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload || "Failed to create campaign";
      });

    // Update Campaign
    builder
      .addCase(updateCampaignThunk.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(updateCampaignThunk.fulfilled, (state, action) => {
        state.isMutating = false;
        const index = state.campaigns.findIndex(
          (c) => c.id === action.payload.id,
        );
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
        if (state.selectedCampaign?.id === action.payload.id) {
          state.selectedCampaign = action.payload;
        }
      })
      .addCase(updateCampaignThunk.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload || "Failed to update campaign";
      });

    // Bind Job
    builder
      .addCase(bindJobThunk.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(bindJobThunk.fulfilled, (state, action) => {
        state.isMutating = false;
        const index = state.campaigns.findIndex(
          (c) => c.id === action.payload.id,
        );
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
        if (state.selectedCampaign?.id === action.payload.id) {
          state.selectedCampaign = action.payload;
        }
      })
      .addCase(bindJobThunk.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload || "Failed to bind job";
      });

    // Toggle Job Binding
    builder.addCase(toggleJobBindingThunk.fulfilled, (state, action) => {
      const { campaignId, jobPostId, isActive } = action.payload;
      const targetCamp = state.campaigns.find((c) => c.id === campaignId);
      if (targetCamp) {
        const binding = targetCamp.jobBindings.find((b) => {
          const id =
            typeof b.jobPostId === "string" ? b.jobPostId : b.jobPostId?._id;
          return id === jobPostId;
        });
        if (binding) binding.isActive = isActive;
      }
      if (state.selectedCampaign?.id === campaignId) {
        const binding = state.selectedCampaign.jobBindings.find((b) => {
          const id =
            typeof b.jobPostId === "string" ? b.jobPostId : b.jobPostId?._id;
          return id === jobPostId;
        });
        if (binding) binding.isActive = isActive;
      }
    });

    // Generate Tracking Link
    builder
      .addCase(generateTrackingLinkThunk.pending, (state) => {
        state.isGeneratingLink = true;
        state.error = null;
      })
      .addCase(generateTrackingLinkThunk.fulfilled, (state, action) => {
        state.isGeneratingLink = false;
        state.generatedTrackingLink = action.payload.trackingUrl;
      })
      .addCase(generateTrackingLinkThunk.rejected, (state, action) => {
        state.isGeneratingLink = false;
        state.error = action.payload || "Failed to generate link";
      });

    // Analytics
    builder
      .addCase(fetchCampaignAnalyticsThunk.pending, (state) => {
        state.isLoadingAnalytics = true;
      })
      .addCase(fetchCampaignAnalyticsThunk.fulfilled, (state, action) => {
        state.isLoadingAnalytics = false;
        state.selectedCampaignAnalytics = action.payload;
      })
      .addCase(fetchCampaignAnalyticsThunk.rejected, (state, action) => {
        state.isLoadingAnalytics = false;
        state.error = action.payload || "Failed to fetch analytics";
      });

    // Analytics Overview
    builder
      .addCase(fetchAnalyticsOverview.pending, (state) => {
        state.isLoadingAnalyticsOverview = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsOverview.fulfilled, (state, action) => {
        state.isLoadingAnalyticsOverview = false;
        state.analyticsOverview = action.payload;
      })
      .addCase(fetchAnalyticsOverview.rejected, (state, action) => {
        state.isLoadingAnalyticsOverview = false;
        state.error = action.payload || "Failed to fetch analytics overview";
      });

    // Attributed Applicants
    builder
      .addCase(fetchAttributedApplicants.pending, (state) => {
        state.isLoadingAttributedApplicants = true;
        state.error = null;
      })
      .addCase(fetchAttributedApplicants.fulfilled, (state, action) => {
        state.isLoadingAttributedApplicants = false;
        state.attributedApplicants = action.payload.applicants;
        state.attributedApplicantsPagination = action.payload.pagination;
        state.attributedApplicantsSummary = action.payload.summary;
      })
      .addCase(fetchAttributedApplicants.rejected, (state, action) => {
        state.isLoadingAttributedApplicants = false;
        state.error = action.payload || "Failed to fetch attributed candidates";
      });
  },
});

export const {
  setSearchQuery,
  setFilterPlatform,
  setFilterStatus,
  setAnalyticsFilters,
  setActiveTab,
  setSelectedCampaign,
  clearSelectedCampaign,
  clearGeneratedLink,
  clearError,
  setApplicantFilters,
  setApplicantPage,
} = campaignSlice.actions;

export default campaignSlice.reducer;
