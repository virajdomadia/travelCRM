import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { assignLeadSchema } from "@/lib/validations/lead";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        const userId = req.headers.get("x-user-id");
        const role = req.headers.get("x-user-role");
        const { id: leadId } = await params;

        // Only AGENCY_ADMIN can typically reassign leads, but we'll allow an EMPLOYEE
        // to assign if they are currently assigned or if it's currently unassigned. 
        // For simplicity and alignment with standard CRM, let's restrict reassignment 
        // strictly to AGENCY_ADMIN or the currently assigned employee.

        if (!agencyId || !userId || !role) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { assignedToId } = assignLeadSchema.parse(body);

        const where: any = {
            id: leadId,
            agencyId,
            deletedAt: null,
        };

        if (role === "AGENCY_EMPLOYEE") {
            where.assignedToId = userId; // Can only re-assign if already assigned to them
        }

        const existingLead = await prisma.lead.findFirst({ where });

        if (!existingLead) {
            return NextResponse.json({ message: "Lead not found or unauthorized to assign" }, { status: 404 });
        }

        if (existingLead.assignedToId === assignedToId) {
            return NextResponse.json({ message: "Lead is already assigned to this user" }, { status: 200 });
        }

        // If assigning to a new user, validate they belong to the agency
        if (assignedToId) {
            const employee = await prisma.user.findFirst({
                where: {
                    id: assignedToId,
                    agencyId,
                    isActive: true,
                    deletedAt: null,
                }
            });

            if (!employee) {
                return NextResponse.json({ message: "Target user is invalid or does not belong to your agency." }, { status: 400 });
            }
        }

        const updatedLead = await prisma.$transaction(async (tx) => {
            const lead = await tx.lead.update({
                where: { id: leadId },
                data: { assignedToId },
            });

            await tx.auditLog.create({
                data: {
                    agencyId,
                    userId, // user performing action
                    action: "LEAD_ASSIGNED",
                    entityType: "Lead",
                    entityId: lead.id,
                    metadata: { oldAssignedToId: existingLead.assignedToId, newAssignedToId: assignedToId },
                }
            });

            return lead;
        });

        return NextResponse.json(
            { message: "Lead assignment updated", lead: updatedLead },
            { status: 200 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input data", errors: error.issues }, { status: 400 });
        }
        console.error("PATCH Lead Assign Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
