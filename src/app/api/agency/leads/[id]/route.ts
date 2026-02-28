import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { updateLeadSchema } from "@/lib/validations/lead";

export async function GET(
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

        const where: any = {
            id: leadId,
            agencyId,
            deletedAt: null,
        };

        if (role === "AGENCY_EMPLOYEE") {
            where.assignedToId = userId;
        }

        const lead = await prisma.lead.findFirst({
            where,
            include: {
                assignedTo: { select: { id: true, email: true } },
                createdBy: { select: { id: true, email: true } },
                notes: {
                    where: { deletedAt: null },
                    include: { createdBy: { select: { id: true, email: true } } },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!lead) {
            return NextResponse.json({ message: "Lead not found or unauthorized" }, { status: 404 });
        }

        const auditLogs = await prisma.auditLog.findMany({
            where: { entityId: lead.id, entityType: "Lead" },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({
            ...lead,
            auditLogs
        });
    } catch (error) {
        console.error("GET Lead Detail Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
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
        const data = updateLeadSchema.parse(body);

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
            return NextResponse.json({ message: "Lead not found or unauthorized" }, { status: 404 });
        }

        const updatedLead = await prisma.$transaction(async (tx) => {
            const lead = await tx.lead.update({
                where: { id: leadId },
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    source: data.source,
                    followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
                },
            });

            await tx.auditLog.create({
                data: {
                    agencyId,
                    userId,
                    action: "LEAD_UPDATED",
                    entityType: "Lead",
                    entityId: lead.id,
                    metadata: { changes: data },
                }
            });

            return lead;
        });

        return NextResponse.json(
            { message: "Lead updated", lead: updatedLead },
            { status: 200 }
        );

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input data", errors: error.issues }, { status: 400 });
        }
        console.error("PUT Lead Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
