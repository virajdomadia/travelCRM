import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const userId = req.headers.get("x-user-id");
        const agencyId = req.headers.get("x-agency-id");

        if (!userId || !agencyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { bookingId, paymentAmount, paymentDate, status } = await req.json();

        if (!bookingId || !paymentAmount) {
            return NextResponse.json({ error: "Booking ID and Payment Amount are required" }, { status: 400 });
        }

        const payment = await prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findFirst({
                where: { id: bookingId, agencyId },
            });

            if (!booking) {
                throw new Error("Booking not found");
            }

            const newPayment = await tx.payment.create({
                data: {
                    bookingId,
                    agencyId,
                    paymentAmount: parseInt(paymentAmount),
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                    status: status || "PENDING",
                },
            });

            await tx.auditLog.create({
                data: {
                    agencyId,
                    userId,
                    action: "PAYMENT_LOGGED",
                    entityType: "Payment",
                    entityId: newPayment.id,
                    metadata: {
                        bookingId,
                        amount: paymentAmount,
                    },
                    ipAddress: req.headers.get("x-forwarded-for") || "unknown",
                    userAgent: req.headers.get("user-agent") || "unknown",
                },
            });

            return newPayment;
        });

        return NextResponse.json({
            message: "Payment logged successfully",
            payment,
        });
    } catch (error: any) {
        console.error("Payment logging error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to log payment" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        if (!agencyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const bookingId = searchParams.get("bookingId");

        const where: any = { agencyId };
        if (bookingId) {
            where.bookingId = bookingId;
        }

        const payments = await prisma.payment.findMany({
            where,
            include: {
                booking: true,
            },
            orderBy: {
                paymentDate: "desc",
            },
        });

        return NextResponse.json(payments);
    } catch (error: any) {
        console.error("Payment fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch payments" },
            { status: 500 }
        );
    }
}
