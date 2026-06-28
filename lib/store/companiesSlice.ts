// Redux slice for companies (job providers) state management
// Data is fetched once from API, cached in IndexedDB, and paginated client-side

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  companiesApi, 
  CompaniesListResponse, 
  CompanyDetailResponse,
  transformCompany 
} from '../api/companies';
import { Company } from '../types';
import { getCachedData, setCachedData, CACHE_KEYS } from '../cache/adminCache';

interface CompaniesState {
  allCompanies: Company[];        // ALL companies (from IndexedDB or API)
  selectedCompany: Company | null;
  isLoading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  lastFetchedAt: number | null;   // timestamp of last sync
}

// Initial state
const initialState: CompaniesState = {
  allCompanies: [],
  selectedCompany: null,
  isLoading: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  lastFetchedAt: null,
};

// Load companies from IndexedDB cache
export const loadCompaniesFromCache = createAsyncThunk<
  { companies: Company[]; timestamp: number } | null,
  void,
  { rejectValue: string }
>(
  'companies/loadFromCache',
  async (_, { rejectWithValue }) => {
    try {
      const cached = await getCachedData<Company[]>(
        CACHE_KEYS.companies,
        CACHE_KEYS.companiesTime
      );
      return cached ? { companies: cached.data, timestamp: cached.timestamp } : null;
    } catch (error) {
      return rejectWithValue('Failed to load from cache');
    }
  }
);

// Fetch ALL companies from API and store in IndexedDB
export const fetchAllCompanies = createAsyncThunk<
  { companies: Company[]; timestamp: number },
  void,
  { rejectValue: string }
>(
  'companies/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await companiesApi.getAllCompanies(1, 100000);
      const companies = response.data.jobProviders.map(transformCompany);

      // Cache in IndexedDB
      await setCachedData(CACHE_KEYS.companies, CACHE_KEYS.companiesTime, companies);

      return { companies, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch companies'
      );
    }
  }
);

// Sync companies incrementally from API
export const syncCompanies = createAsyncThunk<
  { companies: Company[]; timestamp: number },
  number,
  { rejectValue: string }
>(
  'companies/sync',
  async (lastFetchedAt, { rejectWithValue }) => {
    try {
      const since = new Date(lastFetchedAt).toISOString();
      const response = await companiesApi.syncCompanies(since);
      
      const updatedApiRecords = response.data.updatedRecords;
      const deletedIds = response.data.deletedIds;

      const cached = await getCachedData<Company[]>(
        CACHE_KEYS.companies,
        CACHE_KEYS.companiesTime
      );
      
      let currentRecords = cached?.data || [];
      
      currentRecords = currentRecords.filter(r => !deletedIds.includes(r.id));
      
      const updatedRecords = updatedApiRecords.map(transformCompany);
      for (const updated of updatedRecords) {
        const index = currentRecords.findIndex(r => r.id === updated.id);
        if (index !== -1) {
          currentRecords[index] = updated;
        } else {
          currentRecords.unshift(updated);
        }
      }

      currentRecords.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());

      const newTimestamp = Date.now();
      await setCachedData(CACHE_KEYS.companies, CACHE_KEYS.companiesTime, currentRecords);

      return { companies: currentRecords, timestamp: newTimestamp };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to sync companies'
      );
    }
  }
);

// Fetch company profile
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

// Toggle company status
export const toggleCompanyStatus = createAsyncThunk<
  CompanyDetailResponse,
  { id: string; isActive: boolean },
  { rejectValue: string }
>(
  'companies/toggleStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await companiesApi.toggleCompanyStatus(id, isActive);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to toggle status'
      );
    }
  }
);

// Update company
export const updateCompany = createAsyncThunk<
  CompanyDetailResponse,
  { id: string; data: { name?: string; email?: string; industry?: string; isDocumentVerified?: boolean } },
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

// Delete company
export const deleteCompany = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'companies/delete',
  async (id, { rejectWithValue }) => {
    try {
      await companiesApi.deleteCompany(id);
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
    setSelectedCompany: (state, action: PayloadAction<Company | null>) => {
      state.selectedCompany = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedCompany: (state) => {
      state.selectedCompany = null;
    },
    resetCompanies: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Load from cache
      .addCase(loadCompaniesFromCache.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadCompaniesFromCache.fulfilled, (state, action) => {
        if (action.payload) {
          state.allCompanies = action.payload.companies;
          state.lastFetchedAt = action.payload.timestamp;
        }
        state.isLoading = false;
      })
      .addCase(loadCompaniesFromCache.rejected, (state) => {
        state.isLoading = false;
      })

      // Fetch all from API
      .addCase(fetchAllCompanies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllCompanies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allCompanies = action.payload.companies;
        state.lastFetchedAt = action.payload.timestamp;
        state.error = null;
      })
      .addCase(fetchAllCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch companies';
      })

      // Sync incrementally from API
      .addCase(syncCompanies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncCompanies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allCompanies = action.payload.companies;
        state.lastFetchedAt = action.payload.timestamp;
        state.error = null;
      })
      .addCase(syncCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to sync companies';
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
        const index = state.allCompanies.findIndex(c => c.id === transformedCompany.id);
        if (index !== -1) {
          state.allCompanies[index] = transformedCompany;
        }
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
        const index = state.allCompanies.findIndex(c => c.id === transformedCompany.id);
        if (index !== -1) {
          state.allCompanies[index] = transformedCompany;
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
        state.allCompanies = state.allCompanies.filter(c => c.id !== action.payload);
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
  clearError, 
  clearSelectedCompany, 
  resetCompanies 
} = companiesSlice.actions;

export default companiesSlice.reducer;
