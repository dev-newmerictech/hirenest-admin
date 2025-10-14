// HOC for admin layout following Dependency Inversion Principle

"use client"

import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, Building2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearAuthSession } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Job Seekers", href: "/admin/job-seekers", icon: Users },
  { name: "Companies", href: "/admin/companies", icon: Building2 },
  { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { name: "Packages", href: "/admin/packages", icon: Package },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    clearAuthSession()
    router.push("/admin/login")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center border-b border-border px-6 py-4">
            <Image src="/logo.svg" alt="HireNest Admin" width={100} height={100} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-[#4241FF] relative before:content-[''] before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:bg-[#4241FF] before:rounded-full"
                      : "text-[#2A3F5E] hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-border p-4 flex flex-row items-center justify-between">
            
            <Button
              variant="ghost"
              className="justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
            <div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-3">{children}</div>
      </main>
    </div>
  )
}
