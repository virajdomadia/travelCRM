import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const password = await bcrypt.hash("LeadTest@123", 10);

        let agency = await prisma.agency.findUnique({ where: { email: "hq@leadtest.com" } });
        if (!agency) {
            agency = await prisma.agency.create({
                data: { name: "Lead Test HQ", email: "hq@leadtest.com", subscriptionPlan: "FREE" }
            });
        }

        let admin = await prisma.user.findUnique({ where: { email: "admin@leadtest.com" } });
        if (!admin) {
            admin = await prisma.user.create({
                data: {
                    email: "admin@leadtest.com",
                    password: password,
                    role: "AGENCY_ADMIN",
                    agencyId: agency.id,
                }
            });
        }

        let emp = await prisma.user.findUnique({ where: { email: "emp@leadtest.com" } });
        if (!emp) {
            emp = await prisma.user.create({
                data: {
                    email: "emp@leadtest.com",
                    password: password,
                    role: "AGENCY_EMPLOYEE",
                    agencyId: agency.id,
                }
            });
        }

        return NextResponse.json({
            message: "Lead Test Data OK",
            admin: "admin@leadtest.com",
            emp: "emp@leadtest.com",
            password: "LeadTest@123"
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
