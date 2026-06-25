import { api } from './client';

export interface NotOnboardedUser {
  id: string;
  name: string;
  email: string;
  registrationDate: string;
  createdAt: string;
  isActive: boolean;
  isOnboarded: boolean;
  role: string;
  onboardingStage: number;
  source: string;
  sourceData?: any;
}

export interface NotOnboardedResponse {
  status: string;
  data: {
    notOnboardedUsers: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface SyncNotOnboardedResponse {
  status: string;
  data: {
    updatedRecords: any[];
    deletedIds: string[];
  };
}

export const notOnboardedApi = {
  getAll: async (page = 1, limit = 100): Promise<NotOnboardedResponse> => {
    return api.get<NotOnboardedResponse>(`/admin/not-onboarded?page=${page}&limit=${limit}`);
  },

  sync: async (since: string): Promise<SyncNotOnboardedResponse> => {
    return api.get<SyncNotOnboardedResponse>(`/admin/not-onboarded/sync?since=${encodeURIComponent(since)}`);
  },

  deleteUser: async (id: string): Promise<{ status: string; message: string }> => {
    return api.delete(`/admin/not-onboarded/${id}`);
  },
};
