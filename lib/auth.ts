// Authentication utilities

export interface AuthSession {
  user: {
    id: string
    email: string
    role: "admin"
  }
  expiresAt: string
}

export function setAuthSession(session: AuthSession): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_session", JSON.stringify(session))
  }
}

export function getAuthSession(): AuthSession | null {
  if (typeof window !== "undefined") {
    const session = localStorage.getItem("admin_session")
    if (session) {
      const parsed = JSON.parse(session)
      // Check if session is expired
      if (new Date(parsed.expiresAt) > new Date()) {
        return parsed
      }
      // Clear expired session
      clearAuthSession()
    }
  }
  return null
}

export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_session")
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }
}

export function isAuthenticated(): boolean {
  return getAuthSession() !== null
}
