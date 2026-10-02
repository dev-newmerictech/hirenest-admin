import { api } from './client';

export interface MarketingEmailTemplate {
  _id?: string;
  slug: string;
  name: string;
  triggerDescription?: string;
  category: 'onboarding_drip' | 'resume_nudge' | 'application_followup' | 'employer_drip' | 'custom';
  targetRole: 'jobseeker' | 'jobprovider' | 'all';
  subject: string;
  preheader?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  delayHours: number;
  isActive: boolean;
  tags?: string[];
  stats?: {
    sentCount: number;
    lastSentAt?: string;
  };
  updatedAt?: string;
  createdAt?: string;
}

export interface TemplatesResponse {
  success: boolean;
  templates: MarketingEmailTemplate[];
}

export interface SingleTemplateResponse {
  success: boolean;
  template: MarketingEmailTemplate;
}

export interface SendTestEmailPayload {
  toEmail: string;
  subject: string;
  preheader?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  mockData?: Record<string, any>;
}

export interface SendTestEmailResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export const marketingTemplatesApi = {
  getAll: async (): Promise<TemplatesResponse> => {
    return api.get<TemplatesResponse>('/admin/marketing-templates');
  },

  getBySlug: async (slug: string): Promise<SingleTemplateResponse> => {
    return api.get<SingleTemplateResponse>(`/admin/marketing-templates/${slug}`);
  },

  update: async (slug: string, data: Partial<MarketingEmailTemplate>): Promise<SingleTemplateResponse> => {
    return api.put<SingleTemplateResponse>(`/admin/marketing-templates/${slug}`, data);
  },

  sendTestEmail: async (payload: SendTestEmailPayload): Promise<SendTestEmailResponse> => {
    return api.post<SendTestEmailResponse>('/admin/marketing-templates/test', payload);
  },

  resetDefaults: async (): Promise<TemplatesResponse> => {
    return api.post<TemplatesResponse>('/admin/marketing-templates/reset-defaults');
  },
};
