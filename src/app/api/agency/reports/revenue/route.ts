import { NextResponse } from "next/server";
import { ReportingRepository } from "@/server/repositories/reporting.repository";
import { z } from "zod";

const querySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export async function GET(req: Request) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        if (!agencyId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = querySchema.safeParse({
            startDate: searchParams.get("startDate") || undefined,
            endDate: searchParams.get("endDate") || undefined,
        });

        if (!query.success) {
            return NextResponse.json({ message: "Invalid date format" }, { status: 400 });
        }

        const repo = new ReportingRepository(agencyId);
        const data = await repo.getRevenueReport(
            query.data.startDate ? new Date(query.data.startDate) : undefined,
            query.data.endDate ? new Date(query.data.endDate) : undefined
        );

        return NextResponse.json(data);
    } catch (error) {
        console.error("Revenue Report API Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
