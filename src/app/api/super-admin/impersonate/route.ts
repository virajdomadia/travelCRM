import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { signToken, verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const targetUserId = searchParams.get("userId");

        if (!targetUserId) {
            return NextResponse.json({ message: "Target User ID is required" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const currentToken = cookieStore.get("auth-token")?.value;

        if (!currentToken) {
            return NextResponse.json({ message: "No active session" }, { status: 401 });
        }

        // Verify current user is SUPER_ADMIN
        const currentPayload = await verifyToken(currentToken);
        if (!currentPayload || currentPayload.role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
        }

        // Prevent nested impersonation
        if (currentPayload.originalUserId) {
            return NextResponse.json({ message: "Nested impersonation is not allowed" }, { status: 403 });
        }

        // Fetch target user
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId, deletedAt: null },
            include: { agency: true }
        });

        if (!targetUser) {
            return NextResponse.json({ message: "Target user not found" }, { status: 404 });
        }

        // Safety: Prevent impersonating another SUPER_ADMIN
        if (targetUser.role === "SUPER_ADMIN") {
            return NextResponse.json({ message: "Cannot impersonate another Super Admin" }, { status: 403 });
        }

        // Generate Impersonation Token
        const impersonationPayload = {
            userId: targetUser.id,
            email: targetUser.email,
            role: targetUser.role,
            userIsActive: targetUser.isActive,
            agencyId: targetUser.agencyId || undefined,
            agencyIsActive: targetUser.agency?.isActive ?? true,
            subscriptionEnds: targetUser.agency?.subscriptionEnds?.toISOString() || null,
            originalUserId: currentPayload.userId // Track who is impersonating
        };

        const impersonationToken = await signToken(impersonationPayload);

        // Swap Tokens
        // 1. Save original token in a secure cookie
        const response = NextResponse.redirect(new URL("/dashboard", req.url));

        // Setting cookie for 15 mins (matching impersonation token expiry)
        cookieStore.set("original-auth-token", currentToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 15 // 15 minutes
        });

        // 2. Set impersonation token as primary auth-token
        cookieStore.set("auth-token", impersonationToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 15 // 15 minutes
        });

        // Log impersonation start in Audit Log
        await prisma.auditLog.create({
            data: {
                agencyId: targetUser.agencyId || "SYSTEM",
                userId: currentPayload.userId,
                action: "IMPERSONATION_START",
                entityType: "USER",
                entityId: targetUserId,
                metadata: {
                    impersonatedEmail: targetUser.email,
                    agencyName: targetUser.agency?.name || "N/A"
                }
            }
        });

        return response;
    } catch (error) {
        console.error("Impersonation Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
