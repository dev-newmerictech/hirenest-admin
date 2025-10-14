# Job Seekers Redux Integration

Complete Redux integration for Job Seekers management with the HireNest API.

## Overview

This integration connects the job-seekers page to the backend API endpoints with full Redux state management, token authentication, and error handling.

## API Endpoints

All endpoints use the base URL: `https://api-dev.hirenest.ai`

### 1. Get All Job Seekers
```
GET /admin/job-seekers/
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "registrationDate": "2024-01-01T00:00:00Z",
      "isActive": true
    }
  ]
}
```

### 2. Search Job Seekers
```
GET /admin/job-seekers/search?q={query}
Authorization: Bearer {token}
```

### 3. Get Job Seeker Profile
```
GET /admin/job-seekers/:id
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "registrationDate": "2024-01-01T00:00:00Z",
    "isActive": true
  }
}
```

### 4. Toggle Job Seeker Status
```
PATCH /admin/job-seekers/:id/toggle-status
Authorization: Bearer {token}
Content-Type: application/json

{
  "isActive": false
}
```

### 5. Update Job Seeker
```
PATCH /admin/job-seekers/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+1234567890"
}
```

### 6. Delete Job Seeker
```
DELETE /admin/job-seekers/:id
Authorization: Bearer {token}
```

## Files Created/Updated

### 1. `lib/api/jobSeekers.ts` (NEW)
API client functions for all job seeker endpoints:
- `getAllJobSeekers()` - Fetch all job seekers
- `searchJobSeekers(query)` - Search job seekers
- `getJobSeekerProfile(id)` - Get single job seeker
- `toggleJobSeekerStatus(id, isActive)` - Toggle active status
- `updateJobSeeker(id, data)` - Update job seeker info
- `deleteJobSeeker(id)` - Delete job seeker

### 2. `lib/store/jobSeekersSlice.ts` (NEW)
Redux slice with complete state management:

**State:**
```typescript
{
  jobSeekers: JobSeeker[]
  selectedJobSeeker: JobSeeker | null
  isLoading: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
  searchQuery: string
}
```

**Async Actions:**
- `fetchAllJobSeekers()` - Fetch all job seekers
- `searchJobSeekers(query)` - Search job seekers
- `fetchJobSeekerProfile(id)` - Fetch single profile
- `toggleJobSeekerStatus({id, isActive})` - Toggle status
- `updateJobSeeker({id, data})` - Update job seeker
- `deleteJobSeeker(id)` - Delete job seeker

**Sync Actions:**
- `setSearchQuery(query)` - Set search query
- `clearError()` - Clear error state
- `clearSelectedJobSeeker()` - Clear selected job seeker
- `resetJobSeekers()` - Reset entire state

### 3. `lib/store/index.ts` (UPDATED)
Added `jobSeekersReducer` to the Redux store.

### 4. `app/admin/job-seekers/page.tsx` (UPDATED)
Converted from local state to Redux:
- Removed all fetch calls
- Uses Redux actions for all operations
- Client-side filtering with search query
- Loading and error states from Redux
- Toast notifications on success/error

### 5. `lib/api/client.ts` (UPDATED)
Base URL updated to `https://api-dev.hirenest.ai`

## Redux Flow

### Fetching Job Seekers
```
Component Mount
    ↓
dispatch(fetchAllJobSeekers())
    ↓
API: GET https://api-dev.hirenest.ai/admin/job-seekers/
(with Bearer token from localStorage)
    ↓
Update Redux State: jobSeekers = response.data
    ↓
Component Re-renders with data
```

### Updating Job Seeker
```
User Clicks Save
    ↓
dispatch(updateJobSeeker({id, data}))
    ↓
API: PATCH https://api-dev.hirenest.ai/admin/job-seekers/:id
    ↓
Update Redux State (optimistic update in list)
    ↓
Show success toast
```

### Deleting Job Seeker
```
User Confirms Delete
    ↓
dispatch(deleteJobSeeker(id))
    ↓
API: DELETE https://api-dev.hirenest.ai/admin/job-seekers/:id
    ↓
Remove from Redux State
    ↓
Show success toast
```

## Usage Examples

