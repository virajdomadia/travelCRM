import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ROLES } from "@/types/roles";

const updateSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    subscriptionPlan: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
    subscriptionEnds: z.string().datetime().nullable().optional(),
    planLimitUsers: z.number().int().positive().optional(),
    planLimitLeads: z.number().int().positive().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

function superAdminOnly(req: Request) {
    return req.headers.get("x-user-role") !== ROLES.SUPER_ADMIN;
}

/**
 * GET /api/super-admin/agencies/[id]
 */
export async function GET(req: Request, { params }: RouteContext) {
    if (superAdminOnly(req)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const agency = await prisma.agency.findUnique({
        where: { id },
        include: {
            _count: { select: { users: true, leads: true } },
            users: {
                where: { role: "AGENCY_ADMIN" },
                select: { id: true, email: true, isActive: true, lastLoginAt: true },
            },
        },
    });
    if (!agency) return NextResponse.json({ message: "Agency not found" }, { status: 404 });
    return NextResponse.json({ agency });
}

/**
 * PATCH /api/super-admin/agencies/[id]
 * Edit agency details.
 */
export async function PATCH(req: Request, { params }: RouteContext) {
    if (superAdminOnly(req)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const callerId = req.headers.get("x-user-id")!;

    try {
        const data = updateSchema.parse(await req.json());

        const agency = await prisma.$transaction(async (tx) => {
            const updated = await tx.agency.update({
                where: { id },
                data: {
                    ...data,
                    subscriptionEnds: data.subscriptionEnds ? new Date(data.subscriptionEnds) : undefined,
                },
            });
            await tx.auditLog.create({
                data: {
                    agencyId: id,
                    userId: callerId,
                    action: "AGENCY_UPDATED",
                    entityType: "Agency",
                    entityId: id,
                    metadata: JSON.parse(JSON.stringify(data)),
                    ipAddress: req.headers.get("x-forwarded-for") || "Unknown",
                    userAgent: req.headers.get("user-agent") || "Unknown",
                },
            });
            return updated;
        });

        return NextResponse.json({ message: "Agency updated.", agency });
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ message: "Validation failed", errors: error.issues }, { status: 400 });
        return NextResponse.json({ message: "Update failed." }, { status: 500 });
    }
}

/**
 * DELETE /api/super-admin/agencies/[id]
 * Soft-delete an agency.
 */
export async function DELETE(req: Request, { params }: RouteContext) {
    if (superAdminOnly(req)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const callerId = req.headers.get("x-user-id")!;

    await prisma.$transaction(async (tx) => {
        await tx.agency.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
        await tx.auditLog.create({
            data: {
                agencyId: id,
                userId: callerId,
                action: "AGENCY_DELETED",
                entityType: "Agency",
                entityId: id,
                ipAddress: req.headers.get("x-forwarded-for") || "Unknown",
                userAgent: req.headers.get("user-agent") || "Unknown",
            },
        });
    });

    return NextResponse.json({ message: "Agency soft-deleted." });
}
