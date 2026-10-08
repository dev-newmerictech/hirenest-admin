// Job Seekers API functions

import { api } from './client';
import { JobSeeker, JobSeekerAPIResponse, DetailedJobSeeker } from '../types';

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
  data: JobSeekerAPIResponse | { jobSeeker: JobSeekerAPIResponse } | any;
}

export interface JobSeekerSyncResponse {
  status: string;
  data: {
    updatedRecords: JobSeekerAPIResponse[];
    deletedIds: string[];
  };
}

// Transform API response to internal format
export function transformJobSeeker(apiJobSeeker: JobSeekerAPIResponse): JobSeeker {
  return {
    id: apiJobSeeker._id,
    name: apiJobSeeker.name,
    email: apiJobSeeker.email,
    registrationDate: apiJobSeeker.createdAt,
    isActive: apiJobSeeker.isActive,
    gender: apiJobSeeker.gender,
    city: apiJobSeeker.address?.city,
    state: apiJobSeeker.address?.state,
    country: apiJobSeeker.address?.country,
    acquisitionSource: apiJobSeeker.createdBy?.acquisitionSource,
    isOnboarded: apiJobSeeker.isOnboarded,
    phone: apiJobSeeker.mobile && apiJobSeeker.mobile.mobileNumber ? `+${apiJobSeeker.mobile.countryCode || 91} ${apiJobSeeker.mobile.mobileNumber}` : undefined,
  };
}

export function transformDetailedJobSeeker(data: any): DetailedJobSeeker {
  const base = transformJobSeeker(data);
  const createdBy = typeof data.createdBy === 'object' ? data.createdBy : null;
  return {
    ...base,
    profilePicture: data.profilePicture,
    bio: data.bio,
    addressLine1: data.address?.addressLine1,
    addressLine2: data.address?.addressLine2,
    postalCode: data.address?.postalCode,
    experiences: data.experiences || [],
    educations: data.educations || [],
    preferences: data.preferences,
    documents: data.documents || [],
    socialLinks: data.socialLinks || [],
    createdByDetails: createdBy ? {
      firstName: createdBy.firstName,
      lastName: createdBy.lastName,
      email: createdBy.email,
      provider: createdBy.provider,
      createdAt: createdBy.createdAt,
    } : undefined,
  };
}

export function extractJobSeekerFromDetailResponse(
  detailData: JobSeekerDetailResponse['data']
): any {
  if (detailData && 'jobSeeker' in detailData) {
    return detailData.jobSeeker;
  }

  return detailData;
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

  /**
   * Sync job seekers incrementally
   * GET /admin/job-seekers/sync?since={timestamp}
   */
  syncJobSeekers: async (since: string): Promise<JobSeekerSyncResponse> => {
    return api.get<JobSeekerSyncResponse>(`/admin/job-seekers/sync?since=${encodeURIComponent(since)}`);
  },
};

