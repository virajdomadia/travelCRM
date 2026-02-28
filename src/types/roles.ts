/**
 * Centralized role definitions — single source of truth.
 * Mirrors the Prisma `Role` enum. Use this for all runtime role checks.
 */
export const ROLES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    AGENCY_ADMIN: "AGENCY_ADMIN",
    AGENCY_EMPLOYEE: "AGENCY_EMPLOYEE",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
