import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

interface CreateAgencyWithAdminParams {
    agencyName: string;
    agencyEmail: string;
    subscriptionPlan: string;
    adminEmail: string;
    adminPassword: string;
    callerSuperAdminId: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Atomically creates an Agency + Agency Admin user + AuditLog entry.
 * 
 * This is a pure server-layer transaction — no HTTP concerns here.
 * Call this from any API route or server action that needs agency provisioning.
 * 
 * @throws If any step fails — the entire transaction is rolled back.
 */
export async function createAgencyWithAdmin(params: CreateAgencyWithAdminParams) {
    const {
        agencyName,
        agencyEmail,
        subscriptionPlan,
        adminEmail,
        adminPassword,
        callerSuperAdminId,
        ipAddress = "Unknown",
        userAgent = "Unknown",
    } = params;

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    return prisma.$transaction(async (tx) => {
        // Step 1: Create Agency
        const agency = await tx.agency.create({
            data: {
                name: agencyName,
                email: agencyEmail,
                subscriptionPlan,
                isActive: true,
            },
        });

        // Step 2: Create AGENCY_ADMIN User
        const adminUser = await tx.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                role: "AGENCY_ADMIN",
                agencyId: agency.id,
                isActive: true,
            },
        });

        // Step 3: Write immutable AuditLog
        await tx.auditLog.create({
            data: {
                agencyId: agency.id,
                userId: callerSuperAdminId,
                action: "AGENCY_CREATED",
                entityType: "Agency",
                entityId: agency.id,
                metadata: {
                    agencyName: agency.name,
                    agencyEmail: agency.email,
                    adminEmail: adminUser.email,
                    createdBy: callerSuperAdminId,
                },
                ipAddress,
                userAgent,
            },
        });

        return { agency, adminUser };
    });
}
