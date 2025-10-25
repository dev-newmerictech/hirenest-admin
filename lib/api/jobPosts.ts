// Job Posts API functions

import { api } from './client';
import { Job, JobPostAPIResponse } from '../types';

export interface JobPostsListResponse {
  status: string;
  data: {
    jobPosts: JobPostAPIResponse[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface JobPostDetailResponse {
  status: string;
  data: JobPostAPIResponse;
}

// Transform API response to internal format
export function transformJobPost(apiJobPost: JobPostAPIResponse | null | undefined): Job {
  if (!apiJobPost) {
    throw new Error('Invalid job post data: null or undefined');
  }
  
  // Check if it's an empty object
  if (Object.keys(apiJobPost).length === 0) {
    console.error('Job post is empty object:', apiJobPost);
    throw new Error('Invalid job post data: empty object');
  }
  
  // if (!apiJobPost._id) {
  //   console.error('Job post missing _id field:', apiJobPost);
  //   throw new Error('Invalid job post data: missing _id field');
  // }
  
  // Handle company field - it can be either a string ID or an object
  const companyId = typeof apiJobPost.company === 'string' 
    ? apiJobPost.company 
    : apiJobPost.company?._id || '';
  const companyName = typeof apiJobPost.company === 'object' && apiJobPost.company?.name
    ? apiJobPost.company.name
    : 'Unknown Company';
  
  return {
    id: apiJobPost._id,
    title: apiJobPost.title || '',
    companyId,
    companyName,
    description: apiJobPost.description || '',
    postedDate: apiJobPost.createdAt || new Date().toISOString(),
    status: apiJobPost.jobStatus === "open" ? "active" : "closed",
    location: apiJobPost.address ? `${apiJobPost.address.city || 'N/A'}, ${apiJobPost.address.state || 'N/A'}` : 'N/A',
    type: (apiJobPost.preferences?.employmentType?.[0] as "full-time" | "part-time" | "contract" | "internship") || "full-time",
    salary: undefined,
    requirements: apiJobPost.preferences?.skills || [],
  };
}

export interface UpdateJobPostRequest {
  title?: string;
  description?: string;
  jobStatus?: "open" | "closed";
}

/**
 * Job Posts API
 * All endpoints automatically include the token from localStorage
 */
export const jobPostsApi = {
  /**
   * Get all job posts
   * GET /admin/job-posts/?page={page}&limit={limit}
   */
  getAllJobPosts: async (page: number = 1, limit: number = 10): Promise<JobPostsListResponse> => {
    return api.get<JobPostsListResponse>(`/admin/job-posts/?page=${page}&limit=${limit}`);
  },

  /**
   * Get active job posts
   * GET /admin/job-posts/active
   */
  getActiveJobPosts: async (): Promise<JobPostsListResponse> => {
    return api.get<JobPostsListResponse>('/admin/job-posts/active');
  },

  /**
   * Get job post by ID
   * GET /admin/job-posts/:id
   */
  getJobPost: async (id: string): Promise<JobPostDetailResponse> => {
    return api.get<JobPostDetailResponse>(`/admin/job-posts/${id}`);
  },

  /**
   * Update job post
   * PATCH /admin/job-posts/:id
   */
  updateJobPost: async (id: string, data: UpdateJobPostRequest): Promise<JobPostDetailResponse> => {
    return api.patch<JobPostDetailResponse>(`/admin/job-posts/${id}`, data);
  },

  /**
   * Delete job post
   * DELETE /admin/job-posts/:id
   */
  deleteJobPost: async (id: string): Promise<{ status: string; message: string }> => {
    return api.delete(`/admin/job-posts/${id}`);
  },
};
