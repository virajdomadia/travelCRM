import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { addLeadNoteSchema } from "@/lib/validations/lead";

export async function POST(
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
        const { content } = addLeadNoteSchema.parse(body);

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

        const note = await prisma.leadNote.create({
            data: {
                leadId,
                agencyId,
                createdById: userId,
                content,
            },
            include: {
                createdBy: { select: { id: true, email: true } }
            }
        });

        // Also update the lead's updatedAt timestamp
        await prisma.lead.update({
            where: { id: leadId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json(
            { message: "Note added successfully", note },
            { status: 201 }
        );

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input data", errors: error.issues }, { status: 400 });
        }
        console.error("POST Lead Note Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
