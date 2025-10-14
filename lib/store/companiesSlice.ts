// Redux slice for companies (job providers) state management

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  companiesApi, 
  CompaniesListResponse, 
  CompanyDetailResponse,
  transformCompany 
} from '../api/companies';
import { Company } from '../types';

interface CompaniesState {
  companies: Company[];
  selectedCompany: Company | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
  isLoading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  searchQuery: string;
}

// Initial state
const initialState: CompaniesState = {
  companies: [],
  selectedCompany: null,
  pagination: null,
  isLoading: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  searchQuery: '',
};

// Async thunk for fetching all companies
export const fetchAllCompanies = createAsyncThunk<
  CompaniesListResponse,
  { page?: number; limit?: number } | void,
  { rejectValue: string }
>(
  'companies/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const page = params && 'page' in params ? params.page : 1;
      const limit = params && 'limit' in params ? params.limit : 10;
      const response = await companiesApi.getAllCompanies(page, limit);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch companies'
      );
    }
  }
);

// Async thunk for searching companies
export const searchCompanies = createAsyncThunk<
  CompaniesListResponse,
  string,
  { rejectValue: string }
>(
  'companies/search',
  async (query, { rejectWithValue }) => {
    try {
      const response = await companiesApi.searchCompanies(query);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to search companies'
      );
    }
  }
);

// Async thunk for fetching company profile
export const fetchCompanyProfile = createAsyncThunk<
  CompanyDetailResponse,
  string,
  { rejectValue: string }
>(
  'companies/fetchProfile',
  async (id, { rejectWithValue }) => {
    try {
      const response = await companiesApi.getCompanyProfile(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch company profile'
      );
    }
  }
);

// Async thunk for toggling company status
export const toggleCompanyStatus = createAsyncThunk<
  CompanyDetailResponse,
  { id: string; isActive: boolean },
  { rejectValue: string }
>(
  'companies/toggleStatus',
  async ({ id, isActive }, { rejectWithValue, dispatch }) => {
    try {
      const response = await companiesApi.toggleCompanyStatus(id, isActive);
      // Refetch all companies after successful toggle
      dispatch(fetchAllCompanies());
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to toggle status'
      );
    }
  }
);

// Async thunk for updating company
export const updateCompany = createAsyncThunk<
  CompanyDetailResponse,
  { id: string; data: { name?: string; email?: string; industry?: string } },
  { rejectValue: string }
>(
  'companies/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await companiesApi.updateCompany(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update company'
      );
    }
  }
);

// Async thunk for deleting company
export const deleteCompany = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'companies/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await companiesApi.deleteCompany(id);
      // Refetch all companies after successful delete
      dispatch(fetchAllCompanies());
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete company'
      );
    }
  }
);

// Create the companies slice
const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    // Set search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Clear selected company
    clearSelectedCompany: (state) => {
      state.selectedCompany = null;
    },
    
    // Reset companies state
    resetCompanies: (state) => {
      state.companies = [];
      state.selectedCompany = null;
      state.pagination = null;
      state.isLoading = false;
      state.isUpdating = false;
      state.isDeleting = false;
      state.error = null;
      state.searchQuery = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all companies
      .addCase(fetchAllCompanies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllCompanies.fulfilled, (state, action: PayloadAction<CompaniesListResponse>) => {
        state.isLoading = false;
        // Transform API response to internal format
        state.companies = action.payload.data.jobProviders.map(transformCompany);
        state.pagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(fetchAllCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch companies';
      })
      
      // Search companies
      .addCase(searchCompanies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchCompanies.fulfilled, (state, action: PayloadAction<CompaniesListResponse>) => {
        state.isLoading = false;
        // Transform API response to internal format
        state.companies = action.payload.data.jobProviders.map(transformCompany);
        state.pagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(searchCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to search companies';
      })
      
      // Fetch company profile
      .addCase(fetchCompanyProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanyProfile.fulfilled, (state, action: PayloadAction<CompanyDetailResponse>) => {
        state.isLoading = false;
        state.selectedCompany = transformCompany(action.payload.data);
        state.error = null;
      })
      .addCase(fetchCompanyProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch company profile';
      })
      
      // Toggle status
      .addCase(toggleCompanyStatus.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(toggleCompanyStatus.fulfilled, (state, action: PayloadAction<CompanyDetailResponse>) => {
        state.isUpdating = false;
        const transformedCompany = transformCompany(action.payload.data);
        // Update in the list
        const index = state.companies.findIndex(c => c.id === transformedCompany.id);
        if (index !== -1) {
          state.companies[index] = transformedCompany;
        }
        // Update selected if it's the same one
        if (state.selectedCompany?.id === transformedCompany.id) {
          state.selectedCompany = transformedCompany;
        }
        state.error = null;
      })
      .addCase(toggleCompanyStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || 'Failed to toggle status';
      })
      
      // Update company
      .addCase(updateCompany.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action: PayloadAction<CompanyDetailResponse>) => {
        state.isUpdating = false;
        const transformedCompany = transformCompany(action.payload.data);
        // Update in the list
        const index = state.companies.findIndex(c => c.id === transformedCompany.id);
        if (index !== -1) {
          state.companies[index] = transformedCompany;
        }
        state.selectedCompany = transformedCompany;
        state.error = null;
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || 'Failed to update company';
      })
      
      // Delete company
      .addCase(deleteCompany.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action: PayloadAction<string>) => {
        state.isDeleting = false;
        // Remove from the list
        state.companies = state.companies.filter(c => c.id !== action.payload);
        // Clear selected if it was the deleted one
        if (state.selectedCompany?.id === action.payload) {
          state.selectedCompany = null;
        }
        state.error = null;
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload || 'Failed to delete company';
      });
  },
});

export const { 
  setSearchQuery, 
  clearError, 
  clearSelectedCompany, 
  resetCompanies 
} = companiesSlice.actions;

export default companiesSlice.reducer;

