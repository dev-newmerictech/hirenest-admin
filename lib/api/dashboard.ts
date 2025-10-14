// Dashboard API functions

import { api } from './client';

export interface DashboardStatsData {
  totalJobSeekers: number;
  totalJobProviders: number;
  totalJobs: number;
  totalApplications: number;
}

export interface JobSeekersCountResponse {
  status: string;
  data: DashboardStatsData;
}

/**
 * Fetch job seekers count from the backend
 * Token is automatically picked up from localStorage by the API client
 */
export const dashboardApi = {
  /**
   * Get job seekers count and all dashboard stats
   */
  getJobSeekersCount: async (): Promise<JobSeekersCountResponse> => {
    return api.get<JobSeekersCountResponse>('/admin/job-seekers/count');
  },
};

