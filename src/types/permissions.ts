import { Role, ROLES } from "./roles";

/**
 * Defines which actions exist in the system.
 */
export const PERMISSIONS = {
    // Leads
    LEADS_READ: "leads:read",
    LEADS_WRITE: "leads:write",
    LEADS_DELETE: "leads:delete",

    // Employees
    EMPLOYEES_READ: "employees:read",
    EMPLOYEES_WRITE: "employees:write",
    EMPLOYEES_DELETE: "employees:delete",

    // Bookings
    BOOKINGS_READ: "bookings:read",
    BOOKINGS_WRITE: "bookings:write",

    // Agency Management
    AGENCY_MANAGE: "agency:manage",

    // Super Admin Only
    SUPER_ADMIN_ACCESS: "super_admin:access",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Maps each role to the set of permissions it possesses.
 * Use `hasPermission(role, permission)` from `lib/rbac.ts` for runtime checks.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS) as Permission[],

    [ROLES.AGENCY_ADMIN]: [
        PERMISSIONS.LEADS_READ,
        PERMISSIONS.LEADS_WRITE,
        PERMISSIONS.LEADS_DELETE,
        PERMISSIONS.EMPLOYEES_READ,
        PERMISSIONS.EMPLOYEES_WRITE,
        PERMISSIONS.EMPLOYEES_DELETE,
        PERMISSIONS.BOOKINGS_READ,
        PERMISSIONS.BOOKINGS_WRITE,
        PERMISSIONS.AGENCY_MANAGE,
    ],

    [ROLES.AGENCY_EMPLOYEE]: [
        PERMISSIONS.LEADS_READ,
        PERMISSIONS.LEADS_WRITE,
        PERMISSIONS.BOOKINGS_READ,
        PERMISSIONS.BOOKINGS_WRITE,
    ],
};
