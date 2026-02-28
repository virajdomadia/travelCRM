import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createLeadSchema } from "@/lib/validations/lead";

const getLeadsQuerySchema = z.object({
    page: z.preprocess((val) => Number(val), z.number().int().min(1).default(1)),
    limit: z.preprocess((val) => Number(val), z.number().int().min(1).max(100).default(20)),
    status: z.string().optional(),
    source: z.string().optional(),
    assignedToId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        const userId = req.headers.get("x-user-id");
        const role = req.headers.get("x-user-role");

        if (!agencyId || !userId || !role) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const queryResult = getLeadsQuerySchema.safeParse({
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
            status: searchParams.get("status") || undefined,
            source: searchParams.get("source") || undefined,
            assignedToId: searchParams.get("assignedToId") || undefined,
        });

        if (!queryResult.success) {
            return NextResponse.json({ message: "Invalid query parameters", errors: queryResult.error.issues }, { status: 400 });
        }

        const { page, limit, status, source, assignedToId } = queryResult.data;

        // Base where clause strictly bound to the agency
        const where: any = {
            agencyId,
            deletedAt: null,
            ...(status && { status }),
            ...(source && { source }),
            ...(assignedToId && { assignedToId }),
        };

        // Role-based restrictions: Employees can only see their assigned leads or leads they created (optional, settling on assigned only for now based on req)
        if (role === "AGENCY_EMPLOYEE") {
            where.assignedToId = userId;
        }

        const skip = (page - 1) * limit;

        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    assignedTo: { select: { id: true, email: true } },
                    createdBy: { select: { id: true, email: true } },
                }
            }),
            prisma.lead.count({ where })
        ]);

        return NextResponse.json({
            leads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });
    } catch (error) {
        console.error("GET Leads Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        const userId = req.headers.get("x-user-id");

        if (!agencyId || !userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const data = createLeadSchema.parse(body);

        // Validation: If assignedToId is provided, ensure it's a valid employee of the agency
        if (data.assignedToId) {
            const employee = await prisma.user.findFirst({
                where: {
                    id: data.assignedToId,
                    agencyId,
                    isActive: true,
                    deletedAt: null,
                }
            });

            if (!employee) {
                return NextResponse.json({ message: "Assigned user is invalid or does not belong to your agency." }, { status: 400 });
            }
        }

        const newLead = await prisma.$transaction(async (tx) => {
            const lead = await tx.lead.create({
                data: {
                    agencyId,
                    createdById: userId,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    source: data.source,
                    assignedToId: data.assignedToId,
                    followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
                    status: "NEW", // Default status as per requirement
                },
            });

            await tx.auditLog.create({
                data: {
                    agencyId,
                    userId,
                    action: "LEAD_CREATED",
                    entityType: "Lead",
                    entityId: lead.id,
                    metadata: { leadName: lead.name, source: lead.source },
                }
            });

            return lead;
        });

        return NextResponse.json(
            { message: "Lead created successfully", lead: newLead },
            { status: 201 }
        );

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input data", errors: error.issues }, { status: 400 });
        }
        console.error("POST Lead Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
