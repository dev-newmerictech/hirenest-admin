# Dashboard API Setup - Job Seekers Count

This document explains the Redux integration for the job-seekers count API endpoint.

## Overview

The implementation includes:
- ✅ API client functions with automatic localStorage token handling
- ✅ Redux slice with actions and reducers
- ✅ Dashboard page integration
- ✅ Error handling and loading states

## API Endpoint

**Endpoint:** `http://localhost:5000/admin/job-seekers/count`  
**Method:** GET  
**Authentication:** Bearer token (automatically picked from localStorage)

## Files Created/Modified

### 1. `lib/api/dashboard.ts` (NEW)
API functions for dashboard-related endpoints:
```typescript
dashboardApi.getJobSeekersCount() // Fetches job seekers count
dashboardApi.getDashboardStats()  // Fetches all dashboard stats
```

### 2. `lib/store/dashboardSlice.ts` (NEW)
Redux slice for dashboard state management with:
- **State:** jobSeekersCount, stats, isLoading, isCountLoading, error
- **Actions:**
  - `fetchJobSeekersCount()` - Async thunk to fetch count
  - `fetchDashboardStats()` - Async thunk to fetch all stats
  - `clearError()` - Clear error state
  - `resetDashboard()` - Reset all dashboard state

### 3. `lib/store/index.ts` (UPDATED)
Added dashboard reducer to the Redux store.

### 4. `app/admin/dashboard/page.tsx` (UPDATED)
Updated to use Redux instead of local state:
- Imports Redux hooks and actions
- Dispatches `fetchJobSeekersCount()` on component mount
- Displays data from Redux store
- Shows error messages if API call fails

## How It Works

### 1. Token Authentication
The API client automatically picks up the token from localStorage:
```typescript
const token = localStorage.getItem('token');
// Token is automatically added to Authorization header
```

### 2. Redux Flow
```
Component Mount
    ↓
dispatch(fetchJobSeekersCount())
    ↓
API Call: GET /admin/job-seekers/count
(with token from localStorage)
    ↓
Update Redux State
    ↓
Component Re-renders with new data
```

### 3. State Structure
```typescript
{
  dashboard: {
    totalJobSeekers: 0,
    totalJobProviders: 0,
    totalJobs: 0,
    totalApplications: 0,
    isLoading: false,
    error: null
  }
}
```

## Usage Example

### Dispatching Actions
```typescript
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { fetchJobSeekersCount } from "@/lib/store/dashboardSlice"

function MyComponent() {
  const dispatch = useAppDispatch()
  
  useEffect(() => {
    dispatch(fetchJobSeekersCount())
  }, [dispatch])
}
```

### Accessing State
```typescript
const { totalJobSeekers, totalJobProviders, totalJobs, totalApplications, isLoading, error } = useAppSelector(
  (state) => state.dashboard
)
```

## Error Handling

The implementation includes comprehensive error handling:
- API errors are caught and stored in Redux state
- 401 Unauthorized automatically redirects to login
- Error messages are displayed in the UI
- Token removal on authentication failure

## Testing

To test the implementation:

1. Start your backend server on `http://localhost:5000`
2. Login to admin panel
3. Navigate to dashboard
4. The job seekers count will be fetched automatically
5. Check browser DevTools → Network tab for API calls
6. Check Redux DevTools to see state changes

## API Response Format

Expected response from `GET /admin/job-seekers/count`:
```json
{
  "status": "success",
  "data": {
    "totalJobSeekers": 46,
    "totalJobProviders": 22,
    "totalJobs": 95,
    "totalApplications": 122
  }
}
```

## Future Enhancements

Possible improvements:
- Add cache invalidation
- Implement polling for real-time updates
- Add retry logic for failed requests
- Implement optimistic UI updates

