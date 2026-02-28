import { getTenantPrisma } from "@/lib/tenant";
import { Prisma } from "@prisma/client";

/**
 * LeadRepository strictly enforces tenant context for all Lead interactions.
 * It is impossible to query leads from another agency when using this layer,
 * as the underlying `getTenantPrisma` connection physically segregates Rows via Postgres RLS.
 */
export class LeadRepository {
    private db;

    constructor(agencyId: string) {
        if (!agencyId) {
            throw new Error("FATAL: LeadRepository instantiated without an agencyId.");
        }
        this.db = getTenantPrisma(agencyId);
    }

    async findById(id: string) {
        return this.db.lead.findUnique({
            where: { id },
            include: {
                notes: true,
                assignedTo: {
                    select: { id: true, email: true }
                }
            }
        });
    }

    async findAll(args?: Prisma.LeadFindManyArgs) {
        // By default, filter out soft-deleted leads unless specifically asked
        const queryArgs = args || {};
        queryArgs.where = {
            ...queryArgs.where,
            isDeleted: false
        };

        return this.db.lead.findMany(queryArgs);
    }

    async create(data: Prisma.LeadUncheckedCreateInput) {
        return this.db.lead.create({ data });
    }

    async update(id: string, data: Prisma.LeadUpdateInput) {
        return this.db.lead.update({
            where: { id },
            data
        });
    }

    async softDelete(id: string, auditUserId: string) {
        return this.db.lead.update({
            where: { id },
            data: {
                isDeleted: true,
            }
        });
    }
}
