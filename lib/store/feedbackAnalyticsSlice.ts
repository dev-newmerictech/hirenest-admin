import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { feedbackApi, FeedbackMetrics, FeedbackInsights, FeedbackItem } from '../api/feedback';

interface FeedbackAnalyticsState {
  metrics: FeedbackMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
  
  insights: FeedbackInsights | null;
  insightsLoading: boolean;
  insightsGenerating: boolean;
  insightsError: string | null;
  insufficientDataMsg: string | null;
  
  list: FeedbackItem[];
  listLoading: boolean;
  listError: string | null;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  filters: {
    featureKey?: string;
    sentiment?: string;
    profileType?: string;
  };
}

const initialState: FeedbackAnalyticsState = {
  metrics: null,
  metricsLoading: false,
  metricsError: null,
  
  insights: null,
  insightsLoading: false,
  insightsGenerating: false,
  insightsError: null,
  insufficientDataMsg: null,
  
  list: [],
  listLoading: false,
  listError: null,
  pagination: {
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1
  },
  filters: {}
};

export const fetchMetrics = createAsyncThunk(
  'feedbackAnalytics/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await feedbackApi.getMetrics();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch metrics');
    }
  }
);

export const fetchInsights = createAsyncThunk(
  'feedbackAnalytics/fetchInsights',
  async (_, { rejectWithValue }) => {
    try {
      const response = await feedbackApi.getInsights();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch insights');
    }
  }
);

export const triggerGenerateInsights = createAsyncThunk(
  'feedbackAnalytics/generateInsights',
  async (_, { rejectWithValue }) => {
    try {
      const response = await feedbackApi.generateInsights();
      if (response.status === 'insufficient_data') {
        return { status: 'insufficient_data', message: response.message, data: null };
      }
      return { status: 'success', data: response.data, message: null };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate insights');
    }
  }
);

export const fetchFeedbackList = createAsyncThunk(
  'feedbackAnalytics/fetchFeedbackList',
  async (params: { page?: number; limit?: number; featureKey?: string; sentiment?: string; profileType?: string } | void, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const currentFilters = state.feedbackAnalytics.filters;
      const currentPage = state.feedbackAnalytics.pagination.page;
      const currentLimit = state.feedbackAnalytics.pagination.limit;
      
      const queryParams = {
        page: params?.page || currentPage,
        limit: params?.limit || currentLimit,
        featureKey: params?.featureKey !== undefined ? params.featureKey : currentFilters.featureKey,
        sentiment: params?.sentiment !== undefined ? params.sentiment : currentFilters.sentiment,
        profileType: params?.profileType !== undefined ? params.profileType : currentFilters.profileType,
      };
      
      const response = await feedbackApi.listFeedback(queryParams);
      return { ...response, filters: {
        featureKey: queryParams.featureKey,
        sentiment: queryParams.sentiment,
        profileType: queryParams.profileType
      }};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch feedback list');
    }
  }
);

const feedbackAnalyticsSlice = createSlice({
  name: 'feedbackAnalytics',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<{ featureKey?: string; sentiment?: string; profileType?: string }>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to page 1 on filter change
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Metrics
    builder.addCase(fetchMetrics.pending, (state) => {
      state.metricsLoading = true;
      state.metricsError = null;
    });
    builder.addCase(fetchMetrics.fulfilled, (state, action) => {
      state.metricsLoading = false;
      state.metrics = action.payload;
    });
    builder.addCase(fetchMetrics.rejected, (state, action) => {
      state.metricsLoading = false;
      state.metricsError = action.payload as string;
    });

    // Fetch Insights
    builder.addCase(fetchInsights.pending, (state) => {
      state.insightsLoading = true;
      state.insightsError = null;
    });
    builder.addCase(fetchInsights.fulfilled, (state, action) => {
      state.insightsLoading = false;
      state.insights = action.payload;
    });
    builder.addCase(fetchInsights.rejected, (state, action) => {
      state.insightsLoading = false;
      state.insightsError = action.payload as string;
    });

    // Generate Insights
    builder.addCase(triggerGenerateInsights.pending, (state) => {
      state.insightsGenerating = true;
      state.insightsError = null;
      state.insufficientDataMsg = null;
    });
    builder.addCase(triggerGenerateInsights.fulfilled, (state, action: any) => {
      state.insightsGenerating = false;
      if (action.payload.status === 'insufficient_data') {
        state.insufficientDataMsg = action.payload.message;
      } else if (action.payload.data) {
        state.insights = action.payload.data;
      }
    });
    builder.addCase(triggerGenerateInsights.rejected, (state, action) => {
      state.insightsGenerating = false;
      state.insightsError = action.payload as string;
    });

    // List
    builder.addCase(fetchFeedbackList.pending, (state) => {
      state.listLoading = true;
      state.listError = null;
    });
    builder.addCase(fetchFeedbackList.fulfilled, (state, action) => {
      state.listLoading = false;
      state.list = action.payload.data;
      state.pagination = action.payload.pagination;
      if (action.payload.filters) {
        state.filters = action.payload.filters;
      }
    });
    builder.addCase(fetchFeedbackList.rejected, (state, action) => {
      state.listLoading = false;
      state.listError = action.payload as string;
    });
  }
});

export const { setFilters, setPage } = feedbackAnalyticsSlice.actions;
export default feedbackAnalyticsSlice.reducer;
