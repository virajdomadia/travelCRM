import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const impersonationToken = cookieStore.get("auth-token")?.value;
        const originalToken = cookieStore.get("original-auth-token")?.value;

        if (!originalToken) {
            return NextResponse.json({ message: "No original session found" }, { status: 400 });
        }

        // Optional: Log exit
        if (impersonationToken) {
            const payload = await verifyToken(impersonationToken);
            if (payload && payload.originalUserId) {
                await prisma.auditLog.create({
                    data: {
                        agencyId: payload.agencyId || "SYSTEM",
                        userId: payload.originalUserId,
                        action: "IMPERSONATION_END",
                        entityType: "USER",
                        entityId: payload.userId,
                    }
                });
            }
        }

        // Restore token
        cookieStore.set("auth-token", originalToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 8 // Back to normal session length (assuming 8h)
        });

        cookieStore.delete("original-auth-token");

        return NextResponse.redirect(new URL("/super-admin/agencies", req.url));
    } catch (error) {
        console.error("Exit Impersonation Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
