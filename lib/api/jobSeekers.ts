// Job Seekers API functions

import { api } from './client';
import { JobSeeker, JobSeekerAPIResponse } from '../types';

export interface JobSeekersListResponse {
  status: string;
  data: {
    jobSeekers: JobSeekerAPIResponse[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface JobSeekerDetailResponse {
  status: string;
  data: JobSeekerAPIResponse;
}

// Transform API response to internal format
export function transformJobSeeker(apiJobSeeker: JobSeekerAPIResponse): JobSeeker {
  return {
    id: apiJobSeeker._id,
    name: apiJobSeeker.name,
    email: apiJobSeeker.email,
    phone: `+${apiJobSeeker.mobile.countryCode}${apiJobSeeker.mobile.mobileNumber}`,
    registrationDate: apiJobSeeker.createdAt,
    isActive: apiJobSeeker.isActive,
  };
}

export interface ToggleStatusRequest {
  isActive: boolean;
}

export interface UpdateJobSeekerRequest {
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * Job Seekers API
 * All endpoints automatically include the token from localStorage
 */
export const jobSeekersApi = {
  /**
   * Get all job seekers
   * GET /admin/job-seekers/?page={page}&limit={limit}
   */
  getAllJobSeekers: async (page: number = 1, limit: number = 10): Promise<JobSeekersListResponse> => {
    return api.get<JobSeekersListResponse>(`/admin/job-seekers/?page=${page}&limit=${limit}`);
  },

  /**
   * Search job seekers
   * GET /admin/job-seekers/search?q={query}
   */
  searchJobSeekers: async (query: string): Promise<JobSeekersListResponse> => {
    return api.get<JobSeekersListResponse>(`/admin/job-seekers/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Get job seeker profile by ID
   * GET /admin/job-seekers/:id
   */
  getJobSeekerProfile: async (id: string): Promise<JobSeekerDetailResponse> => {
    return api.get<JobSeekerDetailResponse>(`/admin/job-seekers/${id}`);
  },

  /**
   * Toggle job seeker status (activate/deactivate)
   * PATCH /admin/job-seekers/:id/toggle-status
   */
  toggleJobSeekerStatus: async (id: string, isActive: boolean): Promise<JobSeekerDetailResponse> => {
    return api.patch<JobSeekerDetailResponse>(
      `/admin/job-seekers/${id}/toggle-status`,
      { isActive }
    );
  },

  /**
   * Update job seeker information
   * PATCH /admin/job-seekers/:id/update-profile
   */
  updateJobSeeker: async (id: string, data: UpdateJobSeekerRequest): Promise<JobSeekerDetailResponse> => {
    return api.patch<JobSeekerDetailResponse>(`/admin/job-seekers/${id}/update-profile`, data);
  },

  /**
   * Delete job seeker
   * DELETE /admin/job-seekers/:id
   */
  deleteJobSeeker: async (id: string): Promise<{ status: string; message: string }> => {
    return api.delete(`/admin/job-seekers/${id}`);
  },
};

