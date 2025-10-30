// Redux slice for job posts state management

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  jobPostsApi, 
  JobPostsListResponse, 
  JobPostDetailResponse,
  transformJobPost 
} from '../api/jobPosts';
import { Job } from '../types';

interface JobPostsState {
  jobPosts: Job[];
  activeJobPosts: Job[];
  selectedJobPost: Job | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
  isLoading: boolean;
  isLoadingActive: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  searchQuery: string;
  filterStatus: 'all' | 'active' | 'closed';
}

// Initial state
const initialState: JobPostsState = {
  jobPosts: [],
  activeJobPosts: [],
  selectedJobPost: null,
  pagination: null,
  isLoading: false,
  isLoadingActive: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  searchQuery: '',
  filterStatus: 'all',
};

// Async thunk for fetching all job posts
export const fetchAllJobPosts = createAsyncThunk<
  JobPostsListResponse,
  { page?: number; limit?: number; company?: string } | void,
  { rejectValue: string }
>(
  'jobPosts/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const page = params && 'page' in params ? params.page : 1;
      const limit = params && 'limit' in params ? params.limit : 10;
      const company = params && 'company' in params ? params.company : undefined;
      const response = await jobPostsApi.getAllJobPosts(page, limit, company);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch job posts'
      );
    }
  }
);

// Async thunk for fetching active job posts
export const fetchActiveJobPosts = createAsyncThunk<
  JobPostsListResponse,
  void,
  { rejectValue: string }
>(
  'jobPosts/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await jobPostsApi.getActiveJobPosts();
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch active job posts'
      );
    }
  }
);

// Async thunk for fetching single job post
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

// Async thunk for updating job post
export const updateJobPost = createAsyncThunk<
  JobPostDetailResponse,
  { id: string; data: { title?: string; description?: string; jobStatus?: "open" | "closed" }; currentPage?: number },
  { rejectValue: string }
>(
  'jobPosts/update',
  async ({ id, data, currentPage }, { rejectWithValue, dispatch }) => {
    try {
      console.log('Starting updateJobPost with:', { id, data, currentPage });
      const response = await jobPostsApi.updateJobPost(id, data);
      console.log('Update API response:', response);
      
      // Auto-refetch with current page to maintain position
      try {
        if (currentPage !== undefined) {
          await dispatch(fetchAllJobPosts({ page: currentPage, limit: 10 })).unwrap();
        } else {
          // If no page provided, just refetch first page
          await dispatch(fetchAllJobPosts({ page: 1, limit: 10 })).unwrap();
        }
        console.log('Refetch completed successfully');
      } catch (refetchError) {
        console.error('Error refetching job posts after update:', refetchError);
        // Don't fail the entire update if refetch fails
      }
      
      console.log('updateJobPost completed successfully');
      return response;
    } catch (error) {
      console.error('Error updating job post:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update job post'
      );
    }
  }
);

// Async thunk for deleting job post
export const deleteJobPost = createAsyncThunk<
  { id: string },
  { id: string; currentPage?: number },
  { rejectValue: string }
