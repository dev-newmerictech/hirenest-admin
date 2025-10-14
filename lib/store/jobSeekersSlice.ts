// Redux slice for job seekers state management

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  jobSeekersApi, 
  JobSeekersListResponse, 
  JobSeekerDetailResponse,
  transformJobSeeker 
} from '../api/jobSeekers';
import { JobSeeker } from '../types';

interface JobSeekersState {
  jobSeekers: JobSeeker[];
  selectedJobSeeker: JobSeeker | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
  isLoading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  searchQuery: string;
}

// Initial state
const initialState: JobSeekersState = {
  jobSeekers: [],
  selectedJobSeeker: null,
  pagination: null,
  isLoading: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  searchQuery: '',
};

// Async thunk for fetching all job seekers
export const fetchAllJobSeekers = createAsyncThunk<
  JobSeekersListResponse,
  { page?: number; limit?: number } | void,
  { rejectValue: string }
>(
  'jobSeekers/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const page = params && 'page' in params ? params.page : 1;
      const limit = params && 'limit' in params ? params.limit : 10;
      const response = await jobSeekersApi.getAllJobSeekers(page, limit);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch job seekers'
      );
    }
  }
);

// Async thunk for searching job seekers
export const searchJobSeekers = createAsyncThunk<
  JobSeekersListResponse,
  string,
  { rejectValue: string }
>(
  'jobSeekers/search',
  async (query, { rejectWithValue }) => {
    try {
      const response = await jobSeekersApi.searchJobSeekers(query);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to search job seekers'
      );
    }
  }
);

// Async thunk for fetching job seeker profile
export const fetchJobSeekerProfile = createAsyncThunk<
  JobSeekerDetailResponse,
  string,
  { rejectValue: string }
>(
  'jobSeekers/fetchProfile',
  async (id, { rejectWithValue }) => {
    try {
      const response = await jobSeekersApi.getJobSeekerProfile(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch job seeker profile'
      );
    }
  }
);

// Async thunk for toggling job seeker status
export const toggleJobSeekerStatus = createAsyncThunk<
  JobSeekerDetailResponse,
  { id: string; isActive: boolean },
  { rejectValue: string }
>(
  'jobSeekers/toggleStatus',
  async ({ id, isActive }, { rejectWithValue, dispatch }) => {
    try {
      const response = await jobSeekersApi.toggleJobSeekerStatus(id, isActive);
      // Refetch all job seekers after successful toggle
      dispatch(fetchAllJobSeekers());
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to toggle status'
      );
    }
  }
);

// Async thunk for updating job seeker
export const updateJobSeeker = createAsyncThunk<
  JobSeekerDetailResponse,
  { id: string; data: { name?: string; email?: string; phone?: string } },
  { rejectValue: string }
>(
  'jobSeekers/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await jobSeekersApi.updateJobSeeker(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update job seeker'
      );
    }
  }
);

// Async thunk for deleting job seeker
export const deleteJobSeeker = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'jobSeekers/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await jobSeekersApi.deleteJobSeeker(id);
      // Refetch all job seekers after successful delete
      dispatch(fetchAllJobSeekers());
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete job seeker'
      );
    }
  }
);

// Create the job seekers slice
const jobSeekersSlice = createSlice({
  name: 'jobSeekers',
  initialState,
  reducers: {
    // Set search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Clear selected job seeker
    clearSelectedJobSeeker: (state) => {
      state.selectedJobSeeker = null;
    },
    
    // Reset job seekers state
    resetJobSeekers: (state) => {
      state.jobSeekers = [];
      state.selectedJobSeeker = null;
      state.pagination = null;
      state.isLoading = false;
      state.isUpdating = false;
      state.isDeleting = false;
      state.error = null;
      state.searchQuery = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all job seekers
      .addCase(fetchAllJobSeekers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllJobSeekers.fulfilled, (state, action: PayloadAction<JobSeekersListResponse>) => {
        state.isLoading = false;
        // Transform API response to internal format
        state.jobSeekers = action.payload.data.jobSeekers.map(transformJobSeeker);
        state.pagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(fetchAllJobSeekers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch job seekers';
      })
      
      // Search job seekers
      .addCase(searchJobSeekers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchJobSeekers.fulfilled, (state, action: PayloadAction<JobSeekersListResponse>) => {
        state.isLoading = false;
        // Transform API response to internal format
        state.jobSeekers = action.payload.data.jobSeekers.map(transformJobSeeker);
        state.pagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(searchJobSeekers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to search job seekers';
      })
      
      // Fetch job seeker profile
      .addCase(fetchJobSeekerProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobSeekerProfile.fulfilled, (state, action: PayloadAction<JobSeekerDetailResponse>) => {
        state.isLoading = false;
        state.selectedJobSeeker = transformJobSeeker(action.payload.data);
        state.error = null;
      })
      .addCase(fetchJobSeekerProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch job seeker profile';
      })
      
      // Toggle status
      .addCase(toggleJobSeekerStatus.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(toggleJobSeekerStatus.fulfilled, (state, action: PayloadAction<JobSeekerDetailResponse>) => {
        state.isUpdating = false;
        const transformedJobSeeker = transformJobSeeker(action.payload.data);
        // Update in the list
        const index = state.jobSeekers.findIndex(js => js.id === transformedJobSeeker.id);
        if (index !== -1) {
          state.jobSeekers[index] = transformedJobSeeker;
        }
        // Update selected if it's the same one
        if (state.selectedJobSeeker?.id === transformedJobSeeker.id) {
          state.selectedJobSeeker = transformedJobSeeker;
        }
        state.error = null;
      })
      .addCase(toggleJobSeekerStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || 'Failed to toggle status';
      })
      
      // Update job seeker
      .addCase(updateJobSeeker.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateJobSeeker.fulfilled, (state, action: PayloadAction<JobSeekerDetailResponse>) => {
        state.isUpdating = false;
        const transformedJobSeeker = transformJobSeeker(action.payload.data);
        // Update in the list
        const index = state.jobSeekers.findIndex(js => js.id === transformedJobSeeker.id);
        if (index !== -1) {
          state.jobSeekers[index] = transformedJobSeeker;
        }
        state.selectedJobSeeker = transformedJobSeeker;
        state.error = null;
      })
      .addCase(updateJobSeeker.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || 'Failed to update job seeker';
      })
      
      // Delete job seeker
      .addCase(deleteJobSeeker.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteJobSeeker.fulfilled, (state, action: PayloadAction<string>) => {
        state.isDeleting = false;
        // Remove from the list
        state.jobSeekers = state.jobSeekers.filter(js => js.id !== action.payload);
        // Clear selected if it was the deleted one
        if (state.selectedJobSeeker?.id === action.payload) {
          state.selectedJobSeeker = null;
        }
        state.error = null;
      })
      .addCase(deleteJobSeeker.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload || 'Failed to delete job seeker';
      });
  },
});

export const { 
  setSearchQuery, 
  clearError, 
  clearSelectedJobSeeker, 
  resetJobSeekers 
} = jobSeekersSlice.actions;

export default jobSeekersSlice.reducer;

