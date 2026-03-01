import { NextResponse } from 'next/server';
import { QuotationRepository } from '@/features/quotations/repositories/quotation.repository';
import { generateQuotationPDF } from '@/features/quotations/utils/pdf';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const agencyId = request.headers.get("x-agency-id");

        if (!agencyId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const quotation = await QuotationRepository.getById(id, agencyId);

        if (!quotation) {
            return new NextResponse("Quotation Not Found", { status: 404 });
        }

        const pdfBuffer = await generateQuotationPDF(quotation);

        return new Response(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="quotation_v${quotation.version}_${quotation.leadNameSnapshot || 'client'}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error('Error generating PDF:', error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
