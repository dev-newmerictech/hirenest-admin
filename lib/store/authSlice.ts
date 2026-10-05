// Redux slice for authentication state management with 2FA support

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, LoginRequest, LoginResponse, TwoFactorLoginRequest } from '../api/auth';
import { clearAllAdminCache } from '../cache/adminCache';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  adminRole: 'super_admin' | 'marketing';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunk for initial login (email/password)
export const loginAsync = createAsyncThunk<
  LoginResponse,
  LoginRequest,
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      
      // Store token and user in localStorage only if login completed without MFA
      if (!response.mfaRequired && typeof window !== 'undefined' && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

// Async thunk for 2FA OTP verification
export const login2FAAsync = createAsyncThunk<
  LoginResponse,
  TwoFactorLoginRequest,
  { rejectValue: string }
>(
  'auth/login2fa',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.login2FA(data);
      
      if (typeof window !== 'undefined' && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '2FA verification failed');
    }
  }
);

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action to restore auth state from localStorage
    restoreAuth: (state) => {
      const token = authApi.getStoredToken();
      const user = authApi.getStoredUser();
      
      if (token && user) {
        state.token = token;
        state.user = user;
        state.isAuthenticated = true;
      }
    },
    
    // Action to logout
    logout: (state) => {
      authApi.logout();
      clearAllAdminCache();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login pending
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Login fulfilled
      .addCase(loginAsync.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        if (action.payload.mfaRequired) {
          state.isAuthenticated = false;
        } else {
          state.isAuthenticated = true;
          state.token = action.payload.token || null;
          state.user = action.payload.user || null;
        }
        state.error = null;
      })
      // Login rejected
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload || 'Login failed';
      })
      // 2FA pending
      .addCase(login2FAAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // 2FA fulfilled
      .addCase(login2FAAsync.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token || null;
        state.user = action.payload.user || null;
        state.error = null;
      })
      // 2FA rejected
      .addCase(login2FAAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '2FA verification failed';
      });
  },
});

export const { restoreAuth, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
