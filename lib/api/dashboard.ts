// Dashboard API functions

import { api } from './client';

export interface DashboardStatsData {
  totalJobSeekers: number;
  totalJobProviders: number;
  totalJobs: number;
  totalApplications: number;
  totalUsers: number;
}

export interface JobSeekersCountResponse {
  status: string;
  data: DashboardStatsData;
}

export interface AnalyticsDataPoint {
  date: string;
  count: number;
}

export interface DashboardAnalyticsResponse {
  status: string;
  data: {
    jobSeekers: AnalyticsDataPoint[];
    companies: AnalyticsDataPoint[];
    jobs: AnalyticsDataPoint[];
    notOnboarded: AnalyticsDataPoint[];
  };
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

  /**
   * Get registration analytics over time
   */
  getDashboardAnalytics: async (range: string = '7d'): Promise<DashboardAnalyticsResponse> => {
    return api.get<DashboardAnalyticsResponse>(`/admin/analytics/dashboard?range=${range}`);
  },
};

