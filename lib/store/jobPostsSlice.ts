// Redux slice for job posts state management
// Data is fetched once from API, cached in IndexedDB, and paginated client-side

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  jobPostsApi, 
  JobPostsListResponse, 
  JobPostDetailResponse,
  transformJobPost 
} from '../api/jobPosts';
import { Job } from '../types';
import { getCachedData, setCachedData, CACHE_KEYS } from '../cache/adminCache';

interface JobPostsState {
  allJobPosts: Job[];             // ALL job posts (from IndexedDB or API)
  selectedJobPost: Job | null;
  isLoading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  filterStatus: 'all' | 'active' | 'closed';
  lastFetchedAt: number | null;   // timestamp of last sync
}

// Initial state
const initialState: JobPostsState = {
  allJobPosts: [],
  selectedJobPost: null,
  isLoading: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  filterStatus: 'all',
  lastFetchedAt: null,
};

// Load job posts from IndexedDB cache
export const loadJobPostsFromCache = createAsyncThunk<
  { jobPosts: Job[]; timestamp: number } | null,
  void,
  { rejectValue: string }
>(
  'jobPosts/loadFromCache',
  async (_, { rejectWithValue }) => {
    try {
      const cached = await getCachedData<Job[]>(
        CACHE_KEYS.jobPosts,
        CACHE_KEYS.jobPostsTime
      );
      return cached ? { jobPosts: cached.data, timestamp: cached.timestamp } : null;
    } catch (error) {
      return rejectWithValue('Failed to load from cache');
    }
  }
);

// Fetch ALL job posts from API and store in IndexedDB
export const fetchAllJobPosts = createAsyncThunk<
  { jobPosts: Job[]; timestamp: number },
  void,
  { rejectValue: string }
>(
  'jobPosts/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await jobPostsApi.getAllJobPosts(1, 100000);
      
      // Filter out invalid job posts and transform
      const validJobPosts = response.data.jobPosts.filter((jobPost) => {
        return jobPost && jobPost._id && Object.keys(jobPost).length > 0;
      });

      const jobPosts = validJobPosts.map((jobPost) => {
        try {
          return transformJobPost(jobPost);
        } catch (error) {
          console.error('Error transforming job post:', error, jobPost);
          // Return a fallback job object
          return {
            id: jobPost._id || 'unknown',
            title: jobPost.title || 'Unknown Job',
            companyId: typeof jobPost.company === 'string' ? jobPost.company : jobPost.company?._id || 'unknown',
            companyName: typeof jobPost.company === 'object' && jobPost.company?.name ? jobPost.company.name : 'Unknown Company',
            description: jobPost.description || '',
            postedDate: jobPost.createdAt || new Date().toISOString(),
            status: jobPost.jobStatus === "open" ? "active" as const : "closed" as const,
            location: jobPost.address ? `${jobPost.address.city || 'N/A'}, ${jobPost.address.state || 'N/A'}` : 'N/A',
            type: (jobPost.preferences?.employmentType?.[0] as "full-time" | "part-time" | "contract" | "internship") || "full-time" as const,
            salary: undefined,
            requirements: jobPost.preferences?.skills || [],
          };
        }
      });

      // Cache in IndexedDB
      await setCachedData(CACHE_KEYS.jobPosts, CACHE_KEYS.jobPostsTime, jobPosts);

      return { jobPosts, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch job posts'
      );
    }
  }
);

// Sync job posts incrementally from API
export const syncJobPosts = createAsyncThunk<
  { jobPosts: Job[]; timestamp: number },
  number,
  { rejectValue: string }
>(
  'jobPosts/sync',
  async (lastFetchedAt, { rejectWithValue }) => {
    try {
      const since = new Date(lastFetchedAt).toISOString();
      const response = await jobPostsApi.syncJobPosts(since);
      
      const updatedApiRecords = response.data.updatedRecords;
      const deletedIds = response.data.deletedIds;

      const cached = await getCachedData<Job[]>(
        CACHE_KEYS.jobPosts,
        CACHE_KEYS.jobPostsTime
      );
      
      let currentRecords = cached?.data || [];
      
      currentRecords = currentRecords.filter(r => !deletedIds.includes(r.id));
      
      const validUpdated = updatedApiRecords.filter(jp => jp && Object.keys(jp).length > 0);
      const updatedRecords = validUpdated.map(jp => {
        try {
          return transformJobPost(jp);
        } catch (e) {
          return {
            id: jp._id || 'unknown',
            title: jp.title || 'Unknown Job',
            companyId: typeof jp.company === 'string' ? jp.company : jp.company?._id || 'unknown',
            companyName: typeof jp.company === 'object' && jp.company?.name ? jp.company.name : 'Unknown Company',
            description: jp.description || '',
            postedDate: jp.createdAt || new Date().toISOString(),
            status: jp.jobStatus === "open" ? "active" as const : "closed" as const,
            location: jp.address ? `${jp.address.city || 'N/A'}, ${jp.address.state || 'N/A'}` : 'N/A',
            type: (jp.preferences?.employmentType?.[0] as "full-time" | "part-time" | "contract" | "internship") || "full-time" as const,
            salary: undefined,
            requirements: jp.preferences?.skills || [],
          };
        }
      });

      for (const updated of updatedRecords) {
        const index = currentRecords.findIndex(r => r.id === updated.id);
        if (index !== -1) {
          currentRecords[index] = updated;
        } else {
          currentRecords.unshift(updated);
        }
      }

      currentRecords.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());

      const newTimestamp = Date.now();
      await setCachedData(CACHE_KEYS.jobPosts, CACHE_KEYS.jobPostsTime, currentRecords);

      return { jobPosts: currentRecords, timestamp: newTimestamp };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to sync job posts'
      );
    }
  }
);

