import { NextResponse } from "next/server";
import { ReportingRepository } from "@/server/repositories/reporting.repository";

export async function GET(req: Request) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        if (!agencyId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const repo = new ReportingRepository(agencyId);
        const summary = await repo.getDashboardSummary();

        return NextResponse.json(summary);
    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
