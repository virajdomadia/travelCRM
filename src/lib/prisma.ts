import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

/**
 * Creates a tenant-bound Prisma Client. Un-bypassable by developers.
 */
export function getTenantClient(agencyId: string | null | undefined) {
    if (!agencyId) {
        throw new Error("Tenant ID (agencyId) is required for tenant operations.");
    }
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query }) {
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

/**
 * Creates a system/admin Prisma Client that bypasses RLS.
 */
export function getSystemClient() {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query }) {
                    const [, result] = await prisma.$transaction([
                        prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'true', TRUE)`,
                        query(args),
                    ]);
                    return result;
                },
            },
        },
    });
}