// Fetch single job post
export const fetchJobPost = createAsyncThunk<
  JobPostDetailResponse,
  string,
  { rejectValue: string }
>(
  'jobPosts/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await jobPostsApi.getJobPost(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch job post'
      );
    }
  }
);

// Update job post
export const updateJobPost = createAsyncThunk<
  JobPostDetailResponse,
  { id: string; data: { title?: string; description?: string; jobStatus?: "open" | "closed" } },
  { rejectValue: string }
>(
  'jobPosts/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await jobPostsApi.updateJobPost(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update job post'
      );
    }
  }
);

// Delete job post
export const deleteJobPost = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'jobPosts/delete',
  async (id, { rejectWithValue }) => {
    try {
      await jobPostsApi.deleteJobPost(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete job post'
      );
    }
  }
);

// Job posts slice
const jobPostsSlice = createSlice({
  name: 'jobPosts',
  initialState,
  reducers: {
    setSelectedJobPost: (state, action: PayloadAction<Job | null>) => {
      state.selectedJobPost = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<'all' | 'active' | 'closed'>) => {
      state.filterStatus = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetJobPosts: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Load from cache
      .addCase(loadJobPostsFromCache.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadJobPostsFromCache.fulfilled, (state, action) => {
        if (action.payload) {
          state.allJobPosts = action.payload.jobPosts;
          state.lastFetchedAt = action.payload.timestamp;
        }
        state.isLoading = false;
      })
      .addCase(loadJobPostsFromCache.rejected, (state) => {
        state.isLoading = false;
      })

      // Fetch all from API
      .addCase(fetchAllJobPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllJobPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allJobPosts = action.payload.jobPosts;
        state.lastFetchedAt = action.payload.timestamp;
        state.error = null;
      })
      .addCase(fetchAllJobPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch job posts';
      })

      // Sync incrementally from API
      .addCase(syncJobPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncJobPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allJobPosts = action.payload.jobPosts;
        state.lastFetchedAt = action.payload.timestamp;
        state.error = null;
      })
      .addCase(syncJobPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to sync job posts';
      })

      // Fetch single job post
      .addCase(fetchJobPost.pending, (state) => {
        state.selectedJobPost = null;
      })
      .addCase(fetchJobPost.fulfilled, (state, action: PayloadAction<JobPostDetailResponse>) => {
        state.selectedJobPost = transformJobPost(action.payload.data);
      })
      .addCase(fetchJobPost.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch job post';
      })

      // Update job post
      .addCase(updateJobPost.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateJobPost.fulfilled, (state, action: PayloadAction<JobPostDetailResponse>) => {
        state.isUpdating = false;
        if (action.payload?.data) {
          try {
            const transformed = transformJobPost(action.payload.data);
            const index = state.allJobPosts.findIndex(jp => jp.id === transformed.id);
            if (index !== -1) {
              state.allJobPosts[index] = transformed;
            }
            state.selectedJobPost = transformed;
          } catch (error) {
            console.error('Error transforming job post:', error);
          }
        }
        state.error = null;
      })
      .addCase(updateJobPost.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || 'Failed to update job post';
      })

      // Delete job post
      .addCase(deleteJobPost.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteJobPost.fulfilled, (state, action: PayloadAction<string>) => {
        state.isDeleting = false;
        state.allJobPosts = state.allJobPosts.filter(jp => jp.id !== action.payload);
        if (state.selectedJobPost?.id === action.payload) {
          state.selectedJobPost = null;
        }
        state.error = null;
      })
      .addCase(deleteJobPost.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload || 'Failed to delete job post';
      });
  },
});

export const { setSelectedJobPost, setFilterStatus, clearError, resetJobPosts } = jobPostsSlice.actions;

export default jobPostsSlice.reducer;
