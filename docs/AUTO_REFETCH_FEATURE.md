# Auto-Refetch Feature

## Overview
The job seekers list automatically refetches from the API after certain operations to ensure the UI stays in sync with the server state.

## Triggers

### 1. Toggle Job Seeker Status
When you toggle a job seeker's status (activate/deactivate):
```
User clicks toggle
    ↓
dispatch(toggleJobSeekerStatus({ id, isActive }))
    ↓
API: PATCH /admin/job-seekers/:id/toggle-status
    ↓
✅ Success Response
    ↓
dispatch(fetchAllJobSeekers()) ← AUTO REFETCH
    ↓
API: GET /admin/job-seekers/
    ↓
List updated with fresh data
```

### 2. Delete Job Seeker
When you delete a job seeker:
```
User confirms delete
    ↓
dispatch(deleteJobSeeker(id))
    ↓
API: DELETE /admin/job-seekers/:id
    ↓
✅ Success Response
    ↓
dispatch(fetchAllJobSeekers()) ← AUTO REFETCH
    ↓
API: GET /admin/job-seekers/
    ↓
List updated with fresh data
```

## Implementation

### Redux Thunk with Dispatch
```typescript
export const toggleJobSeekerStatus = createAsyncThunk<
  JobSeekerDetailResponse,
  { id: string; isActive: boolean },
  { rejectValue: string }
>(
  'jobSeekers/toggleStatus',
  async ({ id, isActive }, { rejectWithValue, dispatch }) => {
    try {
      const response = await jobSeekersApi.toggleJobSeekerStatus(id, isActive);
      
      // ✅ Automatically refetch all job seekers
      dispatch(fetchAllJobSeekers());
      
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to toggle status'
      );
    }
  }
);
```

## Benefits

### 1. Always Fresh Data
✅ List always shows latest data from server  
✅ No stale data issues  
✅ No manual refresh needed  

### 2. Consistent State
✅ Server is the source of truth  
✅ Handles concurrent updates  
✅ Reflects changes made by other admins  

### 3. Better User Experience
✅ Automatic updates  
✅ No page refresh needed  
✅ Immediate feedback  

## API Call Sequence

### Toggle Status Example
```
1. PATCH /admin/job-seekers/68eb43b9b7f1d34d259215c0/toggle-status
   Response: { status: "success", data: { ... } }

2. GET /admin/job-seekers/
   Response: { status: "success", data: { jobSeekers: [...], pagination: {...} } }
```

### Delete Example
```
1. DELETE /admin/job-seekers/68eb43b9b7f1d34d259215c0
   Response: { status: "success", message: "Deleted" }

2. GET /admin/job-seekers/
   Response: { status: "success", data: { jobSeekers: [...], pagination: {...} } }
```

## Network Performance

### Considerations
- **2 API calls per operation** (toggle/delete + refetch)
- **Slightly increased network usage**
- **Guaranteed data consistency**

### Optimization Options (Future)
If you want to optimize, you could:

1. **Optimistic Updates Only** (No refetch)
   ```typescript
   // Update local state immediately
   // Trust the operation succeeded
   // Risk: State may not match server
   ```

2. **Debounced Refetch** 
   ```typescript
   // Wait 500ms after operation
   // Only refetch once if multiple operations
   ```

3. **WebSocket Updates**
   ```typescript
   // Server pushes updates
   // No need to poll or refetch
   ```

## Current Behavior

### Toggle Status Flow
```typescript
const handleToggleStatus = async (jobSeeker: JobSeeker) => {
  const result = await dispatch(
    toggleJobSeekerStatus({ 
      id: jobSeeker.id, 
      isActive: !jobSeeker.isActive 
    })
  )
  
  // ✅ fetchAllJobSeekers() is called automatically inside the thunk
  // No need to call it manually here
  
  if (toggleJobSeekerStatus.fulfilled.match(result)) {
    toast.success("Status updated!")
  }
}
```

### Delete Flow
```typescript
const handleDelete = async (jobSeeker: JobSeeker) => {
  if (!confirm("Are you sure?")) return
  
  const result = await dispatch(deleteJobSeeker(jobSeeker.id))
  
  // ✅ fetchAllJobSeekers() is called automatically inside the thunk
  // No need to call it manually here
  
  if (deleteJobSeeker.fulfilled.match(result)) {
    toast.success("Deleted successfully!")
  }
}
```

## Operations WITHOUT Auto-Refetch

The following operations do NOT trigger auto-refetch:

### 1. Update Job Seeker
```typescript
dispatch(updateJobSeeker({ id, data }))
// Only updates the specific job seeker in the list
// No full refetch needed
```

### 2. Fetch Job Seeker Profile
```typescript
dispatch(fetchJobSeekerProfile(id))
// Only fetches single profile
// Doesn't affect the list
```

### 3. Search
```typescript
dispatch(searchJobSeekers(query))
// Replaces the list with search results
// No refetch needed
```

## Testing

### Verify Auto-Refetch Works

1. **Open Network Tab** in Browser DevTools
2. **Toggle a job seeker's status**
3. **Observe 2 API calls:**
   ```
   PATCH /admin/job-seekers/68eb43b9b7f1d34d259215c0/toggle-status
   GET /admin/job-seekers/
   ```
4. **Delete a job seeker**
5. **Observe 2 API calls:**
   ```
   DELETE /admin/job-seekers/68eb43b9b7f1d34d259215c0
   GET /admin/job-seekers/
   ```

### Verify Loading States

The loading states should work correctly:
```
1. Click toggle/delete
2. isUpdating/isDeleting = true (button disabled)
3. API call completes
4. isLoading = true (for refetch)
5. Refetch completes
6. isLoading = false (UI shows updated list)
```

## Error Handling

### If Toggle/Delete Fails
```typescript
// ❌ Operation fails
// fetchAllJobSeekers() is NOT called
// List remains unchanged
// Error toast shown
```

### If Toggle/Delete Succeeds but Refetch Fails
```typescript
// ✅ Operation succeeds (status toggled/item deleted)
// ❌ Refetch fails
// Old data still in list
// Error toast for refetch failure
```

## Summary

✅ **Automatic refetch** after toggle and delete  
✅ **Always fresh data** from server  
✅ **No manual refresh** needed  
✅ **Better UX** - seamless updates  
✅ **2 API calls** per operation (trade-off for consistency)  

This ensures your job seekers list is always up-to-date with the latest data from the server! 🎉

