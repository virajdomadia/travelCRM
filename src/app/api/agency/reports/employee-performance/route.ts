import { NextResponse } from "next/server";
import { ReportingRepository } from "@/server/repositories/reporting.repository";

export async function GET(req: Request) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        if (!agencyId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const repo = new ReportingRepository(agencyId);
        const data = await repo.getEmployeePerformance();

        return NextResponse.json(data);
    } catch (error) {
        console.error("Employee Performance API Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
