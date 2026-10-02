// API client with authentication and transparent token refresh support

import { API_URL } from './config';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  _retry?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (newToken: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Perform silent token refresh against backend
 */
async function refreshAuthToken(): Promise<string> {
  const response = await fetch(`${API_URL}/admin/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Refresh failed');
  }

  const data = await response.json();
  const newToken = data.token;
  if (typeof window !== 'undefined' && newToken) {
    localStorage.setItem('token', newToken);
  }
  return newToken;
}

/**
 * Make authenticated API requests
 * Automatically includes credentials (HttpOnly cookies) and JWT Bearer fallback
 * Automatically intercepts 401s and refreshes tokens silently in the background
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = true, headers = {}, _retry = false, ...restOptions } = options;

  const config: RequestInit = {
    ...restOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Add authentication token if available
  if (requireAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized with silent background refresh
    if (response.status === 401 && requireAuth && !_retry && !endpoint.includes('/auth/')) {
      if (isRefreshing) {
        // Wait for active refresh to finish, then retry with new token
        return new Promise<T>((resolve, reject) => {
          addRefreshSubscriber((newToken: string) => {
            apiClient<T>(endpoint, {
              ...options,
              _retry: true,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${newToken}`,
              },
            })
              .then(resolve)
              .catch(reject);
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAuthToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);

        // Retry the original request
        return apiClient<T>(endpoint, {
          ...options,
          _retry: true,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch (refreshErr) {
        isRefreshing = false;
        refreshSubscribers = [];

        // Refresh failed: clear auth and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/admin/login';
        }
        throw new Error('Session expired');
      }
    }

    if (response.status === 401) {
      if (typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `Request failed with status ${response.status}`,
      }));
      throw new Error(error.message || 'Request failed');
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as any;
  } catch (error) {
    console.error('API Client Error:', error);
    throw error;
  }
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { method: 'GET', ...options }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { method: 'DELETE', ...options }),
};
