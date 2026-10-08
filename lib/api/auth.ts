// Authentication API service with 2FA & session management

import { getApiBaseUrl } from './config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  mfaRequired?: boolean;
  tempToken?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    adminRole: 'super_admin' | 'operations' | 'marketing';
  };
}

export interface TwoFactorLoginRequest {
  tempToken: string;
  otpToken: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  otpAuthUrl: string;
  message: string;
}

export interface TwoFactorVerifyResponse {
  message: string;
  mfaEnabled: boolean;
  backupCodes: string[];
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${getApiBaseUrl()}/admin/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  login2FA: async (data: TwoFactorLoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${getApiBaseUrl()}/admin/auth/login/2fa`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '2FA verification failed' }));
      throw new Error(error.message || '2FA verification failed');
    }

    return response.json();
  },

  logout: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch(`${getApiBaseUrl()}/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // Non-fatal if server logout call fails
    }
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('admin_session');
    }
  },

  get2FAStatus: async (): Promise<{ mfaEnabled: boolean }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${getApiBaseUrl()}/admin/auth/2fa/status`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch 2FA status');
    }

    return response.json();
  },

  setup2FA: async (): Promise<TwoFactorSetupResponse> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${getApiBaseUrl()}/admin/auth/2fa/setup`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to initiate 2FA setup' }));
      throw new Error(error.message || 'Failed to initiate 2FA setup');
    }

    return response.json();
  },

  verifyAndEnable2FA: async (otpToken: string): Promise<TwoFactorVerifyResponse> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${getApiBaseUrl()}/admin/auth/2fa/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ otpToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to verify 2FA' }));
      throw new Error(error.message || 'Failed to verify 2FA');
    }

    return response.json();
  },

  disable2FA: async (password: string, otpToken?: string): Promise<{ message: string; mfaEnabled: boolean }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${getApiBaseUrl()}/admin/auth/2fa/disable`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ password, otpToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to disable 2FA' }));
      throw new Error(error.message || 'Failed to disable 2FA');
    }

    return response.json();
  },

  getStoredToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  getStoredUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
};
