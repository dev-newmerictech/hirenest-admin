/**
 * Dashboard Redux Usage Examples
 * 
 * This file demonstrates how to use the dashboard Redux slice
 * in your React components.
 */

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { 
  fetchJobSeekersCount,
  clearError,
  resetDashboard 
} from "@/lib/store/dashboardSlice"

// ============================================
// Example 1: Fetch Dashboard Stats
// ============================================
export function JobSeekersCountExample() {
  const dispatch = useAppDispatch()
  const { totalJobSeekers, totalJobProviders, isLoading, error } = useAppSelector(
    (state) => state.dashboard
  )

  useEffect(() => {
    // Fetch dashboard stats on component mount
    dispatch(fetchJobSeekersCount())
  }, [dispatch])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <h2>Job Seekers Count</h2>
      <p>{totalJobSeekers}</p>
      <h2>Job Providers</h2>
      <p>{totalJobProviders}</p>
    </div>
  )
}

// ============================================
// Example 2: Display All Dashboard Stats
// ============================================
export function DashboardStatsExample() {
  const dispatch = useAppDispatch()
  const { 
    totalJobSeekers,
    totalJobProviders, 
    totalJobs,
    totalApplications,
    isLoading 
  } = useAppSelector((state) => state.dashboard)

  useEffect(() => {
    dispatch(fetchJobSeekersCount())
  }, [dispatch])

  return (
    <div>
      <h2>Dashboard Statistics</h2>
      {isLoading ? (
        <p>Loading stats...</p>
      ) : (
        <div>
          <p>Total Job Seekers: {totalJobSeekers}</p>
          <p>Total Job Providers: {totalJobProviders}</p>
          <p>Total Jobs: {totalJobs}</p>
          <p>Total Applications: {totalApplications}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// Example 3: Manual Refresh with Button
// ============================================
export function RefreshableStatsExample() {
  const dispatch = useAppDispatch()
  const { totalJobSeekers, isLoading } = useAppSelector(
    (state) => state.dashboard
  )

  const handleRefresh = () => {
    dispatch(fetchJobSeekersCount())
  }

  return (
    <div>
      <h2>Job Seekers: {totalJobSeekers}</h2>
      <button 
        onClick={handleRefresh}
        disabled={isLoading}
      >
        {isLoading ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  )
}

// ============================================
// Example 4: Error Handling
// ============================================
export function ErrorHandlingExample() {
  const dispatch = useAppDispatch()
  const { totalJobSeekers, isLoading, error } = useAppSelector(
    (state) => state.dashboard
  )

  useEffect(() => {
    dispatch(fetchJobSeekersCount())
  }, [dispatch])

  const handleClearError = () => {
    dispatch(clearError())
  }

  const handleRetry = () => {
    dispatch(clearError())
    dispatch(fetchJobSeekersCount())
  }

  return (
    <div>
      {error && (
        <div style={{ background: 'red', color: 'white', padding: '10px' }}>
          <p>Error: {error}</p>
          <button onClick={handleClearError}>Clear Error</button>
          <button onClick={handleRetry}>Retry</button>
        </div>
      )}
      
      {isLoading && <p>Loading...</p>}
      
      {!error && !isLoading && (
        <p>Job Seekers Count: {totalJobSeekers}</p>
      )}
    </div>
  )
}

// ============================================
// Example 5: Reset Dashboard State
// ============================================
export function ResetDashboardExample() {
  const dispatch = useAppDispatch()
  const { totalJobSeekers, totalJobs } = useAppSelector((state) => state.dashboard)

  const handleReset = () => {
    // Reset all dashboard state to initial values
    dispatch(resetDashboard())
  }

  const handleFetch = () => {
    dispatch(fetchJobSeekersCount())
  }

  return (
    <div>
      <h2>Dashboard Stats</h2>
      <p>Total Job Seekers: {totalJobSeekers}</p>
      <p>Total Jobs: {totalJobs}</p>
      <div>
        <button onClick={handleFetch}>Fetch Stats</button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  )
}

// ============================================
// Example 6: Polling for Real-time Updates
// ============================================
export function PollingExample() {
  const dispatch = useAppDispatch()
  const { totalJobSeekers, totalJobs } = useAppSelector((state) => state.dashboard)

  useEffect(() => {
    // Fetch immediately
    dispatch(fetchJobSeekersCount())

    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchJobSeekersCount())
    }, 30000) // 30 seconds

    // Cleanup on unmount
    return () => clearInterval(interval)
  }, [dispatch])

  return (
    <div>
      <h2>Live Dashboard Stats</h2>
      <p>Job Seekers: {totalJobSeekers}</p>
      <p>Jobs: {totalJobs}</p>
      <small>Updates every 30 seconds</small>
    </div>
  )
}

// ============================================
// Example 7: Conditional Fetching
// ============================================
export function ConditionalFetchExample() {
  const dispatch = useAppDispatch()
  const { totalJobSeekers, isLoading } = useAppSelector(
    (state) => state.dashboard
  )
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  useEffect(() => {
    // Only fetch if user is authenticated
    if (isAuthenticated) {
      dispatch(fetchJobSeekersCount())
    }
  }, [isAuthenticated, dispatch])

  if (!isAuthenticated) {
    return <p>Please login to view statistics</p>
  }

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <p>Job Seekers: {totalJobSeekers}</p>
      )}
    </div>
  )
}

// ============================================
// Example 8: Multiple Stats with Loading States
// ============================================
export function MultipleStatsExample() {
  const dispatch = useAppDispatch()
  const { 
    totalJobSeekers,
    totalJobProviders,
    totalJobs,
    totalApplications,
    isLoading 
  } = useAppSelector((state) => state.dashboard)

  useEffect(() => {
    // Fetch dashboard stats
    dispatch(fetchJobSeekersCount())
  }, [dispatch])

  return (
    <div>
      <h2>Dashboard Overview</h2>

      <div>
        <h3>All Stats</h3>
        {isLoading ? (
          <p>Loading stats...</p>
        ) : (
          <ul>
            <li>Job Seekers: {totalJobSeekers}</li>
            <li>Job Providers: {totalJobProviders}</li>
            <li>Jobs: {totalJobs}</li>
            <li>Applications: {totalApplications}</li>
          </ul>
        )}
      </div>
    </div>
  )
}

