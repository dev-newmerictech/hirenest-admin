// Redux store configuration

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import dashboardReducer from './dashboardSlice';
import jobSeekersReducer from './jobSeekersSlice';
import companiesReducer from './companiesSlice';
import jobPostsReducer from './jobPostsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    jobSeekers: jobSeekersReducer,
    companies: companiesReducer,
    jobPosts: jobPostsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

