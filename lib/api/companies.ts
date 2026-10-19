// Companies (Job Providers) API functions

import { api } from './client';
import { Company, CompanyAPIResponse, DetailedCompany } from '../types';

export interface CompaniesListResponse {
  status: string;
  data: {
    jobProviders: CompanyAPIResponse[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface CompanyDetailResponse {
  status: string;
  data: CompanyAPIResponse | { jobProvider: CompanyAPIResponse } | any;
}

export interface CompanySyncResponse {
  status: string;
  data: {
    updatedRecords: CompanyAPIResponse[];
    deletedIds: string[];
  };
}

// Transform API response to internal format
export function transformCompany(apiCompany: CompanyAPIResponse): Company {
  // Update verificationStatus based on isDocumentVerified if available
  let verificationStatus = apiCompany.verificationStatus || 'pending';
  if (apiCompany.isDocumentVerified !== undefined) {
    verificationStatus = apiCompany.isDocumentVerified ? 'approved' : 'rejected';
  }
  
  return {
    id: apiCompany._id,
    name: apiCompany.name,
    email: apiCompany.email,
    industry: apiCompany.industry || 'N/A',
    registrationDate: apiCompany.createdAt,
    isActive: apiCompany.isActive,
    isVerified: apiCompany.isVerified || false,
    verificationStatus,
    isDocumentVerified: apiCompany.isDocumentVerified,
    acquisitionSource: apiCompany.createdBy?.acquisitionSource,
    isOnboarded: apiCompany.isOnboarded,
  };
}

export function transformDetailedCompany(data: any): DetailedCompany {
  const base = transformCompany(data);
  const createdBy = typeof data.createdBy === 'object' ? data.createdBy : null;
  return {
    ...base,
    profilePicture: data.profilePicture,
    bio: data.bio,
    ownerName: data.ownerName,
    phone: data.mobile && data.mobile.mobileNumber ? `+${data.mobile.countryCode || 91} ${data.mobile.mobileNumber}` : undefined,
    addressLine1: data.address?.addressLine1,
    addressLine2: data.address?.addressLine2,
    city: data.address?.city,
    state: data.address?.state,
    country: data.address?.country,
    postalCode: data.address?.postalCode,
    teamMembers: data.teamMembers || [],
    documents: data.documents || [],
    preferences: data.preferences,
    socialLinks: data.socialLinks || [],
    jobPostsCount: data.jobPostsCount ?? 0,
    createdByDetails: createdBy ? {
      firstName: createdBy.firstName,
      lastName: createdBy.lastName,
      email: createdBy.email,
      provider: createdBy.provider,
      createdAt: createdBy.createdAt,
    } : undefined,
  };
}

export interface ToggleStatusRequest {
  isActive: boolean;
}

export interface UpdateCompanyRequest {
  name?: string;
  email?: string;
  industry?: string;
  isDocumentVerified?: boolean;
}

/**
 * Companies (Job Providers) API
 * All endpoints automatically include the token from localStorage
 */
export const companiesApi = {
  /**
   * Get all companies
   * GET /admin/job-providers/?page={page}&limit={limit}
   */
  getAllCompanies: async (page: number = 1, limit: number = 10): Promise<CompaniesListResponse> => {
    return api.get<CompaniesListResponse>(`/admin/job-providers/?page=${page}&limit=${limit}`);
  },

  /**
   * Search companies
   * GET /admin/job-providers/search?q={query}
   */
  searchCompanies: async (query: string): Promise<CompaniesListResponse> => {
    return api.get<CompaniesListResponse>(`/admin/job-providers/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Get company profile by ID
   * GET /admin/job-providers/:id
   */
  getCompanyProfile: async (id: string): Promise<CompanyDetailResponse> => {
    return api.get<CompanyDetailResponse>(`/admin/job-providers/${id}`);
  },

  /**
   * Toggle company status (activate/deactivate)
   * PATCH /admin/job-providers/:id/toggle-status
   */
  toggleCompanyStatus: async (id: string, isActive: boolean): Promise<CompanyDetailResponse> => {
    return api.patch<CompanyDetailResponse>(
      `/admin/job-providers/${id}/toggle-status`,
      { isActive }
    );
  },

  /**
   * Update company information
   * PATCH /admin/job-providers/:id
   */
  updateCompany: async (id: string, data: UpdateCompanyRequest): Promise<CompanyDetailResponse> => {
    return api.patch<CompanyDetailResponse>(`/admin/job-providers/${id}/update-profile`, data);
  },

  /**
   * Delete company
   * DELETE /admin/job-providers/:id
   */
  deleteCompany: async (id: string): Promise<{ status: string; message: string }> => {
    return api.delete(`/admin/job-providers/${id}`);
  },

  /**
   * Sync companies incrementally
   * GET /admin/job-providers/sync?since={timestamp}
   */
  syncCompanies: async (since: string): Promise<CompanySyncResponse> => {
    return api.get<CompanySyncResponse>(`/admin/job-providers/sync?since=${encodeURIComponent(since)}`);
  },
};
