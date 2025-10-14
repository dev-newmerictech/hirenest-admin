// API client with authentication support

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Make authenticated API requests
 * Automatically includes the JWT token from localStorage
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = true, headers = {}, ...restOptions } = options;

  const config: RequestInit = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Add authentication token if required
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

    // Handle 401 Unauthorized
    if (response.status === 401) {
      // Clear auth data and redirect to login
      if (typeof window !== 'undefined') {
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

