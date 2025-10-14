# Pagination Feature

## Overview
The Job Seekers page now includes full pagination support with server-side page management and a beautiful UI.

## Features

### ✅ Server-Side Pagination
- API handles pagination logic
- Efficient data loading (10 items per page)
- Reduces initial load time

### ✅ Smart Page Navigation
- Previous/Next buttons
- Direct page number selection
- Ellipsis for large page counts
- Disabled states for first/last pages

### ✅ Page Count Display
Shows "Showing X to Y of Z job seekers"

### ✅ Auto-Reset on Search
When user searches, pagination resets to page 1

### ✅ Smooth Scrolling
Page changes scroll to top smoothly

## Implementation

### 1. API Layer (`lib/api/jobSeekers.ts`)
```typescript
getAllJobSeekers: async (page: number = 1, limit: number = 10) => {
  return api.get(`/admin/job-seekers/?page=${page}&limit=${limit}`);
}
```

**API Request:**
```
GET https://api-dev.hirenest.ai/admin/job-seekers/?page=1&limit=10
```

**API Response:**
```json
{
  "status": "success",
  "data": {
    "jobSeekers": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 46,
      "itemsPerPage": 10
    }
  }
}
```

### 2. Redux Layer (`lib/store/jobSeekersSlice.ts`)
```typescript
export const fetchAllJobSeekers = createAsyncThunk(
  'jobSeekers/fetchAll',
  async (params: { page?: number; limit?: number } | void) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    return await jobSeekersApi.getAllJobSeekers(page, limit);
  }
);
```

### 3. Component Layer (`app/admin/job-seekers/page.tsx`)

#### State Management
```typescript
const [currentPage, setCurrentPage] = useState(1)
const { pagination } = useAppSelector((state) => state.jobSeekers)
```

#### Fetch on Page Change
```typescript
useEffect(() => {
  dispatch(fetchAllJobSeekers({ page: currentPage, limit: 10 }))
}, [currentPage])
```

#### Page Change Handler
```typescript
const handlePageChange = (page: number) => {
  setCurrentPage(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
```

## UI Components

### Pagination Controls
```tsx
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />
    </PaginationItem>
    
    {/* Page numbers */}
    {getPageNumbers().map((page) => (
      <PaginationItem key={page}>
        {page === 'ellipsis' ? (
          <PaginationEllipsis />
        ) : (
          <PaginationLink
            onClick={() => handlePageChange(page)}
            isActive={page === currentPage}
          >
            {page}
          </PaginationLink>
        )}
      </PaginationItem>
    ))}
    
    <PaginationItem>
      <PaginationNext
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

### Info Display
```tsx
<div className="text-sm text-muted-foreground">
  Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
  {Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
  {totalItems} job seekers
</div>
```

## Page Number Logic

### Smart Ellipsis
The `getPageNumbers()` function creates an intelligent page display:

```typescript
// For totalPages <= 7: Show all pages
[1, 2, 3, 4, 5, 6, 7]

// For totalPages > 7 and currentPage near start:
[1, 2, 3, 4, '...', 10]

// For totalPages > 7 and currentPage in middle:
[1, '...', 4, 5, 6, '...', 10]

// For totalPages > 7 and currentPage near end:
[1, '...', 7, 8, 9, 10]
```

### Algorithm
```typescript
const getPageNumbers = () => {
  const { currentPage, totalPages } = pagination
  const pages: (number | 'ellipsis')[] = []
  
  if (totalPages <= 7) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Show first page
    pages.push(1)
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      pages.push('ellipsis')
    }
    
    // Show pages around current
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis')
    }
    
    // Show last page
    pages.push(totalPages)
  }
  
  return pages
}
```

## Search Integration

### Auto-Reset on Search
```typescript
const handleSearchChange = (value: string) => {
  dispatch(setSearchQuery(value))
  
  // Reset to page 1 when searching
  if (currentPage !== 1) {
    setCurrentPage(1)
  }
}
```

### Hide Pagination During Search
```typescript
{pagination && pagination.totalPages > 1 && !searchQuery && (
  <Pagination>...</Pagination>
)}
```

**Reason:** Search uses client-side filtering, so server pagination doesn't apply.

## Visual States

### Active Page
```tsx
<PaginationLink isActive={page === currentPage}>
  {page}
