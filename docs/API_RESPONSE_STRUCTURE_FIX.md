# API Response Structure Fix

## Issue
The job seekers API returned a different structure than initially expected, causing a `TypeError: data.map is not a function`.

## Root Cause

### Expected Response (Initial Implementation)
```json
{
  "status": "success",
  "data": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "registrationDate": "2024-01-01T00:00:00Z",
      "isActive": true
    }
  ]
}
```

### Actual Response (From Backend)
```json
{
  "status": "success",
  "data": {
    "jobSeekers": [
      {
        "_id": "68eb43b9b7f1d34d259215c0",
        "name": "Pravin Jagadale",
        "email": "pravinjagadale2809@gmail.com",
        "mobile": {
          "countryCode": 91,
          "mobileNumber": 9359630080
        },
        "isActive": true,
        "createdAt": "2025-10-12T05:59:21.906Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 46,
      "itemsPerPage": 10
    }
  }
}
```

## Key Differences

### 1. Array Location
- **Expected:** `data` is directly an array
- **Actual:** `data.jobSeekers` is the array

### 2. Job Seeker Object Structure
| Field | Expected | Actual |
|-------|----------|--------|
| ID | `id` | `_id` |
| Phone | `phone` (string) | `mobile` (object with `countryCode` and `mobileNumber`) |
| Registration | `registrationDate` | `createdAt` |

### 3. Additional Data
- **Actual response includes:** `pagination` object with page info

## Solution

### 1. Added API Response Interface (`lib/types.ts`)
```typescript
export interface JobSeekerAPIResponse {
  _id: string
  name: string
  email: string
  mobile: {
    countryCode: number
    mobileNumber: number
  }
  isActive: boolean
  createdAt: string
}
```

### 2. Updated API Response Type (`lib/api/jobSeekers.ts`)
```typescript
export interface JobSeekersListResponse {
  status: string;
  data: {
    jobSeekers: JobSeekerAPIResponse[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}
```

### 3. Created Transform Function (`lib/api/jobSeekers.ts`)
```typescript
export function transformJobSeeker(apiJobSeeker: JobSeekerAPIResponse): JobSeeker {
  return {
    id: apiJobSeeker._id,
    name: apiJobSeeker.name,
    email: apiJobSeeker.email,
    phone: `+${apiJobSeeker.mobile.countryCode}${apiJobSeeker.mobile.mobileNumber}`,
    registrationDate: apiJobSeeker.createdAt,
    isActive: apiJobSeeker.isActive,
  };
}
```

### 4. Updated Redux Slice (`lib/store/jobSeekersSlice.ts`)
```typescript
// Before
.addCase(fetchAllJobSeekers.fulfilled, (state, action) => {
  state.jobSeekers = action.payload.data; // ❌ Error: data is not an array
})

// After
.addCase(fetchAllJobSeekers.fulfilled, (state, action) => {
  // Transform API response to internal format
  state.jobSeekers = action.payload.data.jobSeekers.map(transformJobSeeker);
  state.pagination = action.payload.data.pagination;
})
```

### 5. Added Pagination Support
```typescript
interface JobSeekersState {
  jobSeekers: JobSeeker[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
  // ... other fields
}
```

## Files Modified

### 1. `lib/types.ts`
- ✅ Added `JobSeekerAPIResponse` interface

### 2. `lib/api/jobSeekers.ts`
- ✅ Updated `JobSeekersListResponse` interface
- ✅ Added `transformJobSeeker()` function
- ✅ Updated all API function return types

### 3. `lib/store/jobSeekersSlice.ts`
- ✅ Added pagination to state
- ✅ Import `transformJobSeeker` function
- ✅ Transform API responses in all fulfilled actions:
  - `fetchAllJobSeekers`
  - `searchJobSeekers`
  - `fetchJobSeekerProfile`
  - `toggleJobSeekerStatus`
  - `updateJobSeeker`

## Phone Number Format

The API returns phone as an object:
```json
{
  "mobile": {
    "countryCode": 91,
    "mobileNumber": 9359630080
  }
}
```

We transform it to a string:
```typescript
phone: `+${apiJobSeeker.mobile.countryCode}${apiJobSeeker.mobile.mobileNumber}`
// Result: "+919359630080"
```

## Pagination Data

Now available in Redux state:
```typescript
const { pagination } = useAppSelector((state) => state.jobSeekers)

console.log(pagination?.currentPage)   // 1
console.log(pagination?.totalPages)    // 5
console.log(pagination?.totalItems)    // 46
console.log(pagination?.itemsPerPage)  // 10
```

## Benefits of This Approach

### 1. Separation of Concerns
- **API Layer:** Handles backend response format
- **App Layer:** Uses consistent internal format
- **Transform Layer:** Converts between formats

### 2. Type Safety
- Full TypeScript support for both API and internal formats
- Compiler catches mismatches

### 3. Future-Proof
- If API changes, update transform function only
- Rest of app continues to work

### 4. Consistency
- All components use same data structure
- Easy to understand and maintain

## Testing

After the fix:
1. ✅ Navigate to `/admin/job-seekers`
2. ✅ Data loads correctly
3. ✅ Phone numbers display as "+countrycodemobilenumber"
4. ✅ Registration dates display correctly
5. ✅ Search, edit, delete all work
6. ✅ Pagination data available (for future features)

## Example Usage

### Accessing Job Seekers
```typescript
const { jobSeekers, pagination } = useAppSelector(
  (state) => state.jobSeekers
)

// Job seekers are already transformed
jobSeekers.forEach(js => {
  console.log(js.id)    // Transformed from _id
  console.log(js.phone) // Formatted: "+919359630080"
  console.log(js.registrationDate) // From createdAt
})
```

### Using Pagination
```typescript
const { pagination } = useAppSelector((state) => state.jobSeekers)

if (pagination) {
  console.log(`Page ${pagination.currentPage} of ${pagination.totalPages}`)
  console.log(`Showing ${jobSeekers.length} of ${pagination.totalItems} total`)
}
```

## Future Enhancements

With pagination data now available, you can implement:
1. Page navigation controls
2. "Load more" button
3. Items per page selector
4. Total count display
5. Jump to page feature

## Summary

✅ **Fixed:** `TypeError: data.map is not a function`  
✅ **Added:** Phone number formatting  
✅ **Added:** Pagination support  
✅ **Improved:** Type safety with separate API/internal interfaces  
✅ **Maintained:** Backward compatibility with existing code  

The job seekers page now works correctly with the actual API response format! 🎉

