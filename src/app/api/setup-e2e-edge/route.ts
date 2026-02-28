import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const passwordHash = await bcrypt.hash("Test@1234", 10);

        const agency1 = await prisma.agency.upsert({
            where: { email: "agency1@edge.com" },
            create: { name: "Agency 1", email: "agency1@edge.com", subscriptionPlan: "FREE" },
            update: {}
        });

        const agency2 = await prisma.agency.upsert({
            where: { email: "agency2@edge.com" },
            create: { name: "Agency 2", email: "agency2@edge.com", subscriptionPlan: "FREE" },
            update: {}
        });

        await prisma.user.upsert({
            where: { email: "admin@agency1.com" },
            create: { email: "admin@agency1.com", password: passwordHash, role: "AGENCY_ADMIN", agencyId: agency1.id },
            update: { password: passwordHash }
        });

        const emp1 = await prisma.user.upsert({
            where: { email: "emp@agency1.com" },
            create: { email: "emp@agency1.com", password: passwordHash, role: "AGENCY_EMPLOYEE", agencyId: agency1.id },
            update: { password: passwordHash }
        });

        const emp2 = await prisma.user.upsert({
            where: { email: "emp@agency2.com" },
            create: { email: "emp@agency2.com", password: passwordHash, role: "AGENCY_EMPLOYEE", agencyId: agency2.id },
            update: { password: passwordHash }
        });

        // Delete all leads for a clean slate
        await prisma.lead.deleteMany({});

        return NextResponse.json({
            message: "Setup OK",
            agency1Id: agency1.id,
            agency2Id: agency2.id,
            emp1Id: emp1.id,
            emp2Id: emp2.id
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
