// Redux slice for dashboard state management

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dashboardApi, JobSeekersCountResponse } from '../api/dashboard';

interface DashboardState {
  totalJobSeekers: number;
  totalJobProviders: number;
  totalJobs: number;
  totalApplications: number;
  totalUsers: number;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: DashboardState = {
  totalJobSeekers: 0,
  totalJobProviders: 0,
  totalJobs: 0,
  totalApplications: 0,
  totalUsers: 0,
  isLoading: false,
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
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch job seekers count - pending
      .addCase(fetchJobSeekersCount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Fetch job seekers count - fulfilled
      .addCase(fetchJobSeekersCount.fulfilled, (state, action: PayloadAction<JobSeekersCountResponse>) => {
        state.isLoading = false;
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
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch dashboard stats';
      })
  },
});

export const { clearError, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;

