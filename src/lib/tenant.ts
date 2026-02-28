import prisma from "./prisma";

/**
 * Creates a tenant-bound Prisma Client strictly enforcing PostgreSQL Row-Level Security.
 * This MUST be used for all service layer operations involving tenant models 
 * to guarantee no cross-agency data leakage.
 */
export function getTenantPrisma(agencyId: string | null | undefined) {
    if (!agencyId) {
        throw new Error("FATAL: Tenant ID (agencyId) is required for tenant operations. Request aborted.");
    }

    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query }) {
                    // Start a transaction that sets the Postgres local variable for this query
                    const [, result] = await prisma.$transaction([
                        prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${agencyId}, TRUE)`,
                        query(args),
                    ]);
                    return result;
                },
            },
        },
    });
}
