import { api } from './client';

export interface UserLocationDTO {
  _id: string;
  type: 'jobseeker' | 'jobprovider' | 'admin';
  lat: number;
  lng: number;
}

export interface UserLocationsResponse {
  status: string;
  results: number;
  data: UserLocationDTO[];
}

export const analyticsApi = {
  /**
   * Fetch optimized map location data for all active users
   */
  getUserLocations: async (): Promise<UserLocationsResponse> => {
    return api.get<UserLocationsResponse>('/admin/analytics/user-locations');
  },
};
