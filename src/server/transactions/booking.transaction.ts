import prisma from "@/lib/prisma";

interface ConvertQuotationToBookingParams {
    quotationId: string;
    agencyId: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Atomically converts a Quotation to a Booking.
 * 
 * 1. Creates a Booking record.
 * 2. Updates the Lead status to BOOKED.
 * 3. Logs the audit event.
 * 
 * @throws If quotation not found, already booked, or any step fails.
 */
export async function convertQuotationToBooking(params: ConvertQuotationToBookingParams) {
    const {
        quotationId,
        agencyId,
        userId,
        ipAddress = "Unknown",
        userAgent = "Unknown",
    } = params;

    return prisma.$transaction(async (tx) => {
        // Step 1: Fetch Quotation with Lead info
        const quotation = await tx.quotation.findFirst({
            where: {
                id: quotationId,
                agencyId,
            },
            include: {
                lead: true,
            },
        });

        if (!quotation) {
            throw new Error("Quotation not found");
        }

        if (quotation.status !== "APPROVED") {
            // Optional: You might want to allow pending too, but APPROVED is safer
            // throw new Error("Only approved quotations can be converted to bookings");
        }

        // Check if already booked
        const existingBooking = await tx.booking.findUnique({
            where: { quotationId },
        });

        if (existingBooking) {
            throw new Error("This quotation has already been converted to a booking");
        }

        // Step 2: Create Booking
        const booking = await tx.booking.create({
            data: {
                title: `Booking for ${quotation.lead.name}`,
                agencyId,
                leadId: quotation.leadId,
                quotationId: quotation.id,
                totalAmount: quotation.totalAmount,
                currency: quotation.currency,
            },
        });

        // Step 3: Update Lead Status to BOOKED
        await tx.lead.update({
            where: { id: quotation.leadId },
            data: { status: "BOOKED" },
        });

        // Step 4: Log Audit
        await tx.auditLog.create({
            data: {
                agencyId,
                userId,
                action: "BOOKING_CREATED_FROM_QUOTATION",
                entityType: "Booking",
                entityId: booking.id,
                metadata: {
                    quotationId: quotation.id,
                    leadId: quotation.leadId,
                    amount: quotation.totalAmount,
                },
                ipAddress,
                userAgent,
            },
        });

        return booking;
    });
}
