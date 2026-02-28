import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { updateLeadStatusSchema } from "@/lib/validations/lead";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        const userId = req.headers.get("x-user-id");
        const role = req.headers.get("x-user-role");
        const { id: leadId } = await params;

        if (!agencyId || !userId || !role) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { status } = updateLeadStatusSchema.parse(body);

        const where: any = {
            id: leadId,
            agencyId,
            deletedAt: null,
        };

        if (role === "AGENCY_EMPLOYEE") {
            where.assignedToId = userId;
        }

        const existingLead = await prisma.lead.findFirst({ where });

        if (!existingLead) {
            return NextResponse.json({ message: "Lead not found or unauthorized to change status" }, { status: 404 });
        }

        if (existingLead.status === status) {
            return NextResponse.json({ message: "Status is already the same" }, { status: 200 });
        }

        const updatedLead = await prisma.$transaction(async (tx) => {
            const lead = await tx.lead.update({
                where: { id: leadId },
                data: { status },
            });

            await tx.auditLog.create({
                data: {
                    agencyId,
                    userId,
                    action: "LEAD_STATUS_CHANGED",
                    entityType: "Lead",
                    entityId: lead.id,
                    metadata: { oldStatus: existingLead.status, newStatus: status },
                }
            });

            return lead;
        });

        return NextResponse.json(
            { message: "Lead status updated", lead: updatedLead },
            { status: 200 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input data", errors: error.issues }, { status: 400 });
        }
        console.error("PATCH Lead Status Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
