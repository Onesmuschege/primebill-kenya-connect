import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type UserRole = 'admin' | 'subadmin' | 'client';

interface RolePermissions {
  canManageUsers: boolean;
  canManagePlans: boolean;
  canManageRouters: boolean;
  canViewReports: boolean;
  canManagePayments: boolean;
  canAccessBilling: boolean;
  canViewAllClients: boolean;
  canManageSubscriptions: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canManageUsers: true,
    canManagePlans: true,
    canManageRouters: true,
    canViewReports: true,
    canManagePayments: true,
    canAccessBilling: true,
    canViewAllClients: true,
    canManageSubscriptions: true,
  },
  subadmin: {
    canManageUsers: false,
    canManagePlans: false,
    canManageRouters: false,
    canViewReports: true,
    canManagePayments: true,
    canAccessBilling: true,
    canViewAllClients: true,
    canManageSubscriptions: true,
  },
  client: {
    canManageUsers: false,
    canManagePlans: false,
    canManageRouters: false,
    canViewReports: false,
    canManagePayments: false,
    canAccessBilling: true,
    canViewAllClients: false,
    canManageSubscriptions: false,
  },
};

export const useRoleAccess = () => {
  const { user } = useAuth();

  const userRole = (user?.role as UserRole) || 'client';
  const permissions = useMemo(() => ROLE_PERMISSIONS[userRole], [userRole]);

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return permissions[permission];
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(userRole);
  };

  const isAdmin = userRole === 'admin';
  const isSubAdmin = userRole === 'subadmin';
  const isClient = userRole === 'client';
  const isStaff = isAdmin || isSubAdmin;

  return {
    userRole,
    permissions,
    hasPermission,
    hasAnyRole,
    isAdmin,
    isSubAdmin,
    isClient,
    isStaff,
  };
};