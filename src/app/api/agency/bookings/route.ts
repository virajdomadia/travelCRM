import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const agencyId = request.headers.get("x-agency-id");
        if (!agencyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bookings = await prisma.booking.findMany({
            where: { agencyId },
            include: {
                lead: { select: { name: true, email: true } },
                quotation: { select: { version: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
