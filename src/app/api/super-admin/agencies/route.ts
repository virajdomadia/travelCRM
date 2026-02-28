import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ROLES } from "@/types/roles";

/**
 * GET /api/super-admin/agencies
 * Lists all agencies with user counts and pagination.
 */
export async function GET(req: Request) {
    const callerRole = req.headers.get("x-user-role");
    const callerId = req.headers.get("x-user-id");
    if (callerRole !== ROLES.SUPER_ADMIN) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // "active" | "inactive" | undefined

    const where = {
        deletedAt: null,
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
            ],
        }),
        ...(status === "active" && { isActive: true }),
        ...(status === "inactive" && { isActive: false }),
    };

    const [agencies, total] = await Promise.all([
        prisma.agency.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                subscriptionPlan: true,
                subscriptionEnds: true,
                planLimitUsers: true,
                planLimitLeads: true,
                createdAt: true,
                _count: { select: { users: true, leads: true } },
            },
        }),
        prisma.agency.count({ where }),
    ]);

    return NextResponse.json({
        agencies,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}