### Fetching All Job Seekers
```typescript
import { useAppDispatch } from "@/lib/store/hooks"
import { fetchAllJobSeekers } from "@/lib/store/jobSeekersSlice"

function MyComponent() {
  const dispatch = useAppDispatch()
  
  useEffect(() => {
    dispatch(fetchAllJobSeekers())
  }, [dispatch])
}
```

### Accessing Job Seekers Data
```typescript
import { useAppSelector } from "@/lib/store/hooks"

function MyComponent() {
  const { jobSeekers, isLoading, error } = useAppSelector(
    (state) => state.jobSeekers
  )
  
  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {jobSeekers.map(js => <div key={js.id}>{js.name}</div>)}
    </div>
  )
}
```

### Toggling Status
```typescript
const handleToggle = async (jobSeeker: JobSeeker) => {
  const result = await dispatch(
    toggleJobSeekerStatus({
      id: jobSeeker.id,
      isActive: !jobSeeker.isActive
    })
  )
  
  if (toggleJobSeekerStatus.fulfilled.match(result)) {
    toast.success("Status updated!")
  }
}
```

### Updating Job Seeker
```typescript
const handleUpdate = async () => {
  const result = await dispatch(
    updateJobSeeker({
      id: selectedJobSeeker.id,
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      }
    })
  )
  
  if (updateJobSeeker.fulfilled.match(result)) {
    toast.success("Updated successfully!")
  }
}
```

### Deleting Job Seeker
```typescript
const handleDelete = async (id: string) => {
  if (!confirm("Are you sure?")) return
  
  const result = await dispatch(deleteJobSeeker(id))
  
  if (deleteJobSeeker.fulfilled.match(result)) {
    toast.success("Deleted successfully!")
  }
}
```

### Client-Side Search
```typescript
// Set search query (stored in Redux)
dispatch(setSearchQuery("john"))

// Filter in component
const filteredJobSeekers = useMemo(() => {
  if (!searchQuery.trim()) return jobSeekers
  
  const query = searchQuery.toLowerCase()
  return jobSeekers.filter(
    (seeker) =>
      seeker.name.toLowerCase().includes(query) ||
      seeker.email.toLowerCase().includes(query) ||
      seeker.phone.toLowerCase().includes(query)
  )
}, [searchQuery, jobSeekers])
```

## Features

✅ **Automatic Authentication** - Token automatically included from localStorage  
✅ **Redux State Management** - Centralized state for all job seekers data  
✅ **Loading States** - Separate loading states for different operations  
✅ **Error Handling** - Comprehensive error handling with toast notifications  
✅ **Optimistic Updates** - UI updates immediately, syncs with backend  
✅ **Client-Side Search** - Fast filtering without API calls  
✅ **TypeScript Support** - Full type safety  
✅ **Auto Logout** - Redirects to login on 401 errors  

## Testing

1. **Navigate to Job Seekers page** (`/admin/job-seekers`)
2. **Verify data loads** from `https://api-dev.hirenest.ai/admin/job-seekers/`
3. **Test search** - Type in search box, see filtered results
4. **Test status toggle** - Click activate/deactivate button
5. **Test update** - Click on name, edit details, save
6. **Test delete** - Click delete button, confirm
7. **Check Network tab** - Verify API calls to correct URLs
8. **Check Redux DevTools** - See state changes in real-time

## Error Handling

All API errors are:
1. Caught by Redux thunk
2. Stored in `error` state
3. Displayed via toast notifications
4. Automatically cleared after display

### 401 Unauthorized
- Token is cleared from localStorage
- User is redirected to `/admin/login`

### Other Errors
- Error message shown in toast
- State remains intact
- User can retry the operation

## Performance

- **Memoized filtering** - Search filtering is optimized with `useMemo`
- **Optimistic updates** - UI updates before API response
- **Redux caching** - Data persists until page refresh
- **Minimal re-renders** - Only affected components re-render

## Migration from Local State

**Before:**
```typescript
const [jobSeekers, setJobSeekers] = useState([])
const response = await fetch('/api/admin/job-seekers')
const data = await response.json()
setJobSeekers(data)
```

**After:**
```typescript
const { jobSeekers } = useAppSelector(state => state.jobSeekers)
dispatch(fetchAllJobSeekers())
```

## Next Steps

Possible enhancements:
- Add pagination for large datasets
- Implement server-side search
- Add bulk operations (delete multiple)
- Add export to CSV functionality
- Add advanced filtering options
- Implement real-time updates with WebSockets

