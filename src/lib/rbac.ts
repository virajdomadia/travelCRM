import { Role } from "./roles";

// Define a hierarchy where SUPER_ADMIN > AGENCY_ADMIN > AGENCY_EMPLOYEE
// Higher index means more privilege.
const roleHierarchy: Record<Role, number> = {
    [Role.AGENCY_EMPLOYEE]: 10,
    [Role.AGENCY_ADMIN]: 50,
    [Role.SUPER_ADMIN]: 100,
};

/**
 * Checks if a user's role satisfies the required minimum role.
 */
export function hasPermission(userRole: Role | string, requiredMinimumRole: Role): boolean {
    const userLevel = roleHierarchy[userRole as Role] || 0;
    const requiredLevel = roleHierarchy[requiredMinimumRole];

    return userLevel >= requiredLevel;
}

/**
 * Validates if the user is a super admin
 */
export function isSuperAdmin(role: string): boolean {
    return role === Role.SUPER_ADMIN;
}

/**
 * Validates if the user has agency admin rights
 */
export function isAgencyAdmin(role: string): boolean {
    return hasPermission(role, Role.AGENCY_ADMIN);
}
