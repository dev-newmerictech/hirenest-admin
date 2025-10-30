// HOC for admin layout following Dependency Inversion Principle

"use client"

import type React from "react"
import { useState } from "react"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, Building2, Package, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearAuthSession } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Job Seekers", href: "/admin/job-seekers", icon: Users },
  { name: "Companies", href: "/admin/companies", icon: Building2 },
  { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
  // { name: "Packages", href: "/admin/packages", icon: Package },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    clearAuthSession()
    router.push("/admin/login")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Static sidebar for ≥1024px */}
      <aside className="hidden tablet:block w-64 border-r border-border bg-card">
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

      {/* Mobile/Tablet top bar and drawer sidebar for <1024px */}
      <div className="tablet:hidden fixed inset-x-0 top-0 z-20 border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <Image src="/logo.svg" alt="HireNest Admin" width={90} height={90} />
          </div>
          <div className="flex items-center gap-2">
            {/* <ThemeToggle /> */}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
              <LogOut className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[18rem]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <div className="flex items-center border-b border-border px-6 py-4">
              <Image src="/logo.svg" alt="HireNest Admin" width={100} height={100} />
            </div>
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
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-border p-4 flex flex-row items-center justify-between">
              <Button
                variant="ghost"
                className="justify-start text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setMobileOpen(false)
                  handleLogout()
                }}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
              <div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 tablet:px-6 py-16 tablet:py-3">{children}</div>
      </main>
    </div>
  )
}
