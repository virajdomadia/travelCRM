import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const role = req.headers.get("x-user-role");
        if (role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const [
            totalAgencies,
            activeAgencies,
            platformLeads,
            platformBookings,
            platformRevenue
        ] = await Promise.all([
            prisma.agency.count({ where: { deletedAt: null } }),
            prisma.agency.count({ where: { isActive: true, deletedAt: null } }),
            prisma.lead.count({ where: { deletedAt: null } }),
            prisma.booking.count({ where: { deletedAt: null } }),
            prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED'
                },
                _sum: {
                    paymentAmount: true
                }
            })
        ]);

        return NextResponse.json({
            totalAgencies,
            activeAgencies,
            platformLeads,
            platformBookings,
            platformRevenue: platformRevenue._sum.paymentAmount || 0
        });
    } catch (error) {
        console.error("Super Admin Dashboard Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