</PaginationLink>
```
- **Active:** Outlined style, bold text
- **Inactive:** Ghost style, normal text

### Disabled Buttons
```tsx
<PaginationPrevious
  className={
    currentPage === 1
      ? 'pointer-events-none opacity-50'
      : 'cursor-pointer'
  }
/>
```
- **Disabled:** 50% opacity, no pointer events
- **Enabled:** Full opacity, cursor pointer

## User Experience

### Flow
```
User lands on page
    ↓
Loads page 1 (10 items)
    ↓
User clicks page 3
    ↓
Fetches page 3 from API
    ↓
Scrolls to top smoothly
    ↓
Shows items 21-30 of 46
```

### Loading States
```
Page change clicked
    ↓
isLoading = true
    ↓
Show loading skeleton
    ↓
Data fetched
    ↓
isLoading = false
    ↓
Show new page data
```

## Performance

### Benefits
✅ **Reduced Initial Load** - Only loads 10 items at a time  
✅ **Less Memory Usage** - Doesn't load all 46+ items  
✅ **Faster Rendering** - Smaller DOM tree  
✅ **Better UX** - Quick page transitions  

### Trade-offs
- Requires API call per page change
- Can't search across all pages (search is client-side on current page)

## API Calls per Action

### Page Navigation
```
Click page 2 → GET /admin/job-seekers/?page=2&limit=10
Click page 3 → GET /admin/job-seekers/?page=3&limit=10
```

### Toggle/Delete with Auto-Refetch
```
Toggle status → PATCH /admin/job-seekers/:id/toggle-status
              → GET /admin/job-seekers/?page=1&limit=10  (refetch)
```

## Configuration

### Items Per Page
Currently hardcoded to **10 items per page**.

To change:
```typescript
// In app/admin/job-seekers/page.tsx
dispatch(fetchAllJobSeekers({ page: currentPage, limit: 20 })) // Change to 20
```

### Future Enhancement: Dynamic Items Per Page
```typescript
const [itemsPerPage, setItemsPerPage] = useState(10)

<select onChange={(e) => setItemsPerPage(Number(e.target.value))}>
  <option value="10">10 per page</option>
  <option value="25">25 per page</option>
  <option value="50">50 per page</option>
</select>
```

## Testing

### Verify Pagination Works

1. **Navigate to Job Seekers page**
2. **Verify page 1 loads** (should show "Showing 1 to 10 of 46")
3. **Click page 2**
   - Network tab should show: `GET /admin/job-seekers/?page=2&limit=10`
   - Should show "Showing 11 to 20 of 46"
4. **Click Previous**
   - Should go back to page 1
   - Previous button should be disabled
5. **Click Next multiple times**
   - Should navigate through pages
   - Last page Next button should be disabled
6. **Search for a name**
   - Pagination should hide
   - Should show filtered results
7. **Clear search**
   - Should return to page 1
   - Pagination should reappear

### Edge Cases

**Only 1 page of data:**
- Pagination doesn't show (totalPages === 1)

**Exactly 10 items:**
- Shows page 1 only
- No pagination controls

**During search:**
- Pagination hidden
- Client-side filtering active

## Accessibility

### ARIA Labels
```tsx
<PaginationPrevious aria-label="Go to previous page" />
<PaginationNext aria-label="Go to next page" />
<PaginationLink aria-current={isActive ? 'page' : undefined} />
```

### Keyboard Navigation
- Tab through pagination controls
- Enter/Space to activate page links
- Focus visible on active element

### Screen Readers
- "Go to previous page" announcement
- "Go to next page" announcement
- "Page X" for page numbers
- "Current page" for active page

## Summary

✅ **Server-side pagination** with 10 items per page  
✅ **Beautiful UI** with shadcn pagination components  
✅ **Smart page numbers** with ellipsis for large page counts  
✅ **Auto-reset** on search  
✅ **Smooth scrolling** on page change  
✅ **Loading states** during transitions  
✅ **Accessible** with ARIA labels  
✅ **Responsive** design  

The Job Seekers page now efficiently handles large datasets with professional pagination! 🎉

