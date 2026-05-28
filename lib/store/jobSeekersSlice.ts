// Redux slice for job seekers state management
// Data is fetched once from API, cached in IndexedDB, and paginated client-side

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  jobSeekersApi,
  JobSeekersListResponse,
  JobSeekerDetailResponse,
  transformJobSeeker,
  extractJobSeekerFromDetailResponse,
} from '../api/jobSeekers';
import { JobSeeker } from '../types';
import { getCachedData, setCachedData, CACHE_KEYS } from '../cache/adminCache';

interface JobSeekersState {
  allJobSeekers: JobSeeker[];     // ALL job seekers (from IndexedDB or API)
  selectedJobSeeker: JobSeeker | null;
  isLoading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  searchQuery: string;
  lastFetchedAt: number | null;   // timestamp of last sync
}

const initialState: JobSeekersState = {
  allJobSeekers: [],
  selectedJobSeeker: null,
  isLoading: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  searchQuery: '',
  lastFetchedAt: null,
};

// Load job seekers from IndexedDB cache
export const loadJobSeekersFromCache = createAsyncThunk<
  { jobSeekers: JobSeeker[]; timestamp: number } | null,
  void,
  { rejectValue: string }
>(
  'jobSeekers/loadFromCache',
  async (_, { rejectWithValue }) => {
    try {
      const cached = await getCachedData<JobSeeker[]>(
        CACHE_KEYS.jobSeekers,
        CACHE_KEYS.jobSeekersTime
      );
      return cached ? { jobSeekers: cached.data, timestamp: cached.timestamp } : null;
    } catch (error) {
      return rejectWithValue('Failed to load from cache');
    }
  }
);

// Fetch ALL job seekers from API and store in IndexedDB
export const fetchAllJobSeekers = createAsyncThunk<
  { jobSeekers: JobSeeker[]; timestamp: number },
  void,
  { rejectValue: string }
>(
  'jobSeekers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await jobSeekersApi.getAllJobSeekers(1, 100000);
      const jobSeekers = response.data.jobSeekers.map(transformJobSeeker);

      // Cache in IndexedDB
      await setCachedData(CACHE_KEYS.jobSeekers, CACHE_KEYS.jobSeekersTime, jobSeekers);

      return { jobSeekers, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch job seekers'
      );
    }
  }
);

// Sync job seekers incrementally from API
export const syncJobSeekers = createAsyncThunk<
  { jobSeekers: JobSeeker[]; timestamp: number },
  number,
  { rejectValue: string }
>(
  'jobSeekers/sync',
  async (lastFetchedAt, { rejectWithValue, getState }) => {
    try {
      // 1. Convert timestamp to ISO string for backend
      const since = new Date(lastFetchedAt).toISOString();
      
      // 2. Fetch delta from API
      const response = await jobSeekersApi.syncJobSeekers(since);
      
      const updatedApiRecords = response.data.updatedRecords;
      const deletedIds = response.data.deletedIds;

      // 3. Get current state from IndexedDB
      const cached = await getCachedData<JobSeeker[]>(
        CACHE_KEYS.jobSeekers,
        CACHE_KEYS.jobSeekersTime
      );
      
      let currentRecords = cached?.data || [];
      
      // 4. Remove deleted records
      currentRecords = currentRecords.filter(r => !deletedIds.includes(r.id));
      
      // 5. Upsert updated records
      const updatedRecords = updatedApiRecords.map(transformJobSeeker);
      for (const updated of updatedRecords) {
        const index = currentRecords.findIndex(r => r.id === updated.id);
        if (index !== -1) {
          currentRecords[index] = updated; // Update
        } else {
          currentRecords.unshift(updated); // Insert at top
        }
      }

      // 6. Sort just in case
      currentRecords.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());

      // 7. Save back to IndexedDB
      const newTimestamp = Date.now();
      await setCachedData(CACHE_KEYS.jobSeekers, CACHE_KEYS.jobSeekersTime, currentRecords, newTimestamp);

      return { jobSeekers: currentRecords, timestamp: newTimestamp };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to sync job seekers'
      );
    }
  }
);

// Fetch job seeker profile
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

