// Companies (Job Providers) API functions

import { api } from './client';
import { Company, CompanyAPIResponse } from '../types';

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
  data: CompanyAPIResponse;
}

// Transform API response to internal format
export function transformCompany(apiCompany: CompanyAPIResponse): Company {
  return {
    id: apiCompany._id,
    name: apiCompany.name,
    email: apiCompany.email,
    industry: apiCompany.industry || 'N/A',
    registrationDate: apiCompany.createdAt,
    isActive: apiCompany.isActive,
    isVerified: apiCompany.isVerified || false,
    verificationStatus: apiCompany.verificationStatus || 'pending',
  };
}

export interface ToggleStatusRequest {
  isActive: boolean;
}

export interface UpdateCompanyRequest {
  name?: string;
  email?: string;
  industry?: string;
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
};