>(
  'jobPosts/delete',
  async ({ id, currentPage }, { rejectWithValue, dispatch }) => {
    try {
      await jobPostsApi.deleteJobPost(id);
      
      // Auto-refetch with current page to maintain position
      try {
        if (currentPage !== undefined) {
          await dispatch(fetchAllJobPosts({ page: currentPage, limit: 10 })).unwrap();
        } else {
          // If no page provided, just refetch first page
          await dispatch(fetchAllJobPosts({ page: 1, limit: 10 })).unwrap();
        }
      } catch (refetchError) {
        console.error('Error refetching job posts after delete:', refetchError);
        // Don't fail the entire delete if refetch fails
      }
      
      return { id };
    } catch (error) {
      console.error('Error deleting job post:', error);
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
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<'all' | 'active' | 'closed'>) => {
      state.filterStatus = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all job posts
    builder
      .addCase(fetchAllJobPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllJobPosts.fulfilled, (state, action: PayloadAction<JobPostsListResponse>) => {
        state.isLoading = false;
        try {
          console.log('Processing all job posts:', action.payload.data.jobPosts);
          // Filter out invalid job posts first
          const validJobPosts = action.payload.data.jobPosts.filter((jobPost) => {
            return jobPost && jobPost._id && Object.keys(jobPost).length > 0;
          });
          
          console.log(`Filtered ${action.payload.data.jobPosts.length - validJobPosts.length} invalid job posts`);
          
          state.jobPosts = validJobPosts.map((jobPost, index) => {
            console.log(`Processing job post ${index}:`, jobPost);
            try {
              return transformJobPost(jobPost);
            } catch (error) {
              console.error('Error transforming job post in list:', error, jobPost);
              // Return a fallback job object to prevent the entire list from failing
              return {
                id: jobPost._id || 'unknown',
                title: jobPost.title || 'Unknown Job',
                companyId: typeof jobPost.company === 'string' ? jobPost.company : jobPost.company?._id || 'unknown',
                companyName: typeof jobPost.company === 'object' && jobPost.company?.name ? jobPost.company.name : 'Unknown Company',
                description: jobPost.description || '',
                postedDate: jobPost.createdAt || new Date().toISOString(),
                status: jobPost.jobStatus === "open" ? "active" : "closed",
                location: jobPost.address ? `${jobPost.address.city || 'N/A'}, ${jobPost.address.state || 'N/A'}` : 'N/A',
                type: (jobPost.preferences?.employmentType?.[0] as "full-time" | "part-time" | "contract" | "internship") || "full-time",
                salary: undefined,
                requirements: jobPost.preferences?.skills || [],
              };
            }
          });
        } catch (error) {
          console.error('Error processing job posts list:', error);
          state.jobPosts = [];
        }
        state.pagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(fetchAllJobPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch job posts';
      });

    // Fetch active job posts
    builder
      .addCase(fetchActiveJobPosts.pending, (state) => {
        state.isLoadingActive = true;
        state.error = null;
      })
      .addCase(fetchActiveJobPosts.fulfilled, (state, action: PayloadAction<JobPostsListResponse>) => {
        state.isLoadingActive = false;
        try {
          console.log('Processing active job posts:', action.payload.data.jobPosts);
          // Filter out invalid job posts first
          const validJobPosts = action.payload.data.jobPosts.filter((jobPost) => {
            return jobPost && jobPost._id && Object.keys(jobPost).length > 0;
          });
          
          console.log(`Filtered ${action.payload.data.jobPosts.length - validJobPosts.length} invalid active job posts`);
          
          state.activeJobPosts = validJobPosts.map((jobPost, index) => {
            console.log(`Processing active job post ${index}:`, jobPost);
            try {
              return transformJobPost(jobPost);
            } catch (error) {
              console.error('Error transforming active job post:', error, jobPost);
              // Return a fallback job object to prevent the entire list from failing
              return {
                id: jobPost._id || 'unknown',
                title: jobPost.title || 'Unknown Job',
                companyId: typeof jobPost.company === 'string' ? jobPost.company : jobPost.company?._id || 'unknown',
                companyName: typeof jobPost.company === 'object' && jobPost.company?.name ? jobPost.company.name : 'Unknown Company',
                description: jobPost.description || '',
                postedDate: jobPost.createdAt || new Date().toISOString(),
                status: jobPost.jobStatus === "open" ? "active" : "closed",
                location: jobPost.address ? `${jobPost.address.city || 'N/A'}, ${jobPost.address.state || 'N/A'}` : 'N/A',
                type: (jobPost.preferences?.employmentType?.[0] as "full-time" | "part-time" | "contract" | "internship") || "full-time",
                salary: undefined,
                requirements: jobPost.preferences?.skills || [],
              };
            }
          });
        } catch (error) {
          console.error('Error processing active job posts list:', error);
          state.activeJobPosts = [];
        }
        state.error = null;
      })
      .addCase(fetchActiveJobPosts.rejected, (state, action) => {
        state.isLoadingActive = false;
        state.error = action.payload || 'Failed to fetch active job posts';
      });

    // Fetch single job post
    builder
      .addCase(fetchJobPost.pending, (state) => {
        state.selectedJobPost = null;
      })
      .addCase(fetchJobPost.fulfilled, (state, action: PayloadAction<JobPostDetailResponse>) => {
        state.selectedJobPost = transformJobPost(action.payload.data);
      })
      .addCase(fetchJobPost.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch job post';
      });

    // Update job post
    builder
      .addCase(updateJobPost.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateJobPost.fulfilled, (state, action: PayloadAction<JobPostDetailResponse>) => {
        console.log('updateJobPost.fulfilled called with:', action.payload);
        state.isUpdating = false;
        if (action.payload?.data) {
          try {
            console.log('Transforming job post data:', action.payload.data);
            state.selectedJobPost = transformJobPost(action.payload.data);
            console.log('Transform successful');
          } catch (error) {
            console.error('Error transforming job post:', error);
            // Don't fail the entire action if transform fails
            state.error = null;
          }
        }
        state.error = null;
      })
      .addCase(updateJobPost.rejected, (state, action) => {
        console.log('updateJobPost.rejected called with:', action.payload);
        state.isUpdating = false;
        state.error = action.payload || 'Failed to update job post';
      });

    // Delete job post
    builder
      .addCase(deleteJobPost.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteJobPost.fulfilled, (state) => {
        state.isDeleting = false;
        state.selectedJobPost = null;
      })
      .addCase(deleteJobPost.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload || 'Failed to delete job post';
      });
  },
});

export const { setSelectedJobPost, setSearchQuery, setFilterStatus, clearError } = jobPostsSlice.actions;

export default jobPostsSlice.reducer;
