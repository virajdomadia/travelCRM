import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const agencyId = request.headers.get("x-agency-id");
        if (!agencyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const booking = await prisma.booking.findFirst({
            where: { id, agencyId },
            include: {
                lead: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                quotation: {
                    include: {
                        lineItems: true
                    }
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error('Error fetching booking details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
