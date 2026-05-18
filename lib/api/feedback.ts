import { api } from './client';

export interface FeedbackMetrics {
  globalCsat: number;
  totalFeedback: number;
  thirtyDayVolume: number;
  sentimentDistribution: {
    Positive: number;
    Neutral: number;
    Negative: number;
  };
  bestFeature: { feature: string; score: number } | null;
  worstFeature: { feature: string; score: number } | null;
  dailyTrend: Array<{
    date: string;
    Positive: number;
    Neutral: number;
    Negative: number;
  }>;
  featureSentimentBreakdown: Array<{
    feature: string;
    Positive: number;
    Neutral: number;
    Negative: number;
  }>;
}

export interface FeedbackInsights {
  _id: string;
  criticalFriction: { featureKey: string; issue: string; impact: string }[];
  coreWins: { featureKey: string; praise: string }[];
  emergingRequests: { featureKey: string; request: string; userValue: string }[];
  commentCount: number;
  generatedAt: string;
}

export interface FeedbackItem {
  _id: string;
  featureKey: string;
  rating: number;
  comment: string;
  sentiment: string;
  profileType: string;
  createdAt: string;
  profileId?: {
    _id: string;
    name: string;
    email: string;
    type: string;
  };
}

export interface FeedbackListResponse {
  status: string;
  data: FeedbackItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export const feedbackApi = {
  getMetrics: async () => {
    return api.get<{ status: string; data: FeedbackMetrics }>('/admin/feedback/metrics');
  },
  
  getInsights: async () => {
    return api.get<{ status: string; data: FeedbackInsights | null }>('/admin/feedback/insights');
  },
  
  generateInsights: async () => {
    return api.post<{ status: string; data?: FeedbackInsights; message?: string }>('/admin/feedback/insights/generate');
  },
  
  listFeedback: async (params: { page?: number; limit?: number; featureKey?: string; sentiment?: string; profileType?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.featureKey) searchParams.append('featureKey', params.featureKey);
    if (params.sentiment && params.sentiment !== 'all') searchParams.append('sentiment', params.sentiment);
    if (params.profileType && params.profileType !== 'all') searchParams.append('profileType', params.profileType);
    
    return api.get<FeedbackListResponse>(`/admin/feedback/list?${searchParams.toString()}`);
  }
};