// Toggle job seeker status
export const toggleJobSeekerStatus = createAsyncThunk<
  JobSeekerDetailResponse,
  { id: string; isActive: boolean },
  { rejectValue: string }
>(
  'jobSeekers/toggleStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await jobSeekersApi.toggleJobSeekerStatus(id, isActive);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to toggle status'
      );
    }
  }
);

// Update job seeker
export const updateJobSeeker = createAsyncThunk<
  JobSeekerDetailResponse,
  { id: string; data: { name?: string; email?: string } },
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

// Delete job seeker
export const deleteJobSeeker = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'jobSeekers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await jobSeekersApi.deleteJobSeeker(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete job seeker'
      );
    }
  }
);

const jobSeekersSlice = createSlice({
  name: 'jobSeekers',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedJobSeeker: (state) => {
      state.selectedJobSeeker = null;
    },
    resetJobSeekers: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Load from cache
      .addCase(loadJobSeekersFromCache.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadJobSeekersFromCache.fulfilled, (state, action) => {
        if (action.payload) {
          state.allJobSeekers = action.payload.jobSeekers;
          state.lastFetchedAt = action.payload.timestamp;
          state.isLoading = false;
        } else {
          // No cache — stay in loading state, caller will dispatch fetchAll
          state.isLoading = true;
        }
      })
      .addCase(loadJobSeekersFromCache.rejected, (state) => {
        state.isLoading = true; // stay loading, caller will fetch from API
      })

      // Fetch all from API
      .addCase(fetchAllJobSeekers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllJobSeekers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allJobSeekers = action.payload.jobSeekers;
        state.lastFetchedAt = action.payload.timestamp;
        state.error = null;
      })
      .addCase(fetchAllJobSeekers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch job seekers';
      })

      // Sync incrementally from API
      .addCase(syncJobSeekers.pending, (state) => {
        state.isLoading = true; // or isSyncing if you prefer a separate flag
        state.error = null;
      })
      .addCase(syncJobSeekers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allJobSeekers = action.payload.jobSeekers;
        state.lastFetchedAt = action.payload.timestamp;
        state.error = null;
      })
      .addCase(syncJobSeekers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to sync job seekers';
      })

      // Fetch profile
      .addCase(fetchJobSeekerProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobSeekerProfile.fulfilled, (state, action: PayloadAction<JobSeekerDetailResponse>) => {
        state.isLoading = false;
        const jobSeeker = extractJobSeekerFromDetailResponse(action.payload.data);
        state.selectedJobSeeker = transformJobSeeker(jobSeeker);
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
        const jobSeeker = extractJobSeekerFromDetailResponse(action.payload.data);
        const transformed = transformJobSeeker(jobSeeker);
        const index = state.allJobSeekers.findIndex(js => js.id === transformed.id);
        if (index !== -1) {
          state.allJobSeekers[index] = transformed;
        }
        if (state.selectedJobSeeker?.id === transformed.id) {
          state.selectedJobSeeker = transformed;
        }
        state.error = null;
      })
      .addCase(toggleJobSeekerStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || 'Failed to toggle status';
      })

      // Update
      .addCase(updateJobSeeker.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateJobSeeker.fulfilled, (state, action: PayloadAction<JobSeekerDetailResponse>) => {
        state.isUpdating = false;
        const jobSeeker = extractJobSeekerFromDetailResponse(action.payload.data);
        const transformed = transformJobSeeker(jobSeeker);
        const index = state.allJobSeekers.findIndex(js => js.id === transformed.id);
        if (index !== -1) {
          state.allJobSeekers[index] = transformed;
        }
        state.selectedJobSeeker = transformed;
        state.error = null;
      })
      .addCase(updateJobSeeker.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || 'Failed to update job seeker';
      })

      // Delete
      .addCase(deleteJobSeeker.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteJobSeeker.fulfilled, (state, action: PayloadAction<string>) => {
        state.isDeleting = false;
        state.allJobSeekers = state.allJobSeekers.filter(js => js.id !== action.payload);
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
  resetJobSeekers,
} = jobSeekersSlice.actions;

export default jobSeekersSlice.reducer;
