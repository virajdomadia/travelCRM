import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { ROLES } from "@/types/roles";

const createAgencySchema = z.object({
    // Agency fields
    agencyName: z.string().min(2, "Agency name must be at least 2 characters"),
    agencyEmail: z.string().email("Invalid agency email"),
    subscriptionPlan: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).default("FREE"),

    // Initial Admin fields
    adminEmail: z.string().email("Invalid admin email"),
    adminPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[0-9]/, "Password must contain a number"),
    adminName: z.string().optional(),
});

/**
 * POST /api/super-admin/agencies
 *
 * Creates an Agency + initial Agency Admin user in a single atomic transaction.
 * Protected: SUPER_ADMIN only (enforced by Edge Middleware x-user-role header).
 *
 * If any step fails (agency create, admin user create, audit log), the
 * entire operation is rolled back — no partial records ever persist.
 */
export async function POST(req: Request) {
    try {
        // Middleware guarantees these headers are injected from a valid JWT
        const callerRole = req.headers.get("x-user-role");
        const callerId = req.headers.get("x-user-id");

        if (callerRole !== ROLES.SUPER_ADMIN) {
            return NextResponse.json(
                { message: "Forbidden: Super Admin access required" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const data = createAgencySchema.parse(body);

        // Check for uniqueness upfront to surface clean errors before the transaction
        const [existingAgency, existingAdmin] = await Promise.all([
            prisma.agency.findUnique({ where: { email: data.agencyEmail } }),
            prisma.user.findUnique({ where: { email: data.adminEmail } }),
        ]);

        if (existingAgency) {
            return NextResponse.json(
                { message: `An agency with email '${data.agencyEmail}' already exists.` },
                { status: 409 }
            );
        }

        if (existingAdmin) {
            return NextResponse.json(
                { message: `A user with email '${data.adminEmail}' already exists.` },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(data.adminPassword, 12);
        const ip = req.headers.get("x-forwarded-for") || "Unknown";
        const userAgent = req.headers.get("user-agent") || "Unknown";

        // ✅ ATOMIC TRANSACTION — all three steps or none
        const result = await prisma.$transaction(async (tx) => {
            // Step 1: Create the Agency
            const agency = await tx.agency.create({
                data: {
                    name: data.agencyName,
                    email: data.agencyEmail,
                    subscriptionPlan: data.subscriptionPlan,
                    isActive: true,
                },
            });

            // Step 2: Create the initial Agency Admin linked to the new agency
            const adminUser = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    password: hashedPassword,
                    role: "AGENCY_ADMIN",
                    agencyId: agency.id,
                    isActive: true,
                },
            });

            // Step 3: Write the AuditLog — critical for multi-tenant security review
            await tx.auditLog.create({
                data: {
                    agencyId: agency.id,
                    userId: callerId!, // The SUPER_ADMIN who performed this action
                    action: "AGENCY_CREATED",
                    entityType: "Agency",
                    entityId: agency.id,
                    metadata: {
                        agencyName: agency.name,
                        agencyEmail: agency.email,
                        adminEmail: adminUser.email,
                        createdBy: callerId,
                    },
                    ipAddress: ip,
                    userAgent: userAgent,
                },
            });

            return { agency, adminUser };
        });

        return NextResponse.json(
            {
                message: "Agency and admin user created successfully.",
                agency: {
                    id: result.agency.id,
                    name: result.agency.name,
                    email: result.agency.email,
                    subscriptionPlan: result.agency.subscriptionPlan,
                },
                adminUser: {
                    id: result.adminUser.id,
                    email: result.adminUser.email,
                    role: result.adminUser.role,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Validation failed", errors: error.issues },
                { status: 400 }
            );
        }

        console.error("[SUPER_ADMIN] Agency creation error:", error);
        return NextResponse.json(
            { message: "Internal server error. The transaction was rolled back." },
            { status: 500 }
        );
    }
}
