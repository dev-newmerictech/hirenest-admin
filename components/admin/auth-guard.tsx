// HOC for authentication guard

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppSelector } from "@/lib/store/hooks"
import { roleRouteAccess, defaultRouteForRole, type AdminRole } from "@/lib/rbacConfig"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      router.push("/admin/login")
      return
    }

    // Check if user has access to the current route
    const userRole: AdminRole = (user.adminRole as AdminRole) || 'super_admin'
    const allowedRoutes = roleRouteAccess[userRole] || roleRouteAccess.super_admin
    const hasAccess = allowedRoutes.some(route => pathname.startsWith(route))

    if (!hasAccess) {
      // Redirect to the default route for this role
      const fallback = defaultRouteForRole[userRole] || '/admin/dashboard'
      router.push(fallback)
      return
    }

    setIsChecking(false)
  }, [isAuthenticated, user, router, pathname])

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
