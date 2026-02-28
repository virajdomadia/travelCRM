import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const password = await bcrypt.hash("AgencyAdmin@123", 10);

        let agency = await prisma.agency.findUnique({ where: { email: "agency@test.com" } });
        if (!agency) {
            agency = await prisma.agency.create({
                data: { name: "Test Agency", email: "agency@test.com", subscriptionPlan: "FREE" }
            });
        }

        let admin = await prisma.user.findUnique({ where: { email: "admin@testagency.com" } });
        if (!admin) {
            admin = await prisma.user.create({
                data: {
                    email: "admin@testagency.com",
                    password: password,
                    role: "AGENCY_ADMIN",
                    agencyId: agency.id,
                }
            });
        }

        return NextResponse.json({ message: "Test Agency and Admin OK", email: admin.email, password: "AgencyAdmin@123" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
