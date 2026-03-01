import { NextResponse } from 'next/server';
import { QuotationService } from '@/features/quotations/services/quotation.service';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request
) {
    try {
        const agencyId = request.headers.get("x-agency-id");
        const userId = request.headers.get("x-user-id");

        if (!agencyId || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { leadId, lineItems, validUntil, currency } = await request.json();

        if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
            return NextResponse.json(
                { error: 'At least one line item is required' },
                { status: 400 }
            );
        }

        const quotation = await QuotationService.createQuotationVersion(
            agencyId,
            leadId,
            lineItems,
            validUntil ? new Date(validUntil) : undefined,
            currency
        );

        return NextResponse.json({ data: quotation }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating quotation:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: Request
) {
    try {
        const agencyId = request.headers.get("x-agency-id");
        const userId = request.headers.get("x-user-id");

        if (!agencyId || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const leadId = url.searchParams.get('leadId');

        const whereClause: any = {
            agencyId: agencyId,
            isLatest: true,
        };

        if (leadId) {
            whereClause.leadId = leadId;
        }

        const quotations = await prisma.quotation.findMany({
            where: whereClause,
            include: {
                lineItems: true,
                lead: {
                    select: { name: true }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ data: quotations });

    } catch (error) {
        console.error('Error fetching quotations:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
