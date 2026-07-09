import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notOnboardedApi, NotOnboardedUser } from '../api/notOnboarded';
import { getCachedData, setCachedData } from '../cache/adminCache';

interface NotOnboardedState {
  allNotOnboarded: NotOnboardedUser[];
  isLoading: boolean;
  isDeleting: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

const initialState: NotOnboardedState = {
  allNotOnboarded: [],
  isLoading: false,
  isDeleting: false,
  error: null,
  lastFetchedAt: null,
};

const transformUser = (apiUser: any): NotOnboardedUser => ({
  id: apiUser._id,
  name: apiUser.name,
  email: apiUser.email,
  registrationDate: apiUser.createdAt,
  createdAt: apiUser.createdAt,
  isActive: apiUser.isActive,
  isOnboarded: apiUser.isOnboarded,
  role: apiUser.role,
  onboardingStage: apiUser.onboardingStage,
  source: apiUser.createdBy?.acquisitionSource || 'direct',
  sourceData: apiUser.createdBy?.acquisitionData || {},
  draftProfile: apiUser.draftProfile || null,
});

export const loadNotOnboardedFromCache = createAsyncThunk<
  { users: NotOnboardedUser[]; timestamp: number } | null,
  void,
  { rejectValue: string }
>(
  'notOnboarded/loadFromCache',
  async (_, { rejectWithValue }) => {
    try {
      const cached = await getCachedData<NotOnboardedUser[]>(
        'admin_not_onboarded',
        'admin_not_onboarded_time'
      );
      return cached ? { users: cached.data, timestamp: cached.timestamp } : null;
    } catch (error) {
      return rejectWithValue('Failed to load from cache');
    }
  }
);

export const fetchAllNotOnboarded = createAsyncThunk<
  { users: NotOnboardedUser[]; timestamp: number },
  void,
  { rejectValue: string }
>(
  'notOnboarded/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notOnboardedApi.getAll(1, 100000);
      const users = response.data.notOnboardedUsers.map(transformUser);
      await setCachedData('admin_not_onboarded', 'admin_not_onboarded_time', users);
      return { users, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch not onboarded users');
    }
  }
);

export const syncNotOnboarded = createAsyncThunk<
  { users: NotOnboardedUser[]; timestamp: number },
  number,
  { rejectValue: string }
>(
  'notOnboarded/sync',
  async (lastFetchedAt, { rejectWithValue, dispatch }) => {
    try {
      const since = new Date(lastFetchedAt).toISOString();
      const response = await notOnboardedApi.sync(since);
      
      const updatedApiRecords = response.data.updatedRecords;
      const deletedIds = response.data.deletedIds;

      const cached = await getCachedData<NotOnboardedUser[]>('admin_not_onboarded', 'admin_not_onboarded_time');
      
      if (!cached || !cached.data || cached.data.length === 0) {
        const fullFetchAction = await dispatch(fetchAllNotOnboarded() as any);
        if (fetchAllNotOnboarded.fulfilled.match(fullFetchAction)) {
          return fullFetchAction.payload;
        } else {
          throw new Error('Fallback full fetch failed');
        }
      }

      let currentRecords = cached.data;

      // 1. Remove deleted
      currentRecords = currentRecords.filter(r => !deletedIds.includes(r.id));

      // 2. Insert/Update changed
      const updatedRecords = updatedApiRecords.map(transformUser);
      for (const updated of updatedRecords) {
        const index = currentRecords.findIndex(r => r.id === updated.id);
        if (index !== -1) {
          currentRecords[index] = updated;
        } else {
          currentRecords.unshift(updated);
        }
      }

      await setCachedData('admin_not_onboarded', 'admin_not_onboarded_time', currentRecords);
      return { users: currentRecords, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to sync not onboarded users');
    }
  }
);

export const deleteNotOnboardedUser = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'notOnboarded/delete',
  async (id, { rejectWithValue }) => {
    try {
      await notOnboardedApi.deleteUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete user');
    }
  }
);

const notOnboardedSlice = createSlice({
  name: 'notOnboarded',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load Cache
      .addCase(loadNotOnboardedFromCache.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadNotOnboardedFromCache.fulfilled, (state, action) => {
        if (action.payload) {
          state.allNotOnboarded = action.payload.users;
          state.lastFetchedAt = action.payload.timestamp;
        }
        state.isLoading = false;
      })
      .addCase(loadNotOnboardedFromCache.rejected, (state) => {
        state.isLoading = false;
      })
      // Fetch All
      .addCase(fetchAllNotOnboarded.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllNotOnboarded.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allNotOnboarded = action.payload.users;
        state.lastFetchedAt = action.payload.timestamp;
      })
      .addCase(fetchAllNotOnboarded.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch users';
      })
      // Sync
      .addCase(syncNotOnboarded.fulfilled, (state, action) => {
        state.allNotOnboarded = action.payload.users;
        state.lastFetchedAt = action.payload.timestamp;
      })
      // Delete
      .addCase(deleteNotOnboardedUser.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteNotOnboardedUser.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.allNotOnboarded = state.allNotOnboarded.filter(u => u.id !== action.payload);
      })
      .addCase(deleteNotOnboardedUser.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload || 'Failed to delete user';
      });
  },
});

export const { clearError } = notOnboardedSlice.actions;
export default notOnboardedSlice.reducer;
