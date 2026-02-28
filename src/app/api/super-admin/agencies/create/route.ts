import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { ROLES } from "@/types/roles";

const createAgencySchema = z.object({
    agencyName: z.string().min(2, "Agency name must be at least 2 characters"),
    agencyEmail: z.string().email("Invalid agency email"),
    subscriptionPlan: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).default("FREE"),
    adminEmail: z.string().email("Invalid admin email"),
    adminPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number"),
});

/**
 * POST /api/super-admin/agencies/create
 * Atomic: Create Agency + Admin + AuditLog or rollback entirely.
 */
export async function POST(req: Request) {
    try {
        const callerRole = req.headers.get("x-user-role");
        const callerId = req.headers.get("x-user-id");

        if (callerRole !== ROLES.SUPER_ADMIN) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const data = createAgencySchema.parse(await req.json());
        const ip = req.headers.get("x-forwarded-for") || "Unknown";
        const userAgent = req.headers.get("user-agent") || "Unknown";

        const [existingAgency, existingAdmin] = await Promise.all([
            prisma.agency.findUnique({ where: { email: data.agencyEmail } }),
            prisma.user.findUnique({ where: { email: data.adminEmail } }),
        ]);

        if (existingAgency) {
            return NextResponse.json({ message: `Agency email '${data.agencyEmail}' already taken.` }, { status: 409 });
        }
        if (existingAdmin) {
            return NextResponse.json({ message: `Admin email '${data.adminEmail}' already taken.` }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

        const result = await prisma.$transaction(async (tx) => {
            const agency = await tx.agency.create({
                data: {
                    name: data.agencyName,
                    email: data.agencyEmail,
                    subscriptionPlan: data.subscriptionPlan,
                    isActive: true,
                },
            });

            const adminUser = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    password: hashedPassword,
                    role: "AGENCY_ADMIN",
                    agencyId: agency.id,
                    isActive: true,
                },
            });

            await tx.auditLog.create({
                data: {
                    agencyId: agency.id,
                    userId: callerId!,
                    action: "AGENCY_CREATED",
                    entityType: "Agency",
                    entityId: agency.id,
                    metadata: { agencyName: agency.name, adminEmail: adminUser.email },
                    ipAddress: ip,
                    userAgent,
                },
            });

            return { agency, adminUser };
        });

        return NextResponse.json(
            {
                message: "Agency and admin created successfully.",
                agency: { id: result.agency.id, name: result.agency.name, email: result.agency.email },
                adminUser: { id: result.adminUser.id, email: result.adminUser.email, role: result.adminUser.role },
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Validation failed", errors: error.issues }, { status: 400 });
        }
        console.error("[SUPER_ADMIN] Agency creation error:", error);
        return NextResponse.json({ message: "Internal server error. Transaction rolled back." }, { status: 500 });
    }
}
