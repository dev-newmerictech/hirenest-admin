// HOC for admin layout following Dependency Inversion Principle

"use client";

import type React from "react";
import { useState } from "react";

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, Building2, Package, Menu, Coins, CreditCard, Flag, ShieldCheck, MessageSquare, Map as MapIcon, UserX, BarChart3, Mail, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearAuthSession } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAppSelector } from "@/lib/store/hooks"
import { roleRouteAccess, type AdminRole } from "@/lib/rbacConfig"

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AdminLogoProps {
  width: number;
  height: number;
}

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Analytics & UTMs", href: "/admin/analytics", icon: BarChart3 },
  { name: "Job Seekers", href: "/admin/job-seekers", icon: Users },
  { name: "Companies", href: "/admin/companies", icon: Building2 },
  { name: "Not Onboarded", href: "/admin/not-onboarded", icon: UserX },
  { name: "Emails", href: "/admin/marketing-emails", icon: Mail },
  { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { name: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
  { name: "Reports", href: "/admin/reports", icon: Flag },
  { name: "Global Map", href: "/admin/user-map", icon: MapIcon },
  { name: "Verifications", href: "/admin/verifications", icon: ShieldCheck },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { name: "Packages", href: "/admin/packages", icon: Package },
  { name: "Credit Costs", href: "/admin/credit-costs", icon: Coins },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminLogo({ width, height }: AdminLogoProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (logoFailed) {
    return (
      <div
        className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold tracking-wide text-primary"
        aria-label="HireNest Admin"
      >
        HIRENEST
      </div>
    );
  }

  return (
    <Image
      src="/logo.svg"
      alt="HireNest Admin"
      width={width}
      height={height}
      className="h-auto w-auto max-w-full"
      priority
      onError={() => setLogoFailed(true)}
    />
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAppSelector((state) => state.auth)

  // Filter navigation items based on user's admin role
  const userRole: AdminRole = (user?.adminRole as AdminRole) || 'super_admin'
  const allowedRoutes = roleRouteAccess[userRole] || roleRouteAccess.super_admin
  const filteredNavigation = navigation.filter(item => allowedRoutes.includes(item.href))

  const handleLogout = () => {
    clearAuthSession();
    router.push("/admin/login");
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Static sidebar for ≥1024px */}
      <aside className="hidden tablet:block w-64 border-r border-border/80 bg-sidebar/80 backdrop-blur-md">
        <div className="flex h-full flex-col">
          {/* Header & Logo */}
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <div className="flex items-center gap-2">
              <AdminLogo width={95} height={95} />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/25 font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout Bottom Bar */}
          <div className="border-t border-border/80 p-3 space-y-2 bg-sidebar">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {user?.email ? user.email.slice(0, 2).toUpperCase() : "AD"}
                </div>
                <div className="truncate text-xs">
                  <p className="font-medium text-foreground truncate">{user?.email || "Admin"}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{userRole.replace('_', ' ')}</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile/Tablet top bar and drawer sidebar for <1024px */}
      <div className="tablet:hidden fixed inset-x-0 top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <AdminLogo width={90} height={90} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[18rem] bg-sidebar border-r border-border/80">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
              <AdminLogo width={95} height={95} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/25 font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border/80 p-3 space-y-2 bg-sidebar">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto px-4 tablet:px-8 py-16 tablet:py-6 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
