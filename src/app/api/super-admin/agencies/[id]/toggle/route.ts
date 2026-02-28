import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ROLES } from "@/types/roles";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/super-admin/agencies/[id]/toggle
 * Activate or Deactivate an agency. Audited.
 */
export async function POST(req: Request, { params }: RouteContext) {
    if (req.headers.get("x-user-role") !== ROLES.SUPER_ADMIN) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const callerId = req.headers.get("x-user-id")!;

    const agency = await prisma.agency.findUnique({ where: { id } });
    if (!agency) return NextResponse.json({ message: "Agency not found" }, { status: 404 });

    const newStatus = !agency.isActive;

    await prisma.$transaction(async (tx) => {
        await tx.agency.update({ where: { id }, data: { isActive: newStatus } });
        await tx.auditLog.create({
            data: {
                agencyId: id,
                userId: callerId,
                action: newStatus ? "AGENCY_ACTIVATED" : "AGENCY_DEACTIVATED",
                entityType: "Agency",
                entityId: id,
                metadata: { previousStatus: agency.isActive, newStatus },
                ipAddress: req.headers.get("x-forwarded-for") || "Unknown",
                userAgent: req.headers.get("user-agent") || "Unknown",
            },
        });
    });

    return NextResponse.json({
        message: `Agency ${newStatus ? "activated" : "deactivated"} successfully.`,
        isActive: newStatus,
    });
}
