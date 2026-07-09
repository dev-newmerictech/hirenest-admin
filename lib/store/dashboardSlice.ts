// Redux slice for dashboard state management

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dashboardApi, JobSeekersCountResponse, DashboardAnalyticsResponse, AnalyticsDataPoint } from '../api/dashboard';

interface DashboardState {
  totalJobSeekers: number;
  totalJobProviders: number;
  totalJobs: number;
  totalApplications: number;
  totalUsers: number;
  analytics: {
    jobSeekers: AnalyticsDataPoint[];
    companies: AnalyticsDataPoint[];
    jobs: AnalyticsDataPoint[];
    notOnboarded: AnalyticsDataPoint[];
  };
  isStatsLoading: boolean;
  isAnalyticsLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: DashboardState = {
  totalJobSeekers: 0,
  totalJobProviders: 0,
  totalJobs: 0,
  totalApplications: 0,
  totalUsers: 0,
  analytics: {
    jobSeekers: [],
    companies: [],
    jobs: [],
    notOnboarded: [],
  },
  isStatsLoading: false,
  isAnalyticsLoading: false,
  error: null,
};

// Async thunk for fetching job seekers count
export const fetchJobSeekersCount = createAsyncThunk<
  JobSeekersCountResponse,
  void,
  { rejectValue: string }
>(
  'dashboard/fetchJobSeekersCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getJobSeekersCount();
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch job seekers count'
      );
    }
  }
);

export const fetchDashboardAnalytics = createAsyncThunk<
  DashboardAnalyticsResponse,
  string | undefined,
  { rejectValue: string }
>(
  'dashboard/fetchDashboardAnalytics',
  async (range = '7d', { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getDashboardAnalytics(range);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch dashboard analytics'
      );
    }
  }
);

// Create the dashboard slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset dashboard state
    resetDashboard: (state) => {
      state.totalJobSeekers = 0;
      state.totalJobProviders = 0;
      state.totalJobs = 0;
      state.totalApplications = 0;
      state.totalUsers = 0;
      state.isStatsLoading = false;
      state.isAnalyticsLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
    // Fetch job seekers count - pending
      .addCase(fetchJobSeekersCount.pending, (state) => {
        state.isStatsLoading = true;
        state.error = null;
      })
      // Fetch job seekers count - fulfilled
      .addCase(fetchJobSeekersCount.fulfilled, (state, action: PayloadAction<JobSeekersCountResponse>) => {
        state.isStatsLoading = false;
        // Extract data from the response
        state.totalJobSeekers = action.payload.data.totalJobSeekers;
        state.totalJobProviders = action.payload.data.totalJobProviders;
        state.totalJobs = action.payload.data.totalJobs;
        state.totalApplications = action.payload.data.totalApplications;
        state.totalUsers = action.payload.data.totalUsers;
        state.error = null;
      })
      // Fetch job seekers count - rejected
      .addCase(fetchJobSeekersCount.rejected, (state, action) => {
        state.isStatsLoading = false;
        state.error = action.payload || 'Failed to fetch dashboard stats';
      })
      // Fetch dashboard analytics
      .addCase(fetchDashboardAnalytics.pending, (state) => {
        state.isAnalyticsLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardAnalytics.fulfilled, (state, action: PayloadAction<DashboardAnalyticsResponse>) => {
        state.isAnalyticsLoading = false;
        state.analytics = action.payload.data;
        state.error = null;
      })
      .addCase(fetchDashboardAnalytics.rejected, (state, action) => {
        state.isAnalyticsLoading = false;
        state.error = action.payload || 'Failed to fetch dashboard analytics';
      });
  },
});

export const { clearError, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;

