import { api } from './client';
import type { AssignPlanRequest, SubscriptionPlan } from '../types';

export interface SubscriptionsListResponse {
  success: boolean;
  data: {
    subscriptions: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SubscriptionDetailResponse {
  success: boolean;
  data: {
    subscription: any;
    creditBalance: any;
    usageStats: any;
    recentTransactions: any[];
  };
}

export const subscriptionsApi = {
  getPlans: async (): Promise<{ success: boolean; data: SubscriptionPlan[] }> =>
    api.get('/admin/subscription/plans'),

  createPlan: async (payload: Partial<SubscriptionPlan>) =>
    api.post('/admin/subscription/plans', payload),

  updatePlan: async (planId: string, payload: Partial<SubscriptionPlan>) =>
    api.put(`/admin/subscription/plans/${planId}`, payload),

  deletePlan: async (planId: string) =>
    api.delete(`/admin/subscription/plans/${planId}`),

  listSubscriptions: async (query: URLSearchParams): Promise<SubscriptionsListResponse> =>
    api.get(`/admin/subscription/subscriptions?${query.toString()}`),

  getSubscription: async (profileId: string): Promise<SubscriptionDetailResponse> =>
    api.get(`/admin/subscription/subscriptions/${profileId}`),

  addCredits: async (profileId: string, credits: number, reason: string) =>
    api.post(`/admin/subscription/subscriptions/${profileId}/credits`, { credits, reason }),

  updateStatus: async (profileId: string, status: string) =>
    api.put(`/admin/subscription/subscriptions/${profileId}/status`, { status }),

  assignPlan: async (profileId: string, payload: AssignPlanRequest) =>
    api.post(`/admin/subscription/subscriptions/${profileId}/assign-plan`, payload),

  getAnalytics: async () => api.get('/admin/subscription/analytics'),
};

