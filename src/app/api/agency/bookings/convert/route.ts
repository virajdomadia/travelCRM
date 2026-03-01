import { NextResponse } from "next/server";
import { convertQuotationToBooking } from "@/server/transactions/booking.transaction";

export async function POST(req: Request) {
    try {
        const userId = req.headers.get("x-user-id");
        const agencyId = req.headers.get("x-agency-id");

        if (!userId || !agencyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { quotationId } = await req.json();

        if (!quotationId) {
            return NextResponse.json({ error: "Quotation ID is required" }, { status: 400 });
        }

        const booking = await convertQuotationToBooking({
            quotationId,
            agencyId,
            userId,
            ipAddress: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
        });

        return NextResponse.json({
            message: "Quotation converted to booking successfully",
            booking,
        });
    } catch (error: any) {
        console.error("Booking conversion error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to convert quotation to booking" },
            { status: 500 }
        );
    }
}
