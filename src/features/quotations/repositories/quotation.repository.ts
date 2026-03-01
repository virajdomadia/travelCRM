import { QuotationStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { CreateQuotationInput, QuotationWithItems } from '../types';

export class QuotationRepository {
    /**
     * Fetches a single quotation (including items and relations)
     */
    static async getById(id: string, agencyId: string): Promise<QuotationWithItems | null> {
        return await prisma.quotation.findFirst({
            where: {
                id,
                agencyId,
            },
            include: {
                lineItems: true,
            },
        }) as QuotationWithItems | null;
    }

    /**
     * Fetches the latest version of a quotation for a lead
     */
    static async getLatestByLeadId(leadId: string, agencyId: string): Promise<QuotationWithItems | null> {
        return await prisma.quotation.findFirst({
            where: {
                leadId,
                agencyId,
                isLatest: true,
            },
            include: {
                lineItems: true,
            },
        }) as QuotationWithItems | null;
    }

    /**
     * Atomically creates a quotation, appending version if it already exists.
     * Ensures the `isLatest` flag accurately rotates.
     */
    static async saveNewVersion(
        agencyId: string,
        input: CreateQuotationInput
    ): Promise<QuotationWithItems> {
        return await prisma.$transaction(async (tx) => {
            // 1. Snapshot Parent Entities
            const lead = await tx.lead.findUnique({
                where: { id: input.leadId, agencyId },
            });
            const agency = await tx.agency.findUnique({
                where: { id: agencyId },
            });

            if (!lead || !agency) {
                throw new Error('Lead or Agency not found');
            }

            // 2. Determine previous version and lock check
            const previousVersion = await tx.quotation.findFirst({
                where: {
                    leadId: input.leadId,
                    agencyId,
                    isLatest: true,
                },
            });

            if (previousVersion && previousVersion.status === QuotationStatus.APPROVED) {
                throw new Error('Cannot update an APPROVED quotation.');
            }

            const nextVersionNumber = previousVersion ? previousVersion.version + 1 : 1;

            // 3. Mark the old one as NOT latest
            if (previousVersion) {
                await tx.quotation.updateMany({
                    where: {
                        leadId: input.leadId,
                        agencyId,
                        isLatest: true,
                    },
                    data: {
                        isLatest: false,
                    },
                });
            }

            // 4. Create the new quotation
            const newQuotation = await tx.quotation.create({
                data: {
                    leadId: input.leadId,
                    agencyId,
                    version: nextVersionNumber,
                    isLatest: true,
                    totalAmount: input.totalAmount,
                    totalCost: input.totalCost,
                    totalRevenue: input.totalRevenue,
                    profit: input.profit,
                    currency: input.currency || 'INR',
                    validUntil: input.validUntil,
                    leadNameSnapshot: lead.name,
                    agencyNameSnapshot: agency.name,
                    lineItems: {
                        create: input.lineItems.map((li) => ({
                            agencyId,
                            name: li.name,
                            cost: li.cost,
                            margin: li.margin,
                            finalAmount: li.finalAmount,
                        })),
                    },
                },
                include: {
                    lineItems: true,
                },
            });

            return newQuotation as QuotationWithItems;
        });
    }

    /**
     * Update internal DB fields like URL without bumping version
     */
    static async updateFields(
        id: string,
        agencyId: string,
        data: { pdfUrl?: string; status?: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' }
    ) {
        return await prisma.quotation.update({
            where: {
                id,
                agencyId,
            },
            data: {
                ...data,
                status: data.status as QuotationStatus | undefined
            },
        });
    }
}
