import { getTenantPrisma } from "@/lib/tenant";
import { Prisma } from "@prisma/client";

/**
 * LeadRepository strictly enforces tenant context for all Lead interactions.
 * Rule: NEVER calls prisma.lead.delete() — always soft-deletes via `deletedAt`.
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
        return this.db.lead.findFirst({
            where: { id, deletedAt: null },
            include: {
                notes: { where: { deletedAt: null } },
                assignedTo: {
                    select: { id: true, email: true }
                }
            }
        });
    }

    async findAll(args?: Prisma.LeadFindManyArgs) {
        const queryArgs = args || {};
        queryArgs.where = {
            ...queryArgs.where,
            deletedAt: null, // Always filter soft-deleted leads
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

    /**
     * Soft delete — sets deletedAt. NEVER physically removes the row.
     */
    async softDelete(id: string) {
        return this.db.lead.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
