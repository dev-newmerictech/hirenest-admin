// Role-based access control configuration
// Central config used by admin-layout.tsx (navigation filtering) and auth-guard.tsx (route protection)

import { useAppSelector } from "./store/hooks";

export type AdminRole = "super_admin" | "marketing";

/**
 * Maps each admin role to the routes they are allowed to access.
 * Adding a new role is as simple as adding a new entry here.
 */
export const roleRouteAccess: Record<AdminRole, string[]> = {
  super_admin: [
    "/admin/dashboard",
    "/admin/analytics",
    "/admin/job-seekers",
    "/admin/companies",
    "/admin/not-onboarded",
    "/admin/marketing-emails",
    "/admin/jobs",
    "/admin/campaigns",
    "/admin/reports",
    "/admin/user-map",
    "/admin/verifications",
    "/admin/feedback",
    "/admin/packages",
    "/admin/credit-costs",
    "/admin/subscriptions",
    "/admin/settings",
  ],
  marketing: [
    "/admin/dashboard",
    "/admin/analytics",
    "/admin/job-seekers",
    "/admin/companies",
    "/admin/not-onboarded",
    "/admin/marketing-emails",
    "/admin/jobs",
    "/admin/campaigns",
    "/admin/user-map",
    "/admin/settings",
  ],
};

/**
 * Default landing page after login for each role.
 */
export const defaultRouteForRole: Record<AdminRole, string> = {
  super_admin: "/admin/dashboard",
  marketing: "/admin/dashboard",
};

/**
 * Permissions per role — controls which UI actions are visible.
 */
export const rolePermissions: Record<
  AdminRole,
  { canWrite: boolean; canManageMarketing: boolean }
> = {
  super_admin: { canWrite: true, canManageMarketing: true },
  marketing: { canWrite: false, canManageMarketing: true },
};

/**
 * Hook to check if the current user has write permissions.
 * Returns false for marketing role, true for super_admin.
 */
export function useCanWrite(): boolean {
  const user = useAppSelector((state) => state.auth.user);
  if (!user) return false;
  return rolePermissions[user.adminRole]?.canWrite ?? false;
}

/**
 * Hook to check if user can manage marketing email templates.
 * Returns true for both marketing role and super_admin.
 */
export function useCanManageMarketing(): boolean {
  const user = useAppSelector((state) => state.auth.user);
  if (!user) return false;
  return rolePermissions[user.adminRole]?.canManageMarketing ?? false;
}
