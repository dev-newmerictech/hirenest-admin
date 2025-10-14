/**
 * Job Seekers Redux Usage Examples
 * 
 * This file demonstrates various ways to use the job seekers Redux slice
 * in your React components.
 */

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { 
  fetchAllJobSeekers,
  searchJobSeekers,
  fetchJobSeekerProfile,
  toggleJobSeekerStatus,
  updateJobSeeker,
  deleteJobSeeker,
  setSearchQuery,
  clearError,
  resetJobSeekers
} from "@/lib/store/jobSeekersSlice"
import { JobSeeker } from "@/lib/types"

// ============================================
// Example 1: Basic Job Seekers List
// ============================================
export function JobSeekersList() {
  const dispatch = useAppDispatch()
  const { jobSeekers, isLoading, error } = useAppSelector(
    (state) => state.jobSeekers
  )

  useEffect(() => {
    dispatch(fetchAllJobSeekers())
  }, [dispatch])

  if (isLoading) return <div>Loading job seekers...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <ul>
      {jobSeekers.map((jobSeeker) => (
        <li key={jobSeeker.id}>
          {jobSeeker.name} - {jobSeeker.email}
        </li>
      ))}
    </ul>
  )
}

// ============================================
// Example 2: Job Seeker Card with Actions
// ============================================
export function JobSeekerCard({ jobSeeker }: { jobSeeker: JobSeeker }) {
  const dispatch = useAppDispatch()
  const { isUpdating, isDeleting } = useAppSelector(
    (state) => state.jobSeekers
  )

  const handleToggleStatus = async () => {
    const result = await dispatch(
      toggleJobSeekerStatus({
        id: jobSeeker.id,
        isActive: !jobSeeker.isActive
      })
    )
    
    if (toggleJobSeekerStatus.fulfilled.match(result)) {
      console.log("Status toggled successfully")
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${jobSeeker.name}?`)) return
    
    const result = await dispatch(deleteJobSeeker(jobSeeker.id))
    
    if (deleteJobSeeker.fulfilled.match(result)) {
      console.log("Job seeker deleted")
    }
  }

  return (
    <div className="border p-4 rounded">
      <h3>{jobSeeker.name}</h3>
      <p>{jobSeeker.email}</p>
      <p>Status: {jobSeeker.isActive ? "Active" : "Inactive"}</p>
      <div className="flex gap-2 mt-2">
        <button onClick={handleToggleStatus} disabled={isUpdating}>
          {jobSeeker.isActive ? "Deactivate" : "Activate"}
        </button>
        <button onClick={handleDelete} disabled={isDeleting}>
          Delete
        </button>
      </div>
    </div>
  )
}

// ============================================
// Example 3: Search Job Seekers
// ============================================
export function JobSeekersSearch() {
  const dispatch = useAppDispatch()
  const { jobSeekers, searchQuery, isLoading } = useAppSelector(
    (state) => state.jobSeekers
  )
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    dispatch(setSearchQuery(query))
  }

  // Client-side filtering
  const filteredJobSeekers = jobSeekers.filter(
    (js) =>
      js.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      js.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <input
        type="text"
        placeholder="Search job seekers..."
        value={searchQuery}
        onChange={handleSearch}
      />
      
      {isLoading ? (
        <p>Searching...</p>
      ) : (
        <ul>
          {filteredJobSeekers.map((js) => (
            <li key={js.id}>{js.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ============================================
// Example 4: Job Seeker Profile Viewer
// ============================================
export function JobSeekerProfile({ id }: { id: string }) {
  const dispatch = useAppDispatch()
  const { selectedJobSeeker, isLoading, error } = useAppSelector(
    (state) => state.jobSeekers
  )

  useEffect(() => {
    dispatch(fetchJobSeekerProfile(id))
  }, [id, dispatch])

  if (isLoading) return <div>Loading profile...</div>
  if (error) return <div>Error: {error}</div>
  if (!selectedJobSeeker) return <div>No profile found</div>

  return (
    <div>
      <h2>{selectedJobSeeker.name}</h2>
      <p>Email: {selectedJobSeeker.email}</p>
      <p>Phone: {selectedJobSeeker.phone}</p>
      <p>Status: {selectedJobSeeker.isActive ? "Active" : "Inactive"}</p>
      <p>Registered: {new Date(selectedJobSeeker.registrationDate).toLocaleDateString()}</p>
    </div>
  )
}

// ============================================
// Example 5: Edit Job Seeker Form
// ============================================
export function EditJobSeekerForm({ jobSeeker }: { jobSeeker: JobSeeker }) {
  const dispatch = useAppDispatch()
  const { isUpdating } = useAppSelector((state) => state.jobSeekers)
  
  const [formData, setFormData] = useState({
    name: jobSeeker.name,
    email: jobSeeker.email,
    phone: jobSeeker.phone
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const result = await dispatch(
      updateJobSeeker({
        id: jobSeeker.id,
        data: formData
      })
    )
    
    if (updateJobSeeker.fulfilled.match(result)) {
      alert("Updated successfully!")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div>
        <label>Phone:</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <button type="submit" disabled={isUpdating}>
        {isUpdating ? "Saving..." : "Save Changes"}
      </button>
    </form>
  )
}

// ============================================
// Example 6: Error Handling
// ============================================
export function JobSeekersWithErrorHandling() {
  const dispatch = useAppDispatch()
  const { jobSeekers, isLoading, error } = useAppSelector(
    (state) => state.jobSeekers
  )

  useEffect(() => {
    dispatch(fetchAllJobSeekers())
  }, [dispatch])

  const handleRetry = () => {
    dispatch(clearError())
    dispatch(fetchAllJobSeekers())
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={handleRetry}>Retry</button>
        <button onClick={() => dispatch(clearError())}>Dismiss</button>
      </div>
    )
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <ul>
      {jobSeekers.map((js) => (
        <li key={js.id}>{js.name}</li>
      ))}
    </ul>
  )
}

// ============================================
// Example 7: Bulk Status Toggle
// ============================================
export function BulkStatusToggle() {
  const dispatch = useAppDispatch()
  const { jobSeekers, isUpdating } = useAppSelector(
    (state) => state.jobSeekers
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleToggleAll = async () => {
    for (const id of selectedIds) {
      const jobSeeker = jobSeekers.find((js) => js.id === id)
      if (jobSeeker) {
        await dispatch(
          toggleJobSeekerStatus({
            id: jobSeeker.id,
            isActive: !jobSeeker.isActive
          })
        )
      }
    }
    setSelectedIds([])
  }

  return (
    <div>
      <button onClick={handleToggleAll} disabled={isUpdating || selectedIds.length === 0}>
        Toggle Selected ({selectedIds.length})
      </button>
      
      <ul>
        {jobSeekers.map((js) => (
          <li key={js.id}>
            <input
              type="checkbox"
              checked={selectedIds.includes(js.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds([...selectedIds, js.id])
                } else {
                  setSelectedIds(selectedIds.filter((id) => id !== js.id))
                }
              }}
            />
            {js.name} - {js.isActive ? "Active" : "Inactive"}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ============================================
// Example 8: Active/Inactive Filter
// ============================================
export function FilteredJobSeekersList() {
  const dispatch = useAppDispatch()
  const { jobSeekers, isLoading } = useAppSelector(
    (state) => state.jobSeekers
  )
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all")

  useEffect(() => {
    dispatch(fetchAllJobSeekers())
  }, [dispatch])

  const filteredJobSeekers = jobSeekers.filter((js) => {
    if (filter === "active") return js.isActive
    if (filter === "inactive") return !js.isActive
    return true
  })

  return (
    <div>
      <div className="filters">
        <button onClick={() => setFilter("all")}>All ({jobSeekers.length})</button>
        <button onClick={() => setFilter("active")}>
          Active ({jobSeekers.filter((js) => js.isActive).length})
        </button>
        <button onClick={() => setFilter("inactive")}>
          Inactive ({jobSeekers.filter((js) => !js.isActive).length})
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {filteredJobSeekers.map((js) => (
            <li key={js.id}>
              {js.name} - {js.isActive ? "✓" : "✗"}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ============================================
// Example 9: Pagination
// ============================================
export function PaginatedJobSeekersList() {
  const dispatch = useAppDispatch()
  const { jobSeekers, isLoading } = useAppSelector(
    (state) => state.jobSeekers
  )
  const [page, setPage] = useState(1)
  const perPage = 10

  useEffect(() => {
    dispatch(fetchAllJobSeekers())
  }, [dispatch])

  const totalPages = Math.ceil(jobSeekers.length / perPage)
  const startIndex = (page - 1) * perPage
  const paginatedJobSeekers = jobSeekers.slice(startIndex, startIndex + perPage)

  return (
    <div>
      <ul>
        {paginatedJobSeekers.map((js) => (
          <li key={js.id}>{js.name}</li>
        ))}
      </ul>

      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
          Next
        </button>
      </div>
    </div>
  )
}

// ============================================
// Example 10: Reset State on Unmount
// ============================================
export function JobSeekersContainer() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Fetch data on mount
    dispatch(fetchAllJobSeekers())

    // Reset state on unmount
    return () => {
      dispatch(resetJobSeekers())
    }
  }, [dispatch])

  return <JobSeekersList />
}

